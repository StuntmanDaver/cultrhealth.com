# v2.0 Pitfalls — Stripe → Authorize.Net Migration

**Researched:** 2026-04-27
**Confidence:** HIGH on Authorize.Net behavior; MEDIUM on CULTR-specific impact (depends on plan execution).

This is a category of migration that historically goes wrong in specific ways. Generic API integration warnings are excluded.

---

## Top 5 — Most Likely To Bite Us (ranked by likelihood × impact)

| Rank | Pitfall | Likelihood | Impact | Owning Phase |
|------|---------|------------|--------|--------------|
| 1 | **Coupon timing race** — cron runs after Authorize.Net's 2 AM PT renewal → member overcharged | Every renewal day | Member overcharge + creator commission affected | Coupon Engine |
| 2 | **Creator commission backfill miss** — re-onboarding has no attribution carryforward → creators lose 100% renewal commission | Certain at cutover | Critical (50% creator revenue gone) | Coupon Engine + Cutover |
| 3 | **Subscription status drift / double charge** — member's Stripe sub renews while Authorize.Net sub also charges | High during cutover window | Critical (lawsuit + reputation) | Cutover |
| 4 | **Healthie integration miss** in strip-Stripe sweep — webhook → Healthie hook silently absent | Medium (hard to spot) | High (silent broken EHR creation post-launch) | Webhooks |
| 5 | **DB column rename without expand-contract** — single-deploy ALTER causes ~30s of `column does not exist` errors | Medium (engineering rigor) | Medium outage + Sentry noise | DB Migration |

---

## 1. ARBUpdateSubscriptionRequest — Amount Changes Are Next-Cycle Only

**Risk:** Engineers familiar with Stripe expect `subscription.update()` to apply immediately and prorate. Authorize.Net does NOT. `ARBUpdateSubscriptionRequest` only modifies the *next scheduled* transaction. No proration, no top-up charge, no automatic credit. ARB processes daily at ~2:00 AM Pacific Time. If the first transaction *after* an update is declined, the subscription is suspended; if not reactivated by next runDate, it is **terminated** (cannot be reactivated — must recreate).

**Warning sign:** Members report "I upgraded but my new tier didn't take effect for a month."

**Prevention:**
1. Tier upgrades require a 4-step pattern: (a) compute proration delta, (b) CIM one-shot charge for the diff, (c) cancel old ARB, (d) create new ARB anchored to original billing date.
2. Never update ARB amount within 30 min of 2 AM PT (safety buffer).
3. Add `provider_subscription_changes` audit table.
4. Test: update at 2:30 AM PT, observe change applies *two* days from now, not tomorrow.

**Phase:** ARB Lifecycle (must precede Portal UI — copy depends on this).

---

## 2. Refund Failures Mid-Chargeback — No Coordination

**Risk:** Authorize.Net does not handle chargebacks; the issuing bank does. Refund and chargeback events arrive separately. `lib/creators/commission.ts:handleRefundReversal()` (lines 409-418) is order-driven, not event-source-driven. Two events for the same order → two negative ledger rows → creator paid negative twice.

**Warning sign:** Multiple `commission_ledger.status='reversed'` rows for the same `order_attribution_id` with different `created_at`.

**Prevention:**
1. Make `handleRefundReversal` idempotent on `(orderId, eventType, eventId)`.
2. Add `provider_event_log` table with unique `(provider, event_id)` constraint. Skip processing if event_id seen.
3. Track refund vs chargeback separately on `order_attributions`: statuses `refunded` (merchant-initiated) vs `chargeback` (forced).
4. For chargebacks specifically: if already refunded → log warning + manual review, do NOT auto-reverse again.

**Phase:** Webhooks (event idempotency) + Commission Engine (refund handler hardening).

---

## 3. AVS / CVV Decline Codes — Different UX Than Stripe

