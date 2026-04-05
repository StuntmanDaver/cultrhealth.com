// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/components/admin/PrelaunchCodesSection', () => ({
  default: () => <div data-testid="prelaunch-codes-section" />,
}))

const analyticsData = {
  coupons: {
    coupons: [],
    totalCouponOrders: 0,
    totalCouponRevenue: 0,
    totalDiscountGiven: 0,
  },
  prelaunch: {
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    totalRedemptions: 0,
    totalRevenue: 0,
    totalDiscountGiven: 0,
  },
  revenueByTier: [],
  allTrackingLinks: [],
  allCouponCodes: [
    {
      id: 'company_code_1',
      creator_id: null,
      code: 'CULTR10',
      code_type: 'membership',
      discount_type: 'percentage',
      discount_value: 10,
      use_count: 5,
      total_revenue: 500,
      active: true,
      expires_at: null,
      program_type: 'company',
      stripe_promotion_code_id: 'promo_123',
      created_at: '2026-04-01T00:00:00Z',
      creator_name: null,
    },
    {
      id: 'creator_code_1',
      creator_id: 'creator_1',
      code: 'JON21',
      code_type: 'membership',
      discount_type: 'percentage',
      discount_value: 10,
      use_count: 3,
      total_revenue: 300,
      active: true,
      expires_at: null,
      program_type: 'creator',
      stripe_promotion_code_id: 'promo_456',
      created_at: '2026-04-02T00:00:00Z',
      creator_name: 'Jon Collins',
    },
  ],
} as any

describe('CouponsClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: analyticsData }),
      })
    ) as any
  })

  it('counts company-managed codes in the Club summary pill', async () => {
    const mod = await import('@/app/admin/creators/coupons/CouponsClient')
    const CouponsClient = mod.default

    render(<CouponsClient />)

    await waitFor(() => {
      expect(screen.getByText('Club: 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Creator: 1')).toBeInTheDocument()
  })
})
