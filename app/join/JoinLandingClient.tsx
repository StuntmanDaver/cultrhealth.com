'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, Check,
  Loader2, Flame, Zap, Shield, Package, ArrowRight, Tag, AlertTriangle,
} from 'lucide-react'
import { JoinCartProvider, useJoinCart } from '@/lib/contexts/JoinCartContext'
import { JOIN_THERAPY_SECTIONS, getAllJoinTherapies, BUNDLE_DISCOUNT_RATE, getJoinCouponPolicy, type JoinTherapy, type JoinTherapySection } from '@/lib/config/join-therapies'
import { parseCookieJson } from '@/lib/utils'

type StockData = Record<string, { status: string; quantity: number | null }>
import { Carousel, Card, type CarouselCard } from '@/components/ui/apple-cards-carousel'

// =============================================
// VISITOR TRACKING HELPERS
// =============================================

interface VisitorContext {
  sessionId: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  referrerUrl: string
  landingPage: string
  userAgent: string
  screenResolution: string
  deviceType: string
  browser: string
  os: string
  firstVisitAt: string
}

function generateSessionId(): string {
  try {
    const arr = new Uint8Array(12)
    crypto.getRandomValues(arr)
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback for environments without crypto.getRandomValues
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 14)
  }
}

function parseUserAgent(ua: string): { deviceType: string; browser: string; os: string } {
  const isMobile = /iPhone|iPad|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua)
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

  let browser = 'unknown'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera'

  let os = 'unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS X|macOS/i.test(ua)) os = 'macOS'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'

  return { deviceType, browser, os }
}

/** Collect all visitor context on first load. Reads middleware cookie for UTMs + referrer. */
function getVisitorContext(): VisitorContext {
  const SESSION_KEY = 'cultr_visitor_session'

  // Session ID — persist in sessionStorage so it survives page reloads but not tab close
  let sessionId = ''
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY) || ''
    if (!sessionId) {
      sessionId = generateSessionId()
      sessionStorage.setItem(SESSION_KEY, sessionId)
    }
  } catch {
    sessionId = generateSessionId()
  }

  // Read middleware-set cookie for UTM + referrer (first-touch)
  let utmSource = '', utmMedium = '', utmCampaign = '', utmTerm = '', utmContent = '', referrerUrl = '', landingPage = '', firstVisitAt = ''
  try {
    const ctxCookie = document.cookie.split('; ').find((c) => c.startsWith('cultr_visitor_ctx='))
    if (ctxCookie) {
      const data = parseCookieJson<{
        s?: string
        m?: string
        c?: string
        t?: string
        n?: string
        r?: string
        l?: string
        ts?: number
      }>(ctxCookie.substring('cultr_visitor_ctx='.length))

      if (!data) {
        throw new Error('Invalid visitor context cookie')
      }

      utmSource = data.s || ''
      utmMedium = data.m || ''
      utmCampaign = data.c || ''
      utmTerm = data.t || ''
      utmContent = data.n || ''
      referrerUrl = data.r || ''
      landingPage = data.l || ''
      firstVisitAt = data.ts ? new Date(data.ts).toISOString() : ''
    }
  } catch { /* ignore malformed cookie */ }

  // Fallback: read UTM from current URL if cookie wasn't set (e.g., localhost)
  if (!utmSource) {
    try {
      const params = new URLSearchParams(window.location.search)
      utmSource = params.get('utm_source') || ''
      utmMedium = params.get('utm_medium') || ''
      utmCampaign = params.get('utm_campaign') || ''
      utmTerm = params.get('utm_term') || ''
      utmContent = params.get('utm_content') || ''
    } catch { /* ignore */ }
  }
  if (!referrerUrl) {
    try { referrerUrl = document.referrer || '' } catch { /* ignore */ }
  }
  if (!landingPage) {
    try { landingPage = window.location.pathname + window.location.search } catch { /* ignore */ }
  }
  if (!firstVisitAt) {
    firstVisitAt = new Date().toISOString()
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const { deviceType, browser, os } = parseUserAgent(ua)
  const screenResolution = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : ''

  return {
    sessionId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
    referrerUrl, landingPage, userAgent: ua, screenResolution, deviceType, browser, os, firstVisitAt,
  }
}

/** Fire-and-forget server-side event */
function trackVisitorEvent(
  sessionId: string,
  eventType: string,
  eventData?: Record<string, unknown>,
  memberId?: string,
) {
  try {
    fetch('/api/club/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, eventType, eventData, memberId, pageUrl: window.location.pathname }),
      keepalive: true, // survives page unload
    }).catch(() => {})
  } catch { /* ignore */ }
}

// =============================================
// MAIN WRAPPER
// =============================================

interface ServerMember {
  firstName: string
  lastName: string
  email: string
  phone: string
  socialHandle: string
  signupType: string
  age?: number
  gender?: string
  address?: { street: string; city: string; state: string; zip: string }
}

export function JoinLandingClient({ serverMember }: { serverMember?: ServerMember | null }) {
  return (
    <JoinCartProvider>
      <JoinLandingInner serverMember={serverMember ?? null} />
    </JoinCartProvider>
  )
}

