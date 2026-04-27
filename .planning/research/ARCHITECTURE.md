# v2.0 Architecture — Stripe Removal + Authorize.Net Integration

*Researched: 2026-04-27*
*Domain: telehealth subscription billing migration (Stripe → Authorize.Net ARB + CIM)*
*Overall confidence: HIGH for runtime/Postgres/Vercel facts; MEDIUM for Authorize.Net subtleties (verified against developer docs but recommend a sandbox spike to confirm card-update cascade behavior)*

## Critical Pre-Existing Facts That Constrain The Design

Before any architecture decision, these facts about the current repo were verified during research and shape every recommendation below:

1. **Migration `004_payment_provider.sql` already shipped (in production DB).** It added `memberships.payment_provider`, `memberships.provider_customer_id`, `memberships.provider_subscription_id`, `orders.payment_provider`, `orders.provider_transaction_id`, plus a `CHECK (payment_provider IN ('stripe','authorize_net','klarna','affirm'))` constraint. The `stripe_*` columns were preserved alongside. **The "rename `stripe_*` to `provider_*`" plan in PROJECT.md is partially obsolete — half the work is done. The actual remaining work is dual-write + cutover, not column renames.**

2. **`app/api/checkout/corepay/route.ts` already exists and is wired to `lib/payments/corepay-gateway.ts`.** It currently writes membership rows with hardcoded `stripe_customer_id: 'corepay_<id>'` and `stripe_subscription_id: 'corepay_<id>'` strings stuffed into the legacy columns — a debt-laden bridge.

3. **`affiliate_codes` already has `stripe_coupon_id` + `stripe_promotion_code_id`** (migration `016_stripe_promotion_codes.sql`). The CULTR-internal coupon engine does not need a new table — it needs to stop syncing to Stripe and become the source of truth.

