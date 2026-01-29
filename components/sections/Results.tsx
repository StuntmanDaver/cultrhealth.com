import SectionWrapper from '@/components/ui/SectionWrapper'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const stats = [
  {
    value: '50+',
    label: 'Biomarkers Analyzed',
  },
  {
    value: '5,000+',
    label: 'Clients Optimized',
  },
  {
    value: '98%',
    label: 'Satisfaction Rate',
  },
  {
    value: '3-5',
    label: 'Days to Results',
  },
]

export default function Results() {
  return (
    <SectionWrapper className="bg-cultr-charcoal">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Content */}
        <div>
          <ScrollReveal direction="up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display text-cultr-cream leading-tight mb-6">
              Get results in weeks,{' '}
              <span className="text-cultr-copper">not years.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={100}>
            <p className="text-lg text-cultr-cream/70 font-body leading-relaxed mb-6">
              While others waste months on trial and error, our clients get a data-driven 
              plan that delivers results fast.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={200}>
            <p className="text-lg text-cultr-cream/70 font-body leading-relaxed">
              At CULTR Health, we start with your lab work and build a personalized 
              strategy — combining targeted supplementation, nutrition, and hormone 
              optimization, so you see visible progress in just weeks.
            </p>
          </ScrollReveal>
        </div>

        {/* Right Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} direction="up" delay={index * 100}>
              <div
                className="card text-center hover:border-cultr-copper/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-cultr-copper/10 transition-all duration-300 group"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-copper mb-2 transition-transform duration-300 group-hover:scale-105">
                  {stat.value}
                </p>
                <p className="text-sm text-cultr-cream/60 font-display tracking-wide">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
