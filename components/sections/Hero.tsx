'use client'

import Link from 'next/link'
import { Aura } from '@/components/ui/Aura'

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden grad-light">
      {/* Aura Gradient Orbs */}
      <Aura variant="purple" size="xl" position="top-left" className="opacity-40" />
      <Aura variant="yellow" size="lg" position="top-right" className="opacity-50" />
      <Aura variant="orange" size="xl" position="bottom-right" className="opacity-30" />
      <Aura variant="green" size="md" position="bottom-left" className="opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Headline */}
        <h1 className="text-display-xl text-brand-primary mb-6 animate-fade-in">
          What if you could optimize your health at any time, just like checking your heart rate?
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-brand-primary/70 max-w-2xl mx-auto mb-10 animate-slide-up">
          The first direct-to-consumer platform providing real-time access to peptides, 
          bioregulators, and longevity protocols—data-driven, physician-guided.
        </p>

        {/* CTA */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.03] transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Social Proof */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-brand-primary/50 mb-4">Trusted by</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <span className="text-brand-primary/40 font-display text-lg">Forbes</span>
            <span className="text-brand-primary/40 font-display text-lg">TechCrunch</span>
            <span className="text-brand-primary/40 font-display text-lg">Wired</span>
            <span className="text-brand-primary/40 font-display text-lg">Men&apos;s Health</span>
          </div>
        </div>
      </div>
    </section>
  )
}
