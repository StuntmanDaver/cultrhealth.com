import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { PLANS } from '@/lib/config/plans';
import { TESTIMONIALS, PROVIDERS, TRUST_METRICS, TRUST_BADGES } from '@/lib/config/social-proof';
import {
  ArrowRight,
  FlaskConical,
  Stethoscope,
  Shield,
  Building,
  CreditCard,
  Star,
  Dna,
  TrendingUp,
  Users,
} from 'lucide-react';

const PricingCard = dynamic(() => import('@/components/site/PricingCard').then(mod => ({ default: mod.PricingCard })), {
  loading: () => <div className="h-96 bg-white/50 rounded-2xl animate-pulse" />,
});

const FAQAccordion = dynamic(() => import('@/components/site/FAQAccordion').then(mod => ({ default: mod.FAQAccordion })), {
  loading: () => <div className="h-64 bg-cultr-mint rounded-lg animate-pulse" />,
});

const ClubBanner = dynamic(() => import('@/components/site/ClubBanner').then(mod => ({ default: mod.ClubBanner })), {
  loading: () => <div className="h-32 bg-cultr-mint rounded-2xl animate-pulse" />,
});

const NewsletterSignup = dynamic(() => import('@/components/site/NewsletterSignup').then(mod => ({ default: mod.NewsletterSignup })), {
  loading: () => <div className="h-48 bg-cultr-offwhite animate-pulse" />,
});

export const revalidate = 3600;

