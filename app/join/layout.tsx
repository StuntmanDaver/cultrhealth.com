import type { Viewport } from 'next'
import { PaymentProviderLoader } from '@/components/payments/PaymentProviderLoader'

// Lock viewport on join page — no pinch zoom, no double-tap zoom
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PaymentProviderLoader>
      {children}
    </PaymentProviderLoader>
  )
}
