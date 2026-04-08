import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, within } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean
    priority?: boolean
    sizes?: string
  }) => <img alt={alt} src={src} {...props} />,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicStub = () => null
    return DynamicStub
  },
}))

vi.mock('@/components/ui/ScrollReveal', () => ({
  ScrollReveal: ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
}))

import HomePage from '@/app/page'

describe('HomePage hero', () => {
  it('renders the desktop hero slogan only once', () => {
    const { container } = render(<HomePage />)
    const desktopHero = container.querySelectorAll('section')[1]
    const strayDesktopSlogan = within(desktopHero as HTMLElement).queryAllByText(
      (_content, element) =>
        element?.textContent?.replace(/\s+/g, ' ').trim() ===
        'Change the CULTR, rebrand yourself.'
    )

    expect(desktopHero).toBeTruthy()
    expect(strayDesktopSlogan).toHaveLength(0)
  })
})
