# Phase 2: Checkout Integration - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

When a member completes a Catalyst+, Concierge, or Core+add-on checkout, a SiPhox kit order is created automatically without manual intervention. Includes deferred fulfillment for missing addresses, retry logic for API failures, and refund notification to support. No UI changes. No kit registration. Pure server-side checkout-to-order pipeline.

</domain>

<decisions>
## Implementation Decisions

### Address Resolution
- Use **intake form data** as the shipping address source (already in DB as intake_data JSONB)
- If intake not yet submitted at checkout time: **queue the order** with status `pending_intake` — fulfill automatically when intake is submitted later
- Always pull the **latest address at fulfillment time** (not at checkout time) — if member updates address before fulfillment, newest wins
- Send **email confirmation** via Resend when a queued kit order is fulfilled: "Your blood test kit has been ordered and will ship to [address]"

### Failure & Retry Behavior
- If SiPhox API is down at checkout: **queue for automatic retry** — subscription still activates immediately, kit order is deferred
- Retry mechanism: **Vercel cron job** running every **15 minutes**
- **3 retry attempts** max, then mark as `failed` and email support with full context
- **Credits exhausted is different from API down**: immediate alert to admin, no retry (credits won't replenish on their own) — mark order as `needs_credits` so cron skips it
- Cron alerts on **problems only** — no daily digest, no noise on normal operations

### Cron Job Design
- **Single cron route** handles both: (1) failed orders needing retry and (2) deferred orders where intake is now available
- Runs every **15 minutes**
- Protected by **Vercel cron header check** (`Authorization: Bearer <CRON_SECRET>`) — follows existing cron route pattern (approve-commissions, update-tiers)

### Refund Handling
- **Never auto-cancel** SiPhox kit orders on refund — email support with full context instead, let humans decide
- Full context in refund email: member name/email, plan tier, SiPhox order ID, current kit status, refund amount, suggested action
- **Any refund triggers notification** (full or partial) — if there's a SiPhox order associated, support should know
- **Subscription cancellation (cancel-at-period-end) does NOT trigger notification** — member paid for this period, they're entitled to the kit

### Kit Order Tracking
- **5 fulfillment statuses**: `pending_intake` (waiting for address), `pending_fulfillment` (ready to order), `processing` (SiPhox API called), `fulfilled` (confirmed by SiPhox), `failed` (max retries or no credits)
- Store **retry_count** (int) and **last_error** (text) columns for debugging
- **Extend existing `siphox_kit_orders` table** with fulfillment columns via migration (not a new table)
- Add `stripe_checkout_session_id` column to link back to the originating checkout

### Claude's Discretion
- Core tier $135 add-on checkout mechanism (separate payment link, Checkout Sessions API, or post-checkout upsell)
- Exact cron route implementation details
- Email template design for kit fulfillment confirmation and refund notifications
- Whether to add a `needs_credits` status distinct from `failed`, or use `failed` with a reason field

</decisions>

<specifics>
## Specific Ideas

- The Stripe webhook `checkout.session.completed` handler already routes subscription vs product checkouts — extend the subscription path with SiPhox fulfillment
- The `charge.refunded` handler already exists for commission reversal — add SiPhox notification alongside it
- Existing cron routes at `app/api/cron/` provide the pattern (approve-commissions, update-tiers)
- Tier detection uses `session.metadata?.plan_tier` in the webhook — use this to determine kit eligibility (catalyst, concierge = auto-order; core = check for add-on)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/siphox/client.ts`: `createCustomer()`, `createOrder()`, `checkCreditBalance()` — ready from Phase 1
- `lib/siphox/db.ts`: `upsertSiphoxCustomer()`, `insertKitOrder()` — Phase 1 data access layer
- `lib/resend.ts`: `sendLowCreditAlert()` added in Phase 1, email patterns for new notification types
- `lib/resilience.ts`: `withRetry()` utility available for SiPhox API calls

### Established Patterns
- Stripe webhook handler at `app/api/webhook/stripe/route.ts` — dynamic imports, non-fatal try/catch blocks, idempotency via `isStripeEventProcessed`
- Cron routes at `app/api/cron/` with Vercel secret header protection
- Checkout uses Stripe Payment Links (redirect-based, no server-side Checkout Sessions)

### Integration Points
- `handleCheckoutCompleted()` in webhook — add SiPhox fulfillment after membership creation
- `handleChargeRefunded()` in webhook — add SiPhox notification alongside commission reversal
- `app/api/intake/submit/route.ts` — potential trigger point for deferred orders (or let cron handle it)
- `siphox_kit_orders` table — extend with fulfillment columns

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-checkout-integration*
*Context gathered: 2026-03-15*
