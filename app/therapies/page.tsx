import { Metadata } from 'next';
import Link from 'next/link';
import { THERAPY_SECTIONS } from '@/lib/config/therapies';
import { CTASection } from '@/components/site/CTASection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  Shield,
  Flame,
  Zap,
  Lock,
  Stethoscope,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Core Therapies — CULTR Health',
  description:
    'Explore physician-supervised therapies including GLP-1 weight loss, peptide protocols, and regenerative compounds. All treatments require physician evaluation.',
};

const SECTION_ICONS = [Flame, Zap] as const;

export default function TherapiesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero — compact */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-14 px-6 bg-cultr-forest text-white">
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
              Browse our full catalog of physician-supervised therapies. Every
              protocol is personalized to your labs, goals, and medical history.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 100+ Therapies — inline banner */}
      <section className="py-5 px-6 bg-cultr-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cultr-forest/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-cultr-forest" />
            </div>
            <div>
              <p className="font-display font-bold text-cultr-forest text-sm">
                Over 100 therapies available
              </p>
              <p className="text-xs text-cultr-textMuted">
                Become a member to access our full catalog of peptide blends and optimization protocols.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button size="sm">
              Become a Member <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Therapy Sections */}
      {THERAPY_SECTIONS.map((section, sectionIdx) => {
        const Icon = SECTION_ICONS[sectionIdx];
        const isAlt = sectionIdx % 2 === 1;

        return (
          <section
            key={section.title}
            className={`py-10 md:py-14 px-6 ${isAlt ? 'bg-cultr-offwhite' : 'bg-white'}`}
          >
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <ScrollReveal className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cultr-mint flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cultr-forest" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-display font-bold text-cultr-forest">
                    {section.title}
                  </h2>
                </div>
                <p className="text-sm text-cultr-textMuted max-w-2xl ml-11">
                  {section.description}
                </p>
              </ScrollReveal>

              {/* Therapy Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.therapies.map((therapy, i) => (
                  <ScrollReveal key={therapy.name} delay={i * 60} direction="up">
                    <div className="h-full p-5 rounded-xl bg-brand-cream border border-cultr-sage/40 hover:border-cultr-sage transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-display font-bold text-cultr-forest">
                          {therapy.name}
                        </h3>
                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-cultr-forest bg-cultr-mint px-2 py-0.5 rounded-full">
                          {therapy.badge}
                        </span>
                      </div>

                      {therapy.note && (
                        <div className="inline-block text-[11px] text-cultr-forest/70 bg-cultr-sage/30 px-2 py-0.5 rounded-full mb-2">
                          {therapy.note}
                        </div>
                      )}

                      <p className="text-xs text-cultr-textMuted leading-relaxed">
                        {therapy.description}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Ready to Get Started */}
      <section className="py-10 md:py-14 px-6 bg-cultr-forest">
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
      <section className="py-8 px-6 bg-white border-b border-cultr-sage">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-cultr-forest shrink-0 mt-0.5" />
            <p className="text-xs text-cultr-textMuted leading-relaxed">
              <span className="font-semibold text-cultr-text">Medical Disclaimer:</span>{' '}
              All therapies listed require physician evaluation and prescription.
              CULTR Health does not guarantee specific results. Outcomes vary by
              individual. If you have a medical emergency, call 911.
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
