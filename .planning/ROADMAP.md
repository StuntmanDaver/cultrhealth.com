# Roadmap: CULTR Health

## Milestones

- ✅ **v1.0 cultrclub-web Cloudflare Migration** — Phases 1–5 (shipped 2026-04-22)
- 🚧 **v2.0 Stripe → Corepay (Authorize.Net gateway) replacement** — Phases 6–13 (in progress)

## Phases

<details>
<summary>✅ v1.0 cultrclub-web Cloudflare Migration (Phases 1–5) — SHIPPED 2026-04-22</summary>

- [x] Phase 1: Bootstrap (1/1 plan) — completed 2026-04-13
- [x] Phase 2: Source Extraction (2/2 plans) — completed 2026-04-13
- [x] Phase 3: Code Adaptation (2/2 plans) — completed 2026-04-14
- [x] Phase 4: Deploy & Validate (2/2 plans) — completed 2026-04-21
- [x] Phase 5: Production Cutover (2/2 plans) — completed 2026-04-22

Archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v2.0 Stripe → Corepay (Authorize.Net gateway) replacement (Phases 6-13)

> **Vocabulary:** **Corepay** (corepay.net) is CULTR's merchant ISO; **Authorize.Net** is the underlying gateway used by Corepay merchants. **Corpay** (corpay.com, Fleetcor) is an unrelated B2B FX product captured as reference-only. All API integration targets Authorize.Net endpoints.

Source plan: `/Users/davidk/.claude/plans/async-petting-fern.md` (approved 2026-04-27)
Research synthesis: `.planning/research/SUMMARY.md`
Requirements: `.planning/REQUIREMENTS.md` (75 REQ-IDs across 8 categories)

- [ ] **Phase 6: Skills** — Ship four Claude skills (corepay-api, healthie-api, corpay-crossborder, refresh siphox-api) so future sessions don't re-make Stripe assumptions.
- [ ] **Phase 7: Schema + Gateway Plumbing** — Provider-agnostic DB columns, Authorize.Net helper modules (CIM/ARB/charges), HMAC-SHA512 webhook receiver, Sentry, smoke route.
- [ ] **Phase 8: Subscription Lifecycle Core** — Extract webhook side-effects into provider-agnostic dispatcher, COALESCE shim across all read sites, integration trigger matrix.
- [ ] **Phase 9: Coupon Engine** — `coupon_redemptions` table, FOUNDER15/FIRSTMONTH primitives, creator attribution backfill, drop Stripe coupon sync.
- [ ] **Phase 10: Self-Service Portal UI** — `/portal/billing` (cancel/pause/resume/update card), inline checkout via Accept.js, admin route conversions.
- [ ] **Phase 11: Receipts + Dunning Ladder** — Branded receipt emails + PDFs, dunning cadence (+0/+24h/+72h/+7d/+14d), Account Updater.
- [ ] **Phase 12: Migration Cutover** — `migration_tokens` re-onboarding flow, atomic Stripe-cancel + ARB-create, sunset cron, 4-step ops sequence.
- [ ] **Phase 13: Refunds + Reporting + Hardening** — Unified refund endpoint, MRR/cohort dashboards, full Stripe strip, npm uninstall, env-var sweep, hardening tests.

## Phase Details

### Phase 6: Skills

**Goal**: Ship four Claude Code skills so every future session has accurate documentation for the four payment/health-data integrations and never re-makes the Stripe assumption.
**Depends on**: Nothing — pure documentation phase, zero production risk.
**Requirements**: SKL-01, SKL-02, SKL-03, SKL-04, SKL-05
**Success Criteria** (what must be TRUE):
  1. `.claude/skills/corepay-api/SKILL.md` is loadable by Claude Code and contains the seven critical gotchas (no `authorizenet` SDK, `gatewayFetch()` pattern, `merchantAuthentication` envelope, Accept.js single-use 15-min token, HMAC-SHA512 with `request.text()`, ARB next-cycle-only updates).
  2. `.claude/skills/healthie-api/SKILL.md` documents Basic-not-Bearer auth, AuthorizationSource header, raw-body webhook signature verification, and ~120 webhook events catalogued.
  3. `.claude/skills/corpay-crossborder/SKILL.md` is explicitly marked reference-only and notes it is **NOT** the consumer subscription processor.
  4. `.claude/skills/siphox-api/SKILL.md` carries the "Known repo bug" gotcha pointing at `lib/siphox/client.ts:80`.
  5. `.gitignore` exceptions allow the four skill directories to be checked in (matches existing siphox-api pattern).
