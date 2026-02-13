import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { FAQAccordion } from '@/components/site/FAQAccordion';
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
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'How It Works — CULTR Health',
  description: 'Learn how CULTR Health works: from signup to personalized protocols. Get comprehensive labs, provider consults, and access to our peptide library.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Choose your membership',
      description: 'Select a plan that fits your health goals. All memberships include telehealth consultations, lab reviews, and platform access.',
      icon: UserPlus,
      features: [
        'Multiple tiers from $99-$499/month',
        'HSA/FSA eligible payments',
        'No long-term contracts required',
        'Cancel or change plans anytime',
      ],
    },
    {
      step: '02',
      title: 'Complete your intake',
      description: 'Fill out your comprehensive health questionnaire and medical history. This helps your provider understand your unique situation.',
      icon: FileText,
      features: [
        'Secure HIPAA-compliant portal',
        'Detailed health history review',
        'Goal setting and prioritization',
        'Upload existing lab results',
      ],
    },
    {
      step: '03',
      title: 'Meet your provider',
      description: 'Schedule your first telehealth consultation. Your provider will review your history and order comprehensive lab work.',
      icon: Stethoscope,
      features: [
        'Board-certified providers',
        'Appointments within 24-48 hours',
        'Video or phone consultations',
        'Discuss concerns and goals',
      ],
    },
    {
      step: '04',
      title: 'Get your personalized protocol',
      description: 'Receive a customized treatment plan based on your labs and goals. Access our peptide library and provider-reviewed protocol engine for optimization.',
      icon: Dna,
      features: [
        'Custom peptide protocols',
        'Detailed dosing guidance',
        'Progress tracking tools',
        'Ongoing provider support',
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Your path to optimal health
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              From signup to your personalized protocol in days, not weeks. Our streamlined process makes health optimization accessible and effective.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quiz">
                <Button size="lg">Take the Quiz</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="text-white hover:text-cultr-sage">
                  View Pricing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline Overview */}
      <section className="py-16 px-6 bg-cultr-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Clock, label: '24-48 hrs', sublabel: 'First appointment' },
              { icon: FlaskConical, label: '50+', sublabel: 'Lab markers tested' },
              { icon: Dna, label: '100+', sublabel: 'Peptide protocols' },
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
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="p-8 md:p-12 rounded-2xl bg-cultr-mint border border-cultr-sage">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-xl bg-cultr-forest flex items-center justify-center shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-cultr-forest mb-4">
                    Safety is our priority
                  </h3>
                  <p className="text-cultr-textMuted mb-6 leading-relaxed">
                    CULTR is a licensed medical practice. We screen all patients for contraindications and safety risks. Our providers follow evidence-based protocols and monitor your progress closely.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      'HIPAA-compliant platform',
                      'Board-certified providers',
                      'Licensed pharmacies only',
                      '24/7 emergency guidance',
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

      {/* Steps - Detailed (Four Steps to Transformation) */}
      <section className="py-16 md:py-20 px-6 bg-cultr-offwhite">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Four steps to transformation
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              We&apos;ve simplified the process so you can focus on what matters—your health.
            </p>
          </ScrollReveal>

          <div className="space-y-16">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-display font-bold text-cultr-forest tracking-widest bg-cultr-mint px-3 py-1 rounded-full">
                        STEP {step.step}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-cultr-text mb-4">
                      {step.title}
                    </h3>
                    <p className="text-cultr-textMuted mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-cultr-forest flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-cultr-text text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual */}
                  <div className="flex-1 w-full max-w-md">
                    <div className="relative p-8 rounded-2xl bg-white border border-cultr-sage">
                      <div className="w-16 h-16 rounded-xl bg-cultr-forest flex items-center justify-center mx-auto mb-6">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-display font-bold text-cultr-forest mb-2">
                          {step.step}
                        </div>
                        <div className="text-sm text-cultr-textMuted">
                          {step.title}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 px-6 bg-white">
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
                desc: 'Full metabolic panels, hormone testing, inflammation markers, and 50+ biomarkers analyzed.',
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
                <div className="p-6 rounded-xl bg-cultr-offwhite border border-cultr-sage hover:border-cultr-forest/40 transition-colors h-full">
                  <div className="w-12 h-12 rounded-xl bg-cultr-mint flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-2">{feature.title}</h3>
                  <p className="text-cultr-textMuted text-sm">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections - MOVED FROM /faq page */}
      <section id="faq" className="py-16 md:py-20 px-6 bg-cultr-offwhite scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Frequently asked questions
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Everything you need to know about CULTR Health, our memberships, and how we can help you optimize your health.
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
                    answer: 'Yes, memberships are month-to-month with no long-term contracts. You can cancel at any time before your next renewal date through your member portal. There are no cancellation fees, and your access continues until the end of your current billing period.',
                  },
                  {
                    question: 'Can I switch plans?',
                    answer: 'Absolutely. You can upgrade or downgrade your tier at any time through your billing portal. Upgrades take effect immediately with prorated billing. Downgrades apply at the start of your next billing cycle.',
                  },
                  {
                    question: 'Do you accept HSA/FSA?',
                    answer: 'Yes! CULTR memberships are HSA/FSA eligible. We accept HSA/FSA cards directly and provide all necessary documentation for reimbursement from your health savings account.',
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
                    answer: 'CULTR is for adults looking to optimize their health through longevity science, metabolic health, and personalized protocols. We specialize in preventive care and optimization—not acute illnesses or primary care conditions. Our members typically want more comprehensive testing and personalized guidance than traditional healthcare provides.',
                  },
                  {
                    question: 'What if I am not eligible for treatment?',
                    answer: 'Our providers adhere to strict medical guidelines and only prescribe when clinically appropriate. If you are not a candidate for a specific treatment (e.g., GLP-1s, TRT) due to safety reasons or contraindications, we will discuss alternative options. If no services can be rendered, we offer a full refund of your initial consultation fee.',
                  },
                  {
                    question: 'Do you prescribe medications?',
                    answer: 'Yes, when clinically indicated. Our licensed providers can prescribe medications including GLP-1 agonists (semaglutide, tirzepatide), hormone therapy, peptides, and other longevity-focused treatments. All prescriptions are sent to licensed compounding pharmacies or your preferred retail pharmacy.',
                  },
                  {
                    question: 'How do telehealth visits work?',
                    answer: 'Visits are conducted via secure, HIPAA-compliant video calls. You can join from your phone, tablet, or computer. Most appointments are available within 24-48 hours of booking. Your provider will review your health history, discuss your goals, and create a personalized protocol.',
                  },
                  {
                    question: 'What states do you operate in?',
                    answer: 'CULTR operates in most US states. During signup, we verify availability in your location. Telehealth regulations vary by state, and we ensure full compliance with local requirements. If we don\'t currently serve your state, join our waitlist and we\'ll notify you when we expand.',
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
                    answer: 'We test 50+ biomarkers including comprehensive metabolic panels, full hormone profiles (testosterone, thyroid, cortisol), inflammation markers (hs-CRP), vitamins and minerals, and advanced lipid panels. Lab interpretation is included in all memberships; lab draw fees are billed separately through our partner labs.',
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
                    answer: 'Response times vary by membership tier. Core members receive standard response times (24-48 hours). Higher tiers have priority access with faster response times. Concierge and Club members have 24/7 messaging access with expedited responses.',
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
      <section className="py-16 px-6 bg-white border-y border-cultr-sage">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <div className="w-16 h-16 rounded-full bg-cultr-mint flex items-center justify-center mx-auto mb-6">
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
