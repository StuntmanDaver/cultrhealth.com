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

// Mock feature flags
const mockFeatureFlags = {
  USE_HEALTHIE: false,
}

vi.mock('@/lib/config/feature-flags', () => mockFeatureFlags)

// Mock Healthie
const mockGetAppointments = vi.fn()
const mockMapAppointmentToPortalOrder = vi.fn((appointment) => appointment)
const mockIsHealthieConfigured = vi.fn(() => false)

vi.mock('@/lib/healthie', () => ({
  getAppointments: mockGetAppointments,
  mapAppointmentToPortalOrder: mockMapAppointmentToPortalOrder,
  isHealthieConfigured: mockIsHealthieConfigured,
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

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('GET /api/portal/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFeatureFlags.USE_HEALTHIE = false
    mockIsHealthieConfigured.mockReturnValue(false)
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      ehrPatientId: '42',
    })
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      ehrPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeUnauthenticatedRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns empty orders array when no ehrPatientId (Case C user)', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      ehrPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orders).toEqual([])
  })

  it('returns orders from local DB with medication names', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          id: 1,
          asher_order_id: 101,
          order_type: 'GLP1',
          order_status: 'APPROVED',
          partner_note: 'Standard dosing',
          medication_packages: JSON.stringify([{ name: 'Tirzepatide', duration: 30, medicationType: 'Injection' }]),
          created_at: '2026-03-01T10:00:00Z',
          updated_at: '2026-03-05T14:00:00Z',
        },
        {
          id: 2,
          asher_order_id: 100,
          order_type: 'NonGLP1',
          order_status: 'COMPLETED',
          partner_note: null,
          medication_packages: null,
          created_at: '2026-02-15T10:00:00Z',
          updated_at: '2026-02-20T14:00:00Z',
        },
      ],
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orders).toHaveLength(2)

    // First order has medication name from packages
    expect(data.orders[0].medicationName).toBe('Tirzepatide')
    expect(data.orders[0].id).toBe(101)
    expect(data.orders[0].status).toBe('APPROVED')

    // Second order falls back to order_type
    expect(data.orders[1].medicationName).toBe('NonGLP1')
    expect(data.orders[1].id).toBe(100)
  })

  it('returns empty orders gracefully when DB query fails', async () => {
    mockSql.mockRejectedValue(new Error('DB connection error'))

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orders).toEqual([])
  })

  it('skips Healthie lookups when the external clinical path is active', async () => {
    mockFeatureFlags.USE_HEALTHIE = false
    mockIsHealthieConfigured.mockReturnValue(true)
    mockSql.mockResolvedValue({
      rows: [
        {
          id: 1,
          asher_order_id: 101,
          order_type: 'GLP1',
          order_status: 'APPROVED',
          partner_note: 'Standard dosing',
          medication_packages: JSON.stringify([{ name: 'Tirzepatide' }]),
          created_at: '2026-03-01T10:00:00Z',
          updated_at: '2026-03-05T14:00:00Z',
        },
      ],
    })

    const { GET } = await import('@/app/api/portal/orders/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(mockGetAppointments).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].id).toBe(101)
  })
})
