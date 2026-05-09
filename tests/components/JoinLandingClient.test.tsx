import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { JoinLandingClient } from '@/app/join/JoinLandingClient'

vi.mock('@/components/ui/apple-cards-carousel', () => ({
  Carousel: () => null,
  Card: ({ card, onAdd }: { card: { title: string }; onAdd?: () => void }) => (
    <button type="button" onClick={onAdd}>
      Add {card.title}
    </button>
  ),
}))

type JsonResponse = {
  ok: boolean
  json: () => Promise<unknown>
}

const fetchMock = vi.fn<
  (input: string | URL | Request, init?: RequestInit) => Promise<JsonResponse>
>()

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
      hostname: 'cultrhealth.com',
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

  it('omits raw email from signup tracking payloads', async () => {
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

      if (url === '/api/club/signup') {
        return jsonResponse({
          success: true,
          memberId: '11111111-1111-1111-1111-111111111111',
        })
      }

      throw new Error(`Unexpected fetch: ${url}`)
    })

    render(<JoinLandingClient />)

    const firstNameInput = await screen.findByPlaceholderText('First Name')
    fireEvent.change(firstNameInput, { target: { value: 'Taylor' } })
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Member' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '555-222-3333' } })
    fireEvent.change(screen.getByPlaceholderText('Street Address'), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Miami' } })
    fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'FL' } })
    fireEvent.change(screen.getByPlaceholderText('ZIP'), { target: { value: '33101' } })
    fireEvent.change(screen.getByPlaceholderText('Your age'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Female' }))
    fireEvent.click(screen.getByRole('button', { name: 'Products' }))
    fireEvent.click(screen.getByRole('button', { name: 'Join Free & Start Shopping' }))

    await waitFor(() => {
      expect(screen.getByText('Welcome, Taylor')).toBeInTheDocument()
    })

    const signupEventCall = fetchMock.mock.calls.find(([input, init]) => {
      if (String(input) !== '/api/club/event' || !init?.body) {
        return false
      }

      const payload = JSON.parse(String(init.body)) as {
        eventType?: string
      }

      return payload.eventType === 'signup'
    })

    expect(signupEventCall).toBeDefined()

    const signupPayload = JSON.parse(
      String((signupEventCall?.[1] as RequestInit | undefined)?.body)
    ) as {
      eventData?: Record<string, unknown>
    }

    expect(signupPayload.eventData).toEqual({
      signupType: 'products',
    })
    expect(signupPayload.eventData).not.toHaveProperty('email')

    const storedSession = JSON.parse(localStorage.getItem('cultr_club_member') || '{}') as Record<string, unknown>
    expect(storedSession).toEqual({
      email: 'taylor@example.com',
      firstName: 'Taylor',
      lastName: 'Member',
      signupType: 'products',
    })
    expect(storedSession).not.toHaveProperty('phone')
    expect(storedSession).not.toHaveProperty('address')
  })

  it('notifies first-time customers that the checkout discount is automatic', async () => {
    render(
      <JoinLandingClient
        serverMember={{
          firstName: 'Taylor',
          lastName: 'Member',
          email: 'taylor@example.com',
          phone: '555-222-3333',
          socialHandle: '',
          signupType: 'products',
          firstPurchaseDiscountEligible: true,
        }}
      />
    )

    fireEvent.click(await screen.findByRole('button', { name: /Add Semaglutide/ }))

    expect(screen.getByText("You're getting 10% off your first purchase for being a new customer.")).toBeInTheDocument()
    expect(screen.getByText('It will not stack with another coupon code.')).toBeInTheDocument()
    expect(screen.getByText('New customer discount (10% off)')).toBeInTheDocument()
  })
})
