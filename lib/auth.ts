import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { PLANS, type LibraryAccess, type PlanTier } from '@/lib/config/plans'
import { getMembershipByCustomerId } from '@/lib/db'
import { getCookieDomain } from '@/lib/utils'

const SESSION_COOKIE_NAME = 'cultr_session'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  jwtSecret || 'cultr-magic-link-secret-dev-only'
)

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production')
}
const SESSION_SECRET = new TextEncoder().encode(
  sessionSecret || 'cultr-session-secret-dev-only'
)

const CLUB_VISITOR_SECRET = new TextEncoder().encode(
  sessionSecret || jwtSecret || 'cultr-club-visitor-secret-dev-only'
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

// Session token (24 hours -- reduced from 7d for HIPAA compliance)
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
    .setExpirationTime('24h')
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

export interface ClubVisitorPayload {
  email: string
}

export async function createClubVisitorToken(email: string): Promise<string> {
  return new SignJWT({
    email: email.trim().toLowerCase(),
    type: 'club_visitor',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(CLUB_VISITOR_SECRET)
}

export async function verifyClubVisitorToken(token: string): Promise<ClubVisitorPayload | null> {
  try {
    const { payload } = await jwtVerify(token, CLUB_VISITOR_SECRET)
    if (payload.type !== 'club_visitor' || typeof payload.email !== 'string') {
      return null
    }

    return {
      email: payload.email.trim().toLowerCase(),
    }
  } catch {
    return null
  }
}

// Cookie-based session management
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  const domain = getCookieDomain()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours (HIPAA)
    path: '/',
    ...(domain ? { domain } : {}),
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const domain = getCookieDomain()
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    ...(domain ? { domain } : {}),
  })
}

// Rate limiting for magic link requests (simple in-memory, use Redis in production)
const magicLinkRequests = new Map<string, number>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 60 seconds

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeAuthEmailInput(email: string): string {
  const normalized = normalizeEmail(email)

  if (!normalized.includes('@') && normalized.endsWith('.cultrhealth.com')) {
    const canonicalEmail = normalized.replace(/\.cultrhealth\.com$/, '@cultrhealth.com')
    if (TEAM_EMAILS.includes(canonicalEmail)) {
      return canonicalEmail
    }
  }

  return normalized
}

export function checkRateLimit(email: string): boolean {
  const normalizedEmail = normalizeEmail(email)
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

const OWNER_EMAILS = [
  'erik@cultrhealth.com',
  'alex@cultrhealth.com',
  'stewart@cultrhealth.com',
  'david@cultrhealth.com',
  'tony@cultrhealth.com',
] as const

const TEAM_EMAILS = [
  ...OWNER_EMAILS,
  'legitscript@cultrhealth.com',
]

function isStaging(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return siteUrl.includes('staging')
}

function parseEmailAllowlist(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => normalizeAuthEmailInput(value))
    .filter(Boolean)
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

  // Development mode: return full access tier for local testing
  if (process.env.NODE_ENV === 'development') {
    return 'concierge'
  }

  // Team emails and staging always get full access
  if (email) {
    const lower = normalizeEmail(email)
    if (TEAM_EMAILS.includes(lower)) return 'concierge'
    if (isStaging()) return 'concierge'
    const stagingEmails = parseEmailAllowlist(process.env.STAGING_ACCESS_EMAILS)
    if (stagingEmails.includes(lower)) return 'concierge'
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
        apiVersion: '2026-02-25.clover',
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
    protocolBuilder: false,
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
  const lower = normalizeEmail(email)
  if (TEAM_EMAILS.includes(lower)) return true
  const normalized = parseEmailAllowlist(process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS)
  if (normalized.includes(lower)) return true
  // Staging access emails also get provider/admin access
  const stagingNormalized = parseEmailAllowlist(process.env.STAGING_ACCESS_EMAILS)
  return stagingNormalized.includes(lower)
}

export function isAdminEmail(email: string): boolean {
  const lower = normalizeEmail(email)
  if (isProviderEmail(lower)) return true

  const adminAllowlist = parseEmailAllowlist(process.env.ADMIN_ALLOWED_EMAILS)
  return adminAllowlist.includes(lower)
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

  // If creatorId is in the token and not the staging placeholder, use it
  if (auth.creatorId && auth.creatorId !== 'staging_creator') {
    return { authenticated: true, email: auth.email, creatorId: auth.creatorId }
  }

  // Otherwise look up creator by email. This lets staging_creator placeholder
  // sessions recover to a real creator record after staging auto-create succeeds.
  try {
    const { getCreatorByEmail } = await import('@/lib/creators/db')
    const creator = await getCreatorByEmail(auth.email)
    if (creator && creator.status === 'active') {
      return { authenticated: true, email: auth.email, creatorId: creator.id }
    }
  } catch (dbError) {
    console.error('[auth] Creator DB lookup failed', dbError instanceof Error ? dbError.message : 'Unknown')
  }

  if (auth.creatorId === 'staging_creator') {
    return { authenticated: true, email: auth.email, creatorId: auth.creatorId }
  }

  // Team emails always get creator access (staging_creator is a placeholder —
  // dashboard queries will fail since it's not a valid UUID. The login route
  // should have created a real creator record; this fallback means DB was down.)
  if (TEAM_EMAILS.includes(normalizeEmail(auth.email))) {
    console.warn('[auth] staging_creator fallback used -- dashboard will show no real data')
    return { authenticated: true, email: auth.email, creatorId: 'staging_creator' }
  }

  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (stagingEmails) {
    const allowedEmails = parseEmailAllowlist(stagingEmails)
    if (allowedEmails.includes(normalizeEmail(auth.email))) {
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

  if (!isAdminEmail(auth.email) && auth.role !== 'admin') {
    return { authenticated: false, email: auth.email }
  }

  return { authenticated: true, email: auth.email }
}
