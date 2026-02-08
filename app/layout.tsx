import type { Metadata } from 'next'
import { Fraunces, Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { LayoutShell } from '@/components/site/LayoutShell'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Optimize font loading - only load needed weights/subsets
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
  preload: true,
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CULTR Health — Optimize Your Longevity',
    template: '%s — CULTR Health',
  },
  description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health. Data-driven health optimization for peak performance.',
  keywords: ['longevity', 'health optimization', 'hormone therapy', 'diagnostic labs', 'TRT', 'wellness', 'CULTR'],
  openGraph: {
    title: 'Change the CULTR, rebrand yourself.',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
    url: siteUrl,
    siteName: 'CULTR Health',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change the CULTR, rebrand yourself.',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Google Search Console verification (set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in env)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-brand-cream text-brand-primary selection:bg-brand-primary selection:text-brand-cream font-body">
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  )
}
