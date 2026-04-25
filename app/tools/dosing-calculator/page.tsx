import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ChevronRight, ExternalLink, ShieldCheck, Stethoscope, Syringe, Sparkles } from 'lucide-react'
import { PublicDosingCalculatorClient } from './PublicDosingCalculatorClient'
import {
  CALCULATOR_FAQS,
  CALCULATOR_REFERENCES,
  CROSS_SELL_PEPTIDES,
  HOW_TO_STEPS,
} from './seo-content'
import { FAQAccordion } from '@/components/site/FAQAccordion'
import Button from '@/components/ui/Button'

const PAGE_URL = 'https://www.cultrhealth.com/tools/dosing-calculator'
const SITE_URL = 'https://www.cultrhealth.com'

export const metadata: Metadata = {
  title: 'Peptide Calculator | Free Reconstitution & Dose Tool',
  description:
    'Free peptide reconstitution calculator with visual U-100 syringe meter. Calculate exact dose, vial strength, and bacteriostatic water volume for BPC-157, Semaglutide, GLP-1s, and 30+ peptides. Built by licensed CULTR Health providers.',
  alternates: { canonical: PAGE_URL },
  keywords: [
    'peptide calculator',
    'peptide reconstitution calculator',
    'peptide dose calculator',
    'bacteriostatic water calculator',
    'BAC water calculator',
    'BPC-157 dose calculator',
    'semaglutide reconstitution',
    'tirzepatide dosing',
    'GLP-1 calculator',
    'U-100 insulin syringe',
    'peptide dosing tool',
  ],
  openGraph: {
    title: 'Peptide Calculator — Free Reconstitution & Dose Tool',
    description:
      'Calculate exact peptide doses with a visual U-100 syringe meter. Built by licensed CULTR Health providers. Supports BPC-157, Semaglutide, Tirzepatide, TB-500, GHK-Cu, and 30+ peptides.',
    url: PAGE_URL,
    type: 'website',
    siteName: 'CULTR Health',
    // Falls back to the site-default hero image until a dedicated 1200×630 OG
    // image is shipped to public/images/og-peptide-calculator.png. Next.js
    // replaces the layout's `openGraph` entirely when a page provides one,
    // so the image must be re-declared here — it is not inherited.
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
    title: 'Free Peptide Calculator — Reconstitution & Dose Tool',
    description:
      'Visual U-100 syringe meter. Built by licensed providers. Supports 30+ peptides including BPC-157, Semaglutide, Tirzepatide.',
    images: ['/images/hero-cultr-diverse-women.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

// ─── JSON-LD schema generators ────────────────────────────────────────────

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CULTR Peptide Calculator',
  alternateName: ['Peptide Reconstitution Calculator', 'Peptide Dose Calculator'],
  description:
    'Free peptide reconstitution and dosing calculator with a visual U-100 insulin syringe meter. Computes vial concentration, dose volume, and weight-based dosing for 30+ peptide presets including BPC-157, Semaglutide, Tirzepatide, TB-500, and GHK-Cu.',
  applicationCategory: 'MedicalApplication',
  operatingSystem: 'Web',
  url: PAGE_URL,
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Visual U-100 insulin syringe meter',
    'Reconstitution math (mg → mL → units conversion)',
    '30+ therapy presets across GLP-1, repair, longevity, growth, blends, and sexual wellness',
    'Weight-based dose calculation (mcg/kg and mg/kg)',
    'Multi-vial protocol planning with therapy length and frequency',
    'Shareable URLs that pre-fill the calculator',
    'Capacity warnings when dose exceeds syringe volume',
  ],
  provider: {
    '@type': 'MedicalOrganization',
    name: 'CULTR Health',
    url: SITE_URL,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: CALCULATOR_FAQS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Reconstitute a Peptide for Subcutaneous Injection',
  description:
    'Step-by-step instructions for safely reconstituting a lyophilized peptide vial with bacteriostatic water for subcutaneous self-injection.',
  totalTime: 'PT5M',
  supply: [
    { '@type': 'HowToSupply', name: 'Lyophilized peptide vial' },
    { '@type': 'HowToSupply', name: 'Bacteriostatic water for injection' },
    { '@type': 'HowToSupply', name: 'U-100 insulin syringe' },
    { '@type': 'HowToSupply', name: 'Alcohol prep swab' },
  ],
  tool: [
    { '@type': 'HowToTool', name: 'CULTR Peptide Calculator', url: PAGE_URL },
    { '@type': 'HowToTool', name: 'Sharps disposal container' },
  ],
  step: HOW_TO_STEPS.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',              item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Tools',             item: `${SITE_URL}/tools` },
    { '@type': 'ListItem', position: 3, name: 'Peptide Calculator', item: PAGE_URL },
  ],
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PublicDosingCalculatorPage() {
  return (
    <main className="flex flex-col">
      {/* JSON-LD — four schemas, validated against Rich Results Test */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Visible breadcrumb — mirrors BreadcrumbList schema */}
      <nav aria-label="Breadcrumb" className="px-6 pt-6 max-w-6xl mx-auto w-full">
        <ol className="flex items-center gap-2 text-sm text-cultr-textMuted">
          <li><Link href="/" className="hover:text-cultr-forest transition-colors">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
          <li><Link href="/tools" className="hover:text-cultr-forest transition-colors">Tools</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-cultr-forest font-medium" aria-current="page">Peptide Calculator</li>
        </ol>
      </nav>

      {/* Hero — server-rendered, sets primary keyword target */}
      <section className="px-6 pt-8 pb-10 max-w-4xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-cultr-forest leading-tight mb-5">
          Peptide Calculator
        </h1>
        <p className="text-xl md:text-2xl font-display text-cultr-forest/70 mb-6">
          Free reconstitution &amp; dose tool with a visual U-100 syringe meter
        </p>
        <p className="text-base md:text-lg text-cultr-textMuted leading-relaxed max-w-2xl mx-auto mb-8">
          Calculate the exact dose volume for any peptide vial in seconds. Enter your vial strength,
          bacteriostatic water volume, and prescribed dose — the calculator returns the precise milliliter
          and U-100 unit reading to draw on your insulin syringe. Built by licensed providers at
          <span className="font-display font-medium"> CULTR</span> Health for clinicians, patients, and
          self-administered peptide protocols.
        </p>
        <ul className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs md:text-sm">
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Built by licensed providers
          </li>
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Free forever
          </li>
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <Syringe className="w-3.5 h-3.5" /> 30+ peptide presets
          </li>
          <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint/60 text-cultr-forest font-medium">
            <Stethoscope className="w-3.5 h-3.5" /> Provider-supervised protocols available
          </li>
        </ul>
      </section>

      {/* Calculator — client island, kept above the fold.
       * `sr-only` h2 bridges the h1 → calculator-internal-h3 gap so screen
       * readers and crawlers see a clean heading hierarchy. */}
      <section aria-label="Interactive peptide dosing calculator">
        <h2 className="sr-only">Interactive peptide reconstitution and dose calculator</h2>
        <Suspense fallback={null}>
          <PublicDosingCalculatorClient backHref="/tools" />
        </Suspense>
      </section>

      {/* HowTo — h2 question, mirrors HowTo schema */}
      <section className="px-6 py-16 md:py-20 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
          How do you reconstitute a peptide?
        </h2>
        <p className="text-cultr-textMuted mb-10 max-w-2xl">
          Reconstituting a lyophilized peptide is the process of dissolving the freeze-dried powder into
          bacteriostatic water so you can draw an accurate dose. Five steps, about five minutes, with sterile
          technique throughout.
        </p>
        <ol className="space-y-6">
          {HOW_TO_STEPS.map((step, index) => (
            <li key={step.name} className="glass-card rounded-2xl p-6 md:p-7">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-cultr-forest text-cultr-offwhite font-display font-semibold text-sm flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg md:text-xl font-display font-semibold text-cultr-forest mb-2">
                    {step.name}
                  </h3>
                  <p className="text-cultr-textMuted leading-relaxed text-sm md:text-base">
                    {step.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Education — five h2 questions covering core search intent */}
      <section className="px-6 py-16 md:py-20 grad-light border-y border-cultr-sage">
        <div className="max-w-4xl mx-auto space-y-14">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-4">
              What is a peptide calculator and why does dosing accuracy matter?
            </h2>
            <p className="text-cultr-textMuted leading-relaxed">
              A peptide calculator translates the milligrams of compound in a freeze-dried vial into the exact
              volume to draw on an insulin syringe. The math is simple in principle — concentration equals mass
              divided by volume — but a single misplaced decimal turns a 250-microgram dose into a
              2,500-microgram dose. Therapeutic peptides have narrow effective ranges; underdosing wastes
              compound and overdosing risks side effects. The visual syringe meter on this peptide calculator
              draws the fill line for you, so the number on the page matches the line on the barrel in your hand.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-4">
              How much bacteriostatic water do I add to a peptide vial?
            </h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Bacteriostatic water volume is a choice, not a fixed answer. Adding more water lowers the
              concentration and forces a larger dose volume; adding less raises the concentration and shrinks
              the dose volume. Most patients pick the volume that puts a typical dose between 0.10 mL and 0.25
              mL on a 0.5 mL or 1.0 mL U-100 syringe — easy to read, easy to draw. For a 5 mg vial dosed at
              250 mcg, 2 mL of bacteriostatic water gives a clean 0.10 mL (10 unit) dose. The reconstitution
              calculator above shows the trade-off in real time as you adjust the water slider.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-4">
              How do I read a U-100 insulin syringe?
            </h2>
            <p className="text-cultr-textMuted leading-relaxed">
              U-100 means 100 units per 1 milliliter. The barrel is graduated in units, not milliliters, so a
              0.25 mL dose reads as 25 units, and a 0.10 mL dose reads as 10 units. Common syringe sizes are
              0.3 mL (max 30 units), 0.5 mL (max 50 units), and 1.0 mL (max 100 units). The syringe meter on
              this peptide calculator visually fills the chosen syringe size up to the dose line — match the
              line to the same line on the barrel as you draw, and you have the right volume.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-4">
              What is the difference between mcg, mg, and units?
            </h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Milligrams (mg) and micrograms (mcg) are units of mass: 1 mg equals 1,000 mcg. Most peptide
              protocols are specified in either mg (Semaglutide 2.5 mg, Tirzepatide 5 mg) or mcg (BPC-157 250
              mcg, Sermorelin 250 mcg). Insulin syringe units are units of volume: 100 units equal 1 mL. The
              calculator handles all three so you can enter your dose in the unit your protocol uses and see
              the equivalent in milliliters and syringe units instantly.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-4">
              How is bacteriostatic water different from sterile water or saline?
            </h2>
            <p className="text-cultr-textMuted leading-relaxed">
              Bacteriostatic water is sterile water with 0.9% benzyl alcohol added as a preservative. The
              benzyl alcohol suppresses bacterial growth across the multi-day life of a reconstituted peptide
              vial. Plain sterile water for injection has no preservative and is intended for single-use
              applications only. Saline contains sodium chloride and is also non-preserved. Always
              reconstitute multi-dose peptide vials with bacteriostatic water from a licensed pharmacy — never
              tap water, distilled water, or any non-sterile source.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-sell — addresses gap item #5, drives indexable preset variants */}
      <section className="px-6 py-16 md:py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
            Calculate dose for popular peptides
          </h2>
          <p className="text-cultr-textMuted max-w-2xl mx-auto">
            Pre-fill the peptide calculator with typical reconstitution and dosing values for the most
            commonly prescribed compounds. Each link opens the calculator with the preset loaded —
            adjust to match your prescription.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CROSS_SELL_PEPTIDES.map((peptide) => (
            <li key={peptide.id}>
              <Link
                href={`/tools/dosing-calculator?preset=${peptide.id}`}
                className="glass-card rounded-2xl p-5 h-full flex flex-col group hover:border-cultr-forest/30 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-display text-lg font-semibold text-cultr-forest">
                    {peptide.name}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-cultr-forest/60 font-medium">
                    {peptide.category}
                  </span>
                </div>
                <p className="text-sm text-cultr-textMuted mb-1">{peptide.compound}</p>
                <p className="text-sm text-cultr-forest/80 font-medium mb-4">{peptide.typicalDose}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm text-cultr-forest font-medium group-hover:gap-2 transition-all">
                  Calculate <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ — h2 + accordion. Visible answers match FAQPage schema verbatim. */}
      <section className="px-6 py-16 md:py-20 grad-light border-y border-cultr-sage">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3 text-center">
            Frequently asked questions
          </h2>
          <p className="text-cultr-textMuted mb-10 text-center max-w-2xl mx-auto">
            Answers to the questions patients and clinicians ask most often about peptide reconstitution,
            dosing, and the math behind the syringe meter.
          </p>
          <FAQAccordion items={CALCULATOR_FAQS} />
        </div>
      </section>

      {/* References — addresses gap item #10 (E-E-A-T outbound citations) */}
      <section className="px-6 py-14 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-3">
          References &amp; further reading
        </h2>
        <p className="text-cultr-textMuted mb-6 text-sm">
          Authoritative sources on compounding standards, peptide pharmacology, and safe injection practice.
        </p>
        <ul className="space-y-3">
          {CALCULATOR_REFERENCES.map((ref) => (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener external"
                className="group inline-flex items-start gap-2 text-cultr-forest hover:text-forest-light transition-colors"
              >
                <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                <span>
                  <span className="underline decoration-cultr-sage decoration-2 underline-offset-4">{ref.title}</span>
                  <span className="block text-xs text-cultr-textMuted mt-0.5">{ref.source}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA — converts SEO traffic into protocol consultations */}
      <section className="px-6 py-16 md:py-20 grad-mint border-t border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
            Need a provider-built peptide protocol?
          </h2>
          <p className="text-cultr-textMuted mb-8 leading-relaxed">
            The calculator handles the math. A licensed <span className="font-display font-medium">CULTR</span> Health
            provider handles the medicine — reviewing your goals, lab history, and current medications before
            prescribing a peptide protocol that fits you. Telehealth visits available across 30 U.S. states.
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
            This peptide calculator is an educational tool. It does not replace medical advice, prescription,
            or supervision. Compounded peptides are dispensed only by licensed 503A and 503B pharmacies under
            a valid prescription.
          </p>
        </div>
      </section>
    </main>
  )
}
