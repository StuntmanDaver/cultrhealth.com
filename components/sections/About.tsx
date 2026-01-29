import SectionWrapper from '@/components/ui/SectionWrapper'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export default function About() {
  return (
    <SectionWrapper id="about" className="bg-cultr-charcoal">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left - Mission Visual */}
        <ScrollReveal direction="left">
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto lg:mx-0 relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cultr-copper/20 to-transparent rounded-3xl" />
              <div className="absolute inset-4 border border-cultr-copper/30 rounded-2xl" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cultr-copper/20 flex items-center justify-center group">
                    <svg className="w-10 h-10 text-cultr-copper transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-display text-cultr-cream mb-2">Our Mission</p>
                  <p className="text-cultr-cream/60 font-body">
                    Empowering you to live longer, healthier, and more optimized.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Right - Content */}
        <div>
          <ScrollReveal direction="up">
            <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
              About CULTR Health
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream leading-tight mb-6">
              We believe health optimization shouldn&apos;t be complicated
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={200}>
            <div className="space-y-4 text-lg text-cultr-cream/70 font-body leading-relaxed">
              <p>
                CULTR Health was founded on a simple principle: everyone deserves access to 
                the same data and protocols that elite performers use to optimize their health.
              </p>
              <p>
                Traditional healthcare is reactive — waiting until something goes wrong before 
                taking action. We believe in a proactive approach, using advanced diagnostics 
                and personalized protocols to help you perform at your best.
              </p>
              <p>
                Our team combines expertise in longevity medicine, hormone optimization, and 
                performance science to deliver results that speak for themselves.
              </p>
            </div>
          </ScrollReveal>

          {/* Values */}
          <ScrollReveal direction="up" delay={300}>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { value: 'Data-Driven', icon: '📊' },
                { value: 'Personalized', icon: '🎯' },
                { value: 'Results-Focused', icon: '🚀' },
              ].map((item, index) => (
                <div 
                  key={item.value} 
                  className="text-center group cursor-default"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-2xl mb-2 block transition-transform duration-300 group-hover:scale-125">{item.icon}</span>
                  <p className="text-sm font-display text-cultr-cream/70">{item.value}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </SectionWrapper>
  )
}
