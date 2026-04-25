import { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/site/CTASection';
import { FAQAccordion } from '@/components/site/FAQAccordion';
import TrustMarquee from '@/components/site/TrustMarquee';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { brandify } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about CULTR Health memberships, telehealth consultations, peptide protocols, lab testing, and safety. Get the facts before joining.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ — CULTR Health',
    description: 'Everything you need to know about CULTR Health memberships, telehealth services, peptide protocols, and how we optimize your health.',
    url: 'https://www.cultrhealth.com/faq',
  },
};

// ─── Single source of truth for FAQs ─────────────────────────────────────
// `answer` (plain string) feeds both the FAQPage JSON-LD schema and the
// default visible accordion text. `richAnswer` is an optional override
// rendered in the accordion only — used when a Q&A needs embedded links or
// the brandify() styling. Schema text MUST match visible text verbatim for
// Google FAQ rich-result eligibility, so the rich version is built from the
// same string content (plus formatting), not a different copy.

type FaqItem = {
  question: string
  answer: string
  richAnswer?: React.ReactNode
}

const faqSections: { title: string; items: FaqItem[] }[] = [
  {
    title: 'Membership',
    items: [
      {
        question: 'What is included in my membership?',
        answer: 'All memberships include access to our HIPAA-compliant platform, telehealth consultations with licensed providers, comprehensive lab panel reviews, secure messaging with your care team, and educational resources. Higher tiers unlock more frequent consultations, priority messaging, and access to advanced features like personalized protocols and the Protocol Engine.',
      },
      {
        question: 'Can I cancel my membership?',
        answer: 'Yes, memberships begin with an initial 2-month clinical protocol. After that, your membership renews month-to-month unless canceled before your next renewal date. You can cancel through your member portal with no cancellation fees, and your access continues until the end of your current billing period.',
      },
      {
        question: 'Can I switch plans?',
        answer: 'Absolutely. You can upgrade or downgrade your tier at any time through your billing portal. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle.',
      },
    ],
  },
  {
    title: 'Medical & Telehealth',
    items: [
      {
        question: 'Who is CULTR Health for?',
        answer: 'CULTR is for adults looking to optimize their health through longevity science, metabolic health, and personalized protocols. We specialize in preventive care and optimization—not acute illnesses or primary care conditions. Our members typically want more comprehensive testing and personalized guidance than traditional healthcare provides.',
        richAnswer: brandify('CULTR is for adults looking to optimize their health through longevity science, metabolic health, and personalized protocols. We specialize in preventive care and optimization—not acute illnesses or primary care conditions. Our members typically want more comprehensive testing and personalized guidance than traditional healthcare provides.'),
      },
      {
        question: 'What if I am not eligible for treatment?',
        answer: 'Our providers adhere to strict medical guidelines and only prescribe when clinically appropriate. If you are not a candidate for a specific treatment (e.g., GLP-1s, TRT) due to safety reasons or contraindications, we will discuss alternative options. If no services can be rendered, we offer a full refund of your initial consultation fee.',
      },
      {
        question: 'Do you prescribe medications?',
        answer: 'Yes, when clinically indicated. Our licensed providers can prescribe medications including GLP-1 receptor agonists, hormone therapy, peptides, and other longevity-focused treatments. All prescriptions are sent to licensed compounding pharmacies or your preferred retail pharmacy.',
      },
      {
        question: 'How do telehealth visits work?',
        answer: 'Visits are conducted via secure, HIPAA-compliant video calls. You can join from your phone, tablet, or computer. Most appointments are available within 24-48 hours of booking. Your provider will review your health history, discuss your goals, and create a personalized protocol.',
      },
      {
        question: 'What states do you operate in?',
        answer: 'CULTR Health currently serves patients in 30 U.S. states and Washington D.C.: Arizona, Colorado, Connecticut, Delaware, Florida, Georgia, Idaho, Iowa, Louisiana, Maine, Maryland, Minnesota, Missouri, Montana, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Dakota, Pennsylvania, Rhode Island, South Dakota, Texas, Utah, Vermont, Washington, Wisconsin, Wyoming, and Washington D.C. Services are available only to patients physically located in one of these states at the time of consultation. Medications can be shipped to all U.S. states except California.',
      },
    ],
  },
  {
    title: 'Products & Protocols',
    items: [
      {
        question: 'How are protocols personalized?',
        answer: 'Your provider reviews your lab results, health history, and goals to recommend research-backed protocols tailored to you. Each recommendation includes dosing guidelines, cycling recommendations, and safety considerations. Your provider adjusts protocols over time based on your progress and follow-up labs.',
      },
      {
        question: 'How does the Protocol Engine work?',
        answer: 'The Protocol Engine analyzes your biomarkers, health history, and goals to generate personalized protocol recommendations. It considers interactions between different treatments, optimal timing, and your unique biology to suggest the most effective approach. Your provider reviews and approves all recommendations.',
      },
      {
        question: 'How do I calculate my peptide dose?',
        answer: 'Our free peptide calculator at cultrhealth.com/tools/dosing-calculator converts vial strength and bacteriostatic water volume into the exact dose volume to draw on a U-100 insulin syringe. It supports 30+ peptides including BPC-157, Semaglutide, Tirzepatide, TB-500, and GHK-Cu, with a visual syringe meter that matches the line on the barrel in your hand.',
        richAnswer: (
          <>
            Our free <Link href="/tools/dosing-calculator" className="text-cultr-forest font-medium underline decoration-cultr-sage decoration-2 underline-offset-4 hover:decoration-cultr-forest">peptide calculator</Link> at cultrhealth.com/tools/dosing-calculator converts vial strength and bacteriostatic water volume into the exact dose volume to draw on a U-100 insulin syringe. It supports 30+ peptides including BPC-157, Semaglutide, Tirzepatide, TB-500, and GHK-Cu, with a visual syringe meter that matches the line on the barrel in your hand.
          </>
        ),
      },
      {
        question: 'What labs are included?',
        answer: 'We test 29 critical biomarkers (upgradeable up to 60+) through the SiPhox EasyDraw Core Program — including heart health (ApoB, Lp(a), full lipid panel), metabolic health (HbA1c, C-Peptide, cortisol), hormonal balance (testosterone, estradiol, DHEA-S, thyroid), inflammation (hs-CRP), and nutritional status (Vitamin D, ferritin). Additional panels available as upgrades. Lab interpretation is included in all memberships.',
      },
      {
        question: 'Where do medications come from?',
        answer: 'All medications are sourced from licensed US pharmacies, including 503A and 503B compounding pharmacies for specialized formulations. We only work with pharmacies that meet our quality standards and comply with all FDA regulations.',
      },
    ],
  },
  {
    title: 'Support & Safety',
    items: [
      {
        question: 'How fast do you respond to messages?',
        answer: 'Response times vary by membership tier. Core members receive standard response times (24-48 hours). Higher tiers have priority access with faster response times. Concierge members have 24/7 messaging access with expedited responses.',
      },
      {
        question: 'What if I have side effects?',
        answer: 'We provide detailed education on managing common side effects for all treatments. For mild issues, message your care team through the portal. For moderate concerns, schedule a follow-up consultation. For severe reactions or emergencies, seek immediate medical attention by calling 911 or visiting your nearest emergency room.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. Our platform is fully HIPAA-compliant with end-to-end encryption. We never sell your data to third parties. Your health information is protected by the same standards used by major healthcare systems.',
      },
      {
        question: 'How do I contact support?',
        // Avoid a literal email address in the canonical text — Cloudflare's
        // email obfuscation rewrites it in the visible HTML but not in the
        // JSON-LD schema, which would break FAQPage rich-result parity.
        answer: 'You can reach our team through the messaging feature in your member portal, or email our support team. For billing questions, visit the billing portal or contact our support team directly.',
      },
    ],
  },
]

