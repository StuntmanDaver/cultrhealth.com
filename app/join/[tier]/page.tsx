'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PLANS, MEMBERSHIP_DISCLAIMER, BLOOD_TEST_ADDON, DOCTOR_CONSULTATION_ADDON, CORE_THERAPIES } from '@/lib/config/plans';
import Button from '@/components/ui/Button';
import { ConsentModal } from '@/components/compliance/ConsentModal';
import { Check, Loader2, ArrowLeft, ArrowRight, Shield, CreditCard, AlertCircle, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { PaymentProvider } from '@/lib/payments/payment-types';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { COREPAY_ENABLED } from '@/lib/config/payments';
import { CorePayForm } from '@/components/payments/CorePayForm';


// Initialize Stripe for payment tokenization
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
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
function CheckoutForm({ plan, onSuccess, onError, todayTotal, consentChecked, consentGiven }: {
  plan: NonNullable<typeof PLANS[number]>;
  onSuccess: (redirectUrl: string) => void;
  onError: (error: string) => void;
  todayTotal: number;
  consentChecked: boolean;
  consentGiven: boolean;
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
      // Card data goes directly to Stripe - never touches our servers
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

      // Send the token to our API to complete checkout
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
      onSuccess(data.redirectUrl || `/success?provider=stripe&plan=${plan.slug}`);
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
        disabled={isLoading || !stripe || !consentChecked || !consentGiven}
        className="w-full text-lg py-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Start my protocol — $${todayTotal.toLocaleString()} today`
        )}
      </Button>
    </form>
  );
}

