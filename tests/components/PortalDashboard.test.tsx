// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/portal/dashboard',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock portal-orders module
vi.mock('@/lib/portal-orders', () => ({
  getStatusDisplay: (status: string) => ({
    label: status === 'PENDING' ? 'Submitted' : status === 'APPROVED' ? 'Approved' : 'Fulfilled',
    explanation: 'Test explanation text.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  }),
  isActiveStatus: (status: string) => ['PENDING', 'APPROVED', 'WaitingRoom'].includes(status),
  ACTIVE_STATUSES: ['PENDING', 'APPROVED', 'WaitingRoom'],
}))

const mockOrders = [
  {
    id: 101,
    status: 'PENDING',
    orderType: 'new_patient',
    doctorId: null,
    partnerNote: null,
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
    medicationName: 'Semaglutide',
  },
  {
    id: 100,
    status: 'COMPLETED',
    orderType: 'refill',
    doctorId: 42,
    partnerNote: 'Dose adjusted',
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
    medicationName: 'Tirzepatide',
  },
]

const prefillResponse = {
  ok: true,
  json: async () => ({ success: true, prefill: { supply: null, renewalEligible: false } }),
}

function mockFetchForOrders(ordersResponse: any) {
  global.fetch = vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/api/portal/prefill')) {
      return Promise.resolve(prefillResponse)
    }
    return Promise.resolve(ordersResponse)
  }) as any
}

let DashboardClient: any

beforeEach(async () => {
  vi.resetModules()
  global.fetch = vi.fn(() => Promise.resolve(prefillResponse)) as any
  // Dynamic import to pick up fresh mocks
  const mod = await import('@/app/portal/dashboard/DashboardClient')
  DashboardClient = mod.default
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PortalDashboard', () => {
  it('renders hero card when orders exist', async () => {
    mockFetchForOrders({
      ok: true,
      json: async () => ({ success: true, orders: mockOrders }),
    })

    render(<DashboardClient />)

    await waitFor(() => {
      expect(screen.getByText('Semaglutide')).toBeInTheDocument()
    })
    // Status badge
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders empty state when no orders', async () => {
    mockFetchForOrders({
      ok: true,
      json: async () => ({ success: true, orders: [] }),
    })

    render(<DashboardClient />)

    await waitFor(() => {
      expect(screen.getByText('Welcome to CULTR Health!')).toBeInTheDocument()
    })
    expect(screen.getByText(/Start your journey/)).toBeInTheDocument()
  })

  it('renders quick links in all states', async () => {
    mockFetchForOrders({
      ok: true,
      json: async () => ({ success: true, orders: [] }),
    })

    render(<DashboardClient />)

    await waitFor(() => {
      expect(screen.getByText('Start Intake')).toBeInTheDocument()
    })
    expect(screen.getByText('Manage Subscription')).toBeInTheDocument()
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
  })

  it('renders quick links when orders exist', async () => {
    mockFetchForOrders({
      ok: true,
      json: async () => ({ success: true, orders: mockOrders }),
    })

    render(<DashboardClient />)

    await waitFor(() => {
      expect(screen.getByText('Start Intake')).toBeInTheDocument()
    })
    expect(screen.getByText('Manage Subscription')).toBeInTheDocument()
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
  })

  it('renders loading skeletons initially', () => {
    // Never resolve fetch for orders, prefill resolves normally
    global.fetch = vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/api/portal/prefill')) {
        return Promise.resolve(prefillResponse)
      }
      return new Promise(() => {}) // never resolve orders
    }) as any

    const { container } = render(<DashboardClient />)

    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('renders error state when fetch fails', async () => {
    mockFetchForOrders({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Server error' }),
    })

    render(<DashboardClient />)

    await waitFor(() => {
      expect(screen.getByText(/Unable to load your orders/)).toBeInTheDocument()
    })
  })
})
