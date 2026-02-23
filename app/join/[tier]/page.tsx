'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PLANS, MEMBERSHIP_DISCLAIMER } from '@/lib/config/plans';
import Button from '@/components/ui/Button';
import { Check, Loader2, ArrowLeft, Shield, CreditCard, AlertCircle, Lock } from 'lucide-react';
import type { PaymentProvider, AuthorizeNetOpaqueData } from '@/lib/payments/payment-types';
import type { AffirmCheckoutConfig } from '@/lib/payments/payment-types';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { KlarnaWidget } from '@/components/payments/KlarnaWidget';
import { AffirmCheckoutButton } from '@/components/payments/AffirmCheckoutButton';
import { AuthorizeNetForm, type BillingInfo } from '@/components/payments/AuthorizeNetForm';
import { getPrimaryPaymentProvider, AUTHORIZE_NET_ENABLED } from '@/lib/config/payments';

// Initialize Stripe with Healthie's publishable key for HIPAA-compliant tokenization
// Card data goes directly to Stripe (via Healthie's Stripe Connect) - never touches our servers
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_HEALTHIE_STRIPE_KEY || 'pk_test_fAj7WlTrG0uc5Z9WHKQDdoTq'
);

// Card Element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a3c34',
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

// Inner form component that uses Stripe hooks
function CheckoutForm({ plan, onSuccess, onError }: {
  plan: NonNullable<typeof PLANS[number]>;
  onSuccess: (redirectUrl: string) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  
  // Customer info
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not loaded. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    // Validate email
    if (!email || !email.includes('@')) {
      onError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      // Create a token from the card element
      // This sends card data directly to Stripe (via Healthie's Stripe Connect)
      // Card data never touches our servers - HIPAA compliant
      const { token, error: tokenError } = await stripe.createToken(cardElement);

      if (tokenError) {
        setCardError(tokenError.message || 'Invalid card details');
        setIsLoading(false);
        return;
      }

      if (!token) {
        setCardError('Failed to process card');
        setIsLoading(false);
        return;
      }

      // Send the token to our API to complete checkout via Healthie
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: plan.slug,
          stripeToken: token.id,
          email,
          firstName,
          lastName,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Success - redirect to success page
      onSuccess(data.redirectUrl || `/success?provider=healthie&plan=${plan.slug}`);
    } catch (err) {
      console.error('Checkout error:', err);
      onError(err instanceof Error ? err.message : 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase">
          Your Information
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm text-cultr-textMuted mb-1.5">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
              placeholder="Jane"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm text-cultr-textMuted mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-cultr-textMuted mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm text-cultr-textMuted mb-1.5">
            Phone (optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Card Element */}
      <div>
        <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-4">
          Payment Details
        </p>
        <div className="border border-cultr-sage rounded-lg p-4 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600">{cardError}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-cultr-textMuted">
          <Lock className="w-3 h-3" />
          <span>Your card details are encrypted and sent directly to our HIPAA-compliant payment processor</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full text-lg py-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Join ${plan.name} - $${plan.price}/${plan.interval}`
        )}
      </Button>
    </form>
  );
}

export default function JoinPage({ params }: { params: { tier: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('stripe');

  // Determine primary card payment provider (Stripe Elements/Healthie vs Authorize.net)
  const primaryProvider = getPrimaryPaymentProvider();
  const useAuthorizeNet = primaryProvider === 'authorize_net' && AUTHORIZE_NET_ENABLED;

  // Klarna state
  const [klarnaClientToken, setKlarnaClientToken] = useState<string | null>(null);
  const [klarnaSessionLoading, setKlarnaSessionLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Affirm state
  const [affirmConfig, setAffirmConfig] = useState<AffirmCheckoutConfig | null>(null);
  const [affirmLoading, setAffirmLoading] = useState(false);

  // Authorize.net state
  const [authNetEmail, setAuthNetEmail] = useState('');

  // Find the plan based on the tier slug
  const plan = PLANS.find((p) => p.slug === params.tier);

  // If plan doesn't exist, show error
  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24 px-6 text-center grad-light">
        <h1 className="text-4xl font-display font-bold text-cultr-forest mb-6">Plan Not Found</h1>
        <p className="text-cultr-textMuted mb-8">The membership tier you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/pricing')}>View All Plans</Button>
      </div>
    );
  }

  const amountCents = plan.price * 100;

  // Handle checkout success
  const handleCheckoutSuccess = (redirectUrl: string) => {
    router.push(redirectUrl);
  };

  // Handle checkout error
  const handleCheckoutError = (errorMsg: string) => {
    setError(errorMsg);
  };

  // Authorize.net checkout handler
  const handleAuthorizeNetCheckout = async (
    opaqueData: AuthorizeNetOpaqueData,
    billing: BillingInfo
  ) => {
    if (!authNetEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/authorize-net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: plan.slug,
          email: authNetEmail,
          opaqueData,
          billing: billing.firstName ? billing : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.success) {
        router.push(`/success?provider=authorize_net&subscription_id=${data.subscriptionId}&type=subscription`);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      console.error('Authorize.net checkout error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment method selection (no API calls on select)
  const handleSelectPaymentMethod = (provider: PaymentProvider) => {
    setPaymentMethod(provider);
    setError(null);
    // Reset tokens when switching methods
    if (provider !== 'klarna') {
      setKlarnaClientToken(null);
    }
    if (provider !== 'affirm') {
      setAffirmConfig(null);
    }
  };

  // Klarna: create session when user clicks checkout button
  const handleKlarnaCheckout = async () => {
    if (klarnaClientToken) return; // Already have a session
    
    setKlarnaSessionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout/klarna/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create Klarna session');
      setKlarnaClientToken(data.client_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Klarna');
    } finally {
      setKlarnaSessionLoading(false);
    }
  };

  // Affirm: create checkout config when user clicks checkout button
  const handleAffirmCheckout = async () => {
    if (affirmConfig) return; // Already have config
    
    setAffirmLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout/affirm/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to build Affirm checkout');
      setAffirmConfig(data.checkout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Affirm');
    } finally {
      setAffirmLoading(false);
    }
  };

  // Klarna: after user authorizes in widget
  const handleKlarnaAuthorized = useCallback(async (authorizationToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/checkout/klarna/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationToken,
          planSlug: plan.slug,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Klarna order failed');

      if (data.fraud_status === 'ACCEPTED') {
        router.push(`/success?provider=klarna&order_id=${data.order_id}`);
      } else if (data.fraud_status === 'PENDING') {
        router.push(`/success?provider=klarna&order_id=${data.order_id}&pending=true`);
      } else {
        setError('Klarna order was not approved. Please try another payment method.');
        setPaymentMethod('stripe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klarna payment failed');
    } finally {
      setIsLoading(false);
    }
  }, [plan.slug, router]);

  const handleBnplError = useCallback((msg: string) => {
    setError(msg);
    setPaymentMethod('stripe');
  }, []);

  return (
    <div className="min-h-screen grad-light">
      {/* Hero */}
      <section className="py-16 px-6 grad-dark text-white">
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
                    <div className="w-5 h-5 rounded-full grad-dark flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-cultr-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div className="grad-mint rounded-xl p-6 mb-8 border border-cultr-sage">
              <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-2">
                Best For
              </p>
              <p className="text-cultr-text font-medium">{plan.bestFor}</p>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={handleSelectPaymentMethod}
                amountCents={amountCents}
                isSubscription={true}
                bnplEnabled={plan.bnplEnabled}
              />
            </div>

            {/* Card Checkout Form */}
            {paymentMethod === 'stripe' && (
              useAuthorizeNet ? (
                /* Authorize.net Card Form (High-Risk Merchant Account) */
                <div className="space-y-4">
                  {/* Email input for subscription */}
                  <div>
                    <label htmlFor="authNetEmail" className="block text-sm text-cultr-textMuted mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="authNetEmail"
                      value={authNetEmail}
                      onChange={(e) => setAuthNetEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest"
                      required
                    />
                  </div>
                  <AuthorizeNetForm
                    onTokenReceived={handleAuthorizeNetCheckout}
                    onError={handleCheckoutError}
                    loading={isLoading}
                    submitText={`Join ${plan.name} - $${plan.price}/${plan.interval}`}
                    collectBillingAddress={true}
                  />
                </div>
              ) : (
                /* Stripe Elements via Healthie (HIPAA-compliant) */
                <Elements stripe={stripePromise}>
                  <CheckoutForm 
                    plan={plan}
                    onSuccess={handleCheckoutSuccess}
                    onError={handleCheckoutError}
                  />
                </Elements>
              )
            )}

            {/* Klarna Widget (shown when Klarna is selected) */}
            {paymentMethod === 'klarna' && klarnaClientToken && (
              <div className="mb-6">
                <KlarnaWidget
                  clientToken={klarnaClientToken}
                  onAuthorized={handleKlarnaAuthorized}
                  onError={handleBnplError}
                />
              </div>
            )}

            {paymentMethod === 'klarna' && !klarnaClientToken && !klarnaSessionLoading && (
              <Button
                onClick={handleKlarnaCheckout}
                className="w-full text-lg py-6 mb-6"
              >
                Continue with Klarna
              </Button>
            )}

            {paymentMethod === 'klarna' && klarnaSessionLoading && (
              <div className="flex items-center justify-center py-6 mb-6">
                <Loader2 className="w-5 h-5 animate-spin text-cultr-forest" />
                <span className="ml-2 text-sm text-cultr-textMuted">Loading Klarna...</span>
              </div>
            )}

            {/* Affirm Button (shown when Affirm is selected) */}
            {paymentMethod === 'affirm' && !affirmConfig && !affirmLoading && (
              <Button
                onClick={handleAffirmCheckout}
                className="w-full text-lg py-6 mb-6"
              >
                Continue with Affirm
              </Button>
            )}

            {paymentMethod === 'affirm' && affirmConfig && (
              <div className="mb-6">
                <AffirmCheckoutButton
                  checkoutConfig={affirmConfig}
                  onError={handleBnplError}
                  loading={affirmLoading}
                />
              </div>
            )}

            {paymentMethod === 'affirm' && affirmLoading && (
              <div className="flex items-center justify-center py-6 mb-6">
                <Loader2 className="w-5 h-5 animate-spin text-cultr-forest" />
                <span className="ml-2 text-sm text-cultr-textMuted">Loading Affirm...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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

          {/* Important Disclaimers */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-bold text-amber-800 mb-2">Important Information</h4>
                <p className="text-sm text-amber-700 leading-relaxed mb-3">
                  {MEMBERSHIP_DISCLAIMER}
                </p>
                <p className="text-xs text-amber-600">
                  <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health does not guarantee specific results. All services are provided via telehealth by licensed providers. 
                  If you have a medical emergency, call 911.
                </p>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white border border-cultr-sage rounded-2xl p-8">
            <h3 className="text-xl font-display font-bold text-cultr-forest mb-6">
              What Happens After You Join?
            </h3>
            <ol className="space-y-4">
              {[
                'Your payment is processed securely via our HIPAA-compliant system',
                'You\'ll receive a welcome email with your Healthie portal login',
                'Complete your intake forms (takes ~15 minutes)',
                'Book your first consult with a provider',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full grad-mint flex items-center justify-center shrink-0 text-xs font-bold text-cultr-forest">
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