// =============================================
// INNER
// =============================================

interface ClubMember {
  firstName: string
  lastName: string
  email: string
  phone: string
  socialHandle: string
  signupType: 'creator' | 'membership' | 'products'
  gender?: 'male' | 'female'
  age?: number
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

interface ClubMemberSession {
  email: string
  firstName?: string
  lastName?: string
  signupType?: ClubMember['signupType']
}

const CLUB_MEMBER_STORAGE_KEY = 'cultr_club_member'

function toClubMemberSession(member: Pick<ClubMember, 'email' | 'firstName' | 'lastName' | 'signupType'>): ClubMemberSession {
  return {
    email: member.email.trim().toLowerCase(),
    firstName: member.firstName,
    lastName: member.lastName,
    signupType: member.signupType,
  }
}

function readStoredClubMemberSession(): ClubMemberSession | null {
  const raw = localStorage.getItem(CLUB_MEMBER_STORAGE_KEY)
  if (!raw) return null

  try {
    const data = JSON.parse(raw) as Partial<ClubMemberSession>
    if (!data?.email || typeof data.email !== 'string') {
      localStorage.removeItem(CLUB_MEMBER_STORAGE_KEY)
      return null
    }

    return {
      email: data.email.trim().toLowerCase(),
      firstName: typeof data.firstName === 'string' ? data.firstName : undefined,
      lastName: typeof data.lastName === 'string' ? data.lastName : undefined,
      signupType: data.signupType === 'creator' || data.signupType === 'membership' || data.signupType === 'products'
        ? data.signupType
        : undefined,
    }
  } catch {
    localStorage.removeItem(CLUB_MEMBER_STORAGE_KEY)
    return null
  }
}

function writeStoredClubMemberSession(member: Pick<ClubMember, 'email' | 'firstName' | 'lastName' | 'signupType'>) {
  localStorage.setItem(CLUB_MEMBER_STORAGE_KEY, JSON.stringify(toClubMemberSession(member)))
}

const SECTION_ICONS = [Flame, Zap] as const

function JoinLandingInner({ serverMember }: { serverMember: ServerMember | null }) {
  const [member, setMember] = useState<ClubMember | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [memberCheckDone, setMemberCheckDone] = useState(!!serverMember) // Skip loading if server already resolved
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [stockData, setStockData] = useState<StockData>({})
  const cart = useJoinCart()
  const hasItems = cart.getItemCount() > 0
  const visitorCtxRef = useRef<VisitorContext | null>(null)
  const memberIdRef = useRef<string | null>(null)

  // Capture visitor context on mount and fire page_view event
  useEffect(() => {
    const ctx = getVisitorContext()
    visitorCtxRef.current = ctx
    trackVisitorEvent(ctx.sessionId, 'page_view', {
      landingPage: ctx.landingPage,
      utmSource: ctx.utmSource,
      utmMedium: ctx.utmMedium,
      utmCampaign: ctx.utmCampaign,
      referrerUrl: ctx.referrerUrl,
      deviceType: ctx.deviceType,
      browser: ctx.browser,
      os: ctx.os,
      screenResolution: ctx.screenResolution,
    })
  }, [])

  // Fetch live stock data from DB — cache-bust to ensure admin changes reflect immediately
  useEffect(() => {
    fetch(`/api/stock?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : { stock: {} })
      .then((d) => setStockData(d.stock || {}))
      .catch(() => {})
  }, [])


  useEffect(() => {
    // --- Priority 1: Server-side DB-verified member (cookie was present + DB confirmed) ---
    if (serverMember) {
      const memberData: ClubMember = {
        firstName: serverMember.firstName,
        lastName: serverMember.lastName,
        email: serverMember.email,
        phone: serverMember.phone,
        socialHandle: serverMember.socialHandle || '',
        signupType: (serverMember.signupType as ClubMember['signupType']) || 'products',
        gender: serverMember.gender as ClubMember['gender'] || undefined,
        age: serverMember.age || undefined,
        address: serverMember.address,
      }
      setMember(memberData)
      setShowSignup(false)
      setMemberCheckDone(true)
      // Persist only minimal client-side session data; full profile re-hydrates from the server.
      try { writeStoredClubMemberSession(memberData) } catch { /* ignore */ }
      return
    }

    try {
      // --- Priority 2: Localhost dev bypass ---
      if (window.location.hostname === 'localhost') {
        setMember({ firstName: 'Dev', lastName: 'User', email: 'dev@test.com', phone: '555-0000', socialHandle: '', signupType: 'products', gender: 'male', age: 30 })
        setShowSignup(false)
        setMemberCheckDone(true)
        return
      }

      // --- Priority 3: Minimal client-side session hint ---
      const storedSession = readStoredClubMemberSession()
      if (storedSession?.email) {
        setLoginEmail(storedSession.email)
      }

      // --- Priority 4: Previous order flag ---
      // Preserve this signal, but only use it if the server cannot recover
      // the member from the existing cookie/session.
      const hasOrdered = !!localStorage.getItem('cultr_club_has_ordered')

      // --- Priority 5: Server-side fallback API check ---
      // The signed cookie is sent automatically; ask the server to verify it
      // and hydrate the full member profile from the database.
      fetch('/api/club/check-member', { credentials: 'include' })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.member?.firstName && data?.member?.email && data?.member?.phone) {
            const m: ClubMember = {
              firstName: data.member.firstName,
              lastName: data.member.lastName || '',
              email: data.member.email,
              phone: data.member.phone,
              socialHandle: data.member.socialHandle || '',
              signupType: data.member.signupType || 'products',
              gender: data.member.gender || undefined,
              age: data.member.age || undefined,
              address: data.member.address,
            }
            setMember(m)
            setShowSignup(false)
            setShowLogin(false)
            setLoginEmail('')
            try { writeStoredClubMemberSession(m) } catch { /* ignore */ }
          } else {
            if (hasOrdered || storedSession?.email) {
              setShowSignup(false)
              setLoginEmail(storedSession?.email || '')
              setShowLogin(true)
            } else {
              // Truly a new visitor — no record anywhere
              setShowLogin(false)
              setShowSignup(true)
            }
          }
        })
        .catch(() => {
          if (hasOrdered || storedSession?.email) {
            setShowSignup(false)
            setLoginEmail(storedSession?.email || '')
            setShowLogin(true)
          } else {
            // Network error on fallback — show signup
            setShowLogin(false)
            setShowSignup(true)
          }
        })
        .finally(() => {
          setMemberCheckDone(true)
        })
    } catch {
      // Error reading storage — show signup for new users
      setShowSignup(true)
      setMemberCheckDone(true)
    }
  }, [serverMember])

  const handleSignupComplete = useCallback((data: ClubMember) => {
    writeStoredClubMemberSession(data)
    setMember(data)
    setShowSignup(false)
    setShowLogin(false)
  }, [])

  const handleExistingMemberDetected = useCallback((email: string) => {
    setLoginEmail(email)
    setShowSignup(false)
    setShowLogin(true)
  }, [])

  useEffect(() => {
    if (showSignup || showLogin || showMobileCart) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showSignup, showLogin, showMobileCart])

  const handleOrderSubmitted = useCallback(() => {
    setOrderSubmitted(true)
    setShowMobileCart(false)
    // Keep member data — don't force re-auth on next visit
    localStorage.setItem('cultr_club_has_ordered', '1')
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(CLUB_MEMBER_STORAGE_KEY)
    // Clear cookie with and without domain to cover both production and local
    document.cookie = 'cultr_club_visitor=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'cultr_club_visitor=; path=/; max-age=0; SameSite=Lax; domain=.cultrhealth.com'
    setMember(null)
    setLoginEmail('')
    setShowSignup(true)
    setOrderSubmitted(false)
    cart.clearCart()
  }, [cart])

  // While checking member status (Priority 6 async fetch), show a brief loading overlay
  // to prevent bare-page flash where neither signup nor content is visible
  if (!memberCheckDone && !member && !showSignup && !showLogin) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-cream items-center justify-center">
        <div className="flex flex-col items-end leading-none animate-pulse">
          <span className="font-display font-bold text-3xl uppercase text-brand-primary">CULTR</span>
          <span className="font-display font-medium text-[10px] tracking-[0.14em] uppercase text-brand-primary/40 -mt-0.5">Health</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream overflow-x-hidden">
      {/* Login Modal for Returning Members */}
      {showLogin && !member && (
        <LoginModal
          initialEmail={loginEmail}
          onComplete={handleSignupComplete}
          onSignUpInstead={() => {
            setLoginEmail('')
            setShowLogin(false)
            setShowSignup(true)
          }}
        />
      )}

      {/* Signup Modal */}
      {showSignup && !member && (
        <SignupModal
          onComplete={handleSignupComplete}
          onExistingMemberDetected={handleExistingMemberDetected}
          visitorCtxRef={visitorCtxRef}
          memberIdRef={memberIdRef}
        />
      )}

      {/* Order Success Banner */}
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

      {/* Hero Banner — tighter aspect for mobile so carousel is visible above fold */}
      <section className="relative aspect-[16/9] md:aspect-[3/1] overflow-hidden">
        <img
          src="/images/hero-cultr-join.png"
          alt="CULTR — Diverse women in athletic wear"
          className="w-full h-full object-cover object-[center_30%]"
        />
        {/* Gradient fade into slogan bar */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-primary/70 to-transparent pointer-events-none" />
      </section>

      {/* Slogan banner */}
      <section className="bg-brand-primary px-6 py-6 md:py-8 text-center">
        <h1 className="font-body text-xl md:text-4xl lg:text-5xl text-white font-bold tracking-tight leading-tight">
          Change the <span className="font-display">CULTR</span>.<br />
          <span className="italic text-sage">rebrand</span> yourself.
        </h1>
        <p className="mt-2 text-[11px] md:text-sm text-white/50 max-w-2xl mx-auto">
          HIPAA-compliant telehealth for physician-supervised GLP-1 therapies, wellness peptides &amp; longevity optimization.
        </p>
      </section>

      {/* Trust Strip */}
      <section className="bg-brand-primary border-t border-white/[0.07] px-4 py-2.5 sm:py-3">
        <div className="max-w-4xl mx-auto">

          {/* Mobile: clean vertical stack */}
          <div className="flex flex-col items-center gap-1.5 sm:hidden">
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 text-sage shrink-0" />
              <span className="text-[10.5px] text-white/70 font-medium tracking-wide leading-none">Pharmaceutical-Grade APIs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 text-sage shrink-0" />
              <span className="text-[10.5px] text-white/70 font-medium tracking-wide leading-none">Green-listed · Third-party tested</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3 text-sage shrink-0" />
              <span className="text-[10.5px] text-white/70 font-medium tracking-wide leading-none">Made in the USA</span>
            </div>
          </div>

          {/* Desktop: horizontal row with dividers */}
          <div className="hidden sm:flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sage shrink-0" />
              <span className="text-xs text-white/75 font-medium tracking-wide">Pharmaceutical-Grade APIs</span>
            </div>
            <span className="text-white/20 select-none">|</span>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sage shrink-0" />
              <span className="text-xs text-white/75 font-medium tracking-wide">Green-listed sourcing · Third-party tested</span>
            </div>
            <span className="text-white/20 select-none">|</span>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sage shrink-0" />
              <span className="text-xs text-white/75 font-medium tracking-wide">Made in the USA</span>
            </div>
          </div>

        </div>
      </section>

      {/* Welcome + Browse */}
      <section className="px-6 py-5 md:px-8 md:py-8 bg-brand-cream border-b border-brand-secondary/8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-brand-secondary/50 font-semibold mb-1">
            Browse &amp; Build Your Stack
          </p>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-brand-primary mb-1">
            Therapies
          </h2>
          <p className="text-sm md:text-base text-brand-secondary/60">
            Tap a card to learn more. Add therapies and submit your order for <span className="font-display">CULTR</span> team review.
          </p>
          {member && (
            <p className="mt-2 text-sm text-brand-secondary/50 font-medium">
              Welcome, {member.firstName}
              <span className="mx-2">&middot;</span>
              <button
                onClick={handleLogout}
                className="text-brand-secondary/40 hover:text-red-500 transition-colors underline underline-offset-2"
              >
                Log out
              </button>
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 pb-32 lg:pb-12">
        <div className="max-w-7xl mx-auto md:px-6 py-4 md:py-10">
          <div className={`grid gap-4 md:gap-10 ${hasItems ? 'lg:grid-cols-5' : ''}`}>

            {/* Left Column — Therapy Carousels (full-width when cart empty, 3/5 when cart open) */}
            <div className={hasItems ? 'lg:col-span-3' : ''}>
              {JOIN_THERAPY_SECTIONS.map((section, sectionIdx) => {
                const Icon = SECTION_ICONS[sectionIdx] || Flame
                return (
                  <TherapyCarouselSection key={section.title} section={section} Icon={Icon} stockData={stockData} cartOpen={hasItems} onAddToCart={(therapyId: string, therapyName: string, price: number | null) => {
                    const ctx = visitorCtxRef.current
                    if (ctx) trackVisitorEvent(ctx.sessionId, 'add_to_cart', { therapyId, therapyName, price }, memberIdRef.current || undefined)
                  }} />
                )
              })}

              {/* Medical Disclaimer */}
              <div className="flex items-start gap-3 px-4 md:px-6 py-6 border-t border-brand-secondary/10">
                <Shield className="w-5 h-5 text-brand-secondary/60 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-secondary/70 leading-relaxed">
                  <span className="font-semibold text-brand-primary">Medical Disclaimer:</span>{' '}
                  All therapies listed require physician evaluation and prescription.{' '}
                  <span className="font-display font-bold">CULTR</span> Health does not guarantee specific results. Outcomes vary by
                  individual. If you have a medical emergency, call 911.
                </p>
              </div>
            </div>

            {/* Right Column — Only visible on desktop when cart has items */}
            {hasItems && (
              <div className="lg:col-span-2 hidden lg:block animate-fade-in">
                <div className="sticky top-8">
                  <CartSummaryPanel member={member} onOrderSubmitted={handleOrderSubmitted} stockData={stockData} onTrackEvent={(eventType: string, eventData?: Record<string, unknown>) => {
                    const ctx = visitorCtxRef.current
                    if (ctx) trackVisitorEvent(ctx.sessionId, eventType, eventData, memberIdRef.current || undefined)
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Cart Bar — fixed bottom */}
      {cart.getItemCount() > 0 && !showMobileCart && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-brand-primary/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="font-bold text-sm text-white">{cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'} in cart</span>
            </div>
            <span className="bg-white text-brand-primary font-bold text-sm px-4 py-2 rounded-full">
              Checkout
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Full-Screen Overlay */}
      {showMobileCart && (
        <MobileCartOverlay member={member} onClose={() => setShowMobileCart(false)} onOrderSubmitted={handleOrderSubmitted} stockData={stockData} onTrackEvent={(eventType: string, eventData?: Record<string, unknown>) => {
          const ctx = visitorCtxRef.current
          if (ctx) trackVisitorEvent(ctx.sessionId, eventType, eventData, memberIdRef.current || undefined)
        }} />
      )}
    </div>
  )
}

// =============================================
// THERAPY CAROUSEL SECTION
// =============================================

function TherapyCarouselSection({ section, Icon, stockData, cartOpen, onAddToCart }: { section: JoinTherapySection; Icon: typeof Flame; stockData: StockData; cartOpen?: boolean; onAddToCart?: (therapyId: string, therapyName: string, price: number | null) => void }) {
  const cart = useJoinCart()
  const isTwoRow = section.therapies.length > 5

  const buildCard = (therapy: JoinTherapy, index: number, opts?: { compact?: boolean; fluid?: boolean }) => {
    const isCompact = opts?.compact ?? false
    const isFluid = opts?.fluid ?? false
    const inCart = cart.isInCart(therapy.id)
    const cartItem = cart.items.find((i) => i.therapyId === therapy.id)
    const sd = stockData[therapy.id]
    const stockStatus = sd?.status || 'in_stock'
    const maxQty = stockStatus === 'out_of_stock' ? 0 : (sd?.quantity ?? Infinity)
    const currentQty = cartItem?.quantity || 0
    const isOutOfStock = stockStatus === 'out_of_stock'
    const atMaxQty = currentQty >= maxQty
    const disableAdd = isOutOfStock || atMaxQty

    let stockLabel: string | undefined
    if (isOutOfStock) {
      stockLabel = 'Out of Stock'
    } else if (stockStatus === 'low_stock' && sd?.quantity != null) {
      stockLabel = `Only ${sd.quantity} left`
    }

    const handleAdd = () => {
      if (disableAdd) return
      if (inCart && cartItem) {
        cart.updateQuantity(therapy.id, cartItem.quantity + 1)
      } else {
        cart.addItem({ therapyId: therapy.id, name: therapy.name, price: therapy.price, pricingNote: therapy.pricingNote, note: therapy.note })
      }
      onAddToCart?.(therapy.id, therapy.name, therapy.price)
    }

    const handleUpdateQuantity = (qty: number) => {
      cart.updateQuantity(therapy.id, qty)
    }

    const cardData: CarouselCard = {
      src: therapy.image || '',
      secondarySrc: therapy.secondaryImage,
      title: therapy.name,
      category: therapy.category === 'glp1' ? 'GLP-1 Therapy' : 'Enhancement',
      price: therapy.price !== null ? `$${therapy.price % 1 === 0 ? therapy.price.toFixed(0) : therapy.price.toFixed(2)}` : therapy.pricingNote || 'TBD',
      note: therapy.note,
      description: therapy.description,
      badge: therapy.bundleWith ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-white/[0.12] backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Tag className="w-3 h-3" />
          Bundle &amp; save {Math.round(BUNDLE_DISCOUNT_RATE * 100)}%
        </span>
      ) : undefined,
      content: (
        <div className="space-y-4">
          <p className="text-[15px] md:text-base text-brand-secondary/80 leading-relaxed">
            {therapy.description}
          </p>
          {therapy.bundleWith && (() => {
            const partner = getAllJoinTherapies().find(t => t.id === therapy.bundleWith)
            return partner ? (
              <div className="flex items-center gap-2 bg-sage/20 border border-sage/30 rounded-xl px-4 py-3">
                <Tag className="w-4 h-4 text-forest shrink-0" />
                <span className="text-sm text-forest font-medium">
                  Save {Math.round(BUNDLE_DISCOUNT_RATE * 100)}% when bundled with {partner.name}
                </span>
              </div>
            ) : null
          })()}
        </div>
      ),
    }

    return (
      <Card
        key={therapy.id}
        card={cardData}
        index={index}
        onAdd={handleAdd}
        onUpdateQuantity={handleUpdateQuantity}
        inCart={inCart}
        cartQty={cartItem?.quantity}
        compact={isCompact}
        fluid={isFluid}
        stockLabel={stockLabel}
        disableAdd={disableAdd}
        maxDropdownQty={Math.max(cartItem?.quantity || 1, Math.min(10, maxQty))}
      />
    )
  }

  const mid = Math.ceil(section.therapies.length / 2)
  const mobileCards = section.therapies.map((t, i) => buildCard(t, i, { compact: isTwoRow }))
  const desktopCards = section.therapies.map((t, i) => buildCard(t, i, { compact: false, fluid: true }))

  return (
    <div className="py-2 md:py-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 md:px-6 mb-1">
        <div className="w-7 h-7 rounded-lg bg-brand-primary/[0.06] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-primary" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-display font-bold text-brand-primary leading-tight">
            {section.title}
          </h2>
          <p className="text-[11px] md:text-xs text-brand-secondary/40">{section.subtitle}</p>
        </div>
      </div>

      {/* Mobile: swipe carousel */}
      <div className="md:hidden">
        {isTwoRow ? (
          <>
            <Carousel items={mobileCards.slice(0, mid)} />
            <Carousel items={mobileCards.slice(mid)} />
          </>
        ) : (
          <Carousel items={mobileCards} />
        )}
      </div>

      {/* Desktop: grid expands to 4 cols when cart is hidden, 3 cols when cart is open */}
      <div className={`hidden md:grid gap-4 px-6 py-4 ${cartOpen ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
        {desktopCards}
      </div>
    </div>
  )
}


// =============================================
// SIGNUP MODAL
// =============================================

function SignupModal({ onComplete, onExistingMemberDetected, visitorCtxRef, memberIdRef }: { onComplete: (data: ClubMember) => void; onExistingMemberDetected: (email: string) => void; visitorCtxRef: React.MutableRefObject<VisitorContext | null>; memberIdRef: React.MutableRefObject<string | null> }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [signupType, setSignupType] = useState<'creator' | 'membership' | 'products' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)

  // When user tabs out of email field, check if they're already a member.
  // The API only returns firstName (no PII) for unauthenticated email lookups.
  // Existing members should authenticate instead of filling the signup form again.
  async function handleEmailBlur() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@') || emailChecked) return
    setEmailChecked(true)
    try {
      const res = await fetch(`/api/club/check-member?email=${encodeURIComponent(trimmed)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.member?.exists) {
        onExistingMemberDetected(trimmed)
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('First name, last name, email, and phone are required.')
      return
    }
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError('Full address is required.')
      return
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 120) {
      setError('Please enter a valid age (18+).')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    if (!signupType) {
      setError('Please select what you\'re interested in.')
      return
    }
    setLoading(true)
    const address = { street: street.trim(), city: city.trim(), state: state.trim(), zip: zip.trim() }
    const ctx = visitorCtxRef.current
    try {
      const res = await fetch('/api/club/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          socialHandle: socialHandle.trim(),
          age: Number(age),
          gender,
          signupType,
          address,
          // Visitor tracking context
          visitorContext: ctx ? {
            sessionId: ctx.sessionId,
            utmSource: ctx.utmSource,
            utmMedium: ctx.utmMedium,
            utmCampaign: ctx.utmCampaign,
            utmTerm: ctx.utmTerm,
            utmContent: ctx.utmContent,
            referrerUrl: ctx.referrerUrl,
            landingPage: ctx.landingPage,
            userAgent: ctx.userAgent,
            screenResolution: ctx.screenResolution,
            deviceType: ctx.deviceType,
            browser: ctx.browser,
            os: ctx.os,
            firstVisitAt: ctx.firstVisitAt,
          } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      // Store memberId for subsequent event tracking
      if (data.memberId) memberIdRef.current = data.memberId
      // Fire signup event
      if (ctx) trackVisitorEvent(ctx.sessionId, 'signup', { signupType }, data.memberId)
      onComplete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        socialHandle: socialHandle.trim(),
        age: Number(age),
        gender,
        signupType,
        address,
      })
    } catch { setError('Network error.'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto" style={{ background: 'rgba(42,69,66,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md border border-brand-secondary/10 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Logo */}
        <div className="pt-8 pb-4 sm:pt-10 sm:pb-5 grad-dark-glow flex flex-col items-center justify-center relative overflow-hidden sticky top-0 z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #FCFBF7 0%, transparent 70%)' }} />
          <div className="flex flex-col items-end leading-none relative z-10">
            <span className="font-display font-bold text-2xl uppercase text-white">CULTR</span>
            <span className="font-display font-medium text-[8px] tracking-[0.14em] uppercase text-white/40 -mt-0.5">Health</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
          <h2 className="font-display text-xl font-bold text-brand-primary text-center mb-1">
            Join CULTR Club
          </h2>
          <p className="text-brand-secondary/60 text-sm text-center mb-5">
            Browse therapies & build your order
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            </div>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailChecked(false) }} onBlur={handleEmailBlur} placeholder="Email" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street Address" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" required maxLength={2} className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40 uppercase" />
              <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            </div>
            <input type="text" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} placeholder="@social handle (optional)" className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-brand-primary/70 mb-1.5">Age</p>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  min={18}
                  max={120}
                  className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-brand-primary/70 mb-1.5">Gender</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      gender === 'male'
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-brand-cream text-brand-primary/70 border-brand-secondary/12 hover:border-brand-primary/30'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      gender === 'female'
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-brand-cream text-brand-primary/70 border-brand-secondary/12 hover:border-brand-primary/30'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Interest Selector */}
            <div className="pt-1">
              <p className="text-xs font-medium text-brand-primary/70 mb-2">I&apos;m interested in:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSignupType('creator')}
                  className={`px-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    signupType === 'creator'
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-brand-cream text-brand-primary/70 border-brand-secondary/12 hover:border-brand-primary/30'
                  }`}
                >
                  Creator
                </button>
                <button
                  type="button"
                  onClick={() => setSignupType('membership')}
                  className={`px-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    signupType === 'membership'
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-brand-cream text-brand-primary/70 border-brand-secondary/12 hover:border-brand-primary/30'
                  }`}
                >
                  Membership
                </button>
                <button
                  type="button"
                  onClick={() => setSignupType('products')}
                  className={`px-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    signupType === 'products'
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-brand-cream text-brand-primary/70 border-brand-secondary/12 hover:border-brand-primary/30'
                  }`}
                >
                  Products
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 mt-5 px-6 py-3.5 bg-brand-primary text-white font-medium rounded-full hover:bg-brand-primaryHover transition-colors disabled:opacity-50 shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Free &amp; Start Shopping <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  )
}

// =============================================
// LOGIN MODAL
// =============================================

function LoginModal({ initialEmail = '', onComplete, onSignUpInstead }: { initialEmail?: string; onComplete: (data: ClubMember) => void; onSignUpInstead: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !phone.trim()) { setError('Email and phone number are required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/club/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Authentication failed.')
        setLoading(false)
        return
      }
      localStorage.removeItem('cultr_club_has_ordered')
      onComplete(data)
    } catch {
      setError('Network error.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(42,69,66,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-secondary/10">
        <div className="pt-10 pb-5 grad-dark-glow flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #FCFBF7 0%, transparent 70%)' }} />
          <div className="flex flex-col items-end leading-none relative z-10">
            <span className="font-display font-bold text-2xl uppercase text-white">CULTR</span>
            <span className="font-display font-medium text-[8px] tracking-[0.14em] uppercase text-white/40 -mt-0.5">Health</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 pt-7">
          <h2 className="font-display text-xl font-bold text-brand-primary text-center mb-1">
            Welcome Back
          </h2>
          <p className="text-brand-secondary/60 text-sm text-center mb-6">
            Re-authenticate to continue
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" required className="w-full px-4 py-3 bg-brand-cream border border-brand-secondary/12 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-sm text-brand-primary placeholder:text-brand-secondary/40" />
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3.5 bg-brand-primary text-white font-medium rounded-full hover:bg-brand-primaryHover transition-colors disabled:opacity-50 shadow-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4" /></>}
          </button>

          <button type="button" onClick={onSignUpInstead} className="w-full mt-3 px-6 py-3 text-brand-primary font-medium hover:bg-brand-primary/5 transition-colors rounded-full">
            Create New Account
          </button>
        </form>
      </div>
    </div>
  )
}

// =============================================
// CART SUMMARY PANEL
// =============================================

function CartSummaryPanel({ member, onOrderSubmitted, onTrackEvent, stockData }: { member: ClubMember | null; onOrderSubmitted: () => void; onTrackEvent?: (eventType: string, eventData?: Record<string, unknown>) => void; stockData?: StockData }) {
  const cart = useJoinCart()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string; isCreatorCode?: boolean; noBundleStack?: boolean; creatorName?: string; creatorId?: string } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  const isBacWaterOnly = cart.items.length > 0 && cart.items.every(i => i.therapyId === 'bacteriostatic-water')
  const bacWaterQty = cart.items.find(i => i.therapyId === 'bacteriostatic-water')?.quantity ?? 0
  const bacWaterStock = stockData?.['bacteriostatic-water']
  const bacWaterMaxQty = bacWaterStock?.status === 'out_of_stock' ? 0 : (bacWaterStock?.quantity ?? Infinity)
  const bacWaterUpgradeQty = Math.min(4, bacWaterMaxQty)
  const showShippingWarning = isBacWaterOnly && bacWaterQty < 4 && bacWaterQty < bacWaterMaxQty
  const joinCouponPolicy = getJoinCouponPolicy(cart.items)

  useEffect(() => {
    if (appliedCoupon && !joinCouponPolicy.couponAllowed) {
      setAppliedCoupon(null)
      setCouponError(joinCouponPolicy.couponError || 'Coupon is no longer valid for this cart.')
    }
  }, [appliedCoupon, joinCouponPolicy.couponAllowed, joinCouponPolicy.couponError])

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    if (!joinCouponPolicy.couponAllowed) {
      setAppliedCoupon(null)
      setCouponError(joinCouponPolicy.couponError || 'Coupon is not valid for this cart.')
      return
    }
    setCouponError('')
    setCouponApplying(true)
    try {
      const res = await fetch('/api/club/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: cart.items.map((item) => ({
            therapyId: item.therapyId,
            quantity: item.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({ code, discount: data.discount, label: data.label, isCreatorCode: data.isCreatorCode, noBundleStack: data.noBundleStack, creatorName: data.creatorName, creatorId: data.creatorId })
        setCouponInput('')
        setCouponError('')
        onTrackEvent?.('apply_coupon', { code, discount: data.discount, isCreatorCode: data.isCreatorCode, creatorName: data.creatorName })
      } else {
        setCouponError(data.error || 'Invalid coupon code.')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Could not validate code.')
    } finally {
      setCouponApplying(false)
    }
  }

  function handleRemoveCoupon() {
    if (appliedCoupon) onTrackEvent?.('remove_coupon', { code: appliedCoupon.code })
    setAppliedCoupon(null)
    setCouponError('')
  }

  async function handleSubmitOrder() {
    if (!member || cart.items.length === 0) return
    setError('')
    setSubmitting(true)
    if (appliedCoupon && !joinCouponPolicy.couponAllowed) {
      setAppliedCoupon(null)
      setError(joinCouponPolicy.couponError || 'Coupon is no longer valid for this cart.')
      setSubmitting(false)
      return
    }
    const cartItems = cart.items.map((item) => ({ therapyId: item.therapyId, name: item.name, price: item.price, pricingNote: item.pricingNote, note: item.note, quantity: item.quantity }))
    // Track begin_checkout
    onTrackEvent?.('begin_checkout', { itemCount: cartItems.length, items: cartItems.map((i) => i.name), couponCode: appliedCoupon?.code || null })
    try {
      const res = await fetch('/api/club/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email, name: `${member.firstName} ${member.lastName}`, phone: member.phone,
          address: member.address,
          items: cartItems,
          notes: notes.trim() || undefined,
          couponCode: appliedCoupon?.code,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit order.'); setSubmitting(false); return }
      // Track order_submitted
      onTrackEvent?.('order_submitted', { orderNumber: data.orderNumber, itemCount: cartItems.length, items: cartItems.map((i) => i.name), couponCode: appliedCoupon?.code || null })
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
              const isBundleActive = therapy?.bundleWith && cart.isInCart(therapy.bundleWith)
              return (
              <div key={item.therapyId} className="flex justify-between text-sm group/cart relative">
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="text-brand-primary/70 truncate cursor-help">{item.name} &times; {item.quantity}</span>
                  {isBundleActive && (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">Bundle</span>
                  )}
                  <button onClick={() => { cart.removeItem(item.therapyId); onTrackEvent?.('remove_from_cart', { therapyId: item.therapyId, therapyName: item.name }) }} className="text-brand-secondary/30 hover:text-red-500 transition-colors shrink-0">
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
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-medium">{appliedCoupon.code}</span>
                    <span className="text-green-600">&mdash; {appliedCoupon.discount}% off</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-green-700 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {appliedCoupon.isCreatorCode && appliedCoupon.creatorName && (
                  <p className="text-xs text-green-600 mt-1 pl-5">Referred by {appliedCoupon.creatorName}</p>
                )}
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
            {(() => {
              const rawSubtotal = cart.getCartTotal()
              const bundleDisc = (appliedCoupon?.code === 'OWNER' || appliedCoupon?.noBundleStack || joinCouponPolicy.forceNoBundleStack) ? 0 : cart.getBundleDiscount()
              const subtotalAfterBundle = rawSubtotal - bundleDisc
              const couponAmt = appliedCoupon && subtotalAfterBundle > 0
                ? Math.round(subtotalAfterBundle * appliedCoupon.discount) / 100
                : 0
              const afterCoupon = subtotalAfterBundle - couponAmt
              const taxAmt = afterCoupon > 0 ? Math.round(afterCoupon * 0.075 * 100) / 100 : 0
              const finalTotal = afterCoupon + taxAmt

              return rawSubtotal > 0 ? (
                <div className="space-y-1 mb-1">
                  <div className="flex justify-between text-sm text-brand-secondary/60">
                    <span>Subtotal</span>
                    <span>${rawSubtotal.toFixed(2)}</span>
                  </div>
                  {bundleDisc > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bundle Discount ({Math.round(BUNDLE_DISCOUNT_RATE * 100)}%)</span>
                      <span>&minus;${bundleDisc.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedCoupon && couponAmt > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{appliedCoupon.code} ({appliedCoupon.discount}% off)</span>
                      <span>&minus;${couponAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-brand-secondary/60">
                    <span>Sales Tax (7.5%)</span>
                    <span>${taxAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-brand-secondary/10">
                    <span className="text-brand-secondary/70 text-sm font-medium">Total</span>
                    <span className="text-2xl font-display font-bold text-brand-primary">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-baseline pt-1 border-t border-brand-secondary/10">
                  <span className="text-brand-secondary/70 text-sm font-medium">Total</span>
                  <span className="text-2xl font-display font-bold text-brand-primary">Quote Request</span>
                </div>
              )
            })()}
            {cart.hasConsultationItems() && (
              <p className="text-xs text-brand-secondary/50 mt-1">
                * Some items require consultation pricing. Final total after review.
              </p>
            )}
          </div>

          {/* Bac Water Shipping Warning */}
          {showShippingWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-amber-800 font-medium text-sm">Shipping: ~$15</p>
                  {bacWaterUpgradeQty >= 4 ? (
                    <>
                      <p className="text-amber-700/80 text-xs leading-relaxed mt-0.5">
                        Get 4x Bac Water ($119.96) for <span className="font-semibold">free shipping</span>.
                      </p>
                      <button
                        onClick={() => cart.updateQuantity('bacteriostatic-water', 4)}
                        className="mt-2 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Upgrade to 4x Bac Water
                      </button>
                    </>
                  ) : (
                    <p className="text-amber-700/80 text-xs leading-relaxed mt-0.5">
                      Only {bacWaterMaxQty} Bac Water available — free shipping requires 4+.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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

function MobileCartOverlay({ member, onClose, onOrderSubmitted, onTrackEvent, stockData }: { member: ClubMember | null; onClose: () => void; onOrderSubmitted: () => void; onTrackEvent?: (eventType: string, eventData?: Record<string, unknown>) => void; stockData?: StockData }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-brand-primary/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl overflow-y-auto p-6 shadow-2xl border-t border-brand-secondary/10" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-brand-primary">Your Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-primary/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-brand-secondary/60" />
          </button>
        </div>
        <CartSummaryPanel member={member} onOrderSubmitted={onOrderSubmitted} onTrackEvent={onTrackEvent} stockData={stockData} />
      </div>
    </div>
  )
}
