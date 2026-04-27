# Requirements: v2.0 Stripe → CorePay (Authorize.Net) replacement

**Defined:** 2026-04-27
**Core Value:** Strip Stripe entirely from CULTR Health, replace with Authorize.Net via the existing "CorePay" merchant brand, ship four Claude skills so future sessions don't re-make Stripe assumptions. No Stripe code or `STRIPE_*` env vars in the repo at end of milestone.

**Phase numbering:** continues from v1.0 (Phase 5 was last). v2.0 spans Phases 6–13.

**Source plan:** `/Users/davidk/.claude/plans/async-petting-fern.md` (approved 2026-04-27)
**Research synthesis:** `.planning/research/SUMMARY.md`

---

## v2.0 Requirements

### Skills (Phase 6 — pure documentation, zero production risk)

- [ ] **SKL-01**: `.claude/skills/corepay-api/SKILL.md` exists with frontmatter, gotchas (no `authorizenet` SDK, `gatewayFetch()` pattern, `merchantAuthentication` envelope, Accept.js single-use 15-min token, HMAC-SHA512 with `request.text()`, ARB next-cycle-only updates), and references for ARB/CIM/transactions/webhooks/integration patterns.
- [ ] **SKL-02**: `.claude/skills/healthie-api/SKILL.md` exists with auth (Basic not Bearer), AuthorizationSource header, raw-body webhook signature verification, ActionCable not graphql-ws, ~120 webhook events catalogued, top mutations + queries, CULTR integration map.
- [ ] **SKL-03**: `.claude/skills/corpay-crossborder/SKILL.md` exists as reference-only — explicitly notes it is **NOT** the consumer subscription processor and reserved for potential future creator-payout/international vendor work.
- [ ] **SKL-04**: `.claude/skills/siphox-api/SKILL.md` refreshed — adds "Known repo bug" gotcha pointing at `lib/siphox/client.ts:80` (`Bearer` should be `Token`), drops the gotcha after Phase 13 fixes the bug.
- [ ] **SKL-05**: `.gitignore` exceptions added for the three new skill directories (matches existing `siphox-api` pattern).

### Schema + Gateway Plumbing (Phase 7 — backend, no customer-facing changes)

- [ ] **PLB-01**: Migration `063_webhook_events.sql` creates a provider-agnostic event log: `(id, provider, event_id, event_type, raw_payload JSONB, processed_at)` with unique constraint on `(provider, event_id)`.
- [ ] **PLB-02**: Migration `064_provider_payment_profile_id.sql` adds `memberships.provider_payment_profile_id VARCHAR(255)` for CIM payment profile reference.
- [ ] **PLB-03**: Migration `065_provider_columns_remaining_tables.sql` adds `provider_subscription_id` to `creator_customer_portfolio` and `siphox_kit_orders`, adds `provider_payment_intent_id` to `asher_orders`, adds `provider_checkout_id` to `pending_intakes` (renames the misnamed `stripe_payment_intent_id` which actually stores `cs_*` checkout session IDs).
- [ ] **PLB-04**: macOS-duplicate migration files (`057_*_2.sql`, `058_*_2.sql`, `058_*_4.sql`, `059_*_2.sql`, `059_*_4.sql`) are removed from the repo before any new migration ships.
- [ ] **PLB-05**: `lib/payments/authorize-net-cim.ts` exposes `createCustomerProfile`, `addPaymentProfile`, `getCustomerProfile`, `updateCustomerPaymentProfile`, `deleteCustomerProfile` — all using `gatewayFetch()`.
- [ ] **PLB-06**: `lib/payments/authorize-net-arb.ts` exposes `cancelSubscription`, `getSubscriptionStatus`, `updateSubscription` (with explicit "next-cycle-only" docstring) — all using `gatewayFetch()`.
- [ ] **PLB-07**: `lib/payments/authorize-net-charges.ts` exposes `chargeOpaqueData`, `chargeCustomerProfile`, `refundTransaction`, `voidTransaction`, `getTransactionDetails` — all using `gatewayFetch()`.
- [ ] **PLB-08**: `lib/payments/corepay-webhooks.ts` exposes `verifyCorepayWebhook(rawBody, headers, secret)` — HMAC-SHA512 over raw body, header `X-ANET-Signature: sha512=<hex>`, length-checked `timingSafeEqual` constant-time compare.
- [ ] **PLB-09**: `app/api/webhook/corepay/route.ts` registered, reads body via `request.text()`, verifies signature, looks up `webhook_events` for idempotency, dispatches via `lib/webhooks/dispatcher.ts` (Phase 8).
- [ ] **PLB-10**: Webhook IP allowlist active: `198.241.206.38`, `198.241.207.38`. Belt-and-braces with signature; non-allowlist IP with valid signature is logged (not rejected) for graceful handling of Authorize.Net IP rotation.
- [ ] **PLB-11**: Boot-time CorePay credential validation: `instrumentation.ts` calls `authenticateTestRequest`. On Code 13 → loud failure, refuse to start. Prevents sandbox-creds-in-prod / vice-versa silent failure.
- [ ] **PLB-12**: `@sentry/nextjs@^10.50.0` installed via `npx @sentry/wizard@latest -i nextjs`. `instrumentation.ts` + 3 config files + `withSentryConfig()` wrapper. PHI redaction `beforeSend` hook configured.
- [ ] **PLB-13**: `app/api/admin/corepay-smoke/route.ts` runs sandbox round-trip: auth check, customer profile create, payment profile add, ARB create at $1, ARB cancel, refund. Mirrors `siphox-smoke` pattern.

