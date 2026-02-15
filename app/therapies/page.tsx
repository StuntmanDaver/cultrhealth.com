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
  Puzzle,
  Stethoscope,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Core Therapies — CULTR Health',
  description:
    'Explore physician-supervised therapies including GLP-1 weight loss, peptide protocols, and regenerative compounds. All treatments require physician evaluation.',
};

const SECTION_ICONS = [Flame, Zap, Puzzle] as const;

export default function TherapiesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-28 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Stethoscope className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">Physician-Supervised</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Core Therapies
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Browse our full catalog of physician-supervised therapies. Every
              protocol is personalized to your labs, goals, and medical history.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">See Plans</Button>
              </Link>
              <Link href="/quiz">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:text-cultr-sage"
                >
                  Find Your Protocol <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Therapy Sections */}
      {THERAPY_SECTIONS.map((section, sectionIdx) => {
        const Icon = SECTION_ICONS[sectionIdx];
        const isAlt = sectionIdx % 2 === 1;

        return (
          <section
            key={section.title}
            className={`py-16 md:py-20 px-6 ${isAlt ? 'bg-cultr-offwhite' : 'bg-white'}`}
          >
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <ScrollReveal className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cultr-mint flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cultr-forest" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-cultr-forest">
                      {section.title}
                    </h2>
                    <p className="text-sm text-cultr-textMuted">
                      {section.subtitle}
                    </p>
                  </div>
                </div>
                <p className="text-cultr-textMuted max-w-2xl">
                  {section.description}
                </p>
              </ScrollReveal>

              {/* Therapy Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.therapies.map((therapy, i) => (
                  <ScrollReveal key={therapy.name} delay={i * 80} direction="up">
                    <div className="h-full p-6 rounded-2xl bg-brand-cream border border-cultr-sage/50 hover:border-cultr-sage transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-display font-bold text-cultr-forest">
                          {therapy.name}
                        </h3>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-cultr-forest bg-cultr-mint px-2.5 py-1 rounded-full">
                          {therapy.badge}
                        </span>
                      </div>

                      {therapy.note && (
                        <div className="inline-block text-xs text-cultr-forest/70 bg-cultr-sage/30 px-2.5 py-1 rounded-full mb-3">
                          {therapy.note}
                        </div>
                      )}

                      <p className="text-sm text-cultr-textMuted leading-relaxed">
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

      {/* Ready to Get Started CTA */}
      <section className="py-16 md:py-20 px-6 bg-cultr-mint">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-cultr-forest mb-4">
              Ready to get started?
            </h2>
            <p className="text-cultr-textMuted mb-8 max-w-xl mx-auto">
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
      <section className="py-12 px-6 bg-white border-y border-cultr-sage">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-cultr-forest shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-bold text-cultr-text mb-2">
                  Medical Disclaimer
                </h4>
                <p className="text-sm text-cultr-textMuted leading-relaxed">
                  All therapies listed require physician evaluation and
                  prescription. CULTR Health does not guarantee specific results.
                  Outcomes vary by individual based on medical history, labs, and
                  adherence to protocol. If you have a medical emergency, please
                  call 911 or proceed to your nearest emergency room.
                </p>
              </div>
            </div>
          </ScrollReveal>
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
