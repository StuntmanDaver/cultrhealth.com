# Phase 2: Checkout Integration - Research

**Researched:** 2026-03-16
**Domain:** Stripe webhook orchestration, SiPhox API order fulfillment, Vercel cron jobs, deferred fulfillment patterns
**Confidence:** HIGH

## Summary

Phase 2 wires the existing SiPhox API client (Phase 1) into the Stripe checkout pipeline so that kit orders are created automatically when eligible members subscribe. The integration surface is narrow: the Stripe webhook handler (`app/api/webhook/stripe/route.ts`) needs SiPhox fulfillment logic in `handleCheckoutCompleted`, the refund handler needs a notification path, and a new cron route retries failed/deferred orders.

The checkout flow currently uses **Stripe Payment Links** (redirect-based, no server-side Checkout Sessions) for subscriptions. The Core tier $135 add-on requires migrating Core checkout to a **Stripe Checkout Session** (server-side), since Payment Links cannot dynamically add optional one-time items. Stripe's `optional_items` parameter on Checkout Sessions allows exactly this -- presenting the blood test as an optional add-on the customer can accept or decline during checkout.

**Primary recommendation:** Extend the existing Stripe webhook handler with non-fatal SiPhox fulfillment, add a single cron route for retry/deferred processing, migrate Core checkout to Checkout Sessions for the add-on, and use `siphox_kit_orders` table extension for fulfillment state tracking.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use **intake form data** as the shipping address source (already in DB as intake_data JSONB)
- If intake not yet submitted at checkout time: **queue the order** with status `pending_intake` -- fulfill automatically when intake is submitted later
- Always pull the **latest address at fulfillment time** (not at checkout time) -- if member updates address before fulfillment, newest wins
- Send **email confirmation** via Resend when a queued kit order is fulfilled: "Your blood test kit has been ordered and will ship to [address]"
- If SiPhox API is down at checkout: **queue for automatic retry** -- subscription still activates immediately, kit order is deferred
- Retry mechanism: **Vercel cron job** running every **15 minutes**
- **3 retry attempts** max, then mark as `failed` and email support with full context
- **Credits exhausted is different from API down**: immediate alert to admin, no retry -- mark order as `needs_credits` so cron skips it
- Cron alerts on **problems only** -- no daily digest, no noise on normal operations
- **Single cron route** handles both: (1) failed orders needing retry and (2) deferred orders where intake is now available
- Runs every **15 minutes**
- Protected by **Vercel cron header check** (`Authorization: Bearer <CRON_SECRET>`)
- **Never auto-cancel** SiPhox kit orders on refund -- email support with full context instead, let humans decide
- Full context in refund email: member name/email, plan tier, SiPhox order ID, current kit status, refund amount, suggested action
- **Any refund triggers notification** (full or partial) -- if there's a SiPhox order associated, support should know
- **Subscription cancellation (cancel-at-period-end) does NOT trigger notification** -- member paid for this period, they're entitled to the kit
- **5 fulfillment statuses**: `pending_intake` (waiting for address), `pending_fulfillment` (ready to order), `processing` (SiPhox API called), `fulfilled` (confirmed by SiPhox), `failed` (max retries or no credits)
- Store **retry_count** (int) and **last_error** (text) columns for debugging
- **Extend existing `siphox_kit_orders` table** with fulfillment columns via migration (not a new table)
- Add `stripe_checkout_session_id` column to link back to the originating checkout

