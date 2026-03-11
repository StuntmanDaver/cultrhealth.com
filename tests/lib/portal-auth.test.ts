import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'

// We need to control cookies() mock per test, so we import it
import { cookies } from 'next/headers'

// Mock @vercel/postgres since portal-db imports it and portal-auth may transitively load it
vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
}))

import {
  createPortalAccessToken,
  createPortalRefreshToken,
  verifyPortalAccessToken,
  verifyPortalRefreshToken,
  setPortalCookies,
  clearPortalCookies,
  getPortalSession,
  verifyPortalAuth,
  PORTAL_ACCESS_COOKIE,
  PORTAL_REFRESH_COOKIE,
  type PortalSession,
} from '@/lib/portal-auth'

describe('Portal Auth', () => {
  const testPhone = '+15551234567'
  const testPatientId = 42

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cookie name constants', () => {
    it('uses separate cookie names from existing auth (AUTH-06)', () => {
      expect(PORTAL_ACCESS_COOKIE).toBe('cultr_portal_access')
      expect(PORTAL_REFRESH_COOKIE).toBe('cultr_portal_refresh')
      // Must NOT be 'cultr_session'
      expect(PORTAL_ACCESS_COOKIE).not.toBe('cultr_session')
      expect(PORTAL_REFRESH_COOKIE).not.toBe('cultr_session')
    })
  })

  describe('createPortalAccessToken + verifyPortalAccessToken', () => {
    it('round-trips a valid access token', async () => {
      const token = await createPortalAccessToken(testPhone, testPatientId)
      expect(typeof token).toBe('string')

      const session = await verifyPortalAccessToken(token)
      expect(session).not.toBeNull()
      expect(session!.phone).toBe(testPhone)
      expect(session!.asherPatientId).toBe(testPatientId)
    })

    it('round-trips with null patientId', async () => {
      const token = await createPortalAccessToken(testPhone, null)
      const session = await verifyPortalAccessToken(token)
      expect(session).not.toBeNull()
      expect(session!.phone).toBe(testPhone)
      expect(session!.asherPatientId).toBeNull()
    })

    it('returns null for an invalid token', async () => {
      const session = await verifyPortalAccessToken('garbage.token.here')
      expect(session).toBeNull()
    })
  })

  describe('createPortalRefreshToken + verifyPortalRefreshToken', () => {
    it('round-trips a valid refresh token', async () => {
      const token = await createPortalRefreshToken(testPhone, testPatientId)
      expect(typeof token).toBe('string')

      const session = await verifyPortalRefreshToken(token)
      expect(session).not.toBeNull()
      expect(session!.phone).toBe(testPhone)
      expect(session!.asherPatientId).toBe(testPatientId)
    })

    it('round-trips with null patientId', async () => {
      const token = await createPortalRefreshToken(testPhone, null)
      const session = await verifyPortalRefreshToken(token)
      expect(session).not.toBeNull()
      expect(session!.asherPatientId).toBeNull()
    })

    it('returns null for an invalid token', async () => {
      const session = await verifyPortalRefreshToken('garbage.token.here')
      expect(session).toBeNull()
    })
  })

  describe('Token type rejection (cross-use prevention)', () => {
    it('rejects a refresh token when verified as access token', async () => {
      const refreshToken = await createPortalRefreshToken(testPhone, testPatientId)
      const session = await verifyPortalAccessToken(refreshToken)
      expect(session).toBeNull()
    })

    it('rejects an access token when verified as refresh token', async () => {
      const accessToken = await createPortalAccessToken(testPhone, testPatientId)
      const session = await verifyPortalRefreshToken(accessToken)
      expect(session).toBeNull()
    })
  })

  describe('Token expiry', () => {
    it('access token becomes invalid after expiry', async () => {
      // Create a token that expires immediately using jose directly
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'test-session-secret')
      const token = await new SignJWT({
        phone: testPhone,
        asherPatientId: testPatientId,
        type: 'portal_access',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('0s') // already expired
        .sign(secret)

      const session = await verifyPortalAccessToken(token)
      expect(session).toBeNull()
    })
  })

  describe('setPortalCookies', () => {
    it('sets access and refresh cookies with correct attributes', async () => {
      const mockSet = vi.fn()
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(),
        set: mockSet,
        delete: vi.fn(),
      } as any)

      await setPortalCookies('access-token-value', 'refresh-token-value')

      expect(mockSet).toHaveBeenCalledTimes(2)

      // Access cookie
      const accessCall = mockSet.mock.calls.find(
        (call: any[]) => call[0] === PORTAL_ACCESS_COOKIE
      )
      expect(accessCall).toBeDefined()
      expect(accessCall![1]).toBe('access-token-value')
      expect(accessCall![2]).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 900, // 15 minutes
        path: '/',
      })

      // Refresh cookie
      const refreshCall = mockSet.mock.calls.find(
        (call: any[]) => call[0] === PORTAL_REFRESH_COOKIE
      )
      expect(refreshCall).toBeDefined()
      expect(refreshCall![1]).toBe('refresh-token-value')
      expect(refreshCall![2]).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 604800, // 7 days
        path: '/api/portal/refresh',
      })
    })
  })

  describe('clearPortalCookies', () => {
    it('deletes both portal cookies', async () => {
      const mockDelete = vi.fn()
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        delete: mockDelete,
      } as any)

      await clearPortalCookies()

      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockDelete).toHaveBeenCalledWith(PORTAL_ACCESS_COOKIE)
      expect(mockDelete).toHaveBeenCalledWith(PORTAL_REFRESH_COOKIE)
    })
  })

  describe('getPortalSession', () => {
    it('returns null when no access cookie is present', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        delete: vi.fn(),
      } as any)

      const session = await getPortalSession()
      expect(session).toBeNull()
    })

    it('returns PortalSession when access cookie is valid', async () => {
      const token = await createPortalAccessToken(testPhone, testPatientId)

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === PORTAL_ACCESS_COOKIE) {
            return { value: token }
          }
          return undefined
        }),
        set: vi.fn(),
        delete: vi.fn(),
      } as any)

      const session = await getPortalSession()
      expect(session).not.toBeNull()
      expect(session!.phone).toBe(testPhone)
      expect(session!.asherPatientId).toBe(testPatientId)
    })

    it('returns null when access cookie has an invalid token', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === PORTAL_ACCESS_COOKIE) {
            return { value: 'invalid-token' }
          }
          return undefined
        }),
        set: vi.fn(),
        delete: vi.fn(),
      } as any)

      const session = await getPortalSession()
      expect(session).toBeNull()
    })
  })

  describe('verifyPortalAuth', () => {
    it('returns authenticated=true with valid portal access cookie in request', async () => {
      const token = await createPortalAccessToken(testPhone, testPatientId)

      const mockRequest = {
        cookies: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === PORTAL_ACCESS_COOKIE) {
              return { value: token }
            }
            return undefined
          }),
        },
      } as any

      const result = await verifyPortalAuth(mockRequest)
      expect(result.authenticated).toBe(true)
      expect(result.phone).toBe(testPhone)
      expect(result.asherPatientId).toBe(testPatientId)
    })

    it('returns authenticated=false when portal access cookie is missing', async () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any

      const result = await verifyPortalAuth(mockRequest)
      expect(result.authenticated).toBe(false)
      expect(result.phone).toBeNull()
      expect(result.asherPatientId).toBeNull()
    })

    it('returns authenticated=false when portal access cookie has expired token', async () => {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'test-session-secret')
      const expiredToken = await new SignJWT({
        phone: testPhone,
        asherPatientId: testPatientId,
        type: 'portal_access',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('0s')
        .sign(secret)

      const mockRequest = {
        cookies: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === PORTAL_ACCESS_COOKIE) {
              return { value: expiredToken }
            }
            return undefined
          }),
        },
      } as any

      const result = await verifyPortalAuth(mockRequest)
      expect(result.authenticated).toBe(false)
      expect(result.phone).toBeNull()
      expect(result.asherPatientId).toBeNull()
    })

    it('returns authenticated=false when token is a refresh token (wrong type)', async () => {
      const refreshToken = await createPortalRefreshToken(testPhone, testPatientId)

      const mockRequest = {
        cookies: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === PORTAL_ACCESS_COOKIE) {
              return { value: refreshToken }
            }
            return undefined
          }),
        },
      } as any

      const result = await verifyPortalAuth(mockRequest)
      expect(result.authenticated).toBe(false)
      expect(result.phone).toBeNull()
      expect(result.asherPatientId).toBeNull()
    })
  })
})
