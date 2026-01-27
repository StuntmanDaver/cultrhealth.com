'use client'

import { useState } from 'react'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'What labs do you offer?',
    answer: 'We offer comprehensive panels covering hormone health (testosterone, thyroid, cortisol), metabolic markers (blood sugar, lipids, insulin), inflammation markers, vitamin and mineral levels, and organ function tests. Our panels are designed to give you a complete picture of your health status.',
  },
  {
    question: 'How does hormone optimization work?',
    answer: 'After analyzing your lab results, our medical team creates a personalized protocol that may include hormone replacement therapy (HRT) or targeted supplementation. We monitor your progress with regular labs and adjust your protocol to optimize results while minimizing side effects.',
  },
  {
    question: 'Do I need a prescription?',
    answer: 'Lab panels do not require a prescription. However, hormone therapies and certain treatments do require a prescription, which our licensed physicians can provide after a consultation and review of your lab results.',
  },
  {
    question: 'What\'s the turnaround time for results?',
    answer: 'Most lab results are available within 3-5 business days after your blood draw. You\'ll receive a notification when your results are ready, along with a detailed interpretation guide and recommendations.',
  },
  {
    question: 'Is this covered by insurance?',
    answer: 'We operate as an out-of-network provider, which means we don\'t bill insurance directly. However, we provide itemized receipts that you can submit to your insurance for potential reimbursement. Many HSA and FSA accounts can also be used for our services.',
  },
  {
    question: 'Where can I get my blood drawn?',
    answer: 'We partner with Quest Diagnostics and Labcorp, giving you access to over 4,500 locations nationwide. Simply order your panel, and we\'ll send you a requisition form to take to any participating location near you.',
  },
  {
    question: 'How often should I get tested?',
    answer: 'We recommend baseline testing to establish your starting point, followed by quarterly panels to track progress and make protocol adjustments. For those on hormone therapy, more frequent monitoring may be recommended initially.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. We offer a 30-day money-back guarantee on all plans, so you can try our services risk-free.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <SectionWrapper id="faq" className="bg-cultr-charcoal">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-cultr-cream/60 font-body">
            Everything you need to know about CULTR Health.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                'border rounded-xl overflow-hidden transition-all duration-300',
                openIndex === index
                  ? 'border-cultr-copper/50 bg-cultr-black/50'
                  : 'border-cultr-lightgray/20 bg-transparent hover:border-cultr-lightgray/40'
              )}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-display text-lg text-cultr-cream pr-4">
                  {faq.question}
                </span>
                <span
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300',
                    openIndex === index
                      ? 'border-cultr-copper bg-cultr-copper/10 rotate-180'
                      : 'border-cultr-lightgray/30'
                  )}
                >
                  <svg
                    className={cn(
                      'w-4 h-4 transition-colors duration-300',
                      openIndex === index ? 'text-cultr-copper' : 'text-cultr-cream/50'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                )}
              >
                <p className="px-6 pb-6 text-cultr-cream/70 font-body leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
