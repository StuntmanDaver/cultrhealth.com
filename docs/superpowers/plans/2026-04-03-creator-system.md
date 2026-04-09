# Creator/Affiliate System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a creator/affiliate system with referral tracking, commission calculation, creator dashboard, and admin dashboard. Seed Cole Sidner as the first creator.

**Architecture:** 4 new DB tables (creators, creator_clicks, creator_referrals, creator_commissions). Middleware captures `?ref=` params into cookies. Stripe webhook attributes checkouts to creators and tracks recurring commissions. Separate magic-link auth flows for creators and admins, each with their own cookie/JWT. Creator dashboard shows their stats; admin dashboard manages all creators.

**Tech Stack:** Next.js 14 App Router, @vercel/postgres (sql tagged templates), Stripe SDK, jose (JWT), Resend (email), Tailwind CSS with CULTR design tokens.

**Spec:** `docs/superpowers/specs/2026-04-03-creator-system-design.md`

---

## File Structure

```
NEW FILES:
  lib/creator-auth.ts              — Creator JWT/session management
  lib/admin-auth.ts                — Admin JWT/session management
  lib/creators/db.ts               — All creator DB queries
  lib/creators/commission.ts       — Commission calculation
  lib/creators/attribution.ts      — Attribution logic (ref + promo code)
  middleware.ts                     — Ref cookie capture + click tracking trigger

  app/api/creators/auth/magic-link/route.ts
  app/api/creators/auth/verify/route.ts
  app/api/creators/auth/logout/route.ts
  app/api/creators/dashboard/route.ts
  app/api/creators/track-click/route.ts

  app/api/admin/auth/magic-link/route.ts
  app/api/admin/auth/verify/route.ts
  app/api/admin/auth/logout/route.ts
  app/api/admin/creators/route.ts
  app/api/admin/creators/[id]/route.ts
  app/api/admin/creators/[id]/commissions/route.ts
  app/api/admin/creators/[id]/commissions/approve/route.ts
  app/api/admin/creators/[id]/commissions/mark-paid/route.ts

  app/creators/login/page.tsx
  app/creators/dashboard/page.tsx
  app/creators/dashboard/layout.tsx
  components/creators/CreatorLoginForm.tsx
  components/creators/CreatorDashboardOverview.tsx
  components/creators/CreatorReferralsTable.tsx
  components/creators/CreatorCommissionsTable.tsx
  components/creators/CreatorPromoTools.tsx

  app/admin/login/page.tsx
  app/admin/layout.tsx
  app/admin/creators/page.tsx
  app/admin/creators/new/page.tsx
  app/admin/creators/[id]/page.tsx
  components/admin/AdminLayout.tsx
  components/admin/AdminCreatorsList.tsx
  components/admin/AdminCreatorDetail.tsx
  components/admin/AdminAddCreatorForm.tsx
  components/admin/AdminCommissionManager.tsx

MODIFIED FILES:
  app/api/checkout/route.ts        — Add ref/creator_ref to Stripe metadata
  app/api/webhook/stripe/route.ts  — Attribution on checkout + recurring commissions
  app/join/[tier]/page.tsx         — Read ref cookie, pass to checkout
  lib/db.ts                        — Add creator types export
```

---

## Task 1: Database Schema — Creator Tables

**Files:**
- Create: `lib/creators/db.ts`

This task creates all 4 tables and seeds Cole Sidner.

- [ ] **Step 1: Create the DB module with table creation and types**

Create `lib/creators/db.ts`:

```typescript
import { sql } from '@vercel/postgres'

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface Creator {
  id: string
  name: string
  email: string
  coupon_code: string
  stripe_coupon_id: string | null
  stripe_promo_code_id: string | null
  customer_discount_pct: number
  commission_rate: number // basis points (2000 = 20%)
  referral_slug: string
  status: 'active' | 'paused' | 'inactive'
  created_at: Date
  updated_at: Date
}

export interface CreatorClick {
  id: string
  creator_id: string
  landing_page: string | null
  ip_hash: string | null
  user_agent: string | null
  converted: boolean
  created_at: Date
}

export interface CreatorReferral {
  id: string
  creator_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  customer_email: string | null
  attribution_method: 'promo_code' | 'referral_link'
  plan_tier: string
  plan_amount_cents: number
  discount_amount_cents: number
  created_at: Date
}

export interface CreatorCommission {
  id: string
  creator_id: string
  referral_id: string
  stripe_invoice_id: string | null
  gross_amount_cents: number
  commission_rate: number // basis points
  commission_amount_cents: number
  status: 'pending' | 'approved' | 'paid'
  created_at: Date
  updated_at: Date
}

export interface CreatorStats {
  total_referrals: number
  total_clicks: number
  total_earnings_cents: number
  pending_earnings_cents: number
  month_referrals: number
  month_earnings_cents: number
  conversion_rate: number
}

// ===========================================
// TABLE CREATION / MIGRATION
// ===========================================

export async function createCreatorTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS creators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      coupon_code TEXT NOT NULL UNIQUE,
      stripe_coupon_id TEXT,
      stripe_promo_code_id TEXT,
      customer_discount_pct INTEGER NOT NULL DEFAULT 10,
      commission_rate INTEGER NOT NULL DEFAULT 2000,
      referral_slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS creator_clicks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES creators(id),
      landing_page TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      converted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_creator_clicks_creator_id ON creator_clicks(creator_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_creator_clicks_created_at ON creator_clicks(created_at)`

  await sql`
    CREATE TABLE IF NOT EXISTS creator_referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES creators(id),
      stripe_customer_id TEXT NOT NULL,
      stripe_subscription_id TEXT,
      customer_email TEXT,
      attribution_method TEXT NOT NULL CHECK (attribution_method IN ('promo_code', 'referral_link')),
      plan_tier TEXT NOT NULL,
      plan_amount_cents INTEGER NOT NULL,
      discount_amount_cents INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_creator_referrals_creator_id ON creator_referrals(creator_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_creator_referrals_stripe_customer_id ON creator_referrals(stripe_customer_id)`

  await sql`
    CREATE TABLE IF NOT EXISTS creator_commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES creators(id),
      referral_id UUID NOT NULL REFERENCES creator_referrals(id),
      stripe_invoice_id TEXT,
      gross_amount_cents INTEGER NOT NULL,
      commission_rate INTEGER NOT NULL,
      commission_amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_creator_commissions_creator_id ON creator_commissions(creator_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_creator_commissions_status ON creator_commissions(status)`
}

// ===========================================
// CREATOR CRUD
// ===========================================

export async function getCreatorByEmail(email: string): Promise<Creator | null> {
  const result = await sql`
    SELECT * FROM creators WHERE lower(email) = ${email.toLowerCase()}
  `
  return (result.rows[0] as Creator) || null
}

export async function getCreatorBySlug(slug: string): Promise<Creator | null> {
  const result = await sql`
    SELECT * FROM creators WHERE referral_slug = ${slug.toLowerCase()}
  `
  return (result.rows[0] as Creator) || null
}

export async function getCreatorByCouponCode(code: string): Promise<Creator | null> {
  const result = await sql`
    SELECT * FROM creators WHERE upper(coupon_code) = ${code.toUpperCase()}
  `
  return (result.rows[0] as Creator) || null
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  const result = await sql`
    SELECT * FROM creators WHERE id = ${id}
  `
  return (result.rows[0] as Creator) || null
}

export async function getAllCreators(): Promise<Creator[]> {
  const result = await sql`
    SELECT * FROM creators ORDER BY created_at DESC
  `
  return result.rows as Creator[]
}

export async function insertCreator(input: {
  name: string
  email: string
  coupon_code: string
  stripe_coupon_id?: string
  stripe_promo_code_id?: string
  customer_discount_pct: number
  commission_rate: number
  referral_slug: string
}): Promise<Creator> {
  const result = await sql`
    INSERT INTO creators (name, email, coupon_code, stripe_coupon_id, stripe_promo_code_id, customer_discount_pct, commission_rate, referral_slug)
    VALUES (
      ${input.name},
      ${input.email.toLowerCase()},
      ${input.coupon_code.toUpperCase()},
      ${input.stripe_coupon_id || null},
      ${input.stripe_promo_code_id || null},
      ${input.customer_discount_pct},
      ${input.commission_rate},
      ${input.referral_slug.toLowerCase()}
    )
    RETURNING *
  `
  return result.rows[0] as Creator
}

export async function updateCreatorStatus(id: string, status: 'active' | 'paused' | 'inactive'): Promise<boolean> {
  const result = await sql`
    UPDATE creators SET status = ${status}, updated_at = NOW() WHERE id = ${id}
  `
  return (result.rowCount ?? 0) > 0
}