**Plans**: ~1 plan (single coordinated documentation deliverable; all four skills can be drafted in parallel under one plan)

### Phase 7: Schema + Gateway Plumbing

**Goal**: All backend plumbing for CorePay (DB columns, helper modules, webhook receiver, observability) lands behind zero customer-facing surface — ready for downstream phases to call.
**Depends on**: Phase 6 (skills exist so implementer references are correct) AND **sandbox verification of Q1–Q6 from `.planning/research/SUMMARY.md` §6** must complete before this phase ships. Q1 (CIM cascade) → Path A vs B default; Q2 (Fluid Compute) → checkout async pattern decision; Q3 (Sentry project) → wizard config path; Q4 (Account Updater) → RDN-07 pipeline necessity; Q5 (CIM retention policy) → cancel-flow rule; Q6 (ARB first-charge) → checkout split vs straight ARB.
**Requirements**: PLB-01, PLB-02, PLB-03, PLB-04, PLB-05, PLB-06, PLB-07, PLB-08, PLB-09, PLB-10, PLB-11, PLB-12, PLB-13
**Success Criteria** (what must be TRUE):
  1. Migrations 063–065 ship cleanly (webhook_events, provider_payment_profile_id on memberships, provider_*_id on creator_customer_portfolio/siphox_kit_orders/asher_orders/pending_intakes); pre-migration sweep deletes the five macOS-duplicate `*_2.sql`/`*_4.sql` files.
  2. The three Authorize.Net helper modules (`authorize-net-cim.ts`, `authorize-net-arb.ts`, `authorize-net-charges.ts`) export the documented surface and all use the shared `gatewayFetch()` (no `authorizenet` package installed).
  3. `app/api/webhook/corepay/route.ts` accepts a signed sandbox request, verifies HMAC-SHA512 over `request.text()`, persists to `webhook_events`, and idempotency skips the second delivery.
  4. Boot-time CorePay credential validation in `instrumentation.ts` refuses to start the app on Code 13 (sandbox-creds-in-prod / prod-creds-in-sandbox).
  5. `app/api/admin/corepay-smoke/route.ts` runs a complete sandbox round-trip (auth → customer profile → payment profile → ARB at $1 → cancel → refund) and Sentry receives the trace via the wizard-installed `@sentry/nextjs@^10.50.0`.
**Plans**: ~3 plans (P1: migrations + duplicate cleanup; P2: gateway helpers + webhook receiver + IP allowlist; P3: Sentry instrumentation + boot validation + smoke route)

### Phase 8: Subscription Lifecycle Core

**Goal**: All subscription side-effects flow through a single provider-agnostic dispatcher; Stripe + CorePay webhooks share the integration map; every read site uses `COALESCE(provider_*, stripe_*)`.
**Depends on**: Phase 7 (CorePay webhook receiver exists so dispatcher has a second consumer).
**Requirements**: LFC-01, LFC-02, LFC-03, LFC-04, LFC-05, LFC-06, LFC-07
**Success Criteria** (what must be TRUE):
  1. `lib/webhooks/dispatcher.ts` exposes the five provider-agnostic helpers (`onSubscriptionActivated`, `onSubscriptionCancelled`, `onSubscriptionPastDue`, `onPaymentSucceeded`, `onRefunded`) and is the single integration touchpoint for SiPhox/Healthie/Mailchimp/Resend/commission.
  2. Both webhook routes (Stripe and CorePay) call dispatcher helpers exclusively — no inline side effects in the route file. Stripe's 1020-line route shrinks to a thin verifier+dispatcher harness with identical observable behavior.
  3. `getProviderIds(membership)` is in use across all 18+ identified read sites (`lib/db.ts`, `lib/admin-types.ts`, `lib/creators/db.ts` (5 sites), `lib/siphox/db.ts` (4 sites), 6 admin routes, member profile/transactions). A grep for `stripe_customer_id\|stripe_subscription_id` returns only legacy COALESCE fallbacks.
  4. `INTEGRATION_TRIGGER_MATRIX.md` lives in `.planning/` with rows = events × columns = downstream integrations, accurate for both Stripe and CorePay.
  5. CorePay webhook handler contains the Healthie TODO stub gated on `process.env.HEALTHIE_API_KEY` so the strip-Stripe sweep doesn't silently drop EHR creation when Healthie activates.
