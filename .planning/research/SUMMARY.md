# v2.0 Research Synthesis — Stripe → Corepay (Authorize.Net gateway) Replacement

> **⚠️ Vocabulary clarification — read this first:**
>
> Three confusingly similar names mean three different things in CULTR's payment stack. Don't conflate them.
>
> - **Corepay** (`corepay.net`) — CULTR's merchant ISO (Independent Sales Organization, registered with Esquire Bank, N.A.). **Does not operate its own gateway API.** Bundles one of four underlying gateways: NetValve, **Authorize.Net**, NMI, or FreedomPay. **CULTR's Corepay merchant uses Authorize.Net.**
> - **Authorize.Net** — the underlying gateway. All API calls in `lib/payments/corepay-gateway.ts` target `api.authorize.net/xml/v1/request.api`. Every "Authorize.Net" reference in this document refers to the actual integration target.
> - **Corpay** (`corpay.com`, a **Fleetcor** company) — completely separate company despite the similar name. B2B cross-border payouts / FX / international wire transfers. Reference-only `corpay-crossborder` skill captures this so future sessions don't re-confuse it with Corepay. **NOT in v2.0 scope.**
>
> All "CorePay" references in this document have been corrected to "Corepay" (the actual merchant ISO) or to "Authorize.Net" (the actual gateway), depending on which is meant.

**Synthesized:** 2026-04-27
**Source files:**
- `.planning/research/STACK.md` (v2.0 — Stripe removal + Authorize.Net buildout)
- `.planning/research/FEATURES.md` (v2.0 — gap map vs Stripe behavior)
- `.planning/research/ARCHITECTURE.md` (v2.0 — webhook/CIM/migration topology)
- `.planning/research/PITFALLS.md` (v2.0 — Stripe→Authorize.Net migration risks)

**Overall confidence:** HIGH for stack, features, and migration sequencing. MEDIUM for two specific Authorize.Net behaviors flagged for sandbox spike (CIM card-update cascade, Account Updater coverage).

> **Roadmapper:** read this file end-to-end. The bottom-line decisions and the seven locked-in architectural choices below should drive phase boundaries. Open questions in §6 must be resolved in sandbox **before** Phase 1 ships.

---

## 1. Bottom-Line Decisions (the eight things that matter)

