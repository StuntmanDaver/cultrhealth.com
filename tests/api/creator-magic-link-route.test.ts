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
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'erik@cultrhealth.com' })

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'erik@cultrhealth.com' }),
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

  it('sets a shared cultrhealth cookie domain on creator verify when the env url is unset', async () => {
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'creator@example.com' })

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)
    const setCookie = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(307)
    expect(setCookie).toContain('Domain=.cultrhealth.com')
  })

  it('sets shared cultrhealth cookies', async () => {
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'creator@example.com' })

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)
    const setCookie = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(307)
    expect(setCookie).toContain('cultr_session_v2=session-token')
    expect(setCookie).toContain('Domain=.cultrhealth.com')
  })

  it('silently succeeds for unknown creator emails without sending email', async () => {
    mockGetCreatorByEmail.mockResolvedValue(null)

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message: 'If you have an active creator account, you will receive an email shortly.',
    })
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled()
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('silently succeeds for inactive creator emails without sending email', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_paused',
      email: 'paused@example.com',
      status: 'paused',
    })

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'paused@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled()
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('sends login emails for pending creators', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_pending',
      email: 'pending@example.com',
      status: 'pending',
    })

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'pending@example.com' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockCreateMagicLinkToken).toHaveBeenCalledWith('pending@example.com')
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'pending@example.com',
        subject: 'Access Your CULTR Creator Portal',
        html: expect.stringContaining('/api/creators/verify-login?token=test-token'),
      })
    )
  })

  it('returns a retry error when creator lookup fails', async () => {
    mockGetCreatorByEmail.mockRejectedValue(new Error('db unavailable'))

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'creator@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain('could not send a login link')
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled()
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('returns a retry error when Resend is not configured for an active creator', async () => {
    delete process.env.RESEND_API_KEY

    const { POST } = await import('@/app/api/creators/magic-link/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'creator@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain('could not send a login link')
    expect(mockCreateMagicLinkToken).toHaveBeenCalledWith('creator@example.com')
    expect(mockResendSend).not.toHaveBeenCalled()
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

    expect(response.status).toBe(503)
    expect(body.error).toContain('could not send a login link')
  })

  it('redirects pending creators to the pending page after verify', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_pending',
      email: 'pending@example.com',
      status: 'pending',
    })
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'pending@example.com' })

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)
    const setCookie = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/pending')
    expect(setCookie).toContain('cultr_session_v2=session-token')
    expect(setCookie).toContain('cultr_last_activity_v2=')
  })

  it('rejects inactive creators after verify', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_paused',
      email: 'paused@example.com',
      status: 'paused',
    })
    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'paused@example.com' })

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/login?error=inactive_account')
  })

  it('rejects missing creator records after verify', async () => {
    mockGetCreatorByEmail.mockResolvedValue(null)

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/login?error=no_account')
  })

  it('falls back to no_account when verify creator lookup fails in production', async () => {
    mockGetCreatorByEmail.mockRejectedValue(new Error('db unavailable'))

    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/login?error=no_account')
  })

  it('sanitizes unsafe verify redirect params', async () => {
    const { GET } = await import('@/app/api/creators/verify-login/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-login?token=test-token&redirect=//evil.example')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/portal/dashboard')
  })
})
