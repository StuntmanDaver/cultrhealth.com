'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/config/plans';
import Button from '@/components/ui/Button';
import { Check, Loader2, ArrowLeft, Shield, CreditCard } from 'lucide-react';

export default function JoinPage({ params }: { params: { tier: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the plan based on the tier slug
  const plan = PLANS.find((p) => p.slug === params.tier);

  // If plan doesn't exist, show error
  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24 px-6 text-center bg-cultr-offwhite">
        <h1 className="text-4xl font-display font-bold text-cultr-forest mb-6">Plan Not Found</h1>
        <p className="text-cultr-textMuted mb-8">The membership tier you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/pricing')}>View All Plans</Button>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planSlug: plan.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      {/* Hero */}
      <section className="py-16 px-6 bg-cultr-forest text-white">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-cultr-sage tracking-widest mb-4">
            {plan.tagline.toUpperCase()}
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {plan.name}
          </h1>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold">${plan.price}</span>
            <span className="text-white/70">/ {plan.interval}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Plan Card */}
          <div className="bg-white border border-cultr-sage rounded-2xl p-8 md:p-10 shadow-sm mb-8">
            {/* Features */}
            <div className="mb-8">
              <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-4">
                What&apos;s Included
              </p>
              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cultr-forest flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-cultr-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div className="bg-cultr-mint rounded-xl p-6 mb-8 border border-cultr-sage">
              <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-2">
                Best For
              </p>
              <p className="text-cultr-text font-medium">{plan.bestFor}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full text-lg py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Join ${plan.name}`
              )}
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-cultr-textMuted">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>HIPAA compliant</span>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mb-8">
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center gap-2 text-cultr-textMuted hover:text-cultr-forest transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all plans
            </button>
          </div>

          {/* What Happens Next */}
          <div className="bg-white border border-cultr-sage rounded-2xl p-8">
            <h3 className="text-xl font-display font-bold text-cultr-forest mb-6">
              What Happens After You Join?
            </h3>
            <ol className="space-y-4">
              {[
                'You\'ll be redirected to a secure Stripe checkout page',
                'After payment, you\'ll see next steps to create your portal account',
                'Complete your intake forms (takes ~15 minutes)',
                'Book your first consult with a provider',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-cultr-mint flex items-center justify-center shrink-0 text-xs font-bold text-cultr-forest">
                    {i + 1}
                  </span>
                  <span className="text-cultr-textMuted">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
