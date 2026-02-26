import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { PLANS, type LibraryAccess, type PlanTier } from '@/lib/config/plans'
import { getMembershipByCustomerId } from '@/lib/db'

const SESSION_COOKIE_NAME = 'cultr_session'
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cultr-magic-link-secret-change-in-production'
)
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'cultr-session-secret-change-in-production'
)

// Magic link token (short-lived, 15 minutes)
export async function createMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'magic_link' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(MAGIC_LINK_SECRET)
}

export async function verifyMagicLinkToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET)
    if (payload.type !== 'magic_link' || typeof payload.email !== 'string') {
      return null
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

// Session token (long-lived, 7 days)
export async function createSessionToken(
  email: string,
  customerId: string,
  creatorId?: string,
  role?: 'member' | 'creator' | 'admin'
): Promise<string> {
  return new SignJWT({
    email,
    customerId,
    creatorId: creatorId || undefined,
    role: role || 'member',
    type: 'session',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET)
}

export interface SessionPayload {
  email: string
  customerId: string
  creatorId?: string
  role?: 'member' | 'creator' | 'admin'
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    if (
      payload.type !== 'session' ||
      typeof payload.email !== 'string' ||
      typeof payload.customerId !== 'string'
    ) {
      return null
    }
    return {
      email: payload.email,
      customerId: payload.customerId,
      creatorId: typeof payload.creatorId === 'string' ? payload.creatorId : undefined,
      role: (payload.role as SessionPayload['role']) || 'member',
    }
  } catch {
    return null
  }
}

// Cookie-based session management
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  // Development mode: auto-grant access for testing
  if (process.env.NODE_ENV === 'development') {
    return { email: 'member@cultrhealth.com', customerId: 'dev_customer', role: 'admin' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Rate limiting for magic link requests (simple in-memory, use Redis in production)
const magicLinkRequests = new Map<string, number>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 60 seconds

export function checkRateLimit(email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  const lastRequest = magicLinkRequests.get(normalizedEmail)
  const now = Date.now()
  
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    return false // Rate limited
  }
  
  magicLinkRequests.set(normalizedEmail, now)
  
  // Cleanup old entries periodically
  if (magicLinkRequests.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW
    Array.from(magicLinkRequests.entries()).forEach(([key, time]) => {
      if (time < cutoff) {
        magicLinkRequests.delete(key)
      }
    })
  }
  
  return true
}

const TEAM_EMAILS = [
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'stewart@cultrhealth.com',
  'erik@cultrhealth.com',
  'david@cultrhealth.com',
]

function isStaging(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return siteUrl.includes('staging')
}

const PLAN_ALIASES: Record<string, PlanTier> = {
  starter: 'core',
  core: 'core',
  creator: 'catalyst',
  cognition: 'catalyst',
  catalyst: 'catalyst',
  confidante: 'concierge',
  concierge: 'concierge',
  club: 'club',
}

function normalizePlanTier(tier: string | null | undefined): PlanTier | null {
  if (!tier) return null
  const normalized = tier.toLowerCase().trim()
  return PLAN_ALIASES[normalized] || null
}

export async function getMembershipTier(customerId: string, email?: string): Promise<PlanTier | null> {
  if (!customerId) return null

  // Development/staging mode: return full access tier
  if (process.env.NODE_ENV === 'development' || customerId === 'dev_customer' || customerId === 'staging_customer') {
    return 'concierge' // Full access in dev/staging mode
  }

  // Team emails and staging always get full access
  if (email) {
    const lower = email.toLowerCase()
    if (TEAM_EMAILS.includes(lower)) return 'concierge'
    if (isStaging()) return 'concierge'
    if (process.env.STAGING_ACCESS_EMAILS) {
      const stagingEmails = process.env.STAGING_ACCESS_EMAILS.split(',').map(e => e.trim().toLowerCase())
      if (stagingEmails.includes(lower)) return 'concierge'
    }
  }

  if (process.env.POSTGRES_URL) {
    try {
      const membership = await getMembershipByCustomerId(customerId)
      const fromDb = normalizePlanTier(membership?.plan_tier)
      if (fromDb) return fromDb
    } catch {
      // DB unavailable — fall through to Stripe or return null
    }
  }

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
      })

      const activeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })

      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 1,
      })

      const subscription = activeSubscriptions.data[0] || trialingSubscriptions.data[0]
      if (!subscription) return null

      const metadataTier = normalizePlanTier(subscription.metadata?.plan_tier)
      if (metadataTier) return metadataTier

      const priceId = subscription.items.data[0]?.price?.id
      const plan = PLANS.find((candidate) => candidate.stripePriceId === priceId)
      return normalizePlanTier(plan?.slug)
    } catch {
      // Stripe unavailable or invalid customer — fall through to return null
    }
  }

  return null
}

