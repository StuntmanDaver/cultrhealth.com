---
name: corepay-api
description: Use when integrating or calling the Corepay/Authorize.Net payment gateway — Accept.js token flow, ARB subscriptions, CIM customer profiles, webhook HMAC-SHA512 verification, or any code that touches `COREPAY_TRANSACTION_KEY`, `NEXT_PUBLIC_COREPAY_API_LOGIN_ID`, `gatewayFetch`, `ARBCreateSubscriptionRequest`, `createCustomerProfile`, or any `lib/payments/corepay-*.ts` file. NOTE: Corepay (corepay.net) is CULTR's payment ISO and uses Authorize.Net as the underlying gateway. This is NOT Corpay (corpay.com / Fleetcor), a B2B cross-border FX company with zero presence in this codebase.
---

# Corepay / Authorize.Net Payment Gateway

## Vocabulary — do not conflate these three companies

| Name | Domain | Role | In CULTR codebase? |
|---|---|---|---|
| **Corepay** | corepay.net | CULTR's payment ISO / merchant acquirer | Yes — env vars, credentials |
| **Authorize.Net** | authorize.net / apitest.authorize.net | Underlying payment gateway API | Yes — all API URLs |
| **Corpay** | corpay.com / developer.crossborder.corpay.com | Fleetcor B2B cross-border FX / payouts | NO — zero presence |

> The URL **developer.crossborder.corpay.com** is for Corpay (Fleetcor). Do not confuse it with CULTR's gateway. CULTR sends requests to api.authorize.net (production) or apitest.authorize.net (sandbox) using Corepay merchant credentials.

CULTR's relationship with Corepay is purely a merchant/ISO arrangement — Corepay (corepay.net) is the payments ISO that issued the merchant account, and the API surface is **Authorize.Net** at `api.authorize.net`. There is no `corepay.net` API. Whenever this skill says "the gateway," it means Authorize.Net's REST/JSON API. Whenever this skill says "the merchant," it means the Corepay-provided credentials (`apiLoginId`, `transactionKey`, `publicClientKey`).

## Overview

- **Production API URL:** `https://api.authorize.net/xml/v1/request.api`
- **Sandbox API URL:** `https://apitest.authorize.net/xml/v1/request.api`
- **Accept.js production:** `https://js.authorize.net/v1/Accept.js`
- **Accept.js sandbox:** `https://jstest.authorize.net/v1/Accept.js`
- **Auth model:** `merchantAuthentication: { name, transactionKey }` envelope embedded inside **every** request body — NOT a header. The `gatewayFetch()` helper in `lib/payments/corepay-gateway.ts` injects this automatically; never set it yourself or you will double-wrap the envelope.
- **Request format:** JSON envelope keyed by Authorize.Net operation name (e.g. `{ ARBCreateSubscriptionRequest: { subscription } }`). The top-level key MUST match the operation name exactly.
- **Webhooks:** HMAC-SHA512 signature in `X-ANET-Signature: sha512=<hex>` header, computed over the raw request body. (Spec-forward — Phase 7 will land the route.)

### Environment variables

- `NEXT_PUBLIC_COREPAY_API_LOGIN_ID` — public, API login ID (safe to read client-side; used by both server and browser)
- `COREPAY_TRANSACTION_KEY` — server-only, transaction signing key (NEVER expose to client)
- `NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY` — public, Accept.js client tokenization key
- `COREPAY_ENVIRONMENT` — server-only, `sandbox` | `production` (defaults to `sandbox`)
- `NEXT_PUBLIC_ENABLE_COREPAY` — feature flag (`'true'` to enable; FALSE everywhere as of 2026-04-28)

### Current state (2026-04-28)

`NEXT_PUBLIC_ENABLE_COREPAY=false` everywhere. Only `lib/payments/corepay-gateway.ts:createSubscription` (ARB create) is implemented today. The full API surface — CIM customer profiles, Accept.js client-side tokenization, HMAC-SHA512 webhook verification, ARB cancel/get/update, charges/refunds/voids, boot-time credential validation — lands in **Phase 7**. Sections of this skill that document Phase 7 work are bracketed with `<!-- Phase 7 -->` HTML comments so they are visibly distinct from current code.

## Gotchas — read these first

1. **Do NOT install the `authorizenet` npm package.** The SDK has known issues with **HMAC signature envelope formatting** that break webhook signature verification — it wraps the signature string incorrectly, which causes every webhook signature check to fail with no useful error. The repo intentionally uses native `fetch()` via `gatewayFetch()` in `lib/payments/corepay-gateway.ts` for exactly this reason. Phase 7 helpers (`authorize-net-cim.ts`, `authorize-net-arb.ts`, `authorize-net-charges.ts`) MUST extend `gatewayFetch()`. Do not `npm install authorizenet`. (Source: `.planning/research/SUMMARY.md`; D-02.)