**Risk:** Stripe abstracts AVS/CVV. Authorize.Net surfaces specific codes (`responseCode`, `avsResultCode`, `cvvResultCode`). **Default settings reject AVS codes B, E, G, N, R, S, U automatically.** Net effect: US member traveling internationally → AVS code G → automatic decline. Member sees "Card declined" but the card *would have worked* on Stripe.

**Warning sign:** Spike in declined attempts post-cutover with no prior decline history.

**Prevention:**
1. In CorePay merchant portal: enable only `N` for default rejection (basic AVS). Disable B/E/G/R/S/U per Authorize.Net's own guidance: "If N is deselected, then B, E, G, R, S, U should also be deselected."
2. Map common AVS codes to friendly messages (no "AVS" jargon to user).
3. Sentry breadcrumb on every decline with `responseCode + avsResultCode + cvvResultCode` (PHI-free) for trend detection.
4. Test: all 13 AVS codes through error-mapper; assert each has non-default friendly message.

**Phase:** Accept.js + CIM (UI copy + decline handling) + merchant portal config (out-of-band).

---

## 4. Accept.js Token Expiration — 15-min + Single-Use

**Risk:** `opaqueData` from Accept.js has TWO failure modes:
1. **15-min expiration:** Token expires 15 min after generation. Long checkout sessions fail with `E00114` (Invalid OTS Token) silently.
2. **Single-use:** Each `dataValue` consumed by ONE successful API call. Cannot use the same token for both `ARBCreateSubscriptionRequest` AND `createCustomerProfileRequest` — second call fails with `E00116` (OTS Token Access Violation).

Critical for our flow: we want both CIM customer profile AND ARB subscription. **Cannot do both with the same token.**

**Warning sign:** Sentry errors for `E00114` or `E00116`. Members report "I clicked submit and nothing happened."

**Prevention:**
1. Server flow: Accept.js token → `createCustomerProfileRequest` (consumes token, returns customerProfileId/customerPaymentProfileId) → `ARBCreateSubscriptionRequest` references the profile IDs. **Never** use opaqueData twice.
2. Alternative: `createTransactionRequest` with `createProfile=true` on first auth-only charge, then ARB references the profile.
3. Client-side: 14-min countdown banner; auto-retokenize from cached form values (never store PAN client-side).
4. On `E00114` error: re-render Accept.js form with "Session expired, please re-enter your card." Do NOT silently retry.

**Phase:** Accept.js + CIM (tokenization flow).

---

## 5. Sandbox vs Production Credential Drift — Response Code 13

**Risk:** Authorize.Net returns Response Code 13 ("merchant Login ID is invalid or account inactive") when sandbox credentials hit production endpoint or vice versa. Three environments × two credential sets = 6 potential combinations, only 2 correct.

**Warning sign:** Sudden burst of `messages.message[].code === '13'` post-deploy. Zero successful transactions on freshly deployed environment.

**Prevention:**
1. **Boot-time validation:** On app start, hit `authenticateTestRequest` (free, no transaction). If Code 13 → fail loudly, refuse to start.
2. Strict env-var pairing: `COREPAY_API_LOGIN_ID_LIVE` and `COREPAY_API_LOGIN_ID_TEST` (separate vars, never shared). `COREPAY_API_URL` selects pair via switch.
3. Add to `/pre-deploy` checklist: verify `COREPAY_API_URL` matches environment (`staging→apitest`, `production→api`).
4. Sentry alert: PagerDuty on >5 occurrences of Code 13 in 1 minute.

**Phase:** Foundation/Config (boot-time validation) + Hardening (alert wiring).

---

## 6. Webhook IP Allowlisting — Belt-and-Braces Recommended

**Risk:** Authorize.Net publishes webhook IPs (`198.241.206.38`, `198.241.207.38` — same for sandbox + production). Plan currently relies solely on HMAC signature. If signature key leaks (env var commit, unrotated key) → forged webhooks possible.

**Warning sign:** Webhook signature key in any repo (`grep -rn "X-ANET-Signature" .`). Key in Vercel env vars unrotated for >180 days.

