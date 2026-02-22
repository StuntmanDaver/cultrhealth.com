import type { Metadata } from 'next'
import { Inter, Raleway, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CultrBackground } from '@/components/CultrBackground'

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
  metadataBase: new URL('https://www.cultrhealth.com'),
  title: {
    default: 'CULTR Health — Personalized Longevity & Peptide Therapy',
    template: '%s | CULTR Health',
  },
  description: 'CULTR Health offers personalized longevity medicine, comprehensive lab testing, peptide protocols, and provider-supervised hormone optimization. HSA/FSA eligible.',
  keywords: ['longevity medicine', 'peptide therapy', 'health optimization', 'hormone therapy', 'telehealth', 'semaglutide', 'tirzepatide', 'lab testing', 'CULTR Health'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CULTR Health — Personalized Longevity & Peptide Therapy',
    description: 'Personalized longevity medicine with comprehensive labs, peptide protocols, and provider-supervised care. Memberships from $99/mo.',
    type: 'website',
    siteName: 'CULTR Health',
    locale: 'en_US',
    url: 'https://www.cultrhealth.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CULTR Health — Personalized Longevity Medicine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CULTR Health — Personalized Longevity & Peptide Therapy',
    description: 'Personalized longevity medicine with comprehensive labs, peptide protocols, and provider-supervised care.',
    images: ['/og-image.png'],
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
    logo: 'https://www.cultrhealth.com/cultr-logo-black.png',
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
    <html lang="en" className={`${inter.variable} ${raleway.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#2B4542] text-white antialiased">
        <CultrBackground />
        <div className="relative z-[1]">
          {children}
        </div>
      </body>
    </html>
  )
}
