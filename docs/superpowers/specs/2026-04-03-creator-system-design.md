# Creator/Affiliate System Design

**Date:** 2026-04-03
**Status:** Approved
**First Creator:** Cole Sidner (Cole.sidner@gmail.com) — 20% commission, 10% customer discount, code `COLE10`, ref slug `cole`

---

## Overview

A creator/affiliate system that lets creators refer customers to CULTR Health memberships via promo codes and tracking links. Creators earn recurring commissions on every payment from referred customers. Both creators and admins have dashboards to track performance.

## Database Schema

All money values stored as INTEGER cents to avoid @vercel/postgres NUMERIC-as-string coercion issues.

### Table: `creators`

```sql
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  coupon_code TEXT NOT NULL UNIQUE,
  stripe_coupon_id TEXT,
  stripe_promo_code_id TEXT,
  customer_discount_pct INTEGER NOT NULL DEFAULT 10,
  commission_rate INTEGER NOT NULL DEFAULT 2000, -- basis points (2000 = 20%)
  referral_slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `creator_clicks`

Tracks every visit via a referral link. Used for conversion rate metrics.

```sql
CREATE TABLE creator_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  landing_page TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_clicks_creator_id ON creator_clicks(creator_id);
CREATE INDEX idx_creator_clicks_created_at ON creator_clicks(created_at);
```

### Table: `creator_referrals`

One row per attributed customer signup.

```sql
CREATE TABLE creator_referrals (
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
);

CREATE INDEX idx_creator_referrals_creator_id ON creator_referrals(creator_id);
CREATE INDEX idx_creator_referrals_stripe_customer_id ON creator_referrals(stripe_customer_id);
```

### Table: `creator_commissions`

Ledger of all commission events. One row per payment (initial + recurring).

```sql
CREATE TABLE creator_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  referral_id UUID NOT NULL REFERENCES creator_referrals(id),
  stripe_invoice_id TEXT,
  gross_amount_cents INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL, -- basis points at time of calculation
  commission_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_commissions_creator_id ON creator_commissions(creator_id);
