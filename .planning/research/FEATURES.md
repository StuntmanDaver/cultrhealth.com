# v2.0 Features — What Stripe Gave Us For Free, And What We Must Build

**Milestone:** Stripe → CorePay (Authorize.Net) replacement
**Researched:** 2026-04-27
**Overall confidence:** HIGH (Authorize.Net + Stripe docs are the authoritative source on every gap below)

> Supersedes prior FEATURES.md (SiPhox Health blood test research, 2026-03-14).

---

## TL;DR — The Gap Map

Stripe is a *subscription platform* with a hosted UI surface; Authorize.Net is a *gateway* with a recurring-billing engine bolted on. Replacing Stripe means rebuilding the **subscription orchestration layer** ourselves. Anything Stripe rendered (portal, hosted checkout, receipts, dunning UI) or computed (proration, retry timing, MRR adjustments for coupons) is now CULTR's responsibility.

| Stripe-provided behavior | Authorize.Net equivalent | CULTR must build |
|---|---|---|
| Hosted billing portal (`billing.stripe.com`) | None | Yes — full `/portal/billing` |
| Hosted Checkout + Payment Element | Accept.js (form widget only, no flow) | Yes — checkout flow + state |
| Coupon system (FOREVER/REPEATING/ONCE) | None — must store in our DB | Yes — coupon engine |
| Smart Retries (ML-driven dunning) | "Automatic Retry" (binary on/off, internal logic opaque) | Partial — we control retry cadence ourselves |
| Receipt emails | Optional, plain-text, no PDF, can't be styled | Yes — branded receipts via Resend |
| Pause subscription | None (suspend ≠ pause; suspend is failure-only) | Yes — emulate via cancel-and-recreate |
| Mid-cycle upgrade with proration | `ARBUpdateSubscriptionRequest` updates amount but **does not prorate, does not charge difference** | Yes — proration math + immediate charge via CIM |
| Account Updater (free) | Account Updater **paid add-on**, V/MC only, batch-only (4th of month) | Confirm enabled; build fallback |
| Webhook event suite | 8 ARB events only (no `invoice.payment_succeeded` analog with line items) | Yes — synthesize "invoice paid" from `subscription.updated` + transaction polling |

---

## 1. Self-Service Portal

Stripe's `billing.stripe.com` is a *complete product*. Authorize.Net has zero hosted customer-facing UI. Everything below must be built into `/portal/billing`.

### Stripe portal — full feature inventory (what members can do today)

