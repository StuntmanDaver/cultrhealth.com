// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockFormLimiterCheck = vi.fn()
const mockGetClientIp = vi.fn()
const mockCreateCreator = vi.fn()
const mockGetCreatorByEmail = vi.fn()
const mockUpdateCreatorStatus = vi.fn()
const mockCreateMagicLinkToken = vi.fn()
const mockResendSend = vi.fn()

vi.mock('@/lib/rate-limit', () => ({
  formLimiter: {
    check: mockFormLimiterCheck,
  },
  getClientIp: mockGetClientIp,
  rateLimitResponse: vi.fn(() => NextResponse.json({ error: 'Rate limited' }, { status: 429 })),
}))

vi.mock('@/lib/creators/db', () => ({
  createCreator: mockCreateCreator,
  getCreatorByEmail: mockGetCreatorByEmail,
  updateCreatorStatus: mockUpdateCreatorStatus,
  createTrackingLink: vi.fn(),
  createAffiliateCode: vi.fn(),
  checkAffiliateCodeExists: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/lib/config/affiliate', () => ({
  generateCreatorCodes: vi.fn(() => ({
    membershipCode: 'SMITH',
    productCode: 'SMITH10',
  })),
}))

vi.mock('@/lib/auth', () => ({
  createMagicLinkToken: mockCreateMagicLinkToken,
}))

vi.mock('@/lib/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/resend')>()
  return {
    ...actual,
    escapeHtml: (value: string) => value,
  }
})

vi.mock('resend', () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: mockResendSend,
      },
    }
  }),
}))

describe('creator apply route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.cultrhealth.com'
    process.env.RESEND_API_KEY = 're_test_123'
    process.env.FROM_EMAIL = 'CULTR <noreply@cultrhealth.com>'

    mockGetClientIp.mockResolvedValue('127.0.0.1')
    mockFormLimiterCheck.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    })
    mockCreateMagicLinkToken.mockResolvedValue('verify-token')
    mockCreateCreator.mockResolvedValue({
      id: 'creator_1',
      email: 'creator@example.com',
      full_name: 'Creator Example',
    })
    mockUpdateCreatorStatus.mockResolvedValue(true)
    mockResendSend.mockResolvedValue({ data: { id: 'email_123' }, error: null })
  })

  it.each(['rejected', 'paused'] as const)(
    'resets %s creators back to pending when they reapply',
    async (status) => {
      mockGetCreatorByEmail.mockResolvedValue({
        id: 'creator_1',
        email: 'creator@example.com',
        full_name: 'Creator Example',
        status,
      })

      const { POST } = await import('@/app/api/creators/apply/route')
      const request = new NextRequest('https://www.cultrhealth.com/api/creators/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'creator@example.com',
          full_name: 'Creator Example',
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(mockUpdateCreatorStatus).toHaveBeenCalledWith('creator_1', 'pending')
      expect(mockResendSend).toHaveBeenCalledTimes(1)

      const emailPayload = mockResendSend.mock.calls[0][0]
      expect(emailPayload.to).toBe('creator@example.com')
      expect(emailPayload.html).toContain('/api/creators/verify-email?token=verify-token')
    }
  )
})
