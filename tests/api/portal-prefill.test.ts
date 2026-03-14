// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

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

const mockVerifyPortalAuth = vi.fn()

vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: mockVerifyPortalAuth,
  PORTAL_ACCESS_COOKIE: 'cultr_portal_access',
}))

const mockGetPatientById = vi.fn()
const mockGetOrders = vi.fn()

vi.mock('@/lib/asher-med-api', () => ({
  getPatientById: mockGetPatientById,
  getOrders: mockGetOrders,
}))

const mockSql = vi.fn()

vi.mock('@vercel/postgres', () => ({
  sql: new Proxy(mockSql, {
    apply: (_target, _thisArg, args) => mockSql(...args),
    get: (_target, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'then') return undefined
      return (...args: unknown[]) => mockSql(...args)
    },
  }),
}))

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function makeRequest(): { cookies: { get: (n: string) => { value: string } | undefined } } {
  return {
    cookies: {
      get: (name: string) =>
        name === 'cultr_portal_access' ? { value: 'test-token' } : undefined,
    },
  }
}

const basePatient = {
  id: 100,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '+15551234567',
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
  height: 70,
  weight: 160,
  address1: '123 Main St',
  city: 'Gainesville',
  stateAbbreviation: 'FL',
  zipcode: '32601',
}

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('GET /api/portal/prefill', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockVerifyPortalAuth.mockResolvedValue({ authenticated: false, phone: null, asherPatientId: null })

    const { GET } = await import('@/app/api/portal/prefill/route')
    const res = await GET(makeRequest() as never)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBeDefined()
  })

  it('returns null prefill for Case C user (no asherPatientId)', async () => {
    mockVerifyPortalAuth.mockResolvedValue({ authenticated: true, phone: '+15550000000', asherPatientId: null })

    const { GET } = await import('@/app/api/portal/prefill/route')
    const res = await GET(makeRequest() as never)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.prefill).toBeNull()
  })

  it('returns full prefill with intake+renewal+supply for authenticated member with orders', async () => {
    mockVerifyPortalAuth.mockResolvedValue({ authenticated: true, phone: '+15551234567', asherPatientId: 100 })
    mockGetPatientById.mockResolvedValue(basePatient)

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    mockGetOrders.mockResolvedValue({
      data: [
        { id: 1, patientId: 100, status: 'COMPLETED', createdAt: tenDaysAgo, updatedAt: tenDaysAgo },
      ],
      total: 1,
      page: 1,
      limit: 100,
    })

    mockSql.mockResolvedValue({
      rows: [{ medication_packages: JSON.stringify([{ name: 'Semaglutide', duration: 28 }]) }],
    })

    const { GET } = await import('@/app/api/portal/prefill/route')
    const res = await GET(makeRequest() as never)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.prefill.intake.firstName).toBe('Jane')
    expect(data.prefill.intake.heightFeet).toBe(5)
    expect(data.prefill.intake.heightInches).toBe(10)
    expect(data.prefill.renewal.lastMedication).toBe('Semaglutide')
    expect(data.prefill.supply.daysRemaining).toBe(18)
    expect(data.prefill.supply.isLow).toBe(false)
    expect(data.prefill.renewalEligible).toBe(true)
  })

  it('returns supply: null when no completed orders exist', async () => {
    mockVerifyPortalAuth.mockResolvedValue({ authenticated: true, phone: '+15551234567', asherPatientId: 100 })
    mockGetPatientById.mockResolvedValue(basePatient)
    mockGetOrders.mockResolvedValue({ data: [
      { id: 1, patientId: 100, status: 'PENDING', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    ], total: 1, page: 1, limit: 100 })

    mockSql.mockResolvedValue({ rows: [] })

    const { GET } = await import('@/app/api/portal/prefill/route')
    const res = await GET(makeRequest() as never)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.prefill.supply).toBeNull()
    expect(data.prefill.renewal.lastMedication).toBeNull()
  })

  it('defaults duration to 28 days when medication_packages is missing', async () => {
    mockVerifyPortalAuth.mockResolvedValue({ authenticated: true, phone: '+15551234567', asherPatientId: 100 })
    mockGetPatientById.mockResolvedValue(basePatient)

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    mockGetOrders.mockResolvedValue({
      data: [
        { id: 1, patientId: 100, status: 'COMPLETED', createdAt: tenDaysAgo, updatedAt: tenDaysAgo },
      ],
      total: 1, page: 1, limit: 100,
    })

    // medication_packages is null
    mockSql.mockResolvedValue({ rows: [{ medication_packages: null }] })

    const { GET } = await import('@/app/api/portal/prefill/route')
    const res = await GET(makeRequest() as never)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.prefill.supply.daysRemaining).toBe(18)
    expect(data.prefill.renewal.lastMedication).toBeNull()
  })
})
