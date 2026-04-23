import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import OrdersClient from '@/app/admin/orders/OrdersClient'

let currentTabParam: string | null = null

// A stable reference per render cycle prevents the URL→typeFilter sync effect
// from firing on every re-render and resetting state back to 'all' after clicks.
// Tests that simulate URL-driven tab changes must call refreshSearchParams()
// before rerender() to produce a new reference that triggers the effect.
let stableSearchParams = { get: (key: string) => (key === 'tab' ? currentTabParam : null) }
function refreshSearchParams() {
  stableSearchParams = { get: (key: string) => (key === 'tab' ? currentTabParam : null) }
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => stableSearchParams,
}))

const mockFetch = vi.fn()

global.fetch = mockFetch

// Minimal mock for ClubOrdersTab — it renders independently and manages its own state.
// We stub its fetch responses so it doesn't interfere with OrdersClient assertions.
const makeAnalyticsResponse = () => ({
  ok: true,
  json: async () => ({
    data: {
      sales: {
        ordersByStatus: { shipped: 1 },
        topProducts: [],
        recentOrders: [],
      },
    },
  }),
})

const makeOrdersResponse = (orders = []) => ({
  ok: true,
  json: async () => ({
    data: { orders, total: orders.length, totalPages: 1, page: 1 },
  }),
})

const makeClubOrdersResponse = (orders: { id: string; status: string }[]) => ({
  ok: true,
  json: async () => ({ orders }),
})

describe('OrdersClient', () => {
  let pendingOrders: { id: string; status: string }[]

  beforeEach(() => {
    vi.clearAllMocks()
    currentTabParam = null
    refreshSearchParams()
    pendingOrders = [{ id: 'pending-club-order', status: 'pending_approval' }]

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('/api/admin/analytics')) return makeAnalyticsResponse()
      if (url.startsWith('/api/admin/orders')) return makeOrdersResponse()
      if (url.startsWith('/api/admin/club-orders')) return makeClubOrdersResponse(pendingOrders)
      return { ok: true, json: async () => ({}) }
    })
  })

  it('shows type filter pills and formatted status labels; club orders are excluded from the product table', async () => {
    render(<OrdersClient />)

    // All three filter pills are present
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all orders/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /club orders/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /product orders/i })).toBeInTheDocument()
    })

    // No legacy "Pending Approval" filter pill
    expect(screen.queryByRole('button', { name: /pending approval/i })).not.toBeInTheDocument()

    // Switch to Product Orders tab — analytics only renders in that view
    fireEvent.click(screen.getByRole('button', { name: /product orders/i }))

    // Analytics section renders the status from analytics API
    await waitFor(() => {
      expect(screen.getByText('Shipped: 1')).toBeInTheDocument()
    })

    // Club orders (source: club_orders) must not appear in the product order search table
    expect(screen.queryByText('CLB-2001')).not.toBeInTheDocument()
  })

  it('activates the Club Orders pill when ?tab=club-orders is set on mount', async () => {
    currentTabParam = 'club-orders'
    render(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /club orders/i }).className).toContain('bg-brand-primary')
    })
  })

  it('syncs the active pill when the club-orders query param changes after mount', async () => {
    const { rerender } = render(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all orders/i }).className).toContain('bg-brand-primary')
    })

    currentTabParam = 'club-orders'
    refreshSearchParams()
    rerender(<OrdersClient />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /club orders/i }).className).toContain('bg-brand-primary')
    })
  })

  it('shows and clears the pending count badge on the Club Orders pill via onPendingCountChange', async () => {
    render(<OrdersClient />)

    // ClubOrdersTab fetches and calls onPendingCountChange(1) → badge appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /club orders/i }).textContent).toContain('1')
    })

    // Simulate ClubOrdersTab reporting 0 pending (e.g. after approval)
    pendingOrders = []
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('/api/admin/analytics')) return makeAnalyticsResponse()
      if (url.startsWith('/api/admin/orders')) return makeOrdersResponse()
      if (url.startsWith('/api/admin/club-orders')) return makeClubOrdersResponse([])
      return { ok: true, json: async () => ({}) }
    })

    // Click refresh inside ClubOrdersTab (the Refresh button)
    const refreshBtn = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^club orders$/i }).textContent).toBe('Club Orders')
    })
  })
})