Verified against [Stripe customer portal docs](https://docs.stripe.com/customer-management/configure-portal):

1. View active subscriptions and current price/interval
2. Update payment method (card swap, mobile-optimized form)
3. Update billing address
4. Update email address
5. Update tax ID
6. View full invoice history
7. Download invoice PDFs (Stripe-rendered, branded with merchant logo)
8. Download receipt PDFs
9. Cancel subscription (immediate or end-of-period)
10. Provide cancellation reason (configurable list, optional)
11. Receive retention coupon offer at cancellation step (configurable per merchant)
12. Upgrade/downgrade subscription with auto-proration preview ("you will be charged $X today")
13. Switch between billing intervals (month ↔ year) where Price IDs allow it
14. View paused state (read-only — pause itself is merchant-controlled)
15. Localized in 30+ languages with currency formatting
16. Deep-link entry points (`flow_data.type: 'subscription_update' | 'subscription_cancel' | 'payment_method_update'`)

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 1.1 | View active subscription (tier, price, next billing date, payment method last 4) | **S** | DB schema rename `stripe_*` → `provider_*` |
| 1.2 | Update card on file (Accept.js form → CIM `updatePaymentProfile`) | **M** | Accept.js client key; CIM customer profile must exist |
| 1.3 | Cancel subscription (`ARBCancelSubscriptionRequest`) | **S** | ARB subscription ID stored on user |
| 1.4 | View billing history (last 12 months of transactions from CULTR DB, NOT Authorize.Net's reporting API which has 30-day windowing limits) | **M** | Persist every successful charge as a CULTR `invoice` row at webhook time; we cannot rely on the gateway as system-of-record |
| 1.5 | Download branded receipt for any past charge (PDF via @react-pdf/renderer — already in stack) | **M** | 1.4 + invoice template (model on existing `lib/invoice/`) |
| 1.6 | Update billing email (CULTR account email is decoupled from gateway profile email) | **S** | Update CIM profile + CULTR users table |
| 1.7 | Cancellation flow with reason capture (free-text + radio list) | **S** | New `cancellation_reasons` table, used for churn analytics |
| 1.8 | "End of period" vs "Immediate" cancel toggle (default end-of-period to preserve paid-through service) | **S** | Soft-cancel state machine: ARB cancel + CULTR `access_until` timestamp |
| 1.9 | Resume canceled subscription (within 30-day grace) | **M** | New ARB sub via CIM token; idempotency keys |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 1.10 | Retention coupon offer at cancel step (e.g. "Stay for 50% off next month — apply CULTRSTAY") | **M** | Coupon engine §2 + cancellation flow 1.7 |
| 1.11 | Plan comparison + upgrade preview ("Upgrading to Catalyst+ today: $300 prorated charge now, $499 on May 27") | **L** | Proration math §3.4 |
| 1.12 | Pause subscription (emulated; see §3) | **L** | Cancel-and-recreate pattern §3.2 |
| 1.13 | Switch billing day (month-anchor to date-X — not natively supported by ARB; requires sub recreation) | **L** | Same engine as 1.12 |
| 1.14 | Saved payment methods list (multiple cards via CIM payment profile array) — Stripe portal only shows "default" by default | **M** | Multiple CIM payment profile IDs per CIM customer |
| 1.15 | Tax ID / receipt customization for HSA/FSA reimbursement | **M** | Receipt template fields |
| 1.16 | Branded subdomain (`billing.cultrhealth.com` for trust signal) | **S** | Vercel domain + middleware route |

### Anti-features — Stripe had it, we don't need it

| # | What Stripe offered | Why skip |
|---|---|---|
| 1.A | Localization in 30+ languages | US-only (Florida-led jurisdiction); English-only is fine |
| 1.B | Tax ID / VAT entry | Not B2B, not international — no use case |
| 1.C | Multi-currency | USD-only per Out-of-Scope in PROJECT.md line 81 |
| 1.D | Switching between billing intervals (month ↔ year) | CULTR has zero annual plans today; can defer |
| 1.E | Customer-facing chargeback / dispute interface | Disputes go through provider operations, not member self-service |
| 1.F | Test-mode toggle in portal | Internal-only concern; not member-facing |

---

## 2. Coupons / Discounts

**The hard truth:** Authorize.Net ARB has *no native coupon concept*. There is no `ARBApplyDiscountRequest`. The "% off forever" semantic must be encoded in our DB and applied to the `amount` field of every ARB charge cycle — which means **the price stored on the ARB subscription itself is the post-discount amount**, and we must re-write that amount any time the discount semantics change.

Verified: [Stripe coupon duration patterns](https://docs.stripe.com/api/coupons) supports `forever | repeating | once`. No equivalent in Authorize.Net.

### Coupon types CULTR uses today (per `lib/config/plans.ts` + `lib/config/coupons.ts`)

| Coupon | Type | Effect | Cited as |
|---|---|---|---|
| `FOUNDER15` | forever | 15% off every billing cycle, indefinitely | `STRIPE_CONFIG.coupons.FOUNDER15` |
| `FIRSTMONTH` | once | 50% off first invoice only | `STRIPE_CONFIG.coupons.FIRSTMONTH` |
| Creator codes (e.g. `JON21`, `STEWART1`) | once on first sub charge + commission attribution | 10% customer discount + 20% creator commission | `validateCouponUnified()` in `coupons.ts` |
| `CULTR30`, `RETA`, `OWNERLR3`, etc. | once (product-level for club orders) | 10–70% off matching items | `CLUB_COUPONS` map |

### Recommended pattern — "discount-bake" on the ARB subscription

For each subscription:
1. Resolve the coupon at checkout → compute `effectiveAmount = baseAmount * (1 - discountPercent/100)`
2. Create the ARB subscription with `amount = effectiveAmount` (the "baked" amount)
3. Store `coupon_code`, `original_amount`, `discount_percent`, `discount_duration` on the CULTR `subscriptions` row — **the gateway is dumb about discounts; CULTR is the source of truth**
4. For `once` coupons: charge the first month via CIM `createTransactionRequest` at `effectiveAmount`, then create the ARB at full `baseAmount` with the schedule starting next month
5. For `forever` coupons: ARB amount stays at `effectiveAmount` indefinitely
6. For `repeating` coupons (e.g. "20% off for 3 months"): ARB initial amount = discounted; cron job updates the ARB to full price after N months via `ARBUpdateSubscriptionRequest`

**Why this pattern:** ARB cannot apply a multiplier per cycle. The amount is baked in. So our coupon engine becomes a **schedule of amount updates** rather than a runtime calculation.

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 2.1 | Coupon entity + CRUD (`coupons` table: code, type, value, duration, max_redemptions, expires_at) | **M** | Migration + admin UI (existing `CLUB_COUPONS` is hardcoded — DB-ize it) |
| 2.2 | Coupon validation API (`/api/checkout/validate-coupon`) — already exists in skeleton form for club | **S** | Reuse `validateCouponUnified()` shape |
| 2.3 | Apply coupon at checkout: bake `effectiveAmount` into ARB sub | **M** | Checkout API + ARB create |
| 2.4 | `FOUNDER15` (forever) — bake-once pattern, no scheduled update | **S** | 2.3 |
| 2.5 | `FIRSTMONTH` (once) — split into `createTransaction` (month 1 discounted) + ARB starting month 2 at full price | **M** | Two API calls per checkout; idempotency critical |
| 2.6 | Creator-code attribution (existing `order_attributions` table) — preserve attribution flow on ARB charges by emitting our own "subscription cycle" event from webhook | **M** | Webhook handler §5; attribution table already exists |
| 2.7 | Migration job: re-apply Stripe coupons to ARB subs at cutover (for active `FOUNDER15` users) | **L** | Admin tool; one-shot script for ~50% migration window |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 2.8 | Repeating coupons ("3 months of 20% off") via cron-scheduled ARB amount updates | **M** | 2.3 + cron job |
| 2.9 | Stackable coupons (e.g. tier discount + creator code) | **L** | Application order matters; rule engine |
| 2.10 | Promo code analytics dashboard (redemptions, conversion lift, revenue impact) | **M** | Existing admin dashboard pattern |
| 2.11 | Coupon-bound to specific tier (`FOUNDER15` only valid for Catalyst+) | **S** | Coupon entity field |
| 2.12 | Coupon expiration notifications (email at -7 days for repeating coupons) | **S** | Resend integration |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 2.A | Coupon import/export CSV | Coupon count is small enough to manage in admin UI |
| 2.B | Per-customer coupon application (Stripe `customer.discount`) | We apply at checkout only; no need for customer-attached coupons |
| 2.C | Currency-specific coupon amounts | USD-only (see 1.C) |

---

## 3. Subscription Lifecycle (pause / cancel / resume / upgrade)

This is the biggest behavioral gap. Stripe gives you state-machine primitives; Authorize.Net gives you "create / cancel / update amount / handle suspended-on-decline" and that's it.

### What Authorize.Net actually supports (verified)

| Operation | API | Notes |
|---|---|---|
| Create | `ARBCreateSubscriptionRequest` | Cannot charge first payment immediately on the same call — see §3.5 |
| Cancel | `ARBCancelSubscriptionRequest` | Permanent. No "cancel at period end" — cancellation stops future charges immediately, but **does not refund the current period** |
| Update amount | `ARBUpdateSubscriptionRequest` | Updates amount/payment info. **Does not prorate. Does not charge difference. Takes effect on next scheduled cycle** |
| Update interval | Not allowed | Cannot change month → year on existing sub |
| Update start date | Only if no successful payments yet | Useless for active subscribers |
| Pause | **Not supported** | "Suspended" status exists but is a system-set failure state — you cannot suspend manually via API |
| Resume from suspended | Update payment info with `ARBUpdateSubscriptionRequest` | Only works if suspension was payment-failure-driven |

Source: [Authorize.Net API ARBUpdateSubscriptionRequest community thread](https://community.developer.cybersource.com/t5/Integration-and-Testing/Updating-ARB-Subscription-status-to-quot-Suspended-quot/td-p/61472) and [official ARB docs](https://developer.authorize.net/api/reference/features/recurring-billing.html).

### 3.1 Cancel — UX impact

**Stripe behavior:** member cancels → Stripe marks `cancel_at_period_end = true` → service runs through paid-through date → no refund needed.

**Authorize.Net behavior:** `ARBCancelSubscriptionRequest` stops future charges but does NOT refund the in-flight cycle. Member has *already paid* through the next renewal date.

**CULTR pattern (v2.0):** Default to **soft-cancel**:
1. Member clicks "Cancel" → CULTR marks `subscriptions.access_until = current_period_end`
2. CULTR fires `ARBCancelSubscriptionRequest` immediately (so no surprise charge next month)
3. Member retains library/portal access until `access_until`
4. At `access_until`, cron job runs and downgrades user to Club tier
5. Optional: "Reactivate" button before `access_until` runs `ARBCreateSubscriptionRequest` (no charge — it's already paid through)

### 3.2 Pause — emulated only

The plan in PROJECT.md says "cancel + retain card-on-file, recreate on resume." Verified this is the only path — there is no first-class pause.

**UX impact on member:**
- **Gap in service:** Member loses tier access at next billing date (since the cancel was processed; no future charges = no future service unless we explicitly grant grace)
- **Billing date shift:** When member resumes, the new ARB sub starts whenever they hit "Resume." So if they paused on the 15th and resumed on the 22nd, their new billing anchor is the 22nd. Stripe's pause preserves the original anchor; ours cannot.
- **Risk:** Card-on-file might expire during pause window. CIM handles this via Account Updater, but if member opts into "no auto-resume," their card may be invalid by then.

**Recommended pattern:**
1. Cancel current ARB sub, **but retain the CIM customer + payment profile** (this is the critical insight — CIM is decoupled from ARB)
2. Set `subscriptions.status = 'paused'`, `paused_until = N days from now` (default 30, max 90)
3. Optional auto-resume: cron job fires `ARBCreateSubscriptionRequest` with the stored CIM profile on `paused_until`
4. Manual resume: portal button creates new ARB sub immediately

### 3.3 Resume — clean if CIM profile retained

If the CIM customer/payment profile is intact (which it should be — CIM is independent of ARB), resume = `ARBCreateSubscriptionRequest` with `paymentProfileId` reference. No card re-entry needed.

If the CIM profile was deleted (don't do this on cancel; mark inactive), member must re-enter card via Accept.js.

### 3.4 Mid-cycle plan upgrade (Core $149 → Catalyst+ $499)

**The critical answer:** `ARBUpdateSubscriptionRequest` *does* allow amount changes, BUT:
- It takes effect on the **next scheduled cycle**, not immediately
- It does **not prorate**
- It does **not charge the difference**

[Verified via Authorize.Net community](https://community.developer.cybersource.com/t5/Integration-and-Testing/Can-we-change-ARB-Subscription-Amount/td-p/17480): "Authorize.net does not offer proration automation for customers switching plans in the middle of a billing cycle, which means businesses would need to engage in manual calculations every time a subscriber changes their amount mid-cycle."

**What members expect from Stripe today:**
- Click "Upgrade to Catalyst+" → see modal: "You'll be charged $X today (prorated for remaining 18 days), then $499/mo starting June 27"
- Click confirm → instant charge → instant tier upgrade in member dashboard
- Single line item in invoice history: "Pro-rated upgrade Core → Catalyst+"

**CULTR pattern (recommended):** **Cancel-and-recreate with proration math:**

```
Member on Core ($149/mo), 18 days remaining in current cycle. Upgrades to Catalyst+ ($499/mo).

1. Compute proration:
   - daily_core_credit = 149 / 30 = 4.97
   - remaining_credit  = 4.97 * 18 = 89.40
   - daily_cat_charge  = 499 / 30 = 16.63
   - remaining_charge  = 16.63 * 18 = 299.40
   - prorated_charge   = remaining_charge - remaining_credit = 210.00

2. Charge $210 immediately via CIM `createTransactionRequest` (one-shot, NOT a subscription)
3. Cancel current Core ARB sub (`ARBCancelSubscriptionRequest`)
4. Create new Catalyst+ ARB sub starting on the original billing anchor (so renewal cadence is preserved)
5. Update `subscriptions.tier` immediately on success
6. Webhook from step 2 emits `provider.transaction.captured` → CULTR generates receipt + sends to member
```

**Downgrade pattern (v2.1):** Hold off until end-of-period to avoid refund mess. At period end, swap subscriptions.

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 3.1 | Cancel (soft, end-of-period default) | **M** | `subscriptions.access_until`; cron downgrade job |
| 3.2 | Cancel (immediate, with no refund) | **S** | Admin path only; member-facing path is 3.1 |
| 3.3 | Update card on file (CIM `updatePaymentProfile` via Accept.js) | **M** | §1.2 |
| 3.4 | Mid-cycle upgrade with proration (immediate charge + cancel-recreate) | **L** | §3.4 pattern; idempotency keys per upgrade attempt |
| 3.5 | Initial subscription charge (ARB cannot charge day 1; must split: CIM `createTransaction` + ARB starting next cycle) | **M** | This is a **must** — ARB schedules first charge per the schedule, not on creation |
| 3.6 | Reactivate canceled sub (before `access_until`) — no charge | **S** | New ARB sub via stored CIM profile |
| 3.7 | Provider-agnostic schema rename (`stripe_*` → `provider_*`, drop `stripe_events`) | **M** | DB migration; per PROJECT.md active req line 68 |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 3.8 | Pause (emulated cancel-and-recreate) | **L** | 3.1 + auto-resume cron + UX warnings |
| 3.9 | Downgrade with end-of-period swap | **L** | Scheduled job to swap subs at period end |
| 3.10 | Switch billing anchor date | **L** | Cancel-and-recreate same plan, new schedule |
| 3.11 | Annual plan support | **M** | New ARB schedule type; new pricing |
| 3.12 | Bulk migration tool (Stripe → Authorize.Net cutover) | **L** | Required for migration in PROJECT.md req line 67 |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 3.A | Trial periods on subscriptions | CULTR has no trial today; not in active reqs |
| 3.B | Subscription "schedules" (future-dated changes) | Over-engineering for v2.0; admin can manually handle edge cases |
| 3.C | Multi-product subscriptions (one sub with multiple line items) | All CULTR plans are single-tier; addons are one-time charges |

---

## 4. Refunds & Voids

Authorize.Net's distinction matters and bleeds into UX. Verified via [Authorize.Net knowledge base](https://support.authorize.net/knowledgebase/article/000001368/en-us):

| Action | When valid | Latency | Customer-facing UX |
|---|---|---|---|
| **Void** | Same day, before nightly settlement (typically before 4 PM PT) | Instant — no money moved | "Refunded immediately" |
| **Refund** | After settlement (T+1 or later) | 3–5 business days for funds to return to card | "Refund issued, may take 3–5 business days" |

Stripe abstracts this — `refunds.create()` works on any captured charge regardless of settlement state. Stripe internally voids if pre-settlement, refunds if post.

### CULTR pattern

A unified `/api/refunds/create` endpoint that:
1. Looks up the original transaction
2. Checks settlement status via `getTransactionDetailsRequest`
3. If unsettled → `voidTransactionRequest` (returns "instant" status to UI)
4. If settled → `createTransactionRequest` with `transactionType: refundTransaction` (returns "3–5 business days" status)
5. Records both as a single `refunds` row with method = void | credit
6. Fires receipt-style email to customer with the language matched to the actual mechanism

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 4.1 | Refund/void unified API endpoint | **M** | Authorize.Net SDK / corepay-gateway |
| 4.2 | Admin "Refund" button on order/transaction detail (existing admin pattern) | **S** | 4.1 |
| 4.3 | Refund email to customer (branded; clear language about timing) | **S** | Resend integration |
| 4.4 | Refund commission reversal (existing `reverseCommissionsForAttribution`) — must trigger on refund webhook | **S** | Helper exists per CLAUDE.md "Commission Ledger Lifecycle" |
| 4.5 | Partial refund support | **S** | 4.1 with amount param |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 4.6 | Member-self-service refund request (in portal, captures reason, admin approves) | **M** | New `refund_requests` table; admin queue |
| 4.7 | Auto-refund within 7-day "money-back guarantee" window if member cancels | **M** | 4.1 + cancellation flow integration |
| 4.8 | Settlement status indicator in admin UI ("Settled at 4:32 PM") | **S** | Pull from getTransactionDetails |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 4.A | Dispute (chargeback) UI | Disputes flow through merchant operations, not member portal |
| 4.B | Reason codes (Stripe's standardized refund reason taxonomy) | Free-text reason is sufficient for our scale |

---

## 5. Receipts & Notifications

[Verified via Authorize.Net email receipt docs](https://support.authorize.net/knowledgebase/article/000001326/en-us): Authorize.Net does send a customer email receipt **if** "Email transaction receipt to customer" is enabled in merchant interface AND the customer's email is submitted with the transaction. **However:**
- The receipt is plain-text style with a configurable header/footer
- Cannot be branded beyond the header/footer text
- No PDF attachment
- No itemization beyond a single line
- Customer's email must be passed on every transaction

This is a downgrade from Stripe's auto-emitted, fully branded, itemized HTML receipts with PDF attachments.

### Receipt-on-charge pattern

Disable Authorize.Net's built-in email and emit our own from the webhook handler:

```
Webhook: net.authorize.payment.authcapture.created
       ↓
       lookupTransactionDetails() — get amount, last 4, AVS, etc.
       ↓
       lookupSubscription() — match to CULTR sub via ARB ID
       ↓
       generateReceiptPDF() — @react-pdf/renderer (already in stack for invoices)
       ↓
       Resend.send({ template: 'receipt', attachments: [pdf] })
```

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 5.1 | Branded receipt email on every successful charge | **M** | Webhook handler + Resend + receipt template |
| 5.2 | PDF receipt attachment (reuse existing `lib/invoice/`) | **M** | 5.1 |
| 5.3 | Disable Authorize.Net merchant-interface email receipts | **S** | Settings change in merchant portal |
| 5.4 | Failed payment email ("We couldn't process your payment, please update your card") | **S** | Webhook `subscription.failed` |
| 5.5 | Successful renewal email (Stripe sent these by default; pleasant continuity) | **S** | Webhook `subscription.created` cycle event |
| 5.6 | Subscription canceled confirmation email | **S** | Cancel flow §3.1 |
| 5.7 | Card-on-file expiring soon (-30d, -7d) | **S** | Cron job querying CIM payment profiles |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 5.8 | SMS notification for failed payment (high-value patient continuity case) | **M** | Twilio (in PROJECT.md long-term reqs) |
| 5.9 | Receipt customization (member can set "show on bank statement as MEDICAL/Rx" — for HSA reimbursement) | **S** | Receipt template fields |
| 5.10 | Annual usage summary email | **S** | Aggregate from invoice history |
| 5.11 | Renewal reminder email (-7 days before next charge) | **S** | Cron job |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 5.A | Auto-translate receipts | English-only |
| 5.B | Customer Stripe-hosted receipt URL | Our PDF + email is sufficient and on-brand |

---

## 6. Failed Payment Recovery

[Verified via Authorize.Net Automatic Retry docs](https://support.authorize.net/knowledgebase/article/000002356/en-us):

| Capability | Authorize.Net Automatic Retry | Stripe Smart Retries |
|---|---|---|
| Retry decision | Binary on/off — once enabled, **cannot be disabled** | ML model with 500+ attributes |
| Retry timing | Opaque internal logic; subscription suspended on decline, retried on payment-info update | 1 wk, 2 wk, 3 wk, 1 mo, or 2 mo configurable; default 8 tries in 2 wks |
| Recovery rate | Unknown / not published | ~38% standalone, 57% with combined recovery tools |
| Customer interaction | None — purely server-side | Email reminders + customer portal payment update |

**The critical limitation:** Authorize.Net Automatic Retry suspends the subscription on the first decline and **stops trying** until the merchant updates the payment information. There is no automatic retry **cadence**. It's "retry once after card update."

### CULTR pattern — build the retry loop ourselves

Webhook receives `net.authorize.customer.subscription.suspended`:

1. Mark `subscriptions.status = 'past_due'`
2. Email member: "Your CULTR Catalyst+ subscription is on hold — update your card to keep going"
3. Cron job at +24h: re-attempt charge via `createTransaction` with stored CIM profile (yes, the same one — temporary issuer issues happen)
4. Cron at +72h: second attempt + escalating email
5. Cron at +7d: third attempt + final warning + tier downgrade preview
6. Cron at +14d: cancel ARB, downgrade to Club tier, send "subscription ended" email

This is the **dunning ladder** Stripe Smart Retries gives you for free.

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 6.1 | Webhook handler for `subscription.suspended` and `subscription.failed` (already in active reqs line 65) | **M** | HMAC-SHA512 verification per PROJECT.md |
| 6.2 | Past-due state on subscription entity | **S** | DB schema |
| 6.3 | Dunning email cadence (+0, +24h, +72h, +7d, +14d) | **M** | Resend + cron |
| 6.4 | Retry job (cron) — re-attempt failed charges with stored CIM profile | **M** | CIM profile must persist through suspension |
| 6.5 | Account Updater enabled at merchant level (handles V/MC card expiration auto-update) | **S** | Merchant interface setting; verify cost |
| 6.6 | Final cancellation + downgrade after retry exhaustion | **S** | 6.4 |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 6.7 | Smart retry timing (basic — avoid weekends, use issuer pattern data) | **L** | Custom logic; not ML |
| 6.8 | "Update card from email" deep link (one-click to portal `/portal/billing/update-card?token=...`) | **S** | Signed token; existing magic-link pattern |
| 6.9 | Retry attempt history visible to admin (debug failed charges) | **S** | Existing admin pattern |
| 6.10 | Pre-decline "card expiring" alert at -30d, -7d | **S** | §5.7 dovetails here |
| 6.11 | Voluntary card update reminder when AVS mismatches creep up | **M** | Pattern detection |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 6.A | ML-driven retry timing | Out of scope; Stripe's recovers ~38% — our heuristic ladder will get most of that with a fraction of the build cost |
| 6.B | Multi-currency retry behavior | USD only |

---

## 7. Reporting & Analytics (admin)

Stripe Dashboard provided extensive reporting that admin uses today (informally — not all surfaced in CULTR's own admin). Authorize.Net has the [Merchant Interface](https://account.authorize.net/) reporting, but it's **30-day windowed** and **not API-friendly**.

### Reality check

CULTR already has a robust admin dashboard (per CLAUDE.md "Admin Dashboard Top 5 Features"). The migration is mostly **pivoting data sources** from Stripe API → CULTR DB (which is already system-of-record for orders/attributions). The Authorize.Net gateway is a *transaction processor*, not a reporting source.

### Table stakes — Must build for v2.0

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 7.1 | Persist every successful charge to `transactions` table at webhook time (system-of-record shift) | **M** | Webhook handler + idempotency |
| 7.2 | Admin: subscription list with provider-agnostic columns (no `stripe_subscription_id` references) | **S** | Schema rename §3.7 |
| 7.3 | Admin: refund/void from transaction detail | **S** | §4.2 |
| 7.4 | Admin: failed payment list (past-due subscriptions) | **S** | §6.2 state |
| 7.5 | Admin: MRR calculation excluding active coupons (or including, configurable per coupon) | **M** | Coupon entity §2 |

### Differentiators — v2.1+ candidates

| # | Feature | Complexity | Dependencies |
|---|---|---|---|
| 7.6 | Cohort retention chart (Stripe didn't have this either; we'd build it ourselves regardless) | **M** | DB queries |
| 7.7 | Revenue forecast based on active subscriptions | **M** | DB queries |
| 7.8 | Settlement reconciliation (match daily settlement batch to CULTR's expected receivable) | **L** | Authorize.Net batch reporting |
| 7.9 | Coupon ROI dashboard (revenue impact, conversion lift) | **M** | §2.10 |
| 7.10 | Failed payment recovery rate metric (dunning effectiveness) | **S** | §6 outcomes |

### Anti-features — Skip

| # | What Stripe offered | Why skip |
|---|---|---|
| 7.A | Sigma SQL reporting | Overkill; CULTR has direct DB access |
| 7.B | Stripe Atlas/Tax integration | Out of scope (no tax automation needed) |

---

## Cross-cutting concerns

### CC-1: Schema migration `stripe_*` → `provider_*` (per PROJECT.md req line 68)
- Renames: `stripe_customer_id` → `provider_customer_id`, `stripe_subscription_id` → `provider_subscription_id`, etc.
- Add `provider` enum column (`stripe` | `authorize_net`) to support gradual migration
- Drop `stripe_events` (replaced by HMAC webhook log if needed)
- **Complexity: M.** Affects ~12 tables based on CLAUDE.md schema. Touches every payment code path.

### CC-2: HMAC-SHA512 webhook signature verification
- Authorize.Net signs webhook bodies with merchant signature key
- Per CLAUDE.md note: `crypto.timingSafeEqual()` requires equal-length buffers — must validate hash length before compare
- Edge runtime support: needs `nodejs_compat` or equivalent if it ever moves to Cloudflare Pages
- **Complexity: M.** New endpoint + signature lib + per-event handler.

### CC-3: Migration cutover for existing Stripe subscribers (per PROJECT.md req line 67)
- ~50% churn risk accepted per project decision (line 121)
- Re-onboarding flow: send email → magic link → Accept.js card capture → ARB sub creation
- 30-day window per PROJECT.md
- Stripe subs continue running in parallel until each member migrates or the window closes
- **Complexity: L.** Includes admin dashboard for migration progress, daily metrics emails, fallback "extend window" path.

### CC-4: Idempotency keys
- Stripe handles idempotency natively (`Idempotency-Key` header)
- Authorize.Net does **not** — multiple `ARBCreateSubscriptionRequest` calls with same data create multiple subscriptions
- CULTR must layer idempotency via DB-side `idempotency_keys` table keyed on (operation, intent_id)
- Critical for: checkout (don't double-charge), upgrades (don't double-prorate), refunds (don't double-credit)
- **Complexity: M.** New table + middleware on every mutation endpoint.

### CC-5: Sentry observability (per PROJECT.md req line 69)
- Wrap every Authorize.Net SDK call with span/breadcrumb capture
- Tag webhook events with their `eventType` for filterability
- Alert on: HMAC signature mismatch, unknown event types, processing latency > 5s
- **Complexity: M.** Already have Sentry-style patterns; add the wrapper.

### CC-6: PCI scope minimization
- Per PROJECT.md constraint line 128: server never touches PAN
- Accept.js + opaque data tokens stays SAQ A-EP
- CIM payment profiles stored at gateway, referenced by ID only in CULTR DB
- **Complexity: S** if pattern is followed; **catastrophic** if violated. Must be reviewed in code audit hook.

---

## Sources

### Authorize.Net (authoritative — HIGH confidence)
- [Authorize.Net ARB API Reference](https://developer.authorize.net/api/reference/features/recurring-billing.html)
- [Accept.js API Reference](https://developer.authorize.net/api/reference/features/acceptjs.html)
- [Webhook Notifications knowledge article](https://support.authorize.net/knowledgebase/Knowledgearticle/?code=KA-07621) — full event list
- [ARB Automatic Retry knowledge article](https://support.authorize.net/knowledgebase/article/000002356/en-us)
- [Account Updater datasheet](https://www.authorize.net/content/dam/documents/en/account-updater.pdf)
- [Email Receipts settings](https://support.authorize.net/knowledgebase/article/000001326/en-us)
- [Void vs Refund knowledge article](https://support.authorize.net/knowledgebase/article/000001368/en-us)
- [ARB Subscription pause community thread](https://community.developer.cybersource.com/t5/Integration-and-Testing/Pause-and-Resume-an-ARB-Subscription/td-p/19038) — confirms no first-class pause
- [ARB amount update community thread](https://community.developer.cybersource.com/t5/Integration-and-Testing/Can-we-change-ARB-Subscription-Amount/td-p/17480) — confirms no proration
- [ARBUpdateSubscriptionRequest status limitation](https://community.developer.cybersource.com/t5/Integration-and-Testing/Updating-ARB-Subscription-status-to-quot-Suspended-quot/td-p/61472) — confirms no API status updates
- [totalOccurrences=9999 perpetual subscription pattern](https://community.developer.cybersource.com/t5/Integration-and-Testing/ARB-Question-about-totalOccurrences/td-p/32221)

### Stripe (authoritative — HIGH confidence)
- [Stripe customer portal docs](https://docs.stripe.com/customer-management)
- [Configure portal](https://docs.stripe.com/customer-management/configure-portal)
- [Portal deep links / flow_data](https://docs.stripe.com/customer-management/portal-deep-links)
- [Smart Retries docs](https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- [Pause subscriptions](https://docs.stripe.com/billing/subscriptions/pause)
- [Cancellation page with retention coupons](https://docs.stripe.com/customer-management/cancellation-page)
- [Update subscription API](https://docs.stripe.com/api/subscriptions/update)

### Industry analysis (MEDIUM confidence — multi-source verified)
- [Stripe Smart Retries recovery rate analysis](https://stripe.com/blog/how-we-built-it-smart-retries) — ~38% standalone
- [SubscriptionFlow on ARB automation gaps](https://www.subscriptionflow.com/2023/03/how-to-automate-recurring-billing-in-authorize-net/)
- [fjorge analysis on ARB pain points](https://fjorge.com/blog/a-few-things-to-overcome-with-authorize-net-arb)

### CULTR project context
- `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/.planning/PROJECT.md` (v2.0 milestone scope)
- `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/lib/config/plans.ts` (tier pricing + Stripe IDs)
- `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/lib/config/coupons.ts` (existing coupon shape)
- `/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website/CLAUDE.md` (Commission Ledger Lifecycle, Cookie patterns, schema overview)
