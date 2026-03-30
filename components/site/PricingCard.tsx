'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { BNPLBadge } from '@/components/payments/BNPLBadge';
import BiomarkerExplainerLink from '@/components/site/BiomarkerExplainer';
import { CORE_THERAPIES } from '@/lib/config/plans';
import { brandify } from '@/lib/utils';

interface PlanProps {
  slug: string;
  name: string;
  price: number;
  interval: string;
  tagline: string;
  features: string[];
  coreProducts?: string[];
  stripePriceId: string;
  paymentLink: string;
  isFeatured?: boolean;
  ctaLabel: string;
  bnplEnabled?: boolean;
  priceLabel?: string;
  pricePrefix?: string;
  cardDisclaimer?: string;
  priceNote?: string;
  visitFrequency?: string;
}

export function PricingCard({ plan }: { plan: PlanProps }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCore = plan.slug === 'core';

  return (
    <div className={`
      p-8 rounded-[24px] flex flex-col h-full transition-all duration-300 ease-out group
      ${plan.isFeatured
        ? 'grad-dark-glow text-white shadow-lux-lg hover:scale-[1.03]'
        : 'glass-card hover:-translate-y-1'
      }
    `}>
      {plan.isFeatured && (
        <span className="text-cultr-sage text-xs font-display font-bold tracking-widest uppercase mb-4 block animate-pulse-slow">Most Popular</span>
      )}
      <h3 className={`text-2xl font-display font-bold mb-2 transition-transform duration-300 group-hover:translate-x-0.5 ${plan.isFeatured ? 'text-white' : 'text-cultr-text'}`}>{brandify(plan.name)}</h3>
      <div className="flex items-baseline gap-1 mb-1 flex-wrap">
        {plan.pricePrefix && (
          <span className={`text-sm font-medium mr-0.5 ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}>
            {plan.pricePrefix}
          </span>
        )}
        {plan.priceLabel ? (
          <>
            <span className={`text-4xl font-bold transition-transform duration-300 group-hover:scale-105 origin-left ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>
              {plan.priceLabel}
            </span>
            <span className={`text-xs align-super -ml-0.5 ${plan.isFeatured ? 'text-white/40' : 'text-cultr-textMuted/50'}`}>*</span>
          </>
        ) : (
          <>
            <span className={`text-4xl font-bold transition-transform duration-300 group-hover:scale-105 origin-left ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>${plan.price}</span>
            <span className={`text-sm ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}>/{plan.interval}</span>
          </>
        )}
      </div>
      {plan.priceNote && (
        <p className={`text-[11px] mb-2 ${plan.isFeatured ? 'text-white/50' : 'text-cultr-textMuted/70'}`}>
          {plan.priceNote}
        </p>
      )}
      <p className={`text-sm mb-2 min-h-[40px] ${plan.isFeatured ? 'text-white/80' : 'text-cultr-textMuted'}`}>{plan.tagline}</p>
      {plan.bnplEnabled && !isCore && (
        <BNPLBadge
          priceUsd={plan.price}
          className={`mb-4 ${plan.isFeatured ? '!text-white/60' : ''}`}
        />
      )}

      <div className="flex-grow mb-6">
        <ul className="space-y-4">
          {plan.features.map((feature, i) => {
            const isLabFeature = /lab test|blood test/i.test(feature);
            return (
              <li
                key={i}
                className={`flex items-start gap-3 text-sm transition-all duration-300 ${plan.isFeatured ? 'text-white/90' : 'text-cultr-textMuted'}`}
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <Check className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${plan.isFeatured ? 'text-cultr-sage' : 'text-cultr-forest'}`} />
                <span>
                  {feature}
                  {isLabFeature && (
                    <>
                      {' '}
                      <BiomarkerExplainerLink
                        label="See what we test ›"
                        className={plan.isFeatured ? '!text-cultr-sage hover:!text-white !decoration-cultr-sage/50' : ''}
                      />
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {plan.visitFrequency && (
          <p className={`text-[11px] mt-4 ${plan.isFeatured ? 'text-white/40' : 'text-cultr-textMuted/60'}`}>
            {plan.visitFrequency}
          </p>
        )}
      </div>

      {/* Core: Expandable therapy selection */}
      {isCore && (
        <>
          <div
            className={`overflow-hidden transition-all duration-400 ease-out ${
              isExpanded ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border-t border-cultr-sage/50 pt-5 mt-2 space-y-3">
              <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-3">
                Choose your therapy
              </p>
              {CORE_THERAPIES.map((therapy) => (
                <Link
                  key={therapy.slug}
                  href={`/join/core?therapy=${therapy.slug}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-cultr-sage/50 hover:border-cultr-forest hover:bg-cultr-mint/30 transition-all duration-200 group/therapy"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 relative shrink-0 rounded-lg overflow-hidden bg-cultr-offwhite">
                    <Image
                      src={therapy.image}
                      alt={therapy.name}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-cultr-text text-sm">{therapy.name}</p>
                    <p className="text-cultr-forest font-bold text-sm">${therapy.price}/month</p>
                  </div>
                  <span className="text-xs text-cultr-forest font-medium opacity-0 group-hover/therapy:opacity-100 transition-opacity shrink-0">
                    Join →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 rounded-full border border-cultr-sage text-cultr-forest font-medium text-sm hover:bg-cultr-mint/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isExpanded ? 'Show less' : plan.ctaLabel}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}

      {/* Non-Core: Direct checkout link */}
      {!isCore && (
        <Link href={`/join/${plan.slug}`} className="w-full">
          <Button
            variant={plan.isFeatured ? 'secondary' : 'primary'}
            className={`w-full ${plan.isFeatured ? 'text-white border-white/50 hover:bg-white/10 hover:border-white/70' : ''}`}
          >
            {plan.ctaLabel}
          </Button>
        </Link>
      )}

      {/* Disclaimer */}
      {plan.cardDisclaimer && (
        <p className={`text-[11px] text-center mt-3 ${plan.isFeatured ? 'text-white/40' : 'text-cultr-textMuted/60'}`}>
          {plan.cardDisclaimer}
        </p>
      )}
    </div>
  );
}
