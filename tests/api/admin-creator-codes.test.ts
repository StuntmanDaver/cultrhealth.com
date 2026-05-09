// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockVerifyAdminAuth,
  mockCreateAffiliateCode,
  mockDeactivateAffiliateCode,
  mockGetAffiliateCodesByCreator,
  mockGetAllActiveCreators,
  mockUpdateAffiliateCodeStripeIds,
  mockCreateAdminAction,
  mockSql,
} = vi.hoisted(() => ({
  mockVerifyAdminAuth: vi.fn(),
  mockCreateAffiliateCode: vi.fn(),
  mockDeactivateAffiliateCode: vi.fn(),
  mockGetAffiliateCodesByCreator: vi.fn(),
  mockGetAllActiveCreators: vi.fn(),
  mockUpdateAffiliateCodeStripeIds: vi.fn(),
  mockCreateAdminAction: vi.fn(),
  mockSql: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
}))

vi.mock('@/lib/creators/db', () => ({
  createAffiliateCode: mockCreateAffiliateCode,
  deactivateAffiliateCode: mockDeactivateAffiliateCode,
  getAffiliateCodesByCreator: mockGetAffiliateCodesByCreator,
  getAllActiveCreators: mockGetAllActiveCreators,
  updateAffiliateCodeStripeIds: mockUpdateAffiliateCodeStripeIds,
  createAdminAction: mockCreateAdminAction,
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/config/coupons', () => ({
  CLUB_COUPONS: {
    OWNER: { discount: 60, label: 'Owner Discount' },
    CULTR10: { discount: 10, label: 'Promo Code' },
  },
  RESERVED_COUPON_CODES: new Set(['OWNER', 'CULTR10', 'NEWCUSTOMER10']),
}))

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/admin/creators/codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createDeleteRequest(codeId: string) {
  return new NextRequest(`http://localhost:3000/api/admin/creators/codes?code_id=${codeId}`, {
    method: 'DELETE',
  })
}

describe('admin creator codes route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: true,
      email: 'ops@example.com',
    })
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.STRIPE_SECRET_KEY = ''
  })

  it('rejects company-managed codes reserved by the join coupon resolver', async () => {
    const { POST } = await import('@/app/api/admin/creators/codes/route')

    const response = await POST(
      createPostRequest({
        code: 'OWNER',
        discount_value: 20,
        code_type: 'membership',
      })
    )

    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      error: 'Code is reserved for built-in coupon handling and cannot be created in admin.',
    })
    expect(mockSql).not.toHaveBeenCalled()
    expect(mockCreateAffiliateCode).not.toHaveBeenCalled()
  })

  it('still creates standard company-managed coupons', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'code_123', code: 'SPRING15' }] })

    const { POST } = await import('@/app/api/admin/creators/codes/route')

    const response = await POST(
      createPostRequest({
        code: 'spring15',
        discount_value: 15,
        code_type: 'membership',
      })
    )

    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({
      code: { id: 'code_123', code: 'SPRING15' },
    })
    expect(mockSql).toHaveBeenCalledTimes(2)
    expect(mockCreateAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_email: 'ops@example.com',
        action_type: 'create_company_code',
        entity_type: 'affiliate_code',
        metadata: expect.objectContaining({
          code: 'SPRING15',
          discount_value: 15,
          code_type: 'membership',
        }),
      })
    )
  })

  it('hard deletes unused codes when they have no historical usage', async () => {
    mockSql
      .mockResolvedValueOnce({
        rows: [{ code: 'SPRING15', use_count: 0, stripe_promotion_code_id: null }],
      })
      .mockResolvedValueOnce({
        rows: [{ has_attributions: false, has_orders: false }],
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const { DELETE } = await import('@/app/api/admin/creators/codes/route')

    const response = await DELETE(createDeleteRequest('code_unused_123'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, removal: 'deleted' })
    expect(mockDeactivateAffiliateCode).not.toHaveBeenCalled()
    expect(mockCreateAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_email: 'ops@example.com',
        action_type: 'delete_affiliate_code',
        entity_type: 'affiliate_code',
        entity_id: 'code_unused_123',
      })
    )
  })

  it('deactivates used codes instead of deleting them', async () => {
    mockSql
      .mockResolvedValueOnce({
        rows: [{ code: 'JON21', use_count: 3, stripe_promotion_code_id: 'promo_123' }],
      })
      .mockResolvedValueOnce({
        rows: [{ has_attributions: true, has_orders: true }],
      })
    mockDeactivateAffiliateCode.mockResolvedValue(true)

    const { DELETE } = await import('@/app/api/admin/creators/codes/route')

    const response = await DELETE(createDeleteRequest('code_used_123'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, removal: 'deactivated' })
    expect(mockDeactivateAffiliateCode).toHaveBeenCalledWith('code_used_123')
    expect(mockCreateAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_email: 'ops@example.com',
        action_type: 'deactivate_affiliate_code',
        entity_type: 'affiliate_code',
        entity_id: 'code_used_123',
      })
    )
  })
})
