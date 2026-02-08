'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Package,
  AlertCircle,
  Loader2,
  Shield,
  CreditCard,
  Lock,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { getCategoryDisplayName } from '@/lib/config/product-catalog'
import type { PlanTier } from '@/lib/config/plans'
import type { PaymentProvider, AuthorizeNetOpaqueData } from '@/lib/payments/payment-types'
import type { AffirmCheckoutConfig } from '@/lib/payments/payment-types'
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector'
import { KlarnaWidget } from '@/components/payments/KlarnaWidget'
import { AffirmCheckoutButton } from '@/components/payments/AffirmCheckoutButton'
import { AuthorizeNetForm, type BillingInfo } from '@/components/payments/AuthorizeNetForm'
import { getPrimaryPaymentProvider, AUTHORIZE_NET_ENABLED } from '@/lib/config/payments'

// Initialize Stripe with Healthie's publishable key for HIPAA-compliant tokenization
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_HEALTHIE_STRIPE_KEY || 'pk_test_fAj7WlTrG0uc5Z9WHKQDdoTq'
)

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
}

// Inner checkout form component
function ProductCheckoutForm({ 
  email, 
  items,
  cartTotal,
  onSuccess, 
  onError,
  clearCart,
}: {
  email: string
  items: Array<{ sku: string; quantity: number }>
  cartTotal: number
  onSuccess: (redirectUrl: string) => void
  onError: (error: string) => void
  clearCart: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      onError('Payment system not loaded. Please refresh the page.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Card element not found')
      return
    }

    setIsLoading(true)
    setCardError(null)

    try {
      // Create a token from the card element
      // Card data goes directly to Stripe (via Healthie) - HIPAA compliant
      const { token, error: tokenError } = await stripe.createToken(cardElement)

      if (tokenError) {
        setCardError(tokenError.message || 'Invalid card details')
        setIsLoading(false)
        return
      }

      if (!token) {
        setCardError('Failed to process card')
        setIsLoading(false)
        return
      }

      // Send to our API for Healthie checkout
      const response = await fetch('/api/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email,
          stripeToken: token.id,
          firstName,
          lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      clearCart()
      onSuccess(data.redirectUrl || `/success?provider=healthie&type=product&order_id=${data.orderId}`)
    } catch (err) {
      console.error('Product checkout error:', err)
      onError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-xs text-brand-primary/60 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
            placeholder="Jane"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs text-brand-primary/60 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-brand-primary/60 mb-1">
          Card Details
        </label>
        <div className="border border-brand-primary/20 rounded-lg p-3 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {cardError && (
          <p className="mt-1 text-xs text-red-600">{cardError}</p>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-brand-primary/50">
          <Lock className="w-3 h-3" />
          <span>HIPAA-compliant payment processing</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Checkout ${cartTotal.toFixed(2)}
          </>
        )}
      </button>
    </form>
  )
}

