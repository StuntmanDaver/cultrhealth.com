'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { TESTIMONIALS, TRUST_METRICS } from '@/lib/config/social-proof'

const firstColumn = TESTIMONIALS.slice(0, 3)
const secondColumn = TESTIMONIALS.slice(3, 6)
const thirdColumn = TESTIMONIALS.slice(6)

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function TestimonialsColumn({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: typeof TESTIMONIALS
  duration?: number
  className?: string
}) {
  return (
    <div className={className}>
      <motion.ul
        animate={{ translateY: '-50%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="flex flex-col gap-6 pb-6 list-none m-0 p-0"
      >
        {[...Array(2)].map((_, dupIndex) => (
          <React.Fragment key={dupIndex}>
            {testimonials.map(({ quote, name, title, rating, highlight }, i) => (
              <motion.li
                key={`${dupIndex}-${i}`}
                aria-hidden={dupIndex === 1 ? 'true' : 'false'}
                tabIndex={dupIndex === 1 ? -1 : 0}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  transition: { type: 'spring', stiffness: 400, damping: 17 },
                }}
                className="p-5 md:p-8 rounded-3xl border border-white/10 shadow-lg shadow-black/20 w-[85vw] max-w-xs md:w-full bg-white/[0.06] backdrop-blur-sm cursor-default select-none focus:outline-none focus:ring-2 focus:ring-cultr-sage/30"
              >
                <blockquote className="m-0 p-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex">
                      {[...Array(rating)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-cultr-sage text-cultr-sage" />
                      ))}
                    </div>
                    {highlight && (
                      <span className="text-xs font-bold bg-cultr-sage/20 text-cultr-sage px-3 py-1 rounded-full">
                        {highlight}
                      </span>
                    )}
                  </div>
                  <p className="text-white/85 leading-relaxed m-0 mb-5">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <footer className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cultr-sage/20 flex items-center justify-center flex-shrink-0 ring-2 ring-cultr-sage/20">
                      <span className="text-xs font-bold text-cultr-sage">{getInitials(name)}</span>
                    </div>
                    <div className="flex flex-col">
                      <cite className="font-semibold not-italic text-white text-sm leading-5">{name}</cite>
                      <span className="text-xs text-white/50 leading-5">{title}</span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative py-16 md:py-24 px-6 grad-dark text-white overflow-hidden"
    >
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 35% at 50% 0%, rgba(215,243,220,0.1) 0%, transparent 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(70% 40% at 50% 100%, rgba(215,243,220,0.07) 0%, transparent 100%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Heading */}
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-8 md:mb-12">
          <div className="border border-cultr-sage/30 py-1 px-4 rounded-full text-xs font-semibold tracking-widest uppercase text-cultr-sage/80 bg-cultr-sage/10 mb-5">
            Testimonials
          </div>
          <h2
            id="testimonials-heading"
            className="text-3xl md:text-5xl font-display font-bold tracking-tight text-center text-white"
          >
            What members say.
          </h2>
          <div className="flex items-center gap-2 mt-4 text-white/60">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-cultr-sage text-cultr-sage" />
              ))}
            </div>
            <span className="text-sm">
              {TRUST_METRICS.avgRating} out of 5 from {TRUST_METRICS.reviewCount} reviews
            </span>
          </div>
        </div>

        {/* Scrolling columns */}
        <div
          className="flex justify-center gap-6 mt-10 overflow-hidden max-h-[480px] md:max-h-[740px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          }}
          role="region"
          aria-label="Scrolling testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </motion.div>
    </section>
  )
}
