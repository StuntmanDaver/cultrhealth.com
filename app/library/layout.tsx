import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'
import { LibrarySidebarShell } from './LibrarySidebarShell'

export const metadata: Metadata = {
  title: 'Peptide Library | CULTR Health',
  description: 'Access your member-only peptide reference library with detailed protocols, mechanisms, and safety information.',
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <LibrarySidebarShell>
        {children}
      </LibrarySidebarShell>
    </CartProvider>
  )
}
