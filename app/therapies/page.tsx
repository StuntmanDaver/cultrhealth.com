import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { THERAPY_PRODUCTS } from '@/lib/config/therapies';
import { CTASection } from '@/components/site/CTASection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import { ArrowRight, Shield, Stethoscope } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Core Therapies — CULTR Health',
  description:
    'Explore our curated catalog of physician-supervised therapies including GLP-1 weight loss peptides, growth hormone secretagogues, neuropeptides, and regenerative compounds.',
};

const TherapiesGrid = dynamic(
  () => import('@/components/site/TherapiesGrid'),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-brand-cream/50 animate-pulse h-[420px]"
          />
        ))}
      </div>
    ),
  }
);

const TrustMarquee = dynamic(
  () => import('@/components/site/TrustMarquee'),
  {
    loading: () => <div className="h-14" />,
  }
);

export default function TherapiesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-14 px-6 grad-dark-glow text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Stethoscope className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">Physician-Supervised</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              Core Therapies
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Browse our curated catalog of peptide therapies. Every protocol is
              personalized to your labs, goals, and medical history.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Bridge */}
      <div className="hidden md:block h-28 bridge-dark-to-light" />

      {/* Product Grid */}
      <section className="py-10 md:py-14 px-6 grad-light">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest mb-2">
              Our Therapies
            </h2>
            <p className="text-sm text-cultr-textMuted max-w-2xl mx-auto">
              Tap any card to learn more about the science behind each therapy.
            </p>
          </ScrollReveal>

          <TherapiesGrid products={THERAPY_PRODUCTS} />
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
              Choose a membership plan and get matched with a physician who will
              build your personalized protocol.
            </p>
            <Link href="/pricing">
              <Button size="lg">
                View Membership Plans <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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