### Subscription Lifecycle Core (Phase 8 — refactor; no behavior change visible)

- [ ] **LFC-01**: `lib/webhooks/dispatcher.ts` exposes provider-agnostic side-effect helpers: `onSubscriptionActivated`, `onSubscriptionCancelled`, `onSubscriptionPastDue`, `onPaymentSucceeded`, `onRefunded`. Dispatcher is the single integration point for SiPhox / Healthie / Mailchimp / Resend / commission engine.
- [ ] **LFC-02**: `app/api/webhook/stripe/route.ts` (1020 lines) refactored to call dispatcher helpers — no inline side effects. Same observable behavior.
- [ ] **LFC-03**: `app/api/webhook/corepay/route.ts` calls dispatcher helpers (mirrors Stripe).
- [ ] **LFC-04**: `getProviderIds(membership)` helper returns `{customerId, subscriptionId, paymentProfileId, provider}` from either `provider_*` or `stripe_*` columns via `COALESCE`.
- [ ] **LFC-05**: All read sites use `getProviderIds()` or `COALESCE`: `lib/db.ts`, `lib/admin-types.ts`, `lib/creators/db.ts` (5 sites), `lib/siphox/db.ts` (4 sites), 6 admin routes, `app/api/member/profile/route.ts`, `app/api/member/transactions/route.ts`. No code path reads only `stripe_*` after this phase.
- [ ] **LFC-06**: `INTEGRATION_TRIGGER_MATRIX.md` in `.planning/` — rows = events (subscription.created, payment.success, refund.created, etc.), columns = downstream integrations (Healthie, Resend, QuickBooks, Mailchimp, commission engine, SiPhox). Documents who fires on what event for both Stripe and CorePay.
- [ ] **LFC-07**: Healthie integration TODO stub in CorePay webhook handler: `if (event.type === 'subscription.created' && process.env.HEALTHIE_API_KEY) { /* TODO */ }`. Even though Healthie API isn't yet enabled, the hook sits there so the strip-Stripe sweep doesn't silently drop EHR creation when Healthie does activate.

### Coupon Engine (Phase 9 — Authorize.Net has no native primitive)

