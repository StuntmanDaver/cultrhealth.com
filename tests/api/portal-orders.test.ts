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
const mockGetOrders = vi.fn()

vi.mock('@/lib/asher-med-api', () => ({
  getOrders: mockGetOrders,
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

const mockAsherOrders = [
  {
    id: 101,
    patientId: 42,
    doctorId: 5,
    status: 'APPROVED',
    orderType: 'GLP1',
    partnerNote: 'Standard dosing',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  },
  {
    id: 100,
    patientId: 42,
    doctorId: null,
    status: 'COMPLETED',
    orderType: 'NonGLP1',
    partnerNote: null,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-20T14:00:00Z',
  },
]

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('GET /api/portal/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockGetOrders.mockResolvedValue({
      data: mockAsherOrders,
      total: 2,
    })
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeUnauthenticatedRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns empty orders array when no asherPatientId (Case C user)', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orders).toEqual([])
    // Should NOT call getOrders
    expect(mockGetOrders).not.toHaveBeenCalled()
  })

  it('returns orders with merged medication names from local DB', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          asher_order_id: 101,
          medication_packages: JSON.stringify([{ name: 'Tirzepatide', duration: 30, medicationType: 'Injection' }]),
        },
      ],
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orders).toHaveLength(2)

    // First order (most recent) has medication name from local DB
    expect(data.orders[0].medicationName).toBe('Tirzepatide')
    expect(data.orders[0].id).toBe(101)
    expect(data.orders[0].status).toBe('APPROVED')

    // Second order falls back to orderType
    expect(data.orders[1].medicationName).toBe('NonGLP1')
    expect(data.orders[1].id).toBe(100)
  })

  it('falls back to orderType then "Medication" when no local DB match', async () => {
    // No local DB rows
    mockSql.mockResolvedValue({ rows: [] })

    // Order with orderType set
    mockGetOrders.mockResolvedValue({
      data: [
        {
          id: 200,
          patientId: 42,
          status: 'PENDING',
          orderType: 'GLP1',
          createdAt: '2026-03-10T10:00:00Z',
          updatedAt: '2026-03-10T10:00:00Z',
        },
        {
          id: 201,
          patientId: 42,
          status: 'PENDING',
          orderType: null,
          createdAt: '2026-03-09T10:00:00Z',
          updatedAt: '2026-03-09T10:00:00Z',
        },
      ],
      total: 2,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(data.orders[0].medicationName).toBe('GLP1')
    expect(data.orders[1].medicationName).toBe('Medication')
  })

  it('returns orders sorted by createdAt descending', async () => {
    // Return orders in ascending order from Asher Med
    mockGetOrders.mockResolvedValue({
      data: [
        {
          id: 100,
          patientId: 42,
          status: 'COMPLETED',
          orderType: 'GLP1',
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-02-20T14:00:00Z',
        },
        {
          id: 101,
          patientId: 42,
          status: 'APPROVED',
          orderType: 'GLP1',
          createdAt: '2026-03-01T10:00:00Z',
          updatedAt: '2026-03-05T14:00:00Z',
        },
      ],
      total: 2,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    // Most recent first
    expect(data.orders[0].id).toBe(101)
    expect(data.orders[1].id).toBe(100)
  })

  it('returns 502 when Asher Med API fails', async () => {
    mockGetOrders.mockRejectedValue(new Error('Asher Med API timeout'))

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unable to load orders')
    expect(data.orders).toEqual([])
  })
})
