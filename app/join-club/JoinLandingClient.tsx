'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, Check, Loader2 } from 'lucide-react'
import { JoinCartProvider, useJoinCart, type JoinCartItem } from '@/lib/contexts/JoinCartContext'
import { JOIN_THERAPY_SECTIONS, type JoinTherapy } from '@/lib/config/join-therapies'
import { cn } from '@/lib/utils'

// =============================================
// MAIN WRAPPER (provides cart context)
// =============================================

export function JoinLandingClient() {
  return (
    <JoinCartProvider>
      <JoinLandingInner />
    </JoinCartProvider>
  )
}

// =============================================
// INNER COMPONENT (has access to cart)
// =============================================

interface ClubMember {
  name: string
  email: string
  phone: string
  socialHandle: string
}

function JoinLandingInner() {
  const [member, setMember] = useState<ClubMember | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const cart = useJoinCart()

  // Check for existing cookie on mount
  useEffect(() => {
    try {
      const stored = document.cookie
        .split('; ')
        .find((c) => c.startsWith('cultr_club_visitor='))
      if (stored) {
        const data = JSON.parse(decodeURIComponent(stored.split('=')[1]))
        setMember(data)
      } else {
        setShowSignup(true)
      }
    } catch {
      setShowSignup(true)
    }
  }, [])

  const handleSignupComplete = useCallback((data: ClubMember) => {
    setMember(data)
    setShowSignup(false)
  }, [])

  const handleOrderSubmitted = useCallback(() => {
    setOrderSubmitted(true)
    setShowCart(false)
  }, [])

  // Show nothing until we know signup state
  if (!member && !showSignup) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Signup Modal */}
      {showSignup && <SignupModal onComplete={handleSignupComplete} />}

      {/* Header */}
      <JoinHeader
        itemCount={cart.getItemCount()}
        onCartClick={() => setShowCart(true)}
      />

      {/* Order Success Banner */}
      {orderSubmitted && (
        <div className="bg-mint border-b border-sage/30 px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-2 text-brand-primary font-medium">
            <Check className="w-5 h-5" />
            <span>Order submitted! Check your email for confirmation.</span>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 text-center">
        <h1 className="font-fraunces text-3xl md:text-5xl font-bold text-brand-primary mb-4">
          Your Personalized Therapy Protocol
        </h1>
        <p className="text-brand-primary/70 text-lg max-w-2xl mx-auto font-body">
          Browse physician-supervised therapies and build your custom wellness order.
          Our team reviews every order for safety and efficacy.
        </p>
        {member && (
          <p className="mt-3 text-sm text-brand-primary/50 font-body">
            Welcome, {member.name.split(' ')[0]}
          </p>
        )}
      </section>

      {/* Therapy Sections */}
      <main className="max-w-6xl mx-auto px-4 pb-32">
        {JOIN_THERAPY_SECTIONS.map((section) => (
          <TherapySection key={section.title} section={section} />
        ))}

        {/* Trust & Disclaimer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-mint/50 rounded-full text-sm text-brand-primary/70 font-body mb-6">
            <span className="w-2 h-2 rounded-full bg-sage" />
            All therapies are physician-supervised
          </div>
          <p className="text-xs text-brand-primary/40 max-w-xl mx-auto font-body">
            These products require a prescription and physician oversight. Your order will be
            reviewed by our medical team before an invoice is generated. Individual results may vary.
          </p>
        </div>
      </main>

      {/* Mobile Cart FAB */}
      {cart.getItemCount() > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 md:hidden bg-brand-primary text-white rounded-full px-6 py-4 shadow-xl flex items-center gap-3 z-40 hover:bg-forest-light transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-medium">{cart.getItemCount()} items</span>
          {cart.getCartTotal() > 0 && (
            <span className="text-sm opacity-80">
              ${cart.getCartTotal().toFixed(2)}
            </span>
          )}
        </button>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar
          member={member}
          onClose={() => setShowCart(false)}
          onOrderSubmitted={handleOrderSubmitted}
        />
      )}
    </div>
  )
}

// =============================================
// HEADER
// =============================================