- [ ] **CPN-01**: Migration `066_coupon_redemptions.sql` creates `coupon_redemptions` table: `(id, coupon_code, membership_id FK, order_id, original_amount_cents, discount_cents, effective_amount_cents, applied_to_billing_cycles, redeemed_at)` with index on `coupon_code`.
- [ ] **CPN-02**: `lib/coupons/redemption.ts:recordCouponRedemption()` writes to `coupon_redemptions` and is called from both Stripe and CorePay checkout routes.
- [ ] **CPN-03**: `validateCouponForSubscription(code, planSlug, email)` extends existing `validateCouponUnified()` — checks expiry, tier eligibility, single-use enforcement, attribution mapping.
- [ ] **CPN-04**: FOUNDER15 implementation: at coupon redemption, calculate `effective_amount_cents = round(plan_price_cents × 0.85)`, store on `coupon_redemptions` row, **bake into the ARB subscription `amount` field directly** at creation. No cron-timing dependency.
- [ ] **CPN-05**: FIRSTMONTH implementation: split into two API calls — `createTransactionRequest` for month 1 at 50% off + ARB starting month 2 at full price. OR ARB `trialOccurrences=1` + `trialAmount`.
- [ ] **CPN-06**: Migration `067_subscription_attributions.sql` creates `subscription_attributions` table for cutover backfill: `(id, customer_email, original_creator_id, original_code_id, original_attribution_method, source_stripe_subscription_id, snapshotted_at)`.
- [ ] **CPN-07**: `scripts/backfill-subscription-attributions.mjs` snapshots every active Stripe subscription's attribution into `subscription_attributions` BEFORE Phase 12 cutover starts. Idempotent (re-runnable).
- [ ] **CPN-08**: Stripe coupon sync removed from admin routes: `app/api/admin/creators/[id]/approve/route.ts`, `app/api/admin/creators/add/route.ts`, `app/api/admin/creators/codes/route.ts` no longer call `stripe.coupons.create()` or `stripe.promotionCodes.create()`. New creator codes write to `coupon_redemptions` schema, not Stripe.
- [ ] **CPN-09**: Migration `068_drop_stripe_coupon_columns.sql` drops `affiliate_codes.stripe_coupon_id` + `stripe_promotion_code_id`. Gated on Phase 13 ("no active Stripe subs").
- [ ] **CPN-10**: `lib/creators/db.ts:getAffiliateCodeByStripeIds()` replaced with `getAffiliateCodeByCouponRedemption()` joining `coupon_redemptions` × `affiliate_codes`.
- [ ] **CPN-11**: Day-before verification cron: compares Authorize.Net's `getSubscriptionStatus` amount to expected (DB) amount for each active subscription with a coupon. Mismatch → Sentry alert + auto-credit member next cycle via `creditRequest`.

### Self-Service Portal UI (Phase 10 — `/portal/billing`)

