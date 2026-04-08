import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { MarketingHero } from '@/components/site/MarketingHero';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import Button from '@/components/ui/Button';
import { HoverCard } from '@/components/ui/HoverCard';
import { ParallaxReveal } from '@/components/ui/ParallaxReveal';
import {
  COMMISSION_CONFIG,
  TIER_CONFIGS,
  FTC_DISCLOSURES,
} from '@/lib/config/affiliate';
import {
  ArrowRight,
  DollarSign,
  Link2,
  BarChart3,
  Users,
  Shield,
  Megaphone,
  Trophy,
  CreditCard,
  Calendar,
  FileText,
  Palette,
  Target,
  Zap,
  Clock,
  Award,
  TrendingUp,
  Bookmark,
  Copy,
} from 'lucide-react';

const TrustMarquee = dynamic(
  () => import('@/components/site/TrustMarquee'),
  { loading: () => <div className="h-14" /> }
);

export const metadata: Metadata = {
  title: 'Creator Program — CULTR Health',
  description: 'Join the CULTR Creator program. Earn 10% direct commissions, up to 20% override on recruits, dual coupon codes, real-time dashboard, and 30+ marketing resources.',
};

export default function CreatorsPage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <MarketingHero
        badge={{ icon: Megaphone, label: 'Creator Program' }}
        title={<>Grow with a premium wellness brand your audience actually wants to share.</>}
        subtitle="Earn with referral links, discount codes, dashboard tracking, and a creator program built for wellness, performance, and community growth."
        ctas={[
          { label: 'Apply Now', href: '/creators/apply' },
          { label: 'Creator Login', href: '/creators/login', variant: 'ghost' },
        ]}
        backgroundImage="/images/hero-cultr-office.png"
      >
        <ScrollReveal delay={500} direction="none" duration={800}>
          <div className="mt-6">
            <SocialProofBadge variant="pill" className="text-white/80" />
          </div>
        </ScrollReveal>
      </MarketingHero>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Bridge */}
      <div className="hidden md:block h-20 bridge-dark-to-light" />

      {/* ─── Three Commission Streams ─── */}
      <section className="py-16 md:py-20 px-6 grad-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Three ways to earn
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Every sale you drive earns commission. Recruit other creators to unlock override earnings on their sales too.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: 'Membership Direct',
                rate: `${COMMISSION_CONFIG.directRate}%`,
                desc: 'Earn on every subscription referral — Core, Catalyst+, or Concierge.',
                color: 'bg-emerald-500/10 text-emerald-700',
              },
              {
                icon: DollarSign,
                title: 'Product Direct',
                rate: `${COMMISSION_CONFIG.directRate}%`,
                desc: 'Earn on product purchases made with your code or tracking link.',
                color: 'bg-blue-500/10 text-blue-700',
              },
              {
                icon: Users,
                title: 'Recruitment Override',
                rate: `${TIER_CONFIGS[0].overrideRate}–${TIER_CONFIGS[TIER_CONFIGS.length - 1].overrideRate}%`,
                desc: 'Earn on your recruited creators\' sales. Rate increases as your network grows.',
                color: 'bg-purple-500/10 text-purple-700',
              },
            ].map((stream, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="up">
                <HoverCard glow className="relative p-6 rounded-2xl bg-white border border-cultr-sage/30 shadow-sm h-full text-center">
                  <div className={`w-12 h-12 rounded-xl ${stream.color} flex items-center justify-center mx-auto mb-4`}>
                    <stream.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-display font-bold text-cultr-forest mb-1">{stream.rate}</div>
                  <h3 className="text-base font-display font-bold text-cultr-text mb-2">{stream.title}</h3>
                  <p className="text-sm text-cultr-textMuted leading-relaxed">{stream.desc}</p>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400} className="text-center mt-8">
            <p className="text-xs text-cultr-textMuted">
              Total commission capped at {COMMISSION_CONFIG.totalCapRate}% per sale during your first {COMMISSION_CONFIG.bonusWindowMonths} months. Flat {COMMISSION_CONFIG.postBonusRate}% after bonus window.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Bonus Window Callout ─── */}
      <section className="px-6 pb-16 section-veil">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <HoverCard glow className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cultr-forest to-forest-dark p-8 md:p-10 text-white">
              <ParallaxReveal offset={30} className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/2">
                <div className="w-full h-full bg-cultr-sage/10 rounded-full" />
              </ParallaxReveal>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 mb-4">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-xs font-medium">6-Month Bonus Window</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-3">
                  Your first {COMMISSION_CONFIG.bonusWindowMonths} months: earn up to {COMMISSION_CONFIG.totalCapRate}% per sale
                </h3>
                <p className="text-white/80 max-w-xl mb-6">
                  Stack {COMMISSION_CONFIG.directRate}% direct commission with up to {TIER_CONFIGS[TIER_CONFIGS.length - 1].overrideRate - COMMISSION_CONFIG.directRate}% override earnings during your accelerated earning window. After {COMMISSION_CONFIG.bonusWindowMonths} months, direct commissions continue at a flat {COMMISSION_CONFIG.postBonusRate}%.
                </p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div className="text-2xl font-display font-bold text-cultr-sage">{COMMISSION_CONFIG.totalCapRate}%</div>
                    <div className="text-white/60">Max per sale (bonus)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-cultr-sage">{COMMISSION_CONFIG.bonusWindowMonths} mo</div>
                    <div className="text-white/60">Bonus window</div>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-cultr-sage">{COMMISSION_CONFIG.postBonusRate}%</div>
                    <div className="text-white/60">After bonus</div>
                  </div>
                </div>
              </div>
            </HoverCard>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 md:py-20 px-6 grad-light">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest">
              How it works
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Apply & get approved',
                desc: 'Submit your application. We review within 48 hours. Get dual coupon codes and tracking links immediately on approval.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Share & track',
                desc: 'Custom tracking links to any page, personalized coupon codes, UTM builder, and ready-to-post social templates for every platform.',
                icon: Link2,
              },
              {
                step: '03',
                title: 'Earn & grow',
                desc: `${COMMISSION_CONFIG.directRate}% direct on every sale. Recruit creators to unlock override commissions up to ${TIER_CONFIGS[TIER_CONFIGS.length - 1].overrideRate}%.`,
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <HoverCard glow className="relative p-8 rounded-2xl grad-mint border border-cultr-sage h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-display font-bold text-cultr-forest tracking-widest">STEP {item.step}</span>
                    <div className="flex-1 h-px bg-cultr-sage" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cultr-sage flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-cultr-forest" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-cultr-text mb-3">{item.title}</h3>
                  <p className="text-cultr-textMuted text-sm leading-relaxed">{item.desc}</p>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tier Progression ─── */}
      <section className="py-16 md:py-20 px-6 grad-white border-t border-cultr-sage/20">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Network tiers
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Recruit creators and unlock higher override commissions on their sales. Tiers auto-update as your network grows.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            {/* Tier visual progression */}
            <div className="flex items-center justify-between mb-8 px-2">
              {TIER_CONFIGS.map((tier, i) => (
                <div key={tier.tier} className="flex flex-col items-center text-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    i === TIER_CONFIGS.length - 1
                      ? 'bg-cultr-forest text-white'
                      : 'bg-cultr-sage/40 text-cultr-forest'
                  }`}>
                    <span className="text-sm font-display font-bold">{tier.overrideRate}%</span>
                  </div>
                  <span className="text-xs font-display font-bold text-cultr-forest">{tier.name}</span>
                  <span className="text-[10px] text-cultr-textMuted">{tier.minRecruits}+ recruits</span>
                </div>
              ))}
            </div>

            {/* Connector line */}
            <div className="relative h-1 bg-cultr-sage/20 rounded-full mx-8 -mt-[4.5rem] mb-16">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cultr-sage to-cultr-forest rounded-full" style={{ width: '100%' }} />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cultr-sage">
                    <th className="text-left py-4 px-4 font-display font-bold text-cultr-text text-sm">Tier</th>
                    <th className="text-center py-4 px-4 font-display font-bold text-cultr-text text-sm">Recruits</th>
                    <th className="text-center py-4 px-4 font-display font-bold text-cultr-forest text-sm">Override Rate</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {TIER_CONFIGS.map((tier) => (
                    <tr key={tier.tier} className="border-b border-cultr-sage/50">
                      <td className="py-4 px-4 text-cultr-text font-medium">
                        <span className="inline-flex items-center gap-2">
                          {tier.name}
                          {tier.tier === TIER_CONFIGS.length - 1 && (
                            <span className="text-[10px] bg-cultr-forest text-white px-2 py-0.5 rounded-full">MAX</span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-cultr-textMuted">{tier.minRecruits}+</td>
                      <td className="py-4 px-4 text-center text-cultr-forest font-bold">{tier.overrideRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-cultr-textMuted mt-4 text-center">
              Total payout per order is capped at {COMMISSION_CONFIG.totalCapRate}% of net revenue during the {COMMISSION_CONFIG.bonusWindowMonths}-month bonus window.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── What You Get ─── */}
      <section className="py-16 md:py-20 px-6 grad-light">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Everything in your creator toolkit
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              From tracking tools to marketing resources — everything you need to create, share, and earn.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: BarChart3,
                title: 'Real-Time Dashboard',
                desc: 'Track clicks, orders, revenue, commissions, and conversion rates with interactive analytics charts.',
              },
              {
                icon: Copy,
                title: 'Dual Coupon Codes',
                desc: 'Auto-generated membership code and product 10% off code. Track usage and revenue per code.',
              },
              {
                icon: Link2,
                title: 'Custom Tracking Links',
                desc: 'Unlimited links to any page with UTM parameters built in. Track click-to-conversion for every link.',
              },
              {
                icon: FileText,
                title: 'Ready-to-Post Content',
                desc: 'Pre-written social templates for Instagram, Twitter/X, and Facebook — auto-populated with your link and code.',
              },
              {
                icon: Bookmark,
                title: '30+ Marketing Resources',
                desc: 'Messaging playbook, content templates, editorial calendars, sales funnel guides, product education, and brand kit.',
              },
              {
                icon: Award,
                title: '11 Milestone Badges',
                desc: 'Unlock achievements — First Click, First Sale, $1K Revenue, Gold Network, $10K Revenue, and more.',
              },
              {
                icon: Trophy,
                title: 'Creator Leaderboard',
                desc: 'Rank against other creators by clicks, conversions, or revenue. Top 3 get featured.',
              },
              {
                icon: Calendar,
                title: 'Campaign Bonuses',
                desc: 'Seasonal and promotional bonus campaigns with elevated commission rates and exclusive offers.',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 80} direction="up">
                <HoverCard glow className="flex items-start gap-4 p-5 rounded-xl bg-white border border-cultr-sage/30 shadow-sm h-full">
                  <div className="w-10 h-10 rounded-lg grad-mint flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-cultr-forest" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-cultr-text mb-1">{item.title}</h4>
                    <p className="text-sm text-cultr-textMuted leading-relaxed">{item.desc}</p>
                  </div>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Payout Details ─── */}
      <section className="py-16 md:py-20 px-6 grad-white border-t border-cultr-sage/20">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Transparent payouts
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                icon: Clock,
                label: 'Payout Schedule',
                value: `Net-${COMMISSION_CONFIG.payoutDelayDays}`,
                note: `${COMMISSION_CONFIG.approvalDelayDays}-day refund window`,
              },
              {
                icon: DollarSign,
                label: 'Minimum Payout',
                value: `$${COMMISSION_CONFIG.minPayoutAmount}`,
                note: 'No maximum cap',
              },
              {
                icon: CreditCard,
                label: 'Payment Methods',
                value: '3 options',
                note: 'Stripe, bank, PayPal',
              },
              {
                icon: Shield,
                label: 'Auto-Approval',
                value: `${COMMISSION_CONFIG.approvalDelayDays} days`,
                note: 'Commissions auto-approve',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <HoverCard glow className="text-center p-5 rounded-xl grad-mint border border-cultr-sage/30 h-full">
                  <item.icon className="w-5 h-5 text-cultr-forest mx-auto mb-2" />
                  <div className="text-lg font-display font-bold text-cultr-forest">{item.value}</div>
                  <div className="text-sm font-medium text-cultr-text">{item.label}</div>
                  <div className="text-xs text-cultr-textMuted mt-1">{item.note}</div>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who It's For ─── */}
      <section className="py-16 md:py-20 px-6 grad-light">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-3">
              Built for every creator type
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                track: 'Transformation Creators',
                desc: 'Weight loss journeys, before/after biomarkers, wellness routines, and health transformation stories.',
                examples: 'Fitness influencers, weight loss coaches, wellness bloggers',
              },
              {
                icon: Zap,
                track: 'Performance Creators',
                desc: 'Gym content, recovery protocols, athletic optimization, supplement reviews, and biohacking.',
                examples: 'Athletes, gym creators, sports content, biohackers',
              },
              {
                icon: Shield,
                track: 'Trust Creators',
                desc: 'Science communication, healthcare education, evidence-based wellness, and clinical insight content.',
                examples: 'Pre-med students, science educators, health podcasters',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="up">
                <HoverCard glow className="p-6 rounded-2xl bg-white border border-cultr-sage/30 shadow-sm h-full flex flex-col">
                  <div className="w-10 h-10 rounded-lg grad-mint flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-cultr-forest" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-cultr-text mb-2">{item.track}</h3>
                  <p className="text-sm text-cultr-textMuted leading-relaxed mb-3 flex-1">{item.desc}</p>
                  <p className="text-xs text-cultr-forest/70 italic">{item.examples}</p>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FTC Compliance ─── */}
      <section className="py-16 md:py-20 px-6 grad-white border-t border-cultr-sage/20">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-3">
              Built-in compliance
            </h2>
            <p className="text-cultr-textMuted max-w-xl mx-auto">
              FTC disclosure templates, approved claims guide, health claims policy, and brand guidelines included. Stay compliant without the guesswork.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="space-y-3">
              {FTC_DISCLOSURES.map((disc) => (
                <HoverCard key={disc.id} glow className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-cultr-sage/30">
                  <div>
                    <span className="text-xs font-display font-bold text-cultr-forest uppercase tracking-wider">{disc.label}</span>
                    <p className="text-sm text-cultr-textMuted mt-0.5">{disc.text}</p>
                  </div>
                  <span className="text-xs text-cultr-textMuted whitespace-nowrap">Copy in portal</span>
                </HoverCard>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bridge */}
      <div className="hidden md:block h-28 bridge-light-to-dark" />

      {/* ─── Apply CTA ─── */}
      <section id="apply" className="py-16 md:py-20 px-6 grad-dark text-white">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to earn?
            </h2>
            <p className="text-white/70 mb-10 max-w-xl mx-auto">
              Apply to the <span className="font-display font-bold">CULTR</span> Creator program today. We review applications within 48 hours and onboard approved creators with links, codes, and resources immediately.
            </p>
            <Link href="/creators/apply">
              <Button variant="secondary" size="lg" className="text-white border-white/50 hover:bg-white/10 hover:border-white/70">
                Apply Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-white/60 mt-6">
              Already a creator?{' '}
              <Link href="/creators/login" className="text-white underline underline-offset-4 hover:text-cultr-sage transition-colors">
                Log in to your portal
              </Link>
            </p>
            <p className="text-xs text-white/40 mt-3">
              Questions? Reach out to creators@cultrhealth.com
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Member CTA ─── */}
      <CTASection
        title="Not a creator? Join as a member."
        subtitle="Plans from $149/mo with provider access and peptide protocols."
        ctaText="View Plans"
        ctaLink="/pricing"
      />
    </div>
  );
}