CREATE INDEX idx_creator_commissions_status ON creator_commissions(status);
```

## Attribution Flow

### Step 1: Referral Link Capture (Middleware)

Create `middleware.ts` at the project root.

When any request has `?ref=<slug>`:
1. Look up the slug (no DB call — just set cookie, validate later)
2. Set cookie `cultr_ref=<slug>` with `maxAge: 30 days`, `domain: '.cultrhealth.com'` in production, `path: '/'`
3. Record a click: POST to `/api/creators/track-click` (fire-and-forget via `fetch` from middleware, or defer to a server component)

**Important:** Middleware in Next.js Edge Runtime cannot do direct Postgres queries. Click tracking must be via an internal API call or deferred to the page load.

### Step 2: Checkout Integration

**`app/join/[tier]/page.tsx`:**
- On mount, read `cultr_ref` cookie (client-side via `document.cookie` or a utility)
- Pass `ref` value in the checkout POST body

**`app/api/checkout/route.ts`:**
- Read `ref` from request body
- Read `cultr_ref` cookie from request headers as fallback
- Add to Stripe session metadata: `{ ...sessionMetadata, creator_ref: ref }`
- If a ref is present, also look up the creator's `stripe_promo_code_id` and apply it via `discounts: [{ promotion_code: stripe_promo_code_id }]` instead of relying on `allow_promotion_codes`
  - Keep `allow_promotion_codes: true` as fallback for manual code entry

### Step 3: Webhook Attribution (`checkout.session.completed`)

In `handleCheckoutCompleted`:

1. Check `session.metadata.creator_ref` for referral link attribution
2. If no ref metadata, check if a promotion code was used:
   - Retrieve session with expanded discounts: `stripe.checkout.sessions.retrieve(session.id, { expand: ['total_details.breakdown'] })`
   - Extract the promotion code ID from `session.total_details.breakdown.discounts[0].discount.promotion_code`
   - Retrieve the promotion code: `stripe.promotionCodes.retrieve(promoCodeId)`
   - Match `promotionCode.code` against `creators.coupon_code`
3. If creator found by either method:
   - Insert into `creator_referrals`
   - Insert initial `creator_commissions` row (status: 'pending')
   - **Write `creator_id` into Stripe subscription metadata** via `stripe.subscriptions.update(subscriptionId, { metadata: { creator_id: creatorId } })` — this enables recurring commission attribution
   - Update `creator_clicks` row to `converted = true` if matching IP hash exists within 30 days

### Step 4: Recurring Commissions (`invoice.payment_succeeded`)

In `handlePaymentSucceeded`:

1. Get the subscription from the invoice: `invoice.subscription`
2. If subscription has `metadata.creator_id`:
   - Look up the referral in `creator_referrals` by `stripe_subscription_id`
   - Look up the creator's current `commission_rate`
   - Calculate commission: `commission_amount_cents = Math.round(invoice.amount_paid * commission_rate / 10000)`
   - Insert new `creator_commissions` row (status: 'pending')

**Commission formula:** 20% of net revenue (amount customer actually paid, after discount).
- Example: $149 plan, 10% discount = $134.10 paid. Commission = 20% of $134.10 = $26.82

## Creator Authentication

Separate auth flow from member auth to avoid cookie collision.

### Constants
- Cookie: `cultr_creator_session`
- JWT payload: `{ email, creatorId, type: 'creator_session' }`
- Expiry: 7 days
- Magic link expiry: 15 minutes

### Auth Files
- `lib/creator-auth.ts` — `createCreatorMagicLinkToken()`, `verifyCreatorMagicLinkToken()`, `createCreatorSessionToken()`, `verifyCreatorSessionToken()`, `getCreatorSession()`, `setCreatorSessionCookie()`, `clearCreatorSession()`
- `app/api/creators/auth/magic-link/route.ts` — Sends magic link if email exists in `creators` table
- `app/api/creators/auth/verify/route.ts` — Verifies token, creates session
- `app/api/creators/auth/logout/route.ts` — Clears creator session cookie

### Login Flow
1. Creator enters email at `/creators/login`
2. API checks email exists in `creators` table AND status = 'active'
3. Magic link email sent via Resend
4. Creator clicks link → session cookie set → redirect to `/creators/dashboard`

## Creator Dashboard (`/creators/dashboard`)

Protected by `getCreatorSession()` check.

### Overview Section
- Total referrals (all time)
- Total earnings (all time, sum of commission_amount_cents where status != 'pending')
- Pending commissions (sum where status = 'pending')
- Conversion rate (referrals / clicks * 100)
- Current month referrals + earnings

### Referrals Table
- Customer email (masked: `j***@gmail.com`)
- Plan tier
- Attribution method (badge: "Promo Code" or "Referral Link")
- Date
- Status of subscription (active/cancelled)

### Commissions Table
- Date
- Amount
- Status (pending/approved/paid) with color-coded badges
- Associated plan tier

### Promo Tools Section
- Promo code displayed prominently with copy button: `COLE10`
- Referral link with copy button: `https://join.cultrhealth.com?ref=cole`
- QR code for the referral link (nice-to-have, not MVP)

## Admin Dashboard (`/admin/creators`)

Protected by `isProviderEmail()` check (existing pattern from `lib/auth.ts`).

### Admin Auth
- Separate admin magic link flow: `/api/admin/auth/magic-link` sends link only if `isProviderEmail(email)` returns true
- Session cookie: `cultr_admin_session` with JWT payload `{ email, type: 'admin_session' }`
- Does NOT require a Stripe subscription — admin access is email-allowlist only
- `getAdminSession()` helper in `lib/admin-auth.ts`
- Admin auth routes: `/api/admin/auth/magic-link`, `/api/admin/auth/verify`, `/api/admin/auth/logout`

### Creators List View (`/admin/creators`)
- Table: Name, email, code, referral slug, referrals count, total commissions, status
- Status toggle (active/paused/inactive)
- "Add Creator" button → modal/page form

### Creator Detail View (`/admin/creators/[id]`)
- Creator profile info (editable)
- Full referral history (unmasked emails)
- Full commission history with status management
- Bulk actions: Approve pending commissions, Mark as paid
- Performance metrics: clicks, conversions, conversion rate, earnings trend

### Add Creator Flow (`/admin/creators/new`)
Form fields:
- Name
- Email
- Coupon code
- Referral slug
- Customer discount % (default 10)
- Commission rate basis points (default 2000 = 20%)

On submit, the API:
1. Creates Stripe coupon via `stripe.coupons.create({ percent_off: discount_pct, duration: 'forever' })`
2. Creates Stripe promotion code via `stripe.promotionCodes.create({ coupon: couponId, code: couponCode })`
3. Inserts `creators` row with all Stripe IDs
4. Returns success

## API Routes

