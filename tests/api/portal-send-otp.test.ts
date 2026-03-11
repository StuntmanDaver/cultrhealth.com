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
const mockIpCheck = vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
const mockPhoneCheck = vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })

vi.mock('@/lib/rate-limit', () => {
  let callCount = 0
  return {
    rateLimit: vi.fn(() => {
      callCount++
      // First call is IP limiter, second is phone limiter
      if (callCount % 2 === 1) {
        return { check: mockIpCheck, reset: vi.fn() }
      }
      return { check: mockPhoneCheck, reset: vi.fn() }
    }),
    getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
    rateLimitResponse: vi.fn((result: { reset: number }) => {
      const { NextResponse } = require('next/server')
      return NextResponse.json(
        { error: 'Too many requests', message: 'Please try again later', retryAfter: result.reset - Math.floor(Date.now() / 1000) },
        { status: 429 }
      )
    }),
  }
})

// Mock asher-med-api
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
}))

// Mock twilio
const mockVerificationsCreate = vi.fn().mockResolvedValue({ status: 'pending', sid: 'VE123' })

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    verify: {
      v2: {
        services: vi.fn(() => ({
          verifications: {
            create: mockVerificationsCreate,
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
  return new Request('http://localhost:3000/api/portal/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe('POST /api/portal/send-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIpCheck.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
    mockPhoneCheck.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
    mockVerificationsCreate.mockResolvedValue({ status: 'pending', sid: 'VE123' })

    // Set env vars
    process.env.TWILIO_ACCOUNT_SID = 'ACtest123'
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token'
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VAtest123'
  })

  it('sends OTP and returns 200 with success for valid phone', async () => {
    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.phone).toBe('+15551234567')
  })

  it('returns 400 for invalid phone number', async () => {
    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('returns 429 when IP rate limit is hit', async () => {
    mockIpCheck.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: Math.floor(Date.now() / 1000) + 3600 })

    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('returns 429 when phone rate limit is hit', async () => {
    mockPhoneCheck.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: Math.floor(Date.now() / 1000) + 3600 })

    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)

    expect(response.status).toBe(429)
  })

  it('returns 429 with user-friendly message for Twilio error 60203', async () => {
    const twilioError = new Error('Too many requests') as Error & { code: number }
    twilioError.code = 60203
    mockVerificationsCreate.mockRejectedValue(twilioError)

    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Too many OTP requests')
  })

  it('returns 400 with user-friendly message for Twilio error 20404', async () => {
    const twilioError = new Error('Invalid number') as Error & { code: number }
    twilioError.code = 20404
    mockVerificationsCreate.mockRejectedValue(twilioError)

    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('valid US phone number')
  })

  it('returns 500 for generic Twilio errors', async () => {
    mockVerificationsCreate.mockRejectedValue(new Error('Service unavailable'))

    const { POST } = await import('@/app/api/portal/send-otp/route')
    const request = makeRequest({ phone: '5551234567' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to send verification code')
  })
})
