'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, Check,
  Loader2, Stethoscope, Flame, Zap, Shield, Package, ArrowRight,
} from 'lucide-react'
import { JoinCartProvider, useJoinCart, type JoinCartItem } from '@/lib/contexts/JoinCartContext'
import { JOIN_THERAPY_SECTIONS, type JoinTherapy, type JoinTherapySection } from '@/lib/config/join-therapies'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

// =============================================
// MAIN WRAPPER
// =============================================

export function JoinLandingClient() {
  return (
    <JoinCartProvider>
      <JoinLandingInner />
    </JoinCartProvider>
  )
}

// =============================================
// INNER
// =============================================

interface ClubMember {
  name: string
  email: string
  phone: string
  socialHandle: string
}

const SECTION_ICONS = [Flame, Zap] as const

function JoinLandingInner() {
  const [member, setMember] = useState<ClubMember | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const cart = useJoinCart()

  useEffect(() => {
    try {
      const stored = document.cookie.split('; ').find((c) => c.startsWith('cultr_club_visitor='))
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
    setShowMobileCart(false)
  }, [])

  if (!member && !showSignup) {
    return (
      <div className="min-h-screen grad-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Signup Modal */}
      {showSignup && <SignupModal onComplete={handleSignupComplete} />}

      {/* Hero — matches therapies page */}
      <section className="pt-16 pb-12 md:pt-20 md:pb-14 px-6 grad-dark-glow text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Stethoscope className="w-4 h-4 text-cultr-sage" />
              <span className="text-sm">Physician-Supervised</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              Core Therapies
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mt-1 mb-2">
              <span className="text-sm text-cultr-sage font-semibold">CULTR Club — Free Membership</span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Browse our catalog of physician-supervised therapies, add to your cart, and
              submit your order for medical team review.
            </p>
            {member && (
              <p className="mt-3 text-sm text-white/50">
                Welcome, {member.name.split(' ')[0]}
              </p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Info banner — matches therapies page */}
      <section className="py-5 px-6 grad-mint border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cultr-forest/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-cultr-forest" />
            </div>
            <div>
              <p className="font-display font-bold text-cultr-forest text-sm">
                Order Review Required
              </p>
              <p className="text-xs text-cultr-textMuted">
                All orders are reviewed by our medical team before invoicing. No payment is taken today.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileCart(true)}
            className="shrink-0 lg:hidden inline-flex items-center justify-center py-2.5 px-5 bg-brand-primary text-brand-cream font-medium text-sm rounded-full transition-all hover:bg-brand-primaryHover relative"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cart.getItemCount() > 0 && (
              <span className="ml-2 w-5 h-5 bg-cultr-sage text-cultr-forest text-xs font-bold rounded-full flex items-center justify-center">
                {cart.getItemCount()}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Order Success Banner */}
      {orderSubmitted && (
        <div className="py-4 px-6 grad-mint border-b border-cultr-sage">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-cultr-forest font-medium text-sm">
            <Check className="w-5 h-5" />
            <span>Order submitted! Check your email for confirmation.</span>
          </div>
        </div>
      )}

      {/* Main Content — two-column layout matching cart page */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* Left Column — Therapy Sections (matches therapies page card style) */}
            <div className="lg:col-span-3 space-y-12">
              {JOIN_THERAPY_SECTIONS.map((section, sectionIdx) => {
                const Icon = SECTION_ICONS[sectionIdx]
                return (
                  <TherapySectionBlock key={section.title} section={section} Icon={Icon} sectionIdx={sectionIdx} />
                )
              })}

              {/* Medical Disclaimer — matches therapies page */}
              <div className="flex items-start gap-3 py-6 border-t border-cultr-sage">
                <Shield className="w-5 h-5 text-cultr-forest shrink-0 mt-0.5" />
                <p className="text-xs text-cultr-textMuted leading-relaxed">
                  <span className="font-semibold text-cultr-text">Medical Disclaimer:</span>{' '}
                  All therapies listed require physician evaluation and prescription.{' '}
                  <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health does not guarantee specific results. Outcomes vary by
                  individual. If you have a medical emergency, call 911.
                </p>
              </div>
            </div>

            {/* Right Column — Sticky Cart Summary (matches CartClient layout) */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="sticky top-8">
                <CartSummaryPanel member={member} onOrderSubmitted={handleOrderSubmitted} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Cart FAB */}
      {cart.getItemCount() > 0 && !showMobileCart && (
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-2 px-4 py-3 grad-dark text-white rounded-full shadow-lg hover:bg-cultr-forest/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cart.getItemCount()}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Full-Screen Overlay */}
      {showMobileCart && (
        <MobileCartOverlay member={member} onClose={() => setShowMobileCart(false)} onOrderSubmitted={handleOrderSubmitted} />
      )}
    </div>
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
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/club/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), socialHandle: socialHandle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      onComplete({ name: name.trim(), email: email.trim(), phone: phone.trim(), socialHandle: socialHandle.trim() })
    } catch { setError('Network error.'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(42,69,66,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-brand-cream rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Logo */}
        <div className="pt-10 pb-2 grad-dark-glow flex items-center justify-center">
          <span className="font-display font-bold text-3xl tracking-[0.15em] text-white" style={{ fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif" }}>CULTR</span>
        </div>
        <div className="pb-2 grad-dark-glow text-center">
          <p className="text-white/60 text-xs">Free Membership</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 pt-6">
          <h2 className="font-display text-xl font-bold text-cultr-forest text-center mb-1">
            Join CULTR Club
          </h2>
          <p className="text-cultr-textMuted text-sm text-center mb-6">
            Browse therapies &amp; build your order
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="input-eli" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="input-eli" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="input-eli" />
            <input type="text" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} placeholder="@social handle" className="input-eli" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Free &amp; Start Shopping <ChevronRight className="w-4 h-4" /></>}
          </button>

          <p className="mt-4 text-xs text-cultr-textMuted text-center">
            By joining, you agree to our terms of service and privacy policy.
          </p>
        </form>
      </div>
    </div>
  )
}

// =============================================
// THERAPY SECTION (matches therapies page exactly)
// =============================================

function TherapySectionBlock({ section, Icon, sectionIdx }: { section: JoinTherapySection; Icon: typeof Flame; sectionIdx: number }) {
  const isAlt = sectionIdx % 2 === 1
  return (
    <div className={`rounded-2xl p-6 md:p-8 ${isAlt ? 'grad-light' : 'grad-white'}`}>
      <ScrollReveal className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full grad-mint flex items-center justify-center">
            <Icon className="w-4 h-4 text-cultr-forest" />
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-cultr-forest">
            {section.title}
          </h2>
        </div>
        <p className="text-sm text-cultr-textMuted max-w-2xl ml-11">{section.description}</p>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 gap-4">
        {section.therapies.map((therapy, i) => (
          <ScrollReveal key={therapy.id} delay={i * 60} direction="up">
            <TherapyCard therapy={therapy} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}

// =============================================
// THERAPY CARD (matches therapies page card + shop add-to-cart)
// =============================================

function TherapyCard({ therapy }: { therapy: JoinTherapy }) {
  const cart = useJoinCart()
  const inCart = cart.isInCart(therapy.id)
  const cartItem = cart.items.find((i) => i.therapyId === therapy.id)

  function handleAdd() {
    if (inCart && cartItem) {
      cart.updateQuantity(therapy.id, cartItem.quantity + 1)
    } else {
      cart.addItem({ therapyId: therapy.id, name: therapy.name, price: therapy.price, pricingNote: therapy.pricingNote })
    }
  }

  return (
    <div className="h-full p-5 rounded-xl bg-brand-cream border border-cultr-sage/40 hover:border-cultr-sage transition-colors flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-display font-bold text-cultr-forest">{therapy.name}</h3>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-cultr-forest grad-mint px-2 py-0.5 rounded-full">
          {therapy.badge}
        </span>
      </div>

      {therapy.note && (
        <div className="inline-block text-[11px] text-cultr-forest/70 bg-cultr-sage/30 px-2 py-0.5 rounded-full mb-2 self-start">
          {therapy.note}
        </div>
      )}

      <p className="text-xs text-cultr-textMuted leading-relaxed mb-4 flex-1">{therapy.description}</p>

      {/* Price */}
      <div className="mb-3">
        {therapy.price !== null ? (
          <span className="text-lg font-display font-bold text-cultr-forest">${therapy.price.toFixed(2)}</span>
        ) : (
          <span className="text-xs font-medium text-cultr-textMuted">{therapy.pricingNote || 'Consultation pricing'}</span>
        )}
      </div>

      {/* Add to Cart — matches shop button style */}
      {inCart && cartItem ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-cultr-forest flex items-center gap-1">
            <Check className="w-3 h-3" />
            In cart ({cartItem.quantity})
          </span>
          <button onClick={handleAdd} className="p-2 grad-dark text-white rounded-lg hover:bg-cultr-forest/90 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-2 grad-dark text-white text-sm rounded-lg hover:bg-cultr-forest/90 transition-colors self-start">
          <Plus className="w-4 h-4" />
          {therapy.price !== null ? 'Add' : 'Request'}
        </button>
      )}
    </div>
  )
}

// =============================================
// CART SUMMARY PANEL (matches CartClient right column)
// =============================================

function CartSummaryPanel({ member, onOrderSubmitted }: { member: ClubMember | null; onOrderSubmitted: () => void }) {
  const cart = useJoinCart()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmitOrder() {
    if (!member || cart.items.length === 0) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/club/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email, name: member.name, phone: member.phone,
          items: cart.items.map((item) => ({ therapyId: item.therapyId, name: item.name, price: item.price, pricingNote: item.pricingNote, quantity: item.quantity })),
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit order.'); setSubmitting(false); return }
      cart.clearCart()
      onOrderSubmitted()
    } catch { setError('Network error.'); setSubmitting(false) }
  }

  return (
    <div className="bg-brand-creamDark rounded-2xl p-6">
      <h2 className="text-lg font-display text-brand-primary mb-6">Your Order</h2>

      {cart.items.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-12 h-12 text-brand-primary/20 mx-auto mb-4" />
          <p className="text-sm text-brand-primary/50">Add therapies to get started</p>
        </div>
      ) : (
        <>
          {/* Summary Items */}
          <div className="space-y-3 pb-4 border-b border-brand-primary/10">
            {cart.items.map((item) => (
              <div key={item.therapyId} className="flex justify-between text-sm">
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="text-brand-primary/60 truncate">{item.name} &times; {item.quantity}</span>
                  <button onClick={() => cart.removeItem(item.therapyId)} className="text-brand-primary/30 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-brand-primary font-medium shrink-0">
                  {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : 'TBD'}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-4 pb-4">
            <div className="flex justify-between items-baseline">
              <span className="text-brand-primary font-medium">Total</span>
              <span className="text-2xl font-display text-brand-primary">
                {cart.getCartTotal() > 0 ? `$${cart.getCartTotal().toFixed(2)}` : 'Quote Request'}
              </span>
            </div>
            {cart.hasConsultationItems() && (
              <p className="text-xs text-brand-primary/50 mt-1">
                * Some items require consultation pricing. Final total after review.
              </p>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for your provider (optional)..."
            className="w-full px-4 py-3 border border-brand-primary/20 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 resize-none text-sm text-brand-primary placeholder:text-brand-primary/40 mb-4"
            rows={2}
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button onClick={handleSubmitOrder} disabled={submitting || !member}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Order Request <ArrowRight className="w-4 h-4" /></>}
          </button>

          {/* Trust Signal */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-brand-primary/50">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure request &bull; No payment required</span>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================
// MOBILE CART OVERLAY
// =============================================

function MobileCartOverlay({ member, onClose, onOrderSubmitted }: { member: ClubMember | null; onClose: () => void; onOrderSubmitted: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-16 bg-brand-cream rounded-t-2xl overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-brand-primary">Your Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-primary/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-brand-primary" />
          </button>
        </div>
        <CartSummaryPanel member={member} onOrderSubmitted={onOrderSubmitted} />
      </div>
    </div>
  )
}
