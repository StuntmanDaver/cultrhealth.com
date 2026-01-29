import type { Metadata } from 'next'
import { Fraunces, Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { PaymentProviderLoader } from '@/components/payments/PaymentProviderLoader'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

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
