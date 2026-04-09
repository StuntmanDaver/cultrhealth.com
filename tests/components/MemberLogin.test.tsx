import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import LoginPage from '@/app/login/page'

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Member login page', () => {
  it('renders the official logo and concise member login copy', async () => {
    render(<LoginPage />)

    await waitFor(() => {
      expect(screen.getByAltText('CULTR Health')).toBeInTheDocument()
      expect(screen.getByText('Member Login')).toBeInTheDocument()
      expect(screen.getByText('Use your email to receive a secure sign-in link.')).toBeInTheDocument()
    })
  })
})