export default function JoinPage({ params }: { params: { tier: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>(COREPAY_ENABLED ? 'corepay' : 'stripe');

  const [isLoading, setIsLoading] = useState(false);

  // Consent checkboxes
  const [consentChecked, setConsentChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  // Informed consent modal
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

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

  // Core therapy lookup from search params
  const therapySlug = searchParams.get('therapy');
  const coreTherapy = plan.slug === 'core' && therapySlug
    ? CORE_THERAPIES.find(t => t.slug === therapySlug)
    : null;

  // If Core tier but no valid therapy selected, redirect to pricing
  if (plan.slug === 'core' && !coreTherapy) {
    router.push('/pricing');
    return null;
  }

  // Dynamic pricing computation
  const monthlyPrice = plan.slug === 'core' && coreTherapy ? coreTherapy.price : plan.price;
  const twoMonthCost = monthlyPrice * 2;
  const isConcierge = plan.slug === 'concierge';
  const labsCost = isConcierge ? 0 : BLOOD_TEST_ADDON.price;
  const doctorCost = isConcierge ? 0 : DOCTOR_CONSULTATION_ADDON.price;
  const todayTotal = twoMonthCost + labsCost + doctorCost;

  const amountCents = todayTotal * 100;

  // Handle checkout success
  const handleCheckoutSuccess = (redirectUrl: string) => {
    router.push(redirectUrl);
  };

  // Handle checkout error
  const handleCheckoutError = (errorMsg: string) => {
    setError(errorMsg);
  };

  // Handle payment method selection
  const handleSelectPaymentMethod = (provider: PaymentProvider) => {
    setPaymentMethod(provider);
    setError(null);
  };

  return (
    <div className="min-h-screen grad-light">
      {/* Hero */}
      <section className="py-16 px-6 grad-dark text-white">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-center gap-8 ${coreTherapy ? '' : 'justify-center text-center'}`}>
            {coreTherapy && (
              <div className="hidden sm:block w-52 h-52 md:w-64 md:h-64 relative shrink-0 rounded-2xl overflow-hidden bg-white/10 border border-white/20">
                <Image
                  src={coreTherapy.productImage}
                  alt={coreTherapy.name}
                  fill
                  className="object-contain p-4"
                  sizes="256px"
                />
              </div>
            )}
            <div className={coreTherapy ? '' : 'text-center'}>
              <span className="inline-block text-xs font-bold text-cultr-sage tracking-widest mb-4">
                YOUR INITIAL 2-MONTH CLINICAL PROTOCOL
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                {plan.slug === 'core' && coreTherapy
                  ? `${plan.name} with ${coreTherapy.name}`
                  : plan.name}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${monthlyPrice}</span>
                <span className="text-white/70">/ month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6 section-veil">
        <div className="max-w-2xl mx-auto">
          {/* Product Detail (Core therapies only) — mint/sage palette */}
          {coreTherapy && (
            <div className="grad-mint rounded-2xl p-6 md:p-8 mb-8 border border-cultr-sage">
              {/* Mobile-only product image (hidden on sm+ since it's in hero) */}
              <div className="sm:hidden w-40 h-40 relative shrink-0 rounded-xl overflow-hidden bg-white/60 border border-cultr-sage/30 mx-auto mb-4">
                <Image
                  src={coreTherapy.productImage}
                  alt={coreTherapy.name}
                  fill
                  className="object-contain p-3"
                  sizes="160px"
                />
              </div>
              <h2 className="text-lg font-display font-bold text-cultr-forest mb-2">{coreTherapy.name}</h2>
              <p className="text-sm text-cultr-textMuted mb-4">{coreTherapy.description}</p>
              <ul className="space-y-2 mb-4">
                {coreTherapy.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cultr-forest shrink-0 mt-0.5" />
                    <span className="text-cultr-text">{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-cultr-textMuted/70 leading-relaxed">{coreTherapy.disclaimer}</p>
            </div>
          )}

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

            {/* Order Summary */}
            {plan.price > 0 && (
              <div className="bg-cultr-offwhite rounded-xl p-6 mb-8 border border-cultr-sage/30">
                <p className="text-xs font-bold text-cultr-forest tracking-widest uppercase mb-4">
                  Your initial 2-month clinical protocol
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cultr-text">
                      {plan.slug === 'core' && coreTherapy
                        ? `CULTR Core with ${coreTherapy.name} for the first 2 months`
                        : `${plan.name} membership for the first 2 months`}
                    </span>
                    <span className="text-sm font-medium text-cultr-forest">${twoMonthCost.toLocaleString()}</span>
                  </div>

                  {/* Onboarding Fees */}
                  <div className="border-t border-cultr-sage/20 pt-3 mt-1">
                    <p className="text-[10px] font-bold text-cultr-forest tracking-widest uppercase mb-2">
                      Onboarding Fees
                    </p>
                    <div className="space-y-2 pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cultr-text">
                          At-home blood test kit
                        </span>
                        <span className="text-sm font-medium text-cultr-forest">
                          {isConcierge ? 'included' : `$${BLOOD_TEST_ADDON.price}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cultr-text">First doctor visit</span>
                        <span className="text-sm font-medium text-cultr-forest">
                          {isConcierge ? 'included' : `$${DOCTOR_CONSULTATION_ADDON.price}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-cultr-sage/30 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-cultr-text">Today&apos;s total</span>
                      <span className="text-lg font-bold text-cultr-forest">${todayTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-cultr-textMuted mt-2">
                    Renews at ${monthlyPrice}/month after your initial 2-month protocol unless canceled before your next renewal date.
                  </p>
                </div>
              </div>
            )}

            {/* Consent Checkboxes */}
            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-cultr-sage text-cultr-forest focus:ring-cultr-forest/20 shrink-0"
                />
                <span className="text-xs text-cultr-textMuted leading-relaxed">
                  I understand that I am enrolling in an initial 2-month membership protocol and will be charged the total shown at checkout. After my initial protocol, my membership will renew monthly at the rate shown unless I cancel before my next renewal date.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-cultr-sage text-cultr-forest focus:ring-cultr-forest/20 shrink-0"
                />
                <span className="text-xs text-cultr-textMuted leading-relaxed">
                  I&apos;d like to receive updates, offers, and educational content from CULTR Health.
                </span>
              </label>
            </div>

            {/* Informed Consent */}
            <div className="mb-6">
              {consentGiven ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Informed consent completed</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConsent(true)}
                  className="w-full text-sm font-medium text-brand-primary bg-brand-cream border border-brand-primary/20 rounded-lg px-4 py-3 hover:bg-brand-primary/5 transition-colors text-left flex items-center justify-between"
                >
                  <span>Review & sign informed consent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={handleSelectPaymentMethod}
                amountCents={amountCents}
                isSubscription={true}
              />
            </div>

            {/* Stripe Checkout Form */}
            {paymentMethod === 'stripe' && (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  plan={plan}
                  onSuccess={handleCheckoutSuccess}
                  onError={handleCheckoutError}
                  todayTotal={todayTotal}
                  consentChecked={consentChecked}
                  consentGiven={consentGiven}
                />
              </Elements>
            )}

            {/* CorePay Card Form */}
            {paymentMethod === 'corepay' && (
              <div className="space-y-4 mb-6">
                {consentChecked && consentGiven ? (
                  <CorePayForm
                    planSlug={plan.slug}
                    amountCents={amountCents}
                    email=""
                    onSuccess={handleCheckoutSuccess}
                    onError={handleCheckoutError}
                  />
                ) : (
                  <p className="text-xs text-cultr-textMuted text-center py-4">
                    Please accept the membership terms and informed consent above to proceed.
                  </p>
                )}
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
                  <span className="font-display font-bold">CULTR</span> Health does not guarantee specific results. All services are provided via telehealth by licensed providers. 
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
                'You\'ll receive a welcome email with your dashboard login',
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

      <ConsentModal
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        onConsent={() => {
          setConsentGiven(true);
          setShowConsent(false);
        }}
        tierSlug={plan.slug}
      />
    </div>
  );
}
