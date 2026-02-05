'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { BNPLBadge } from '@/components/payments/BNPLBadge';

interface PlanProps {
  slug: string;
  name: string;
  price: number;
  interval: string;
  tagline: string;
  features: string[];
  stripePriceId: string;
  paymentLink: string;
  isFeatured?: boolean;
  ctaLabel: string;
  bnplEnabled?: boolean;
}

export function PricingCard({ plan }: { plan: PlanProps }) {
  return (
    <div className={`
      p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 ease-out group
      ${plan.isFeatured
        ? 'bg-cultr-forest text-white shadow-xl hover:scale-[1.03] hover:shadow-2xl hover:shadow-cultr-forest/30'
        : 'bg-white border-cultr-sage hover:border-cultr-forest/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cultr-forest/10'
      }
    `}>
      {plan.isFeatured && (
        <span className="text-cultr-sage text-xs font-bold tracking-widest uppercase mb-4 block animate-pulse-slow">Most Popular</span>
      )}
      <h3 className={`text-2xl font-display font-bold mb-2 transition-transform duration-300 group-hover:translate-x-0.5 ${plan.isFeatured ? 'text-white' : 'text-cultr-text'}`}>{plan.name}</h3>
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
          className="w-full"
        >
          {plan.ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
