// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockCreateMagicLinkToken = vi.fn()
const mockCheckRateLimit = vi.fn()
const mockNormalizeAuthEmailInput = vi.fn()
const mockVerifyMagicLinkToken = vi.fn()
const mockCreateSessionToken = vi.fn()
const mockGetCreatorByEmail = vi.fn()
const mockResendSend = vi.fn()
const mockGetCookieDomain = vi.fn()

vi.mock('@/lib/auth', () => ({
  createMagicLinkToken: mockCreateMagicLinkToken,
  checkRateLimit: mockCheckRateLimit,
  normalizeAuthEmailInput: mockNormalizeAuthEmailInput,
  verifyMagicLinkToken: mockVerifyMagicLinkToken,
  createSessionToken: mockCreateSessionToken,
}))

vi.mock('@/lib/creators/db', () => ({
  getCreatorByEmail: mockGetCreatorByEmail,
}))

vi.mock('@/lib/utils', () => ({
  getCookieDomain: mockGetCookieDomain,
}))

vi.mock('resend', () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: mockResendSend,
      },
    }
  }),
}))

describe('creator magic-link auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'cultrhealth-6pr6zg5tm-stuntmandavers-projects.vercel.app'
    process.env.RESEND_API_KEY = 're_test_123'
    process.env.FROM_EMAIL = 'CULTR <noreply@cultrhealth.com>'
    process.env.STAGING_ACCESS_EMAILS = ''
    process.env.NODE_ENV = 'production'

    mockCreateMagicLinkToken.mockResolvedValue('test-token')
    mockCheckRateLimit.mockReturnValue(true)
    mockNormalizeAuthEmailInput.mockImplementation((email: string) => email.trim().toLowerCase())
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'creator@example.com' })
    mockCreateSessionToken.mockResolvedValue('session-token')
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_123',
      email: 'creator@example.com',
      status: 'active',
    })
    mockResendSend.mockResolvedValue({ data: { id: 'email_123' }, error: null })
    mockGetCookieDomain.mockReturnValue(undefined)
  })

  it('uses the request origin for direct creator magic links when NEXT_PUBLIC_SITE_URL is unset', async () => {
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'david@cultrhealth.com' })

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'david@cultrhealth.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.redirectUrl).toBe('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')
  })

  it('returns to the request origin after creator verify when NEXT_PUBLIC_SITE_URL is unset', async () => {
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'creator@example.com' })

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/portal/dashboard')
  })

  it('fails closed when resend reports an email delivery error', async () => {
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: 'Resend unavailable' },
    })

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'creator@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to send email. Please try again.' })
  })
})
