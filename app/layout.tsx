import type { Metadata } from 'next'
import { Questrial, Quattrocento } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'

const questrial = Questrial({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const quattrocento = Quattrocento({
  weight: ['400', '700'],
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
    <html lang="en" className={`${questrial.variable} ${quattrocento.variable}`}>
      <body className="min-h-screen bg-white text-cultr-text selection:bg-cultr-forest selection:text-white">
        <Header />
        <main className="pt-20 min-h-[calc(100vh-80px)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
