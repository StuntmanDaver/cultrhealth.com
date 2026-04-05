import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { JoinLandingClient } from '@/app/join/JoinLandingClient'

vi.mock('@/components/ui/apple-cards-carousel', () => ({
  Carousel: () => null,
  Card: () => null,
}))

type JsonResponse = {
  ok: boolean
  json: () => Promise<unknown>
}

const fetchMock = vi.fn<(input: string | URL | Request) => Promise<JsonResponse>>()

function createStorage() {
  const storage = new Map<string, string>()

  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
  }
}

function jsonResponse(body: unknown, ok = true): JsonResponse {
  return {
    ok,
    json: async () => body,
  }
}

function setJoinLocation() {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...window.location,
      hostname: 'join.cultrhealth.com',
      protocol: 'https:',
      pathname: '/',
      search: '',
    },
  })
}

describe('JoinLandingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('sessionStorage', createStorage())

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    })

    setJoinLocation()

    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.startsWith('/api/stock')) {
        return jsonResponse({ stock: {} })
      }

      if (url === '/api/club/event') {
        return jsonResponse({})
      }

      if (url === '/api/club/check-member') {
        return jsonResponse({ member: null }, false)
      }

      if (url.startsWith('/api/club/check-member?email=')) {
        return jsonResponse({ member: null })
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })
  })

  it('recovers the returning member before showing the re-authentication modal', async () => {
    localStorage.setItem('cultr_club_has_ordered', '1')

    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.startsWith('/api/stock')) {
        return jsonResponse({ stock: {} })
      }

      if (url === '/api/club/event') {
        return jsonResponse({})
      }

      if (url === '/api/club/check-member') {
        return jsonResponse({
          member: {
            firstName: 'Existing',
            lastName: 'Member',
            email: 'existing@example.com',
            phone: '555-111-2222',
            signupType: 'products',
          },
        })
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    render(<JoinLandingClient />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, Existing')).toBeInTheDocument()
    })

    expect(screen.queryByText('Re-authenticate to continue')).not.toBeInTheDocument()
  })

  it('switches existing member email lookups from signup into the login flow', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.startsWith('/api/stock')) {
        return jsonResponse({ stock: {} })
      }

      if (url === '/api/club/event') {
        return jsonResponse({})
      }

      if (url === '/api/club/check-member') {
        return jsonResponse({ member: null }, false)
      }

      if (url.startsWith('/api/club/check-member?email=')) {
        return jsonResponse({
          member: {
            firstName: 'Existing',
            exists: true,
          },
        })
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    render(<JoinLandingClient />)

    const emailInput = await screen.findByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Email')).toHaveValue('existing@example.com')
    expect(screen.queryByText('Join CULTR Club')).not.toBeInTheDocument()
  })
})
