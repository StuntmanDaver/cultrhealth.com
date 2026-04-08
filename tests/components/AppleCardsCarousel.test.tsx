import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

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

vi.mock('framer-motion', () => {
  function createMotionTag(tag: keyof React.JSX.IntrinsicElements) {
    return React.forwardRef<
      HTMLElement,
      React.HTMLAttributes<HTMLElement> & {
        children?: React.ReactNode
      }
    >(
      (
        {
          children,
          layoutId: _layoutId,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...props
        },
        ref
      ) => React.createElement(tag, { ...props, ref }, children)
    )
  }

  return {
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: {
      div: createMotionTag('div'),
      span: createMotionTag('span'),
      h3: createMotionTag('h3'),
      h4: createMotionTag('h4'),
    },
  }
})

import { Card } from '@/components/ui/apple-cards-carousel'

describe('Card', () => {
  it('renders the COA as a second image in the expanded modal when provided', () => {
    render(
      <Card
        card={
          {
            src: '/images/products/nad-plus.png',
            secondarySrc: '/images/products/nad-plus-coa.png',
            title: 'NAD+',
            category: 'Enhancement',
            content: <p>Cellular energy support.</p>,
          } as React.ComponentProps<typeof Card>['card'] & { secondarySrc: string }
        }
        index={0}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /view details for nad\+/i }))

    expect(screen.getByRole('dialog', { name: 'NAD+' })).toBeInTheDocument()
    expect(screen.getByAltText('NAD+ COA')).toBeInTheDocument()
  })
})