export function getLibraryAccess(tier: PlanTier | null | undefined): LibraryAccess {
  const normalizedTier = normalizePlanTier(tier ?? undefined) || 'club'
  const plan = PLANS.find((candidate) => candidate.slug === normalizedTier)
  if (plan?.libraryAccess) {
    return plan.libraryAccess as LibraryAccess
  }
  return {
    masterIndex: 'titles_only',
    advancedProtocols: false,
    dosingCalculators: false,
    stackingGuides: false,
    providerNotes: false,
    customRequests: false,
  } as LibraryAccess
}

export function hasFeatureAccess(tier: PlanTier | null | undefined, feature: keyof LibraryAccess): boolean {
  const access = getLibraryAccess(tier)
  if (feature === 'masterIndex') {
    return access.masterIndex === 'full'
  }
  return Boolean(access[feature])
}

export function isProviderEmail(email: string): boolean {
  const lower = email.toLowerCase()
  if (TEAM_EMAILS.includes(lower)) return true
  if (isStaging()) return true
  const allowlist = process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const normalized = allowlist.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)
  if (normalized.includes(lower)) return true
  // Staging access emails also get provider/admin access
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS || ''
  const stagingNormalized = stagingEmails.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)
  return stagingNormalized.includes(lower)
}

// ===========================================
// API ROUTE AUTHENTICATION
// ===========================================

import type { NextRequest } from 'next/server'

interface AuthResult {
  authenticated: boolean
  email: string | null
  customerId: string | null
  creatorId?: string | null
  role?: string | null
}

/**
 * Verify authentication for API routes
 * Reads session from cookie or Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  // Development mode: auto-grant access for testing
  if (process.env.NODE_ENV === 'development') {
    return {
      authenticated: true,
      email: 'member@cultrhealth.com',
      customerId: 'dev_customer',
      creatorId: 'dev_creator',
      role: 'admin',
    }
  }

  // Try to get session from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie)
    if (session) {
      return {
        authenticated: true,
        email: session.email,
        customerId: session.customerId,
        creatorId: session.creatorId || null,
        role: session.role || 'member',
      }
    }
  }

  // Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const session = await verifySessionToken(token)
    if (session) {
      return {
        authenticated: true,
        email: session.email,
        customerId: session.customerId,
        creatorId: session.creatorId || null,
        role: session.role || 'member',
      }
    }
  }

  return {
    authenticated: false,
    email: null,
    customerId: null,
    creatorId: null,
    role: null,
  }
}

/**
 * Verify creator authentication for creator portal API routes.
 * Returns creator ID from session or from DB lookup by email.
 */
export async function verifyCreatorAuth(request: NextRequest): Promise<{
  authenticated: boolean
  email: string | null
  creatorId: string | null
}> {
  const auth = await verifyAuth(request)
  if (!auth.authenticated || !auth.email) {
    return { authenticated: false, email: null, creatorId: null }
  }

  // If creatorId is in the token, use it
  if (auth.creatorId) {
    return { authenticated: true, email: auth.email, creatorId: auth.creatorId }
  }

  // Otherwise look up creator by email
  try {
    const { getCreatorByEmail } = await import('@/lib/creators/db')
    const creator = await getCreatorByEmail(auth.email)
    if (creator && creator.status === 'active') {
      return { authenticated: true, email: auth.email, creatorId: creator.id }
    }
  } catch {
    // DB unavailable — continue to staging fallback
  }

  // Team emails always get creator access
  if (TEAM_EMAILS.includes(auth.email.toLowerCase())) {
    return { authenticated: true, email: auth.email, creatorId: 'staging_creator' }
  }

  // Staging bypass: allow any email on staging domain, or check whitelist
  if (isStaging()) {
    return { authenticated: true, email: auth.email, creatorId: 'staging_creator' }
  }

  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (stagingEmails) {
    const allowedEmails = stagingEmails.split(',').map(e => e.trim().toLowerCase())
    if (allowedEmails.includes(auth.email.toLowerCase())) {
      return { authenticated: true, email: auth.email, creatorId: 'staging_creator' }
    }
  }

  return { authenticated: false, email: auth.email, creatorId: null }
}

/**
 * Verify admin authentication for admin API routes.
 * Checks that the user's email is in the provider allowlist.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  authenticated: boolean
  email: string | null
}> {
  const auth = await verifyAuth(request)
  if (!auth.authenticated || !auth.email) {
    return { authenticated: false, email: null }
  }

  if (!isProviderEmail(auth.email)) {
    return { authenticated: false, email: auth.email }
  }

  return { authenticated: true, email: auth.email }
}
