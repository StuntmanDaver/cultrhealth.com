import { Metadata } from 'next';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  DollarSign,
  Link2,
  BarChart3,
  Users,
  Shield,
  Megaphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Creator Program — CULTR Health',
  description: 'Join the CULTR Creator program. Earn commissions, get tracking links and coupon codes, and grow your network with our affiliate platform.',
};

export default function CreatorsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Megaphone className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">Affiliate Program</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Earn with CULTR
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Share CULTR Health with your audience and earn commissions on every referral. Tracking links, coupon codes, and a dedicated dashboard — all built for creators.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/creators/apply">
                <Button size="lg">
                  Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link
                href="/creators/login"
                className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
              >
                Already a creator? Log in
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-6 bg-white">
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
                desc: 'Submit your application with your name, email, and social handles. We review and approve within 48 hours.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Share your link',
                desc: 'Get a unique tracking link and coupon code. Share with your audience across any platform.',
                icon: Link2,
              },
              {
                step: '03',
                title: 'Earn commissions',
                desc: 'Earn 10% on every attributed order. Recruit other creators and unlock override commissions up to 8%.',
                icon: DollarSign,
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150} direction="up">
                <div className="relative p-8 rounded-2xl bg-cultr-mint border border-cultr-sage h-full">
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
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 px-6 bg-cultr-offwhite">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Creator benefits
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: DollarSign,
                title: '10% Direct Commission',
                desc: 'Earn on every order attributed to your link or code. Payouts monthly via Stripe Connect, bank transfer, or PayPal.',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Dashboard',
                desc: 'Track clicks, orders, revenue, and commissions in real time. See what content converts best.',
              },
              {
                icon: Users,
                title: 'Network Overrides',
                desc: 'Recruit other creators and earn override commissions. Unlock higher rates at 5, 10, 15, and 20 recruit milestones.',
              },
              {
                icon: Link2,
                title: 'Tracking Links & Coupon Codes',
                desc: 'Deep links to any page. Personalized coupon codes for your audience. UTM builder included.',
              },
              {
                icon: Shield,
                title: 'Compliance Resources',
                desc: 'FTC disclosure templates, approved claims guide, and brand kit. Stay compliant without the guesswork.',
              },
              {
                icon: Megaphone,
                title: 'Content Support',
                desc: 'Short-form hooks, scripts, and product education materials to help you create content that converts.',
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100} direction="up">
                <div className="flex items-start gap-4 p-6 rounded-xl bg-white border border-cultr-sage">
                  <div className="w-10 h-10 rounded-lg bg-cultr-mint flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-cultr-forest" />
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

      {/* Commission Tiers */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Recruiting tiers
            </h2>
            <p className="text-cultr-textMuted max-w-2xl mx-auto">
              Grow your network and unlock higher override commissions on your recruits&apos; sales.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cultr-sage">
                    <th className="text-left py-4 px-4 font-display font-bold text-cultr-text text-sm">Milestone</th>
                    <th className="text-center py-4 px-4 font-display font-bold text-cultr-text text-sm">Recruits</th>
                    <th className="text-center py-4 px-4 font-display font-bold text-cultr-forest text-sm">Override Rate</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { milestone: 'Tier 1', recruits: '5', rate: '+2%' },
                    { milestone: 'Tier 2', recruits: '10', rate: '+4%' },
                    { milestone: 'Tier 3', recruits: '15', rate: '+6%' },
                    { milestone: 'Tier 4 (Max)', recruits: '20', rate: '+8%' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-cultr-sage/50">
                      <td className="py-4 px-4 text-cultr-text font-medium">{row.milestone}</td>
                      <td className="py-4 px-4 text-center text-cultr-textMuted">{row.recruits}</td>
                      <td className="py-4 px-4 text-center text-cultr-forest font-bold">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-cultr-textMuted mt-4 text-center">
              Total payout per order is capped at 20% of net revenue across all parties.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Apply CTA */}
      <section id="apply" className="py-16 md:py-20 px-6 bg-cultr-forest text-white">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to earn?
            </h2>
            <p className="text-white/70 mb-10 max-w-xl mx-auto">
              Apply to the CULTR Creator program today. We review applications within 48 hours and onboard approved creators with links, codes, and resources immediately.
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

      {/* CTA */}
      <CTASection
        title="Not a creator? Join as a member."
        subtitle="Plans from $199/mo with provider access and peptide protocols."
        ctaText="View Plans"
        ctaLink="/pricing"
      />
    </div>
  );
}
