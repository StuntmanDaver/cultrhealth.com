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
const mockGetPatientById = vi.fn()
const mockUpdatePatient = vi.fn()

vi.mock('@/lib/asher-med-api', () => ({
  getPatientById: mockGetPatientById,
  updatePatient: mockUpdatePatient,
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

const mockPatient = {
  id: 42,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phoneNumber: '+15551234567',
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE' as const,
  status: 'ACTIVE' as const,
  address1: '123 Main St',
  address2: 'Apt 4B',
  city: 'Gainesville',
  stateAbbreviation: 'FL',
  zipcode: '32601',
  country: 'US',
  height: 65,
  weight: 140,
  bmi: 23.3,
  currentBodyFat: 22,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
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
    mockGetPatientById.mockResolvedValue(mockPatient)
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
    expect(mockGetPatientById).not.toHaveBeenCalled()
  })

  it('returns personal info from Asher Med patient', async () => {
    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.profile.firstName).toBe('Jane')
    expect(data.profile.lastName).toBe('Doe')
    expect(data.profile.email).toBe('jane@example.com')
    expect(data.profile.phone).toBe('+15551234567')
    expect(data.profile.dateOfBirth).toBe('1990-05-15')
    expect(data.profile.gender).toBe('FEMALE')
  })

  it('returns address object with mapped field names', async () => {
    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(data.profile.address).toEqual({
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Gainesville',
      state: 'FL',
      zipCode: '32601',
    })
  })

  it('returns measurements from Asher Med patient', async () => {
    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(data.profile.measurements).toEqual({
      height: 65,
      weight: 140,
      bmi: 23.3,
    })
  })

  it('returns null measurements when patient has none', async () => {
    mockGetPatientById.mockResolvedValue({
      ...mockPatient,
      height: undefined,
      weight: undefined,
      bmi: undefined,
    })

    const { GET } = await import('@/app/api/portal/profile/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(data.profile.measurements).toEqual({
      height: null,
      weight: null,
      bmi: null,
    })
  })

  it('returns 502 when Asher Med API throws', async () => {
    mockGetPatientById.mockRejectedValue(new Error('Asher Med timeout'))

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
    mockUpdatePatient.mockResolvedValue({
      success: true,
      data: mockPatient,
    })
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

  it('calls updatePatient with correct Asher Med field names', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    await PUT(
      makeRequest('PUT', {
        address: {
          address1: '456 Oak Ave',
          address2: 'Suite 200',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33601',
        },
      }) as any
    )

    expect(mockUpdatePatient).toHaveBeenCalledWith(42, {
      address1: '456 Oak Ave',
      address2: 'Suite 200',
      city: 'Tampa',
      stateAbbreviation: 'FL',
      zipcode: '33601',
      country: 'US',
    })
  })

  it('sends address2 as null when not provided', async () => {
    const { PUT } = await import('@/app/api/portal/profile/route')
    await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: '33601' },
      }) as any
    )

    expect(mockUpdatePatient).toHaveBeenCalledWith(42, {
      address1: '456 Oak Ave',
      address2: null,
      city: 'Tampa',
      stateAbbreviation: 'FL',
      zipcode: '33601',
      country: 'US',
    })
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

  it('returns 502 when Asher Med updatePatient throws', async () => {
    mockUpdatePatient.mockRejectedValue(new Error('Asher Med error'))

    const { PUT } = await import('@/app/api/portal/profile/route')
    const response = await PUT(
      makeRequest('PUT', {
        address: { address1: '456 Oak Ave', city: 'Tampa', state: 'FL', zipCode: '33601' },
      }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unable to update address')
  })
})
