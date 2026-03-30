import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { MarketingHero } from '@/components/site/MarketingHero';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import { HowItWorksSteps, type Step } from '@/components/site/HowItWorksSteps';
import { FAQAccordion } from '@/components/site/FAQAccordion';
import TrustMarquee from '@/components/site/TrustMarquee';
import {
  Check,
  ArrowRight,
  UserPlus,
  FileText,
  Stethoscope,
  FlaskConical,
  Dna,
  TrendingUp,
  MessageCircle,
  Clock,
  Shield,
  Sparkles,
  MapPin,
} from 'lucide-react';
import BiomarkerExplainerLink from '@/components/site/BiomarkerExplainer';
import { brandify } from '@/lib/utils';
import { TRUST_METRICS } from '@/lib/config/social-proof';

export const metadata: Metadata = {
  title: 'How It Works — CULTR Health',
  description: 'Learn how CULTR Health works: from signup to personalized protocols. Get comprehensive labs, provider consults, and access to our peptide library.',
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <MarketingHero
        title="From quiz to clinician-guided plan in a few simple steps."
        subtitle="We use your goals, health history, and biomarker data to build a personalized plan for body composition, performance, recovery, and long-term optimization."
        proofLine={`Available in ${TRUST_METRICS.statesCovered} states · 33-biomarker panel · HSA/FSA eligible · Delivered to your door`}
        ctas={[
          { label: 'Take the Quiz', href: '/quiz' },
          { label: 'View Pricing', href: '/pricing', variant: 'ghost' },
        ]}
      >
        <ScrollReveal delay={500} direction="none" duration={800}>
          <div className="mt-4">
            <SocialProofBadge variant="pill" className="text-white/80" />
          </div>
        </ScrollReveal>
      </MarketingHero>

      {/* Timeline Overview */}
      <section className="py-16 px-6 grad-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Clock, label: '24-48 hrs', sublabel: 'First appointment' },
              { icon: FlaskConical, label: '33', sublabel: 'Biomarkers (SiPhox Health)' },
              { icon: Dna, label: '60+', sublabel: 'Peptide protocols' },
              { icon: MessageCircle, label: 'Unlimited', sublabel: 'Provider messaging' },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-cultr-sage flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <div className="text-2xl font-display font-bold text-cultr-forest">{stat.label}</div>
                  <div className="text-sm text-cultr-textMuted">{stat.sublabel}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Compliance - MOVED ABOVE Four Steps */}
      <section className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="p-8 md:p-12 rounded-2xl grad-mint border border-cultr-sage">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-xl grad-dark flex items-center justify-center shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-cultr-forest mb-4">
                    Safety is our priority
                  </h3>
                  <p className="text-cultr-textMuted mb-6 leading-relaxed">
                    <span className="font-display font-bold">CULTR</span> is a licensed medical practice. We screen all patients for contraindications and safety risks. Our providers follow evidence-based protocols and monitor your progress closely.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      'HIPAA-compliant platform',
                      'Board-certified providers',
                      'Licensed pharmacies only',
                      'Clear support guidance for urgent issues and side effects',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-cultr-forest" />
                        <span className="text-sm text-cultr-text">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Five Steps — Your Journey */}
      <section className="py-16 md:py-20 px-6 section-veil">
        <div className="max-w-5xl mx-auto w-full">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Five steps to your personalized plan
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              From first quiz to ongoing optimization — here&apos;s exactly how it works.
            </p>
          </ScrollReveal>

          <HowItWorksSteps
            variant="5-step"
            steps={[
              {
                title: 'Take the Quiz',
                description: 'Tell us your goals and priorities. The quiz takes about 2 minutes and matches you with the right program and provider.',
              },
              {
                title: 'Complete Your Intake',
                description: 'Share your health history, lifestyle, current medications, and recent labs through our secure HIPAA-compliant portal.',
              },
              {
                title: 'Meet Your Provider',
                description: 'A licensed clinician reviews your case, discusses your goals, and determines what therapies are medically appropriate.',
              },
              {
                title: 'Review Labs & Receive Your Plan',
                description: 'If labs are needed, we guide testing and interpret results before finalizing your personalized protocol.',
              },
              {
                title: 'Optimize Over Time',
                description: 'Use provider messaging, follow-up consultations, and progress tracking to refine your plan as your body responds.',
              },
            ]}
          />
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              What's included in your membership
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Every plan includes access to our core platform and features. Higher tiers unlock more frequent consultations and advanced protocols.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FlaskConical,
                title: 'Comprehensive Lab Testing',
                desc: '33 biomarkers per test (SiPhox EasyDraw Core) — heart, metabolic, hormonal, nutritional, inflammation, and thyroid markers.',
                hasBiomarkerLink: true,
              },
              {
                icon: Dna,
                title: 'Peptide Library Access',
                desc: 'Browse our curated library of research-backed peptide protocols for various health goals.',
              },
              {
                icon: Sparkles,
                title: 'Protocol Engine',
                desc: 'Our AI-powered system surfaces goal-aligned protocols reviewed by your provider.',
              },
              {
                icon: Stethoscope,
                title: 'Provider Consultations',
                desc: 'Regular telehealth visits with board-certified providers specializing in optimization.',
              },
              {
                icon: MessageCircle,
                title: 'Direct Messaging',
                desc: 'Secure messaging with your care team for questions between consultations.',
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                desc: 'Visual dashboards showing your biomarker trends and protocol adherence over time.',
              },
            ].map((feature, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="p-6 rounded-xl grad-light border border-cultr-sage hover:border-cultr-forest/40 transition-colors h-full">
                  <div className="w-12 h-12 rounded-xl grad-mint flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-2">{feature.title}</h3>
                  <p className="text-cultr-textMuted text-sm">{feature.desc}</p>
                  {'hasBiomarkerLink' in feature && feature.hasBiomarkerLink && (
                    <BiomarkerExplainerLink label="See what we test ›" className="mt-2" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Logo Marquee */}
      <TrustMarquee />

      {/* FAQ Sections - MOVED FROM /faq page */}
      <section id="faq" className="py-16 md:py-20 px-6 grad-light scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Frequently asked questions
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Everything you need to know about <span className="font-display font-bold">CULTR</span> Health, our memberships, and how we can help you optimize your health.
            </p>
          </ScrollReveal>

          <div className="space-y-16">
            {/* Membership */}
            <ScrollReveal>
              <div>
                <h3 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                  Membership
                </h3>
                <FAQAccordion items={[
                  {
                    question: 'What is included in my membership?',
                    answer: 'All memberships include access to our HIPAA-compliant platform, telehealth consultations with licensed providers, comprehensive lab panel reviews, secure messaging with your care team, and educational resources. Higher tiers unlock more frequent consultations, priority messaging, and access to advanced features like the Peptide Library and Protocol Engine.',
                  },
                  {
                    question: 'Can I cancel my membership?',
                    answer: 'Yes, memberships begin with an initial 2-month clinical protocol. After that, your membership renews month-to-month unless canceled before your next renewal date. You can cancel through your member portal with no cancellation fees, and your access continues until the end of your current billing period.',
                  },
                  {
                    question: 'Can I switch plans?',
                    answer: 'Absolutely. You can upgrade or downgrade your tier at any time through your billing portal. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle.',
                  },
                  {
                    question: 'Do you accept HSA/FSA?',
                    answer: brandify('Yes! CULTR memberships are HSA/FSA eligible. We accept HSA/FSA cards directly and provide all necessary documentation for reimbursement from your health savings account.'),
                  },
                ]} />
              </div>
            </ScrollReveal>

            {/* Medical & Telehealth */}
            <ScrollReveal>
              <div>
                <h3 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                  Medical & Telehealth
                </h3>
                <FAQAccordion items={[
                  {
                    question: 'Who is CULTR Health for?',
                    answer: brandify('CULTR is for adults looking to optimize their health through longevity science, metabolic health, and personalized protocols. We specialize in preventive care and optimization—not acute illnesses or primary care conditions. Our members typically want more comprehensive testing and personalized guidance than traditional healthcare provides.'),
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
                    answer: brandify('CULTR operates in most US states. During signup, we verify availability in your location. Telehealth regulations vary by state, and we ensure full compliance with local requirements. If we don\'t currently serve your state, join our waitlist and we\'ll notify you when we expand.'),
                  },
                ]} />
              </div>
            </ScrollReveal>

            {/* Products & Protocols */}
            <ScrollReveal>
              <div>
                <h3 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                  Products & Protocols
                </h3>
                <FAQAccordion items={[
                  {
                    question: 'What is the Peptide Library?',
                    answer: 'The Peptide Library is our comprehensive database of research-backed peptide protocols. Each entry includes mechanism of action, dosing guidelines, cycling recommendations, potential side effects, and real-world outcomes data. It\'s designed to help you understand your options and have informed conversations with your provider.',
                  },
                  {
                    question: 'How does the Protocol Engine work?',
                    answer: 'The Protocol Engine analyzes your biomarkers, health history, and goals to generate personalized protocol recommendations. It considers interactions between different treatments, optimal timing, and your unique biology to suggest the most effective approach. Your provider reviews and approves all recommendations.',
                  },
                  {
                    question: 'What labs are included?',
                    answer: 'We test 33 critical biomarkers through the SiPhox EasyDraw Core Program — including heart health (ApoB, Lp(a), full lipid panel), metabolic health (HbA1c, C-Peptide, cortisol), hormonal balance (testosterone, estradiol, DHEA-S, thyroid), inflammation (hs-CRP), and nutritional status (Vitamin D, ferritin). Additional panels available as upgrades. Lab interpretation is included in all memberships.',
                  },
                  {
                    question: 'Where do medications come from?',
                    answer: 'All medications are sourced from licensed US pharmacies, including 503A and 503B compounding pharmacies for specialized formulations. We only work with pharmacies that meet our quality standards and comply with all FDA regulations.',
                  },
                ]} />
              </div>
            </ScrollReveal>

            {/* Support & Safety */}
            <ScrollReveal>
              <div>
                <h3 className="text-2xl font-display font-bold text-cultr-forest mb-6 pb-2 border-b border-cultr-sage">
                  Support & Safety
                </h3>
                <FAQAccordion items={[
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
                    answer: 'You can reach our team through the messaging feature in your member portal, or email us at support@cultrhealth.com. For billing questions, visit the billing portal or contact our support team directly.',
                  },
                ]} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-6 grad-white border-y border-cultr-sage">
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
        title="Stop guessing. Start optimizing."
        subtitle="Take the 2-minute quiz to find your protocol."
        ctaText="Take the Quiz"
        ctaLink="/quiz"
      />
    </div>
  );
}
