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

function makeRequest(
  method: string = 'GET',
  body?: Record<string, unknown>
): {
  method: string
  cookies: { get: (name: string) => { value: string } | undefined }
  json: () => Promise<Record<string, unknown>>
} {
  return {
    method,
    cookies: {
      get: (name: string) => {
        if (name === 'cultr_portal_access') return { value: 'test-token' }
        return undefined
      },
    },
    json: async () => body || {},
  }
}

// --------------------------------------------------
// TESTS: GET
// --------------------------------------------------

describe('GET /api/portal/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    // Default: portal_sessions returns session, pending_intakes returns intake data
    let callCount = 0
    mockSql.mockImplementation(() => {
      callCount++
      if (callCount % 2 === 1) {
        // portal_sessions query
        return Promise.resolve({ rows: [{ first_name: 'Jane', last_name: 'Doe', phone_e164: '+15551234567' }] })
      }
      // pending_intakes query
      return Promise.resolve({
        rows: [{
          intake_data: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phone: '+15551234567',
            dateOfBirth: '1990-05-15',
            gender: 'FEMALE',
            shippingAddress: {
              address1: '123 Main St',
              address2: 'Apt 4B',
              city: 'Gainesville',
              state: 'FL',
              zipCode: '32601',
            },
            physicalMeasurements: {
              height: 65,
              weight: 140,
              bmi: 23.3,
            },
          },
        }],
      })
    })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns profile: null when asherPatientId is null (Case C user)', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.profile).toBeNull()
  })

  it('returns profile from local DB', async () => {
    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.profile.firstName).toBe('Jane')
    expect(data.profile.lastName).toBe('Doe')
  })

  it('returns 502 when DB query fails', async () => {
    mockSql.mockRejectedValue(new Error('DB connection error'))

    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unable to load profile')
  })
})

// --------------------------------------------------
// TESTS: PUT
// --------------------------------------------------

describe('PUT /api/portal/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockSql.mockResolvedValue({ rows: [], rowCount: 1 })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: '33601' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns 401 when asherPatientId is null', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: null,
    })

    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: '33601' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns 400 when required address fields are missing', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave' }, // missing city, state, zipCode
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeTruthy()
  })

  it('returns 400 when state is invalid', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'XX', zipCode: '33601' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns 400 when zipCode is invalid format', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: 'ABCDE' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns success on valid update', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: '33601' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
