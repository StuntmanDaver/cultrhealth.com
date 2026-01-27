'use client'

import SectionWrapper from '@/components/ui/SectionWrapper'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Labs Only',
    description: 'A la carte lab ordering for those who want the data.',
    price: '149',
    priceNote: 'Starting at',
    features: [
      'Comprehensive lab panels',
      'Quest & Labcorp access',
      'Digital results portal',
      'Basic interpretation guide',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Optimization',
    description: 'Labs + expert guidance for serious optimizers.',
    price: '399',
    priceNote: 'Per month',
    features: [
      'Everything in Labs Only',
      'Quarterly comprehensive panels',
      '1-on-1 consultation call',
      'Personalized protocol',
      'Supplement recommendations',
      'Priority support',
    ],
    cta: 'Join Waitlist',
    highlighted: true,
  },
  {
    name: 'Premium',
    description: 'Full concierge service for peak performance.',
    price: '999',
    priceNote: 'Per month',
    features: [
      'Everything in Optimization',
      'Monthly lab panels',
      'Weekly coaching calls',
      'Hormone therapy management',
      'Custom supplement stacks',
      'Direct physician access',
      'Concierge support',
    ],
    cta: 'Join Waitlist',
    highlighted: false,
  },
]

export default function Pricing() {
  const scrollToWaitlist = () => {
    const element = document.getElementById('waitlist')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <SectionWrapper id="pricing">
      <div className="text-center mb-16">
        <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
          Pricing
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
          Choose Your Path to Optimization
        </h2>
        <p className="text-lg text-cultr-cream/60 font-body max-w-2xl mx-auto">
          Transparent pricing with no hidden fees. Start where you are and upgrade as you grow.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'relative rounded-2xl p-6 md:p-8 transition-all duration-300',
              plan.highlighted
                ? 'bg-gradient-to-b from-cultr-copper/20 to-cultr-charcoal border-2 border-cultr-copper scale-105 shadow-xl shadow-cultr-copper/10'
                : 'bg-cultr-charcoal border border-cultr-lightgray/20 hover:border-cultr-copper/30'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-cultr-copper text-white text-xs font-display tracking-wide uppercase px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-display text-cultr-cream mb-2">{plan.name}</h3>
              <p className="text-sm text-cultr-cream/60 font-body">{plan.description}</p>
            </div>

            <div className="text-center mb-8">
              <p className="text-xs text-cultr-cream/50 font-display mb-1">{plan.priceNote}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-display text-cultr-cream">${plan.price}</span>
                {plan.priceNote === 'Per month' && (
                  <span className="text-cultr-cream/50 font-body">/mo</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cultr-copper flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-cultr-cream/70 font-body">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.highlighted ? 'primary' : 'secondary'}
              className="w-full"
              onClick={scrollToWaitlist}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-cultr-cream/40 font-body mt-8">
        All plans include a 30-day money-back guarantee. No questions asked.
      </p>
    </SectionWrapper>
  )
}
