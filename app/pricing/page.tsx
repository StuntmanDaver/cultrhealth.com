import { Metadata } from 'next';
import Link from 'next/link';
import { PLANS, MEMBERSHIP_DISCLAIMER } from '@/lib/config/plans';
import { PricingCard } from '@/components/site/PricingCard';
import { ClubBanner } from '@/components/site/ClubBanner';
import { FAQAccordion } from '@/components/site/FAQAccordion';
import { CTASection } from '@/components/site/CTASection';
import { MarketingHero } from '@/components/site/MarketingHero';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import TrustMarquee from '@/components/site/TrustMarquee';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import {
  Check,
  X,
  ArrowRight,
  Shield,
  MessageCircle,
  FlaskConical,
  Dna,
  Users,
  HelpCircle,
} from 'lucide-react';
import BiomarkerExplainerLink from '@/components/site/BiomarkerExplainer';
import { brandify } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing — CULTR Health',
  description: 'Choose your CULTR Health membership. Plans from $149-$1,049/month with comprehensive labs, provider access, and peptide protocols.',
};

export default function PricingPage() {
  const paidPlans = PLANS.filter((p) => p.slug !== 'club');

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <MarketingHero
        title={<>Choose the level of support<br className="hidden md:block" /> that fits your goals.</>}
        subtitle="Clinician-guided programs for body composition, performance, recovery, confidence, and long-term optimization. Transparent membership pricing."
        ctas={[
          { label: 'View Plans', href: '#plans' },
          { label: 'How It Works', href: '/how-it-works', variant: 'ghost' },
        ]}
        backgroundImage="/images/hero-wellness-walk.jpg"
        align="left"
      >
        <ScrollReveal delay={500} direction="none" duration={800}>
          <div className="mt-4">
            <SocialProofBadge variant="pill" className="text-white/80" />
          </div>
        </ScrollReveal>
      </MarketingHero>

      {/* Value Props */}
      <section className="py-16 px-6 grad-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: FlaskConical, label: '29 Biomarkers', sublabel: 'Upgradeable up to 60+' },
              { icon: MessageCircle, label: 'Direct Access', sublabel: 'Provider messaging' },
              { icon: Dna, label: 'Peptide Protocols', sublabel: 'Personalized plans' },
              { icon: Shield, label: 'HIPAA Compliant', sublabel: 'Secure platform' },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-cultr-sage flex items-center justify-center mb-3">
                    <item.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="font-display font-bold text-cultr-forest text-sm">{item.label}</div>
                  <div className="text-xs text-cultr-textMuted">{item.sublabel}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="plans" className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Transparent pricing built around an initial 2-month clinical protocol.
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto mb-4">
              Choose the membership that matches your goals. All paid plans begin with a 2-month starting protocol so your provider has enough time to evaluate your labs, personalize your protocol, and adjust care when appropriate.
            </p>
            <Link href="/quiz" className="text-sm text-cultr-forest font-medium hover:underline">
              Not sure which plan? Take the quiz →
            </Link>
          </ScrollReveal>

          {/* CULTR Club — Free Banner */}
          <ScrollReveal className="mb-10">
            <ClubBanner />
          </ScrollReveal>

          {/* Paid Plans — 3-column grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {paidPlans.map((plan, i) => (
              <ScrollReveal key={plan.slug} delay={i * 100} direction="up">
                <PricingCard plan={plan} />
              </ScrollReveal>
            ))}
          </div>

          {/* Global Microcopy */}
          <div className="mt-10 text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-xs text-cultr-textMuted leading-relaxed">
              All paid memberships begin with an initial 2-month clinical protocol. After that, your membership renews month-to-month unless canceled before your next renewal date.
            </p>
            <p className="text-xs text-cultr-textMuted/70 leading-relaxed">
              Medication, protocol eligibility, and refills are subject to clinical review and approval.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Logo Marquee */}
      <TrustMarquee />

      {/* CULTR Creator CTA */}
      <section className="py-12 px-6 grad-dark">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Users className="w-8 h-8 text-cultr-sage" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                  <span className="">CULTR</span> Creator
                </h3>
                <p className="text-white/70 max-w-lg">
                  Earn commissions sharing <span className="font-display font-bold">CULTR</span> with your audience. Get tracking links, coupon codes, and a dedicated creator dashboard.
                </p>
              </div>
              <Link href="/creators" className="shrink-0">
                <Button variant="secondary" size="lg">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-20 px-6 section-veil">
        <div className="max-w-4xl mx-auto w-full">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Compare memberships
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              See what&apos;s included in each tier to find the right fit for your goals.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cultr-sage">
                    <th className="text-left py-4 px-4 font-display font-bold text-cultr-text">Feature</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-text text-sm">Core</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-forest text-sm grad-mint rounded-t-xl">Catalyst+</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-text text-sm">Concierge</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feature: 'Monthly Price', values: ['$149*', '$499', '$1,049'] },
                    { feature: 'At Home Lab Test', values: ['$135', '$135', 'Included'], hasBiomarkerLink: true },
                    { feature: 'Physician Follow-up', values: ['Every 6 months', 'Every 4 months', 'Every 2 months'] },
                    { feature: 'Foundation Therapies', values: ['1', '1', '2'] },
                    { feature: 'Add-On Therapies', values: ['—', '2', 'Up to 4'] },
                    { feature: 'Protocol Library', values: [true, true, true] },
                    { feature: 'Protocol Builder', values: ['Browse', 'Full Builder', 'Full Builder'] },
                    { feature: 'Peptide Calculator', values: [true, true, true] },
                    { feature: 'Member Shop Access', values: [false, true, 'VIP'] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-cultr-sage/50">
                      <td className="py-4 px-4 text-cultr-text">
                        {row.feature}
                        {row.hasBiomarkerLink && (
                          <div className="mt-0.5">
                            <BiomarkerExplainerLink label="See what we test ›" />
                          </div>
                        )}
                      </td>
                      {row.values.map((value, j) => (
                        <td key={j} className={`py-4 px-3 text-center ${j === 1 ? 'bg-cultr-mint/50' : ''}`}>
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="w-5 h-5 text-cultr-forest mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-cultr-textMuted/50 mx-auto" />
                            )
                          ) : (
                            <span className={j === 1 ? 'text-cultr-forest font-medium' : 'text-cultr-textMuted'}>{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Glossary — CORE vs Enhancement */}
      <section className="py-12 px-6 grad-mint border-b border-cultr-sage">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">
            <ScrollReveal direction="up">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-cultr-forest shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-cultr-forest text-sm mb-1">What&apos;s a CORE therapy?</h4>
                  <p className="text-xs text-cultr-textMuted">Your primary protocol or anchor therapy — the main treatment your provider prescribes based on your goals and labs.</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} direction="up">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-cultr-forest shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-bold text-cultr-forest text-sm mb-1">What&apos;s an enhancement?</h4>
                  <p className="text-xs text-cultr-textMuted">An add-on therapy or support protocol layered onto your core plan to address additional goals like recovery, cognition, or longevity.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Therapy Unlock Matrix */}
      <section className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Therapy access by plan
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto text-sm">
              Higher tiers unlock more therapy categories. All therapies require medical eligibility.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cultr-sage">
                    <th className="text-left py-4 px-4 font-display font-bold text-cultr-text text-sm">Therapy Category</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-text text-sm">Core</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-forest text-sm grad-mint rounded-t-xl">Catalyst+</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-text text-sm">Concierge</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { category: 'GLP-1 / Weight Management', values: [true, true, true] },
                    { category: 'Recovery Peptides (BPC-157, TB-500)', values: [false, true, true] },
                    { category: 'NAD+ / Longevity', values: [false, true, true] },
                    { category: 'Cognitive Support (Semax/Selank)', values: [false, true, true] },
                    { category: 'Growth Hormone Support', values: [false, true, true] },
                    { category: 'Multi-therapy stacking', values: [false, true, true] },
                    { category: 'Concierge customization', values: [false, false, true] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-cultr-sage/50">
                      <td className="py-3 px-4 text-cultr-text text-sm">{row.category}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className={`py-3 px-3 text-center ${j === 1 ? 'bg-cultr-mint/50' : ''}`}>
                          {val ? (
                            <Check className="w-5 h-5 text-cultr-forest mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-cultr-textMuted/40 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Every membership includes
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Secure Platform Access',
                desc: 'HIPAA-compliant portal for all your health data, messaging, and appointments.',
              },
              {
                title: 'Telehealth Consultations',
                desc: 'Video visits with board-certified providers specializing in optimization.',
              },
              {
                title: 'Comprehensive Lab Panels',
                desc: '29 biomarkers per test (upgradeable up to 60+) via SiPhox EasyDraw Core — heart, metabolic, hormonal, nutritional, inflammation, and thyroid markers analyzed with provider interpretation and recommendations.',
                hasBiomarkerLink: true,
              },
              {
                title: 'Provider Messaging',
                desc: 'Direct communication with your care team for questions between visits.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Visual dashboards showing your biomarker trends over time.',
              },
              {
                title: 'Education Resources',
                desc: 'Access to our library of evidence-based health content.',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="flex items-start gap-4 p-6 rounded-xl grad-light border border-cultr-sage">
                  <div className="w-6 h-6 rounded-full grad-dark flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-cultr-text mb-1">{item.title}</h4>
                    <p className="text-sm text-cultr-textMuted">{item.desc}</p>
                    {'hasBiomarkerLink' in item && item.hasBiomarkerLink && (
                      <BiomarkerExplainerLink label="See what we test ›" className="mt-1" />
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-6 grad-light">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Pricing FAQ
            </h2>
          </ScrollReveal>

          <FAQAccordion items={[
            {
              question: 'Why do memberships start with a 2-month clinical protocol?',
              answer: 'Our memberships begin with a 2-month starting protocol so your provider has enough time to review your intake, assess labs when needed, personalize your protocol, and evaluate your response before ongoing month-to-month care.',
            },
            {
              question: 'Am I charged monthly or all at once?',
              answer: 'We display pricing as a monthly rate for easy comparison. Your initial purchase covers your first 2-month clinical protocol. After that, your membership renews monthly at your plan rate unless canceled.',
            },
            {
              question: 'Can I cancel?',
              answer: 'You can cancel future renewals anytime before your next renewal date. Your initial 2-month clinical protocol is the minimum starting term for paid memberships.',
            },
            {
              question: 'Why is there an asterisk next to Core pricing?',
              answer: brandify('CULTR Core starts at $149 per month, and the exact price depends on the selected therapy option.'),
            },
            {
              question: 'Are medications guaranteed?',
              answer: 'No. Treatment recommendations, prescriptions, and refills are always subject to provider review, clinical appropriateness, and applicable pharmacy and state requirements.',
            },
          ]} />

          <ScrollReveal delay={300} className="text-center mt-10">
            <Link href="/how-it-works#faq" className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors">
              View all FAQs →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Membership & Medical Disclaimer */}
      <section className="py-12 px-6 grad-white border-y border-cultr-sage">
        <div className="max-w-4xl mx-auto space-y-6">
          <ScrollReveal>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-cultr-forest shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-bold text-cultr-text mb-2">Membership Pricing</h4>
                <p className="text-sm text-cultr-textMuted leading-relaxed">
                  {MEMBERSHIP_DISCLAIMER}
                </p>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-cultr-forest shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-bold text-cultr-text mb-2">Medical Disclaimer</h4>
                <p className="text-sm text-cultr-textMuted leading-relaxed">
                  <span className="font-display font-bold">CULTR</span> Health does not guarantee specific results. Weight loss, longevity, and optimization outcomes vary by individual.
                  All services are provided via telehealth by licensed providers. Prescriptions are issued only when clinically appropriate.
                  If you have a medical emergency, please call 911 or proceed to your nearest emergency room.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Stop guessing. Start optimizing."
        subtitle="Take the 2-minute quiz to find your plan."
        ctaText="Take the Quiz"
        ctaLink="/quiz"
      />
    </div>
  );
}