### Claude's Discretion
- Core tier $135 add-on checkout mechanism (separate payment link, Checkout Sessions API, or post-checkout upsell)
- Exact cron route implementation details
- Email template design for kit fulfillment confirmation and refund notifications
- Whether to add a `needs_credits` status distinct from `failed`, or use `failed` with a reason field

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHK-01 | Auto-order SiPhox kit on Catalyst+/Concierge subscription checkout via Stripe webhook | Webhook handler extension pattern documented; SiPhox `createCustomer()` + `createOrder()` APIs ready from Phase 1; address resolution from intake_data JSONB |
| CHK-02 | $135 optional blood test add-on line item for Core tier at checkout | Stripe Checkout Sessions `optional_items` parameter supports one-time items alongside subscriptions; requires migrating Core from Payment Link to Checkout Session |
| CHK-03 | Deferred order fulfillment pattern for address resolution from checkout data | `pending_intake` status + cron job pattern; address stored in `asher_orders` table (via intake submit route) and `pending_intakes.intake_data` JSONB |
| CHK-04 | Non-fatal SiPhox order failure handling (email support, don't block subscription) | Existing try/catch non-fatal pattern in webhook; `withRetry()` utility in `lib/resilience.ts`; cron retry with 3 max attempts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Stripe | ^20.2.0 | Checkout Sessions, webhooks, subscription management | Already installed; API version `2026-02-25.clover` |
| @vercel/postgres | ^0.10.0 | Database queries for fulfillment state | Already installed; all DB access uses this |
| Resend | ^4.0.0 | Email notifications (fulfillment confirmation, refund alerts) | Already installed; `baseEmailTemplate()` pattern established |
| Zod | ^3.23.0 | Input validation for cron route, webhook data | Already installed; SiPhox schemas use Zod |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SiPhox client (`lib/siphox/client.ts`) | Phase 1 | `createCustomer()`, `createOrder()`, `checkCreditBalance()` | Kit fulfillment in webhook and cron |
| SiPhox db (`lib/siphox/db.ts`) | Phase 1 | `upsertSiphoxCustomer()`, `insertKitOrder()`, `updateKitOrderStatus()` | All kit order DB operations |
| Resilience (`lib/resilience.ts`) | Existing | `withRetry()` for transient failures | SiPhox API calls within webhook handler |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout Sessions for Core add-on | Separate Payment Link for blood test | Payment Link can't conditionally appear alongside subscription; customer has to do two checkouts |
| Vercel cron for retry | Upstash QStash | QStash adds dependency; Vercel cron is simpler and already used by approve-commissions and update-tiers |
| `needs_credits` as distinct status | `failed` with reason field | Distinct status is cleaner for cron query (`WHERE fulfillment_status NOT IN ('needs_credits', 'fulfilled', 'failed')`) and prevents accidental retry |

**Recommendation on Claude's Discretion items:**
1. **Core add-on mechanism:** Use Stripe Checkout Sessions API. Create a new route `app/api/checkout/subscription/route.ts` that builds a server-side Checkout Session with the subscription price as a `line_item` and the $135 blood test as an `optional_item`. This replaces the Payment Link redirect for Core only. Catalyst+ and Concierge can continue using Payment Links since they always include the kit.
2. **`needs_credits` as distinct status:** Use a distinct 6th status value. This makes the cron query simpler and prevents accidental retry of credit-exhaustion failures (which won't resolve on their own).

## Architecture Patterns

### Integration Flow
```
Stripe Checkout (Payment Link or Checkout Session)
  |
  v
checkout.session.completed webhook
  |
  +---> createMembership() [existing]
  +---> processAttribution() [existing]
  +---> sendWelcomeEmail() [existing]
  +---> triggerSiphoxFulfillment() [NEW, non-fatal]
         |
         +---> Check tier eligibility (catalyst/concierge = auto, core = check metadata)
         +---> Look up intake address from asher_orders/pending_intakes
         +---> If no address: insert kit order with status pending_intake
         +---> If address found: call SiPhox createCustomer + createOrder
         +---> On success: insert kit order with status fulfilled
         +---> On API failure: insert kit order with status pending_fulfillment, cron will retry
         +---> On credit exhaustion: insert with status needs_credits, email admin

charge.refunded webhook
  |
  +---> handleRefundReversal() [existing]
  +---> notifySiphoxRefund() [NEW, non-fatal]
         |
         +---> Look up siphox_kit_orders by stripe_checkout_session_id
         +---> If found: email support with full context
         +---> Never auto-cancel the SiPhox order

Vercel Cron (every 15 min)
  |
  +---> Process pending_intake orders (check if intake now submitted)
  +---> Process pending_fulfillment orders (retry SiPhox API call)
  +---> Skip needs_credits orders
  +---> Mark as failed after 3 retries, email support
```

### File Structure (new/modified files)
```
lib/siphox/
├── client.ts              # Existing - no changes needed
├── db.ts                  # MODIFY - add fulfillment query functions
├── fulfillment.ts         # NEW - orchestration logic (triggerSiphoxFulfillment, processDeferredOrders)
├── schemas.ts             # Existing - no changes
├── types.ts               # Existing - no changes
├── errors.ts              # Existing - no changes
└── index.ts               # MODIFY - export new functions

app/api/
├── webhook/stripe/route.ts          # MODIFY - add SiPhox fulfillment + refund notification
├── cron/siphox-fulfillment/route.ts # NEW - cron for retry + deferred
└── checkout/subscription/route.ts   # NEW - Checkout Session for Core with optional add-on

lib/resend.ts              # MODIFY - add sendKitFulfillmentEmail, sendSiphoxRefundAlert

migrations/
└── 021_siphox_fulfillment_columns.sql  # NEW - extend siphox_kit_orders
```

### Pattern 1: Non-Fatal Webhook Extension
**What:** Add SiPhox fulfillment to `handleCheckoutCompleted` inside a try/catch that never throws.
**When to use:** Every time the webhook adds a new side-effect.
**Example:**
```typescript
// In handleCheckoutCompleted, AFTER membership creation (which throws on failure)
// SiPhox fulfillment is non-fatal -- subscription activates regardless
try {
  const { triggerSiphoxFulfillment } = await import('@/lib/siphox/fulfillment')
  await triggerSiphoxFulfillment({
    customerEmail,
    planTier,
    stripeCheckoutSessionId: session.id,
    stripeSubscriptionId: subscriptionId,
  })
} catch (siphoxError) {
  console.error('SiPhox fulfillment failed (non-fatal):', siphoxError)
  // Order is queued for cron retry -- don't throw
}
```

### Pattern 2: Cron Route with Vercel Auth
**What:** GET handler protected by `CRON_SECRET`, matching existing approve-commissions and update-tiers pattern.
**When to use:** The single cron route for all SiPhox fulfillment retries.
**Example:**
```typescript
// Source: existing pattern from app/api/cron/approve-commissions/route.ts
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { processDeferredOrders, retryFailedOrders } = await import('@/lib/siphox/fulfillment')

  const deferredResult = await processDeferredOrders()
  const retryResult = await retryFailedOrders()

  return NextResponse.json({
    success: true,
    deferred: deferredResult,
    retried: retryResult,
    timestamp: new Date().toISOString(),
  })
}
```

### Pattern 3: Stripe Checkout Session with Optional Items (Core Add-On)
**What:** Server-side Checkout Session creation with subscription line item + optional one-time blood test.
**When to use:** Core tier checkout only (Catalyst+/Concierge always include kit).
**Example:**
```typescript
// Source: Stripe Checkout Sessions API docs
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: email,
  line_items: [{
    price: CORE_STRIPE_PRICE_ID,  // $199/mo recurring
    quantity: 1,
  }],
  optional_items: [{
    price: BLOOD_TEST_PRICE_ID,   // $135 one-time
    quantity: 1,
    adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 },
  }],
  metadata: { plan_tier: 'core' },
  success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing`,
})
```

### Anti-Patterns to Avoid
- **Throwing in SiPhox webhook code:** NEVER throw from SiPhox fulfillment -- subscription activation is the primary concern; kit ordering is secondary.
- **Storing address at checkout time:** Always fetch the latest address at fulfillment time, not when the webhook fires. Member may submit intake after checkout.
- **Retrying credit exhaustion:** Credit-exhausted orders will never succeed without manual intervention. Use `needs_credits` status and skip in cron.
- **Auto-canceling SiPhox orders on refund:** SiPhox credits may already be consumed. Humans must decide. Always email support instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with backoff | Custom retry loops | `withRetry()` from `lib/resilience.ts` | Already handles exponential backoff, configurable max attempts |
| Idempotent webhook processing | Custom dedup | `isStripeEventProcessed()` from `lib/db.ts` | Already handles event dedup via `stripe_idempotency` table |
| Email notifications | Custom SMTP/SES | `lib/resend.ts` + `baseEmailTemplate()` | Brand-consistent dark theme templates, lazy Resend client |
| Cron auth | Custom middleware | `CRON_SECRET` Bearer check (3 lines) | Established pattern in 2 existing cron routes |
| SiPhox API calls | Raw fetch | `lib/siphox/client.ts` functions | Zod validation, error wrapping, auth header management |
| Customer creation | Multi-step API dance | `upsertSiphoxCustomer()` + `createCustomer()` from Phase 1 | Handles existing customer lookup, conflict resolution |

## Common Pitfalls

### Pitfall 1: Webhook Handler Timeout
**What goes wrong:** SiPhox API call adds latency to webhook handler; if total exceeds Vercel function timeout (10s default), webhook returns 500 and Stripe retries.
**Why it happens:** SiPhox API call is synchronous in the webhook, compounding with existing Stripe customer retrieval, DB writes, attribution processing, and email sending.
**How to avoid:** Set fulfillment to `pending_fulfillment` immediately (fast DB write), then attempt SiPhox API call with a short timeout (5s). If timeout, the cron retries. Never let SiPhox block the webhook response.
**Warning signs:** Webhook handler taking > 8s in Vercel function logs.

### Pitfall 2: Checkout Session ID vs Payment Link
**What goes wrong:** Payment Links generate their own `checkout.session.completed` events, but `session.id` differs from the payment link URL. Catalyst+/Concierge use Payment Links; Core will use Checkout Sessions.
**Why it happens:** Two different checkout mechanisms produce differently-structured sessions.
**How to avoid:** Always read `session.metadata?.plan_tier` to determine kit eligibility -- not the checkout mechanism. Store `session.id` as `stripe_checkout_session_id` uniformly.
**Warning signs:** Missing `plan_tier` metadata on Payment Link sessions.

### Pitfall 3: Address Not Available at Checkout Time
**What goes wrong:** Member pays for subscription but hasn't submitted intake form yet (intake happens after checkout). SiPhox order requires a shipping address.
**Why it happens:** The CULTR flow is: checkout -> intake -> fulfillment. Address comes from intake, not checkout.
**How to avoid:** Check `asher_orders` or `pending_intakes` for address data. If absent, set status to `pending_intake`. Cron job checks every 15 min.
**Warning signs:** Kit orders stuck in `pending_intake` for > 24 hours (member abandoned intake).

### Pitfall 4: SiPhox Customer Mapping Gap
**What goes wrong:** SiPhox customer requires phone_e164 (from portal auth), but Stripe webhook only has email. Can't create SiPhox customer without phone.
**Why it happens:** `siphox_customers` table is keyed on `phone_e164`. Stripe checkout only reliably provides email.
**How to avoid:** Look up member's phone from `portal_sessions` (if portal auth was used) or from intake form data in `asher_orders` table. If no phone found, defer to cron (same as pending_intake).
**Warning signs:** Unable to find phone for customer -- falls through to deferred.

### Pitfall 5: Duplicate Kit Orders on Webhook Retry
**What goes wrong:** Stripe retries webhook, SiPhox fulfillment runs again, creates duplicate order.
**Why it happens:** `isStripeEventProcessed()` catches the duplicate webhook, but if the first attempt failed after SiPhox call but before `recordStripeEvent()`, the retry could double-order.
**How to avoid:** Check for existing `siphox_kit_orders` row with matching `stripe_checkout_session_id` before calling SiPhox API. This is the fulfillment-level idempotency check.
**Warning signs:** Multiple kit orders for same subscription in `siphox_kit_orders` table.

### Pitfall 6: Vercel Cron Hobby Plan Limitation
**What goes wrong:** Cron set to every 15 minutes fails on Vercel Hobby plan (limited to daily).
**Why it happens:** Vercel Hobby plans restrict cron to once per day minimum interval.
**How to avoid:** Confirm the project is on Vercel Pro plan (likely, given staging + production deployments). If Hobby, fall back to manual retry or longer interval.
**Warning signs:** Deployment error: "Hobby accounts are limited to daily cron jobs."

## Code Examples

### Address Resolution from Intake Data
```typescript
// Source: intake submit route pattern (app/api/intake/submit/route.ts)
// Address is stored in asher_orders table via intake submission
async function resolveShippingAddress(customerEmail: string): Promise<ShippingAddress | null> {
  const { sql } = await import('@vercel/postgres')

  // Try asher_orders first (completed intakes store full data)
  const asherResult = await sql`
    SELECT
      ao.id,
      pi.intake_data
    FROM asher_orders ao
    LEFT JOIN pending_intakes pi ON pi.id = ao.pending_intake_id
    WHERE lower(ao.customer_email) = lower(${customerEmail})
    ORDER BY ao.created_at DESC
    LIMIT 1
  `

  // The intake form stores shippingAddress in the submission body
  // which gets written to asher_orders via the intake submit route
  // Address fields: address1, city, state (stateAbbreviation), zipCode, country
  if (asherResult.rows[0]?.intake_data?.shippingAddress) {
    const addr = asherResult.rows[0].intake_data.shippingAddress
    return {
      street1: addr.address1,
      street2: addr.address2 || undefined,
      city: addr.city,
      state: addr.stateAbbreviation || addr.state,
      zip: addr.zipCode,
      country: addr.country || 'US',
    }
  }

  return null
}
```

### Migration: Extend siphox_kit_orders
```sql
-- Migration 021: Add fulfillment tracking columns to siphox_kit_orders
-- Extends Phase 1 table for checkout integration fulfillment pipeline