- [ ] **PRT-01**: `app/portal/billing/page.tsx` (server component) fetches active subscription state via `getProviderIds()` + Authorize.Net `getSubscriptionStatus`. Displays plan, price, next billing date, last 4 of card.
- [ ] **PRT-02**: `app/portal/billing/BillingClient.tsx` renders the UI: cancel button, pause toggle (when implemented), update-card button, billing history list, downloadable receipts.
- [ ] **PRT-03**: `app/api/portal/billing/cancel/route.ts` — soft cancel (end-of-period default), admin-immediate variant. Calls `cancelSubscription()` from `authorize-net-arb.ts`. Triggers `onSubscriptionCancelled` dispatcher event.
- [ ] **PRT-04**: `app/api/portal/billing/update-card/route.ts` — Path B implementation (createPaymentProfile + ARBUpdateSubscriptionRequest). Path A reserved as a follow-up if Q1 sandbox spike confirms cascade behavior.
- [ ] **PRT-05**: `app/api/portal/billing/pause/route.ts` + `resume/route.ts` — emulate via cancel-and-recreate w/ retained CIM profile + auto-resume cron. Anchor date shift documented in UI copy ("Your billing date will move to {DATE}").
- [ ] **PRT-06**: Inline checkout — `app/join/[tier]/page.tsx` swaps Stripe Checkout redirect for the existing `<CorePayForm />` (Accept.js). Behind a feature flag (`NEXT_PUBLIC_USE_COREPAY_CHECKOUT`) for staged rollout.
- [ ] **PRT-07**: `app/api/checkout/corepay/route.ts` extended to handle the full inline flow: tokenize → CIM customer profile → CIM payment profile → ARB subscription → write `memberships`. Drops the `stripe_customer_id: 'corepay_...'` prefix hack — uses real `provider_*` columns.
- [ ] **PRT-08**: `app/api/checkout/corepay/product/route.ts` — new, for one-time product orders. Uses `chargeOpaqueData` (or `chargeCustomerProfile` for repeat customers).
- [ ] **PRT-09**: `app/success/page.tsx` handles `?provider=corepay&subscription_id=...` query params (already supported per existing route — verify no Stripe-only code paths remain).
- [ ] **PRT-10**: `app/admin/members/MembersClient.tsx` search by `provider_customer_id` not `stripe_customer_id`.
- [ ] **PRT-11**: All 6 admin subscription routes (`pause`, `cancel`, `upgrade`, `members/add`, `creators/[id]/approve`, `creators/add`, `creators/codes`) use the `lib/payments/provider.ts` adapter (existing-or-new) — no direct Stripe SDK calls.
- [ ] **PRT-12**: `lib/config/links.ts` removes `LINKS.stripeCustomerPortal`, adds `LINKS.billingPortal = '/portal/billing'`.
- [ ] **PRT-13**: `lib/config/plans.ts` removes hardcoded Stripe Payment Links from Catalyst+ (line 191), Concierge (line 224), and Elite (line 258) — replaced with internal checkout links.
- [ ] **PRT-14**: Hardcoded Stripe coupon IDs `FOUNDER15: 'qU4zNw5W'` and `FIRSTMONTH: 'tuQ4qFpe'` removed from `lib/config/plans.ts:123-124` — coupon definitions live in DB via `coupon_redemptions` foundation.

### Receipts + Dunning Ladder (Phase 11)

- [ ] **RDN-01**: Branded receipt email triggered by `payment.authcapture.created` webhook. Uses Resend + `lib/resend.ts`. CULTR header, plan, amount, next renewal date, "Manage your subscription" → `/portal/billing` link, refund-request link.
- [ ] **RDN-02**: PDF receipt attachment via `@react-pdf/renderer` (existing `lib/invoice/` is the model).
- [ ] **RDN-03**: Authorize.Net merchant-interface receipt emails disabled (operational task — out-of-band). Documented in runbook.
- [ ] **RDN-04**: Failed payment email + `past_due` state on subscription.
- [ ] **RDN-05**: Dunning ladder cron sends retry-attempt emails: +0 (immediate), +24h, +72h, +7d, +14d. Halts on successful recovery.
- [ ] **RDN-06**: Dunning retry job re-attempts the failed charge via stored CIM payment profile (not stored PAN — token reference only).
- [ ] **RDN-07**: Card-on-file expiring emails at -30d and -7d before card expiration.
- [ ] **RDN-08**: Successful renewal email (Stripe parity for cutover-day expectations).
- [ ] **RDN-09**: Subscription canceled confirmation email.
- [ ] **RDN-10**: Account Updater enabled at merchant level (operational, gated on Q4 sandbox verification + cost confirmation).
- [ ] **RDN-11**: Final cancellation + downgrade to Club tier after dunning retry exhaustion.

### Migration Cutover (Phase 12 — re-onboarding flow)

