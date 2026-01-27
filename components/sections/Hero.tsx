'use client'

import Button from '@/components/ui/Button'

export default function Hero() {
  const scrollToWaitlist = () => {
    const element = document.getElementById('waitlist')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cultr-black via-cultr-charcoal to-cultr-black" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(158, 95, 36, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Glow effect */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cultr-copper/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cultr-copper/5 rounded-full blur-[96px]" />

      <div className="section-wrapper relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-6 animate-fade-in">
              Uncover what&apos;s holding you back
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display text-cultr-cream leading-[1.1] mb-6 animate-slide-up">
              Order the labs you want,{' '}
              <span className="text-cultr-copper">on your terms</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-cultr-cream/70 font-body leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              With CULTR Health you can order lab panels directly. No doctor visits, 
              subscriptions, or delays — get the data you want, when you want it.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button onClick={scrollToWaitlist} size="lg">
                Get Early Access
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative lg:h-[600px] hidden lg:block">
            {/* Decorative cards mimicking Marek Health style */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
              {/* Main card */}
              <div className="card-elevated animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-cultr-cream/60 font-display">Testosterone, Total, LC/MS</span>
                  <div className="w-8 h-8 rounded-full bg-cultr-copper/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cultr-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-display text-cultr-cream">870.2</span>
                  <span className="text-sm text-cultr-cream/40">ng/dL</span>
                </div>
                <div className="h-2 bg-cultr-lightgray/30 rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-gradient-to-r from-cultr-copper to-cultr-copperLight rounded-full" />
                </div>
                <div className="flex justify-between mt-2 text-xs text-cultr-cream/40">
                  <span>264</span>
                  <span>Optimal Range</span>
                  <span>916</span>
                </div>
              </div>

              {/* Floating stat card */}
              <div className="absolute -top-8 -right-8 card-elevated py-4 px-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <p className="text-xs text-cultr-cream/60 font-display mb-1">Biomarkers tested</p>
                <p className="text-2xl font-display text-cultr-copper">50+</p>
              </div>

              {/* Treatment suggestion card */}
              <div className="absolute -bottom-4 -left-8 card-elevated max-w-xs animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-xs text-cultr-copper font-display mb-2">Optimization insight</p>
                <p className="text-sm text-cultr-cream/80 font-body leading-relaxed">
                  Your levels indicate room for optimization through targeted protocols...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-cultr-cream/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
