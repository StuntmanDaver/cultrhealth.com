import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import ClubOrdersTab from '@/app/admin/orders/ClubOrdersTab'

const mockFetch = vi.fn()

global.fetch = mockFetch

describe('ClubOrdersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        orders: [
          {
            id: 'club-order-1',
            order_number: 'CLB-1001',
            member_name: 'Member Example',
            member_email: 'member@example.com',
            member_phone: null,
            items: [],
            subtotal_usd: 225,
            notes: null,
            status: 'shipped',
            created_at: '2026-04-01T00:00:00.000Z',
            approved_at: '2026-04-01T00:00:00.000Z',
            paid_at: '2026-04-01T01:00:00.000Z',
            shipped_at: '2026-04-01T02:00:00.000Z',
            fulfilled_at: null,
            qb_invoice_id: null,
            qb_invoice_url: null,
            coupon_code: null,
            discount_percent: null,
            tracking_carrier: 'UPS',
            tracking_number: '1Z999',
            tracking_url: 'https://tracking.example',
            attributed_creator_id: null,
            attribution_method: null,
            creator_name: null,
          },
        ],
      }),
    }))
  })

  it('shows both Waiting to Ship and Shipped stages in the pipeline summary', async () => {
    render(<ClubOrdersTab />)

    await waitFor(() => {
      expect(screen.getAllByText('Shipped').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Waiting to Ship').length).toBeGreaterThan(0)
  })
})
