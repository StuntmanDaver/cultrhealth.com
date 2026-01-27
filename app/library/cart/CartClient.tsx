'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { getCategoryDisplayName } from '@/lib/config/product-catalog'
import type { PlanTier } from '@/lib/config/plans'

export function CartClient({ email, tier }: { email: string; tier: PlanTier | null }) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart } = useCart()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Clear cart and redirect to success page
      clearCart()
      router.push('/library/quote-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      {/* Header */}
      <header className="bg-cultr-forest text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/library/shop"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Continue Shopping</span>
            </Link>
          </div>
          
          <div className="mt-6 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-display font-bold">Your Cart</h1>
              <p className="text-white/70 text-sm">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cultr-sage p-12 text-center">
            <Package className="w-16 h-16 text-cultr-textMuted mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-cultr-text mb-2">
              Your cart is empty
            </h2>
            <p className="text-cultr-textMuted mb-6">
              Browse our catalog and add products to your cart.
            </p>
            <Link
              href="/library/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cultr-forest text-white font-bold rounded-lg hover:bg-cultr-forest/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.sku}
                  className="bg-white rounded-xl border border-cultr-sage p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        href={`/library/shop/${encodeURIComponent(item.sku)}`}
                        className="font-display font-bold text-cultr-text hover:text-cultr-forest transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-cultr-mint rounded-full text-cultr-forest">
                          {getCategoryDisplayName(item.product.category)}
                        </span>
                        {item.product.volumeMl > 0 && (
                          <span className="text-xs text-cultr-textMuted">
                            {item.product.volumeMl}ml
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cultr-textMuted mt-1">
                        SKU: {item.sku}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.sku, -1)}
                        className="w-8 h-8 flex items-center justify-center border border-cultr-sage rounded-lg hover:bg-cultr-mint transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.sku, 1)}
                        className="w-8 h-8 flex items-center justify-center border border-cultr-sage rounded-lg hover:bg-cultr-mint transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.sku)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart */}
              <button
                onClick={clearCart}
                className="text-sm text-cultr-textMuted hover:text-red-500 transition-colors"
              >
                Clear all items
              </button>
            </div>

            {/* Quote Request Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-cultr-sage p-6 sticky top-6">
                <h2 className="text-lg font-display font-bold text-cultr-text mb-4">
                  Request Quote
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-cultr-text mb-1">
                      Email
                    </label>
                    <p className="text-cultr-textMuted text-sm px-3 py-2 bg-cultr-offwhite rounded-lg">
                      {email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cultr-text mb-1">
                      Membership Tier
                    </label>
                    <p className="text-cultr-textMuted text-sm px-3 py-2 bg-cultr-offwhite rounded-lg capitalize">
                      {tier || 'None'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cultr-text mb-1">
                      Total Items
                    </label>
                    <p className="text-cultr-textMuted text-sm px-3 py-2 bg-cultr-offwhite rounded-lg">
                      {items.reduce((sum, item) => sum + item.quantity, 0)} items ({items.length} unique)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-cultr-text mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or questions..."
                      className="w-full px-3 py-2 border border-cultr-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmitQuote}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cultr-forest text-white font-bold rounded-lg hover:bg-cultr-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Quote Request
                    </>
                  )}
                </button>

                <p className="text-xs text-cultr-textMuted mt-4 text-center">
                  Our team will review your request and contact you with pricing within 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-cultr-mint border border-cultr-sage rounded-xl">
          <h3 className="font-bold text-cultr-text mb-2">How Quote Requests Work</h3>
          <ol className="text-sm text-cultr-textMuted space-y-2 list-decimal list-inside">
            <li>Add products to your cart and submit a quote request</li>
            <li>Our team reviews your request and prepares pricing</li>
            <li>You&apos;ll receive an email with your personalized quote within 24-48 hours</li>
            <li>Confirm your order to proceed with purchase and prescription</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