### Creator-facing
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/creators/auth/magic-link` | POST | Send creator magic link |
| `/api/creators/auth/verify` | GET | Verify magic link token |
| `/api/creators/auth/logout` | POST | Clear creator session |
| `/api/creators/dashboard` | GET | Dashboard data (referrals, commissions, clicks) |
| `/api/creators/track-click` | POST | Record referral link click (called from middleware) |

### Admin auth
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/auth/magic-link` | POST | Send admin magic link (isProviderEmail gate) |
| `/api/admin/auth/verify` | GET | Verify admin magic link token |
| `/api/admin/auth/logout` | POST | Clear admin session |

### Admin-facing (all gated by `getAdminSession()`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/creators` | GET | List all creators with stats |
| `/api/admin/creators` | POST | Add new creator (+ Stripe coupon creation) |
| `/api/admin/creators/[id]` | GET | Creator detail with full history |
| `/api/admin/creators/[id]` | PATCH | Update creator (status, rates) |
| `/api/admin/creators/[id]/commissions` | GET | Commission history for creator |
| `/api/admin/creators/[id]/commissions/approve` | POST | Bulk approve pending commissions |
| `/api/admin/creators/[id]/commissions/mark-paid` | POST | Bulk mark as paid |

## File Structure

```
lib/
  creator-auth.ts           # Creator session/JWT management
  admin-auth.ts             # Admin session/JWT management (isProviderEmail gate)
  creators/
    db.ts                   # Creator DB queries (CRUD, stats, commissions)
    commission.ts           # Commission calculation helpers
    attribution.ts          # Attribution logic (ref + promo code matching)

app/
  api/
    creators/
      auth/
        magic-link/route.ts
        verify/route.ts
        logout/route.ts
      dashboard/route.ts
      track-click/route.ts
    admin/
      auth/
        magic-link/route.ts
        verify/route.ts
        logout/route.ts
      creators/
        route.ts            # GET list, POST new
        [id]/
          route.ts          # GET detail, PATCH update
          commissions/
            route.ts        # GET commissions
            approve/route.ts
            mark-paid/route.ts

  creators/
    login/page.tsx          # Creator login page
    dashboard/
      page.tsx              # Creator dashboard
      layout.tsx            # Creator dashboard layout (sidebar, session check)

  admin/
    login/page.tsx          # Admin login page
    creators/
      page.tsx              # Admin creators list
      new/page.tsx          # Add creator form
      [id]/page.tsx         # Creator detail view
    layout.tsx              # Admin layout (sidebar, getAdminSession check)

middleware.ts               # Ref cookie capture + click tracking

components/
  creators/
    CreatorLoginForm.tsx
    CreatorDashboardOverview.tsx
    CreatorReferralsTable.tsx
    CreatorCommissionsTable.tsx
    CreatorPromoTools.tsx
  admin/
    AdminCreatorsList.tsx
    AdminCreatorDetail.tsx
    AdminAddCreatorForm.tsx
    AdminCommissionManager.tsx
    AdminLayout.tsx
```

## Initial Data: Cole Sidner

```sql
INSERT INTO creators (name, email, coupon_code, customer_discount_pct, commission_rate, referral_slug, status)
VALUES ('Cole Sidner', 'cole.sidner@gmail.com', 'COLE10', 10, 2000, 'cole', 'active');
```

Stripe objects created via admin API:
- Coupon: 10% off, forever duration
- Promotion code: `COLE10` linked to that coupon

## Edge Cases

1. **Dual attribution conflict:** Customer arrives via `?ref=cole` but enters a different creator's promo code at checkout. **Promo code wins** — it's the most intentional action.
2. **Self-referral:** A creator signs up using their own code. Allow it — we trust creators, and blocking adds complexity.
3. **Subscription cancellation:** Commissions stop accruing when subscription status changes to `cancelled`. Existing pending commissions remain for admin review.
4. **Creator status change:** Setting a creator to `paused` or `inactive` disables their promo code in Stripe (via `stripe.promotionCodes.update(id, { active: false })`). Existing referrals continue earning commissions.
5. **Rate changes:** If commission rate changes, new commissions use the new rate. Old commissions retain the rate at time of calculation (stored on each commission row).

## Security

- All admin routes gated by `isProviderEmail()` check
- Creator dashboard gated by `getCreatorSession()` with separate cookie
- Click tracking uses IP hash (SHA-256 of IP + daily salt) — no raw IPs stored
- Customer emails in creator dashboard are masked
- Rate limiting on all auth endpoints (existing `strictLimiter`)
- No PHI in any creator tables
