import type { Metadata } from 'next'
import { Fraunces, Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { PaymentProviderLoader } from '@/components/payments/PaymentProviderLoader'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CULTR Health — Optimize Your Longevity',
  description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health. Data-driven health optimization for peak performance.',
  keywords: ['longevity', 'health optimization', 'hormone therapy', 'diagnostic labs', 'TRT', 'wellness', 'CULTR'],
  openGraph: {
    title: 'CULTR Health — Optimize Your Longevity',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-brand-cream text-brand-primary selection:bg-brand-primary selection:text-brand-cream font-body">
        <PaymentProviderLoader>
          <Header />
          <main className="pt-20 min-h-[calc(100vh-80px)]">
            {children}
          </main>
          <Footer />
        </PaymentProviderLoader>
      </body>
    </html>
  )
}
