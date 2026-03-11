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

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      return null
    }),
  })),
}))

// Mock rate-limit
const mockVerifyIpCheck = vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 })

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({
    check: mockVerifyIpCheck,
    reset: vi.fn(),
  })),
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
  rateLimitResponse: vi.fn((result: { reset: number }) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json(
      { error: 'Too many requests', message: 'Please try again later', retryAfter: result.reset - Math.floor(Date.now() / 1000) },
      { status: 429 }
    )
  }),
}))

// Mock asher-med-api
const mockGetPatientByPhone = vi.fn()

vi.mock('@/lib/asher-med-api', () => ({
  formatPhoneNumber: vi.fn((phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    return `+${digits}`
  }),
  isValidPhoneNumber: vi.fn((phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }),
  getPatientByPhone: mockGetPatientByPhone,
}))

// Mock portal-auth
const mockCreatePortalAccessToken = vi.fn().mockResolvedValue('access-token-123')
const mockCreatePortalRefreshToken = vi.fn().mockResolvedValue('refresh-token-456')
const mockSetPortalCookies = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/portal-auth', () => ({
  createPortalAccessToken: mockCreatePortalAccessToken,
  createPortalRefreshToken: mockCreatePortalRefreshToken,
  setPortalCookies: mockSetPortalCookies,
  PORTAL_ACCESS_COOKIE: 'cultr_portal_access',
  PORTAL_REFRESH_COOKIE: 'cultr_portal_refresh',
}))

// Mock portal-db
const mockGetPortalSessionByPhone = vi.fn()
const mockUpsertPortalSession = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/portal-db', () => ({
  getPortalSessionByPhone: mockGetPortalSessionByPhone,
  upsertPortalSession: mockUpsertPortalSession,
}))

// Mock twilio
const mockVerificationChecksCreate = vi.fn().mockResolvedValue({ status: 'approved' })

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    verify: {
      v2: {
        services: vi.fn(() => ({
          verificationChecks: {
            create: mockVerificationChecksCreate,
          },
        })),
      },
    },
  })),
}))

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/portal/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockPatient = {
  id: 42,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '+15551234567',
  dateOfBirth: '1990-01-01',
  gender: 'MALE' as const,
  status: 'ACTIVE' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const mockExistingSession = {
  id: 'uuid-123',
  phone: '5551234567',
  phone_e164: '+15551234567',
  asher_patient_id: 42,
  first_name: 'John',
  last_name: 'Doe',
  verified_at: new Date(),
  last_login_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
}

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('POST /api/portal/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyIpCheck.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 })
    mockVerificationChecksCreate.mockResolvedValue({ status: 'approved' })
    mockGetPatientByPhone.mockResolvedValue(null)
    mockGetPortalSessionByPhone.mockResolvedValue(null)
    mockUpsertPortalSession.mockResolvedValue(undefined)
    mockCreatePortalAccessToken.mockResolvedValue('access-token-123')
    mockCreatePortalRefreshToken.mockResolvedValue('refresh-token-456')
    mockSetPortalCookies.mockResolvedValue(undefined)

    // Set env vars
    process.env.TWILIO_ACCOUNT_SID = 'ACtest123'
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token'
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VAtest123'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://cultrhealth.com'
  })

  // ---- Case A: Patient found ----
  it('returns hasPatient=true, knownPhone=true, redirect=/portal/dashboard when patient exists', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(mockExistingSession)
    mockGetPatientByPhone.mockResolvedValue(mockPatient)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.hasPatient).toBe(true)
    expect(data.knownPhone).toBe(true)
    expect(data.redirect).toBe('/portal/dashboard')
  })

  // ---- Case B: Known phone, no patient ----
  it('returns hasPatient=false, knownPhone=true, redirect=/intake when phone is known but no patient', async () => {
    const sessionWithoutPatient = { ...mockExistingSession, asher_patient_id: null }
    mockGetPortalSessionByPhone.mockResolvedValue(sessionWithoutPatient)
    mockGetPatientByPhone.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.hasPatient).toBe(false)
    expect(data.knownPhone).toBe(true)
    expect(data.redirect).toBe('/intake')
  })

  // ---- Case C: Never-seen phone ----
  it('returns hasPatient=false, knownPhone=false, NO redirect for never-seen phone', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(null)
    mockGetPatientByPhone.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.hasPatient).toBe(false)
    expect(data.knownPhone).toBe(false)
    expect(data.redirect).toBeUndefined()
  })

  // ---- Twilio verification failure ----
  it('returns 401 when OTP code is wrong', async () => {
    mockVerificationChecksCreate.mockResolvedValue({ status: 'pending' })

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '000000' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  // ---- Staging bypass ----
  it('accepts code 123456 on staging without Twilio check', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
    mockGetPortalSessionByPhone.mockResolvedValue(null)
    mockGetPatientByPhone.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '123456' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Twilio should NOT have been called
    expect(mockVerificationChecksCreate).not.toHaveBeenCalled()
  })

  // ---- Validation errors ----
  it('returns 400 for invalid phone number', async () => {
    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '123', code: '789012' })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 for invalid code format (not 6 digits)', async () => {
    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '12345' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  // ---- Rate limiting ----
  it('returns 429 when rate limit is hit', async () => {
    mockVerifyIpCheck.mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Math.floor(Date.now() / 1000) + 3600 })

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  // ---- Session creation: cookies set in all cases ----
  it('calls setPortalCookies after successful verification (patient found)', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(mockExistingSession)
    mockGetPatientByPhone.mockResolvedValue(mockPatient)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    await POST(request)

    expect(mockSetPortalCookies).toHaveBeenCalledWith('access-token-123', 'refresh-token-456')
  })

  it('calls setPortalCookies after successful verification (known phone, no patient)', async () => {
    const sessionWithoutPatient = { ...mockExistingSession, asher_patient_id: null }
    mockGetPortalSessionByPhone.mockResolvedValue(sessionWithoutPatient)
    mockGetPatientByPhone.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    await POST(request)

    expect(mockSetPortalCookies).toHaveBeenCalledWith('access-token-123', 'refresh-token-456')
  })

  it('calls setPortalCookies after successful verification (never-seen phone)', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(null)
    mockGetPatientByPhone.mockResolvedValue(null)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    await POST(request)

    expect(mockSetPortalCookies).toHaveBeenCalledWith('access-token-123', 'refresh-token-456')
  })

  // ---- upsertPortalSession called in all cases ----
  it('calls upsertPortalSession after successful verification (all cases)', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(null)
    mockGetPatientByPhone.mockResolvedValue(mockPatient)

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    await POST(request)

    expect(mockUpsertPortalSession).toHaveBeenCalledWith(
      '5551234567',
      '+15551234567',
      42,
      'John',
      'Doe'
    )
  })

  // ---- Cached patient ID fallback when Asher Med is down ----
  it('uses cached patient ID when Asher Med lookup fails', async () => {
    mockGetPortalSessionByPhone.mockResolvedValue(mockExistingSession) // has asher_patient_id: 42
    mockGetPatientByPhone.mockRejectedValue(new Error('Asher Med down'))

    const { POST } = await import('@/app/api/portal/verify-otp/route')
    const request = makeRequest({ phone: '5551234567', code: '789012' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasPatient).toBe(true)
    expect(data.knownPhone).toBe(true)
    expect(data.redirect).toBe('/portal/dashboard')
  })
})