**Prevention:**
1. Belt-and-braces: require BOTH valid signature AND source IP in allowlist. Either fails → 401.
2. On Vercel: read IP from `x-real-ip` or `x-vercel-forwarded-for` (last hop, Vercel-trusted).
3. Tolerate IP changes: log (don't reject) when valid signature comes from non-allowlist IP. Surface in Sentry as "Authorize.Net may have changed IPs."
4. Rotate Signature Key 180 days post-cutover.

**Phase:** Webhooks.

---

## 7. Coupon Timing Race — Cron After ARB 2 AM PT Run [#1 RISK]

**Risk:** "FOUNDER15 = 15% off forever" requires `ARBUpdateSubscriptionRequest` BEFORE each renewal so Authorize.Net charges the discounted amount. ARB processes daily at ~2:00 AM Pacific Time. If our cron runs after 2:00 AM PT, member is charged full price for that cycle.

Compounding: Vercel cron is UTC. 2 AM PT = 9 AM UTC PST or 10 AM UTC PDT (DST shifts twice/year). Even at 1:30 AM PT, Authorize.Net's "ARB transactions are usually submitted at 2 a.m. PST" — heavy days may run earlier.

**Warning sign:** Members emailing "I was charged full price; my code was supposed to be 15% off." `provider_subscription_changes` audit table shows updates *after* the member's billing date.

**Prevention:**
1. **Architecture: prefund discount on subscription record.** When member redeems FOUNDER15, calculate the discounted amount and store it on `provider_subscriptions.next_billing_amount`. Authorize.Net's ARB schedule charges that amount; no cron-timing dependency.
2. If cron is unavoidable: run at 11:00 PM Pacific the night before (07:00 UTC PST / 06:00 UTC PDT). 3-hour cushion.
3. TZ-aware cron: schedule on `America/Los_Angeles`, not UTC.
4. Day-before verification: dispatch a "verify discount applied" check that compares Authorize.Net's `getSubscriptionStatus` amount to our DB's expected amount. Mismatch → alert + auto-credit member next cycle.
5. Auto-credit fallback: if cron missed and member overcharged, automatically issue `creditRequest` for the difference within 24h.

**Phase:** Coupon Engine (cron + discount application logic).

---

## 8. Creator Commission Backfill — Existing Stripe Subscribers [#2 RISK]

**Risk:** Existing Stripe subscribers being migrated have attribution history in `order_attributions` and `commission_ledger`. New ARB subscriptions created via re-onboarding need the original creator attribution carried forward. Otherwise:

- `cultr_attribution` cookie may be expired (30-day window).
- Original `coupon_redemptions` row references Stripe subscription ID, not ARB.
- Re-onboarding generates a NEW order; `processOrderAttribution()` finds no attribution.
- **Result: 100% of migrated subscribers lose creator attribution starting cutover day. Creator revenue cliff-drop.**

**Warning sign:** `order_attributions` rows for ARB-renewal orders are missing for known creator-coupon members. Pre/post cutover commission_ledger by creator: zero for all creators.

**Prevention:**
1. **Backfill script BEFORE cutover starts:** for every active Stripe subscription, snapshot `(stripe_subscription_id, customer_email, original_creator_id, original_code_id, original_attribution_method)` into a new `subscription_attributions` table.
2. **Re-onboarding inherits attribution:** when member completes re-onboarding, look up `subscription_attributions` by email → carry creator_id/code_id/method to new ARB subscription's first `order_attributions` row + mark as renewal (`is_subscription=true`, `subscription_payment_number > 1`).
3. Allow override: re-onboarding form has optional "creator code" field — entered code takes precedence.
4. Process every ARB renewal webhook (`net.authorize.payment.authcapture.created`) as `processOrderAttribution()` with inherited creator_id, just like Stripe renewal webhooks.
5. Reverse-attribution check: daily job: `SELECT count(*) FROM order_attributions WHERE provider='corepay' AND created_at > cutover_date AND creator_id IS NULL` — should match expected non-attributed traffic (organic).

**Phase:** Coupon Engine (backfill table) + Cutover (re-onboarding flow inheritance).

---

## 9. Subscription Status Drift / Double Charge [#3 RISK]

**Risk:** Hard cutover creates a window where member could be charged on BOTH systems:
1. Member receives re-onboarding email Monday.
2. Member ignores it for 4 days.
3. Friday: Stripe sub auto-renews ($199 charged).
4. Saturday: member finally clicks email, sets up Authorize.Net sub.
5. New ARB sub `startDate` defaults to today (Saturday) → charges $199 *again*.

Two charges, one cycle. Refunding Stripe charge → reversed creator commission (already accounted for) PLUS new Authorize.Net commission via re-onboarding. **Creator paid twice for same calendar month.**

**Warning sign:** Members report two charges within 7 days of migration email. `commission_ledger` has both `reversed` Stripe entry AND new `corepay` `pending` entry for same `customer_email` within 30 days.

**Prevention — Cutover Day operations sequence (in order):**
1. Disable creation of new Stripe subscriptions (feature flag).
2. **`cancel_at_period_end: true` on every active Stripe sub.** Stops new auto-renewals immediately while keeping current cycle intact.
3. Send re-onboarding emails. Member's current cycle continues until `period_end`; re-onboarding ARB sub `startDate` set to `period_end + 1`.
4. Keep Stripe webhook handler running for 30 days post-cutover for any final `invoice.paid` events on cycles still in flight.

**Smart re-onboarding `startDate`:** Look up Stripe sub's `current_period_end`, set Authorize.Net `startDate = period_end + 1`. Member gets one full cycle on Stripe (already paid), then ARB takes over with no gap.

**Mark `subscriptions.migration_status = 'cutover_pending'`** while in flight. All reads consult this flag to suppress double-actions.

**CRITICAL: Stripe in-flight invoices.** Before `stripe.subscriptions.cancel()`, MUST `stripe.invoices.list({status: 'open'})` + `stripe.invoices.voidInvoice()` for any open invoices. Otherwise Stripe will attempt to charge them after cancellation → double charge.

**Phase:** Cutover (operations sequence + re-onboarding logic).

---

## 10. Receipt-Email Confusion — Authorize.Net Default OFF for ARB

**Risk:** Stripe sends transactional receipts automatically. Authorize.Net ARB receipt setting defaults OFF for new accounts. Day 1 of Authorize.Net: members get NO receipt for first ARB charge → fraud reports / chargebacks. Even if enabled, branding is "CorePay/Authorize.Net" not "CULTR Health."

**Warning sign:** Customer-service ticket spike on cutover day. "I didn't get a receipt" / "Who is this CorePay charge?" social posts.

**Prevention:**
1. Disable Authorize.Net's built-in receipt in Merchant Interface (Account → Email Receipt → uncheck both ARB boxes).
2. Send our OWN receipts via Resend triggered by `net.authorize.payment.authcapture.created`. Reuse `lib/resend.ts`. Branded CULTR header, plan, amount, next renewal date, "Manage your subscription" → `/portal/billing`, refund link.
3. **Pre-cutover heads-up email** to every active subscriber: "Starting [DATE], you'll see CULTR Health charges from 'CULTR HEALTH' on your statement (previously appeared as 'STRIPE')." Reduces panic.

**Phase:** Webhooks (receipt trigger) + Cutover (pre-cutover heads-up).

---

## 11. Refund Window — 180-Day Authorize.Net vs 30-Day Commission Approval

**Risk:** Authorize.Net's refund window is 180 days from settlement (vs Stripe's typical 30-day cadence). Chargebacks can extend up to 540 days under Visa/MC rules. CULTR's `approveEligibleCommissions()` cron auto-approves creator commissions after 30-day refund window. Most refunds happen within 30 days, BUT: small uptick in approved commissions later being reversed. Negative payout balances.

