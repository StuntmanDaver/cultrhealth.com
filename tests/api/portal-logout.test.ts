// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

// Mock next/server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown
    status: number
    headers: Map<string, string>

    constructor(body: string | null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body ? JSON.parse(body) : null
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return this.body
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }
  }

  return { NextResponse: MockNextResponse }
})

// Mock portal-auth
const mockClearPortalCookies = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/portal-auth', () => ({
  clearPortalCookies: mockClearPortalCookies,
}))

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('POST /api/portal/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClearPortalCookies.mockResolvedValue(undefined)
  })

  it('returns 200 with success true', async () => {
    const { POST } = await import('@/app/api/portal/logout/route')
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('calls clearPortalCookies', async () => {
    const { POST } = await import('@/app/api/portal/logout/route')
    await POST()

    expect(mockClearPortalCookies).toHaveBeenCalledTimes(1)
  })
})
