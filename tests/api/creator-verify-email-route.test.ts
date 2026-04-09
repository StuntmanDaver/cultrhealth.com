// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockVerifyMagicLinkToken = vi.fn()
const mockGetCreatorByEmail = vi.fn()
const mockUpdateCreatorEmailVerified = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyMagicLinkToken: mockVerifyMagicLinkToken,
}))

vi.mock('@/lib/creators/db', () => ({
  getCreatorByEmail: mockGetCreatorByEmail,
  updateCreatorEmailVerified: mockUpdateCreatorEmailVerified,
}))

describe('creator verify-email route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'cultrhealth-6pr6zg5tm-stuntmandavers-projects.vercel.app'

    mockVerifyMagicLinkToken.mockResolvedValue({ email: 'creator@example.com' })
    mockUpdateCreatorEmailVerified.mockResolvedValue(true)
  })

  it('redirects pending creators to the pending page after clicking the email link', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_123',
      email: 'creator@example.com',
      status: 'pending',
      email_verified: false,
    })

    const { GET } = await import('@/app/api/creators/verify-email/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/pending')
    expect(mockUpdateCreatorEmailVerified).toHaveBeenCalledWith('creator_123')
  })

  it('redirects active creators to creator login after clicking the email link', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_123',
      email: 'creator@example.com',
      status: 'active',
      email_verified: false,
    })

    const { GET } = await import('@/app/api/creators/verify-email/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.cultrhealth.com/creators/login')
    expect(mockUpdateCreatorEmailVerified).toHaveBeenCalledWith('creator_123')
  })

  it.each(['paused', 'rejected'] as const)(
    'redirects %s creators to creator login with inactive_account after clicking the email link',
    async (status) => {
      mockGetCreatorByEmail.mockResolvedValue({
        id: 'creator_123',
        email: 'creator@example.com',
        status,
        email_verified: false,
      })

      const { GET } = await import('@/app/api/creators/verify-email/route')
      const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email?token=test-token')

      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'https://www.cultrhealth.com/creators/login?error=inactive_account'
      )
      expect(mockUpdateCreatorEmailVerified).toHaveBeenCalledWith('creator_123')
    }
  )

  it('redirects invalid verification links to creator login with an error', async () => {
    mockVerifyMagicLinkToken.mockResolvedValue(null)

    const { GET } = await import('@/app/api/creators/verify-email/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.cultrhealth.com/creators/login?error=invalid_verification_link'
    )
    expect(mockUpdateCreatorEmailVerified).not.toHaveBeenCalled()
  })

  it('redirects unexpected verification errors to creator login with an email verification error', async () => {
    mockGetCreatorByEmail.mockRejectedValue(new Error('db unavailable'))

    const { GET } = await import('@/app/api/creators/verify-email/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.cultrhealth.com/creators/login?error=email_verification_failed'
    )
  })

  it('keeps the JSON POST verification API working', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_123',
      email: 'creator@example.com',
      status: 'pending',
      email_verified: false,
    })

    const { POST } = await import('@/app/api/creators/verify-email/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/creators/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'test-token' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message: 'Email verified successfully. Your application is pending admin review.',
      status: 'pending',
    })
    expect(mockUpdateCreatorEmailVerified).toHaveBeenCalledWith('creator_123')
  })
})