const BADGE_ICONS: Record<string, React.ElementType> = {
  Shield, Stethoscope, Building, CreditCard,
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[400px] md:min-h-[600px] lg:min-h-[700px] px-6 bg-cultr-forest overflow-hidden flex items-center">
        {/* Mobile hero image — taller crop with faces visible */}
        <Image
          src="/images/hero-banner-mobile.webp"
          alt="CULTR — Five women in athletic wear posing with CULTR branding"
          fill
          className="object-contain object-bottom md:hidden"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Desktop hero image — ultrawide landscape */}
        <Image
          src="/images/hero-banner-desktop.webp"
          alt="CULTR — Five women in athletic wear posing with CULTR branding"
          fill
          className="object-cover object-center hidden md:block"
          priority
          quality={75}
          sizes="100vw"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(43,69,66,0.45) 0%, rgba(43,69,66,0.22) 50%, transparent 75%)' }} />
        {/* Dark green edge at bottom to match brand */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #2B4542 0%, rgba(43,69,66,0.6) 40%, transparent 100%)' }} />

        <div className="max-w-7xl mx-auto relative z-10 w-full py-16 md:py-20">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-5 leading-[1.1] text-white drop-shadow-lg">
              Change the CULTR, <span className="italic">rebrand</span> yourself.
            </h1>

            <p className="text-base md:text-lg text-white mb-8 max-w-md">
              Lab-tested protocols. Licensed providers. Peptides that work. From $199/mo.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/quiz">
                <Button size="lg" className="border-2 border-transparent">Take the Quiz</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="text-white border-2 border-white/70 bg-white/10 hover:bg-white/20 hover:text-cultr-sage rounded-full">
                  See Plans <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results / Lifestyle ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-gradient-to-br from-cultr-offwhite via-white to-cultr-mint/20 overflow-hidden">
        {/* Radial glow — top center bloom */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(215,243,220,0.35) 0%, transparent 100%)' }} />
        {/* Radial glow — bottom right accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 85% 90%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-cultr-forest">
              Real results. No nonsense.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Image 1 - Smiling Man */}
            <ScrollReveal delay={100} direction="up" className="group">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/lifestyle-man-smiling.webp"
                  alt="Confident member after optimization"
                  fill
                  className="object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cultr-forest/80 via-cultr-forest/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cultr-sage" />
                    <span className="text-xs font-display font-bold text-white tracking-widest">CONFIDENCE</span>
                  </div>
                  <p className="text-white text-sm md:text-base leading-relaxed">
                    Look in the mirror and like what you see.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Image 2 - Woman Running */}
            <ScrollReveal delay={200} direction="up" className="group">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/lifestyle-woman-running-new.webp"
                  alt="Athletic woman running"
                  fill
                  className="object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cultr-forestDark/80 via-cultr-forest/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cultr-sage" />
                    <span className="text-xs font-display font-bold text-white tracking-widest">ENDURANCE</span>
                  </div>
                  <p className="text-white text-sm md:text-base leading-relaxed">
                    Outrun the version of you from six months ago.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Image 3 - Sunset Freedom */}
            <ScrollReveal delay={300} direction="up" className="group md:col-span-2 lg:col-span-1">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/lifestyle-girl-running.webp"
                  alt="Woman running outdoors representing freedom and vitality"
                  fill
                  className="object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cultr-forest/80 via-cultr-forest/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cultr-sage" />
                    <span className="text-xs font-display font-bold text-white tracking-widest">FREEDOM</span>
                  </div>
                  <p className="text-white text-sm md:text-base leading-relaxed">
                    Stop managing symptoms. Start living.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={400} className="text-center mt-16">
            <Link href="/quiz">
              <Button size="lg">
                Find Your Protocol <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-cultr-offwhite overflow-hidden">
        {/* Radial glow — center mint */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(215,243,220,0.3) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              Three steps to <span className="italic">rebrand</span> yourself.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Take the quiz',
                desc: '2 minutes. We match you to a plan and protocol.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Talk to a provider',
                desc: 'Licensed clinician reviews your labs, not an algorithm.',
                icon: Stethoscope,
              },
              {
                step: '03',
                title: 'Get treated',
                desc: 'Peptides ship to your door. Track results in your dashboard.',
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <div className="relative p-8 rounded-2xl bg-cultr-mint border border-cultr-sage h-full glow-card">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-display font-bold text-cultr-forest tracking-widest">STEP {item.step}</span>
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
              Learn more <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </ScrollReveal>
        </div>
      </section>


      {/* ─── Comparison Table ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-white overflow-hidden">
        {/* Radial glow — bottom center */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 40% at 50% 100%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              CULTR vs. the status quo
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl border border-cultr-sage overflow-hidden">
              <div className="grid grid-cols-3 bg-cultr-forest text-white font-display">
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
                ['Cost per year', '$3,000+', 'From $2,388'],
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

      {/* ─── Pricing Preview ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-cultr-offwhite overflow-hidden">
        {/* Radial glow — top left accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 15% 10%, rgba(215,243,220,0.3) 0%, transparent 100%)' }} />
        {/* Radial glow — bottom right accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(35% 35% at 90% 85%, rgba(43,69,66,0.05) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              Transparent pricing.
            </h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto mb-10">
            <ClubBanner />
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.filter((p) => p.slug !== 'club').map((plan) => (
              <PricingCard key={plan.slug} plan={plan} />
            ))}
          </div>

          <div className="text-center mt-12 space-y-4">
            <Link href="/pricing">
              <Button variant="secondary">View All Plans</Button>
            </Link>
            <p className="text-sm text-cultr-textMuted">
              Not sure which plan?{' '}
              <Link href="/quiz" className="text-cultr-forest font-medium hover:underline">
                Take the quiz
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── CULTR Creator CTA ─── */}
      <section className="relative py-12 px-6 bg-cultr-forest overflow-hidden">
        {/* Radial glow — left accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 70% at 20% 50%, rgba(215,243,220,0.08) 0%, transparent 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
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

      {/* Newsletter */}
      <NewsletterSignup />

      {/* ─── Testimonials (expanded) ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-cultr-forest text-white overflow-hidden">
        {/* Radial glow — top center mint */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 35% at 50% 0%, rgba(215,243,220,0.1) 0%, transparent 100%)' }} />
        {/* Radial glow — bottom center */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 40% at 50% 100%, rgba(215,243,220,0.07) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What members say.
            </h2>
            <div className="flex items-center justify-center gap-2 text-white/70">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-cultr-sage text-cultr-sage" />
                ))}
              </div>
              <span>{TRUST_METRICS.avgRating} out of 5 from {TRUST_METRICS.reviewCount} reviews</span>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.slice(0, 6).map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 h-full flex flex-col glow-card glow-card-dark">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-cultr-sage text-cultr-sage" />
                      ))}
                    </div>
                    {testimonial.highlight && (
                      <span className="text-xs font-bold bg-cultr-sage/20 text-cultr-sage px-3 py-1 rounded-full">
                        {testimonial.highlight}
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 mb-6 flex-1">&ldquo;{testimonial.quote}&rdquo;</p>
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

      {/* ─── Provider Credentials ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-white overflow-hidden">
        {/* Radial glow — center bloom */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 50% at 50% 40%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              Your care team.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {PROVIDERS.map((provider, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="text-center p-8 rounded-2xl bg-cultr-offwhite border border-cultr-sage glow-card">
                  <div className="w-20 h-20 mx-auto rounded-full bg-cultr-mint flex items-center justify-center mb-4">
                    <Stethoscope className="w-8 h-8 text-cultr-forest" />
                  </div>
                  <h3 className="font-display font-bold text-cultr-forest">{provider.name}</h3>
                  <p className="text-sm text-cultr-textMuted mt-1">{provider.specialty}</p>
                  <p className="text-xs text-cultr-textMuted mt-1">{provider.credentials}</p>
                  <p className="text-xs text-cultr-textMuted">{provider.yearsExperience}+ years experience</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-cultr-textMuted">
              <Shield className="w-4 h-4" /> HIPAA Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-cultr-textMuted">
              <Building className="w-4 h-4" /> Licensed 503A Pharmacy
            </div>
            <div className="flex items-center gap-2 text-sm text-cultr-textMuted">
              <Shield className="w-4 h-4" /> DEA Licensed
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative py-16 md:py-20 px-6 bg-cultr-offwhite overflow-hidden">
        {/* Radial glow — top right */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 80% 10%, rgba(215,243,220,0.25) 0%, transparent 100%)' }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              Questions.
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

      {/* Final CTA */}
      <CTASection
        title="Stop guessing. Start optimizing."
        subtitle="Take the 2-minute quiz and get matched to your protocol."
        ctaText="Take the Quiz"
        ctaLink="/quiz"
      />
    </div>
  );
}
