'use client';

import { Check, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useState } from 'react';

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
}

export function PricingCard({ plan }: { plan: PlanProps }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: plan.slug }),
      });

      const { url, error } = await response.json();
      
      if (error) {
        console.error('Checkout error:', error);
        alert('Failed to start checkout. Please try again.');
        setLoading(false);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`
      p-8 rounded-2xl border flex flex-col h-full transition-all duration-300
      ${plan.isFeatured
        ? 'bg-cultr-forest text-white shadow-xl hover:scale-[1.02] hover:shadow-2xl'
        : 'bg-white border-cultr-sage hover:border-cultr-forest/40'
      }
    `}>
      {plan.isFeatured && (
        <span className="text-cultr-sage text-xs font-bold tracking-widest uppercase mb-4 block">Most Popular</span>
      )}
      <h3 className={`text-2xl font-display font-bold mb-2 ${plan.isFeatured ? 'text-white' : 'text-cultr-text'}`}>{plan.name}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-4xl font-bold ${plan.isFeatured ? 'text-white' : 'text-cultr-forest'}`}>${plan.price}</span>
        <span className={`text-sm ${plan.isFeatured ? 'text-white/70' : 'text-cultr-textMuted'}`}>/{plan.interval}</span>
      </div>
      <p className={`text-sm mb-6 min-h-[40px] ${plan.isFeatured ? 'text-white/80' : 'text-cultr-textMuted'}`}>{plan.tagline}</p>

      <div className="flex-grow mb-8">
        <ul className="space-y-4">
          {plan.features.map((feature, i) => (
            <li key={i} className={`flex items-start gap-3 text-sm ${plan.isFeatured ? 'text-white/90' : 'text-cultr-textMuted'}`}>
              <Check className={`w-5 h-5 shrink-0 ${plan.isFeatured ? 'text-cultr-sage' : 'text-cultr-forest'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant={plan.isFeatured ? 'secondary' : 'primary'}
        className="w-full"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          plan.ctaLabel
        )}
      </Button>
    </div>
  );
}
