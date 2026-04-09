import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import OrdersClient from '@/app/admin/orders/OrdersClient'

let currentTabParam: string | null = null

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'tab' ? currentTabParam : null),
  }),
}))

const mockFetch = vi.fn()

global.fetch = mockFetch

describe('OrdersClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentTabParam = null

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.startsWith('/api/admin/analytics')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              sales: {
                ordersByStatus: {
                  shipped: 1,
                },
                topProducts: [],
                recentOrders: [
                  {
                    id: 'club-order-1',
                    order_number: 'CLB-2001',
                    customer_email: 'member@example.com',
                    customer_name: 'Member Example',
                    status: 'shipped',
                    total_amount: 225,
                    source: 'club_orders',
                    created_at: '2026-04-01T00:00:00.000Z',
                    items: [],
                  },
                ],
              },
            },
          }),
        }
      }

      if (url.startsWith('/api/admin/orders')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              orders: [
                {
                  id: 'club-order-1',
                  order_number: 'CLB-2001',
                  customer_email: 'member@example.com',
                  customer_name: 'Member Example',
                  status: 'shipped',
                  total_amount: 225,
                  source: 'club_orders',
                  created_at: '2026-04-01T00:00:00.000Z',
                  items: [],
                },
              ],
              total: 1,
              totalPages: 1,
              page: 1,
            },
          }),
        }
      }

      if (url === '/api/admin/club-orders') {
        return {
          ok: true,
          json: async () => ({
            orders: [{ id: 'pending-club-order', status: 'pending_approval' }],
          }),
        }
      }

      return {
        ok: true,
        json: async () => ({}),
      }
    })
  })

  it('renames the club-orders tab and shows formatted shipped labels in the all-orders view', async () => {
    render(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /club orders/i })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /pending approval/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Shipped: 1')).toBeInTheDocument()
      expect(screen.getAllByText(/^Shipped$/).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByText('CLB-2001'))

    await waitFor(() => {
      expect(screen.getAllByText(/^Shipped$/).length).toBeGreaterThanOrEqual(2)
    })
  })

  it('syncs the active tab when the club-orders query param changes after mount', async () => {
    const { rerender } = render(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all orders/i }).className).toContain('bg-brand-primary')
    })

    currentTabParam = 'club-orders'
    rerender(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /club orders/i }).className).toContain('bg-brand-primary')
    })
  })
})
