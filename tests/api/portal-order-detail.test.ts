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
const mockVerifyPortalAuth = vi.fn()

vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: mockVerifyPortalAuth,
  PORTAL_ACCESS_COOKIE: 'cultr_portal_access',
}))

// Mock asher-med-api
const mockGetOrderDetail = vi.fn()

vi.mock('@/lib/asher-med-api', () => ({
  getOrderDetail: mockGetOrderDetail,
}))

// Mock @vercel/postgres
const mockSql = vi.fn()
mockSql.mockResolvedValue({ rows: [] })

vi.mock('@vercel/postgres', () => ({
  sql: new Proxy(mockSql, {
    apply: (target, _thisArg, args) => target(...args),
    get: (target, prop) => {
      if (prop === 'then') return undefined
      return target[prop]
    },
  }),
}))

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function makeRequest(): { cookies: { get: (name: string) => { value: string } | undefined } } {
  return {
    cookies: {
      get: (name: string) => {
        if (name === 'cultr_portal_access') return { value: 'test-token' }
        return undefined
      },
    },
  }
}

function makeUnauthenticatedRequest(): { cookies: { get: () => undefined } } {
  return {
    cookies: {
      get: () => undefined,
    },
  }
}

const mockOrder = {
  id: 101,
  patientId: 42,
  doctorId: 5,
  status: 'APPROVED',
  orderType: 'GLP1',
  partnerNote: 'Standard dosing',
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-05T14:00:00Z',
}

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('GET /api/portal/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockGetOrderDetail.mockResolvedValue(mockOrder)
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/[id]/route')
    const response = await GET(
      makeUnauthenticatedRequest() as any,
      { params: Promise.resolve({ id: '101' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns 401 when no asherPatientId', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/[id]/route')
    const response = await GET(
      makeRequest() as any,
      { params: Promise.resolve({ id: '101' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns full order detail for own order', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          asher_order_id: 101,
          medication_packages: JSON.stringify([{ name: 'Tirzepatide', duration: 30, medicationType: 'Injection' }]),
        },
      ],
    })

    const { GET } = await import('@/app/api/portal/orders/[id]/route')
    const response = await GET(
      makeRequest() as any,
      { params: Promise.resolve({ id: '101' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.order.id).toBe(101)
    expect(data.order.status).toBe('APPROVED')
    expect(data.order.medicationName).toBe('Tirzepatide')
    expect(data.order.doctorId).toBe(5)
    expect(data.order.partnerNote).toBe('Standard dosing')
    expect(data.order.createdAt).toBe('2026-03-01T10:00:00Z')
    expect(data.order.updatedAt).toBe('2026-03-05T14:00:00Z')
  })

  it('returns 403 for another patient\'s order', async () => {
    mockGetOrderDetail.mockResolvedValue({
      ...mockOrder,
      patientId: 999, // Different patient
    })

    const { GET } = await import('@/app/api/portal/orders/[id]/route')
    const response = await GET(
      makeRequest() as any,
      { params: Promise.resolve({ id: '101' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Not authorized')
  })

  it('returns 502 when Asher Med API fails', async () => {
    mockGetOrderDetail.mockRejectedValue(new Error('Asher Med timeout'))

    const { GET } = await import('@/app/api/portal/orders/[id]/route')
    const response = await GET(
      makeRequest() as any,
      { params: Promise.resolve({ id: '101' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unable to load order details')
  })
})
