import SectionWrapper from '@/components/ui/SectionWrapper'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Get Tested',
    description: 'Order your lab panel online and visit any Quest or Labcorp location near you. No appointments needed — just walk in at your convenience.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Review Results',
    description: 'Receive detailed analysis of your biomarkers with easy-to-understand insights. Our experts break down what each marker means for your health.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Optimize',
    description: 'Get a personalized protocol combining targeted supplementation, nutrition guidance, and hormone optimization to achieve your goals.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works">
      <div className="text-center mb-16">
        <ScrollReveal direction="up">
          <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
            Simple Process
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={100}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
            How It Works
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={200}>
          <p className="text-lg text-cultr-cream/60 font-body max-w-2xl mx-auto">
            Three simple steps to understanding and optimizing your health.
          </p>
        </ScrollReveal>
      </div>

      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {steps.map((step, index) => (
          <ScrollReveal key={step.number} direction="up" delay={index * 150}>
            <div className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-cultr-copper/50 to-transparent" />
              )}

              <div className="text-center">
                {/* Step number with icon */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-cultr-charcoal border border-cultr-copper/30 flex items-center justify-center transition-all duration-300 group-hover:border-cultr-copper/60 group-hover:shadow-lg group-hover:shadow-cultr-copper/10">
                    <span className="text-3xl font-display text-cultr-copper">{step.number}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-cultr-copper flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-xl font-display text-cultr-cream mb-4">
                  {step.title}
                </h3>
                <p className="text-cultr-cream/60 font-body leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionWrapper>
  )
}
