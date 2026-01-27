import { Metadata } from 'next'
import { CartProvider } from '@/lib/cart-context'

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
      <div className="min-h-screen">
        {children}
      </div>
    </CartProvider>
  )
}
