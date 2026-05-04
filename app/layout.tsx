import type { Metadata } from 'next'
import { Fraunces, Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { LayoutShell } from '@/components/site/LayoutShell'
import { MeshBackgroundDynamic } from '@/components/ui/MeshBackgroundDynamic'
import { VisitorTracker } from '@/components/site/VisitorTracker'

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
    images: [{ url: `${siteUrl}/images/hero-cultr-diverse-women.png`, width: 1536, height: 1024, alt: 'CULTR Health — Five diverse women in athletic wear' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change the CULTR, rebrand yourself.',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
    images: [`${siteUrl}/images/hero-cultr-diverse-women.png`],
  },
  // Google Search Console verification (set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in env)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'CULTR Health',
    url: 'https://www.cultrhealth.com',
    logo: 'https://www.cultrhealth.com/cultr-health-logo.png',
    description: 'Personalized longevity medicine with comprehensive lab testing, peptide protocols, and provider-supervised hormone optimization.',
    medicalSpecialty: 'Preventive Medicine',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@cultrhealth.com',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    sameAs: [],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CULTR Health',
    url: 'https://www.cultrhealth.com',
    description: 'Personalized longevity medicine, peptide therapy, and health optimization.',
    publisher: {
      '@type': 'Organization',
      name: 'CULTR Health',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${playfair.variable} ${inter.variable}`}>
      <head>
        {/* DNS prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://cdn.curator.io" />
        <link rel="dns-prefetch" href="https://js-na2.hs-scripts.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://elu.dev" />
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
        {/* HubSpot */}
        <Script
          id="hs-script-loader"
          src="//js-na2.hs-scripts.com/245823955.js"
          strategy="afterInteractive"
        />
        {/* elu.dev */}
        <Script
          src="https://elu.dev/v1/elu_pk_live_RPBByTMyAcOUv729PqVnAoogZp.js"
          strategy="afterInteractive"
        />
        {/* Microsoft Clarity */}
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wftg6won35");`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-brand-cream text-brand-primary selection:bg-brand-primary selection:text-brand-cream font-body">
        <MeshBackgroundDynamic />
        <VisitorTracker />
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  )
}
