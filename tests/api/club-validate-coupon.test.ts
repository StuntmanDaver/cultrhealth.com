// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockValidateCouponUnified = vi.fn()
const mockIsExpiredCoupon = vi.fn()

vi.mock('@/lib/config/coupons', () => ({
  validateCouponUnified: mockValidateCouponUnified,
  isExpiredCoupon: mockIsExpiredCoupon,
}))

describe('club validate coupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsExpiredCoupon.mockReturnValue(false)
  })

  it('rejects coupons for bacteriostatic-water-only carts', async () => {
    mockValidateCouponUnified.mockResolvedValue({
      discount: 10,
      label: 'Promo Code',
      isCreatorCode: false,
    })

    const { POST } = await import('@/app/api/club/validate-coupon/route')

    const response = await POST(
      new Request('http://localhost:3000/api/club/validate-coupon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: 'CULTR10',
          items: [{ therapyId: 'bacteriostatic-water', quantity: 1 }],
        }),
      })
    )

    const body = await response.json()

    expect(body).toEqual({
      valid: false,
      error: 'Coupons require another therapy in the cart. Bacteriostatic water alone is not eligible.',
    })
  })

  it('forces coupons to disable bundle stacking for ghk-cu and glutathione carts', async () => {
    mockValidateCouponUnified.mockResolvedValue({
      discount: 10,
      label: 'Promo Code',
      isCreatorCode: false,
      noBundleStack: false,
    })

    const { POST } = await import('@/app/api/club/validate-coupon/route')

    const response = await POST(
      new Request('http://localhost:3000/api/club/validate-coupon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: 'CULTR10',
          items: [
            { therapyId: 'ghk-cu', quantity: 1 },
            { therapyId: 'glutathione', quantity: 1 },
          ],
        }),
      })
    )

    const body = await response.json()

    expect(body).toEqual({
      valid: true,
      discount: 10,
      label: 'Promo Code',
      isCreatorCode: false,
      noBundleStack: true,
    })
  })
})
