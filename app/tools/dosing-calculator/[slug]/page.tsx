import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ChevronRight, Syringe, ShieldCheck, Sparkles } from 'lucide-react'
import {
  PRESET_PAGES,
  getPresetPageBySlug,
  type PresetPageContent,
} from './preset-content'
import { PublicDosingCalculatorClient } from '../PublicDosingCalculatorClient'
import { FAQAccordion } from '@/components/site/FAQAccordion'
import Button from '@/components/ui/Button'

const SITE_URL = 'https://www.cultrhealth.com'
const PARENT_URL = `${SITE_URL}/tools/dosing-calculator`

interface PageProps {
  params: { slug: string }
}

// ── Static generation — every preset becomes its own indexable URL ────────
export function generateStaticParams() {
  return PRESET_PAGES.map((p) => ({ slug: p.slug }))
}

// ── Per-preset metadata ───────────────────────────────────────────────────
export function generateMetadata({ params }: PageProps): Metadata {
  const content = getPresetPageBySlug(params.slug)
  if (!content) return { title: 'Peptide Calculator | CULTR Health' }

  const url = `${PARENT_URL}/${content.slug}`

  return {
    title: content.title,
    description: content.metaDescription,
    alternates: { canonical: url },
    keywords: [
      `${content.displayName.toLowerCase()} calculator`,
      `${content.displayName.toLowerCase()} dose calculator`,
      `${content.displayName.toLowerCase()} reconstitution`,
      `${content.displayName.toLowerCase()} dosing`,
      `${content.displayName.toLowerCase()} U-100 syringe`,
      'peptide calculator',
      'bacteriostatic water calculator',
    ],
    openGraph: {
      title: content.title,
      description: content.metaDescription,
      url,
      type: 'website',
      siteName: 'CULTR Health',
      images: [
        {
          url: '/images/hero-cultr-diverse-women.png',
          width: 1536,
          height: 1024,
          alt: 'CULTR Health — Peptide protocols supervised by licensed providers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.metaDescription,
      images: ['/images/hero-cultr-diverse-women.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  }
}

// ── JSON-LD schema generators ─────────────────────────────────────────────

function buildSoftwareSchema(c: PresetPageContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `CULTR ${c.displayName} Calculator`,
    alternateName: [`${c.displayName} Reconstitution Calculator`, `${c.displayName} Dose Calculator`],
    description: c.metaDescription,
    applicationCategory: 'MedicalApplication',
    operatingSystem: 'Web',
    url: `${PARENT_URL}/${c.slug}`,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'MedicalOrganization', name: 'CULTR Health', url: SITE_URL },
  }
}

function buildFaqSchema(c: PresetPageContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function buildBreadcrumbSchema(c: PresetPageContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: 'Peptide Calculator', item: PARENT_URL },
      { '@type': 'ListItem', position: 4, name: `${c.displayName} Calculator`, item: `${PARENT_URL}/${c.slug}` },
    ],
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PresetCalculatorPage({ params }: PageProps) {
  const content = getPresetPageBySlug(params.slug)
  if (!content) notFound()

  const ex = content.workedExample
  const related = content.related
    .map((slug) => PRESET_PAGES.find((p) => p.slug === slug))
    .filter((p): p is PresetPageContent => p !== undefined)

  return (
    <main className="flex flex-col grad-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSoftwareSchema(content)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(content)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(content)) }} />

      {/* Breadcrumb — mirrors BreadcrumbList schema */}
      <nav aria-label="Breadcrumb" className="px-6 pt-6 max-w-6xl mx-auto w-full">
        <ol className="flex items-center gap-2 text-sm text-cultr-textMuted flex-wrap">
          <li><Link href="/" className="hover:text-cultr-forest transition-colors">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
          <li><Link href="/tools" className="hover:text-cultr-forest transition-colors">Tools</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
          <li>
            <Link href="/tools/dosing-calculator" className="hover:text-cultr-forest transition-colors">
              Peptide Calculator
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-cultr-forest font-medium" aria-current="page">{content.displayName}</li>
        </ol>
      </nav>

      {/* Hero — preset-specific keyword target */}
      <section className="px-6 pt-8 pb-10 max-w-4xl mx-auto w-full text-center">
        <span className="inline-block text-[11px] uppercase tracking-wider text-cultr-forest/70 font-medium mb-3">
          {content.categoryLabel} · Reconstitution Calculator
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-cultr-forest leading-tight mb-4">
          {content.displayName} Calculator
        </h1>
        <p className="text-lg md:text-xl font-display text-cultr-forest/70 mb-5">
          {content.compound}
        </p>
        <p className="text-base md:text-lg text-cultr-textMuted mb-3 max-w-2xl mx-auto">
          {content.subtitle}
        </p>
        <p className="text-base md:text-lg text-cultr-textMuted leading-relaxed max-w-2xl mx-auto mb-8">
          {content.intro}
        </p>
        <ul className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm">
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Built by licensed providers
          </li>
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Free forever
          </li>
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <Syringe className="w-3.5 h-3.5" /> Preset loaded
          </li>
        </ul>
      </section>

      {/* Calculator pre-loaded with preset.
       * `key` forces React to remount the client component on client-side
       * navigation between preset pages — without it, useState initializers
       * keep the previous slug's values. */}
      <section aria-label={`Interactive ${content.displayName} dosing calculator`}>
        <h2 className="sr-only">Interactive {content.displayName} reconstitution and dose calculator</h2>
        <Suspense fallback={null}>
          <PublicDosingCalculatorClient
            key={content.presetId}
            backHref="/tools/dosing-calculator"
            initialPresetId={content.presetId}
          />
        </Suspense>
      </section>

      {/* Worked example — concrete numbers for this peptide */}
      <section className="px-6 py-16 md:py-20 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
          Worked example — {content.displayName} {ex.doseLabel}
        </h2>
        <p className="text-cultr-textMuted mb-8 max-w-2xl">
          A typical reconstitution and dose calculation for {content.displayName}, with every variable
          spelled out. The calculator above runs the same math live as you change inputs.
        </p>
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-cultr-textMuted mb-1">Vial strength</dt>
              <dd className="font-display text-xl text-cultr-forest font-semibold">{ex.vialMg} mg</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-cultr-textMuted mb-1">Bacteriostatic water</dt>
              <dd className="font-display text-xl text-cultr-forest font-semibold">{ex.waterMl} mL</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-cultr-textMuted mb-1">Concentration</dt>
              <dd className="font-display text-xl text-cultr-forest font-semibold">{ex.concentrationMgPerMl.toFixed(2)} mg/mL</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-cultr-textMuted mb-1">Dose volume</dt>
              <dd className="font-display text-xl text-cultr-forest font-semibold">{ex.doseMl} mL · {ex.units} units</dd>
            </div>
          </dl>
          <p className="text-cultr-textMuted leading-relaxed text-sm md:text-base">{ex.explanation}</p>
        </div>
      </section>

      {/* FAQ — peptide-specific */}
      <section className="px-6 py-16 md:py-20 grad-light border-y border-cultr-sage">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3 text-center">
            {content.displayName} dosing FAQs
          </h2>
          <p className="text-cultr-textMuted mb-10 text-center max-w-2xl mx-auto">
            Answers to the questions patients and clinicians ask most often about {content.displayName}.
          </p>
          <FAQAccordion items={content.faqs} />
        </div>
      </section>

      {/* Related peptide calculators — cross-link for topical authority */}
      {related.length > 0 && (
        <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto w-full">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-3 text-center">
            Related peptide calculators
          </h2>
          <p className="text-cultr-textMuted mb-10 text-center max-w-2xl mx-auto">
            Pre-loaded calculators for peptides commonly stacked or compared with {content.displayName}.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((peptide) => (
              <li key={peptide.slug}>
                <Link
                  href={`/tools/dosing-calculator/${peptide.slug}`}
                  className="glass-card rounded-2xl p-5 h-full flex flex-col group hover:border-cultr-forest/30 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="font-display text-lg font-semibold text-cultr-forest">
                      {peptide.displayName}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-cultr-forest/60 font-medium">
                      {peptide.categoryLabel}
                    </span>
                  </div>
                  <p className="text-sm text-cultr-textMuted mb-4">{peptide.compound}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm text-cultr-forest font-medium group-hover:gap-2 transition-all">
                    Open calculator <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="text-center mt-10">
            <Link href="/tools/dosing-calculator" className="text-sm text-cultr-forest hover:text-forest-light underline decoration-cultr-sage decoration-2 underline-offset-4">
              See all peptide calculators →
            </Link>
          </div>
        </section>
      )}

      {/* Final CTA — convert SEO traffic to consults */}
      <section className="px-6 py-16 md:py-20 grad-mint border-t border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
            Need a {content.displayName} protocol from a licensed provider?
          </h2>
          <p className="text-cultr-textMuted mb-8 leading-relaxed">
            The calculator handles the math. A licensed <span className="font-display font-medium">CULTR</span> Health
            provider reviews your goals, lab history, and current medications before prescribing a
            peptide protocol that fits you. Telehealth visits available across 30 U.S. states.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/quiz">
              <Button size="lg">
                Take the assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">View memberships</Button>
            </Link>
          </div>
          <p className="text-xs text-cultr-textMuted mt-6 max-w-lg mx-auto">
            This {content.displayName} calculator is an educational tool. It does not replace medical
            advice, prescription, or supervision. Compounded peptides are dispensed only by licensed
            503A and 503B pharmacies under a valid prescription.
          </p>
        </div>
      </section>
    </main>
  )
}
