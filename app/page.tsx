import Link from 'next/link';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { PLANS } from '@/lib/config/plans';
import {
  ArrowRight,
  FlaskConical,
  Stethoscope,
  MessageCircle,
  TrendingUp,
  Users,
  Sparkles,
  BookOpen,
  Dna,
} from 'lucide-react';

// Dynamically import heavy below-the-fold components
// This reduces initial JS bundle and speeds up Time to Interactive
const PricingCard = dynamic(() => import('@/components/site/PricingCard').then(mod => ({ default: mod.PricingCard })), {
  loading: () => <div className="h-96 bg-white/50 rounded-2xl animate-pulse" />,
});

const FAQAccordion = dynamic(() => import('@/components/site/FAQAccordion').then(mod => ({ default: mod.FAQAccordion })), {
  loading: () => <div className="h-64 bg-cultr-mint rounded-lg animate-pulse" />,
});

const NewsletterSignup = dynamic(() => import('@/components/site/NewsletterSignup').then(mod => ({ default: mod.NewsletterSignup })), {
  loading: () => <div className="h-48 bg-cultr-offwhite animate-pulse" />,
});

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-6 bg-cultr-forest overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <ScrollReveal direction="none" duration={800}>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-cultr-sage" />
                  <span className="text-sm">HSA/FSA Eligible</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                  Change the{' '}
                  <span className="tracking-tight uppercase">CULTR</span>
                  , <span className="italic">rebrand</span> yourself.
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200} direction="none" duration={800}>
                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Comprehensive lab testing, personalized protocols, and access to cutting-edge peptide therapies. All from the comfort of your home.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300} direction="none" duration={800}>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <span className="text-sm">50+ Lab Tests</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-sm">Licensed Providers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Dna className="w-5 h-5" />
                    </div>
                    <span className="text-sm">Peptide Protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm">24/7 Support</span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={400} direction="up" duration={600}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/pricing">
                    <Button size="lg">Start Your Journey</Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="ghost" size="lg" className="text-white hover:text-cultr-sage">
                      See How It Works <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Visual */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cultr-sage/20 to-transparent rounded-3xl" />
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="text-white/90">Testosterone</span>
                    </div>
                    <span className="text-cultr-sage font-bold">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="text-white/90">Thyroid Panel</span>
                    </div>
                    <span className="text-cultr-sage font-bold">Normal</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="text-white/90">Vitamin D</span>
                    </div>
                    <span className="text-yellow-400 font-bold">Low</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="text-white/90">Metabolic Panel</span>
                    </div>
                    <span className="text-cultr-sage font-bold">Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              How it <span className="italic">works</span>
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Get started in minutes. Our streamlined process makes optimizing your health simple.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose your plan',
                desc: 'Select a membership tier that fits your goals. All plans include telehealth consults and ongoing support.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Complete intake',
                desc: 'Fill out your health history and schedule your first consultation with a licensed provider.',
                icon: Stethoscope,
              },
              {
                step: '03',
                title: 'Get your protocol',
                desc: 'Receive your personalized treatment plan with access to our peptide library and protocol engine.',
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <div className="relative p-8 rounded-2xl bg-cultr-mint border border-cultr-sage h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold text-cultr-forest tracking-widest">STEP {item.step}</span>
                    <div className="flex-1 h-px bg-cultr-sage" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cultr-sage flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-cultr-text mb-3">{item.title}</h3>
                  <p className="text-cultr-textMuted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={450} className="text-center mt-12">
            <Link href="/how-it-works" className="inline-flex items-center text-cultr-forest hover:text-cultr-forestDark font-medium transition-colors">
              Learn more about the process <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-cultr-offwhite">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Everything you need to <span className="italic">optimize</span>
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              From comprehensive testing to personalized protocols, we provide the tools for peak performance.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FlaskConical,
                title: 'Comprehensive Labs',
                desc: 'Full metabolic panels, hormone testing, and biomarker analysis.',
              },
              {
                icon: Dna,
                title: 'Peptide Library',
                desc: 'Access our curated library of research-backed peptide protocols.',
              },
              {
                icon: Sparkles,
                title: 'Protocol Engine',
                desc: 'AI-powered, clinician-reviewed recommendations based on your biomarkers.',
              },
              {
                icon: Stethoscope,
                title: 'Provider Access',
                desc: 'Direct messaging with licensed healthcare providers.',
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                desc: 'Monitor your biomarkers and see improvements over time.',
              },
              {
                icon: BookOpen,
                title: 'Education Hub',
                desc: 'Evidence-based articles and protocols in our knowledge library.',
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

      {/* Comparison Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              CULTR vs <span className="italic">standard care</span>
            </h2>
            <p className="text-cultr-textMuted">See why members choose CULTR for their health optimization.</p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl border border-cultr-sage overflow-hidden">
              <div className="grid grid-cols-3 bg-cultr-forest text-white">
                <div className="p-4 font-medium">Feature</div>
                <div className="p-4 font-medium text-center">Standard Care</div>
                <div className="p-4 font-medium text-center bg-cultr-forestDark">CULTR</div>
              </div>
              {[
                ['Comprehensive lab panels', '5-10 markers', '50+ markers'],
                ['Wait time for appointments', '2-4 weeks', '24-48 hours'],
                ['Provider messaging', 'Limited', 'Unlimited'],
                ['Peptide protocols', 'Not available', 'Full access'],
                ['Protocol customization', 'Generic', 'Personalized'],
                ['Cost per year', '$3,000+', 'From $1,188'],
              ].map(([feature, standard, cultr], i) => (
                <div key={i} className="grid grid-cols-3 border-t border-cultr-sage">
                  <div className="p-4 text-cultr-text text-sm">{feature}</div>
                  <div className="p-4 text-center text-cultr-textMuted text-sm">{standard}</div>
                  <div className="p-4 text-center text-cultr-forest font-medium text-sm bg-cultr-mint/50">{cultr}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-cultr-offwhite">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Simple, <span className="italic">transparent</span> pricing
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Choose a membership that fits your goals. All plans include provider access and our core platform.
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[PLANS[0], PLANS[3], PLANS[4]].map((plan) => (
              <PricingCard key={plan.slug} plan={plan} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button variant="secondary">View All Plans</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6 bg-cultr-forest text-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Trusted by <span className="italic">thousands</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Join the community of health-conscious individuals optimizing their biology.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally, a telehealth service that takes optimization seriously. The peptide protocols have been transformative.",
                name: "Michael R.",
                title: "Member since 2024",
              },
              {
                quote: "The comprehensive lab work and personalized protocols are exactly what I was looking for. Worth every penny.",
                name: "Sarah K.",
                title: "Member since 2024",
              },
              {
                quote: "Having direct access to providers who understand longevity medicine has been a game changer.",
                name: "David L.",
                title: "Member since 2024",
              },
            ].map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 h-full">
                  <p className="text-white/90 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/60">{testimonial.title}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Frequently asked <span className="italic">questions</span>
            </h2>
          </ScrollReveal>

          <FAQAccordion items={[
            { question: 'What is included in the membership?', answer: 'All memberships include telehealth consultations with licensed providers, access to our platform, messaging support, and our core lab panel review. Higher tiers include more frequent consults, peptide protocol access, and priority support.' },
            { question: 'How do the peptide protocols work?', answer: 'Our peptide library contains research-backed protocols for various health goals. After your consultation, your provider can recommend specific peptides based on your labs and objectives. All peptides are compounded at licensed pharmacies.' },
            { question: 'Is CULTR available in my state?', answer: 'CULTR operates in most US states. During signup, we verify availability in your location. Telehealth regulations vary by state, and we ensure compliance with local requirements.' },
            { question: 'Can I use HSA/FSA funds?', answer: 'Yes! CULTR memberships are HSA/FSA eligible. We provide documentation needed for reimbursement from your health savings account.' },
          ]} />

          <div className="text-center mt-10">
            <Link href="/how-it-works#faq" className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSignup />

      {/* Final CTA */}
      <CTASection
        title="Ready to optimize your biology?"
        subtitle="Join thousands who are taking control of their health with CULTR."
        ctaText="Get Started Today"
      />
    </div>
  );
}
