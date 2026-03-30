import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { LibrarySidebarShell } from './LibrarySidebarShell'
import { getSession, isProviderEmail, getMembershipTier } from '@/lib/auth'
import type { PlanTier } from '@/lib/config/plans'

export const metadata: Metadata = {
  title: 'Peptide Library | CULTR Health',
  description: 'Access your member-only peptide reference library with detailed protocols, mechanisms, and safety information.',
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
