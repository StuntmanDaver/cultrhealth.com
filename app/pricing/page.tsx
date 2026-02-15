import { Metadata } from 'next';
import Link from 'next/link';
import { PLANS, MEMBERSHIP_DISCLAIMER } from '@/lib/config/plans';
import { PricingCard } from '@/components/site/PricingCard';
import { ClubBanner } from '@/components/site/ClubBanner';
import { FAQAccordion } from '@/components/site/FAQAccordion';
import { CTASection } from '@/components/site/CTASection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Shield,
  MessageCircle,
  FlaskConical,
  Dna,
  Users,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Pricing — CULTR Health',
  description: 'Choose your CULTR Health membership. Plans from $199-$1,099/month with comprehensive labs, provider access, and peptide protocols.',
};

export default function PricingPage() {
  const paidPlans = PLANS.filter((p) => p.slug !== 'club');

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">HSA/FSA Eligible</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Invest in your future self
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Membership-based longevity and optimization designed for sustainable results. No hidden fees, no surprises.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#plans">
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

      {/* Value Props */}
      <section className="py-16 px-6 bg-cultr-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: FlaskConical, label: '50+ Biomarkers', sublabel: 'Comprehensive testing' },
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
      <section id="plans" className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Choose your membership
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto mb-4">
              All plans include access to our platform, provider consultations, and core features. Upgrade or downgrade anytime.
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
        </div>
      </section>

      {/* CULTR Creator CTA */}
      <section className="py-12 px-6 bg-cultr-forest">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Users className="w-8 h-8 text-cultr-sage" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                  CULTR Creator
                </h3>
                <p className="text-white/70 max-w-lg">
                  Earn commissions sharing CULTR with your audience. Get tracking links, coupon codes, and a dedicated creator dashboard.
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
      <section className="py-16 md:py-20 px-6 bg-cultr-offwhite">
        <div className="max-w-4xl mx-auto">
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
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-forest text-sm bg-cultr-mint rounded-t-xl">Catalyst+</th>
                    <th className="text-center py-4 px-3 font-display font-bold text-cultr-text text-sm">Concierge</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feature: 'Monthly Price', values: ['$199', '$499', '$1,099'] },
                    { feature: 'Initial Physician Consult', values: ['$79', '$79', 'Complimentary'] },
                    { feature: 'Blood Work (prior to start)', values: ['$99', '$99', 'Complimentary'] },
                    { feature: 'Physician Follow-up', values: ['Every 6 months', 'Every 3 months', 'Every month'] },
                    { feature: 'CORE Therapies', values: ['1', '1', '2'] },
                    { feature: 'Enhancement Therapies', values: ['—', '2', '4'] },
                    { feature: 'Protocol Library', values: [false, true, true] },
                    { feature: 'Peptide Calculator', values: [false, true, true] },
                    { feature: 'Member Shop Access', values: [false, true, 'VIP'] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-cultr-sage/50">
                      <td className="py-4 px-4 text-cultr-text">{row.feature}</td>
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

      {/* What's Included */}
      <section className="py-16 md:py-20 px-6 bg-white">
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
                desc: '50+ biomarkers analyzed with provider interpretation and recommendations.',
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
                <div className="flex items-start gap-4 p-6 rounded-xl bg-cultr-offwhite border border-cultr-sage">
                  <div className="w-6 h-6 rounded-full bg-cultr-forest flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-cultr-text mb-1">{item.title}</h4>
                    <p className="text-sm text-cultr-textMuted">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-6 bg-cultr-offwhite">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Pricing FAQ
            </h2>
          </ScrollReveal>

          <FAQAccordion items={[
            {
              question: 'Can I upgrade or downgrade my plan?',
              answer: 'Yes, you can change your plan at any time from your member portal. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle.',
            },
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept all major credit cards, debit cards, and HSA/FSA cards through our secure Stripe payment system. We also provide superbills for insurance reimbursement.',
            },
            {
              question: 'Is there a commitment period?',
              answer: 'No long-term contracts required. All memberships are month-to-month. We recommend a 3-month commitment to see meaningful physiological changes, but you can cancel anytime.',
            },
            {
              question: 'What if I need to cancel?',
              answer: 'You can cancel your membership at any time from your member portal. Your access continues until the end of your current billing period. No cancellation fees.',
            },
            {
              question: 'Are medications and products included?',
              answer: 'Membership covers telehealth consultations, platform access, and listed features. Medications, peptides, labs, and products are billed separately at cost through our partner pharmacies and labs.',
            },
            {
              question: 'Can I use HSA/FSA funds?',
              answer: 'Yes! CULTR memberships are HSA/FSA eligible. We provide all necessary documentation for reimbursement from your health savings account.',
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
      <section className="py-12 px-6 bg-white border-y border-cultr-sage">
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
                  CULTR Health does not guarantee specific results. Weight loss, longevity, and optimization outcomes vary by individual.
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