2. **`gatewayFetch()` injects `merchantAuthentication` automatically.** Pass the request body keyed by the Authorize.Net operation name (e.g. `{ ARBCreateSubscriptionRequest: { subscription } }`); the helper wraps it with `merchantAuthentication: { name, transactionKey }` before sending. **Never** include `merchantAuthentication` in the input object — you'll double-wrap the envelope and the request will fail with a malformed-payload error.

3. **Accept.js opaque token is single-use and expires in 15 minutes.** When a member tokenizes a card client-side, the resulting `opaqueData` (`{ dataDescriptor, dataValue }`) can be used in EXACTLY ONE charge or CIM `createCustomerProfile` call, then it's burned. If the user lingers on the confirm step past 15 minutes, the next charge attempt returns a token-expired error — handle by re-tokenizing the card, NOT by retrying the charge with the same opaque token.

4. **Webhook signature is HMAC-SHA512 computed over the raw request body via `request.text()`.** Header is `X-ANET-Signature: sha512=<hex>`. Use length-checked `crypto.timingSafeEqual` — buffer lengths must match before passing them to `timingSafeEqual` or it throws `TypeError: Input buffers must have the same length`. Read the body via `request.text()` BEFORE any other body access; Next.js consumes the body on first read and `request.json()` will mutate parsing in ways that break the HMAC source bytes. (Spec-forward — Phase 7 will land `app/api/webhook/corepay/route.ts`.)

5. **ARB subscription updates apply NEXT CYCLE ONLY.** `ARBUpdateSubscriptionRequest` does not retro-charge; it changes the amount or payment profile that bills on the **next scheduled date**. To apply an immediate change (e.g. a discount, a new card billed today, a prorated upgrade), pair the ARB update with a separate one-shot `chargeCustomerProfile` (or `createTransactionRequest`) for the difference. The Q1 sandbox test confirmed that a card update via Path A (in-place CIM payment-profile edit) does NOT cascade to the active ARB; you must call `ARBUpdateSubscriptionRequest` to point the subscription at the new payment profile (Path B is the documented default).

6. **Sandbox credentials in production (or vice versa) silently fail with Authorize.Net Code 13** ("Merchant authentication failed"). Boot-time validation in `instrumentation.ts` (Phase 7, PLB-11) MUST call `authenticateTestRequest` and refuse to start the app on Code 13. Without this gate, the only signal is webhook signature mismatches on every request — extremely hard to diagnose retroactively because the error surfaces far from the root cause (wrong env var values).

7. **Authorize.Net webhook IPs to allowlist: `198.241.206.38` and `198.241.207.38`.** Phase 7 PLB-10 gates the webhook route on these IPs as belt-and-braces with the HMAC signature. Authorize.Net occasionally rotates IPs; a non-allowlist IP that nonetheless presents a valid HMAC signature should be **logged**, not rejected — graceful handling avoids outages on rotation day. The HMAC is the actual trust boundary; the IP allowlist is defense-in-depth.

## Quick reference — operations

Operations marked `<!-- Phase 7 -->` are documented spec-forward; they are not yet implemented in the codebase.

| Operation | Module | Purpose |
|---|---|---|
| `ARBCreateSubscriptionRequest` | `lib/payments/corepay-gateway.ts` (live) | Create recurring subscription |
| `ARBCancelSubscriptionRequest` <!-- Phase 7 PLB-06 --> | `lib/payments/authorize-net-arb.ts` | Cancel ARB subscription |
| `ARBGetSubscriptionRequest` <!-- Phase 7 PLB-06 --> | `lib/payments/authorize-net-arb.ts` | Get subscription status / amount |
| `ARBUpdateSubscriptionRequest` <!-- Phase 7 PLB-06 --> | `lib/payments/authorize-net-arb.ts` | Update next-cycle (NOT retro) |
| `createCustomerProfileRequest` <!-- Phase 7 PLB-05 --> | `lib/payments/authorize-net-cim.ts` | Create CIM customer profile |
| `createCustomerPaymentProfileRequest` <!-- Phase 7 PLB-05 --> | `lib/payments/authorize-net-cim.ts` | Add payment profile to customer |
| `getCustomerProfileRequest` <!-- Phase 7 PLB-05 --> | `lib/payments/authorize-net-cim.ts` | Read CIM profile + payment profiles |
| `updateCustomerPaymentProfileRequest` <!-- Phase 7 PLB-05 --> | `lib/payments/authorize-net-cim.ts` | Edit payment profile (Path A) |
| `deleteCustomerProfileRequest` <!-- Phase 7 PLB-05 --> | `lib/payments/authorize-net-cim.ts` | Delete CIM profile |
| `createTransactionRequest` (auth+capture) <!-- Phase 7 PLB-07 --> | `lib/payments/authorize-net-charges.ts` | One-shot charge of opaque token |
| `createTransactionRequest` (refundTransaction) <!-- Phase 7 PLB-07 --> | `lib/payments/authorize-net-charges.ts` | Refund settled transaction |
| `createTransactionRequest` (voidTransaction) <!-- Phase 7 PLB-07 --> | `lib/payments/authorize-net-charges.ts` | Void unsettled transaction |
| `getTransactionDetailsRequest` <!-- Phase 7 PLB-07 --> | `lib/payments/authorize-net-charges.ts` | Lookup transaction status |
| `authenticateTestRequest` <!-- Phase 7 PLB-11 --> | `instrumentation.ts` | Boot-time credential validation |