ALTER TABLE siphox_kit_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'pending_fulfillment',
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50);

-- For cron job: find orders needing processing
CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_fulfillment_status
  ON siphox_kit_orders (fulfillment_status)
  WHERE fulfillment_status IN ('pending_intake', 'pending_fulfillment');

-- For refund lookup: find orders by checkout session
CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_checkout_session
  ON siphox_kit_orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON COLUMN siphox_kit_orders.fulfillment_status IS
  'pending_intake | pending_fulfillment | processing | fulfilled | failed | needs_credits';
```

### Vercel Cron Configuration
```json
// Add to vercel.json
{
  "crons": [
    {
      "path": "/api/cron/siphox-fulfillment",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Kit Order Fulfillment Check (Idempotency)
```typescript
// Check for existing kit order before creating a new one
async function hasExistingKitOrder(stripeCheckoutSessionId: string): Promise<boolean> {
  const { sql } = await import('@vercel/postgres')
  const result = await sql`
    SELECT id FROM siphox_kit_orders
    WHERE stripe_checkout_session_id = ${stripeCheckoutSessionId}
    LIMIT 1
  `
  return result.rows.length > 0
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payment Links only | Checkout Sessions + Payment Links | Stripe 2024+ | Checkout Sessions support `optional_items` for add-ons; Payment Links cannot |
| `vercel.json` crons | `vercel.json` crons (same) | Stable | Pro plan supports `*/15 * * * *` schedule; Hobby limited to daily |
| Manual order creation | SiPhox API client (Phase 1) | Phase 1 | `createCustomer()` + `createOrder()` fully typed with Zod validation |

**Key architectural note:** The current checkout flow uses Stripe Payment Links (redirect-based). These Payment Links already include `plan_tier` in the metadata, which flows into the `checkout.session.completed` webhook via `session.metadata?.plan_tier`. This is the tier detection mechanism for SiPhox eligibility.

## Open Questions

1. **Stripe `optional_items` on API version `2026-02-25.clover`**
   - What we know: The Stripe docs describe `optional_items` for Checkout Sessions. The project uses `stripe@^20.2.0` with API version `2026-02-25.clover`.
   - What's unclear: Whether `optional_items` is fully supported in this specific API version or requires a newer one.
   - Recommendation: Test in sandbox first. If `optional_items` is unavailable, fall back to adding the blood test as a regular `line_item` with `adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 }` (this is the older approach to optional items).

2. **Phone Number Availability in Webhook Context**
   - What we know: SiPhox customer creation requires phone. Stripe webhooks provide email reliably but not phone.
   - What's unclear: Whether all members will have phone in `portal_sessions` or `asher_orders` at checkout time.
   - Recommendation: Use email as the primary lookup key for address + phone from `asher_orders` and `pending_intakes`. If phone is missing, defer to `pending_intake` status. The intake form always collects phone.

3. **SiPhox `createOrder` Address Format Validation**
   - What we know: `CreateSiphoxOrderRequest` expects `address.street1, city, state, zip, country`.
   - What's unclear: Whether SiPhox validates US addresses strictly (e.g., USPS validation).
   - Recommendation: Pass address as-is from intake data. If SiPhox rejects it, the error will be captured in `last_error` and the order falls to `failed` status after retries.

4. **Blood Test Stripe Price ID**
   - What we know: A one-time $135 price needs to exist in Stripe for the optional_items parameter.
   - What's unclear: Whether this price already exists or needs to be created in Stripe dashboard.
   - Recommendation: Check Stripe dashboard during implementation. If not found, create a one-time $135 product/price. Store the price ID in `lib/config/plans.ts` as `BLOOD_TEST_PRICE_ID`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHK-01 | Webhook triggers SiPhox fulfillment for catalyst/concierge | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-01 | Tier eligibility detection from session metadata | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-02 | Checkout Session created with optional blood test item | unit | `npx vitest run tests/api/checkout-subscription.test.ts -x` | Wave 0 |
| CHK-03 | Deferred order created when no address available | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-03 | Cron processes deferred orders when intake submitted | unit | `npx vitest run tests/api/cron-siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-04 | SiPhox failure does not throw in webhook handler | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-04 | Cron retries failed orders up to 3 times | unit | `npx vitest run tests/api/cron-siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-04 | Credits exhausted sets needs_credits, emails admin | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |
| CHK-04 | Refund triggers support notification email | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/siphox-fulfillment.test.ts` -- covers CHK-01, CHK-03, CHK-04 (fulfillment logic)
- [ ] `tests/api/cron-siphox-fulfillment.test.ts` -- covers CHK-03, CHK-04 (cron retry/deferred)
- [ ] `tests/api/checkout-subscription.test.ts` -- covers CHK-02 (Checkout Session with optional items)

## Sources

### Primary (HIGH confidence)
- **Codebase inspection:** `app/api/webhook/stripe/route.ts` (818 lines) -- existing webhook patterns, idempotency, dynamic imports, non-fatal try/catch
- **Codebase inspection:** `app/api/cron/approve-commissions/route.ts` and `update-tiers/route.ts` -- Vercel cron auth pattern
- **Codebase inspection:** `lib/siphox/client.ts`, `lib/siphox/db.ts` -- Phase 1 SiPhox API surface
- **Codebase inspection:** `lib/config/plans.ts` -- Tier definitions, Payment Link URLs, Stripe price IDs
- **Codebase inspection:** `app/api/checkout/route.ts` -- Current Payment Link redirect flow
- **Codebase inspection:** `migrations/020_siphox_tables.sql` -- Existing table schema

### Secondary (MEDIUM confidence)
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs) -- Schedule syntax, Pro plan minimum interval (once per minute), `CRON_SECRET` auth header
- [Vercel Cron Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) -- Hobby = daily only, Pro = per-minute, 100 crons/project max
- [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create) -- `optional_items` parameter, mixed subscription + one-time line items
- [Stripe Optional Items Docs](https://docs.stripe.com/payments/checkout/optional-items) -- Max 10 optional items, `adjustable_quantity` config

### Tertiary (LOW confidence)
- Stripe `optional_items` API version availability -- not confirmed against `2026-02-25.clover`; test in sandbox

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use; no new dependencies
- Architecture: HIGH -- extends existing webhook handler with established patterns (non-fatal try/catch, dynamic imports, cron auth)
- Pitfalls: HIGH -- based on direct codebase inspection of data flow (checkout -> intake -> address), webhook structure, and known timing issues
- Core add-on mechanism: MEDIUM -- Stripe `optional_items` is documented but untested against this specific API version

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack, no fast-moving dependencies)
