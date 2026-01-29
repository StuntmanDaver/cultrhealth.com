import SectionWrapper from '@/components/ui/SectionWrapper'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const services = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'Diagnostic Labs',
    description: 'Order comprehensive lab panels directly. No doctor visits, no subscriptions — just the data you need to understand your body.',
    features: ['50+ Biomarkers', 'Quest & Labcorp Locations', 'Results in 3-5 Days'],
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Hormone Optimization',
    description: 'Personalized hormone therapy protocols designed to restore balance and optimize your performance, energy, and vitality.',
    features: ['TRT Protocols', 'Thyroid Optimization', 'Expert Monitoring'],
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Health Coaching',
    description: '1-on-1 guidance from optimization experts who understand the science and can help you achieve your specific health goals.',
    features: ['Personalized Plans', 'Weekly Check-ins', 'Nutrition Guidance'],
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Premium Supplements',
    description: 'Pharmaceutical-grade supplementation tailored to your lab results. No guesswork — just targeted support for your needs.',
    features: ['Third-Party Tested', 'Personalized Stacks', 'Auto-Ship Available'],
  },
]

export default function Services() {
  return (
    <SectionWrapper id="services" className="bg-cultr-charcoal">
      <div className="text-center mb-16">
        <ScrollReveal direction="up">
          <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
            What We Offer
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={100}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
            Comprehensive Health Optimization
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={200}>
          <p className="text-lg text-cultr-cream/60 font-body max-w-2xl mx-auto">
            Everything you need to understand, optimize, and maintain your health — all in one place.
          </p>
        </ScrollReveal>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {services.map((service, index) => (
          <ScrollReveal key={service.title} direction="up" delay={index * 100}>
            <div
              className="card group hover:border-cultr-copper/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-cultr-copper/10 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-cultr-copper/10 flex items-center justify-center text-cultr-copper group-hover:bg-cultr-copper/20 transition-all duration-300 group-hover:scale-110">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-xl font-display text-cultr-cream mb-2">
                    {service.title}
                  </h3>
                  <p className="text-cultr-cream/60 font-body leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {service.features.map((feature, featureIndex) => (
                  <span
                    key={feature}
                    className="px-3 py-1 text-xs font-display text-cultr-cream/70 bg-cultr-lightgray/30 rounded-full transition-all duration-300 group-hover:bg-cultr-copper/10"
                    style={{ transitionDelay: `${featureIndex * 50}ms` }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionWrapper>
  )
}
