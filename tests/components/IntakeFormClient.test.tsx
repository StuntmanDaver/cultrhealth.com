import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { IntakeFormClient } from '@/components/intake/IntakeFormClient'

const { mockPush, mockFetch } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('session_id=cs_test_intake_123'),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

vi.mock('@/lib/analytics', () => ({
  trackIntakeStart: vi.fn(),
  trackIntakeStep: vi.fn(),
  trackIntakeComplete: vi.fn(),
}))

describe('IntakeFormClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('routes successful submissions into onboarding with the preserved session id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<IntakeFormClient />)

    fireEvent.click(screen.getByRole('button', { name: /let's go/i }))

    await screen.findByText('What is your legal name?')
    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText('What is your best contact info?')
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('(555) 555-5555'), { target: { value: '(352) 555-0199' } })
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText('What is your Date of Birth & Gender?')
    fireEvent.change(document.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: '1988-06-15' },
    })
    fireEvent.click(screen.getByText('Female'))
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText('Where should we ship your protocol?')
    fireEvent.change(screen.getByPlaceholderText('456 Oak Ave'), { target: { value: '456 Oak Ave' } })
    fireEvent.change(screen.getByPlaceholderText('Suite 200'), { target: { value: 'Suite 200' } })
    fireEvent.change(screen.getByPlaceholderText('Gainesville'), { target: { value: 'Gainesville' } })
    fireEvent.change(screen.getByPlaceholderText('FL'), { target: { value: 'FL' } })
    fireEvent.change(screen.getByPlaceholderText('32601'), { target: { value: '32601' } })
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText('What are your physical measurements?')
    fireEvent.change(screen.getByPlaceholderText('5'), { target: { value: '5' } })
    fireEvent.change(screen.getByPlaceholderText('8'), { target: { value: '6' } })
    fireEvent.change(screen.getByPlaceholderText('165'), { target: { value: '155' } })
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText('What is your primary goal with CULTR?')
    fireEvent.click(screen.getByText('Weight Loss & Metabolic Health'))
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText(/Patient Email and Text Message Informed Consent/i)
    fireEvent.click(screen.getByText('I agree'))
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText(/Authorization For Use Or Disclosure Of Health Information/i)
    fireEvent.click(screen.getByText('I accept'))
    fireEvent.click(screen.getByRole('button', { name: /^ok/i }))

    await screen.findByText(/Telehealth Informed Consent and Notice of Privacy Practices/i)
    fireEvent.click(screen.getByText('I acknowledge and accept'))
    fireEvent.click(screen.getByRole('button', { name: /submit intake/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    })

    expect(JSON.parse(mockFetch.mock.calls[0][1].body as string)).toMatchObject({
      stripeSessionId: 'cs_test_intake_123',
      email: 'jane@example.com',
      telehealthConsent: true,
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding?session_id=cs_test_intake_123&next=schedule')
    })
  })
})