- [ ] **MGR-01**: Migration `069_migration_tokens.sql` creates `migration_tokens` table: `(id, membership_id FK, token_hash SHA-256, state ENUM('pending','in_progress','completed','expired','cancelled'), legacy_stripe_subscription_id, expires_at (30 days), re_onboarded_at, cancellation_processed_at)`.
- [ ] **MGR-02**: `scripts/seed-migration-tokens.mjs` populates `migration_tokens` for every active Stripe subscription. Throttled ≤10 calls/sec to Stripe API. Idempotent.
- [ ] **MGR-03**: `app/migrate/[token]/page.tsx` + `MigrateClient.tsx` — token-gated re-onboarding form. Token revalidated server-side; expired/used → "this link expired, please contact support" page.
- [ ] **MGR-04**: `app/api/migrate/complete/route.ts` — atomic flow:
  1. Revalidate token (state must be `pending`).
  2. CIM `createCustomerProfileRequest` + payment profile.
  3. ARB `createSubscription` with `startDate = stripe_period_end + 1`.
  4. Stripe `invoices.list({status:'open'}).voidInvoice()` for in-flight invoices.
  5. Stripe `subscriptions.cancel(legacyId, {cancel_at_period_end: true})`.
  6. DB transaction updates `memberships.payment_provider='authorize_net'` + `migration_tokens.state='completed'`.
  7. Inherit creator attribution from `subscription_attributions` (CPN-07) onto the new `order_attributions` row.
  8. Confirmation email sent.
  Rollback: if step 3 fails, delete CIM profile (step 2 reversal).
- [ ] **MGR-05**: Re-onboarding email blast (3 rounds): Day 0, Day 14 reminder, Day 25 final notice. Uses Resend with token deep-link.
- [ ] **MGR-06**: Pre-cutover heads-up email to all active subscribers: "Starting [DATE], CULTR Health charges show as 'CULTR HEALTH' on your statement (was 'STRIPE')." Reduces fraud-report panic.
- [ ] **MGR-07**: `app/api/cron/sunset-stripe-subscriptions/route.ts` — daily cron. For tokens with `state='pending'` AND `expires_at < NOW()`: cancel the legacy Stripe subscription, mark `cancellation_processed_at`, send "your subscription has been cancelled" email.
- [ ] **MGR-08**: `app/admin/migration/page.tsx` — admin dashboard listing all `migration_tokens` with status (emailed / re-onboarded / cancelled / pending). Manual resend + cancel buttons.
- [ ] **MGR-09**: 4-step ops sequence executed at cutover day:
  1. Disable creation of new Stripe subscriptions (feature flag `STRIPE_NEW_SIGNUPS_DISABLED=true`).
  2. `cancel_at_period_end: true` on every active Stripe sub (script).
  3. Send re-onboarding emails (MGR-05).
  4. Stripe webhook handler stays alive 30 days for in-flight events.
- [ ] **MGR-10**: Reverse-attribution daily check: `SELECT COUNT(*) FROM order_attributions WHERE provider='authorize_net' AND created_at > cutover_date AND creator_id IS NULL` should match expected non-attributed (organic) traffic. Anomaly → Sentry alert.

### Refunds + Admin Reporting + Hardening (Phase 13 — final cleanup)

