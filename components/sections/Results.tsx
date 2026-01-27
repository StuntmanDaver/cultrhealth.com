import SectionWrapper from '@/components/ui/SectionWrapper'

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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display text-cultr-cream leading-tight mb-6">
            Get results in weeks,{' '}
            <span className="text-cultr-copper">not years.</span>
          </h2>
          <p className="text-lg text-cultr-cream/70 font-body leading-relaxed mb-6">
            While others waste months on trial and error, our clients get a data-driven 
            plan that delivers results fast.
          </p>
          <p className="text-lg text-cultr-cream/70 font-body leading-relaxed">
            At CULTR Health, we start with your lab work and build a personalized 
            strategy — combining targeted supplementation, nutrition, and hormone 
            optimization, so you see visible progress in just weeks.
          </p>
        </div>

        {/* Right Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card text-center hover:border-cultr-copper/50"
            >
              <p className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-copper mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-cultr-cream/60 font-display tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
