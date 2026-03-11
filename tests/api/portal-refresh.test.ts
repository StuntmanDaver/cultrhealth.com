// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

// Mock next/server
vi.mock('next/server', () => {
  class MockCookieStore {
    private cookies: Map<string, { name: string; value: string; options?: Record<string, unknown> }>

    constructor(initial: Record<string, string> = {}) {
      this.cookies = new Map()
      for (const [name, value] of Object.entries(initial)) {
        this.cookies.set(name, { name, value })
      }
    }

    get(name: string) {
      return this.cookies.get(name) || undefined
    }

    set(name: string, value: string, options?: Record<string, unknown>) {
      this.cookies.set(name, { name, value, options })
    }

    getAll() {
      return Array.from(this.cookies.values())
    }
  }

  class MockNextRequest {
    cookies: MockCookieStore
    method: string
    url: string

    constructor(url: string, init?: { method?: string; cookies?: Record<string, string> }) {
      this.url = url
      this.method = init?.method || 'GET'
      this.cookies = new MockCookieStore(init?.cookies || {})
    }
  }

  class MockNextResponse {
    body: unknown
    status: number
    headers: Map<string, string>
    _cookies: Map<string, { name: string; value: string; options?: Record<string, unknown> }>

    constructor(body: string | null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body ? JSON.parse(body) : null
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
      this._cookies = new Map()
    }

    get cookies() {
      const self = this
      return {
        set(name: string, value: string, options?: Record<string, unknown>) {
          self._cookies.set(name, { name, value, options })
        },
        get(name: string) {
          return self._cookies.get(name)
        },
        getAll() {
          return Array.from(self._cookies.values())
        },
      }
    }

    async json() {
      return this.body
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse }
})

// Mock portal-auth
const mockVerifyPortalRefreshToken = vi.fn()
const mockCreatePortalAccessToken = vi.fn().mockResolvedValue('new-access-token-789')

vi.mock('@/lib/portal-auth', () => ({
  verifyPortalRefreshToken: mockVerifyPortalRefreshToken,
  createPortalAccessToken: mockCreatePortalAccessToken,
  PORTAL_ACCESS_COOKIE: 'cultr_portal_access',
  PORTAL_REFRESH_COOKIE: 'cultr_portal_refresh',
}))

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function makeRefreshRequest(cookies: Record<string, string> = {}) {
  const { NextRequest } = require('next/server')
  return new NextRequest('http://localhost:3000/api/portal/refresh', {
    method: 'POST',
    cookies,
  })
}

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('POST /api/portal/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalRefreshToken.mockResolvedValue({
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockCreatePortalAccessToken.mockResolvedValue('new-access-token-789')
  })

  it('returns 200 and sets new access token cookie when refresh token is valid', async () => {
    const { POST } = await import('@/app/api/portal/refresh/route')
    const request = makeRefreshRequest({ cultr_portal_refresh: 'valid-refresh-token' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Check access cookie was set on the response
    const accessCookie = response.cookies.get('cultr_portal_access')
    expect(accessCookie).toBeTruthy()
    expect(accessCookie.value).toBe('new-access-token-789')
  })

  it('returns 401 when no refresh token cookie is present', async () => {
    const { POST } = await import('@/app/api/portal/refresh/route')
    const request = makeRefreshRequest({}) // no cookies
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('No refresh token')
  })

  it('returns 401 with session expired message when refresh token is invalid', async () => {
    mockVerifyPortalRefreshToken.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/refresh/route')
    const request = makeRefreshRequest({ cultr_portal_refresh: 'expired-token' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Session expired')
  })

  it('creates new access token with same phone and patientId from refresh token', async () => {
    mockVerifyPortalRefreshToken.mockResolvedValue({
      phone: '+15559876543',
      asherPatientId: 99,
    })

    const { POST } = await import('@/app/api/portal/refresh/route')
    const request = makeRefreshRequest({ cultr_portal_refresh: 'valid-refresh-token' })
    await POST(request)

    expect(mockCreatePortalAccessToken).toHaveBeenCalledWith('+15559876543', 99)
  })
})