## Code patterns

### gatewayFetch envelope (live, `lib/payments/corepay-gateway.ts:50-89`)

```typescript
async function gatewayFetch<T>(
  requestBody: Record<string, unknown>,
  overrides?: GatewayCredentials,
): Promise<T> {
  const url = overrides?.apiUrl || COREPAY_CONFIG.apiUrl;

  const auth = overrides
    ? { name: overrides.apiLoginId, transactionKey: overrides.transactionKey }
    : {
        name: process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID || '',
        transactionKey: process.env.COREPAY_TRANSACTION_KEY || '',
      };

  const requestKey = Object.keys(requestBody)[0];
  const envelope = {
    [requestKey]: {
      ...requestBody[requestKey] as Record<string, unknown>,
      merchantAuthentication: auth,  // injected automatically — never include in input
    },
  };
  // POST envelope to url; throw on resultCode === 'Error'
}
```

### ARB create call (live, `lib/payments/corepay-gateway.ts:95-147`)

```typescript
// gatewayFetch<SubscriptionResponse>(
//   { ARBCreateSubscriptionRequest: { subscription } },
//   params.credentials,  // optional credential override
// )
//
// subscription.paymentSchedule.startDate is YYYY-MM-DD; defaults to today.
// totalOccurrences: '9999' = indefinite recurring (Authorize.Net's "no end date" sentinel).
// subscription.payment.opaqueData = single-use Accept.js token (15-min TTL).
// merchantAuthentication is injected by gatewayFetch — do NOT add it here.
```

### CIM create + ARB link

<!-- Phase 7 work — not yet in codebase -->
```typescript
// Phase 7 PLB-05 + PLB-06 — link CIM payment profiles to ARB subscriptions
// instead of using one-shot opaqueData on the subscription itself.

// Step 1: create CIM customer profile from opaque token
const cim = await gatewayFetch<CreateCustomerProfileResponse>({
  createCustomerProfileRequest: {
    profile: {
      merchantCustomerId: cultrMemberId,
      email: customerEmail,
      paymentProfiles: {
        payment: { opaqueData },  // burns the 15-min token here
      },
    },
    validationMode: 'liveMode',
  },
});

// Step 2: link the resulting payment profile to a new ARB subscription
const arb = await gatewayFetch<SubscriptionResponse>({
  ARBCreateSubscriptionRequest: {
    subscription: {
      name: subscriptionName.substring(0, 50),
      paymentSchedule: { interval: { length: '1', unit: 'months' }, startDate, totalOccurrences: '9999' },
      amount,
      profile: {
        customerProfileId: cim.customerProfileId,
        customerPaymentProfileId: cim.customerPaymentProfileIdList[0],
      },
      // NOTE: use `profile.{ids}` instead of `payment.opaqueData` here.
    },
  },
});
```
<!-- end Phase 7 work -->

### Webhook verification

<!-- Phase 7 work — not yet in codebase -->
```typescript
// app/api/webhook/corepay/route.ts (Phase 7 PLB-09)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();  // MUST be first body read — request.json() consumes the stream
  const signature = request.headers.get('x-anet-signature') || '';
  const ok = verifyCorepayWebhook(rawBody, signature, process.env.COREPAY_WEBHOOK_SECRET!);
  if (!ok) return new Response('invalid signature', { status: 401 });

  // ... idempotency lookup against webhook_events (PLB-01) by (provider, event_id)
  // ... then dispatch to handler by eventType
}

// lib/payments/corepay-webhooks.ts (Phase 7 PLB-08)
// verifyCorepayWebhook(rawBody, headerValue, secret):
//   1. Strip 'sha512=' prefix from headerValue.
//   2. Compute hmac-sha512 of rawBody with secret -> hex.
//   3. Convert both to Buffers; if Buffer lengths differ, return false (do NOT call timingSafeEqual).
//   4. crypto.timingSafeEqual(received, computed) — ONLY when lengths match.
```
<!-- end Phase 7 work -->

