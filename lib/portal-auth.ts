import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

// ===========================================
// CONSTANTS
// ===========================================

export const PORTAL_ACCESS_COOKIE = 'cultr_portal_access'
export const PORTAL_REFRESH_COOKIE = 'cultr_portal_refresh'

/**
 * Lazily create the signing secret to avoid jsdom/Node Uint8Array mismatch
 * in test environments. Cached after first call.
 */
let _portalSecret: Uint8Array | null = null
function getPortalSecret(): Uint8Array {
  if (!_portalSecret) {
    _portalSecret = new TextEncoder().encode(
      process.env.SESSION_SECRET || 'cultr-session-secret-change-in-production'
    )
  }
  return _portalSecret
}

/** Access token lifetime: 15 minutes */
const ACCESS_TOKEN_EXPIRY = '15m'
const ACCESS_COOKIE_MAX_AGE = 900 // 15 minutes in seconds

/** Refresh token lifetime: 7 days */
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_COOKIE_MAX_AGE = 604800 // 7 days in seconds

// ===========================================
// TYPES
// ===========================================

export interface PortalSession {
  phone: string
  asherPatientId: number | null
}

// ===========================================
// TOKEN CREATION
// ===========================================

/**
 * Create a short-lived access token for portal authentication.
 * Contains phone number and Asher Med patient ID.
 */
export async function createPortalAccessToken(
  phone: string,
  patientId: number | null
): Promise<string> {
  return new SignJWT({
    phone,
    asherPatientId: patientId,
    type: 'portal_access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getPortalSecret())
}

/**
 * Create a long-lived refresh token for portal session renewal.
 * Contains phone number and Asher Med patient ID.
 */
export async function createPortalRefreshToken(
  phone: string,
  patientId: number | null
): Promise<string> {
  return new SignJWT({
    phone,
    asherPatientId: patientId,
    type: 'portal_refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getPortalSecret())
}

// ===========================================
// TOKEN VERIFICATION
// ===========================================

/**
 * Verify a portal access token and return the session data.
 * Returns null if the token is invalid, expired, or not an access token.
 */
export async function verifyPortalAccessToken(
  token: string
): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getPortalSecret())
    if (payload.type !== 'portal_access' || typeof payload.phone !== 'string') {
      return null
    }
    return {
      phone: payload.phone,
      asherPatientId:
        typeof payload.asherPatientId === 'number'
          ? payload.asherPatientId
          : null,
    }
  } catch {
    return null
  }
}

/**
 * Verify a portal refresh token and return the session data.
 * Returns null if the token is invalid, expired, or not a refresh token.
 */
export async function verifyPortalRefreshToken(
  token: string
): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getPortalSecret())
    if (
      payload.type !== 'portal_refresh' ||
      typeof payload.phone !== 'string'
    ) {
      return null
    }
    return {
      phone: payload.phone,
      asherPatientId:
        typeof payload.asherPatientId === 'number'
          ? payload.asherPatientId
          : null,
    }
  } catch {
    return null
  }
}

// ===========================================
// COOKIE MANAGEMENT
// ===========================================

/**
 * Set both portal cookies (access + refresh) after successful authentication.
 * Access cookie is sent on all paths; refresh cookie is scoped to /api/portal/refresh.
 */
export async function setPortalCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'

  cookieStore.set(PORTAL_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: '/',
  })

  cookieStore.set(PORTAL_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/portal/refresh',
  })
}

/**
 * Clear both portal cookies (logout).
 */
export async function clearPortalCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PORTAL_ACCESS_COOKIE)
  cookieStore.delete(PORTAL_REFRESH_COOKIE)
}

/**
 * Read the portal session from the access cookie.
 * Used in server components and server actions.
 * Returns null if no valid access cookie is present.
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(PORTAL_ACCESS_COOKIE)?.value
  if (!token) return null
  return verifyPortalAccessToken(token)
}

// ===========================================
// API ROUTE AUTHENTICATION
// ===========================================

/**
 * Verify portal authentication for API route handlers.
 * Reads the portal access cookie from the request (NextRequest.cookies).
 * Returns authentication status with phone and patient ID.
 */
export async function verifyPortalAuth(
  request: NextRequest
): Promise<{
  authenticated: boolean
  phone: string | null
  asherPatientId: number | null
}> {
  const token = request.cookies.get(PORTAL_ACCESS_COOKIE)?.value
  if (!token) {
    return { authenticated: false, phone: null, asherPatientId: null }
  }

  const session = await verifyPortalAccessToken(token)
  if (!session) {
    return { authenticated: false, phone: null, asherPatientId: null }
  }

  return {
    authenticated: true,
    phone: session.phone,
    asherPatientId: session.asherPatientId,
  }
}
