import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LabsClient from '@/app/portal/labs/LabsClient'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/portal/labs',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('LabsClient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  it('shows loading skeleton on mount', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    const { container } = render(<LabsClient />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows Club empty state when tier is club', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ kitOrders: [], siphoxCustomerId: null, tier: 'club' }),
    })

    render(<LabsClient />)

    await waitFor(() => {
      expect(screen.getByText('Blood Testing Available on Paid Plans')).toBeTruthy()
    })
    expect(screen.getByText('View Plans')).toBeTruthy()
  })

  it('shows Core add-on CTA when tier is core and no kit orders', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ kitOrders: [], siphoxCustomerId: null, tier: 'core' }),
    })

    render(<LabsClient />)

    await waitFor(() => {
      expect(screen.getByText('Add Blood Testing to Your Plan')).toBeTruthy()
    })
    expect(screen.getByText('Add Blood Test Kit')).toBeTruthy()
  })

  it('shows timeline when kit orders exist', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kitOrders: [{ id: 1, lifecycleState: 'registered', tracking_number: null }],
        siphoxCustomerId: 'cust_123',
        tier: 'core',
      }),
    })

    const { container } = render(<LabsClient />)

    await waitFor(() => {
      expect(container.querySelector('[data-testid="timeline-step-registered"]')).toBeTruthy()
    })
  })

  it('shows registration form only when lifecycle state is shipped', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kitOrders: [{ id: 1, lifecycleState: 'shipped', tracking_number: 'TRACK123' }],
        siphoxCustomerId: 'cust_123',
        tier: 'core',
      }),
    })

    render(<LabsClient />)

    await waitFor(() => {
      expect(screen.getByText('Register Your Kit')).toBeTruthy()
    })
  })

  it('hides registration form when lifecycle state is ordered', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kitOrders: [{ id: 1, lifecycleState: 'ordered', tracking_number: null }],
        siphoxCustomerId: 'cust_123',
        tier: 'core',
      }),
    })

    render(<LabsClient />)

    await waitFor(() => {
      expect(screen.getByText('Blood Test Kit')).toBeTruthy()
    })
    expect(screen.queryByText('Register Your Kit')).toBeNull()
  })

  it('hides registration form when lifecycle state is registered', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kitOrders: [{ id: 1, lifecycleState: 'registered', tracking_number: null }],
        siphoxCustomerId: 'cust_123',
        tier: 'core',
      }),
    })

    render(<LabsClient />)

    await waitFor(() => {
      expect(screen.getByText('Blood Test Kit')).toBeTruthy()
    })
    expect(screen.queryByText('Register Your Kit')).toBeNull()
  })
})
