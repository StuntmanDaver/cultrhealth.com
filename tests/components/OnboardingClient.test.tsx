import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import OnboardingClient from '@/app/onboarding/OnboardingClient'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const fetchMock = vi.fn()

describe('OnboardingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('promotes the first actionable step when onboarding is still at welcome', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        onboarding: {
          step: 'welcome',
          blood_test_ordered: false,
          intake_completed: false,
          appointment_scheduled: false,
        },
      }),
    })

    render(<OnboardingClient email="member@example.com" />)

    const continueLink = await screen.findByRole('link', { name: /continue/i })

    expect(screen.getByText('Blood Test Kit')).toBeInTheDocument()
    expect(continueLink).toHaveAttribute('href', '/members')
  })

  it('continues to intake after blood work is already ordered', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        onboarding: {
          step: 'intake',
          blood_test_ordered: true,
          intake_completed: false,
          appointment_scheduled: false,
        },
      }),
    })

    render(<OnboardingClient email="member@example.com" />)

    const continueLink = await screen.findByRole('link', { name: /continue/i })

    expect(screen.getByText('Medical Intake')).toBeInTheDocument()
    expect(continueLink).toHaveAttribute('href', '/intake')
  })
})