export async function updateCreator(id: string, input: {
  name?: string
  commission_rate?: number
  customer_discount_pct?: number
  stripe_coupon_id?: string
  stripe_promo_code_id?: string
  status?: 'active' | 'paused' | 'inactive'
}): Promise<boolean> {
  const result = await sql`
    UPDATE creators SET
      name = COALESCE(${input.name || null}, name),
      commission_rate = COALESCE(${input.commission_rate ?? null}, commission_rate),
      customer_discount_pct = COALESCE(${input.customer_discount_pct ?? null}, customer_discount_pct),
      stripe_coupon_id = COALESCE(${input.stripe_coupon_id || null}, stripe_coupon_id),
      stripe_promo_code_id = COALESCE(${input.stripe_promo_code_id || null}, stripe_promo_code_id),
      status = COALESCE(${input.status || null}, status),
      updated_at = NOW()
    WHERE id = ${id}
  `
  return (result.rowCount ?? 0) > 0
}

// ===========================================
// CLICK TRACKING
// ===========================================

export async function insertClick(input: {
  creator_id: string
  landing_page?: string
  ip_hash?: string
  user_agent?: string
}): Promise<string> {
  const result = await sql`
    INSERT INTO creator_clicks (creator_id, landing_page, ip_hash, user_agent)
    VALUES (${input.creator_id}, ${input.landing_page || null}, ${input.ip_hash || null}, ${input.user_agent || null})
    RETURNING id
  `
  return result.rows[0].id
}

export async function markClickConverted(creatorId: string, ipHash: string): Promise<void> {
  await sql`
    UPDATE creator_clicks SET converted = true
    WHERE creator_id = ${creatorId}
      AND ip_hash = ${ipHash}
      AND converted = false
      AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 1
  `
}