export function CartClient({ email, tier }: { email: string; tier: PlanTier | null }) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, getCartTotal, allItemsPriced } = useCart()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine primary card payment provider (Stripe Elements/Healthie vs Authorize.net)
  const primaryProvider = getPrimaryPaymentProvider()
  const useAuthorizeNet = primaryProvider === 'authorize_net' && AUTHORIZE_NET_ENABLED

  // Payment method state (for priced items)
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('stripe')
  const [klarnaClientToken, setKlarnaClientToken] = useState<string | null>(null)
  const [klarnaSessionLoading, setKlarnaSessionLoading] = useState(false)
  const [affirmConfig, setAffirmConfig] = useState<AffirmCheckoutConfig | null>(null)
  const [affirmLoading, setAffirmLoading] = useState(false)

  const cartTotal = getCartTotal()
  const cartTotalCents = Math.round(cartTotal * 100)
  const canDirectCheckout = allItemsPriced()

  const handleQuantityChange = (sku: string, delta: number) => {
    const item = items.find(i => i.sku === sku)
    if (item) {
      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) {
        removeItem(sku)
      } else {
        updateQuantity(sku, newQuantity)
      }
    }
  }

  // Quote flow (existing)
  const handleSubmitQuote = async () => {
    if (items.length === 0) {
      setError('Your cart is empty. Please add products before submitting a quote.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tier,
          items: items.map(item => ({
            sku: item.sku,
            name: item.product.name,
            quantity: item.quantity,
            doseMg: item.product.doseMg,
            volumeMl: item.product.volumeMl,
            category: item.product.category,
          })),
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit quote request')
      }

      clearCart()
      router.push('/library/quote-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle checkout success
  const handleCheckoutSuccess = (redirectUrl: string) => {
    router.push(redirectUrl)
  }

  // Handle checkout error
  const handleCheckoutError = (errorMsg: string) => {
    setError(errorMsg)
  }

  // Authorize.net product checkout handler
  const handleAuthorizeNetCheckout = async (
    opaqueData: AuthorizeNetOpaqueData,
    billing: BillingInfo
  ) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout/authorize-net/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          items: items.map(item => ({
            sku: item.sku,
            quantity: item.quantity,
          })),
          opaqueData,
          billing: billing.firstName ? billing : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to process payment')

      clearCart()
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
      } else if (data.success) {
        router.push(`/success?provider=authorize_net&order_id=${data.orderId}&type=product`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Payment method selection with BNPL session creation
  const handleSelectPaymentMethod = async (provider: PaymentProvider) => {
    setPaymentMethod(provider)
    setError(null)

    if (provider === 'klarna' && !klarnaClientToken) {
      setKlarnaSessionLoading(true)
      try {
        const checkoutItems = items.map(item => ({
          sku: item.sku,
          name: item.product.name,
          quantity: item.quantity,
          unitPriceCents: Math.round((item.product.priceUsd || 0) * 100),
        }))

        const response = await fetch('/api/checkout/klarna/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountCents: cartTotalCents, items: checkoutItems }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to create Klarna session')
        setKlarnaClientToken(data.client_token)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Klarna')
        setPaymentMethod('stripe')
      } finally {
        setKlarnaSessionLoading(false)
      }
    }

    if (provider === 'affirm' && !affirmConfig) {
      setAffirmLoading(true)
      try {
        const checkoutItems = items.map(item => ({
          sku: item.sku,
          name: item.product.name,
          quantity: item.quantity,
          unitPriceCents: Math.round((item.product.priceUsd || 0) * 100),
        }))

        const response = await fetch('/api/checkout/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountCents: cartTotalCents, items: checkoutItems }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to build Affirm checkout')
        setAffirmConfig(data.checkout)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Affirm')
        setPaymentMethod('stripe')
      } finally {
        setAffirmLoading(false)
      }
    }
  }

  // Klarna authorized callback
  const handleKlarnaAuthorized = useCallback(async (authorizationToken: string) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const checkoutItems = items.map(item => ({
        sku: item.sku,
        name: item.product.name,
        quantity: item.quantity,
        unitPriceCents: Math.round((item.product.priceUsd || 0) * 100),
      }))

      const response = await fetch('/api/checkout/klarna/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationToken,
          amountCents: cartTotalCents,
          items: checkoutItems,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Klarna order failed')

      clearCart()
      if (data.fraud_status === 'ACCEPTED') {
        router.push(`/success?provider=klarna&order_id=${data.order_id}&type=product`)
      } else {
        router.push(`/success?provider=klarna&order_id=${data.order_id}&pending=true&type=product`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klarna payment failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [items, cartTotalCents, clearCart, router])

  const handleBnplError = useCallback((msg: string) => {
    setError(msg)
    setPaymentMethod('stripe')
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Minimal Header */}
      <header className="bg-white border-b border-brand-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/library/shop"
            className="inline-flex items-center gap-2 text-brand-primary/60 hover:text-brand-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <Package className="w-16 h-16 text-brand-primary/30 mx-auto mb-6" />
            <h2 className="text-2xl font-display text-brand-primary mb-3">
              Your cart is empty
            </h2>
            <p className="text-brand-primary/60 mb-8">
              Browse our catalog and add products to your cart.
            </p>
            <Link
              href="/library/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.03] transition-all"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left Column - Form */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <h1 className="text-3xl font-display text-brand-primary mb-2">
                  {canDirectCheckout ? (
                    <>Checkout</>
                  ) : (
                    <>Request a Quote</>
                  )}
                </h1>
                <p className="text-brand-primary/60">
                  {canDirectCheckout
                    ? 'Review your items and complete your purchase.'
                    : 'Review your items and submit your request.'}
                </p>
              </div>

              {/* Contact Section */}
              <section className="bg-white rounded-2xl p-6 border border-brand-primary/10">
                <h2 className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-4">
                  Contact
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-brand-primary/60 mb-1.5">
                      Email
                    </label>
                    <div className="px-4 py-3 bg-brand-cream border border-brand-primary/10 rounded-lg text-brand-primary text-sm">
                      {email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-brand-primary/60 mb-1.5">
                      Membership Tier
                    </label>
                    <div className="px-4 py-3 bg-brand-cream border border-brand-primary/10 rounded-lg text-brand-primary text-sm capitalize">
                      {tier || 'None'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Cart Items Section */}
              <section className="bg-white rounded-2xl p-6 border border-brand-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-brand-primary uppercase tracking-wide">
                    Items ({totalItems})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-xs text-brand-primary/50 hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-brand-primary/10">
                  {items.map((item) => (
                    <div key={item.sku} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex gap-4">
                        {/* Product Image Placeholder */}
                        <div className="w-20 h-20 bg-brand-cream rounded-xl flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8 text-brand-primary/30" />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/library/shop/${encodeURIComponent(item.sku)}`}
                            className="font-display text-brand-primary hover:text-brand-primaryLight transition-colors block truncate"
                          >
                            {item.product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-brand-primary/50">
                              {getCategoryDisplayName(item.product.category)}
                            </span>
                            {item.product.volumeMl > 0 && (
                              <>
                                <span className="text-brand-primary/30">&#8226;</span>
                                <span className="text-xs text-brand-primary/50">
                                  {item.product.volumeMl}ml
                                </span>
                              </>
                            )}
                            {item.product.priceUsd && (
                              <>
                                <span className="text-brand-primary/30">&#8226;</span>
                                <span className="text-xs font-medium text-brand-primary/70">
                                  ${item.product.priceUsd.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="inline-flex items-center border border-brand-primary/20 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.sku, -1)}
                                className="w-8 h-8 flex items-center justify-center text-brand-primary/60 hover:text-brand-primary hover:bg-brand-cream transition-colors rounded-l-lg"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-10 text-center text-sm font-medium text-brand-primary">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.sku, 1)}
                                className="w-8 h-8 flex items-center justify-center text-brand-primary/60 hover:text-brand-primary hover:bg-brand-cream transition-colors rounded-r-lg"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.sku)}
                              className="text-xs text-brand-primary/50 hover:text-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes Section (quote flow only) */}
              {!canDirectCheckout && (
                <section className="bg-white rounded-2xl p-6 border border-brand-primary/10">
                  <h2 className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-4">
                    Additional Notes
                  </h2>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or questions..."
                    className="w-full px-4 py-3 border border-brand-primary/20 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 resize-none text-sm text-brand-primary placeholder:text-brand-primary/40"
                    rows={4}
                  />
                </section>
              )}
            </div>

            {/* Right Column - Order Summary (Sticky) */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                <div className="bg-brand-creamDark rounded-2xl p-6">
                  <h2 className="text-lg font-display text-brand-primary mb-6">Order Summary</h2>

                  {/* Summary Items */}
                  <div className="space-y-3 pb-4 border-b border-brand-primary/10">
                    {items.map((item) => (
                      <div key={item.sku} className="flex justify-between text-sm">
                        <span className="text-brand-primary/60 truncate pr-4">
                          {item.product.name} &#215; {item.quantity}
                        </span>
                        <span className="text-brand-primary font-medium shrink-0">
                          {item.product.priceUsd
                            ? `$${(item.product.priceUsd * item.quantity).toFixed(2)}`
                            : 'Quote'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="py-4 border-b border-brand-primary/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-primary/60">Total Items</span>
                      <span className="text-brand-primary">{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-primary/60">Unique Products</span>
                      <span className="text-brand-primary">{items.length}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 pb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-brand-primary font-medium">Total</span>
                      <span className="text-2xl font-display text-brand-primary">
                        {canDirectCheckout ? `$${cartTotal.toFixed(2)}` : 'Quote Request'}
                      </span>
                    </div>
                    {!canDirectCheckout && (
                      <p className="text-xs text-brand-primary/50 mt-1">
                        Pricing will be provided within 24-48 hours
                      </p>
                    )}
                  </div>

                  {/* Payment Method Selector (only for direct checkout) */}
                  {canDirectCheckout && (
                    <div className="mb-4">
                      <PaymentMethodSelector
                        selected={paymentMethod}
                        onSelect={handleSelectPaymentMethod}
                        amountCents={cartTotalCents}
                        isSubscription={false}
                      />
                    </div>
                  )}

                  {/* Card Checkout Form */}
                  {canDirectCheckout && paymentMethod === 'stripe' && (
                    useAuthorizeNet ? (
                      /* Authorize.net Card Form (High-Risk Merchant Account) */
                      <div className="space-y-4">
                        <AuthorizeNetForm
                          onTokenReceived={handleAuthorizeNetCheckout}
                          onError={handleCheckoutError}
                          loading={isSubmitting}
                          submitText={`Pay $${cartTotal.toFixed(2)}`}
                          collectBillingAddress={true}
                        />
                      </div>
                    ) : (
                      /* Stripe Elements via Healthie (HIPAA-compliant) */
                      <Elements stripe={stripePromise}>
                        <ProductCheckoutForm
                          email={email}
                          items={items.map(item => ({ sku: item.sku, quantity: item.quantity }))}
                          cartTotal={cartTotal}
                          onSuccess={handleCheckoutSuccess}
                          onError={handleCheckoutError}
                          clearCart={clearCart}
                        />
                      </Elements>
                    )
                  )}

                  {/* Klarna Widget */}
                  {canDirectCheckout && paymentMethod === 'klarna' && klarnaClientToken && (
                    <div className="mb-4">
                      <KlarnaWidget
                        clientToken={klarnaClientToken}
                        onAuthorized={handleKlarnaAuthorized}
                        onError={handleBnplError}
                      />
                    </div>
                  )}

                  {canDirectCheckout && paymentMethod === 'klarna' && klarnaSessionLoading && (
                    <div className="flex items-center justify-center py-4 mb-4">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-primary/60" />
                      <span className="ml-2 text-sm text-brand-primary/50">Loading Klarna...</span>
                    </div>
                  )}

                  {/* Affirm Button */}
                  {canDirectCheckout && paymentMethod === 'affirm' && (
                    <div className="mb-4">
                      <AffirmCheckoutButton
                        checkoutConfig={affirmConfig}
                        onError={handleBnplError}
                        loading={affirmLoading}
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Quote Submit Button (non-priced items) */}
                  {!canDirectCheckout && (
                    <button
                      onClick={handleSubmitQuote}
                      disabled={isSubmitting || items.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Quote Request'
                      )}
                    </button>
                  )}

                  {/* Trust Signal */}
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-primary/50">
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      {canDirectCheckout ? 'HIPAA-compliant checkout' : 'Secure request \u2022 No payment required'}
                    </span>
                  </div>
                </div>

                {/* How It Works (quote flow only) */}
                {!canDirectCheckout && (
                  <div className="mt-6 p-5 bg-white rounded-2xl border border-brand-primary/10">
                    <h3 className="font-display text-sm text-brand-primary mb-3">How it works</h3>
                    <ol className="text-xs text-brand-primary/60 space-y-2">
                      <li className="flex gap-2">
                        <span className="font-medium text-brand-primary">1.</span>
                        Submit your quote request
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-brand-primary">2.</span>
                        Our team reviews and prepares pricing
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-brand-primary">3.</span>
                        Receive your personalized quote via email
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-brand-primary">4.</span>
                        Confirm to proceed with purchase
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
