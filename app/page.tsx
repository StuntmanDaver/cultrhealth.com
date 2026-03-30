import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { PLANS } from '@/lib/config/plans';
import { PROVIDERS } from '@/lib/config/social-proof';
import { TrustStrip } from '@/components/site/TrustStrip';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import { brandify } from '@/lib/utils';
import BiomarkerExplainerLink from '@/components/site/BiomarkerExplainer';
import {
  ArrowRight,
  FlaskConical,
  Stethoscope,
  Shield,
  Dna,
  TrendingUp,
  Users,
} from 'lucide-react';

const PricingCard = dynamic(() => import('@/components/site/PricingCard').then(mod => ({ default: mod.PricingCard })), {
  loading: () => <div className="h-96 bg-white/50 rounded-2xl animate-pulse" />,
});

const FAQAccordion = dynamic(() => import('@/components/site/FAQAccordion').then(mod => ({ default: mod.FAQAccordion })), {
  loading: () => <div className="h-64 grad-mint rounded-lg animate-pulse" />,
});

const ClubBanner = dynamic(() => import('@/components/site/ClubBanner').then(mod => ({ default: mod.ClubBanner })), {
  loading: () => <div className="h-32 grad-mint rounded-2xl animate-pulse" />,
});

const NewsletterSignup = dynamic(() => import('@/components/site/NewsletterSignup').then(mod => ({ default: mod.NewsletterSignup })), {
  loading: () => <div className="h-48 grad-light animate-pulse" />,
});

const TrustMarquee = dynamic(() => import('@/components/site/TrustMarquee'), {
  loading: () => <div className="h-24 bg-brand-primary animate-pulse" />,
});

const TestimonialsSection = dynamic(() => import('@/components/site/TestimonialsSection'), {
  loading: () => <div className="h-[740px] grad-dark animate-pulse" />,
});



