// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetAffiliateCodeByCode,
  mockGetCreatorById,
} = vi.hoisted(() => ({
  mockGetAffiliateCodeByCode: vi.fn(),
  mockGetCreatorById: vi.fn(),
}))

vi.mock('@/lib/creators/db', () => ({
  getAffiliateCodeByCode: mockGetAffiliateCodeByCode,
  getCreatorById: mockGetCreatorById,
}))

describe('validateCouponUnified', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('accepts company-managed DB coupons for join redemption', async () => {
    mockGetAffiliateCodeByCode.mockResolvedValue({
      id: 'code_company_123',
      creator_id: null,
      discount_value: '15',
      code_type: 'membership',
    })

    const { validateCouponUnified } = await import('@/lib/config/coupons')

    const result = await validateCouponUnified('SPRING15')

    expect(result).toEqual({
      discount: 15,
      label: 'Promo Code',
      isCreatorCode: false,
      codeId: 'code_company_123',
      codeType: 'membership',
    })
    expect(mockGetCreatorById).not.toHaveBeenCalled()
  })

  it('prefers an active creator-owned DB code over a hardcoded promo collision', async () => {
    mockGetAffiliateCodeByCode.mockResolvedValue({
      id: 'code_butch_123',
      creator_id: 'creator_butch',
      discount_value: '10',
      code_type: 'general',
    })
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_butch',
      full_name: 'Ry Butchey',
      status: 'active',
    })

    const { validateCouponUnified } = await import('@/lib/config/coupons')

    const result = await validateCouponUnified('BUTCH10')

    expect(result).toEqual({
      discount: 10,
      label: "Ry Butchey's Code",
      isCreatorCode: true,
      noBundleStack: true,
      creatorId: 'creator_butch',
      creatorName: 'Ry Butchey',
      codeId: 'code_butch_123',
      codeType: 'general',
    })
  })

  it('does not allow the automatic first-purchase discount code as a manual coupon', async () => {
    const { validateCouponUnified } = await import('@/lib/config/coupons')

    const result = await validateCouponUnified('NEWCUSTOMER10')

    expect(result).toBeNull()
    expect(mockGetAffiliateCodeByCode).not.toHaveBeenCalled()
    expect(mockGetCreatorById).not.toHaveBeenCalled()
  })
})