- [ ] **HRD-01**: `app/api/refunds/create/route.ts` — unified endpoint chooses void (pre-settlement) vs refund (post-settlement) based on transaction status. Replaces Stripe-specific refund logic.
- [ ] **HRD-02**: `lib/creators/commission.ts:handleRefundReversal()` made idempotent on `(orderId, eventType, eventId)`. Handles refund + chargeback events without double-reversing commission.
- [ ] **HRD-03**: Refund vs chargeback statuses tracked separately on `order_attributions`: `refunded` vs `chargeback`. For chargebacks specifically: if already refunded → log warning, do NOT auto-reverse again.
- [ ] **HRD-04**: Migration `070_commission_reserve.sql` creates `commission_reserve` table — holds 5-10% of monthly creator earnings for 90 days post-approval to absorb late chargebacks (180-day Authorize.Net refund window).
- [ ] **HRD-05**: AVS/CVV friendly-error mapper at `lib/payments/avs-cvv-errors.ts`. Maps all 13 AVS codes + CVV codes to user-facing strings (no "AVS" jargon). CorePay merchant portal config: enable only `N` for default rejection.
- [ ] **HRD-06**: Admin reporting dashboards: MRR, cohort retention, coupon ROI, dunning effectiveness, refund age distribution. Adds to `app/admin/`.
- [ ] **HRD-07**: All Stripe code removed: delete `app/api/webhook/stripe/route.ts`, `app/api/checkout/route.ts`, `app/api/checkout/subscription/route.ts`, `app/api/checkout/product/route.ts`, `components/payments/StripeCheckoutForm.tsx`, `scripts/setup-stripe.ts`. Gated on `SELECT COUNT(*) FROM memberships WHERE payment_provider='stripe' AND subscription_status='active' = 0`.
- [ ] **HRD-08**: Stripe NPM packages removed: `npm uninstall stripe @stripe/stripe-js @stripe/react-stripe-js`. `setup:stripe` npm script removed. Stripe init removed from `lib/auth.ts:288` AND `lib/creators/db.ts`.
- [ ] **HRD-09**: Migration `071_drop_legacy_stripe_columns.sql` (expand-contract step 3 — DROP `stripe_*` columns OR rename to `stripe_*_legacy`). Gated on cross-app deploy checklist (cultrhealth.com staging + production + cultrclub-web all running new code 24+ hours).
- [ ] **HRD-10**: `STRIPE_*` env vars removed from `.env.example`, `.env.production`, Vercel staging, Vercel production. `BLOOD_TEST_STRIPE_PRICE_ID` and `DOCTOR_CONSULTATION_STRIPE_PRICE_ID` replaced with provider-agnostic equivalents.
- [ ] **HRD-11**: CLAUDE.md updated — Stripe references replaced with CorePay/Authorize.Net. `.cursorrules` updated. README.md payment-processor mention updated.
- [ ] **HRD-12**: Test suite updated: delete `tests/api/stripe-webhook-attribution.test.ts` and `tests/api/checkout-subscription.test.ts`. New `tests/api/corepay-webhook-attribution.test.ts` + `tests/api/checkout-corepay.test.ts`. Update `tests/api/admin-member-add.test.ts`, `tests/api/admin-creator-add-route.test.ts`, `tests/api/admin-creator-codes.test.ts` to use CorePay mocks.
- [ ] **HRD-13**: Hardening test fixtures (Vitest): cron timing race (CPN-11), webhook idempotency (PLB-09), migration cutover atomicity (MGR-04), AVS code mapping (HRD-05), boot-time validation (PLB-11), integration trigger matrix (LFC-06), env-var drift detection.
- [ ] **HRD-14**: Final sweep verification: `grep -ri 'stripe' . --include='*.ts' --include='*.tsx' --include='*.json' --include='*.sql' --include='*.md' --exclude-dir={node_modules,.next,.git,memory,.planning}` returns only historical changelog mentions.

---

## Future Requirements (deferred — could ship in v2.1+)

- Pause subscription with full UX polish (FEATURES.md §3.7)
- Downgrade with end-of-period swap (FEATURES.md §3.8)
- Annual plans (FEATURES.md §3.10)
- Stackable coupons (FEATURES.md §4.9)
- Coupon analytics dashboard (FEATURES.md §4.10)
- Retention coupon offer at cancel step (FEATURES.md §5.10)
- Plan comparison + upgrade preview UI (FEATURES.md §5.11)
- Multiple saved cards UI (FEATURES.md §5.13)
- HSA/FSA receipt customization (FEATURES.md §5.14)
- Member self-service refund request (FEATURES.md §7.6)
- Auto-refund within 7-day money-back window (FEATURES.md §7.7)
- Smart retry timing for dunning (FEATURES.md §9.7)
- "Update card from email" deep link (FEATURES.md §9.8)

---

