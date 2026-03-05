'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, Check,
  Loader2, Stethoscope, Flame, Zap, Shield, Package, ArrowRight, Info, Tag,
} from 'lucide-react'
import { JoinCartProvider, useJoinCart, type JoinCartItem } from '@/lib/contexts/JoinCartContext'
import { JOIN_THERAPY_SECTIONS, getAllJoinTherapies, type JoinTherapy, type JoinTherapySection } from '@/lib/config/join-therapies'
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
  const hasItems = cart.getItemCount() > 0

  useEffect(() => {
    try {
      // Check localStorage first (most reliable), then cookie as fallback
      const lsData = localStorage.getItem('cultr_club_member')
      if (lsData) {
        const data = JSON.parse(lsData)
        setMember(data)
        return
      }
      const stored = document.cookie.split('; ').find((c) => c.startsWith('cultr_club_visitor='))
      if (stored) {
        const data = JSON.parse(decodeURIComponent(stored.split('=')[1]))
        setMember(data)
        // Sync to localStorage for future visits
        localStorage.setItem('cultr_club_member', JSON.stringify(data))
        return
      }
      setShowSignup(true)
    } catch {
      setShowSignup(true)
    }
  }, [])

  const handleSignupComplete = useCallback((data: ClubMember) => {
    // Persist to localStorage (primary) and cookie (backup)
    localStorage.setItem('cultr_club_member', JSON.stringify(data))
    const cookieData = encodeURIComponent(JSON.stringify(data))
    document.cookie = `cultr_club_visitor=${cookieData}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    setMember(data)
    setShowSignup(false)
  }, [])

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showSignup || showMobileCart) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showSignup, showMobileCart])

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
    <div className="flex flex-col min-h-screen bg-brand-cream">
      {/* Signup Modal */}
      {showSignup && <SignupModal onComplete={handleSignupComplete} />}

      {/* Order Success Banner — Reserve space to prevent layout shift on mobile */}
      {orderSubmitted && (
        <div className="py-8 px-6 bg-green-50 border-b-2 border-green-200">
          <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200/50 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl md:text-2xl font-display font-bold text-green-700 mb-1">
                Thank you for your order!
              </h3>
              <p className="text-base text-green-600 font-medium">
                Order submitted successfully. Check your email for confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero with Background Image and Overlay Text */}
      <section className="relative h-[45vh] min-h-[320px] md:h-[50vh] md:min-h-[380px] overflow-hidden bg-gray-200">
        <img
          src="/images/hero-cultr-join.png"
          alt="CULTR — Diverse women in athletic wear"
          className="w-full h-full object-cover object-center"
        />

        {/* Text Overlay with Translucent Background */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="px-6 md:px-8 md:ml-24 py-8 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
            <div className="max-w-md">
              <ScrollReveal direction="none" duration={800}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 leading-[1.1] text-white drop-shadow-lg">
                  Core Therapies
                </h1>
                <p className="text-sm uppercase tracking-widest text-white/70 font-medium mb-3">Browse & Build Your Stack</p>
              </ScrollReveal>
              <ScrollReveal delay={200} direction="none" duration={800}>
                <p className="text-base md:text-lg text-white/90 max-w-xl leading-relaxed drop-shadow">
                  Add therapies to your cart and submit your order for medical team review.
                </p>
                {member && (
                  <p className="mt-4 text-sm text-white/70 font-medium">
                    Welcome, {member.name.split(' ')[0]}
                  </p>
                )}
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content — two-column layout matching cart page */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          <div className={`grid gap-12 ${hasItems ? 'lg:grid-cols-5' : 'lg:grid-cols-1 max-w-4xl mx-auto'}`}>

            {/* Left Column — Therapy Sections */}
            <div className={hasItems ? 'lg:col-span-3 space-y-10' : 'space-y-10'}>
              {JOIN_THERAPY_SECTIONS.map((section, sectionIdx) => {
                const Icon = SECTION_ICONS[sectionIdx]
                return (
                  <TherapySectionBlock key={section.title} section={section} Icon={Icon} sectionIdx={sectionIdx} />
                )
              })}

              {/* Medical Disclaimer */}
              <div className="flex items-start gap-3 py-6 border-t border-brand-secondary/10">
                <Shield className="w-5 h-5 text-brand-secondary/60 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-secondary/70 leading-relaxed">
                  <span className="font-semibold text-brand-primary">Medical Disclaimer:</span>{' '}
                  All therapies listed require physician evaluation and prescription.{' '}
                  <span className="font-display font-bold">CULTR</span> Health does not guarantee specific results. Outcomes vary by
                  individual. If you have a medical emergency, call 911.
                </p>
              </div>
            </div>

            {/* Right Column — Sticky Cart Summary, only visible when items in cart */}
            {hasItems && (
              <div className="lg:col-span-2 hidden lg:block">
                <div className="sticky top-8">
                  <CartSummaryPanel member={member} onOrderSubmitted={handleOrderSubmitted} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Cart FAB — Reserve space even when not visible to prevent layout shift */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40 h-[52px] flex items-center">
        {cart.getItemCount() > 0 && !showMobileCart && (
          <button
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primaryHover transition-all hover:scale-[1.02] border border-white/10"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold text-sm">{cart.getItemCount()} items</span>
          </button>
        )}
      </div>

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(42,69,66,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-secondary/10">
        {/* Logo */}
        <div className="pt-10 pb-5 grad-dark-glow flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #FCFBF7 0%, transparent 70%)' }} />
          <div className="flex flex-col items-end leading-none relative z-10">
            <span className="font-display font-bold text-2xl uppercase text-white">CULTR</span>
            <span className="font-display font-medium text-[8px] tracking-[0.14em] uppercase text-white/40 mt-0.5">Health</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 pt-7">
          <h2 className="font-display text-xl font-bold text-brand-primary text-center mb-1">
            Join CULTR Club
          </h2>
          <p className="text-brand-secondary/60 text-sm text-center mb-6">
            Browse therapies &amp; build your order
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="text" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} placeholder="@social handle (optional)" className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3.5 bg-brand-primary text-white font-medium rounded-full hover:bg-brand-primaryHover transition-colors disabled:opacity-50 shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Free &amp; Start Shopping <ChevronRight className="w-4 h-4" /></>}
          </button>

          <p className="mt-5 text-[11px] text-brand-secondary/40 text-center">
            By joining, you agree to our{' '}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
              terms of service
            </a>
            {' '}and{' '}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
              privacy policy
            </a>
            .
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
  return (
    <div className="md:rounded-2xl md:border md:border-brand-secondary/10 md:bg-white md:p-8 pb-8 border-b border-brand-secondary/8 md:border-b-0">
      <ScrollReveal className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/[0.06] flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-brand-primary">
              {section.title}
            </h2>
            <p className="text-[11px] uppercase tracking-widest text-brand-secondary/50 font-medium">{section.subtitle}</p>
          </div>
        </div>
        <p className="text-sm text-brand-secondary/80 max-w-2xl ml-0 md:ml-24 leading-relaxed">{section.description}</p>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 gap-4">
        {section.therapies.map((therapy, i) => (
          <ScrollReveal key={therapy.id} delay={i * 60} direction="up" className={therapy.featured ? 'sm:col-span-2' : ''}>
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
      cart.addItem({ therapyId: therapy.id, name: therapy.name, price: therapy.price, pricingNote: therapy.pricingNote, note: therapy.note })
    }
  }

  const showImage = !!therapy.image

  return (
    <div className={`h-full rounded-xl border transition-all duration-200 flex group relative ${therapy.featured ? 'bg-brand-primary text-white border-brand-primary px-6 py-5 md:px-8 md:py-6 flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 shadow-sm' : 'bg-white md:bg-brand-cream border-brand-secondary/8 md:border-brand-secondary/12 hover:border-brand-secondary/25 hover:shadow-sm p-4 md:p-5 shadow-sm md:shadow-none flex-col'}`}>
      {therapy.featured ? (
        <>
          {/* Reserved space for featured image — prevents layout shift */}
          <div className="flex w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative rounded-lg overflow-hidden bg-gradient-to-b from-brand-cream to-brand-creamDark">
            {showImage && (
              <Image
                src={therapy.image}
                alt={therapy.name}
                fill
                className="object-contain"
                sizes="160px"
                loading="lazy"
                quality={85}
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest bg-white/15 text-white/90 px-2.5 py-1 rounded-full border border-white/10">Flagship</span>
              {therapy.note && (
                <span className="text-[11px] text-white/45 font-medium">{therapy.note}</span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-white">{therapy.name}</h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-md">{therapy.description}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <span className="text-2xl font-display font-bold text-white">${therapy.price?.toFixed(2)}</span>
            {inCart && cartItem ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  In cart ({cartItem.quantity})
                </span>
                <button onClick={handleAdd} className="p-2.5 bg-white text-brand-primary rounded-full hover:bg-white/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-primary font-semibold text-sm rounded-full hover:bg-white/90 transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Non-featured card image — reserved aspect ratio prevents layout shift */}
          <div className="w-full mb-3 -mx-4 -mt-4 -mr-4 rounded-lg overflow-hidden bg-gradient-to-b from-brand-cream to-brand-creamDark flex items-center justify-center py-8 aspect-square">
            {showImage && (
              <Image
                src={therapy.image}
                alt={therapy.name}
                width={200}
                height={200}
                className="object-contain max-w-full h-auto rounded-lg"
                loading="lazy"
                quality={85}
              />
            )}
          </div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-display font-bold text-brand-primary">{therapy.name}</h3>
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-brand-secondary/70 bg-brand-primary/[0.05] px-2 py-0.5 rounded-full">
              {therapy.badge}
            </span>
          </div>

          {therapy.note && (
            <div className="inline-block text-[11px] text-brand-secondary/60 font-medium bg-brand-primary/[0.04] px-2.5 py-0.5 rounded-full mb-2.5 self-start">
              {therapy.note}
            </div>
          )}

          <p className="text-xs text-brand-secondary/70 leading-relaxed mb-4 flex-1">{therapy.description}</p>

          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-brand-primary text-white text-xs leading-relaxed rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-20">
            <p className="font-semibold mb-1">{therapy.name}</p>
            <p className="text-white/80">{therapy.description}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-primary" />
          </div>

          {/* Price */}
          <div className="mb-3">
            {therapy.price !== null ? (
              <span className="text-lg font-display font-bold text-brand-primary">${therapy.price.toFixed(2)}</span>
            ) : (
              <span className="text-xs font-medium text-brand-secondary">{therapy.pricingNote || 'Consultation pricing'}</span>
            )}
          </div>

          {/* Add to Cart */}
          {inCart && cartItem ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-primary/70 flex items-center gap-1">
                <Check className="w-3 h-3" />
                In cart ({cartItem.quantity})
              </span>
              <button onClick={handleAdd} className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primaryHover transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm rounded-full hover:bg-brand-primaryHover transition-colors self-start">
              <Plus className="w-4 h-4" />
              {therapy.price !== null ? 'Add' : 'Request'}
            </button>
          )}
        </>
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
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponError('')
    setCouponApplying(true)
    try {
      const res = await fetch('/api/club/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({ code, discount: data.discount, label: data.label })
        setCouponInput('')
        setCouponError('')
      } else {
        setCouponError('Invalid coupon code.')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Could not validate code.')
    } finally {
      setCouponApplying(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponError('')
  }

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
          items: cart.items.map((item) => ({ therapyId: item.therapyId, name: item.name, price: item.price, pricingNote: item.pricingNote, note: item.note, quantity: item.quantity })),
          notes: notes.trim() || undefined,
          couponCode: appliedCoupon?.code,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit order.'); setSubmitting(false); return }
      cart.clearCart()
      onOrderSubmitted()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { setError('Network error.'); setSubmitting(false) }
  }

  return (
    <div className="bg-white border border-brand-secondary/12 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-display font-bold text-brand-primary mb-1">Your Order</h2>
      <p className="text-[11px] uppercase tracking-widest text-brand-secondary/40 font-medium mb-5">Review &amp; Submit</p>

      {cart.items.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-12 h-12 text-brand-primary/15 mx-auto mb-4" />
          <p className="text-sm text-brand-secondary/50">Add therapies to get started</p>
        </div>
      ) : (
        <>
          {/* Summary Items */}
          <div className="space-y-3 pb-4 border-b border-brand-secondary/10">
            {cart.items.map((item) => {
              const therapy = getAllJoinTherapies().find((t) => t.id === item.therapyId)
              return (
              <div key={item.therapyId} className="flex justify-between text-sm group/cart relative">
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="text-brand-primary/70 truncate cursor-help">{item.name} &times; {item.quantity}</span>
                  <button onClick={() => cart.removeItem(item.therapyId)} className="text-brand-secondary/30 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {therapy && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-brand-primary text-white text-[11px] leading-relaxed rounded-xl shadow-lg opacity-0 pointer-events-none group-hover/cart:opacity-100 transition-opacity duration-200 z-20">
                    <p className="font-semibold mb-0.5">{therapy.name}</p>
                    <p className="text-white/80">{therapy.description}</p>
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-brand-primary" />
                  </div>
                )}
                <span className="text-brand-primary font-semibold shrink-0">
                  {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : 'TBD'}
                </span>
              </div>
              )
            })}
          </div>

          {/* Coupon Code */}
          <div className="pt-4 pb-2">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-medium">{appliedCoupon.code}</span>
                  <span className="text-green-600">— {appliedCoupon.discount}% off</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-green-700 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Coupon code"
                  className="flex-1 min-w-0 px-3 py-2 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40 uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || couponApplying}
                  className="px-4 py-2 bg-brand-primary text-brand-cream text-sm font-medium rounded-xl hover:bg-brand-primaryHover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {couponApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="text-xs text-red-500 mt-1.5 pl-1">{couponError}</p>}
          </div>

          {/* Total */}
          <div className="pt-2 pb-4">
            {appliedCoupon && cart.getCartTotal() > 0 && (() => {
              const discountAmt = Math.round(cart.getCartTotal() * appliedCoupon.discount) / 100
              const discountedTotal = cart.getCartTotal() - discountAmt
              return (
                <div className="space-y-1 mb-1">
                  <div className="flex justify-between text-sm text-brand-secondary/60">
                    <span>Subtotal</span>
                    <span>${cart.getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{appliedCoupon.code} ({appliedCoupon.discount}% off)</span>
                    <span>−${discountAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-brand-secondary/10">
                    <span className="text-brand-secondary/70 text-sm font-medium">Total</span>
                    <span className="text-2xl font-display font-bold text-brand-primary">${discountedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )
            })()}
            {!appliedCoupon && (
              <div className="flex justify-between items-baseline">
                <span className="text-brand-secondary/70 text-sm font-medium">Total</span>
                <span className="text-2xl font-display font-bold text-brand-primary">
                  {cart.getCartTotal() > 0 ? `$${cart.getCartTotal().toFixed(2)}` : 'Quote Request'}
                </span>
              </div>
            )}
            {cart.hasConsultationItems() && (
              <p className="text-xs text-brand-secondary/50 mt-1">
                * Some items require consultation pricing. Final total after review.
              </p>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for your provider (optional)..."
            className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 resize-none text-sm text-brand-primary placeholder:text-brand-secondary/40 mb-4"
            rows={2}
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button onClick={handleSubmitOrder} disabled={submitting || !member}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primaryHover hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Order Request <ArrowRight className="w-4 h-4" /></>}
          </button>

          {/* Trust Signal */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-brand-secondary/40">
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
      <div className="absolute inset-0 bg-brand-primary/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl overflow-y-auto p-6 shadow-2xl border-t border-brand-secondary/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-brand-primary">Your Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-primary/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-brand-secondary/60" />
          </button>
        </div>
        <CartSummaryPanel member={member} onOrderSubmitted={onOrderSubmitted} />
      </div>
    </div>
  )
}
