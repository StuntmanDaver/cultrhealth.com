'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { BNPLBadge } from '@/components/payments/BNPLBadge';
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
}

export function PricingCard({ plan }: { plan: PlanProps }) {
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
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-4xl font-bold transition-transform duration-300 group-hover:scale-105 origin-left ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>${plan.price}</span>
        <span className={`text-sm ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}>/{plan.interval}</span>
      </div>
      <p className={`text-sm mb-2 min-h-[40px] ${plan.isFeatured ? 'text-white/80' : 'text-cultr-textMuted'}`}>{plan.tagline}</p>
      {plan.bnplEnabled && (
        <BNPLBadge
          priceUsd={plan.price}
          className={`mb-4 ${plan.isFeatured ? '!text-white/60' : ''}`}
        />
      )}

      <div className="flex-grow mb-8">
        {plan.coreProducts && plan.coreProducts.length > 0 && (
          <div className="mb-5">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${plan.isFeatured ? 'text-cultr-sage' : 'text-cultr-forest'}`}>
              CORE Therapies
            </p>
            <ul className="space-y-1.5 mb-0">
              {plan.coreProducts.map((product, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 text-xs ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}
                >
                  <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${plan.isFeatured ? 'bg-cultr-sage/60' : 'bg-cultr-forest/40'}`} />
                  <span>{product}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 border-t ${plan.isFeatured ? 'border-white/20' : 'border-cultr-sage/50'}`} />
          </div>
        )}

        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <li 
              key={i} 
              className={`flex items-start gap-3 text-sm transition-all duration-300 ${plan.isFeatured ? 'text-white/90' : 'text-cultr-textMuted'}`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <Check className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${plan.isFeatured ? 'text-cultr-sage' : 'text-cultr-forest'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link href={`/join/${plan.slug}`} className="w-full">
        <Button
          variant={plan.isFeatured ? 'secondary' : 'primary'}
          className={`w-full ${plan.isFeatured ? 'text-white border-white/50 hover:bg-white/10 hover:border-white/70' : ''}`}
        >
          {plan.ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
