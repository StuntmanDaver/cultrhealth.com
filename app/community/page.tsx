import type { Metadata } from 'next';
import { Instagram } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { CommunityFeed } from '@/components/site/CommunityFeed';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Community',
  description: 'Follow CULTR Health on Instagram, TikTok, and YouTube. See the latest content from our community of health optimizers.',
};

export default function CommunityPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 bg-cultr-forest overflow-hidden">
        {/* Radial glow — top center mint */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(215,243,220,0.08) 0%, transparent 100%)' }}
        />
        {/* Radial glow — bottom right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(40% 40% at 85% 90%, rgba(215,243,220,0.05) 0%, transparent 100%)' }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-5 leading-[1.1]">
              Our Community
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Follow along as we share the latest in health optimization, member results, and behind-the-scenes content.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300} direction="up" duration={600}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://instagram.com/cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200"
              >
                <Instagram className="w-4 h-4" />
                @cultrhealth
              </a>
              <a
                href="https://tiktok.com/@cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.78 1.54V6.84a4.84 4.84 0 0 1-1.02-.15Z" />
                </svg>
                @cultrhealth
              </a>
              <a
                href="https://youtube.com/@cultrhealth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.67 31.67 0 0 0 0 12a31.67 31.67 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.67 31.67 0 0 0 24 12a31.67 31.67 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
                </svg>
                @cultrhealth
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feed Section */}
      <section className="relative py-12 md:py-16 px-6 bg-cultr-offwhite overflow-hidden">
        {/* Radial glow — center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(50% 50% at 50% 30%, rgba(215,243,220,0.25) 0%, transparent 100%)' }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <CommunityFeed />
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Join our community."
        subtitle="Take the quiz and start your optimization journey today."
        ctaText="Take the Quiz"
        ctaLink="/quiz"
      />
    </div>
  );
}
