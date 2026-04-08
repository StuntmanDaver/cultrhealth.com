import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { LibrarySidebarShell } from './LibrarySidebarShell'
import { getSession, isProviderEmail, getMembershipTier } from '@/lib/auth'
import type { PlanTier } from '@/lib/config/plans'

export const metadata: Metadata = {
  title: 'Members Area | CULTR Health',
  description: 'Access your member-only dashboard, tools, and resources.',
}

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const isProvider = session ? isProviderEmail(session.email) : false
  let tier: PlanTier | null = null
  if (session?.customerId) {
    tier = await getMembershipTier(session.customerId, session.email)
  }

  return (
    <CartProvider>
      <LibrarySidebarShell isProvider={isProvider} tier={tier}>
        {children}
      </LibrarySidebarShell>
    </CartProvider>
  )
}
