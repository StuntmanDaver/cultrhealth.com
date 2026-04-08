import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { THERAPY_PRODUCTS } from '@/lib/config/therapies';
import { CTASection } from '@/components/site/CTASection';
import { PrescriptionDisclaimer } from '@/components/compliance/PrescriptionDisclaimer';
import { MarketingHero } from '@/components/site/MarketingHero';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  Shield,
  Stethoscope,
  Target,
  FileText,
  Pill,
  FlaskConical,
  UserCheck,
} from 'lucide-react';

const TrustMarquee = dynamic(
  () => import('@/components/site/TrustMarquee'),
  { loading: () => <div className="h-14" /> }
);

const TherapiesClient = dynamic(
  () => import('./TherapiesClient'),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-brand-cream/50 animate-pulse h-[420px]" />
        ))}
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Therapies — CULTR Health',
  description:
    'Explore physician-supervised therapies organized by goal — weight management, recovery, cognitive performance, longevity, and more. Every protocol is personalized by a licensed provider.',
};

export default function TherapiesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <MarketingHero
        badge={{ icon: Stethoscope, label: 'Physician-Supervised' }}
        title="Protocols tailored to your goals, not one-size-fits-all prescriptions."
        subtitle="Every protocol is personalized by a licensed provider based on your history, goals, labs, and medical eligibility."
        ctas={[
          { label: 'Take the Quiz', href: '/quiz' },
          { label: 'Compare Plans', href: '/pricing', variant: 'ghost' },
        ]}
        size="compact"
        backgroundImage="/images/hero-cultr-diverse-women.png"
      />

      {/* Social Proof */}
      <div className="py-4 px-6 grad-dark-glow -mt-8">
        <div className="max-w-4xl mx-auto flex justify-center">
          <SocialProofBadge variant="pill" className="text-white/80" />
        </div>
      </div>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Bridge */}
      <div className="hidden md:block h-20 bridge-dark-to-light" />

      {/* How Protocols Are Chosen */}
      <section className="py-10 md:py-14 px-6 grad-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-3">
              How protocols are chosen
            </h2>
            <p className="text-sm text-cultr-textMuted max-w-xl mx-auto">
              Your provider considers multiple factors to build a protocol that fits your unique situation.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { icon: Target, label: 'Your goals' },
              { icon: FileText, label: 'Medical history' },
              { icon: Pill, label: 'Current medications' },
              { icon: FlaskConical, label: 'Biomarker data' },
              { icon: UserCheck, label: 'Provider judgment' },
            ].map(({ icon: Icon, label }, i) => (
              <ScrollReveal key={label} delay={i * 80} direction="up">
                <div className="text-center p-4 rounded-xl grad-mint border border-cultr-sage/30">
                  <Icon className="w-5 h-5 text-cultr-forest mx-auto mb-2" />
                  <span className="text-xs font-display font-medium text-cultr-forest">{label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy Grid with Goal Filter */}
      <section className="py-10 md:py-14 px-6 grad-light">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-2">
              Compare by goal
            </h2>
            <p className="text-sm text-cultr-textMuted max-w-2xl mx-auto mb-6">
              Filter therapies by what matters most to you. Tap any card to learn more.
            </p>
          </ScrollReveal>

          <TherapiesClient products={THERAPY_PRODUCTS} />

          <div className="mt-8 text-center">
            <PrescriptionDisclaimer />
          </div>
        </div>
      </section>

      {/* Bridge */}
      <div className="hidden md:block h-28 bridge-light-to-dark" />

      {/* Ready to Get Started */}
      <section className="py-10 md:py-14 px-6 grad-dark">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">
              Choose a membership plan and get matched with a physician who will build your personalized protocol.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">
                  View Membership Plans <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
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

      {/* Medical Disclaimer */}
      <section className="py-8 px-6 grad-white border-b border-cultr-sage">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-cultr-forest shrink-0 mt-0.5" />
            <p className="text-xs text-cultr-textMuted leading-relaxed">
              <span className="font-semibold text-cultr-text">Medical Disclaimer:</span>{' '}
              All therapies listed require physician evaluation and prescription.{' '}
              <span className="font-display font-bold">CULTR</span> Health does not
              guarantee specific results. Outcomes vary by individual. If you have a
              medical emergency, call 911.
            </p>
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
