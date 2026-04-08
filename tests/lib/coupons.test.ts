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
})