export async function getClickCountForCreator(creatorId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::integer as count FROM creator_clicks WHERE creator_id = ${creatorId}
  `
  return Number(result.rows[0].count)
}

// ===========================================
// REFERRALS
// ===========================================

export async function insertReferral(input: {
  creator_id: string
  stripe_customer_id: string
  stripe_subscription_id?: string
  customer_email?: string
  attribution_method: 'promo_code' | 'referral_link'
  plan_tier: string
  plan_amount_cents: number
  discount_amount_cents: number
}): Promise<CreatorReferral> {
  const result = await sql`
    INSERT INTO creator_referrals (creator_id, stripe_customer_id, stripe_subscription_id, customer_email, attribution_method, plan_tier, plan_amount_cents, discount_amount_cents)
    VALUES (
      ${input.creator_id},
      ${input.stripe_customer_id},
      ${input.stripe_subscription_id || null},
      ${input.customer_email || null},
      ${input.attribution_method},
      ${input.plan_tier},
      ${input.plan_amount_cents},
      ${input.discount_amount_cents}
    )
    RETURNING *
  `
  return result.rows[0] as CreatorReferral
}

export async function getReferralsByCreator(creatorId: string): Promise<CreatorReferral[]> {
  const result = await sql`
    SELECT * FROM creator_referrals WHERE creator_id = ${creatorId} ORDER BY created_at DESC
  `
  return result.rows as CreatorReferral[]
}

export async function getReferralBySubscription(subscriptionId: string): Promise<CreatorReferral | null> {
  const result = await sql`
    SELECT * FROM creator_referrals WHERE stripe_subscription_id = ${subscriptionId} LIMIT 1
  `
  return (result.rows[0] as CreatorReferral) || null
}

// ===========================================
// COMMISSIONS
// ===========================================

export async function insertCommission(input: {
  creator_id: string
  referral_id: string
  stripe_invoice_id?: string
  gross_amount_cents: number
  commission_rate: number
  commission_amount_cents: number
}): Promise<CreatorCommission> {
  const result = await sql`
    INSERT INTO creator_commissions (creator_id, referral_id, stripe_invoice_id, gross_amount_cents, commission_rate, commission_amount_cents)
    VALUES (
      ${input.creator_id},
      ${input.referral_id},
      ${input.stripe_invoice_id || null},
      ${input.gross_amount_cents},
      ${input.commission_rate},
      ${input.commission_amount_cents}
    )
    RETURNING *
  `
  return result.rows[0] as CreatorCommission
}

export async function getCommissionsByCreator(creatorId: string): Promise<CreatorCommission[]> {
  const result = await sql`
    SELECT * FROM creator_commissions WHERE creator_id = ${creatorId} ORDER BY created_at DESC
  `
  return result.rows as CreatorCommission[]
}

export async function approveCommissions(commissionIds: string[]): Promise<number> {
  if (commissionIds.length === 0) return 0
  // Process one at a time since sql template doesn't support IN with arrays easily
  let count = 0
  for (const id of commissionIds) {
    const result = await sql`
      UPDATE creator_commissions SET status = 'approved', updated_at = NOW()
      WHERE id = ${id} AND status = 'pending'
    `
    count += result.rowCount ?? 0
  }
  return count
}

export async function markCommissionsPaid(commissionIds: string[]): Promise<number> {
  if (commissionIds.length === 0) return 0
  let count = 0
  for (const id of commissionIds) {
    const result = await sql`
      UPDATE creator_commissions SET status = 'paid', updated_at = NOW()
      WHERE id = ${id} AND status = 'approved'
    `
    count += result.rowCount ?? 0
  }
  return count
}

// ===========================================
// STATS / AGGREGATES
// ===========================================

export async function getCreatorStats(creatorId: string): Promise<CreatorStats> {
  const [referrals, clicks, earnings, pendingEarnings, monthReferrals, monthEarnings] = await Promise.all([
    sql`SELECT COUNT(*)::integer as count FROM creator_referrals WHERE creator_id = ${creatorId}`,
    sql`SELECT COUNT(*)::integer as count FROM creator_clicks WHERE creator_id = ${creatorId}`,
    sql`SELECT COALESCE(SUM(commission_amount_cents), 0)::integer as total FROM creator_commissions WHERE creator_id = ${creatorId} AND status IN ('approved', 'paid')`,
    sql`SELECT COALESCE(SUM(commission_amount_cents), 0)::integer as total FROM creator_commissions WHERE creator_id = ${creatorId} AND status = 'pending'`,
    sql`SELECT COUNT(*)::integer as count FROM creator_referrals WHERE creator_id = ${creatorId} AND created_at >= date_trunc('month', NOW())`,
    sql`SELECT COALESCE(SUM(commission_amount_cents), 0)::integer as total FROM creator_commissions WHERE creator_id = ${creatorId} AND status IN ('approved', 'paid') AND created_at >= date_trunc('month', NOW())`,
  ])

  const totalReferrals = Number(referrals.rows[0].count)
  const totalClicks = Number(clicks.rows[0].count)

  return {
    total_referrals: totalReferrals,
    total_clicks: totalClicks,
    total_earnings_cents: Number(earnings.rows[0].total),
    pending_earnings_cents: Number(pendingEarnings.rows[0].total),
    month_referrals: Number(monthReferrals.rows[0].count),
    month_earnings_cents: Number(monthEarnings.rows[0].total),
    conversion_rate: totalClicks > 0 ? Math.round((totalReferrals / totalClicks) * 10000) / 100 : 0,
  }
}

export async function getCreatorsWithStats(): Promise<(Creator & { referral_count: number; total_commissions_cents: number })[]> {
  const result = await sql`
    SELECT
      c.*,
      COALESCE(r.referral_count, 0)::integer as referral_count,
      COALESCE(cm.total_commissions_cents, 0)::integer as total_commissions_cents
    FROM creators c
    LEFT JOIN (
      SELECT creator_id, COUNT(*)::integer as referral_count
      FROM creator_referrals
      GROUP BY creator_id
    ) r ON r.creator_id = c.id
    LEFT JOIN (
      SELECT creator_id, SUM(commission_amount_cents)::integer as total_commissions_cents
      FROM creator_commissions
      GROUP BY creator_id
    ) cm ON cm.creator_id = c.id
    ORDER BY c.created_at DESC
  `
  return result.rows as (Creator & { referral_count: number; total_commissions_cents: number })[]
}
```

- [ ] **Step 2: Run the app to verify the module compiles**

Run: `cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website" && npx next build 2>&1 | head -30`

Expected: No TypeScript errors in `lib/creators/db.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/creators/db.ts
git commit -m "feat: add creator DB module with 4 tables, CRUD, stats queries"
```

---

## Task 2: Commission Calculation + Attribution Logic

**Files:**
- Create: `lib/creators/commission.ts`
- Create: `lib/creators/attribution.ts`

- [ ] **Step 1: Create commission calculation module**

Create `lib/creators/commission.ts`:

```typescript
/**
 * Commission is calculated on NET revenue (after discount).
 * Rate is stored in basis points (2000 = 20%).
 *
 * Example: $149 plan, 10% discount = $134.10 paid
 * Commission = 20% of $134.10 = $26.82 = 2682 cents
 */

export function calculateCommission(grossAmountCents: number, commissionRateBps: number): number {
  return Math.round(grossAmountCents * commissionRateBps / 10000)
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function bpsToPercent(bps: number): number {
  return bps / 100
}

export function percentToBps(pct: number): number {
  return Math.round(pct * 100)
}
```

- [ ] **Step 2: Create attribution module**

Create `lib/creators/attribution.ts`:

```typescript
import Stripe from 'stripe'
import { getCreatorBySlug, getCreatorByCouponCode, type Creator } from './db'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

export interface AttributionResult {
  creator: Creator
  method: 'referral_link' | 'promo_code'
}

/**
 * Determine which creator (if any) should be attributed for a checkout session.
 *
 * Priority:
 * 1. If a promo code was used AND it matches a creator → promo_code wins
 * 2. If metadata has creator_ref → referral_link
 * 3. No attribution
 *
 * Promo code takes priority because it's the most intentional customer action.
 */
export async function attributeCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<AttributionResult | null> {
  const stripe = getStripe()

  // Step 1: Check for promo code usage
  try {
    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['total_details.breakdown'],
    })

    const discounts = expandedSession.total_details?.breakdown?.discounts
    if (discounts && discounts.length > 0) {
      const discountObj = discounts[0].discount
      const promoCodeId = typeof discountObj.promotion_code === 'string'
        ? discountObj.promotion_code
        : discountObj.promotion_code?.id

      if (promoCodeId) {
        const promoCode = await stripe.promotionCodes.retrieve(promoCodeId)
        if (promoCode.code) {
          const creator = await getCreatorByCouponCode(promoCode.code)
          if (creator && creator.status === 'active') {
            return { creator, method: 'promo_code' }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking promo code attribution:', error)
  }

  // Step 2: Check for referral link metadata
  const creatorRef = session.metadata?.creator_ref
  if (creatorRef) {
    const creator = await getCreatorBySlug(creatorRef)
    if (creator && creator.status === 'active') {
      return { creator, method: 'referral_link' }
    }
  }

  return null
}

/**
 * Hash an IP address for privacy-safe click tracking.
 * Uses a daily rotating salt so hashes can't be correlated across days.
 */
export function hashIp(ip: string): string {
  const today = new Date().toISOString().split('T')[0]
  const salt = process.env.SESSION_SECRET || 'cultr-salt'
  // Use a simple hash since crypto.subtle isn't available in all contexts
  // For production, this could use crypto.createHash('sha256')
  let hash = 0
  const str = `${ip}:${today}:${salt}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website" && npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors in the new files.

- [ ] **Step 4: Commit**

```bash
git add lib/creators/commission.ts lib/creators/attribution.ts
git commit -m "feat: add commission calculation and checkout attribution logic"
```

---

## Task 3: Creator Auth (JWT + Magic Link)

**Files:**
- Create: `lib/creator-auth.ts`
- Create: `app/api/creators/auth/magic-link/route.ts`
- Create: `app/api/creators/auth/verify/route.ts`
- Create: `app/api/creators/auth/logout/route.ts`

- [ ] **Step 1: Create creator auth module**

Create `lib/creator-auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const CREATOR_COOKIE_NAME = 'cultr_creator_session'
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cultr-magic-link-secret-change-in-production'
)
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'cultr-session-secret-change-in-production'
)

// Magic link token (15 min)
export async function createCreatorMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'creator_magic_link' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(MAGIC_LINK_SECRET)
}

export async function verifyCreatorMagicLinkToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET)
    if (payload.type !== 'creator_magic_link' || typeof payload.email !== 'string') {
      return null
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

// Session token (7 days)
export async function createCreatorSessionToken(email: string, creatorId: string): Promise<string> {
  return new SignJWT({ email, creatorId, type: 'creator_session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET)
}

export async function verifyCreatorSessionToken(
  token: string
): Promise<{ email: string; creatorId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    if (
      payload.type !== 'creator_session' ||
      typeof payload.email !== 'string' ||
      typeof payload.creatorId !== 'string'
    ) {
      return null
    }
    return { email: payload.email, creatorId: payload.creatorId }
  } catch {
    return null
  }
}

export async function setCreatorSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CREATOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getCreatorSession(): Promise<{ email: string; creatorId: string } | null> {
  if (process.env.NODE_ENV === 'development') {
    return { email: 'creator@cultrhealth.com', creatorId: 'dev_creator' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(CREATOR_COOKIE_NAME)?.value
  if (!token) return null
  return verifyCreatorSessionToken(token)
}

export async function clearCreatorSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CREATOR_COOKIE_NAME)
}
```

- [ ] **Step 2: Create magic link API route**

Create `app/api/creators/auth/magic-link/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createCreatorMagicLinkToken } from '@/lib/creator-auth'
import { getCreatorByEmail } from '@/lib/creators/db'
import { strictLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await strictLimiter.check(`creator-magic:${clientIp}`)
    if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult)

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Always return same message to avoid email enumeration
    const genericResponse = {
      success: true,
      message: 'If you have a creator account, you will receive an email shortly.',
    }

    const creator = await getCreatorByEmail(normalizedEmail)
    if (!creator || creator.status !== 'active') {
      return NextResponse.json(genericResponse)
    }

    const token = await createCreatorMagicLinkToken(normalizedEmail)

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const magicLink = `${baseUrl}/api/creators/auth/verify?token=${encodeURIComponent(token)}`
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'
    const resend = getResend()

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'Access Your CULTR Creator Dashboard',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0; margin-bottom: 30px; color: #2A4542;">CULTR</h1>
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Click the button below to access your Creator Dashboard. This link will expire in 15 minutes.
    </p>
    <a href="${magicLink}" style="display: inline-block; background-color: #2A4542; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: 500; font-size: 16px; margin-bottom: 24px;">
      Open Dashboard
    </a>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 32px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
    <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
      CULTR Health<br>This is an automated message. Please do not reply.
    </p>
  </div>
</body>
</html>`,
    })

    if (emailError) {
      console.error('Failed to send creator magic link:', emailError)
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
    }

    console.log('Creator magic link sent:', { email: normalizedEmail, timestamp: new Date().toISOString() })
    return NextResponse.json(genericResponse)
  } catch (error) {
    console.error('Creator magic link error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create verify route**

Create `app/api/creators/auth/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorMagicLinkToken, createCreatorSessionToken, setCreatorSessionCookie } from '@/lib/creator-auth'
import { getCreatorByEmail } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=invalid_link`)
    }

    const verified = await verifyCreatorMagicLinkToken(token)
    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=expired_link`)
    }

    const creator = await getCreatorByEmail(verified.email)
    if (!creator || creator.status !== 'active') {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=no_account`)
    }

    const sessionToken = await createCreatorSessionToken(verified.email, creator.id)
    await setCreatorSessionCookie(sessionToken)

    console.log('Creator session created:', { email: verified.email, creatorId: creator.id, timestamp: new Date().toISOString() })
    return NextResponse.redirect(`${baseUrl}/creators/dashboard`)
  } catch (error) {
    console.error('Creator verify error:', error)
    return NextResponse.redirect(`${baseUrl}/creators/login?error=verification_failed`)
  }
}
```

- [ ] **Step 4: Create logout route**

Create `app/api/creators/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { clearCreatorSession } from '@/lib/creator-auth'

export async function POST() {
  await clearCreatorSession()

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return NextResponse.json({ success: true, redirect: `${baseUrl}/creators/login` })
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add lib/creator-auth.ts app/api/creators/auth/
git commit -m "feat: add creator magic-link auth flow (JWT, magic link, verify, logout)"
```

---

## Task 4: Admin Auth (JWT + Magic Link)

**Files:**
- Create: `lib/admin-auth.ts`
- Create: `app/api/admin/auth/magic-link/route.ts`
- Create: `app/api/admin/auth/verify/route.ts`
- Create: `app/api/admin/auth/logout/route.ts`

- [ ] **Step 1: Create admin auth module**

Create `lib/admin-auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { isProviderEmail } from '@/lib/auth'

const ADMIN_COOKIE_NAME = 'cultr_admin_session'
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cultr-magic-link-secret-change-in-production'
)
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'cultr-session-secret-change-in-production'
)

export async function createAdminMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'admin_magic_link' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(MAGIC_LINK_SECRET)
}

export async function verifyAdminMagicLinkToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET)
    if (payload.type !== 'admin_magic_link' || typeof payload.email !== 'string') {
      return null
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

export async function createAdminSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, type: 'admin_session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET)
}