**Warning sign:** `commission_ledger.status='reversed'` rows where original `approved_at < (reversed_at - 30 days)`. Negative `payouts.balance` post-cutover.

**Prevention:**
1. Keep 30-day approval window — most refunds within this.
2. **Add `commission_reserve` table:** hold 5-10% of monthly creator earnings for 90 days post-approval to absorb late refund/chargeback reversals. Release to creator after 90 days clean.
3. Update `handleRefundReversal()` for "already approved" case: if commission already approved + paid, create *negative payout entry* in next batch (claw-back), not just ledger reversal.
4. Notify creator on late reversal: "An order from [N] days ago was refunded. Your account adjusted by $X, reflected in next payout."
5. Track refund age in dashboard: "% of refunds in days 0-30, 31-90, 91-180." If >5% after 30 days, expand window to 60 days.

**Phase:** Commission Engine + Hardening.

---

## 12. Healthie EHR Cross-Cutting — Easy to Miss in Strip-Stripe Sweep

**Risk:** Today, Healthie patient creation isn't yet wired (gated on Plus plan). When that API access becomes available, the natural trigger is the `subscription.created` webhook. During v2.0 strip-Stripe sweep, the sweep mentality is:
1. Find every `import Stripe from 'stripe'` → remove
2. Port Stripe webhook handler → CorePay
3. Rename `stripe_*` columns → `provider_*`