1. **Do NOT install the `authorizenet` npm package.** It ships axios with an open DoS CVE (issue #102), pulls in `winston-daily-rotate-file` (writes to `fs`), is CommonJS-only, and breaks edge runtime. Keep extending the existing `gatewayFetch()` in `lib/payments/corepay-gateway.ts` — every Authorize.Net request shares the same `merchantAuthentication`-wrapped envelope.
2. **Migration `004_payment_provider.sql` already shipped.** Half the "rename `stripe_*` → `provider_*`" work is done. The remaining work is **dual-write + expand-contract cutover**, NOT fresh column renames. Four tables (`creator_customer_portfolio`, `siphox_kit_orders`, `pending_intakes`, `affiliate_codes` cleanup) still need provider columns added or `stripe_*` columns dropped.
3. **Inngest / Vercel Workflow are NOT needed.** Authorize.Net webhooks are stateless single-step (verify → write → 200), the platform retries natively, and a Postgres `webhook_events` idempotency table covers everything. Use `crypto.createHmac('sha512', …)` (Node) or `crypto.subtle.verify(…)` (edge) — both built-in.
4. **`ARBUpdateSubscriptionRequest` does NOT prorate, does NOT charge difference, and only takes effect on the next billing cycle.** Mid-cycle upgrades must be implemented as **cancel-and-recreate with proration math** + a one-shot CIM `createTransactionRequest` for the prorated charge.
5. **Run BOTH webhook handlers in parallel during the migration window.** Killing `app/api/webhook/stripe/route.ts` on day 1 would orphan in-flight Stripe events for ~hundreds of unmigrated subs. The Stripe handler becomes a maintenance route until `COUNT(*) WHERE payment_provider='stripe' AND status='active' = 0`.
6. **One CIM customer profile per email (lifetime). Many payment profiles per customer profile (one per saved card).** ARB references a customer-profile + payment-profile by ID; this decoupling is what makes pause/resume and card-update flows clean.
7. **Vercel Fluid Compute (300s default, 800s max) is the runtime.** The "60-90s legacy serverless" assumption in early scoping is wrong for this Pro project. Sequential Authorize.Net calls (3-8s happy path) fit trivially in a single function — no async pattern needed for checkout.
8. **The single new runtime dependency is `@sentry/nextjs@^10.50.0`.** Install via `npx @sentry/wizard@latest -i nextjs`. Everything else is built-in (`fetch`, `node:crypto`, `crypto.subtle`, `@vercel/postgres`, `zod`, `jose`, `resend`, `@react-pdf/renderer`).

---

## 2. Stack Additions

### Install (single command)

```bash
# Only new runtime dependency
npx @sentry/wizard@latest -i nextjs
# Resolves to: @sentry/nextjs@^10.50.0
# Auto-creates: instrumentation.ts, sentry.{server,edge,client}.config.ts
# Auto-wraps: next.config.js with withSentryConfig()
```

### Do NOT install

| Package | Reason |
|---|---|
| `authorizenet` | axios CVE (issue #102), CJS-only, `winston-daily-rotate-file` requires `fs`, 946KB unpacked, stale `@types` from 2023-11 |
| `@types/authorizenet` | Last updated 2023-11; describes 1.0.8, runtime is 1.0.10. We own our types in `payment-types.ts` |
| `axios` | Native `fetch()` already in use; would be a regression |
| `inngest` | No multi-step workflows in v2.0 scope; native HMAC + cron sufficient |
| `@vercel/workflow` | Same reasoning; also beta-tier with frequent API changes |
| `crypto-js` / `jsrsasign` | Node `crypto.createHmac` and Web `crypto.subtle` are built-in |
| Redis (Upstash) for webhook idempotency | Postgres `INSERT … ON CONFLICT DO NOTHING` is sufficient |
| BullMQ / SQS / any queue | Authorize.Net retries natively; webhooks are single-step |
| Datadog APM (alongside Sentry) | Sentry covers errors + perf + edge in one tool |

### Remove after Phase 7 (post-cutover)

```bash
npm uninstall stripe @stripe/stripe-js @stripe/react-stripe-js
```

Conditions: re-onboarding window closed, all `app/api/stripe/**` + `app/api/webhook/stripe/**` deleted, schema drops migrated, Sentry shows zero traffic to Stripe-prefixed routes for 14 consecutive days.

### Use what's already in the stack

| Package | Purpose in v2.0 |
|---|---|
| `next@^14.2.0` | App Router routes, middleware, instrumentation hook |
| `@vercel/postgres@^0.10.0` | `webhook_events`, `coupon_redemptions`, `migration_tokens` tables |
| `zod@^3.23.0` | Validate webhook event schemas |
| `jose@^6.1.3` | Re-onboarding magic-link tokens |
| `resend@^4.0.0` | Receipts + dunning + re-onboarding emails |
| `@react-pdf/renderer@^4.3.2` | Branded receipt PDFs (existing `lib/invoice/` is the model) |
| `node:crypto` | `createHmac('sha512',…)` + `timingSafeEqual` for webhook verify |
| `crypto.subtle` | Edge-runtime HMAC verify path (cultrclub-web parity) |

---

## 3. Feature Table (table-stakes / differentiator / anti-feature)

Categorized by area. Complexity: **S** = small, **M** = medium, **L** = large.

### Lifecycle (subscription state machine)

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 3.1 | Cancel (soft, end-of-period default) — soft-cancel + `ARBCancelSubscription` + `access_until` cron downgrade | Table-stakes | M |
| 3.2 | Cancel (immediate, no refund) — admin-only path | Table-stakes | S |
| 3.3 | Update card on file via Accept.js + CIM `updatePaymentProfile` | Table-stakes | M |
| 3.4 | Mid-cycle upgrade with proration math (cancel-and-recreate + one-shot CIM charge for diff) | Table-stakes | L |
| 3.5 | Initial subscription charge (split: `createTransaction` month 1 + ARB starting month 2) | Table-stakes | M |
| 3.6 | Reactivate canceled sub before `access_until` (no charge) | Table-stakes | S |
| 3.7 | Pause via cancel-and-recreate w/ retained CIM profile + auto-resume cron | Differentiator | L |
| 3.8 | Downgrade with end-of-period swap | Differentiator | L |
| 3.9 | Switch billing anchor date | Differentiator | L |
| 3.10 | Annual plans | Differentiator | M |

### Coupons (Authorize.Net has no native primitive)

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 4.1 | DB-ize coupon entity + CRUD (replaces hardcoded `CLUB_COUPONS`) | Table-stakes | M |
| 4.2 | Coupon validation API (extend `validateCouponUnified()`) | Table-stakes | S |
| 4.3 | Apply coupon at checkout: bake `effectiveAmount` into ARB sub | Table-stakes | M |
| 4.4 | `FOUNDER15` (forever) — bake-once, no scheduled update | Table-stakes | S |
| 4.5 | `FIRSTMONTH` (once) — split: `createTransaction` month 1 discounted + ARB month 2 full price | Table-stakes | M |
| 4.6 | Creator-code attribution preserved on ARB charges via `coupon_redemptions` table | Table-stakes | M |
| 4.7 | Migration job: re-apply Stripe coupons to ARB subs at cutover | Table-stakes | L |

### Portal (`/portal/billing` — zero hosted UI from Authorize.Net)

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 5.1 | View active sub (tier, price, next billing, last 4) | Table-stakes | S |
| 5.2 | Update card on file (Accept.js + CIM update) | Table-stakes | M |
| 5.3 | Cancel subscription (soft, end-of-period default) | Table-stakes | S |
| 5.4 | Billing history (last 12mo from CULTR DB) | Table-stakes | M |
| 5.5 | Branded receipt PDF download (reuse `@react-pdf/renderer`) | Table-stakes | M |
| 5.6 | Update billing email | Table-stakes | S |
| 5.7 | Cancellation flow with reason capture | Table-stakes | S |
| 5.8 | "End-of-period" vs "Immediate" cancel toggle | Table-stakes | S |
| 5.9 | Resume canceled sub within 30-day grace | Table-stakes | M |

### Webhooks (HMAC-SHA512 + idempotency + provider-agnostic dispatcher)

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 6.1 | HMAC-SHA512 verifier (raw body, `X-ANET-Signature`, length-checked `timingSafeEqual`) | Table-stakes | S |
| 6.2 | `webhook_events` idempotency table (provider+event_id PK) | Table-stakes | S |
| 6.3 | `lib/webhooks/dispatcher.ts` — provider-agnostic side-effect helpers | Table-stakes | M |
| 6.4 | Subscription created → activate membership + Healthie + SiPhox + attribution + welcome | Table-stakes | M |
| 6.5 | Payment captured → record transaction, fire receipt | Table-stakes | M |
| 6.6 | Refund → reverse commission via existing helper | Table-stakes | S |
| 6.7 | Subscription suspended → start dunning ladder | Table-stakes | M |
| 6.8 | Subscription terminated/cancelled → downgrade to Club | Table-stakes | S |
| 6.9 | Daily reconciliation cron (`ARBGetSubscriptionStatus`; alert on drift) | Table-stakes | M |
| 6.10 | Sentry alert on HMAC mismatch / unknown event types / >5s latency | Table-stakes | M |

### Refunds & Voids

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 7.1 | Unified `/api/refunds/create` — voids if pre-settle, refunds if post | Table-stakes | M |
| 7.2 | Admin "Refund" button on transaction detail | Table-stakes | S |
| 7.3 | Refund email with mechanism-matched language | Table-stakes | S |
| 7.4 | Refund commission reversal | Table-stakes | S |
| 7.5 | Partial refund | Table-stakes | S |

### Receipts

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 8.1 | Branded receipt email on every successful charge | Table-stakes | M |
| 8.2 | PDF attachment via `@react-pdf/renderer` | Table-stakes | M |
| 8.3 | Disable Authorize.Net plain-text merchant-interface receipt | Table-stakes | S |
| 8.4 | Failed payment email | Table-stakes | S |
| 8.5 | Successful renewal email (Stripe parity) | Table-stakes | S |
| 8.6 | Subscription canceled confirmation email | Table-stakes | S |
| 8.7 | Card-on-file expiring soon (-30d, -7d) | Table-stakes | S |

### Dunning

| # | Feature | Tier | Complexity |
|---|---|---|---|
| 9.1 | Webhook handler for `subscription.suspended` / `subscription.failed` | Table-stakes | M |
| 9.2 | `past_due` state on subscription entity | Table-stakes | S |
| 9.3 | Dunning email cadence: +0, +24h, +72h, +7d, +14d | Table-stakes | M |
| 9.4 | Retry job: re-attempt failed charges via stored CIM profile | Table-stakes | M |
| 9.5 | Account Updater enabled at merchant level | Table-stakes | S |
| 9.6 | Final cancellation + downgrade after retry exhaustion | Table-stakes | S |

---

## 4. Architecture Decisions Locked In (the seven choices research has settled)

These are NOT open questions for the roadmapper. Research has resolved them.

### 4.1 Both webhook handlers run in parallel during migration window

`app/api/webhook/stripe/route.ts` stays alive through Phases 1-6; deleted (or 410-Gone'd) only when `SELECT COUNT(*) FROM memberships WHERE payment_provider='stripe' AND subscription_status='active' = 0`. Killing it earlier orphans in-flight events for unmigrated subs.

### 4.2 One CIM customer profile per email (lifetime), many payment profiles

- Customer profile: lifetime per email; up to 10 payment profiles + 100 shipping per customer profile (Authorize.Net hard limit).
- Payment profile: one per saved card.
- ARB subscription: independent object that *references* customer-profile + payment-profile by ID.
- Memberships table: add `provider_payment_profile_id VARCHAR(255)`.

### 4.3 Card update default: Path B (new payment profile + `ARBUpdateSubscriptionRequest`)

- **Path A:** `updateCustomerPaymentProfile` in place. Confidence MEDIUM-HIGH; explicit guarantee not found in docs.
- **Path B:** `createCustomerPaymentProfile` (new ID) → `ARBUpdateSubscriptionRequest` to point ARB at new ID. Verbose but unambiguous.

**Default to Path B** until Path A is proven in sandbox spike (§6 Q1).

### 4.4 Stripe in-flight invoice handling: `voidInvoice()` BEFORE `subscriptions.cancel()`

Hard rule for migration code: `stripe.invoices.list({ subscription: legacyId, status: 'open' })` → `stripe.invoices.voidInvoice(id)` → THEN `stripe.subscriptions.cancel(legacyId)`. Skipping the void step risks an in-flight Stripe invoice posting after the new CorePay sub starts — a real double-charge.

### 4.5 Vercel Fluid Compute (300s default timeout) — no async pattern needed for checkout ✅ Q2 verified 2026-05-03

Sequential calls in checkout: `createCustomerProfile` (1-3s) + `ARBCreateSubscription` (2-5s) = 3-8s happy path. Synchronous checkout returns redirect immediately; heavy side-effects (Healthie, SiPhox, Mailchimp) happen via `webhook/corepay` on `subscription.created` — same pattern as today's Stripe flow.

**Q2 verification (2026-05-03):** Vercel API confirms `defaultResourceConfig.fluid: true`, `functionDefaultTimeout: 300`, Node 24.x, region iad1, elastic concurrency enabled. Project `prj_wbOquok7XmpqeTYyiu7RNRbhNLCd` (`stuntmandavers-projects/cultrhealth`). Evidence captured in `.planning/research/SANDBOX-GATE-RUNBOOK.md` Q2 section.

### 4.6 Coupon source-of-truth: `coupon_redemptions` at redeem time; `order_attributions` for commission

| Question | Source |
|---|---|
| "Did this customer redeem code X?" | `coupon_redemptions` (snapshots discount %, original amount, applied_to_billing_cycles) |
| "What's a creator's earned commission?" | `order_attributions` + `commission_ledger` (existing tables; lifecycle is non-trivial — don't re-engineer) |
| "Which creator gets attribution?" | JOIN `coupon_redemptions.code_id → affiliate_codes.id → creators.id` |

`FOUNDER15` (forever) bakes pre-discounted amount into ARB sub at creation; `FIRSTMONTH` (once) uses ARB `trialOccurrences` + `trialAmount`.

### 4.7 Webhook side-effects extracted to `lib/webhooks/dispatcher.ts`

Today, `app/api/webhook/stripe/route.ts` is 1020 lines with side effects inlined. Phase 2 lifts these into provider-agnostic helpers:

```ts
onSubscriptionActivated({ provider, providerCustomerId, providerSubscriptionId, email, planTier, attributionCookie?, couponCode? })
onSubscriptionCancelled({ provider, providerSubscriptionId, reason? })
onSubscriptionPastDue({ provider, providerSubscriptionId })
onPaymentSucceeded({ provider, providerSubscriptionId, amountCents })
onRefunded({ provider, providerTransactionId, amountCents })
```

DRY across providers.

---

## 5. Top 5 Pitfalls (likelihood × impact)

### 5.1 Coupon timing race (the 2 AM PT cron edge case)

**What goes wrong:** "FOUNDER15 = 15% off forever" requires `ARBUpdateSubscriptionRequest` BEFORE each renewal. ARB processes daily at ~2:00 AM PT. Cron after 2:00 AM PT → member charged full price.

**Likelihood:** HIGH. **Impact:** HIGH (silent revenue/commission errors).

**Mitigation:** Architecture-level — bake pre-discounted amount into `provider_subscriptions.next_billing_amount` at coupon redemption. No cron-timing dependency. Auto-credit fallback if missed.

### 5.2 Creator commission backfill miss at cutover

**What goes wrong:** Re-onboarding has no attribution carryforward. Existing Stripe subs lose 100% creator attribution day-of-cutover.

**Likelihood:** Certain at cutover. **Impact:** Critical (50% creator revenue gone).

**Mitigation:** Pre-cutover backfill script populates `subscription_attributions` table from existing Stripe subs. Re-onboarding endpoint reads this and inherits creator_id/code_id.

### 5.3 Subscription status drift / double charge during migration

**What goes wrong:** Member's Stripe sub renews while Authorize.Net sub also charges (member ignored re-onboarding email until after Stripe renewal day).

**Likelihood:** High during cutover window. **Impact:** Critical (lawsuit + reputation).

**Mitigation:** 4-step ops sequence:
1. Disable creation of new Stripe subscriptions (feature flag).
2. `cancel_at_period_end: true` on every active Stripe sub.
3. Re-onboarding ARB `startDate = stripe_period_end + 1`.
4. Stripe webhook handler runs for 30 days post-cutover.

**Plus:** void open Stripe invoices BEFORE canceling subscription.

### 5.4 Healthie integration miss in strip-Stripe sweep

**What goes wrong:** CorePay webhook deployed without Healthie hook → new members post-Healthie-API-arrival never get EHR records.

**Likelihood:** Medium. **Impact:** High (silent broken EHR creation).

**Mitigation:** Add TODO stub in CorePay webhook NOW; maintain `INTEGRATION_TRIGGER_MATRIX.md`; integration test mocks all downstream calls.

### 5.5 DB column rename without expand-contract (cross-app breakage)

**What goes wrong:** cultrhealth.com (Vercel) and cultrclub-web (Cloudflare Pages) deploy independently but share Neon DB. Direct `ALTER TABLE … RENAME COLUMN` breaks both during deploy window.

**Likelihood:** Medium (engineering rigor). **Impact:** Critical (cross-app site-down).

**Mitigation:** 3-deploy expand-contract:
1. **Expand:** Already done (migration 004). Backfill values. Code reads `COALESCE(new, old)`, writes both. Wait 1 hour.
2. **Switch:** Code reads/writes only new column. Wait 24 hours.
3. **Contract:** DROP old column (or rename to `_legacy`).

Gated on cross-app deploy checklist. Clean macOS-duplicate `*_2.sql`, `*_4.sql` migration files first.

---

## 6. Open Questions for Sandbox Verification BEFORE Phase 1

### Q1: CIM payment profile update cascade to ARB? (Path A vs Path B)
**Default if unverified:** Path B.
**To verify:** Sandbox — create ARB sub → `updateCustomerPaymentProfile` with new opaqueData → trigger next charge → confirm new card was billed.

### Q2: Vercel staging on Fluid Compute or legacy serverless?
**Default if unverified:** Fluid (300s).
**To verify:** `vercel project inspect` on cultrhealth.com staging. Look for `runtimeVersion` or `compute.fluid` flags.
**If legacy (60s):** Async pattern needed for checkout.

### Q3: Existing Sentry project on cultrhealth.com?
**Default if unverified:** Wizard creates new.
**To verify:** Sentry dashboard for `cultrhealth` org. Check `.env.example` for `SENTRY_*`.

### Q4: Account Updater enabled on the CorePay merchant account?
**Default if unverified:** Assume not. Manual card-expiry email pipeline required.
**To verify:** Authorize.Net merchant interface → Account → Security Settings → Account Updater.
**Note:** Paid add-on. Confirm cost.

### Q5: CIM payment profile retention policy?
**Default if unverified:** Retain indefinitely (deletion is unrecoverable).
**To verify:** Authorize.Net merchant interface for retention auto-purge. Test: what happens to ARB sub when payment profile is deleted?

### Q6: Authorize.Net first-charge limitation — does ARB charge day 1?
**Default per docs:** ARB schedules first charge per the schedule, NOT on creation.
**To verify:** Sandbox — `ARBCreateSubscriptionRequest` with `paymentSchedule.startDate = today` → does first transaction post immediately?
**If does NOT charge day 1:** Must split: `createTransactionRequest` for month 1 + ARB starting `+1 month`.

---

## 7. Suggested Phase Decomposition (8 phases — continues v1.0 numbering)

### Phase 6 — Skills (independently shippable, pure docs)

- `corepay-api/SKILL.md` — Authorize.Net ARB + CIM + Accept.js + webhook reference.
- `healthie-api/SKILL.md` — Healthie EHR (gated on Plus-plan API key).
- `corpay-crossborder/SKILL.md` — reference-only for future creator international payouts.
- `siphox-api/SKILL.md` — refresh: known auth-header bug, smart polling, biomarker mapping.

### Phase 7 — Schema/gateway plumbing (no customer-facing changes)

- Migration `063_webhook_events.sql`.
- Migration `064_provider_payment_profile_id.sql`.
- `lib/payments/authorize-net-cim.ts` — CIM helpers.
- `lib/payments/authorize-net-arb.ts` — ARB lifecycle helpers.
- `lib/payments/authorize-net-charges.ts` — `chargeOpaqueData`, `refundTransaction`, `voidTransaction`, `getTransactionDetails`.
- `app/api/webhook/corepay/route.ts` — HMAC-SHA512 verifier, idempotency. Zero live customers.
- `instrumentation.ts` + Sentry boot validation (fail loud at startup if DSN missing).
- `app/api/cron/reconcile-arb-subscriptions/route.ts` — deploy-gated; not in `vercel.json` until Phase 9.

### Phase 8 — Subscription lifecycle core (refactor; no behavior change)

- `lib/webhooks/dispatcher.ts` — provider-agnostic side-effect helpers.
- Update Stripe + CorePay webhook routes to call dispatcher.
- `getProviderIds(membership)` helper. COALESCE shim across `lib/db.ts`, `lib/admin-types.ts`, `lib/creators/db.ts` (5 sites), `lib/siphox/db.ts` (4 sites), admin clients.

### Phase 9 — Coupon engine

- Migration `065_coupon_redemptions.sql`.
- `validateCouponForSubscription(code, planSlug, email)`.
- `lib/coupons/redemption.ts` — `recordCouponRedemption(...)` called from both checkout routes.
- Drop Stripe coupon sync in admin routes.
- FOUNDER15 prefund (bake-once into ARB amount).
- FIRSTMONTH split (`trialOccurrences` + `trialAmount` OR two-step).
- Creator attribution backfill table for cutover.

### Phase 10 — Self-service portal UI (`/portal/billing` complete)

- Update `app/join/[tier]/page.tsx` + `app/pricing/PricingClient.tsx` — feature flag.
- Update `app/api/checkout/corepay/route.ts` — drop `stripe_customer_id: 'corepay_…'` hack.
- Update `app/success/page.tsx` — handle `provider=corepay`.
- Update `app/api/intake/submit/route.ts` — match `provider_subscription_id`.
- New `app/portal/billing/page.tsx` + `BillingClient.tsx`.
- New `app/api/portal/billing/{cancel,pause,resume,update-card}/route.ts`.
- Add `reconcile-arb-subscriptions` to `vercel.json` crons.
- Roll out: staging flag-flipped → 5% canary → ramp.

### Phase 11 — Receipts + dunning ladder

- Receipt template via `@react-pdf/renderer`.
- Disable Authorize.Net merchant-interface receipts.
- Receipt-on-charge pipeline.
- Failed payment email + dunning ladder (+0/+24h/+72h/+7d/+14d).
- Retry cron (re-attempt failed charges via stored CIM profile).
- Successful renewal email.
- Card-on-file expiring (-30d, -7d).
- Account Updater enable (gated on Q4).
- Final cancellation + downgrade after retry exhaustion.

### Phase 12 — Migration cutover (re-onboarding flow)

- Migration `066_migration_tokens.sql` (token_hash SHA-256, state machine, 30-day expiry).
- New `app/migrate/[token]/page.tsx` + `MigrateClient.tsx`.
- New `app/api/migrate/complete/route.ts` — atomic flow:
  1. Revalidate token.
  2. CIM `createCustomerProfileRequest`.
  3. ARB `createSubscription`. (On failure: rollback CIM via `deleteCustomerProfile`.)
  4. Stripe in-flight invoice void.
  5. Stripe `subscriptions.cancel(legacyId)`. (On failure: log to Sentry; don't throw.)
  6. DB transaction: update `memberships` + `migration_tokens` atomically.
  7. Confirmation email.
- `scripts/seed-migration-tokens.mjs` — throttle ≤10 calls/sec.
- `app/api/cron/sunset-stripe-subscriptions/route.ts`.
- 4-step ops sequence (per §5.3 mitigation).

### Phase 13 — Refunds + admin reporting + hardening tests

- Convert 6 admin routes to `lib/payments/provider.ts` adapter.
- Unified `/api/refunds/create`.
- Admin "Refund" + "Settlement status" UI.
- Member self-service refund request.
- MRR / cohort retention / coupon ROI / dunning effectiveness dashboards.
- Delete Stripe checkout routes + webhook (gated on `COUNT WHERE provider='stripe' AND active=0`).
- Migration `067_drop_stripe_coupon_columns.sql`.
- Migration `068_drop_legacy_stripe_columns.sql` (gated on cross-app deploy checklist).
- `npm uninstall stripe @stripe/stripe-js @stripe/react-stripe-js`.
- Drop `STRIPE_*` env vars.
- Hardening tests: full happy path + 5 failure modes per §5.

---

## 8. Migration 004 Finding — Schema Work Is Partially Done

Migration `004_payment_provider.sql` already shipped to production:

- `memberships.payment_provider`, `provider_customer_id`, `provider_subscription_id`
- `orders.payment_provider`, `provider_transaction_id`
- `CHECK (payment_provider IN ('stripe','authorize_net','klarna','affirm'))`

Legacy `stripe_*` columns preserved alongside. **Remaining work is dual-write + expand-contract cutover, NOT fresh column renames.**

### Tables that DO still need provider columns added/touched

| Table | Missing column / cleanup | Owner | Phase |
|---|---|---|---|
| `creator_customer_portfolio` | `provider_subscription_id` | shared (cultrhealth + cultrclub-web) | 7 → 8 → 13 |
| `siphox_kit_orders` | `provider_subscription_id` | cultrhealth | 7 → 8 → 13 |
| `pending_intakes` | provider-equivalent of `stripe_payment_intent_id` (which actually stores `cs_…` checkout session IDs — misnamed) | cultrhealth | 7 → 8 → 13 |
| `affiliate_codes` | DROP `stripe_coupon_id` + `stripe_promotion_code_id` (no add — pure cleanup) | cultrhealth | 9 → 13 |

### What `stripe_events` is (PROJECT.md imprecision)

PROJECT.md says "drop `stripe_events`." The actual table is `stripe_idempotency` (migration `007`). New `webhook_events` replaces it for both providers; `stripe_idempotency` dropped after Phase 13.

### Cleanup prerequisite

`migrations/` has macOS-duplicate files that must be cleaned first:
- `058_add_creator_jonas_machado 2.sql`, `058_add_creator_jonas_machado 4.sql`
- `059_update_jonas_machado_commission 2.sql`, `059_update_jonas_machado_commission 4.sql`
- `057_signup_coupon_codes 2.sql`

These risk accidental delete-twice if a tooling glob picks up the wrong files. Clean before Phase 7 ships.

---

## 9. Confidence Assessment

| Area | Confidence | Rationale |
|---|---|---|
| Stack additions | HIGH | Verified against npm registry, Authorize.Net docs, project source |
| Feature gap map | HIGH | Stripe + Authorize.Net docs are authoritative |
| Architecture | HIGH for runtime/Postgres/Vercel; MEDIUM for two Authorize.Net subtleties (Path A cascade, Account Updater) |
| Pitfalls | HIGH | v2.0 risks anchored to ARCHITECTURE.md risk register + CLAUDE.md incident log |

### Gaps to address during planning

1. **Q1-Q6 sandbox verifications (§6).** Block defaults; do BEFORE Phase 7 (the first build phase).
2. **Cross-app deploy coordination.** Build a runbook checklist before Phase 13.
3. **CorePay merchant interface admin credentials.** Confirm someone has them before Phase 7.

---

*Synthesized 2026-04-27 from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md.*
*Roadmapper consumes this next: read §1, §4, §5, §6, §7 first; reference §3 + §8 as you decompose phases.*