## When implementing a new Corepay call

1. **Use `gatewayFetch()` from `lib/payments/corepay-gateway.ts`.** Do not `fetch()` Authorize.Net directly — you'll forget `merchantAuthentication` and waste a sandbox request. Phase 7 helpers (`authorize-net-cim.ts`, `authorize-net-arb.ts`, `authorize-net-charges.ts`) extend the same helper.
2. **Pass the request body keyed by operation name.** Example: `{ createCustomerProfileRequest: { profile, validationMode: 'liveMode' } }`. The top-level key MUST match the Authorize.Net operation name exactly — Authorize.Net rejects payloads with mismatched root keys.
3. **Check `data.messages.resultCode === 'Ok'` before reading payload.** `gatewayFetch()` already throws on `resultCode === 'Error'`, but specific endpoints return useful sub-codes inside `messages.message[0].code` (e.g. `E00040` = duplicate transaction, `E00027` = transaction was unsuccessful). Surface those to the admin UI.
4. **Handle 4xx/5xx differently from `resultCode: 'Error'`.** HTTP errors mean the gateway is **down** or the **credentials are wrong** (Code 13). `resultCode: 'Error'` means the gateway accepted the request but rejected the operation (e.g. declined card). The two require very different responses in admin UI: HTTP errors = page on-call; `resultCode: Error` = show user-facing decline message.
5. **Idempotency for charges via `refTransId` / external order ID.** Authorize.Net does not have a built-in idempotency key like Stripe; use `refTransId` on retries to bind the retry to the original transaction OR enforce a unique `(provider, event_id)` constraint in `webhook_events` (PLB-01) for incoming events.
6. **Log without PHI** (HIPAA discipline — see CLAUDE.md). Card last-4 is OK to log; full PAN, CVV, opaque token, full billing address, or member health data is NOT. Authorize.Net never returns full PAN, but be careful with input echoes — strip `payment.opaqueData.dataValue` from any structured log line before persisting it.
7. **Test against `apitest.authorize.net` first.** Boot-time `authenticateTestRequest` (PLB-11) catches sandbox-creds-in-prod / prod-creds-in-sandbox at startup. Run the smoke route `app/api/admin/corepay-smoke/route.ts` (Phase 7 PLB-13) for a full sandbox round-trip before touching production credentials.

## CULTR integration patterns

### File layout

- `lib/payments/corepay-gateway.ts` — `gatewayFetch()` + `createSubscription()` (ARB create) **(live)**
- <!-- Phase 7 --> `lib/payments/authorize-net-cim.ts` — CIM operations: create/get/update/delete profile, create/update payment profile (PLB-05)
- <!-- Phase 7 --> `lib/payments/authorize-net-arb.ts` — ARB cancel/get/update (PLB-06)
- <!-- Phase 7 --> `lib/payments/authorize-net-charges.ts` — charges/refunds/voids/lookups (PLB-07)
- <!-- Phase 7 --> `lib/payments/corepay-webhooks.ts` — `verifyCorepayWebhook(rawBody, headerValue, secret)` (PLB-08)
- <!-- Phase 7 --> `app/api/webhook/corepay/route.ts` — webhook receiver, raw-body + HMAC + IP allowlist (PLB-09, PLB-10)
- <!-- Phase 7 --> `app/api/admin/corepay-smoke/route.ts` — sandbox smoke test (full round-trip) (PLB-13)
- <!-- Phase 7 --> `instrumentation.ts` — boot-time `authenticateTestRequest` gate (PLB-11)

### Feature flag

`NEXT_PUBLIC_ENABLE_COREPAY=true` enables Corepay in `lib/config/payments.ts`. Currently `false` in all environments (local, staging, production) as of 2026-04-28. Flipping the flag enables Corepay as a payment provider alongside Stripe.

### Database columns

Phase 7 PLB-02 adds the following to `memberships`:

- `provider_payment_profile_id` — Authorize.Net `customerPaymentProfileId` (the card-on-file inside CIM)
- `provider_subscription_id` — Authorize.Net `subscriptionId` (the active ARB subscription)
- `provider_customer_id` — Authorize.Net `customerProfileId` (the CIM profile)

These mirror the Stripe equivalents (`stripe_customer_id`, `stripe_subscription_id`, `stripe_payment_method_id`) and let the membership row be **provider-agnostic** — code reads `memberships.provider` to decide which set of columns to use.

### Feature parity with Stripe

Tracked in `REQUIREMENTS.md` PRT-01 through PRT-14 (Phase 10) and HRD-07/HRD-08 (Phase 13). Every Stripe capability used in the codebase (subscription create/update/cancel, customer portal, refunds, webhook events, idempotency, dunning) must have a Corepay equivalent before production cutover.