It is **very easy** to miss Healthie because the file/path isn't `stripe`-named. If we wire CorePay webhook but don't add a Healthie hook there: new members post-Healthie-API-arrival never get EHR records. No error, no alert.

**Warning sign:** `grep -rn "healthie" .` returns zero hits in CorePay webhook handler. Healthie API key arrives, provider dashboard has no new patients.

**Prevention:**
1. **Add a TODO + integration test in CorePay webhook handler EVEN NOW:**
   ```typescript
   if (event.type === 'net.authorize.subscription.created' && process.env.HEALTHIE_API_KEY) {
     // TODO(healthie): when API enabled, add patient creation here
   }
   ```
2. **Maintain `INTEGRATION_TRIGGER_MATRIX.md` in `.planning/`:** rows = events, columns = integrations (Healthie, Resend, QuickBooks, Mailchimp, commission engine, SiPhox).
3. Test: mock CorePay webhook → assert ALL downstream calls fire. Add Healthie to assertion when wired.
4. Document in `corepay-api` skill: webhooks that trigger downstream integrations must be verified after every webhook handler change.

**Phase:** Webhooks (integration matrix + stub).

---

## 13. Multi-Environment Env Var Drift — STRIPE_* Lingering

**Risk:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` exist in Vercel staging, Vercel production, `.env.example`, local `.env.local`, and possibly hardcoded test fixtures. Removing `import Stripe` while leaving env vars → future developer reads `.env.example`, assumes Stripe still in there, debugs for hours.

**Warning sign:** `vercel env ls` for staging/production includes any `STRIPE_*`. `npm ls stripe` returns hits.

**Prevention:**
1. `/pre-deploy` checklist: "Run `vercel env ls` for staging and production. Confirm zero `STRIPE_*` env vars."
2. Migration script `scripts/cleanup-stripe-env.sh` using `vercel env rm` to remove all `STRIPE_*` from both environments. Run once at cutover.
3. Update `.env.example` to document `COREPAY_*` and explicitly comment "Stripe env vars removed v2.0".
4. Search-and-destroy: `grep -rn "process.env.STRIPE_" --exclude-dir=node_modules .` returns zero before merge.
5. Sentry alert: any code path attempting `process.env.STRIPE_*` post-cutover → alert.

**Phase:** Cutover/Cleanup.

---

## 14. DB Column Rename — Zero-Downtime Requires 3 Deploys

**Risk:** Renaming `stripe_customer_id` → `provider_customer_id` is instant in PostgreSQL but breaks any in-flight reader. Vercel deploys are not atomic across regions — one region may have new code, another old code, for ~30 seconds during deploy. Half the requests succeed, half fail with `column does not exist`.

**Note:** Migration `004_payment_provider.sql` ALREADY added `provider_customer_id`, `provider_subscription_id`, `provider_transaction_id`, `payment_provider` columns alongside the `stripe_*` columns. The rename step is partially obsolete — we already have both columns. The work is **dual-write + cutover**, not a fresh rename.

**Expand-Contract pattern (3 deploys):**

1. **Expand:** Add new columns (already done in migration 004). Backfill `UPDATE provider_customer_id = stripe_customer_id WHERE provider_customer_id IS NULL`. Deploy code that **writes both** + **reads `COALESCE(provider_customer_id, stripe_customer_id)`**. Wait 1 hour for traffic to drain.
2. **Switch:** Deploy code that reads/writes only `provider_customer_id`. Wait 24 hours. Verify no new writes to `stripe_customer_id`.
3. **Contract:** Run migration to DROP `stripe_customer_id` (or rename to `stripe_customer_id_legacy` for archaeology — safer).

Tables that still need provider columns added (NOT in migration 004):
- `creator_customer_portfolio.stripe_subscription_id` → add `provider_subscription_id`
- `siphox_kit_orders.stripe_subscription_id` → add `provider_subscription_id`
- `asher_orders.stripe_payment_intent_id` → add `provider_payment_intent_id`
- `pending_intakes.stripe_payment_intent_id` → add `provider_checkout_id`

**Warning sign:** Sentry: `column "stripe_customer_id" does not exist` post-deploy.

**Prevention:**
1. Strict 3-deploy sequence (documented in roadmap), with 1-hour and 24-hour gates.
2. DB migration runner: reject migrations including `RENAME COLUMN` in single statement (lint rule). Force expand-contract pattern.
3. Vitest integration test simulating in-flight scenario.
4. `/pre-deploy` checklist: confirm 3-deploy sequence followed for any RENAME COLUMN.

**Phase:** DB Migration (3-deploy plan with explicit phases).

---

## Confidence Summary

- **Authorize.Net behavior facts** (timing, codes, defaults): HIGH (multiple official sources)
- **Migration sequencing recommendations:** MEDIUM (industry pattern from expand-contract literature)
- **CULTR-specific impact assessments:** MEDIUM (depends on plan execution; reasoned from `lib/creators/commission.ts` and `lib/payments/corepay-gateway.ts`)
- **Stripe → Authorize.Net "double-charge window" risk:** HIGH (universally reported in case studies)

## Sources

- [ARB Subscription Configuration / Update behavior](https://support.authorize.net/knowledgebase/article/KA-04444/en-us)
- [Recurring Billing API Documentation](https://developer.authorize.net/api/reference/features/recurring-billing.html)
- [Webhooks API + HMAC SHA512](https://developer.authorize.net/api/reference/features/webhooks.html)
- [Authorize.Net IP Addresses](https://support.authorize.net/knowledgebase/article/000001158/)
- [Accept.js (15-min token, single-use)](https://developer.authorize.net/api/reference/features/acceptjs.html)
- [Common Error Codes (E00114, E00116, Code 13)](https://support.authorize.net/knowledgebase/article/KA-04306/en-us)
- [AVS Configuration / Default Rejection Codes](https://account.authorize.net/help/Account/Settings/Security_Settings/Fraud_Settings/Address_Verification_System_(AVS).htm)
- [Settlement Timing / 180-day Refund Window](https://support.authorize.net/knowledgebase/article/000001244/en-us)
- [ARB Suspended Status + Termination Behavior](https://salferrarello.com/authorize-net-automated-recurring-billing-statuses/)
- [Expand-Contract Pattern for Zero-Downtime Migrations](https://dev.to/jp_fontenele4321/the-expand-and-contract-pattern-for-zero-downtime-migrations-445m)