4. **Vercel default function timeout is 300s under Fluid Compute (current default for new Pro projects).** The "60-90s default" assumption in the question is based on legacy serverless. Fluid is the modern default, so 2-3 sequential Authorize.Net calls of 2-5s each fit comfortably in a single function. ([Vercel Functions Limits](https://vercel.com/docs/functions/limitations))

5. **Authorize.Net webhook signature header is `X-ANET-Signature`, HMAC-SHA512.** Confirmed against [official webhook docs](https://developer.authorize.net/api/reference/features/webhooks.html). cultrhealth.com runs on Cloudflare Pages where `crypto.subtle` is native (no `nodejs_compat` needed for SHA-512 HMAC verify).

6. **Tables on the cultrclub-web side reference `creator_customer_portfolio.stripe_subscription_id` directly** (`/Users/davidk/Documents/Dev-Projects/App-Ideas/cultrclub-web/lib/creators/db.ts:1252-1397`). Any column rename has to ship to that repo too — they share the DB.

7. **`pending_intakes.stripe_payment_intent_id` is misnamed — it actually stores Stripe checkout session IDs (`cs_…`), not payment intents.** Documented inline at `app/api/webhook/stripe/route.ts:300-304`. The intake submit endpoint matches against `body.stripeSessionId`. Whatever new column we add for the CorePay flow must hold either an Authorize.Net subscription ID or a generated checkout token — there's no equivalent of "checkout session" in Authorize.Net's hosted form world.

---

## Webhook Architecture During Migration

### Recommendation: Run both webhook handlers in parallel, with feature-flag gating, until the legacy Stripe subs hit zero.

| Component | Status | Why |
|---|---|---|
| `app/api/webhook/stripe/route.ts` | **Keep, do not delete during migration** | Existing Stripe subs (~hundreds at current scale) will still fire `invoice.payment_succeeded`, `customer.subscription.deleted`, `charge.refunded` for 30+ days into migration. Killing this route mid-migration would orphan those events. |
| `app/api/webhook/corepay/route.ts` | **New — Phase 1 deliverable** | Receives `net.authorize.*` events. HMAC-SHA512 verifies via `crypto.subtle.importKey` + `verify` (works in both Vercel Node and CF Pages edge runtimes). |
| `lib/webhooks/dispatcher.ts` (new) | **Lift the side-effect logic OUT of `webhook/stripe/route.ts`** | Today, `webhook/stripe/route.ts` is 1021 lines with side effects inlined: `createMembership`, `triggerSiphoxFulfillment`, `ensureHealthiePatient`, `processOrderAttribution`, `sendWelcomeEmail`, `syncContactToMailchimp`. Lift these into provider-agnostic helpers (`onSubscriptionActivated(email, planTier, providerSubId, providerCustId, attributionCookie)`) so both handlers call the same primitives. |

### Why "hard cutover" doesn't mean "kill Stripe webhook on day 1"

A hard cutover for *new signups* is fine — flip a feature flag and `app/join/[tier]/page.tsx` posts to `/api/checkout/corepay` instead of `/api/checkout`. But existing subs have to be migrated one-by-one through the re-onboarding flow. During the 30-day re-onboarding window (per PROJECT.md Key Decisions), a Stripe subscription that hasn't been re-onboarded yet is still alive and *needs* its webhook handler. The Stripe webhook becomes a maintenance route, not a primary intake.

### Webhook Sunset Sequence

1. **Phase 1** (new code path live): both handlers active. New signups go to CorePay. Existing Stripe subs continue to bill via Stripe webhook.
2. **Phase 2** (re-onboarding open): `migration_tokens` table seeded for every active Stripe sub. Email campaign sends them the re-onboarding link. As they convert, their Stripe sub is cancelled (we cancel — don't wait for them to stop paying), CorePay sub is created. Both webhooks still active.
3. **Phase 3** (sunset cron): A `cron/sunset-stripe-subscriptions.ts` job runs daily. For any unmigrated Stripe sub past day 30, force-cancel via Stripe API (`stripe.subscriptions.cancel`). Send a "your CULTR membership has ended — reactivate with new card" email. Stripe webhook will receive `customer.subscription.deleted` and the existing `handleSubscriptionDeleted` already updates `memberships.subscription_status = 'cancelled'`.
4. **Phase 4** (Stripe handler retired): Once `SELECT COUNT(*) FROM memberships WHERE payment_provider = 'stripe' AND subscription_status = 'active' = 0`, the Stripe webhook handler can be deleted. Keep the file as a 410 Gone responder for ~6 months in case Stripe retries old events.

### Idempotency Across Both Providers

The existing `stripe_idempotency` table (migration `007`) is Stripe-specific (`event_id` PK). For CorePay, add a sibling table:

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL,        -- 'stripe' | 'authorize_net'
  event_id VARCHAR(255) NOT NULL,       -- provider's event ID
  event_type VARCHAR(100) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, event_id)
);
```

Then deprecate `stripe_idempotency` only after Stripe handler is retired. (Don't migrate historical Stripe idempotency rows — they're not needed once Stripe is dead.)

---

## DB Migration Sequencing (Zero-Downtime?)

### Verdict: Zero-downtime is achievable, and migration `004` already paid for half of it. No app-down deploy required.

Postgres `ALTER TABLE RENAME COLUMN` is in fact instant (it only rewrites the catalog), but renaming `stripe_*` → `provider_*` would still break every running pod that still has the old column name in its query strings. The right pattern is the **expand → contract** ([Brandur](https://brandur.org/fragments/postgres-table-rename), [GoCardless](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/)) — but in CULTR's case we can compress it because migration `004` already shipped the additive columns.

### Recommended Sequence (5 deploys, no app downtime)

| Step | Action | Downtime | Notes |
|---|---|---|---|
| **1** | (already done) Migration `004` added `payment_provider`, `provider_customer_id`, `provider_subscription_id`, `provider_transaction_id` | None | Existing |
| **2** | Code deploy A: dual-read. Every `SELECT stripe_subscription_id FROM memberships` becomes `SELECT COALESCE(provider_subscription_id, stripe_subscription_id) AS subscription_id`. Every `WHERE stripe_subscription_id = $1` becomes `WHERE COALESCE(provider_subscription_id, stripe_subscription_id) = $1`. Add a typed helper `getProviderIds(membership): { provider: string, customerId: string, subscriptionId: string }` to centralize this logic. | None | Reads still work for both legacy Stripe rows and new CorePay rows. |
| **3** | Code deploy B: dual-write. New CorePay signups write to `provider_*` columns + `payment_provider = 'authorize_net'`. The current `corepay/route.ts` hack (`stripe_customer_id: 'corepay_…'`) is removed. Stripe webhook also starts populating `provider_customer_id = stripe_customer_id` and `payment_provider = 'stripe'` so legacy rows get caught up. | None | At this point, both column families are populated for new writes; legacy reads continue to work via COALESCE. |
| **4** | Backfill migration `063_backfill_provider_ids.sql`: `UPDATE memberships SET provider_customer_id = stripe_customer_id, provider_subscription_id = stripe_subscription_id, payment_provider = 'stripe' WHERE provider_customer_id IS NULL`. Run in batches (`WHERE id > $cursor LIMIT 1000`) to avoid long locks. Same for `orders`. Same for `creator_customer_portfolio`, `siphox_kit_orders`, `pending_intakes`. | None | Pure data move; no schema change. |
| **5** | After Stripe sunset (Phase 4): code deploy C drops the COALESCE shims, reads only `provider_*`. Migration `064_drop_legacy_stripe_columns.sql` drops `stripe_customer_id`, `stripe_subscription_id`, `stripe_payment_intent_id` (and corresponding indexes). | None | Schema-only. The `_2.sql` macOS-dup migrations should be cleaned up first to avoid running a delete twice. |

### Why NOT do `RENAME COLUMN` directly

`ALTER TABLE memberships RENAME COLUMN stripe_subscription_id TO provider_subscription_id` is instant on the catalog, but:
- Old code in flight (a function still executing during deploy) will fail with `column "stripe_subscription_id" does not exist`.
- Every other repo (`cultrclub-web`, `cultrhealth-web`) that mirrors this code has to deploy at the same instant. **They don't deploy together** — cultrhealth.com is on CF Pages with manual `wrangler` deploys, staging is on Vercel auto-deploy from `staging` branch, cultrclub-web is its own CF Pages auto-deploy on push.
- It would couple migration to a synchronized 3-app deploy, which is fragile.

The expand→contract approach lets each app upgrade independently.

### "Drop `stripe_events` table" claim in PROJECT.md

The actual table is `stripe_idempotency` (migration `007`) — there's no `stripe_events` table. The PROJECT.md note is imprecise. What gets dropped is `stripe_idempotency` once the Stripe webhook handler is retired (Phase 4). The new `webhook_events` table replaces it for both providers.

---

## CIM Hierarchy: Customer Profile vs Payment Profile

### Recommendation: One CIM customer profile per email (lifetime). Many payment profiles per customer profile (one per saved card). Use `ARBUpdateSubscriptionRequest` with the customer-profile + payment-profile IDs to set or update the card on a subscription.

### The CIM data model (verified)

Per Authorize.Net docs ([Customer Profiles](https://developer.authorize.net/api/reference/features/customer-profiles.html)):
- **Customer Profile** — top level. Contains email, description, customer ID. **Up to 10 payment profiles + up to 100 shipping profiles per customer profile.**
- **Payment Profile** — child of customer profile. One per card-on-file. References billing address.
- **Subscription (ARB)** — independent object that *references* a customer profile + payment profile by ID. ARB and CIM are two services that *can* be linked (highly recommended for SaaS) but are technically separable.

### Why "one customer profile per email" wins

1. **A user upgrades plan tiers** — old sub cancelled, new sub created. Same card, same email. If we created a new customer profile per subscription, we'd duplicate card data and lose the link between their billing history and their account.
2. **A user's card expires** — they update once via `/portal/billing`. That update should apply to their currently-active subscription with no change in subscription state.
3. **Future: members buying products à la carte alongside their subscription.** A one-time CIM transaction (CIM `createCustomerProfileTransactionRequest`) reuses the same payment profile — no re-tokenization needed.

### How `memberships` table maps to CIM

```sql
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS provider_payment_profile_id VARCHAR(255);

-- Reading:
-- provider_customer_id        = CIM customerProfileId  (lifetime per email)
-- provider_payment_profile_id = CIM customerPaymentProfileId  (current default card)
-- provider_subscription_id    = ARB subscriptionId
```

**Lookup flow on signup:**

```
1. POST /api/checkout/corepay
2. Server: SELECT provider_customer_id FROM memberships WHERE email = $1 LIMIT 1
3a. If found → reuse customerProfileId. Call createCustomerPaymentProfileRequest with new opaqueData (Accept.js nonce). Get new paymentProfileId.
3b. If not found → call createCustomerProfileRequest (creates customer + initial payment profile in one call). Get both IDs.
4. Call ARBCreateSubscriptionRequest with profile.customerProfileId + profile.customerPaymentProfileId.
5. INSERT INTO memberships (provider_customer_id, provider_payment_profile_id, provider_subscription_id, payment_provider='authorize_net', …)
```

### Update-card flow (the killer feature for `/portal/billing`)

Per [Authorize.Net knowledge base](https://support.authorize.net/knowledgebase/Knowledgearticle/?code=KA-04444), `ARBUpdateSubscriptionRequest` accepts a customer profile reference. Two equivalent paths to "update card on file":

**Path A (recommended) — Update the payment profile in place:**
```
POST /api/portal/billing/update-card
1. Accept.js tokenizes new card → opaqueData
2. Server: updateCustomerPaymentProfileRequest with the existing paymentProfileId + new opaqueData
3. ARB subscription continues to reference the same paymentProfileId; next billing uses the new card automatically.
4. No ARBUpdateSubscriptionRequest needed.
```
**Confidence: MEDIUM-HIGH.** Authorize.Net docs strongly imply this is the intended flow but explicit "next billing uses new card" guarantee was not found in the public docs. **Recommend a sandbox spike to verify** before relying on it in production. ([Authorize.Net Developer Community](https://community.developer.cybersource.com/t5/The-authorize-net-Developer-Blog/Update-2-CIM-Profiles-for-ARB-Subscriptions/ba-p/53552))

**Path B (defensive) — Create new payment profile, point ARB at it:**
```
1. Accept.js tokenizes new card → opaqueData
2. Server: createCustomerPaymentProfileRequest → new paymentProfileId
3. Server: ARBUpdateSubscriptionRequest({ subscriptionId, profile: { customerProfileId, customerPaymentProfileId: newPaymentProfileId }})
4. UPDATE memberships SET provider_payment_profile_id = $newId WHERE …
5. (Optional) Delete or set inactive the old payment profile.
```

Path B is more verbose but unambiguous in the API. **Default to Path B until Path A is proven in sandbox.**

---

## ARB ↔ DB State Sync Pattern

### Recommendation: Webhook-primary, polling fallback. Authorize.Net DOES emit webhooks for ARB lifecycle and for failed payments, but the event taxonomy is sparser than Stripe's.

### Available webhook events ([Authorize.Net webhooks ref](https://developer.authorize.net/api/reference/features/webhooks.html))

| Event | Fires when | Maps to `memberships.subscription_status` |
|---|---|---|
| `net.authorize.customer.subscription.created` | New ARB sub | `active` |
| `net.authorize.customer.subscription.updated` | Card updated, amount changed, etc. | (no status change — refresh metadata) |
| `net.authorize.customer.subscription.suspended` | Card decline retries exhausted | `paused` |
| `net.authorize.customer.subscription.terminated` | Manual cancel via API | `cancelled` |
| `net.authorize.customer.subscription.cancelled` | Customer-initiated cancel | `cancelled` |
| `net.authorize.customer.subscription.expiring` | One billing cycle left (totalOccurrences) | (no change — alert only) |
| `net.authorize.customer.subscription.expired` | All cycles consumed | `expired` |
| `net.authorize.customer.subscription.failed` | Payment failed (per cycle) | `past_due` (then `paused` on suspend) |
| `net.authorize.payment.authcapture.created` | Each successful billing | (no status change — record `last_billed_at`) |
| `net.authorize.payment.refund.created` | Refund posted | Trigger `reverseCommissionsForAttribution` |

**Note:** CULTR's plan uses `totalOccurrences: '9999'` (effectively perpetual) so `expiring`/`expired` are unlikely to fire in practice.

### Why polling is still needed (defense-in-depth)

Search results surfaced multiple cases ([Cybersource community: ARB Subscription webhooks not working](https://community.developer.cybersource.com/t5/Integration-and-Testing/ARB-Subscription-webhooks-not-working/td-p/63173)) of webhook delivery failures in Authorize.Net. The right pattern is:

1. **Webhook is primary** — every event updates `memberships.subscription_status`, `last_billed_at`, etc. with idempotency on `(provider, event_id)`.
2. **Daily reconciliation cron `cron/reconcile-arb-subscriptions.ts`** — for every `memberships` row where `payment_provider = 'authorize_net' AND subscription_status IN ('active', 'past_due', 'paused')`:
   - Call `ARBGetSubscriptionStatusRequest({ subscriptionId })`.
   - If returned status differs from DB, update DB + log a `cron_runs` warning.
   - This catches the rare missed-webhook case.

This mirrors how the existing SiPhox cron pattern (every 15 min for fulfillment, every 30 min for status sync) handles delivery uncertainty in `vercel.json`.

### Sentry signal

Wrap the reconcile cron in a Sentry message when DB and Authorize.Net disagree, with severity `warning`. Do not treat each disagreement as an alert — there will be a brief window during a webhook in-flight. Alert at threshold: ≥3 disagreements in a single run, or any single subscription disagreed on for 2+ consecutive runs.

---

## Creator Commission Attribution — New Data Flow

### Recommendation: Make `coupon_redemptions` the source of truth at redeem time. Continue writing `order_attributions` (downstream/denormalized) for backwards compatibility with admin dashboards and the Creator ROI engine. Remove the `stripe_promotion_code_id` / `stripe_coupon_id` columns from `affiliate_codes` once Stripe is sunset.

### Today's flow (Stripe-mediated)

```
Stripe Checkout user enters FOUNDER15
  → Stripe applies discount, fires checkout.session.completed
  → webhook/stripe/route.ts: resolveCouponCodeFromStripeDiscounts(session.total_details.breakdown.discounts)
  → calls getAffiliateCodeByStripeIds({stripePromotionCodeId, stripeCouponId}) — JOINs affiliate_codes by Stripe sync IDs
  → resolveAttribution({email, attributionCookie, couponCode})
  → processOrderAttribution(...) → INSERT order_attributions row + (skipCommissionLedger for club)
```

This depends on Stripe's coupon engine. After Stripe is gone, no `total_details.breakdown.discounts` exists.

### Proposed new flow (CULTR-internal)

```
Customer enters FOUNDER15 in /join/[tier] form (or /portal/billing)
  → POST /api/checkout/corepay { planSlug, email, opaqueData, billing, couponCode }
  → Server: validateCoupon(couponCode) — already exists in lib/config/coupons.ts
            + getAffiliateCodeByCode(couponCode) — already exists in lib/creators/db.ts
  → Server computes discounted amount: amountCents = planPrice * (1 - discount/100)
  → createSubscription({ ..., amountCents })  -- ARB sub created at discounted rate
  → INSERT INTO coupon_redemptions (
       code, code_id, customer_email, order_id, provider_subscription_id,
       discount_percentage, discount_amount_cents, applied_at
     )
  → ALSO: processOrderAttribution(...) → order_attributions row (for ROI/admin)
```

### New table: `coupon_redemptions`

```sql
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  code_id UUID REFERENCES affiliate_codes(id),  -- NULL for CLUB_COUPONS / FOUNDER15 / FIRSTMONTH
  code_source VARCHAR(20) NOT NULL,             -- 'club_coupon' | 'creator_code' | 'system_promo'
  customer_email VARCHAR(255) NOT NULL,
  order_id VARCHAR(50),                         -- our internal order ID
  provider_subscription_id VARCHAR(255),        -- ARB sub ID if subscription
  provider_transaction_id VARCHAR(255),         -- ARB / CIM tx ID if one-time
  discount_percentage NUMERIC(5,2) NOT NULL,
  discount_amount_cents INTEGER NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_to_billing_cycles INTEGER DEFAULT 1   -- FOUNDER15=999, FIRSTMONTH=1
);

CREATE INDEX idx_coupon_redemptions_email ON coupon_redemptions(lower(customer_email));
CREATE INDEX idx_coupon_redemptions_code ON coupon_redemptions(upper(code));
CREATE INDEX idx_coupon_redemptions_subscription ON coupon_redemptions(provider_subscription_id);
```

### Source-of-truth split

| Concern | Source | Why |
|---|---|---|
| **"Did this customer redeem code X?"** | `coupon_redemptions` | One row per redemption. Tracks original + discount amounts at the moment of redemption. Also handles non-creator codes (CLUB_COUPONS, FOUNDER15). |
| **"What's a creator's earned commission?"** | `order_attributions` + `commission_ledger` | Existing tables; their lifecycle (deferred for club, retroactive attribution, reversal helpers) is non-trivial and shouldn't be re-engineered. |
| **"Which creator gets attribution for this redemption?"** | JOIN: `coupon_redemptions.code_id → affiliate_codes.id → creators.id` | Same `creators.id` flows into `order_attributions.attributed_creator_id`. |

The **denormalization** is intentional: `order_attributions` stores `discount_rate` (per migration `062_order_attributions_discount_snapshot.sql`) so historical Creator ROI doesn't drift when a code's discount value changes. `coupon_redemptions` snapshots `discount_percentage` for the same reason at the redemption level.

### Recurring discount handling (FOUNDER15 = "15% off forever")

Authorize.Net ARB doesn't natively understand percentage coupons — you set the `amount` once at sub creation. Two implementation choices:

1. **Pre-discounted amount (recommended)** — At sub creation, set `amount = price × (1 - discount)`. Simple. Forever. Works for FOUNDER15. **Tradeoff:** if the underlying plan price changes later, the discounted price doesn't auto-track. (Mitigation: when plan prices change, run a migration script that sweeps active subs and calls `ARBUpdateSubscriptionRequest` to update the amount.)
2. **First-month-only discounts (FIRSTMONTH = 50% off first month)** — Use `trialOccurrences` + `trialAmount` in `ARBCreateSubscriptionRequest`. The first cycle bills at trialAmount, subsequent at amount. ([Authorize.Net ARB API](https://developer.authorize.net/api/reference/index.html#recurring-billing))

Both are properly addressable; just different code paths in `createSubscription()`.

### Owner-email exclusion stays

`lib/config/owner-emails.ts` filtering applies at admin-aggregate read time, not at write time. The new `coupon_redemptions` writes happen unfiltered; admin queries continue to filter via the existing helper. No change to that policy.

---

## Existing-Subscriber Migration Architecture

### Recommendation: New `migration_tokens` table. Stripe sub kept alive until the customer completes re-onboarding (or 30-day window expires). Stripe sub cancelled by us *immediately after* CorePay sub creation succeeds — not by waiting for `customer.subscription.deleted`. Idempotency-keyed migration prevents double-charging.

### The `migration_tokens` table

```sql
CREATE TABLE migration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  legacy_stripe_subscription_id VARCHAR(255) NOT NULL,
  legacy_plan_tier VARCHAR(20) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,            -- SHA-256 of the URL token (raw token never stored)
  state VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending' (sent) | 'in_progress' (link clicked) | 'completed' | 'expired' | 'sunset'
  new_corepay_subscription_id VARCHAR(255),          -- populated on completion
  email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link_clicked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,                   -- email_sent_at + 30 days
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_migration_tokens_state ON migration_tokens(state);
CREATE INDEX idx_migration_tokens_expires ON migration_tokens(expires_at) WHERE state IN ('pending','in_progress');
CREATE INDEX idx_migration_tokens_email ON migration_tokens(lower(customer_email));
```

### Token format

- **Raw token:** 32 random bytes, base64url-encoded → 43 chars. Generated server-side via `crypto.getRandomValues(new Uint8Array(32))` (works in both Node and edge runtimes).
- **Storage:** SHA-256 of raw token only (`token_hash`). Never store the raw token in DB. Email contains the raw token in the URL.
- **URL:** `https://cultrhealth.com/migrate/<rawToken>`. Page hashes the token, looks up the row, validates `state = 'pending' OR 'in_progress'` and `expires_at > NOW()`, marks `state = 'in_progress'` and renders the re-onboarding form.
- **Expiration:** 30 days from email send.

This is the same pattern as `lib/portal-auth.ts` OTP storage — proven in this repo.

### The flow — ordering matters

```
1. Cron (one-time job to seed): for every memberships row where payment_provider='stripe' AND subscription_status='active':
   INSERT INTO migration_tokens (...) VALUES (...) ON CONFLICT DO NOTHING
   Send re-onboarding email via Resend with the raw token URL.

2. User clicks link → /migrate/<token>
   - Look up token, validate, mark in_progress.
   - Render Accept.js form pre-filled with email + plan tier.

3. User enters new card → POST /api/migrate/complete { token, opaqueData, billing }
   This must be transactional (atomic):

   a. Server: revalidate token (state in pending/in_progress, not expired).
   b. Authorize.Net: createCustomerProfileRequest → customerProfileId, paymentProfileId
   c. Authorize.Net: ARBCreateSubscriptionRequest → newSubscriptionId
      WARN: If this fails after (b), rollback by calling deleteCustomerProfileRequest. Sentry alert.
   d. Stripe: stripe.subscriptions.cancel(legacyStripeSubscriptionId, { cancellation_details: { comment: 'CULTR migration' }})
      WARN: If THIS fails after (c) success, log to Sentry as 'manual_intervention_required' — customer
      now has BOTH active. Do NOT throw — the migration succeeded; bill collection is the cleanup task.
   e. DB transaction:
        UPDATE memberships SET
          payment_provider = 'authorize_net',
          provider_customer_id = $cust,
          provider_payment_profile_id = $payProfile,
          provider_subscription_id = $newSub,
          subscription_status = 'active',
          updated_at = NOW()
        WHERE id = $membershipId;
        UPDATE migration_tokens SET state='completed', completed_at=NOW(),
          new_corepay_subscription_id=$newSub WHERE id = $tokenId;
   f. Send confirmation email.

4. Sunset cron (daily): for every migration_tokens row where state IN ('pending','in_progress')
   AND expires_at < NOW():
   - UPDATE migration_tokens SET state='sunset'
   - stripe.subscriptions.cancel(legacy_stripe_subscription_id) -- forced cancel
   - UPDATE memberships SET subscription_status='cancelled'
   - Send "your CULTR membership has ended — reactivate with new card" email
```

### Preventing double-charge

Two scenarios:

**Scenario A: User re-onboards on day 5. Stripe charges day 7. CorePay charges day 10.**

The Stripe webhook `invoice.payment_succeeded` for that day-7 charge fires *after* we cancelled. Solution: The Stripe API `cancel` immediately sets the sub to `canceled` — Stripe will not generate further invoices. The day-7 charge would only happen if the user's billing date was day 5 and the cancel was day 6, in which case there's no double charge anyway. **The risk is the in-flight invoice** — Stripe's documented behavior is that calling `cancel` while an invoice is `open` does NOT void the invoice. So:

> **Hard rule for the migration code:** Before cancelling the Stripe sub, call `stripe.invoices.list({ subscription: legacyId, status: 'open' })`. If any open invoices exist, void them via `stripe.invoices.voidInvoice(id)` *first*, then cancel the sub. ([Stripe API: cancel subscription](https://docs.stripe.com/api/subscriptions/cancel))

**Scenario B: User re-onboards via two different devices simultaneously.**

The token is single-use by virtue of the state machine: step 3a moves `in_progress → completed` atomically. The second request finds `state = 'completed'` and 409s. (Use `UPDATE … WHERE state IN ('pending', 'in_progress') RETURNING …` and check `rowCount = 1` before proceeding.)

---

## Vercel Function Timeout & Async Patterns

### Recommendation: Single function for happy path. Move heavy side effects (Healthie patient creation, SiPhox kit fulfillment, Mailchimp sync) to the post-payment webhook handler — same pattern as today's Stripe flow.

### Timeout reality check

Per [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) (verified Apr 2026):

- **Fluid Compute (default for new Pro projects):** 300s default, max 800s on Pro/Enterprise. cultrhealth.com staging is on Pro, so this applies.
- **Legacy serverless:** 60s on Pro, 10s on Hobby.
- The "60-90s" assumption in the question reflects legacy. Confirm with `vercel project inspect` whether Fluid Compute is enabled on the staging project.

### What CorePay checkout actually does

Synchronous Authorize.Net calls in the happy path:
1. `createCustomerProfileRequest` (or look-up + `createCustomerPaymentProfileRequest`) — 1-3s
2. `ARBCreateSubscriptionRequest` — 2-5s

Total: ~3-8s in the happy path. Comfortably within 60s legacy serverless, trivially within 300s Fluid.

### What the Stripe webhook does today (and CorePay webhook should mirror)

The async work that fires on `checkout.session.completed`:
- `createMembership` (DB) — fast
- `ensureHealthiePatient` (Healthie API) — 1-3s, may stall on cold start
- `triggerSiphoxFulfillment` (SiPhox API) — 1-2s
- `processOrderAttribution` + `upsertPortfolioEntry` (DB) — fast
- `sendWelcomeEmail` (Resend) — 200-500ms
- `syncContactToMailchimp` (non-blocking, fire-and-forget) — 200-500ms

Today this is all in the webhook, which Stripe gives 30s to respond before retrying. Authorize.Net webhooks have similar retry semantics (per their docs: 5 retries with exponential backoff). Mirror the pattern: `webhook/corepay/route.ts` does the same side-effect orchestration on `subscription.created`.

### Recommended pattern: synchronous checkout, async fulfillment

```
POST /api/checkout/corepay
  ↓ (synchronous, must return ≤30s for good UX)
  Authorize.Net: createCustomerProfile + ARBCreateSubscription
  DB: INSERT memberships row, INSERT pending_intakes row, INSERT coupon_redemptions row
  → Return { redirectUrl: '/success?provider=corepay&subscription_id=...' } immediately
  
[async, via webhook on success or retry]
POST /api/webhook/corepay  (event: net.authorize.customer.subscription.created)
  ↓ (no user-facing latency)
  Idempotency check (webhook_events table)
  ensureHealthiePatient + triggerSiphoxFulfillment + processOrderAttribution
  + sendWelcomeEmail + syncContactToMailchimp
```

**Why this is better than 2-step async at the checkout endpoint:**
- Single round-trip from the browser → fewer failure modes.
- Webhook idempotency naturally handles retry — if SiPhox fulfillment fails on first webhook delivery, Authorize.Net retries the webhook and we get another chance.
- Matches the existing Stripe pattern, so the lift-and-shift to provider-agnostic helpers (`lib/webhooks/dispatcher.ts`) is straightforward.

### Don't `export const runtime = 'edge'` on cultrhealth.com checkout

cultrhealth.com (this repo, Vercel staging + CF Pages prod) uses Node runtime by default. Authorize.Net SDK calls happen via `fetch()` to their JSON API (already done in `corepay-gateway.ts`), so edge would *technically* work — but the existing Stripe webhook (`headers()` from `next/headers`, `Stripe.Event` type imports, signature constructEvent) and the lift-and-shift helpers are Node-compatible by default. **Stick with Node runtime for cultrhealth.com checkout/webhook routes.** Edge runtime is a cultrclub-web concern (next section).

---

## Cloudflare Edge Compatibility

### Verdict: cultrclub-web does NOT need to do CorePay subscriptions. Keep paid checkout on cultrhealth.com (Node runtime). cultrclub-web continues to be product-only orders, which currently bypass Stripe entirely.

### What runs where today

| App | Runtime | Touches Stripe? |
|---|---|---|
| cultrhealth.com (CF Pages prod, Vercel staging) | Node | YES — checkout, webhook, admin pause/cancel/upgrade. CF Pages relies on `nodejs_compat` flag. |
| cultrclub.com (CF Pages, edge) | Edge | **NO.** Per cultrclub-web architecture: club orders write `club_orders` rows for admin approval. No payment is taken. Paid upgrades link to `cultrhealth.com/pricing`. |

This means **the Cloudflare edge compat question is mostly moot for the v2.0 milestone**. The CorePay code path is on cultrhealth.com, which runs Node on Vercel staging and on `nodejs_compat`-flagged Workers on CF Pages prod.

### Edge compatibility audit (in case things change)

If CorePay calls *did* need to run on cultrclub-web edge:

| Concern | Edge runtime answer |
|---|---|
| **Accept.js client-side tokenization** | Pure browser code. Loads from `https://js.authorize.net/v1/Accept.js` (or sandbox) regardless of host runtime. Confirmed via [Accept.js docs](https://developer.authorize.net/api/reference/features/acceptjs.html): only requires HTTPS host. **Works.** |
| **HMAC-SHA512 webhook verification** | Native via `crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-512' }, false, ['verify'])` + `crypto.subtle.verify(...)`. **Works without `nodejs_compat`.** Don't use Node's `crypto.createHmac` in edge code — that does require the flag. |
| **HMAC `timingSafeEqual` for buffer compare** | Use `crypto.subtle.verify` directly (it's constant-time by spec) instead of comparing computed hashes. Avoids the buffer-length mismatch bug already documented in CLAUDE.md (`HMAC timingSafeEqual` rule). |
| **Authorize.Net JSON API calls** | `fetch()` is native. **Works.** |
| **`crypto.getRandomValues(new Uint8Array(32))` for tokens** | Native Web Crypto. **Works.** |
| **Authorize.Net SDK (npm `authorizenet`)** | Heavy CommonJS package built for Node. **Avoid** — use raw `fetch` to the JSON API (which is what `corepay-gateway.ts` already does). |

### Webhook signature verification — edge-compatible reference

```ts
// app/api/webhook/corepay/route.ts (works in both Node and edge)
async function verifyAuthorizeNetSignature(
  rawBody: string,
  signatureHeader: string,
  signatureKey: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signatureKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['verify']
  );
  // Authorize.Net format: 'sha512=<hexHash>' — strip the prefix
  const expected = signatureHeader.replace(/^sha512=/i, '').toLowerCase();
  // Convert hex string to Uint8Array
  const expectedBytes = new Uint8Array(
    expected.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );
  return crypto.subtle.verify('HMAC', key, expectedBytes, encoder.encode(rawBody));
}
```

This is constant-time by spec (no timingSafeEqual needed) and edge-compatible.

---

## Suggested Build Order (Phase Sequencing)

Order is driven by reversibility (early phases are reversible without customer impact) and dependencies.

### Phase 0 — Documentation (independently shippable)

Per PROJECT.md, four Claude skills. Pure docs. Can ship at any point and have zero coupling to the rest of the work.

### Phase 1 — Core CorePay primitives (no customer-facing changes yet)

**Goal:** Have a working CorePay code path that creates real ARB subscriptions in sandbox, but keep all production traffic on Stripe.

- Add `lib/payments/authorize-net-cim.ts` — CIM customer/payment profile helpers (`getOrCreateCustomerProfile`, `createPaymentProfile`, `updatePaymentProfile`).
- Add `lib/payments/authorize-net-arb.ts` — ARB lifecycle helpers (`createSubscription`, `cancelSubscription`, `getSubscriptionStatus`, `updateSubscriptionPaymentProfile`). Refactor existing `lib/payments/corepay-gateway.ts` into this; delete the old name.
- Migration `063_webhook_events.sql` + `063_provider_payment_profile_id.sql` (additive: add `memberships.provider_payment_profile_id`, `migration_tokens` table NOT yet — wait until phase 5).
- New `app/api/webhook/corepay/route.ts` — HMAC-SHA512 verification, idempotency via `webhook_events` table. Initially handles only `subscription.created` and `payment.refund.created`. **No live customers.**
- Sandbox test: complete one full signup → cancel → refund cycle in Authorize.Net sandbox.

**Reversible:** Delete the routes; nobody is using them yet.

### Phase 2 — Provider-agnostic helpers (refactor; no behavior change)

**Goal:** Lift Stripe webhook side-effects into provider-agnostic primitives so both providers feed the same downstream pipelines.

- New `lib/webhooks/dispatcher.ts`:
  - `onSubscriptionActivated({ provider, providerCustomerId, providerSubscriptionId, email, planTier, attributionCookie?, couponCode? })`
  - `onSubscriptionCancelled({ provider, providerSubscriptionId, reason? })`
  - `onSubscriptionPastDue({ provider, providerSubscriptionId })`
  - `onPaymentSucceeded({ provider, providerSubscriptionId, amountCents })`
  - `onRefunded({ provider, providerTransactionId, amountCents })`
- Update `app/api/webhook/stripe/route.ts` — replace inline calls to `triggerSiphoxFulfillment`, `ensureHealthiePatient`, `processOrderAttribution`, etc. with calls to `lib/webhooks/dispatcher.ts`. Verify nothing changed by running the existing `webhook/stripe` integration tests.
- Wire `app/api/webhook/corepay/route.ts` to the same dispatcher.
- Add the dual-read shim: `getProviderIds(membership)` helper, replace direct `stripe_subscription_id` reads with `COALESCE(provider_subscription_id, stripe_subscription_id)` in admin/member/portfolio queries.

**Reversible:** Refactor only. Tests catch regressions.

### Phase 3 — CULTR coupon engine (replace Stripe coupon resolution)

**Goal:** New coupon table, dual-validation works at checkout. Stripe coupon sync is now write-only (will be deleted in Phase 6).

- Migration `064_coupon_redemptions.sql`.
- Extend `lib/config/coupons.ts` with `validateCouponForSubscription(code, planSlug, email): { valid, discountPercentage, billingCycles, codeId, codeSource }`.
- New `lib/coupons/redemption.ts` — `recordCouponRedemption(...)`, called from both checkout routes (Stripe + CorePay) during phase 3 dual-write.
- Update `app/api/checkout/route.ts` (Stripe path) to ALSO write `coupon_redemptions` rows when Stripe applies a discount. (Currently the discount info comes back via `total_details.breakdown.discounts` only at webhook time. May need to either pass the code through `metadata.coupon_code` and resolve at webhook, or call `getAffiliateCodeByCode` at checkout time.) **Recommended:** Resolve at webhook on Stripe path; resolve at checkout on CorePay path. Document the asymmetry.

**Reversible:** Stop writing `coupon_redemptions` to roll back.

### Phase 4 — CorePay checkout for new signups (feature-flagged)

**Goal:** Behind a flag, new signups can complete via CorePay. Existing Stripe subs unaffected.

- Update `app/join/[tier]/page.tsx` (and `app/pricing/PricingClient.tsx` plan-CTA buttons) to read a feature flag (`USE_COREPAY_FOR_SIGNUP`). When true, render Accept.js form; when false, redirect to Stripe Checkout.
- Update `app/api/checkout/corepay/route.ts` to:
  - Use the new CIM helpers (delete the `stripe_customer_id: 'corepay_…'` hack).
  - Write `provider_*` columns and `payment_provider = 'authorize_net'`.
  - Call coupon redemption helper.
  - Return `redirectUrl` to `/success?provider=corepay&subscription_id=…`.
- Update `app/success/page.tsx` to handle both providers — read provider from query param, fetch subscription details via the relevant API.
- Update `app/api/intake/submit/route.ts` to also key on `provider_subscription_id` when `payment_provider = 'authorize_net'`.

**Test on staging first** with the flag flipped. Roll out to production with the flag still off; flip the flag for a 5% canary; ramp.

**Reversible:** Flip the flag back.

### Phase 5 — Existing-subscriber re-onboarding migration

**Goal:** Move all active Stripe subs to CorePay over a 30-day window.

- Migration `065_migration_tokens.sql`.
- New `app/migrate/[token]/page.tsx` + `MigrateClient.tsx` — Accept.js form, email/plan pre-filled.
- New `app/api/migrate/complete/route.ts` — the transactional flow described in "Existing-Subscriber Migration Architecture" above.
- One-time seeding job (run from `scripts/seed-migration-tokens.mjs` or a `/api/admin/migrate/start` endpoint): for every active Stripe sub, INSERT a `migration_tokens` row + send the Resend email.
- New `app/api/cron/sunset-stripe-subscriptions/route.ts` — daily cron, force-cancels expired tokens.
- Add to `vercel.json` crons.

**Reversible until first email goes out.** After that, irreversible — but the customers remain billed via Stripe until they re-onboard, so worst case you can stall.

### Phase 6 — Admin Stripe routes converted, Stripe code deleted

**Goal:** Drop dependence on Stripe SDK. Admin pause/cancel/upgrade now operate against ARB.

- Convert each of the 6 admin routes to provider-agnostic dispatch:
  - `app/api/admin/members/[customerId]/pause/route.ts`
  - `app/api/admin/members/[customerId]/cancel/route.ts`
  - `app/api/admin/members/[customerId]/upgrade/route.ts`
  - `app/api/admin/members/add/route.ts`
  - `app/api/admin/creators/codes/route.ts` (drop Stripe coupon sync)
  - `app/api/admin/creators/[id]/approve/route.ts` (drop Stripe coupon creation)
- New `lib/payments/provider.ts`:
  ```ts
  pauseSubscription(membership): Promise<void>
  cancelSubscription(membership, reason?): Promise<void>
  upgradeSubscription(membership, newPlanSlug, prorationBehavior): Promise<void>
  ```
  Delegates to the right provider based on `membership.payment_provider`.
- Delete `app/api/checkout/route.ts`, `app/api/checkout/subscription/route.ts`, `app/api/checkout/product/route.ts` (replaced by CorePay equivalents).
- Delete `app/api/webhook/stripe/route.ts` once `SELECT COUNT(*) FROM memberships WHERE payment_provider='stripe' AND subscription_status='active'` is 0.
- Migration `066_drop_stripe_coupon_columns.sql` — drop `affiliate_codes.stripe_coupon_id`, `affiliate_codes.stripe_promotion_code_id`.
- `package.json`: remove `stripe` from dependencies. Drop `STRIPE_*` env vars from `.env.example` and Vercel/CF Pages env config.
- Migration `067_drop_legacy_stripe_columns.sql` — drop `memberships.stripe_customer_id`, `memberships.stripe_subscription_id`, `orders.stripe_payment_intent_id`, `orders.stripe_customer_id`, `siphox_kit_orders.stripe_subscription_id`, `creator_customer_portfolio.stripe_subscription_id`, `pending_intakes.stripe_payment_intent_id`. (Coordinated with cultrclub-web deploy.)

**Phase 6 is the riskiest, save it for last.** Don't drop columns until both apps have deployed the COALESCE-removal release.

---

## Files To Modify By Component

### New files (created during v2.0)

| File | Purpose | Phase |
|---|---|---|
| `.claude/skills/corepay-api/SKILL.md` | Authorize.Net API reference skill | 0 |
| `.claude/skills/healthie-api/SKILL.md` | Healthie EHR reference skill | 0 |
| `.claude/skills/corpay-crossborder/SKILL.md` | Reference-only (future use) | 0 |
| `.claude/skills/siphox-api/SKILL.md` | Refresh existing skill | 0 |
| `lib/payments/authorize-net-cim.ts` | CIM profile helpers (replaces inline ARB-only `corepay-gateway.ts`) | 1 |
| `lib/payments/authorize-net-arb.ts` | ARB lifecycle helpers | 1 |
| `lib/payments/provider.ts` | Provider-agnostic adapter for admin actions | 6 |
| `lib/webhooks/dispatcher.ts` | Provider-agnostic side-effect dispatcher | 2 |
| `lib/coupons/redemption.ts` | CULTR-internal coupon engine | 3 |
| `migrations/063_webhook_events.sql` | New idempotency table | 1 |
| `migrations/063_provider_payment_profile_id.sql` | `memberships.provider_payment_profile_id` | 1 |
| `migrations/064_coupon_redemptions.sql` | New coupon redemptions table | 3 |
| `migrations/065_migration_tokens.sql` | Re-onboarding token table | 5 |
| `migrations/066_drop_stripe_coupon_columns.sql` | Drop `affiliate_codes.stripe_*` | 6 |
| `migrations/067_drop_legacy_stripe_columns.sql` | Drop all `*.stripe_*` ID columns | 6 |
| `app/api/webhook/corepay/route.ts` | HMAC-SHA512 verifier + dispatcher | 1 |
| `app/api/migrate/complete/route.ts` | Atomic re-onboarding endpoint | 5 |
| `app/api/cron/reconcile-arb-subscriptions/route.ts` | Daily ARB ↔ DB drift detector | 1 (deploy-gated to phase 4) |
| `app/api/cron/sunset-stripe-subscriptions/route.ts` | Daily expired-token sweep | 5 |
| `app/migrate/[token]/page.tsx` | Re-onboarding landing page | 5 |
| `app/migrate/[token]/MigrateClient.tsx` | Accept.js client form | 5 |
| `app/portal/billing/page.tsx` | Self-service portal | 4 (replaces Stripe customer portal) |
| `app/portal/billing/BillingClient.tsx` | Cancel/pause/resume/update card UI | 4 |
| `app/api/portal/billing/cancel/route.ts` | Self-service cancel | 4 |
| `app/api/portal/billing/pause/route.ts` | Self-service pause (suspend-emulation) | 4 |
| `app/api/portal/billing/resume/route.ts` | Self-service resume | 4 |
| `app/api/portal/billing/update-card/route.ts` | Self-service card update | 4 |
| `scripts/seed-migration-tokens.mjs` | One-time seed of migration_tokens for active Stripe subs | 5 |

### Modified files (existing files that change)

| File | Change | Phase |
|---|---|---|
| `app/api/checkout/corepay/route.ts` | Drop `stripe_customer_id: 'corepay_…'` hack; use real provider_* columns; integrate coupon engine | 4 |
| `app/api/webhook/stripe/route.ts` | Lift inline side-effects into `lib/webhooks/dispatcher.ts` calls. Eventually deleted in phase 6. | 2, 6 |
| `app/api/checkout/route.ts` | Either delete (if CorePay replaces) or hide behind feature flag | 4, 6 |
| `app/api/checkout/subscription/route.ts` | Same | 4, 6 |
| `app/api/checkout/product/route.ts` | Same — products move to CorePay one-time CIM transaction (`createCustomerProfileTransactionRequest`) | 4, 6 |
| `app/api/intake/submit/route.ts` | Add provider_subscription_id matching | 4 |
| `app/success/page.tsx` | Handle `provider=corepay` query param | 4 |
| `app/join/[tier]/page.tsx` | Feature-flag CorePay vs Stripe | 4 |
| `app/pricing/PricingClient.tsx` | Same — CTA dispatches based on flag | 4 |
| `app/api/admin/members/[customerId]/pause/route.ts` | Use `lib/payments/provider.ts` adapter | 6 |
| `app/api/admin/members/[customerId]/cancel/route.ts` | Same | 6 |
| `app/api/admin/members/[customerId]/upgrade/route.ts` | Same | 6 |
| `app/api/admin/members/[customerId]/route.ts` | Same | 6 |
| `app/api/admin/members/add/route.ts` | Same | 6 |
| `app/api/admin/creators/codes/route.ts` | Drop Stripe coupon sync (`stripe_promotion_code_id` write paths) | 3 |
| `app/api/admin/creators/[id]/approve/route.ts` | Drop Stripe coupon creation | 3 |
| `app/admin/members/MembersClient.tsx` | Read `provider_*` instead of `stripe_*` | 2 |
| `app/admin/creators/coupons/CouponsClient.tsx` | Hide `stripe_promotion_code_id` column | 3 |
| `lib/db.ts` | `MembershipEntry` interface, `createMembership`, `updateMembershipBySubscriptionId`, `getMembershipBySubscriptionId`, `getMembershipByCustomerId` — add `payment_provider`, `provider_*` fields. Cross-table JOIN on line 2529 (`m.stripe_customer_id = o.stripe_customer_id`) needs updating to use COALESCE shim. | 2, 6 |
| `lib/admin-types.ts` | Update Membership type | 2 |
| `lib/creators/db.ts` | `creator_customer_portfolio.stripe_subscription_id` → `provider_subscription_id` (5 query sites) | 2, 6 |
| `lib/config/affiliate.ts` | Drop `stripe_coupon_id` / `stripe_promotion_code_id` from `AffiliateCode` type | 6 |
| `lib/siphox/db.ts` | `siphox_kit_orders.stripe_subscription_id` → `provider_subscription_id` (4 query sites) | 2, 6 |
| `lib/payments/payment-types.ts` | Drop `'stripe'` from `PaymentProvider` union (eventually) | 6 |
| `lib/payments/corepay-gateway.ts` | Refactor into `authorize-net-arb.ts` (just an `ARBCreateSubscription` wrapper today; needs cancel, update, status, etc.) | 1 |
| `lib/config/plans.ts` | Drop `STRIPE_COUPON_IDS` const (FOUNDER15: qU4zNw5W, FIRSTMONTH: tuQ4qFpe). Coupon resolution now via `lib/coupons/redemption.ts`. | 3 |
| `package.json` | Remove `stripe` dependency | 6 |
| `vercel.json` crons | Add `reconcile-arb-subscriptions` and `sunset-stripe-subscriptions` | 1, 5 |
| (cultrhealth-web/ sibling repo) | Deploy parallel changes for CF Pages prod | All deploy phases |

### Files in cultrclub-web (sibling repo) requiring changes

| File | Change | Phase |
|---|---|---|
| `cultrclub-web/lib/creators/db.ts:1252-1397` | `creator_customer_portfolio.stripe_subscription_id` reads — switch to COALESCE shim, then to `provider_subscription_id` only after phase 6 | 2, 6 |
| `cultrclub-web/lib/config/affiliate.ts:120` | Drop `stripe_subscription_id` field from interface | 6 |

cultrclub-web does NOT need the CorePay code path (it doesn't take payments).

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Path A card-update flow doesn't actually cascade to active subs (next billing uses old card) | HIGH | Sandbox spike in Phase 1. If confirmed, default to Path B (create new payment profile + ARBUpdateSubscription). |
| Authorize.Net webhook delivery flakiness (community-reported) | MEDIUM | Daily reconciliation cron from Phase 1 onward. |
| Double-charge during migration (Stripe in-flight invoice + new CorePay charge) | HIGH | Void open Stripe invoices BEFORE cancel during the migration transaction. Documented in "Existing-Subscriber Migration" section. |
| Two apps (cultrhealth.com + cultrclub-web) deploying out of sync drops a column the other app still reads | HIGH | Phase 6 column drops MUST happen after both apps have deployed the COALESCE-removal release. Coordinate via PROJECT.md/deploy-runbook. |
| Stripe webhook retries an old event after handler is deleted | LOW | Keep `app/api/webhook/stripe/route.ts` as a 410 Gone responder for 6 months post-Phase 6. |
| Authorize.Net rate limits during one-time migration_tokens seeding | MEDIUM | Throttle the seeding job to ≤10 calls/sec. Run in batches during off-hours. |
| Customer enters CorePay form, Authorize.Net sub creation succeeds, DB write fails | HIGH | Wrap Steps 5b-5e in defensive try/catch; on DB failure, IMMEDIATELY call `ARBCancelSubscription` to roll back the just-created sub. Sentry on the rollback. |
| Re-onboarding emails marked as spam / users miss them | MEDIUM | Send via Resend's transactional pipeline (already used). Send a reminder on day 14 and a final on day 25. |
| `class-variance-authority` listed in deps but unused (per CLAUDE.md) — adds noise during the "remove stripe" cleanup | LOW | Take the opportunity to clean up unused deps in Phase 6's package.json edit. |

---

## Sources

- [Authorize.Net Webhook API Reference](https://developer.authorize.net/api/reference/features/webhooks.html) — confirmed `X-ANET-Signature` HMAC-SHA512 header and full ARB event taxonomy
- [Authorize.Net Customer Profiles Reference](https://developer.authorize.net/api/reference/features/customer-profiles.html) — confirmed CIM 10 payment profiles per customer profile, profile lookup by email/customerID
- [Authorize.Net Accept.js Reference](https://developer.authorize.net/api/reference/features/acceptjs.html) — confirmed CDN-loaded, browser-only, runtime-agnostic
- [Authorize.Net KB: ARB + CIM](https://support.authorize.net/knowledgebase/Knowledgearticle/?code=KA-04444) — `ARBUpdateSubscriptionRequest` accepts customerProfileId/paymentProfileId
- [Authorize.Net Developer Community: ARB webhook reliability](https://community.developer.cybersource.com/t5/Integration-and-Testing/ARB-Subscription-webhooks-not-working/td-p/63173) — community-reported delivery issues that justify polling fallback
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) — Fluid Compute 300s default; 800s max on Pro
- [Brandur: Postgres safe table renames with views](https://brandur.org/fragments/postgres-table-rename) — expand→contract pattern
- [GoCardless: Zero-downtime Postgres migrations](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/) — additive-then-subtractive guidance
- [Cloudflare Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-standards/) — `crypto.subtle` works in edge without `nodejs_compat`
- Internal: `migrations/004_payment_provider.sql` — already-shipped additive provider columns
- Internal: `app/api/webhook/stripe/route.ts` (1021 lines) — the side-effect reference for what `lib/webhooks/dispatcher.ts` must implement
- Internal: `lib/payments/corepay-gateway.ts` — current ARB-create scaffolding
- Internal: `app/api/checkout/corepay/route.ts` — current CorePay checkout (with `stripe_customer_id: 'corepay_…'` hack to remove)
- Internal: `migrations/062_order_attributions_discount_snapshot.sql` — precedent for snapshotting discount values at attribution time
- Internal: `lib/config/coupons.ts` — `CLUB_COUPONS` + `validateCoupon` patterns to extend
- Internal: `migrations/016_stripe_promotion_codes.sql` — the `affiliate_codes.stripe_*` columns to drop in Phase 6
