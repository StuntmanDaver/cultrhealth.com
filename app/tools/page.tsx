import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Calculator, Utensils, HelpCircle, Layers, ArrowRight, Wrench } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';

export const metadata = {
  title: 'Protocol Tools — CULTR Health',
  description:
    'Free peptide dosing calculator and calorie & macro calculator — no account required.',
};

const TrustMarquee = dynamic(
  () => import('@/components/site/TrustMarquee'),
  { loading: () => <div className="h-14" /> }
);

const tools = [
  {
    href: '/tools/dosing-calculator',
    icon: Calculator,
    title: 'Dosing Calculator',
    description:
      'Calculate exact peptide reconstitution ratios and draw amounts for any vial size and dose.',
  },
  {
    href: '/tools/calorie-calculator',
    icon: Utensils,
    title: 'Calorie & Macro Calculator',
    description:
      'Advanced TDEE calculator with multiple BMR formulas, activity levels, and goal-based macro splits.',
  },
  // DEACTIVATED — peptide FAQ & stacking guides hidden for now; re-enable later
  // {
  //   href: '/tools/peptide-faq',
  //   icon: HelpCircle,
  //   title: 'Peptide FAQ',
  //   description:
  //     'Comprehensive answers to 100+ questions about peptide therapy, sourced from community and clinical research.',
  // },
  // {
  //   href: '/tools/stacking-guides',
  //   icon: Layers,
  //   title: 'Stacking Guides',
  //   description:
  //     'Goal-based peptide stacking protocols for fat loss, recovery, growth, and longevity optimization.',
  // },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-14 px-6 grad-dark-glow text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Wrench className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">Free Tools</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              Protocol Tools
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Free tools to help you calculate and plan your health
              protocols — no account required.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Bridge */}
      <div className="hidden md:block h-28 bridge-dark-to-light" />

      {/* Tool Cards */}
      <section className="py-12 md:py-16 px-6 grad-light">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-2">
              Choose a Tool
            </h2>
            <p className="text-sm text-cultr-textMuted max-w-xl mx-auto">
              Everything you need to plan and optimize your protocols.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {tools.map(({ href, icon: Icon, title, description }, i) => (
              <ScrollReveal key={href} delay={i * 100} direction="up">
                <Link
                  href={href}
                  className="group flex flex-col gap-4 glass-card rounded-2xl border-gradient glow-card p-7 h-full transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-cultr-forest" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-cultr-forest/30 group-hover:text-cultr-forest group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-cultr-forest mb-2">
                      {title}
                    </h2>
                    <p className="text-cultr-textMuted text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <CTASection
        title="Stop guessing. Start optimizing."
        subtitle="Take the 2-minute quiz to find your protocol."
        ctaText="Take the Quiz"
        ctaLink="/quiz"
      />
    </div>
  );
}
