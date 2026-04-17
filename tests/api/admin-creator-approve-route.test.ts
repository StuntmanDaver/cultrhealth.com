// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockVerifyAdminAuth = vi.fn()
const mockCreateMagicLinkToken = vi.fn()
const mockGetCreatorById = vi.fn()
const mockCreateAdminAction = vi.fn()
const mockUpdateAffiliateCodeStripeIds = vi.fn()
const mockUpdateCreatorRecruitCount = vi.fn()
const mockUpdateCreatorTier = vi.fn()
const mockGenerateCreatorCodes = vi.fn()
const mockGetTierForRecruitCount = vi.fn()
const mockResendSend = vi.fn()
const mockQuery = vi.fn()
const mockRelease = vi.fn()
const mockConnect = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
  createMagicLinkToken: mockCreateMagicLinkToken,
}))

vi.mock('@/lib/creators/db', () => ({
  getCreatorById: mockGetCreatorById,
  createAdminAction: mockCreateAdminAction,
  updateAffiliateCodeStripeIds: mockUpdateAffiliateCodeStripeIds,
  updateCreatorRecruitCount: mockUpdateCreatorRecruitCount,
  updateCreatorTier: mockUpdateCreatorTier,
}))

vi.mock('@/lib/config/affiliate', () => ({
  generateCreatorCodes: mockGenerateCreatorCodes,
  getTierForRecruitCount: mockGetTierForRecruitCount,
}))

vi.mock('@vercel/postgres', () => ({
  db: {
    connect: mockConnect,
  },
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

describe('admin creator approve route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.cultrhealth.com'
    process.env.RESEND_API_KEY = 're_test_123'
    process.env.FROM_EMAIL = 'CULTR <noreply@cultrhealth.com>'
    delete process.env.STRIPE_SECRET_KEY

    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: true,
      email: 'ops@example.com',
    })
    mockCreateMagicLinkToken.mockResolvedValue('approval-token')
    mockGenerateCreatorCodes.mockReturnValue({
      membershipCode: 'SMITH',
      productCode: 'SMITH10',
    })
    mockGetTierForRecruitCount.mockReturnValue({
      tier: 1,
      overrideRate: 5,
    })
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    })
    mockQuery.mockImplementation(async (query: unknown) => {
      const sql = String(query)

      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return { rows: [], rowCount: 0 }
      }

      if (sql.includes('INSERT INTO affiliate_codes') && sql.includes("'membership'")) {
        return { rows: [{ id: 'membership_code_id' }], rowCount: 1 }
      }

      if (sql.includes('INSERT INTO affiliate_codes') && sql.includes("'product'")) {
        return { rows: [{ id: 'product_code_id' }], rowCount: 1 }
      }

      return { rows: [], rowCount: 1 }
    })
    mockResendSend.mockResolvedValue({ data: { id: 'email_123' }, error: null })
  })

  it('approves pending creators and sends the promised approval email', async () => {
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_1',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'pending',
      recruiter_id: null,
    })

    const { POST } = await import('@/app/api/admin/creators/[id]/approve/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/creator_1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Approved from admin queue' }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'creator_1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      trackingSlug: expect.any(String),
      membershipCode: 'SMITH',
      productCode: 'SMITH10',
    })
    expect(mockCreateMagicLinkToken).toHaveBeenCalledWith('jane@example.com')
    expect(mockResendSend).toHaveBeenCalledTimes(1)

    const emailPayload = mockResendSend.mock.calls[0][0]
    expect(emailPayload.to).toBe('jane@example.com')
    expect(emailPayload.subject).toContain('Approved')
    expect(emailPayload.html).toContain('/api/creators/verify-login?token=approval-token')
    expect(emailPayload.html).toContain('https://cultrclub.com/')
    expect(emailPayload.html).toContain('SMITH')
    expect(emailPayload.html).toContain('SMITH10')
  })

  it('rejects approval attempts for creators who are not pending', async () => {
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_1',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'rejected',
      recruiter_id: null,
    })

    const { POST } = await import('@/app/api/admin/creators/[id]/approve/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/creator_1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Should not approve' }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'creator_1' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Only pending creators can be approved' })
    expect(mockConnect).not.toHaveBeenCalled()
    expect(mockResendSend).not.toHaveBeenCalled()
  })
})