**Plans**: ~2 plans (P1: dispatcher extraction + Stripe route refactor + integration matrix; P2: getProviderIds shim + read-site sweep)

### Phase 9: Coupon Engine

**Goal**: A CULTR-internal coupon engine handles FOUNDER15/FIRSTMONTH/creator codes for both Stripe (today) and CorePay (post-cutover) — Authorize.Net has no native coupon primitive.
**Depends on**: Phase 8 (dispatcher exists so coupon-redemption commission writes flow through one place).
**Requirements**: CPN-01, CPN-02, CPN-03, CPN-04, CPN-05, CPN-06, CPN-07, CPN-08, CPN-09, CPN-10, CPN-11
**Success Criteria** (what must be TRUE):
  1. Migration 066 (`coupon_redemptions`) is live; `recordCouponRedemption()` is called from BOTH Stripe and CorePay checkout paths.
  2. FOUNDER15 redemption bakes the discounted amount into the ARB `amount` field at creation — no cron-timing dependency. FIRSTMONTH uses ARB `trialOccurrences=1` + `trialAmount` (or two-step `createTransaction` + ARB).
  3. Migration 067 (`subscription_attributions`) is live and `scripts/backfill-subscription-attributions.mjs` has snapshotted every active Stripe subscription's attribution before Phase 12 cutover begins.
  4. New creator codes write only to `coupon_redemptions` schema — `stripe.coupons.create()` and `stripe.promotionCodes.create()` calls removed from all three admin routes (`creators/[id]/approve`, `creators/add`, `creators/codes`).
  5. Day-before verification cron compares Authorize.Net `getSubscriptionStatus.amount` to expected DB amount per coupon; mismatches fire Sentry alerts and auto-credit via `creditRequest`.
**Plans**: ~2 plans (P1: schema + redemption helper + FOUNDER15/FIRSTMONTH primitives; P2: attribution backfill + Stripe-coupon-sync removal + reconciliation cron)

### Phase 10: Self-Service Portal UI

**Goal**: Members can manage their subscription end-to-end at `/portal/billing` (cancel, pause, resume, update card, view history) — Authorize.Net has zero hosted portal so this is greenfield UI. Inline checkout via Accept.js replaces Stripe Checkout for new signups under a feature flag.
**Depends on**: Phase 9 (coupon engine; checkout path needs `recordCouponRedemption()`) and Phase 7 (gateway helpers).
**Requirements**: PRT-01, PRT-02, PRT-03, PRT-04, PRT-05, PRT-06, PRT-07, PRT-08, PRT-09, PRT-10, PRT-11, PRT-12, PRT-13, PRT-14
**Success Criteria** (what must be TRUE):
  1. Member signs into `/portal/billing` and sees plan, price, next billing date, last 4 of card; can click Cancel (end-of-period default) and the ARB subscription is canceled with `onSubscriptionCancelled` firing dispatcher side effects.
  2. Member updates card via Accept.js → new CIM payment profile created → ARB updated to reference it (Path B; Path A reserved as follow-up if Q1 sandbox proves cascade behavior).
  3. New signup at `/join/[tier]` with `NEXT_PUBLIC_USE_COREPAY_CHECKOUT=true` completes inline (tokenize → CIM customer profile → CIM payment profile → ARB → write `memberships`) without Stripe Checkout redirect; `app/success/page.tsx` handles `?provider=corepay&subscription_id=…`.
  4. All 6 admin subscription routes (pause, cancel, upgrade, members/add, creators/[id]/approve, creators/add, creators/codes) call through `lib/payments/provider.ts` adapter — zero direct Stripe SDK calls.
  5. Hardcoded Stripe artifacts removed from `lib/config/plans.ts` (Payment Links lines 191/224/258, coupon IDs lines 123-124) and `lib/config/links.ts` (`stripeCustomerPortal` swapped for `billingPortal = '/portal/billing'`).
