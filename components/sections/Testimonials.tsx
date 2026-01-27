'use client'

import { useState } from 'react'
import SectionWrapper from '@/components/ui/SectionWrapper'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    id: 1,
    name: 'Marcus Chen',
    role: 'Entrepreneur, 42',
    content: 'After years of feeling sluggish and unfocused, CULTR helped me understand what was actually going on. Within 8 weeks of starting my protocol, I had more energy than I did in my 30s.',
    rating: 5,
    avatar: 'MC',
  },
  {
    id: 2,
    name: 'Sarah Mitchell',
    role: 'Executive, 38',
    content: 'The convenience of ordering labs directly without scheduling doctor appointments was a game-changer. The insights I got from my results were incredibly actionable.',
    rating: 5,
    avatar: 'SM',
  },
  {
    id: 3,
    name: 'David Park',
    role: 'Attorney, 45',
    content: 'I was skeptical at first, but the data-driven approach convinced me. My testosterone went from 340 to 780 in 12 weeks. The difference in how I feel is night and day.',
    rating: 5,
    avatar: 'DP',
  },
  {
    id: 4,
    name: 'Jennifer Ross',
    role: 'Physician, 41',
    content: 'As a doctor myself, I appreciate the thoroughness of CULTR\'s panels. They test biomarkers that most standard panels miss. Highly recommend for anyone serious about optimization.',
    rating: 5,
    avatar: 'JR',
  },
  {
    id: 5,
    name: 'Michael Torres',
    role: 'Tech Founder, 36',
    content: 'The coaching sessions alone are worth it. Having someone who understands the science guide you through protocol adjustments makes all the difference.',
    rating: 5,
    avatar: 'MT',
  },
  {
    id: 6,
    name: 'Amanda Wright',
    role: 'Fitness Coach, 34',
    content: 'I recommend CULTR to all my clients who want to take their health to the next level. The supplement stacks they create based on lab results are incredibly effective.',
    rating: 5,
    avatar: 'AW',
  },
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const visibleTestimonials = testimonials.slice(0, 3)

  return (
    <SectionWrapper id="testimonials">
      <div className="text-center mb-16">
        <p className="text-cultr-copper font-display text-sm tracking-widest uppercase mb-4">
          Success Stories
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-cultr-cream mb-6">
          What Our Clients Say
        </h2>
        <p className="text-lg text-cultr-cream/60 font-body max-w-2xl mx-auto">
          Real results from real people who took control of their health.
        </p>
      </div>

      {/* Testimonial Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={cn(
              'card hover:border-cultr-copper/50 transition-all duration-300',
              index >= 3 && 'hidden lg:block'
            )}
          >
            {/* Rating */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-cultr-copper" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Content */}
            <p className="text-cultr-cream/80 font-body leading-relaxed mb-6">
              &ldquo;{testimonial.content}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cultr-copper/20 flex items-center justify-center">
                <span className="text-sm font-display text-cultr-copper">{testimonial.avatar}</span>
              </div>
              <div>
                <p className="text-sm font-display text-cultr-cream">{testimonial.name}</p>
                <p className="text-xs text-cultr-cream/50">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Carousel Dots */}
      <div className="flex justify-center gap-2 mt-8 lg:hidden">
        {visibleTestimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-200',
              index === activeIndex ? 'bg-cultr-copper' : 'bg-cultr-lightgray'
            )}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </SectionWrapper>
  )
}