## Out of Scope (explicit exclusions for v2.0)

- **Corpay Cross-Border integration** — captured as a Claude reference skill only; reserved for future creator international payouts. NOT used in this milestone.
- **Insurance billing** — Stripe direct-pay model continues post-CorePay (single-currency, US consumers). Not adding insurance.
- **BNPL providers** (Klarna / Affirm / Authorize.Net Direct Debit) — already removed pre-v1.0. NOT reviving.
- **Mobile native app payment flows** — web is primary.
- **Multi-currency / multi-language receipts** — single-currency USD only (FEATURES.md §5.A, §8.A).
- **ML-driven retry timing** for dunning — heuristic ladder is sufficient (FEATURES.md §9.A).
- **Customer-facing chargeback dispute UI** — admin-only handling (FEATURES.md §7.A).
- **Subscription "schedules" (future-dated changes)** — not in v2.0 (FEATURES.md §3.B).
- **Multi-product subscriptions** (one subscription, multiple products) — single-product subs only (FEATURES.md §3.C).
- **Trial periods** — current model is no-trial; not adding (FEATURES.md §3.A).
- **Per-customer attached coupons** (Stripe-style customer-scoped coupons) — global codes only (FEATURES.md §4.B).
- **Customer-facing dispute (chargeback) UI** — admin handles all chargebacks (FEATURES.md §7.A).
- **Datadog APM / multiple observability tools** — Sentry covers errors + perf in one tool.

---

## Open Questions — sandbox verification BEFORE Phase 7 ships

These block default behaviors. Resolve in CorePay sandbox before backend build starts.

1. **Q1 — CIM payment profile cascade to ARB?** Does updating a CIM payment profile in place (Path A) cause active ARB subscriptions to bill the new card automatically, or must we explicitly call `ARBUpdateSubscriptionRequest`? Default if unverified: Path B (create new payment profile + update ARB to reference it).
2. **Q2 — Vercel Fluid Compute on staging?** `vercel project inspect` to confirm. If staging is on legacy serverless (60s), an async pattern is needed for checkout sequential calls.
3. **Q3 — Existing Sentry project on cultrhealth.com?** Check Sentry dashboard + `.env.example` for `SENTRY_*`. Default if unverified: wizard creates new.
4. **Q4 — Account Updater enabled on CorePay merchant?** Authorize.Net merchant interface → Account → Security Settings → Account Updater. Paid add-on; confirm cost. Without this, manual card-expiry email pipeline (RDN-07) is the only safety net.
5. **Q5 — CIM payment profile retention policy?** Test what happens to active ARB sub when the linked payment profile is deleted. Decide retention rule (default: never delete on cancel).
6. **Q6 — Authorize.Net first-charge limitation?** Sandbox: `ARBCreateSubscriptionRequest` with `paymentSchedule.startDate = today` — does it charge immediately or only schedule next-cycle? If does NOT charge day 1, every new subscription needs CIM one-shot + ARB starting `+1` (not just FIRSTMONTH).

---

## Traceability

| REQ-ID | Phase | Title (short) |
|---|---|---|
| SKL-01..05 | 6 | Skills (corepay, healthie, corpay-crossborder, siphox refresh) |
| PLB-01..13 | 7 | Schema migrations + gateway helpers + webhook + Sentry |
| LFC-01..07 | 8 | Dispatcher refactor + COALESCE shim + integration matrix |
| CPN-01..11 | 9 | Coupon engine + creator attribution backfill |
| PRT-01..14 | 10 | Self-service portal + inline checkout + admin route conversions |
| RDN-01..11 | 11 | Receipts + dunning ladder + Account Updater |
| MGR-01..10 | 12 | Migration cutover + re-onboarding flow + sunset cron |
| HRD-01..14 | 13 | Refunds + reporting + Stripe strip + tests + final sweep |

**Total v2.0 requirements:** 75 (5 + 13 + 7 + 11 + 14 + 11 + 10 + 14)