// Flattened across all sections — feeds the FAQPage JSON-LD schema.
const allFaqs = faqSections.flatMap((s) => s.items)

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 grad-dark-glow text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Frequently asked questions
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Everything you need to know about <span className="font-display font-bold">CULTR</span> Health, our memberships, and how we can help you optimize your health.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">View Plans</Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="text-white hover:text-cultr-sage">
                  How It Works <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Sections — derived from faqSections so schema and visible stay in sync */}
      <section className="py-24 px-6 section-veil">
        <div className="max-w-3xl mx-auto space-y-16 w-full">
          {faqSections.map((section) => (
            <ScrollReveal key={section.title}>
              <div>
                <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                  {section.title}
                </h2>
                <FAQAccordion
                  items={section.items.map((item) => ({
                    question: item.question,
                    answer: item.richAnswer ?? item.answer,
                  }))}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Trust Logo Marquee */}
      <TrustMarquee />

      {/* Still Have Questions */}
      <section className="py-16 px-6 grad-light border-y border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <div className="w-16 h-16 rounded-full grad-mint flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-cultr-forest" />
            </div>
            <h3 className="text-2xl font-display font-bold text-cultr-forest mb-4">
              Still have questions?
            </h3>
            <p className="text-cultr-textMuted mb-6">
              Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <a href="mailto:support@cultrhealth.com">
              <Button variant="secondary">
                Contact Support <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to optimize your health?"
        subtitle="Join thousands taking control of their biology."
        ctaText="Get Started"
      />
    </main>
  );
}