export async function verifyAdminSessionToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    if (payload.type !== 'admin_session' || typeof payload.email !== 'string') {
      return null
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  if (process.env.NODE_ENV === 'development') {
    return { email: 'admin@cultrhealth.com' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null

  const session = await verifyAdminSessionToken(token)
  if (!session) return null

  // Double-check email is still in provider allowlist
  if (!isProviderEmail(session.email)) return null

  return session
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}
```

- [ ] **Step 2: Create admin magic link route**

Create `app/api/admin/auth/magic-link/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminMagicLinkToken } from '@/lib/admin-auth'
import { isProviderEmail } from '@/lib/auth'
import { strictLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await strictLimiter.check(`admin-magic:${clientIp}`)
    if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult)

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Always return same message
    const genericResponse = {
      success: true,
      message: 'If you have admin access, you will receive an email shortly.',
    }

    if (!isProviderEmail(normalizedEmail)) {
      return NextResponse.json(genericResponse)
    }

    const token = await createAdminMagicLinkToken(normalizedEmail)

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const magicLink = `${baseUrl}/api/admin/auth/verify?token=${encodeURIComponent(token)}`
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'
    const resend = getResend()

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'CULTR Admin Access',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 300; margin-bottom: 30px; color: #2A4542;">CULTR Admin</h1>
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Click the button below to access the admin dashboard. This link will expire in 15 minutes.
    </p>
    <a href="${magicLink}" style="display: inline-block; background-color: #2A4542; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: 500; font-size: 16px; margin-bottom: 24px;">
      Open Admin Dashboard
    </a>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 32px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
    <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
      CULTR Health<br>This is an automated message. Please do not reply.
    </p>
  </div>
</body>
</html>`,
    })

    if (emailError) {
      console.error('Failed to send admin magic link:', emailError)
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
    }

    console.log('Admin magic link sent:', { email: normalizedEmail, timestamp: new Date().toISOString() })
    return NextResponse.json(genericResponse)
  } catch (error) {
    console.error('Admin magic link error:', error)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create admin verify route**

Create `app/api/admin/auth/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminMagicLinkToken, createAdminSessionToken, setAdminSessionCookie } from '@/lib/admin-auth'
import { isProviderEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/admin/login?error=invalid_link`)
    }

    const verified = await verifyAdminMagicLinkToken(token)
    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/admin/login?error=expired_link`)
    }

    if (!isProviderEmail(verified.email)) {
      return NextResponse.redirect(`${baseUrl}/admin/login?error=not_authorized`)
    }

    const sessionToken = await createAdminSessionToken(verified.email)
    await setAdminSessionCookie(sessionToken)

    console.log('Admin session created:', { email: verified.email, timestamp: new Date().toISOString() })
    return NextResponse.redirect(`${baseUrl}/admin/creators`)
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.redirect(`${baseUrl}/admin/login?error=verification_failed`)
  }
}
```

- [ ] **Step 4: Create admin logout route**

Create `app/api/admin/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin-auth'

export async function POST() {
  await clearAdminSession()

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return NextResponse.json({ success: true, redirect: `${baseUrl}/admin/login` })
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add lib/admin-auth.ts app/api/admin/auth/
git commit -m "feat: add admin magic-link auth (isProviderEmail gated, no Stripe required)"
```

---

## Task 5: Middleware — Ref Cookie Capture + Click Tracking

**Files:**
- Create: `middleware.ts`
- Create: `app/api/creators/track-click/route.ts`

- [ ] **Step 1: Create the click tracking API route**

Create `app/api/creators/track-click/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCreatorBySlug, insertClick } from '@/lib/creators/db'
import { hashIp } from '@/lib/creators/attribution'
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await apiLimiter.check(`click:${clientIp}`)
    if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult)

    const { slug, landingPage, userAgent } = await request.json()

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const creator = await getCreatorBySlug(slug)
    if (!creator || creator.status !== 'active') {
      return NextResponse.json({ ok: true }) // Silent fail — don't reveal creator existence
    }

    const ipHash = hashIp(clientIp)

    await insertClick({
      creator_id: creator.id,
      landing_page: landingPage || null,
      ip_hash: ipHash,
      user_agent: userAgent || null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json({ ok: true }) // Never fail visibly
  }
}
```

- [ ] **Step 2: Create middleware**

Create `middleware.ts` at project root:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const ref = searchParams.get('ref')

  // No ref param — pass through
  if (!ref) return NextResponse.next()

  const response = NextResponse.next()

  // Set referral cookie (30 days)
  const isProduction = process.env.NODE_ENV === 'production'
  response.cookies.set('cultr_ref', ref.toLowerCase(), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    httpOnly: false, // Needs to be readable by client-side JS for checkout
    secure: isProduction,
    sameSite: 'lax',
    ...(isProduction ? { domain: '.cultrhealth.com' } : {}),
  })

  // Fire-and-forget click tracking
  // We use the origin from the request to build the internal API URL
  const origin = request.nextUrl.origin
  const trackUrl = `${origin}/api/creators/track-click`

  try {
    fetch(trackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: ref.toLowerCase(),
        landingPage: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || '',
      }),
    }).catch(() => {
      // Silently ignore tracking failures
    })
  } catch {
    // Silently ignore
  }

  return response
}

export const config = {
  // Run on all pages except API routes, static files, and Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/api/creators/track-click/route.ts
git commit -m "feat: add middleware for ref cookie capture + click tracking API"
```

---

## Task 6: Checkout + Webhook Integration

**Files:**
- Modify: `app/api/checkout/route.ts`
- Modify: `app/api/webhook/stripe/route.ts`
- Modify: `app/join/[tier]/page.tsx`

- [ ] **Step 1: Update join page to read ref cookie and pass to checkout**

In `app/join/[tier]/page.tsx`, update `handleCheckout` to read the cookie and send it:

Find the existing `handleCheckout` function and replace the fetch body to include ref:

```typescript
// Inside handleCheckout, replace the fetch call:
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planSlug: plan.slug,
    ref: document.cookie
      .split('; ')
      .find((row) => row.startsWith('cultr_ref='))
      ?.split('=')[1] || undefined,
  }),
});
```

The rest of the function stays the same.

- [ ] **Step 2: Update checkout route to include creator ref in Stripe metadata and apply discount**

In `app/api/checkout/route.ts`, after finding the plan and building `sessionMetadata`, add ref handling:

After line `const { planSlug, email, metadata } = body;` add:
```typescript
const ref = body.ref as string | undefined;
```

After building `sessionMetadata`, add:
```typescript
// Add creator ref to metadata if present
let creatorRef = ref;
if (!creatorRef) {
  // Fallback: read from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const refMatch = cookieHeader.match(/cultr_ref=([^;]+)/);
  if (refMatch) creatorRef = refMatch[1];
}

if (creatorRef) {
  sessionMetadata.creator_ref = creatorRef;
}
```

In the `stripe.checkout.sessions.create` call, add the creator's promo code discount if ref is present. Replace the session creation with:

```typescript
// Look up creator's Stripe promo code if ref provided
let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
if (creatorRef && process.env.POSTGRES_URL) {
  try {
    const { getCreatorBySlug } = await import('@/lib/creators/db');
    const creator = await getCreatorBySlug(creatorRef);
    if (creator?.stripe_promo_code_id && creator.status === 'active') {
      discounts = [{ promotion_code: creator.stripe_promo_code_id }];
    }
  } catch (err) {
    console.error('Creator lookup for checkout failed:', err);
  }
}

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: plan.stripePriceId,
      quantity: 1,
    },
  ],
  ...(discounts ? { discounts } : { allow_promotion_codes: true }),
  customer_email: email || undefined,
  billing_address_collection: 'required',
  success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing?cancelled=true`,
  metadata: sessionMetadata,
  subscription_data: {
    metadata: sessionMetadata,
  },
});
```

Note: When `discounts` is set, `allow_promotion_codes` must NOT be set (Stripe doesn't allow both). When no creator ref, we keep `allow_promotion_codes: true` for manual code entry.

- [ ] **Step 3: Update webhook — attribution on checkout.session.completed**

In `app/api/webhook/stripe/route.ts`, update `handleCheckoutCompleted`:

Replace the entire `handleCheckoutCompleted` function:

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', {
    session_id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    metadata: session.metadata,
  });

  const planTier = session.metadata?.plan_tier || 'unknown';
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  // Store membership record
  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');

      await sql`
        INSERT INTO memberships (
          stripe_customer_id,
          stripe_subscription_id,
          plan_tier,
          subscription_status,
          created_at,
          updated_at
        ) VALUES (
          ${customerId},
          ${subscriptionId},
          ${planTier},
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (stripe_subscription_id)
        DO UPDATE SET
          subscription_status = 'active',
          updated_at = NOW()
      `;

      console.log('Membership record created/updated');
    } catch (dbError) {
      console.error('Failed to update membership database:', dbError);
    }
  }

  // Creator attribution
  if (process.env.POSTGRES_URL && customerId && subscriptionId) {
    try {
      const { attributeCheckoutSession } = await import('@/lib/creators/attribution');
      const { calculateCommission } = await import('@/lib/creators/commission');
      const { insertReferral, insertCommission } = await import('@/lib/creators/db');

      const attribution = await attributeCheckoutSession(session);

      if (attribution) {
        const { creator, method } = attribution;
        const amountPaid = session.amount_total || 0; // cents
        const amountSubtotal = session.amount_subtotal || 0;
        const discountAmount = amountSubtotal - amountPaid;

        // Get customer email safely
        const customerEmail = session.customer_details?.email || null;

        const referral = await insertReferral({
          creator_id: creator.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          customer_email: customerEmail,
          attribution_method: method,
          plan_tier: planTier,
          plan_amount_cents: amountSubtotal,
          discount_amount_cents: Math.max(0, discountAmount),
        });

        const commissionAmount = calculateCommission(amountPaid, creator.commission_rate);

        await insertCommission({
          creator_id: creator.id,
          referral_id: referral.id,
          gross_amount_cents: amountPaid,
          commission_rate: creator.commission_rate,
          commission_amount_cents: commissionAmount,
        });

        // Write creator_id to subscription metadata for recurring commissions
        const stripe = getStripe();
        await stripe.subscriptions.update(subscriptionId, {
          metadata: { creator_id: creator.id },
        });

        console.log('Creator attribution recorded:', {
          creator: creator.name,
          method,
          commission_cents: commissionAmount,
        });
      }
    } catch (attrError) {
      console.error('Creator attribution failed (non-fatal):', attrError);
    }
  }
}
```

- [ ] **Step 4: Update webhook — recurring commissions on invoice.payment_succeeded**

Replace the `handlePaymentSucceeded` function:

```typescript
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', {
    invoice_id: invoice.id,
    customer: invoice.customer,
    subscription: (invoice as { subscription?: string | Stripe.Subscription | null }).subscription,
    amount: invoice.amount_paid,
  });

  // Skip the first invoice — that's handled by checkout.session.completed
  if (invoice.billing_reason === 'subscription_create') return;

  // Check for creator attribution on recurring payments
  const subscriptionRaw = (invoice as { subscription?: string | Stripe.Subscription | null }).subscription;
  const subscriptionId = typeof subscriptionRaw === 'string' ? subscriptionRaw : subscriptionRaw?.id;

  if (!subscriptionId || !process.env.POSTGRES_URL) return;

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const creatorId = subscription.metadata?.creator_id;

    if (!creatorId) return;

    const { getReferralBySubscription, insertCommission, getCreatorById } = await import('@/lib/creators/db');
    const { calculateCommission } = await import('@/lib/creators/commission');

    const referral = await getReferralBySubscription(subscriptionId);
    if (!referral) return;

    const creator = await getCreatorById(creatorId);
    if (!creator || creator.status === 'inactive') return;

    const amountPaid = invoice.amount_paid; // cents
    const commissionAmount = calculateCommission(amountPaid, creator.commission_rate);

    await insertCommission({
      creator_id: creatorId,
      referral_id: referral.id,
      stripe_invoice_id: invoice.id,
      gross_amount_cents: amountPaid,
      commission_rate: creator.commission_rate,
      commission_amount_cents: commissionAmount,
    });

    console.log('Recurring commission recorded:', {
      creator: creator.name,
      invoice_id: invoice.id,
      commission_cents: commissionAmount,
    });
  } catch (error) {
    console.error('Recurring commission tracking failed (non-fatal):', error);
  }
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add app/join/[tier]/page.tsx app/api/checkout/route.ts app/api/webhook/stripe/route.ts
git commit -m "feat: integrate creator attribution into checkout + webhook (initial + recurring)"
```

---

## Task 7: Creator Dashboard API

**Files:**
- Create: `app/api/creators/dashboard/route.ts`

- [ ] **Step 1: Create dashboard data API**

Create `app/api/creators/dashboard/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCreatorSession } from '@/lib/creator-auth'
import {
  getCreatorById,
  getCreatorStats,
  getReferralsByCreator,
  getCommissionsByCreator,
} from '@/lib/creators/db'
import { formatCents, bpsToPercent } from '@/lib/creators/commission'

export async function GET() {
  try {
    const session = await getCreatorSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const creator = await getCreatorById(session.creatorId)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const [stats, referrals, commissions] = await Promise.all([
      getCreatorStats(creator.id),
      getReferralsByCreator(creator.id),
      getCommissionsByCreator(creator.id),
    ])

    // Mask customer emails for privacy
    const maskedReferrals = referrals.map((r) => ({
      ...r,
      customer_email: r.customer_email ? maskEmail(r.customer_email) : null,
    }))

    return NextResponse.json({
      creator: {
        name: creator.name,
        coupon_code: creator.coupon_code,
        referral_slug: creator.referral_slug,
        commission_rate_pct: bpsToPercent(creator.commission_rate),
        customer_discount_pct: creator.customer_discount_pct,
      },
      stats: {
        ...stats,
        total_earnings: formatCents(stats.total_earnings_cents),
        pending_earnings: formatCents(stats.pending_earnings_cents),
        month_earnings: formatCents(stats.month_earnings_cents),
      },
      referrals: maskedReferrals,
      commissions,
    })
  } catch (error) {
    console.error('Creator dashboard error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/creators/dashboard/route.ts
git commit -m "feat: add creator dashboard API (stats, referrals, commissions)"
```

---

## Task 8: Creator Dashboard UI

**Files:**
- Create: `components/creators/CreatorLoginForm.tsx`
- Create: `components/creators/CreatorDashboardOverview.tsx`
- Create: `components/creators/CreatorReferralsTable.tsx`
- Create: `components/creators/CreatorCommissionsTable.tsx`
- Create: `components/creators/CreatorPromoTools.tsx`
- Create: `app/creators/login/page.tsx`
- Create: `app/creators/dashboard/layout.tsx`
- Create: `app/creators/dashboard/page.tsx`

- [ ] **Step 1: Create CreatorLoginForm**

Create `components/creators/CreatorLoginForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function CreatorLoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/creators/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send link')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-cultr-forest mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold text-cultr-forest mb-2">Check your email</h2>
        <p className="text-cultr-textMuted">
          We sent a login link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-cultr-text mb-1">
          Creator Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cultr-textMuted" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full pl-10 pr-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text placeholder:text-cultr-textMuted/50 focus:outline-none focus:ring-2 focus:ring-cultr-forest focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Sending...' : (
          <>
            Send Login Link
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create Creator Login page**

Create `app/creators/login/page.tsx`:

```tsx
import CreatorLoginForm from '@/components/creators/CreatorLoginForm'

export default function CreatorLoginPage() {
  return (
    <div className="min-h-screen bg-cultr-offwhite flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-cultr-forest mb-2">Creator Portal</h1>
          <p className="text-cultr-textMuted">Sign in to access your dashboard</p>
        </div>
        <div className="bg-white border border-cultr-sage rounded-2xl p-8 shadow-sm">
          <CreatorLoginForm />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create dashboard overview component**

Create `components/creators/CreatorDashboardOverview.tsx`:

```tsx
'use client'

import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react'

interface OverviewProps {
  stats: {
    total_referrals: number
    total_clicks: number
    total_earnings: string
    pending_earnings: string
    month_referrals: number
    month_earnings: string
    conversion_rate: number
  }
}

export default function CreatorDashboardOverview({ stats }: OverviewProps) {
  const cards = [
    { label: 'Total Referrals', value: stats.total_referrals, icon: Users, color: 'bg-cultr-mint' },
    { label: 'Total Earnings', value: stats.total_earnings, icon: DollarSign, color: 'bg-cultr-sage' },
    { label: 'Pending', value: stats.pending_earnings, icon: Clock, color: 'bg-yellow-50' },
    { label: 'Conversion Rate', value: `${stats.conversion_rate}%`, icon: TrendingUp, color: 'bg-blue-50' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`${card.color} border border-cultr-sage/50 rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <card.icon className="w-4 h-4 text-cultr-forest" />
            <span className="text-xs font-medium text-cultr-textMuted uppercase tracking-wide">{card.label}</span>
          </div>
          <p className="text-2xl font-display font-bold text-cultr-forest">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create referrals table component**

Create `components/creators/CreatorReferralsTable.tsx`:

```tsx
'use client'

interface Referral {
  id: string
  customer_email: string | null
  plan_tier: string
  attribution_method: 'promo_code' | 'referral_link'
  plan_amount_cents: number
  discount_amount_cents: number
  created_at: string
}

export default function CreatorReferralsTable({ referrals }: { referrals: Referral[] }) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8 text-cultr-textMuted">
        No referrals yet. Share your link to get started!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cultr-sage/50">
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Customer</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Plan</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Source</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id} className="border-b border-cultr-sage/20">
              <td className="py-3 px-4 text-cultr-text">{r.customer_email || '—'}</td>
              <td className="py-3 px-4">
                <span className="inline-block bg-cultr-mint text-cultr-forest text-xs font-medium px-2 py-1 rounded-full capitalize">
                  {r.plan_tier}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                  r.attribution_method === 'promo_code'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {r.attribution_method === 'promo_code' ? 'Promo Code' : 'Referral Link'}
                </span>
              </td>
              <td className="py-3 px-4 text-cultr-textMuted">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Create commissions table component**

Create `components/creators/CreatorCommissionsTable.tsx`:

```tsx
'use client'

interface Commission {
  id: string
  gross_amount_cents: number
  commission_amount_cents: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
}

export default function CreatorCommissionsTable({ commissions }: { commissions: Commission[] }) {
  if (commissions.length === 0) {
    return (
      <div className="text-center py-8 text-cultr-textMuted">
        No commissions yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cultr-sage/50">
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Revenue</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Commission</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Status</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map((c) => (
            <tr key={c.id} className="border-b border-cultr-sage/20">
              <td className="py-3 px-4 text-cultr-textMuted">
                {new Date(c.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-cultr-text">
                ${(c.gross_amount_cents / 100).toFixed(2)}
              </td>
              <td className="py-3 px-4 text-cultr-forest font-medium">
                ${(c.commission_amount_cents / 100).toFixed(2)}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[c.status] || ''}`}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Create promo tools component**

Create `components/creators/CreatorPromoTools.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Copy, Check, Link, Tag } from 'lucide-react'

interface PromoToolsProps {
  couponCode: string
  referralSlug: string
}

export default function CreatorPromoTools({ couponCode, referralSlug }: PromoToolsProps) {
  const referralUrl = `https://join.cultrhealth.com?ref=${referralSlug}`

  return (
    <div className="space-y-4">
      <CopyField label="Your Promo Code" value={couponCode} icon={Tag} />
      <CopyField label="Your Referral Link" value={referralUrl} icon={Link} />
    </div>
  )
}

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-cultr-textMuted uppercase tracking-wide mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-cultr-mint border border-cultr-sage rounded-xl px-4 py-3">
          <Icon className="w-4 h-4 text-cultr-forest shrink-0" />
          <span className="text-cultr-forest font-mono text-sm truncate">{value}</span>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 p-3 bg-cultr-forest text-white rounded-xl hover:bg-cultr-forestDark transition-colors"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create dashboard layout**

Create `app/creators/dashboard/layout.tsx`:

```tsx
import { getCreatorSession } from '@/lib/creator-auth'
import { redirect } from 'next/navigation'

export default async function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCreatorSession()
  if (!session) {
    redirect('/creators/login')
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      <header className="bg-cultr-forest text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-display font-bold">CULTR Creator Portal</h1>
          <form action="/api/creators/auth/logout" method="POST">
            <button type="submit" className="text-sm text-white/70 hover:text-white transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 8: Create dashboard page**

Create `app/creators/dashboard/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import CreatorDashboardOverview from '@/components/creators/CreatorDashboardOverview'
import CreatorReferralsTable from '@/components/creators/CreatorReferralsTable'
import CreatorCommissionsTable from '@/components/creators/CreatorCommissionsTable'
import CreatorPromoTools from '@/components/creators/CreatorPromoTools'
import { Loader2 } from 'lucide-react'

export default function CreatorDashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/creators/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard')
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cultr-forest" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
      </div>
    )
  }

  const { creator, stats, referrals, commissions } = data as {
    creator: { name: string; coupon_code: string; referral_slug: string; commission_rate_pct: number; customer_discount_pct: number }
    stats: { total_referrals: number; total_clicks: number; total_earnings: string; pending_earnings: string; month_referrals: number; month_earnings: string; conversion_rate: number }
    referrals: Array<{ id: string; customer_email: string | null; plan_tier: string; attribution_method: 'promo_code' | 'referral_link'; plan_amount_cents: number; discount_amount_cents: number; created_at: string }>
    commissions: Array<{ id: string; gross_amount_cents: number; commission_amount_cents: number; status: 'pending' | 'approved' | 'paid'; created_at: string }>
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-cultr-forest mb-1">
          Welcome back, {creator.name}
        </h2>
        <p className="text-cultr-textMuted">
          {creator.commission_rate_pct}% commission &middot; {creator.customer_discount_pct}% customer discount
        </p>
      </div>

      <CreatorDashboardOverview stats={stats} />

      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Promo Tools</h3>
        <CreatorPromoTools couponCode={creator.coupon_code} referralSlug={creator.referral_slug} />
      </div>

      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Referrals</h3>
        <CreatorReferralsTable referrals={referrals} />
      </div>

      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Commissions</h3>
        <CreatorCommissionsTable commissions={commissions} />
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 10: Commit**

```bash
git add components/creators/ app/creators/
git commit -m "feat: add creator login page + dashboard UI (overview, referrals, commissions, promo tools)"
```

---

## Task 9: Admin Creator API Routes

**Files:**
- Create: `app/api/admin/creators/route.ts`
- Create: `app/api/admin/creators/[id]/route.ts`
- Create: `app/api/admin/creators/[id]/commissions/route.ts`
- Create: `app/api/admin/creators/[id]/commissions/approve/route.ts`
- Create: `app/api/admin/creators/[id]/commissions/mark-paid/route.ts`

- [ ] **Step 1: Create admin creators list + add creator route**

Create `app/api/admin/creators/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/admin-auth'
import { getCreatorsWithStats, insertCreator } from '@/lib/creators/db'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creators = await getCreatorsWithStats()
    return NextResponse.json({ creators })
  } catch (error) {
    console.error('Admin creators list error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, email, coupon_code, referral_slug, customer_discount_pct = 10, commission_rate = 2000 } = body

    if (!name || !email || !coupon_code || !referral_slug) {
      return NextResponse.json({ error: 'name, email, coupon_code, and referral_slug are required' }, { status: 400 })
    }

    // Create Stripe coupon + promotion code
    const stripe = getStripe()

    const coupon = await stripe.coupons.create({
      percent_off: customer_discount_pct,
      duration: 'forever',
      name: `Creator: ${name} (${coupon_code.toUpperCase()})`,
    })

    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: coupon_code.toUpperCase(),
    })

    // Insert into DB
    const creator = await insertCreator({
      name,
      email,
      coupon_code: coupon_code.toUpperCase(),
      stripe_coupon_id: coupon.id,
      stripe_promo_code_id: promoCode.id,
      customer_discount_pct,
      commission_rate,
      referral_slug: referral_slug.toLowerCase(),
    })

    console.log('Creator added:', { name, email, coupon_code: coupon_code.toUpperCase() })
    return NextResponse.json({ creator }, { status: 201 })
  } catch (error) {
    console.error('Admin add creator error:', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create admin creator detail + update route**

Create `app/api/admin/creators/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/admin-auth'
import { getCreatorById, updateCreator, getCreatorStats, getReferralsByCreator, getCommissionsByCreator } from '@/lib/creators/db'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await getCreatorById(params.id)
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const [stats, referrals, commissions] = await Promise.all([
      getCreatorStats(creator.id),
      getReferralsByCreator(creator.id),
      getCommissionsByCreator(creator.id),
    ])

    return NextResponse.json({ creator, stats, referrals, commissions })
  } catch (error) {
    console.error('Admin creator detail error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await getCreatorById(params.id)
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const body = await request.json()
    const { name, commission_rate, customer_discount_pct, status } = body

    // If status is being changed to paused/inactive, deactivate Stripe promo code
    if (status && status !== creator.status && creator.stripe_promo_code_id) {
      const stripe = getStripe()
      if (status === 'paused' || status === 'inactive') {
        await stripe.promotionCodes.update(creator.stripe_promo_code_id, { active: false })
      } else if (status === 'active') {
        await stripe.promotionCodes.update(creator.stripe_promo_code_id, { active: true })
      }
    }

    await updateCreator(params.id, { name, commission_rate, customer_discount_pct, status })

    const updated = await getCreatorById(params.id)
    return NextResponse.json({ creator: updated })
  } catch (error) {
    console.error('Admin creator update error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create admin commissions routes**

Create `app/api/admin/creators/[id]/commissions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getCommissionsByCreator } from '@/lib/creators/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const commissions = await getCommissionsByCreator(params.id)
    return NextResponse.json({ commissions })
  } catch (error) {
    console.error('Admin commissions list error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

Create `app/api/admin/creators/[id]/commissions/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { approveCommissions } from '@/lib/creators/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { commission_ids } = await request.json()
    if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
      return NextResponse.json({ error: 'commission_ids array required' }, { status: 400 })
    }

    const count = await approveCommissions(commission_ids)
    return NextResponse.json({ approved: count })
  } catch (error) {
    console.error('Admin approve commissions error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

Create `app/api/admin/creators/[id]/commissions/mark-paid/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { markCommissionsPaid } from '@/lib/creators/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { commission_ids } = await request.json()
    if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
      return NextResponse.json({ error: 'commission_ids array required' }, { status: 400 })
    }

    const count = await markCommissionsPaid(commission_ids)
    return NextResponse.json({ marked_paid: count })
  } catch (error) {
    console.error('Admin mark-paid error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/creators/
git commit -m "feat: add admin creator API routes (list, add, detail, update, commission management)"
```

---

## Task 10: Admin Dashboard UI

**Files:**
- Create: `components/admin/AdminLayout.tsx`
- Create: `components/admin/AdminCreatorsList.tsx`
- Create: `components/admin/AdminAddCreatorForm.tsx`
- Create: `components/admin/AdminCreatorDetail.tsx`
- Create: `components/admin/AdminCommissionManager.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/creators/page.tsx`
- Create: `app/admin/creators/new/page.tsx`
- Create: `app/admin/creators/[id]/page.tsx`

- [ ] **Step 1: Create AdminLayout component**

Create `components/admin/AdminLayout.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Plus, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/creators', label: 'All Creators', icon: Users },
  { href: '/admin/creators/new', label: 'Add Creator', icon: Plus },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      <header className="bg-cultr-forestDark text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-display font-bold">CULTR Admin</h1>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  pathname === item.href ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors ml-4">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create admin login page**

Create `app/admin/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Mail, ArrowRight, CheckCircle, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send link')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cultr-offwhite flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-12 h-12 text-cultr-forest mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-cultr-forest mb-2">Check your email</h2>
          <p className="text-cultr-textMuted">Login link sent to <strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-10 h-10 text-cultr-forest mx-auto mb-3" />
          <h1 className="text-3xl font-display font-bold text-cultr-forest mb-2">Admin Access</h1>
          <p className="text-cultr-textMuted">Restricted to authorized emails</p>
        </div>
        <div className="bg-white border border-cultr-sage rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-cultr-text mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cultr-textMuted" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cultrhealth.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text placeholder:text-cultr-textMuted/50 focus:outline-none focus:ring-2 focus:ring-cultr-forest"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : <>Send Login Link <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create admin layout (session gate)**

Create `app/admin/layout.tsx`:

```tsx
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayout'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page should render without auth
  // The layout wraps everything under /admin, so we need to check the path
  // For the login page, we skip the auth check via a simple approach:
  // The login page is a direct child, so we render children as-is
  // and let the individual pages handle their own auth needs

  // Actually, Next.js layouts wrap ALL child routes including /admin/login
  // So we can't gate auth here — we gate it at the page level instead
  return <>{children}</>
}
```

Note: Since the admin layout wraps `/admin/login` too, auth gating happens at the page level, not the layout. The `AdminLayout` client component (header/nav) is used only by authenticated pages.

- [ ] **Step 4: Create admin creators list page**

Create `components/admin/AdminCreatorsList.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CreatorWithStats {
  id: string
  name: string
  email: string
  coupon_code: string
  referral_slug: string
  commission_rate: number
  customer_discount_pct: number
  status: string
  referral_count: number
  total_commissions_cents: number
  created_at: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-yellow-50 text-yellow-700',
  inactive: 'bg-red-50 text-red-700',
}

export default function AdminCreatorsList() {
  const [creators, setCreators] = useState<CreatorWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/creators')
      .then((res) => res.json())
      .then((data) => setCreators(data.creators || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cultr-forest" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-cultr-forest">Creators</h2>
        <Link href="/admin/creators/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Creator
          </Button>
        </Link>
      </div>

      {creators.length === 0 ? (
        <div className="bg-white border border-cultr-sage rounded-2xl p-8 text-center text-cultr-textMuted">
          No creators yet. Add your first creator to get started.
        </div>
      ) : (
        <div className="bg-white border border-cultr-sage rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cultr-sage/50 bg-cultr-mint/30">
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Name</th>
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Code</th>
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Referrals</th>
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Commissions</th>
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Status</th>
                <th className="text-left py-3 px-4 font-medium text-cultr-textMuted"></th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="border-b border-cultr-sage/20">
                  <td className="py-3 px-4">
                    <div className="font-medium text-cultr-text">{c.name}</div>
                    <div className="text-xs text-cultr-textMuted">{c.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-cultr-forest">{c.coupon_code}</td>
                  <td className="py-3 px-4 text-cultr-text">{c.referral_count}</td>
                  <td className="py-3 px-4 text-cultr-text">${(c.total_commissions_cents / 100).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/admin/creators/${c.id}`} className="text-cultr-forest hover:underline text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

Create `app/admin/creators/page.tsx`:

```tsx
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayout'
import AdminCreatorsList from '@/components/admin/AdminCreatorsList'

export default async function AdminCreatorsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <AdminLayoutClient>
      <AdminCreatorsList />
    </AdminLayoutClient>
  )
}
```

- [ ] **Step 5: Create add creator form + page**

Create `components/admin/AdminAddCreatorForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function AdminAddCreatorForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    coupon_code: '',
    referral_slug: '',
    customer_discount_pct: 10,
    commission_rate: 2000,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add creator')
      router.push('/admin/creators')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-cultr-text mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          placeholder="Cole Sidner"
          className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text focus:outline-none focus:ring-2 focus:ring-cultr-forest"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-cultr-text mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
          placeholder="cole@example.com"
          className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text focus:outline-none focus:ring-2 focus:ring-cultr-forest"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-cultr-text mb-1">Coupon Code</label>
          <input
            type="text"
            value={form.coupon_code}
            onChange={(e) => update('coupon_code', e.target.value.toUpperCase())}
            required
            placeholder="COLE10"
            className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text font-mono focus:outline-none focus:ring-2 focus:ring-cultr-forest"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cultr-text mb-1">Referral Slug</label>
          <input
            type="text"
            value={form.referral_slug}
            onChange={(e) => update('referral_slug', e.target.value.toLowerCase())}
            required
            placeholder="cole"
            className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text font-mono focus:outline-none focus:ring-2 focus:ring-cultr-forest"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-cultr-text mb-1">Customer Discount %</label>
          <input
            type="number"
            value={form.customer_discount_pct}
            onChange={(e) => update('customer_discount_pct', parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text focus:outline-none focus:ring-2 focus:ring-cultr-forest"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cultr-text mb-1">Commission % </label>
          <input
            type="number"
            value={form.commission_rate / 100}
            onChange={(e) => update('commission_rate', (parseFloat(e.target.value) || 0) * 100)}
            min={0}
            max={100}
            step={0.5}
            className="w-full px-4 py-3 border border-cultr-sage rounded-xl bg-white text-cultr-text focus:outline-none focus:ring-2 focus:ring-cultr-forest"
          />
          <p className="text-xs text-cultr-textMuted mt-1">Stored as {form.commission_rate} basis points</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Add Creator'}
      </Button>
    </form>
  )
}
```

Create `app/admin/creators/new/page.tsx`:

```tsx
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayout'
import AdminAddCreatorForm from '@/components/admin/AdminAddCreatorForm'

export default async function AdminAddCreatorPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <AdminLayoutClient>
      <div>
        <h2 className="text-2xl font-display font-bold text-cultr-forest mb-6">Add Creator</h2>
        <div className="bg-white border border-cultr-sage rounded-2xl p-8">
          <AdminAddCreatorForm />
        </div>
      </div>
    </AdminLayoutClient>
  )
}
```

- [ ] **Step 6: Create admin creator detail + commission manager**

Create `components/admin/AdminCommissionManager.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface Commission {
  id: string
  gross_amount_cents: number
  commission_amount_cents: number
  commission_rate: number
  status: 'pending' | 'approved' | 'paid'
  stripe_invoice_id: string | null
  created_at: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
}

export default function AdminCommissionManager({
  creatorId,
  commissions: initialCommissions,
}: {
  creatorId: string
  commissions: Commission[]
}) {
  const [commissions, setCommissions] = useState(initialCommissions)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const pendingIds = commissions.filter((c) => c.status === 'pending').map((c) => c.id)
  const approvedIds = commissions.filter((c) => c.status === 'approved').map((c) => c.id)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkAction = async (action: 'approve' | 'mark-paid') => {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    setLoading(true)
    try {
      await fetch(`/api/admin/creators/${creatorId}/commissions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_ids: ids }),
      })

      // Refresh commissions
      const res = await fetch(`/api/admin/creators/${creatorId}/commissions`)
      const data = await res.json()
      setCommissions(data.commissions || [])
      setSelected(new Set())
    } catch (err) {
      console.error('Bulk action failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {pendingIds.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setSelected(new Set(pendingIds))} disabled={loading}>
            Select All Pending ({pendingIds.length})
          </Button>
        )}
        {selected.size > 0 && (
          <>
            <Button size="sm" onClick={() => bulkAction('approve')} disabled={loading}>
              Approve Selected ({selected.size})
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkAction('mark-paid')} disabled={loading}>
              Mark Paid ({selected.size})
            </Button>
          </>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cultr-sage/50">
            <th className="py-3 px-4 w-8"></th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Revenue</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Rate</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Commission</th>
            <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Status</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map((c) => (
            <tr key={c.id} className="border-b border-cultr-sage/20">
              <td className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="rounded"
                />
              </td>
              <td className="py-3 px-4 text-cultr-textMuted">{new Date(c.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4">${(c.gross_amount_cents / 100).toFixed(2)}</td>
              <td className="py-3 px-4">{c.commission_rate / 100}%</td>
              <td className="py-3 px-4 font-medium text-cultr-forest">${(c.commission_amount_cents / 100).toFixed(2)}</td>
              <td className="py-3 px-4">
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[c.status]}`}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Create `components/admin/AdminCreatorDetail.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AdminCommissionManager from './AdminCommissionManager'

export default function AdminCreatorDetail() {
  const params = useParams()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/creators/${params.id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cultr-forest" /></div>
  if (!data) return <div className="text-red-600">Failed to load creator</div>

  const { creator, stats, referrals, commissions } = data as {
    creator: { id: string; name: string; email: string; coupon_code: string; referral_slug: string; commission_rate: number; customer_discount_pct: number; status: string }
    stats: { total_referrals: number; total_clicks: number; total_earnings_cents: number; pending_earnings_cents: number; conversion_rate: number }
    referrals: Array<{ id: string; customer_email: string; plan_tier: string; attribution_method: string; created_at: string }>
    commissions: Array<{ id: string; gross_amount_cents: number; commission_amount_cents: number; commission_rate: number; status: 'pending' | 'approved' | 'paid'; stripe_invoice_id: string | null; created_at: string }>
  }

  return (
    <div className="space-y-8">
      {/* Creator Profile */}
      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-cultr-forest">{creator.name}</h2>
            <p className="text-cultr-textMuted">{creator.email}</p>
            <div className="flex gap-4 mt-2 text-sm text-cultr-textMuted">
              <span>Code: <strong className="text-cultr-forest font-mono">{creator.coupon_code}</strong></span>
              <span>Slug: <strong className="text-cultr-forest font-mono">{creator.referral_slug}</strong></span>
              <span>Commission: <strong>{creator.commission_rate / 100}%</strong></span>
              <span>Discount: <strong>{creator.customer_discount_pct}%</strong></span>
            </div>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
            creator.status === 'active' ? 'bg-green-50 text-green-700' :
            creator.status === 'paused' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            {creator.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Clicks', value: stats.total_clicks },
          { label: 'Referrals', value: stats.total_referrals },
          { label: 'Conversion', value: `${stats.conversion_rate}%` },
          { label: 'Earned', value: `$${(stats.total_earnings_cents / 100).toFixed(2)}` },
          { label: 'Pending', value: `$${(stats.pending_earnings_cents / 100).toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-cultr-sage/50 rounded-xl p-4">
            <p className="text-xs text-cultr-textMuted uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-display font-bold text-cultr-forest">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Referrals */}
      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Referrals ({referrals.length})</h3>
        {referrals.length === 0 ? (
          <p className="text-cultr-textMuted text-center py-4">No referrals yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cultr-sage/50">
                <th className="text-left py-2 px-4 font-medium text-cultr-textMuted">Email</th>
                <th className="text-left py-2 px-4 font-medium text-cultr-textMuted">Plan</th>
                <th className="text-left py-2 px-4 font-medium text-cultr-textMuted">Source</th>
                <th className="text-left py-2 px-4 font-medium text-cultr-textMuted">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-cultr-sage/20">
                  <td className="py-2 px-4">{r.customer_email}</td>
                  <td className="py-2 px-4 capitalize">{r.plan_tier}</td>
                  <td className="py-2 px-4 capitalize">{r.attribution_method.replace('_', ' ')}</td>
                  <td className="py-2 px-4 text-cultr-textMuted">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Commissions */}
      <div className="bg-white border border-cultr-sage rounded-2xl p-6">
        <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Commissions ({commissions.length})</h3>
        <AdminCommissionManager creatorId={creator.id} commissions={commissions} />
      </div>
    </div>
  )
}
```

Create `app/admin/creators/[id]/page.tsx`:

```tsx
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayout'
import AdminCreatorDetail from '@/components/admin/AdminCreatorDetail'

export default async function AdminCreatorDetailPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <AdminLayoutClient>
      <AdminCreatorDetail />
    </AdminLayoutClient>
  )
}
```

- [ ] **Step 7: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 8: Commit**

```bash
git add components/admin/ app/admin/
git commit -m "feat: add admin dashboard UI (login, creators list, add creator, detail, commission manager)"
```

---

## Task 11: Database Migration + Seed Cole Sidner

**Files:**
- Create: `scripts/migrate-creators.ts`

This task creates the tables in production and seeds Cole Sidner as the first creator.

- [ ] **Step 1: Create migration script**

Create `scripts/migrate-creators.ts`:

```typescript
/**
 * Creator System Migration
 *
 * Run: npx tsx scripts/migrate-creators.ts
 *
 * Creates 4 tables (creators, creator_clicks, creator_referrals, creator_commissions)
 * and seeds Cole Sidner as the first creator.
 *
 * Requires POSTGRES_URL and STRIPE_SECRET_KEY env vars.
 */

import { sql } from '@vercel/postgres'
import Stripe from 'stripe'

async function migrate() {
  console.log('Creating creator tables...')

  // Import the table creation function
  const { createCreatorTables } = await import('../lib/creators/db')
  await createCreatorTables()
  console.log('Tables created successfully.')

  // Seed Cole Sidner
  console.log('Seeding Cole Sidner...')

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })

  // Create Stripe coupon
  const coupon = await stripe.coupons.create({
    percent_off: 10,
    duration: 'forever',
    name: 'Creator: Cole Sidner (COLE10)',
  })
  console.log('Stripe coupon created:', coupon.id)

  // Create promotion code
  const promoCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: 'COLE10',
  })
  console.log('Stripe promo code created:', promoCode.id)

  // Insert creator
  await sql`
    INSERT INTO creators (name, email, coupon_code, stripe_coupon_id, stripe_promo_code_id, customer_discount_pct, commission_rate, referral_slug, status)
    VALUES ('Cole Sidner', 'cole.sidner@gmail.com', 'COLE10', ${coupon.id}, ${promoCode.id}, 10, 2000, 'cole', 'active')
    ON CONFLICT (email) DO NOTHING
  `
  console.log('Cole Sidner seeded successfully.')

  // Verify
  const result = await sql`SELECT id, name, email, coupon_code, referral_slug, status FROM creators`
  console.log('All creators:', result.rows)
}

migrate()
  .then(() => {
    console.log('Migration complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
```

- [ ] **Step 2: Verify the script compiles**

Run: `npx tsc --noEmit scripts/migrate-creators.ts 2>&1 | head -10`

If tsc can't handle standalone scripts, just verify the syntax: `npx tsx --eval "console.log('ok')"`

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-creators.ts
git commit -m "feat: add creator migration script (4 tables + Cole Sidner seed with Stripe coupon)"
```

- [ ] **Step 4: Run migration against database**

Run: `npx tsx scripts/migrate-creators.ts`

Expected: Tables created, Stripe coupon + promo code created, Cole Sidner inserted.

**Note:** This requires `POSTGRES_URL` and `STRIPE_SECRET_KEY` to be set. If running locally, ensure `.env.local` is configured. If deploying first, this can be run via `vercel env pull && npx tsx scripts/migrate-creators.ts`.

---

## Task 12: Verify End-to-End Build

- [ ] **Step 1: Run full build**

Run: `cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website" && npx next build 2>&1 | tail -40`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify all new routes are compiled**

Check the build output for:
- `/creators/login`
- `/creators/dashboard`
- `/admin/login`
- `/admin/creators`
- `/admin/creators/new`
- `/admin/creators/[id]`
- `/api/creators/auth/magic-link`
- `/api/creators/auth/verify`
- `/api/creators/auth/logout`
- `/api/creators/dashboard`
- `/api/creators/track-click`
- `/api/admin/auth/magic-link`
- `/api/admin/auth/verify`
- `/api/admin/auth/logout`
- `/api/admin/creators`
- `/api/admin/creators/[id]`
- `/api/admin/creators/[id]/commissions`
- `/api/admin/creators/[id]/commissions/approve`
- `/api/admin/creators/[id]/commissions/mark-paid`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete creator/affiliate system — attribution, dashboards, commission tracking"
```
