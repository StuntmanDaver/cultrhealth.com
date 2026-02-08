import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TierGate } from '@/components/library/TierGate'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('TierGate Component', () => {
  describe('Access granted', () => {
    it('renders children when user tier meets required tier', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="catalyst"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Upgrade to access')).not.toBeInTheDocument()
    })

    it('renders children when user tier exceeds required tier', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="club"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Upgrade to access')).not.toBeInTheDocument()
    })

    it('grants access to Concierge for Catalyst+-required content', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="concierge"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('grants access to Club for Concierge-required content', () => {
      render(
        <TierGate
          requiredTier="concierge"
          currentTier="club"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Access denied', () => {
    it('shows upgrade message when user tier is below required tier', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="core"
          upgradeMessage="Upgrade to Catalyst+ to unlock"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to Catalyst+ to unlock')).toBeInTheDocument()
    })

    it('shows upgrade button linking to pricing', () => {
      render(
        <TierGate
          requiredTier="concierge"
          currentTier="catalyst"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      const upgradeButton = screen.getByRole('link', { name: /upgrade/i })
      expect(upgradeButton).toBeInTheDocument()
      expect(upgradeButton).toHaveAttribute('href', '/pricing')
    })

    it('denies Core users access to Catalyst+ content', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier="core"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to access')).toBeInTheDocument()
    })

    it('denies Catalyst+ users access to Concierge content', () => {
      render(
        <TierGate
          requiredTier="concierge"
          currentTier="catalyst"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to access')).toBeInTheDocument()
    })

    it('denies Concierge users access to Club content', () => {
      render(
        <TierGate
          requiredTier="club"
          currentTier="concierge"
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to access')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles null currentTier as Core', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier={null}
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to access')).toBeInTheDocument()
    })

    it('handles undefined currentTier as Core', () => {
      render(
        <TierGate
          requiredTier="catalyst"
          currentTier={undefined}
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByText('Upgrade to access')).toBeInTheDocument()
    })

    it('grants access when null tier meets Core requirement', () => {
      render(
        <TierGate
          requiredTier="core"
          currentTier={null}
          upgradeMessage="Upgrade to access"
        >
          <div data-testid="protected-content">Protected Content</div>
        </TierGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Tier hierarchy', () => {
    const tiers = ['core', 'catalyst', 'concierge', 'club'] as const

    it('respects tier ordering for access control', () => {
      // Each tier should have access to its own level and below
      for (let i = 0; i < tiers.length; i++) {
        for (let j = 0; j <= i; j++) {
          const { unmount } = render(
            <TierGate
              requiredTier={tiers[j]}
              currentTier={tiers[i]}
              upgradeMessage="Upgrade"
            >
              <div data-testid="content">Content</div>
            </TierGate>
          )
          
          expect(
            screen.getByTestId('content'),
            `${tiers[i]} should have access to ${tiers[j]} content`
          ).toBeInTheDocument()
          
          unmount()
        }
      }
    })
  })
})
