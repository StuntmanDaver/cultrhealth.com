// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockCookies = vi.fn()
const mockSyncContactToMailchimp = vi.fn().mockResolvedValue(undefined)
const mockFormLimiterCheck = vi.fn()
const mockStrictLimiterCheck = vi.fn()
const mockGetClientIp = vi.fn()
const mockRateLimitResponse = vi.fn()

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

vi.mock('@/lib/mailchimp', () => ({
  syncContactToMailchimp: mockSyncContactToMailchimp,
}))

vi.mock('@/lib/rate-limit', () => ({
  formLimiter: {
    check: mockFormLimiterCheck,
  },
  strictLimiter: {
    check: mockStrictLimiterCheck,
  },
  getClientIp: mockGetClientIp,
  rateLimitResponse: mockRateLimitResponse,
}))

describe('club session cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.POSTGRES_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://cultrhealth.com'
    delete process.env.RESEND_API_KEY
    mockFormLimiterCheck.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
    mockStrictLimiterCheck.mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: 0 })
    mockGetClientIp.mockResolvedValue('127.0.0.1')
    mockRateLimitResponse.mockReturnValue(
      new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    )
  })

  it('signup sets a signed cultr_club_visitor cookie', async () => {
    const { POST } = await import('@/app/api/club/signup/route')
    const { verifyClubVisitorToken } = await import('@/lib/auth')

    const request = new Request('http://localhost:3000/api/club/signup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-111-2222',
        signupType: 'products',
      }),
    })

    const response = await POST(request)
    const setCookie = response.headers.get('set-cookie') || ''
    const cookieValue = setCookie.match(/cultr_club_visitor=([^;]+)/)?.[1]

    expect(response.status).toBe(200)
    expect(cookieValue).toBeTruthy()
    expect(cookieValue).not.toContain('%7B')
    await expect(verifyClubVisitorToken(cookieValue || '')).resolves.toEqual({
      email: 'test@example.com',
    })
  })

  it('recognizes existing signed cultr_club_visitor cookies', async () => {
    process.env.POSTGRES_URL = 'postgres://test'
    const { createClubVisitorToken } = await import('@/lib/auth')
    const clubVisitorToken = await createClubVisitorToken('test@example.com')
    mockCookies.mockReturnValue({
      get: vi.fn((name: string) => {
        if (name !== 'cultr_club_visitor') return undefined
        return {
          value: clubVisitorToken,
        }
      }),
    })
    mockSql.mockResolvedValue({
      rows: [
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: '555-111-2222',
          social_handle: '',
          signup_type: 'products',
          age: null,
          gender: null,
          address_street: null,
          address_city: null,
          address_state: null,
          address_zip: null,
        },
      ],
    })

    const { GET } = await import('@/app/api/club/check-member/route')
    const response = await GET(new Request('http://localhost:3000/api/club/check-member'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.member).toMatchObject({
      email: 'test@example.com',
      firstName: 'Test',
      phone: '555-111-2222',
      signupType: 'products',
    })
  })

  it('rejects forged cultr_club_visitor cookies', async () => {
    process.env.POSTGRES_URL = 'postgres://test'
    mockCookies.mockReturnValue({
      get: vi.fn((name: string) => {
        if (name !== 'cultr_club_visitor') return undefined
        return {
          value: encodeURIComponent(JSON.stringify({ email: 'test@example.com' })),
        }
      }),
    })

    const { GET } = await import('@/app/api/club/check-member/route')
    const response = await GET(new Request('http://localhost:3000/api/club/check-member'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ member: null })
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('rate limits club login attempts before hitting the database', async () => {
    mockStrictLimiterCheck.mockResolvedValueOnce({ success: false, limit: 3, remaining: 0, reset: 0 })

    const { POST } = await import('@/app/api/club/login/route')
    const response = await POST(new Request('http://localhost:3000/api/club/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        phone: '555-111-2222',
      }),
    }))

    expect(response.status).toBe(429)
    expect(mockSql).not.toHaveBeenCalled()
  })
})