export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      {/* Mobile hero — natural aspect ratio, text at bottom */}
      <section className="relative md:hidden grad-dark-glow overflow-hidden">
        <Image
          src="/images/hero-cultr-diverse-women.png"
          alt="CULTR — Five diverse women in athletic wear posing with CULTR branding"
          width={1536}
          height={1024}
          className="w-full h-auto"
          priority
          quality={85}
          sizes="100vw"
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, #FCFBF7 0%, rgba(43,69,66,0.15) 50%, transparent 100%)' }} />
      </section>

      {/* Desktop hero — cinematic wideshot */}
      <section className="relative hidden md:flex h-[80vh] min-h-[550px] max-h-[900px] px-6 grad-dark-glow overflow-hidden items-center">
        <Image
          src="/images/hero-cultr-diverse-women.png"
          alt="CULTR — Five diverse women in athletic wear posing with CULTR branding"
          fill
          className="object-cover object-[25%_center]"
          priority
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(43,69,66,0.55) 0%, rgba(43,69,66,0.3) 40%, rgba(43,69,66,0.08) 65%, transparent 80%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to top, #FCFBF7 0%, rgba(43,69,66,0.25) 35%, rgba(43,69,66,0.5) 65%, transparent 100%)' }} />

        <div className="absolute inset-0 z-10 flex items-center">
          <div className="text-left absolute left-[30%] lg:left-[30%] xl:left-[29%] 2xl:left-[28%] -translate-x-1/2 max-w-[420px] lg:max-w-[480px]">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold mb-4 leading-[1.1] text-white drop-shadow-lg">
              Change the<br /><span className="">CULTR</span>,<br /><span className="italic">rebrand</span> yourself.
            </h1>
            <p className="text-base text-white/80 mb-3 max-w-md drop-shadow">
              Physician-supervised optimization with lab testing, personalized protocols, and peptide therapy when appropriate.
            </p>
            <p className="text-xs text-cultr-sage font-medium tracking-wide mb-5 drop-shadow">
              33-biomarker panel (upgradable to 59+) · Licensed providers · Delivered to your door
            </p>
            <div className="flex flex-row items-center gap-3">
              <Link href="/quiz">
                <Button size="lg" className="border-2 border-transparent">Take the Quiz</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="text-[#2A4542] border-2 border-[#D7F3DC] bg-[#D7F3DC] hover:bg-[#c8edd0] rounded-full">
                  Compare Plans <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <TrustStrip />

      {/* ─── Results / Lifestyle ─── */}
      <section className="relative py-16 md:py-20 px-6 grad-light overflow-hidden">
        {/* Radial glow — top center bloom */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(215,243,220,0.35) 0%, transparent 100%)' }} />
        {/* Radial glow — bottom right accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 85% 90%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Mobile slogan + CTA buttons — moved from hero */}
          <div className="md:hidden mb-12 -mt-10 text-center">
            <h1 className="text-xl font-display font-bold leading-[1.15] text-[#2B4542] mb-3 whitespace-nowrap">
              Change the <span className="">CULTR</span>, <span className="italic">rebrand</span> yourself.
            </h1>
            <p className="text-xs text-cultr-textMuted mb-4 px-4">
              Physician-supervised optimization with lab testing and personalized protocols.
            </p>
            <div className="mb-4">
              <SocialProofBadge variant="inline" />
            </div>
            <div className="flex flex-row items-center justify-center gap-2">
              <Link href="/quiz">
                <Button size="sm" className="border-2 border-transparent text-sm px-5 py-2">Take the Quiz</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="text-[#2A4542] border-2 border-[#D7F3DC] bg-[#D7F3DC] hover:bg-[#c8edd0] rounded-full text-sm px-5 py-2">
                  Compare Plans <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
          <ScrollReveal className="text-center mb-12 mt-2 md:mt-0">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-display font-bold text-cultr-forest">
              Get matched to a personalized care path built around your goals, symptoms, and lab data — with licensed providers.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Video 1 - Smiling Man */}
            <ScrollReveal delay={100} direction="up" className="group">
              <div className="relative h-[400px] md:h-[500px] rounded-[28px] overflow-hidden shadow-lux-lg">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/images/lifestyle-man-smiling.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2B]/90 via-[#2B4542]/20 to-transparent" />
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

            {/* Video 2 - Woman Running */}
            <ScrollReveal delay={200} direction="up" className="group">
              <div className="relative h-[400px] md:h-[500px] rounded-[28px] overflow-hidden shadow-lux-lg">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute -inset-[10px] w-[calc(100%+20px)] h-[calc(100%+20px)] object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: 'center 25%' }}
                >
                  <source src="/images/lifestyle-woman-running.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2B]/90 via-[#2B4542]/20 to-transparent" />
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

            {/* Video 3 - Freedom */}
            <ScrollReveal delay={300} direction="up" className="group md:col-span-2 lg:col-span-1">
              <div className="relative h-[400px] md:h-[500px] rounded-[28px] overflow-hidden shadow-lux-lg">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/images/lifestyle-girl-running.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2B]/90 via-[#2B4542]/20 to-transparent" />
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
      <section className="py-16 md:py-20 px-6 section-veil">
        <div className="max-w-7xl mx-auto w-full">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest">
              Four steps to <span className="italic">rebrand</span> yourself.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Take the Quiz',
                desc: 'Tell us your goals and we\'ll match you with the right path.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Complete Your Blood Test',
                desc: '33 biomarkers tested at home — heart, metabolic, hormonal, thyroid, and more.',
                icon: FlaskConical,
              },
              {
                step: '03',
                title: 'Meet Your Provider',
                desc: 'A licensed clinician reviews your results, history, and goals.',
                icon: Stethoscope,
              },
              {
                step: '04',
                title: 'Your Protocol Arrives',
                desc: 'Personalized treatment shipped to your door fast.',
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <div className="relative p-8 rounded-2xl glass-card border-gradient h-full glow-card">
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

          <ScrollReveal delay={600} className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="primary" size="lg">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>


      {/* ─── Comparison Table ─── */}
      <section className="relative py-16 md:py-20 px-6 grad-white overflow-hidden">
        {/* Radial glow — bottom center */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 40% at 50% 100%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest">
              <span className="">CULTR</span> vs. the status quo
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl overflow-hidden shadow-lux-lg border border-brand-primary/10">
              <div className="grid grid-cols-3 grad-dark text-white font-display">
                <div className="p-4 font-medium">Feature</div>
                <div className="p-4 font-medium text-center">Standard Care</div>
                <div className="p-4 font-medium text-center" style={{ background: 'rgba(0,0,0,0.15)' }}><span className="font-display font-bold">CULTR</span></div>
              </div>
              {[
                { cells: ['Comprehensive lab panels', '5-10 markers', '33 biomarkers (up to 59+)'], hasBiomarkerLink: true },
                { cells: ['Wait time for appointments', '2-4 weeks', '24-48 hours'] },
                { cells: ['Provider messaging', 'Limited', 'Unlimited'] },
                { cells: ['Peptide protocols', 'Not available', 'Full access'] },
                { cells: ['Protocol customization', 'Generic', 'Personalized'] },
                { cells: ['Cost per year', '$3,000+', 'From $2,388'] },
              ].map((row, i) => {
                const [feature, standard, cultr] = row.cells;
                return (
                <div key={i} className="grid grid-cols-3 border-t border-cultr-sage">
                  <div className="p-4 text-cultr-text text-sm">
                    {feature}
                    {row.hasBiomarkerLink && (
                      <div className="mt-0.5">
                        <BiomarkerExplainerLink label="See what we test ›" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center text-cultr-textMuted text-sm">{standard}</div>
                  <div className="p-4 text-center text-cultr-forest font-medium text-sm bg-cultr-mint/50">{cultr}</div>
                </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Trust Logo Marquee ─── */}
      <TrustMarquee />

      {/* Bridge: light → dark */}
      <div className="hidden md:block h-28 bridge-light-to-dark" />

      {/* ─── CULTR Creator CTA ─── */}
      <section className="relative py-12 px-6 grad-dark overflow-hidden">
        {/* Radial glow — left accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 70% at 20% 50%, rgba(215,243,220,0.08) 0%, transparent 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-16 h-16 rounded-2xl glass-card-dark flex items-center justify-center shrink-0">
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
                <span className="inline-flex items-center px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors font-medium">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bridge: dark → light */}
      <div className="hidden md:block h-28 bridge-dark-to-light" />

      {/* ─── Pricing Preview ─── */}
      <section className="relative py-16 md:py-20 px-6 grad-light overflow-hidden">
        {/* Radial glow — top left accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 15% 10%, rgba(215,243,220,0.3) 0%, transparent 100%)' }} />
        {/* Radial glow — bottom right accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(35% 35% at 90% 85%, rgba(43,69,66,0.05) 0%, transparent 100%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest">
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

      {/* Newsletter */}
      <NewsletterSignup />

      {/* ─── Trust Badges Bar ─── */}
      <TrustStrip />

      {/* ─── Testimonials ─── */}
      <TestimonialsSection />

      {/* Bridge: dark → light */}
      <div className="hidden md:block h-28 bridge-dark-to-light" />

      {/* ─── Provider Credentials ─── */}
      <section className="relative py-16 md:py-20 px-6 grad-white overflow-hidden">
        {/* Radial glow — center bloom */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 50% at 50% 40%, rgba(215,243,220,0.2) 0%, transparent 100%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest">
              Your care team.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {PROVIDERS.map((provider, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="text-center p-8 rounded-2xl glass-card border-gradient glow-card">
                  <div className="w-36 h-36 mx-auto rounded-full mb-4 overflow-hidden">
                    {provider.image ? (
                      <img src={provider.image} alt={provider.name} loading="lazy" className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full grad-mint flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-cultr-forest" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-cultr-forest">{provider.name}</h3>
                  <p className="text-sm text-cultr-textMuted mt-1">{provider.specialty}</p>
                  {provider.credentials && <p className="text-xs text-cultr-textMuted mt-1">{provider.credentials}</p>}
                  {provider.yearsExperience > 0 && <p className="text-xs text-cultr-textMuted">{provider.yearsExperience}+ years experience</p>}
                  {provider.bio && (
                    <p className="text-xs text-cultr-textMuted mt-3 leading-relaxed">{provider.bio}</p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-cultr-textMuted">
              <Shield className="w-4 h-4" /> HIPAA Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-cultr-textMuted">
              <Stethoscope className="w-4 h-4" /> Licensed Providers &amp; 503A Pharmacy
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative py-16 md:py-20 px-6 grad-light overflow-hidden">
        {/* Radial glow — top right */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(40% 40% at 80% 10%, rgba(215,243,220,0.25) 0%, transparent 100%)' }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest">
              Questions.
            </h2>
          </ScrollReveal>

          <FAQAccordion items={[
            { question: 'What is included in the membership?', answer: 'All memberships include telehealth consultations with licensed providers, access to our platform, messaging support, and our core lab panel review. Higher tiers include more frequent consults, peptide protocol access, and priority support.' },
            { question: 'How do the peptide protocols work?', answer: 'Our peptide library contains research-backed protocols for various health goals. After your consultation, your provider can recommend specific peptides based on your labs and objectives. All peptides are compounded at licensed pharmacies.' },
            { question: 'Is CULTR available in my state?', answer: brandify('CULTR operates in most US states. During signup, we verify availability in your location. Telehealth regulations vary by state, and we ensure compliance with local requirements.') },
            { question: 'Can I use HSA/FSA funds?', answer: brandify('Yes! CULTR memberships are HSA/FSA eligible. We provide documentation needed for reimbursement from your health savings account.') },
          ]} />

          <div className="text-center mt-10">
            <Link href="/how-it-works#faq" className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Bridge: light → dark */}
      <div className="hidden md:block h-28 bridge-light-to-dark" />

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