function JoinHeader({ itemCount, onCartClick }: { itemCount: number; onCartClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-primary/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-1">
          <Image
            src="/creators/brand-kit/cultr-logo-dark.svg"
            alt="CULTR Health"
            width={120}
            height={32}
            priority
          />
        </div>
        <button
          onClick={onCartClick}
          className="relative p-2 rounded-full hover:bg-brand-primary/5 transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-brand-primary" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

// =============================================
// SIGNUP MODAL
// =============================================

function SignupModal({ onComplete }: { onComplete: (data: ClubMember) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/club/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), socialHandle: socialHandle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      onComplete({ name: name.trim(), email: email.trim(), phone: phone.trim(), socialHandle: socialHandle.trim() })
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary/40 backdrop-blur-sm p-4">
      <div className="bg-brand-cream rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="pt-10 pb-4 text-center">
          <Image
            src="/creators/brand-kit/cultr-logo-dark.svg"
            alt="CULTR Health"
            width={140}
            height={38}
            priority
            className="mx-auto"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-10">
          <h2 className="font-fraunces text-2xl font-bold text-brand-primary text-center mb-2">
            Join CULTR Club
          </h2>
          <p className="text-brand-primary/60 text-sm text-center mb-8 font-body">
            Free membership — browse therapies & build your order
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-body">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-primary/70 mb-1.5 font-body">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 bg-white text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary/70 mb-1.5 font-body">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 bg-white text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary/70 mb-1.5 font-body">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 bg-white text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary/70 mb-1.5 font-body">Social Handle</label>
              <input
                type="text"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                placeholder="@yourusername"
                className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 bg-white text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-body"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-brand-primary text-brand-cream font-medium py-3.5 rounded-full hover:bg-forest-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2 font-body"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Join Free & Start Shopping
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-brand-primary/40 text-center font-body">
            By joining, you agree to our terms of service and privacy policy.
          </p>
        </form>
      </div>
    </div>
  )
}

// =============================================
// THERAPY SECTION
// =============================================

function TherapySection({ section }: { section: typeof JOIN_THERAPY_SECTIONS[number] }) {
  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="font-fraunces text-2xl md:text-3xl font-bold text-brand-primary">
          {section.title}
        </h2>
        <p className="text-brand-primary/50 text-sm mt-1 font-body">{section.subtitle}</p>
        <p className="text-brand-primary/60 mt-3 max-w-2xl font-body">{section.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {section.therapies.map((therapy) => (
          <TherapyCard key={therapy.id} therapy={therapy} />
        ))}
      </div>
    </section>
  )
}

// =============================================
// THERAPY CARD
// =============================================

function TherapyCard({ therapy }: { therapy: JoinTherapy }) {
  const cart = useJoinCart()
  const inCart = cart.isInCart(therapy.id)

  function handleAddToCart() {
    cart.addItem({
      therapyId: therapy.id,
      name: therapy.name,
      price: therapy.price,
      pricingNote: therapy.pricingNote,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/8 p-6 flex flex-col transition-shadow hover:shadow-lg">
      {/* Aura gradient placeholder for product image area */}
      <div className="w-full h-32 rounded-xl bg-gradient-to-br from-mint/60 via-brand-cream to-sage/40 mb-5 flex items-center justify-center">
        <span className="text-3xl font-fraunces font-bold text-brand-primary/15">
          {therapy.name.charAt(0)}
        </span>
      </div>

      {/* Badge */}
      <span className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium bg-mint/60 text-brand-primary/70 mb-3 font-body">
        {therapy.badge}
      </span>

      {/* Name */}
      <h3 className="font-display text-lg font-semibold text-brand-primary mb-1">
        {therapy.name}
      </h3>

      {/* Note */}
      {therapy.note && (
        <p className="text-xs text-brand-primary/50 mb-2 font-body">{therapy.note}</p>
      )}

      {/* Description */}
      <p className="text-sm text-brand-primary/60 mb-5 flex-1 font-body">
        {therapy.description}
      </p>

      {/* Price */}
      <div className="mb-4">
        {therapy.price !== null ? (
          <span className="text-xl font-bold text-brand-primary font-fraunces">
            ${therapy.price.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm font-medium text-brand-primary/60 font-body">
            {therapy.pricingNote || 'Consultation pricing'}
          </span>
        )}
      </div>

      {/* Add to Cart */}
      {inCart ? (
        <div className="flex items-center gap-2">
          <QuantityControl
            therapyId={therapy.id}
            quantity={cart.items.find((i) => i.therapyId === therapy.id)?.quantity || 1}
          />
          <button
            onClick={() => cart.removeItem(therapy.id)}
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Remove from cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          className="w-full bg-brand-primary text-white py-3 rounded-full font-medium hover:bg-forest-light transition-colors flex items-center justify-center gap-2 font-body"
        >
          <Plus className="w-4 h-4" />
          {therapy.price !== null ? 'Add to Cart' : 'Request Consultation'}
        </button>
      )}
    </div>
  )
}

// =============================================
// QUANTITY CONTROL
// =============================================

function QuantityControl({ therapyId, quantity }: { therapyId: string; quantity: number }) {
  const cart = useJoinCart()

  return (
    <div className="flex items-center gap-0 bg-brand-primary/5 rounded-full flex-1">
      <button
        onClick={() => cart.updateQuantity(therapyId, quantity - 1)}
        className="p-2.5 rounded-l-full hover:bg-brand-primary/10 transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4 text-brand-primary" />
      </button>
      <span className="px-4 text-sm font-medium text-brand-primary font-body min-w-[2rem] text-center">
        {quantity}
      </span>
      <button
        onClick={() => cart.updateQuantity(therapyId, quantity + 1)}
        className="p-2.5 rounded-r-full hover:bg-brand-primary/10 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4 text-brand-primary" />
      </button>
    </div>
  )
}

// =============================================
// CART SIDEBAR
// =============================================

function CartSidebar({
  member,
  onClose,
  onOrderSubmitted,
}: {
  member: ClubMember | null
  onClose: () => void
  onOrderSubmitted: () => void
}) {
  const cart = useJoinCart()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmitOrder() {
    if (!member) return
    if (cart.items.length === 0) return

    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/club/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email,
          name: member.name,
          phone: member.phone,
          items: cart.items.map((item) => ({
            therapyId: item.therapyId,
            name: item.name,
            price: item.price,
            pricingNote: item.pricingNote,
            quantity: item.quantity,
          })),
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit order.')
        setSubmitting(false)
        return
      }

      cart.clearCart()
      onOrderSubmitted()
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-brand-cream z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-primary/10">
          <h2 className="font-fraunces text-xl font-bold text-brand-primary">Your Order</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-primary/5 transition-colors"
          >
            <X className="w-5 h-5 text-brand-primary" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-brand-primary/20 mx-auto mb-4" />
              <p className="text-brand-primary/50 font-body">Your cart is empty</p>
              <p className="text-sm text-brand-primary/30 mt-1 font-body">
                Browse therapies and add them to your order
              </p>
            </div>
          ) : (
            cart.items.map((item) => (
              <CartItemRow key={item.therapyId} item={item} />
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-brand-primary/10 px-6 py-5 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-primary/60 font-body">Subtotal</span>
              <span className="text-lg font-bold text-brand-primary font-fraunces">
                {cart.getCartTotal() > 0 ? `$${cart.getCartTotal().toFixed(2)}` : '—'}
              </span>
            </div>

            {cart.hasConsultationItems() && (
              <p className="text-xs text-brand-primary/50 font-body">
                * Some items require consultation pricing. Final total will be provided after review.
              </p>
            )}

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for your provider (optional)"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-brand-primary/15 bg-white text-brand-primary placeholder:text-brand-primary/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none font-body"
            />

            {error && (
              <p className="text-sm text-red-600 font-body">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmitOrder}
              disabled={submitting || !member}
              className="w-full bg-brand-primary text-white py-3.5 rounded-full font-medium hover:bg-forest-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2 font-body"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Submit Order Request
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-brand-primary/40 text-center font-body">
              No payment required now. You&apos;ll receive an invoice after review.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// =============================================
// CART ITEM ROW
// =============================================

function CartItemRow({ item }: { item: JoinCartItem }) {
  const cart = useJoinCart()

  return (
    <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-brand-primary/5">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-brand-primary text-sm font-body truncate">{item.name}</h4>
        <div className="mt-1">
          {item.price !== null ? (
            <span className="text-sm font-semibold text-brand-primary font-body">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-brand-primary/50 font-body">
              {item.pricingNote || 'Pricing TBD'}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <QuantityControl therapyId={item.therapyId} quantity={item.quantity} />
        </div>
      </div>
      <button
        onClick={() => cart.removeItem(item.therapyId)}
        className="p-1.5 text-brand-primary/30 hover:text-red-500 transition-colors shrink-0"
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
