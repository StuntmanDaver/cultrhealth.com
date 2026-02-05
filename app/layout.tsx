import type { Metadata } from 'next'
import { Inter, Raleway, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
})

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  preload: false,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'CULTR — Join the Waitlist',
  description: 'Join the CULTR Health waitlist. Comprehensive lab testing, personalized protocols, and cutting-edge peptide therapies.',
  keywords: ['longevity', 'health optimization', 'hormone therapy', 'peptides', 'wellness', 'CULTR'],
  openGraph: {
    title: 'CULTR — Join the Waitlist',
    description: 'Join the CULTR Health waitlist for early access.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${raleway.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#2B4542] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