**Plans**: ~3 plans (P1: portal page + cancel/update-card APIs; P2: pause/resume + inline Accept.js checkout; P3: admin route conversions + plans.ts/links.ts cleanup)
**UI hint**: yes

### Phase 11: Receipts + Dunning Ladder

**Goal**: Every charge produces a branded receipt; every failed payment enters a 5-step dunning ladder with retry attempts via stored CIM profile; card-on-file expiry is communicated proactively.
**Depends on**: Phase 8 (dispatcher fires receipt + dunning emails) and Phase 10 (`/portal/billing` link in receipts).
**Requirements**: RDN-01, RDN-02, RDN-03, RDN-04, RDN-05, RDN-06, RDN-07, RDN-08, RDN-09, RDN-10, RDN-11
**Success Criteria** (what must be TRUE):
  1. Successful charge fires a branded receipt email (CULTR header, plan, amount, next renewal date, "Manage your subscription" link, refund link) with a `@react-pdf/renderer` PDF attachment.
  2. Authorize.Net merchant-interface plain-text receipts are disabled (operational task documented in runbook).
  3. Failed payment puts the subscription in `past_due` state and triggers the dunning ladder: emails at +0/+24h/+72h/+7d/+14d; retry job re-attempts charge against stored CIM profile (token reference, never PAN).
  4. Card-on-file expiring emails fire at -30d and -7d before card expiration; if Q4 sandbox verification confirms Account Updater coverage and merchant cost is approved, Account Updater is enabled at the merchant level (otherwise this expiry pipeline is the only safety net).
  5. Successful renewal email and subscription-cancelled confirmation email reach Stripe parity for cutover-day expectations; final cancellation downgrades the member to Club tier after retry exhaustion.
**Plans**: ~2 plans (P1: receipt template + PDF + receipt-on-charge pipeline; P2: dunning ladder cron + retry job + expiry emails + final-downgrade)

### Phase 12: Migration Cutover

**Goal**: Every active Stripe subscriber is moved to a CorePay (Authorize.Net) subscription via a token-gated re-onboarding flow with no double-charge, no orphaned Stripe invoices, and full creator-attribution carryforward.
**Depends on**: Phase 11 (re-onboarding emails reuse the receipt/dunning Resend pipeline) and Phase 9 (`subscription_attributions` backfill must be complete before tokens seed).
**Requirements**: MGR-01, MGR-02, MGR-03, MGR-04, MGR-05, MGR-06, MGR-07, MGR-08, MGR-09, MGR-10
**Success Criteria** (what must be TRUE):
  1. Migration 069 (`migration_tokens`) is live with 30-day expiry state machine; `scripts/seed-migration-tokens.mjs` populates one token per active Stripe subscription, throttled ≤10 calls/sec, idempotent.
  2. Member visits `/migrate/[token]` and re-onboards atomically: token revalidate → CIM create → ARB create with `startDate = stripe_period_end + 1` → void open Stripe invoices → Stripe `subscriptions.cancel(legacyId, {cancel_at_period_end: true})` → DB transaction sets `payment_provider='authorize_net'` and inherits `subscription_attributions` onto the new `order_attributions` row → confirmation email. ARB-create failure rolls back the CIM profile.
  3. 4-step cutover ops sequence executes cleanly: feature-flag disables new Stripe signups → `cancel_at_period_end: true` on every active Stripe sub → 3 rounds of re-onboarding emails (Day 0, 14, 25) → Stripe webhook handler stays alive 30 days for in-flight events.
  4. Pre-cutover heads-up email to all active subscribers explains the "CULTR HEALTH" statement descriptor change to reduce fraud-report panic.
  5. Daily reverse-attribution check (`COUNT(*) WHERE provider='authorize_net' AND created_at > cutover AND creator_id IS NULL`) matches expected organic traffic; anomalies fire Sentry alerts. Daily sunset cron cancels expired tokens and emails members.
**Plans**: ~2 plans (P1: migration_tokens schema + seed script + re-onboarding page + atomic complete API; P2: email blasts + ops sequence + sunset cron + admin migration dashboard + reverse-attribution check)
**UI hint**: yes

