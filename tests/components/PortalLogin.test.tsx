import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PortalLoginClient from '@/app/portal/login/PortalLoginClient'

// ===========================================
// MOCKS
// ===========================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/portal/login',
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock IntersectionObserver for ScrollReveal
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  observe(el: Element) {
    Promise.resolve().then(() => {
      this.callback(
        [{ target: el, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    })
  }
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
})

// ===========================================
// SETUP
// ===========================================

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ===========================================
// TESTS
// ===========================================

describe('PortalLoginClient', () => {
  describe('Initial Render', () => {
    it('renders email input and branding', async () => {
      render(<PortalLoginClient />)

      await waitFor(() => {
        expect(screen.getByText('Change the CULTR')).toBeInTheDocument()
        expect(screen.getByText('Access your portal')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
        expect(screen.getByText('Send Login Link')).toBeInTheDocument()
      })
    })

    it('submit button is disabled when email is empty', async () => {
      render(<PortalLoginClient />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /send login link/i })
        expect(button).toBeDisabled()
      })
    })

    it('submit button is enabled when email is entered', async () => {
      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
        const button = screen.getByRole('button', { name: /send login link/i })
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls magic-link API with email on submit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      })
    })

    it('shows success message after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument()
        expect(screen.getByText(/receive a login link shortly/)).toBeInTheDocument()
      })
    })

    it('shows "Use a different email" after success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Use a different email')).toBeInTheDocument()
      })
    })

    it('returns to form when "Use a different email" is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Use a different email')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Use a different email'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email address' }),
      })

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'bad@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('shows network error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<PortalLoginClient />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(input, { target: { value: 'test@example.com' } })
      })

      const form = screen.getByPlaceholderText('you@example.com').closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('has link to pricing page for non-members', async () => {
      render(<PortalLoginClient />)

      await waitFor(() => {
        expect(screen.getByText('Not a member?')).toBeInTheDocument()
        const link = screen.getByRole('link', { name: /join cultr/i })
        expect(link).toHaveAttribute('href', '/pricing')
      })
    })
  })

  describe('HIPAA Compliance Badge', () => {
    it('shows HIPAA-compliant badge', async () => {
      render(<PortalLoginClient />)

      await waitFor(() => {
        expect(screen.getByText('HIPAA-compliant secure access')).toBeInTheDocument()
      })
    })
  })
})
