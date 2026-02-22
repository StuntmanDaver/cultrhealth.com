import { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
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

export const metadata: Metadata = {
  title: 'How It Works — From Signup to Protocol',
  description: 'Learn how CULTR Health works: choose a membership, complete intake, meet your provider, and receive a personalized peptide or hormone protocol in days.',
  alternates: {
    canonical: '/how-it-works',
  },
  openGraph: {
    title: 'How It Works — CULTR Health',
    description: 'From signup to your personalized protocol in days. Comprehensive labs, provider consults, and access to our peptide library.',
    url: 'https://www.cultrhealth.com/how-it-works',
  },
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
      description: 'Receive a customized treatment plan based on your labs and goals. Access our peptide library and protocol engine for optimization.',
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
    <main className="flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Your path to <span className="italic">optimal health</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              From signup to your personalized protocol in days, not weeks. Our streamlined process makes health optimization accessible and effective.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="lg" className="text-white hover:text-cultr-sage">
                  View Products <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* Steps - Detailed */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Four steps to <span className="italic">transformation</span>
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
                      <span className="text-xs font-bold text-cultr-forest tracking-widest bg-cultr-mint px-3 py-1 rounded-full">
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
                    <div className="relative p-8 rounded-2xl bg-cultr-offwhite border border-cultr-sage">
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
      <section className="py-24 px-6 bg-cultr-offwhite">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              What&apos;s included in your <span className="italic">membership</span>
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
                desc: 'Our AI-powered system recommends optimal protocols based on your unique biomarkers.',
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
                <div className="p-6 rounded-xl bg-white border border-cultr-sage hover:border-cultr-forest/40 transition-colors h-full">
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

      {/* Safety & Compliance */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="p-8 md:p-12 rounded-2xl bg-cultr-mint border border-cultr-sage">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-xl bg-cultr-forest flex items-center justify-center shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-cultr-forest mb-4">
                    Safety is our <span className="italic">priority</span>
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

      {/* CTA */}
      <CTASection
        title="Ready to start your journey?"
        subtitle="Join thousands optimizing their health with CULTR's personalized protocols."
        ctaText="Choose Your Plan"
      />
    </main>
  );
}
