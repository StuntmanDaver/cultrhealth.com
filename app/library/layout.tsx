import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { LibrarySidebarShell } from './LibrarySidebarShell'
import { getSession, isProviderEmail } from '@/lib/auth'

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

  return (
    <CartProvider>
      <LibrarySidebarShell isProvider={isProvider}>
        {children}
      </LibrarySidebarShell>
    </CartProvider>
  )
}
