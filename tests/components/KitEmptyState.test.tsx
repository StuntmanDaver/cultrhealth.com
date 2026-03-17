import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KitEmptyState } from '@/components/portal/KitEmptyState'

describe('KitEmptyState', () => {
  it('shows "View Plans" button linking to /pricing for club tier', () => {
    render(<KitEmptyState tier="club" hasKitOrder={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/pricing')
    expect(screen.getByText('View Plans')).toBeTruthy()
  })

  it('shows "Add Blood Test Kit" button for core tier without kit', () => {
    render(<KitEmptyState tier="core" hasKitOrder={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/join/core')
    expect(screen.getByText('Add Blood Test Kit')).toBeTruthy()
  })

  it('shows $199/mo in club tier text', () => {
    render(<KitEmptyState tier="club" hasKitOrder={false} />)
    expect(screen.getByText(/\$199\/mo/)).toBeTruthy()
  })

  it('shows $135 in core tier text', () => {
    render(<KitEmptyState tier="core" hasKitOrder={false} />)
    expect(screen.getByText(/\$135/)).toBeTruthy()
  })

  it('shows upgrade CTA for null tier', () => {
    render(<KitEmptyState tier={null} hasKitOrder={false} />)
    expect(screen.getByText('View Plans')).toBeTruthy()
  })

  it('shows fallback state for other tiers without kit order', () => {
    render(<KitEmptyState tier="catalyst" hasKitOrder={false} />)
    expect(screen.getByText('No Kit Order Found')).toBeTruthy()
  })
})