### Phase 13: Refunds + Reporting + Hardening

**Goal**: Stripe is gone (code, packages, env vars, schema columns). Refunds flow through a unified void/refund endpoint; admin reporting (MRR, cohort retention, coupon ROI, dunning effectiveness) is live; full hardening test suite covers the documented failure modes.
**Depends on**: Phase 12 (Stripe strip is gated on `COUNT(*) WHERE payment_provider='stripe' AND subscription_status='active' = 0`).
**Requirements**: HRD-01, HRD-02, HRD-03, HRD-04, HRD-05, HRD-06, HRD-07, HRD-08, HRD-09, HRD-10, HRD-11, HRD-12, HRD-13, HRD-14
**Success Criteria** (what must be TRUE):
  1. Unified `app/api/refunds/create/route.ts` chooses void (pre-settlement) vs refund (post-settlement) automatically. Commission reversal in `lib/creators/commission.ts:handleRefundReversal()` is idempotent on `(orderId, eventType, eventId)` and never double-reverses on chargeback-after-refund. Migration 070 (`commission_reserve`) holds 5-10% of monthly creator earnings for 90 days post-approval.
  2. Admin dashboards display MRR, cohort retention, coupon ROI, dunning effectiveness, refund age distribution. AVS/CVV friendly-error mapper translates all 13 codes into user-facing strings.
  3. `npm uninstall stripe @stripe/stripe-js @stripe/react-stripe-js` succeeds; `setup:stripe` script removed; Stripe init removed from `lib/auth.ts:288` and `lib/creators/db.ts`. Migration 071 drops legacy `stripe_*` columns (gated on cross-app deploy checklist: cultrhealth.com staging + production + cultrclub-web running new code 24+ hours).
  4. `STRIPE_*` env vars deleted from `.env.example`, `.env.production`, Vercel staging, Vercel production. `BLOOD_TEST_STRIPE_PRICE_ID` and `DOCTOR_CONSULTATION_STRIPE_PRICE_ID` replaced with provider-agnostic equivalents. CLAUDE.md, `.cursorrules`, README.md updated.
  5. `grep -ri 'stripe' . --include='*.ts' --include='*.tsx' --include='*.json' --include='*.sql' --include='*.md' --exclude-dir={node_modules,.next,.git,memory,.planning}` returns only historical changelog mentions. Vitest hardening fixtures cover cron timing race (CPN-11), webhook idempotency (PLB-09), migration cutover atomicity (MGR-04), AVS code mapping (HRD-05), boot-time validation (PLB-11), integration trigger matrix (LFC-06), env-var drift detection.
**Plans**: ~3 plans (P1: refund endpoint + commission reversal idempotency + commission_reserve + AVS/CVV mapper; P2: admin reporting dashboards; P3: Stripe strip + npm uninstall + env-var sweep + docs update + hardening tests)
**UI hint**: yes

## Progress

| Phase                          | Milestone | Plans Complete | Status      | Completed  |
| ------------------------------ | --------- | -------------- | ----------- | ---------- |
| 1. Bootstrap                   | v1.0      | 1/1            | Complete    | 2026-04-13 |
| 2. Source Extraction           | v1.0      | 2/2            | Complete    | 2026-04-13 |
| 3. Code Adaptation             | v1.0      | 2/2            | Complete    | 2026-04-14 |
| 4. Deploy & Validate           | v1.0      | 2/2            | Complete    | 2026-04-21 |
| 5. Production Cutover          | v1.0      | 2/2            | Complete    | 2026-04-22 |
| 6. Skills                      | v2.0      | 0/1            | Not started | -          |
| 7. Schema + Gateway Plumbing   | v2.0      | 0/3            | Not started | -          |
| 8. Subscription Lifecycle Core | v2.0      | 0/2            | Not started | -          |
| 9. Coupon Engine               | v2.0      | 0/2            | Not started | -          |
| 10. Self-Service Portal UI     | v2.0      | 0/3            | Not started | -          |
| 11. Receipts + Dunning Ladder  | v2.0      | 0/2            | Not started | -          |
| 12. Migration Cutover          | v2.0      | 0/2            | Not started | -          |
| 13. Refunds + Reporting + Hardening | v2.0 | 0/3            | Not started | -          |
