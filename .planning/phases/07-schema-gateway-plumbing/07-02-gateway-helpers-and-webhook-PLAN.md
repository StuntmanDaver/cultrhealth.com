---
phase: 07-schema-gateway-plumbing
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/payments/authorize-net-cim.ts
  - lib/payments/authorize-net-arb.ts
  - lib/payments/authorize-net-charges.ts
  - lib/payments/corepay-webhooks.ts
  - app/api/webhook/corepay/route.ts
autonomous: true
requirements: [PLB-05, PLB-06, PLB-07, PLB-08, PLB-09, PLB-10]
must_haves:
  truths:
    - "Three Authorize.Net helper modules (CIM, ARB, charges) export the documented surface, all routed through the existing gatewayFetch() in lib/payments/corepay-gateway.ts"
    - "lib/payments/corepay-webhooks.ts exports verifyCorepayWebhook(rawBody, headerValue, secret) that does length-checked timingSafeEqual HMAC-SHA512 verification"
    - "app/api/webhook/corepay/route.ts reads body via request.text() FIRST, verifies signature, persists to webhook_events, idempotency-skips repeat (provider, event_id) deliveries"
    - "Webhook IP allowlist (198.241.206.38, 198.241.207.38) is checked but non-allowlist + valid-HMAC requests are LOGGED not rejected (graceful for IP rotation)"
    - "No file imports the `authorizenet` npm package; all gateway calls flow through gatewayFetch()"
  artifacts:
    - path: "lib/payments/authorize-net-cim.ts"
      provides: "createCustomerProfile, addPaymentProfile, getCustomerProfile, updateCustomerPaymentProfile, deleteCustomerProfile"
      exports: ["createCustomerProfile", "addPaymentProfile", "getCustomerProfile", "updateCustomerPaymentProfile", "deleteCustomerProfile"]
    - path: "lib/payments/authorize-net-arb.ts"
      provides: "cancelSubscription, getSubscriptionStatus, updateSubscription (with next-cycle-only docstring)"
      exports: ["cancelSubscription", "getSubscriptionStatus", "updateSubscription"]
    - path: "lib/payments/authorize-net-charges.ts"
      provides: "chargeOpaqueData, chargeCustomerProfile, refundTransaction, voidTransaction, getTransactionDetails"
      exports: ["chargeOpaqueData", "chargeCustomerProfile", "refundTransaction", "voidTransaction", "getTransactionDetails"]
    - path: "lib/payments/corepay-webhooks.ts"
      provides: "verifyCorepayWebhook(rawBody, headerValue, secret) HMAC-SHA512 verifier with length-checked timingSafeEqual"
      exports: ["verifyCorepayWebhook"]
    - path: "app/api/webhook/corepay/route.ts"
      provides: "Webhook receiver — raw body, HMAC verify, idempotent INSERT into webhook_events, IP allowlist (logged not rejected)"
      exports: ["POST"]
  key_links:
    - from: "lib/payments/authorize-net-cim.ts"
      to: "lib/payments/corepay-gateway.ts"
      via: "gatewayFetch() call from each exported function (CIM ops use createCustomerProfileRequest, etc.)"
      pattern: "gatewayFetch.*createCustomerProfileRequest"
    - from: "lib/payments/authorize-net-arb.ts"
      to: "lib/payments/corepay-gateway.ts"
      via: "gatewayFetch() call for ARBCancel/ARBGet/ARBUpdate"
      pattern: "gatewayFetch.*ARB(Cancel|Get|Update)Subscription"
    - from: "lib/payments/authorize-net-charges.ts"
      to: "lib/payments/corepay-gateway.ts"
      via: "gatewayFetch() call for createTransactionRequest variants"
      pattern: "gatewayFetch.*createTransactionRequest"
    - from: "app/api/webhook/corepay/route.ts"
      to: "lib/payments/corepay-webhooks.ts (HMAC) + webhook_events table (Plan 01)"
      via: "verifyCorepayWebhook(rawBody, ...) THEN INSERT INTO webhook_events ON CONFLICT (provider, event_id) DO NOTHING"
      pattern: "request\\.text\\(\\).*verifyCorepayWebhook.*INSERT INTO webhook_events"
---

<objective>
Land the four Authorize.Net helper modules and the webhook receiver. All four helpers MUST route through the existing `gatewayFetch()` in `lib/payments/corepay-gateway.ts` (no new fetch wrappers, no `authorizenet` npm install per locked decision SUMMARY.md §1.1). The webhook route MUST read the body via `request.text()` first (corepay-api SKILL gotcha #4 — Next.js consumes body on first read), verify HMAC-SHA512 with length-checked `timingSafeEqual` (corepay-api gotcha + CLAUDE.md HMAC rule), and use the `webhook_events` UNIQUE constraint from Plan 01 (PLB-01) for idempotency.

Purpose: Wire the API surface so Plan 03 (smoke route) can run an end-to-end Authorize.Net round-trip and downstream phases (8 dispatcher, 10 portal) have ready helpers.

Output: 4 new TypeScript modules + 1 new webhook route, all type-checked and grep-verified.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md
@.claude/skills/corepay-api/SKILL.md
@lib/payments/corepay-gateway.ts
@lib/payments/payment-types.ts
@lib/db.ts

<interfaces>
<!-- Existing surface area new files MUST extend, not duplicate -->

From lib/payments/corepay-gateway.ts (DO NOT modify — extend only):
```typescript
// Already-implemented helper. The internal fetch wrapper.
async function gatewayFetch<T>(
  requestBody: Record<string, unknown>,
  overrides?: GatewayCredentials,
): Promise<T>;

// Already-implemented credentials override type:
export interface GatewayCredentials {
  apiLoginId: string;
  transactionKey: string;
  apiUrl?: string;
}

// Already-implemented response shape Authorize.Net returns:
export interface SubscriptionResponse {
  subscriptionId?: string;
  profile?: { customerProfileId: string; customerPaymentProfileId: string };
  messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
}

// Already-implemented:
export async function createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse>;
```

NOTE: `gatewayFetch` is NOT exported. The new helper modules must EITHER (a) gatewayFetch needs to be exported by adding `export` to its declaration, OR (b) each helper module re-implements the fetch wrapper. Per locked decision SUMMARY.md §4 + corepay-api SKILL "When implementing a new Corepay call" item 1, the helpers MUST use the same gatewayFetch — so step 1 of this plan exports gatewayFetch.

From lib/payments/payment-types.ts:
```typescript
// Existing types — re-use, do not duplicate:
export interface AuthorizeNetOpaqueData {
  dataDescriptor: string;  // e.g., "COMMON.ACCEPT.INAPP.PAYMENT"
  dataValue: string;       // 15-min single-use token
}
export interface AuthorizeNetTransactionResponse { /* … */ }
```

From .claude/skills/corepay-api/SKILL.md "Quick reference — operations":
| Operation | Module | Purpose |
|---|---|---|
| ARBCancelSubscriptionRequest | authorize-net-arb.ts | Cancel ARB subscription |
| ARBGetSubscriptionRequest | authorize-net-arb.ts | Get subscription status / amount |
| ARBUpdateSubscriptionRequest | authorize-net-arb.ts | Update next-cycle (NOT retro) |
| createCustomerProfileRequest | authorize-net-cim.ts | Create CIM customer profile |
| createCustomerPaymentProfileRequest | authorize-net-cim.ts | Add payment profile to customer |
| getCustomerProfileRequest | authorize-net-cim.ts | Read CIM profile + payment profiles |
| updateCustomerPaymentProfileRequest | authorize-net-cim.ts | Edit payment profile (Path A — DOCUMENTED but default to Path B per §4.3) |
| deleteCustomerProfileRequest | authorize-net-cim.ts | Delete CIM profile |
| createTransactionRequest (auth+capture) | authorize-net-charges.ts | One-shot charge of opaque token |
| createTransactionRequest (refundTransaction) | authorize-net-charges.ts | Refund settled transaction |
| createTransactionRequest (voidTransaction) | authorize-net-charges.ts | Void unsettled transaction |
| getTransactionDetailsRequest | authorize-net-charges.ts | Lookup transaction status |

From CLAUDE.md HMAC hard rule:
> Always verify buffer lengths match before passing them to `crypto.timingSafeEqual()` to avoid `TypeError: Input buffers must have the same length` crashes.

From .planning/research/SUMMARY.md §4.3 (locked decision):
> Default to Path B until Path A is proven in sandbox spike (§6 Q1).
> Path B = createCustomerPaymentProfile (new ID) → ARBUpdateSubscriptionRequest to point ARB at new ID.

From corepay-api SKILL "Webhook verification" Phase 7 example:
```typescript
// app/api/webhook/corepay/route.ts (Phase 7 PLB-09)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();  // MUST be first body read
  const signature = request.headers.get('x-anet-signature') || '';
  const ok = verifyCorepayWebhook(rawBody, signature, process.env.COREPAY_WEBHOOK_SECRET!);
  if (!ok) return new Response('invalid signature', { status: 401 });
  // ... idempotency lookup against webhook_events
}
```

Authorize.Net webhook IP allowlist (corepay-api SKILL gotcha #7):
- 198.241.206.38
- 198.241.207.38
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Export gatewayFetch and create lib/payments/authorize-net-cim.ts (PLB-05)</name>
  <files>lib/payments/corepay-gateway.ts, lib/payments/authorize-net-cim.ts, tests/lib/authorize-net-cim.test.ts</files>
  <read_first>
    - lib/payments/corepay-gateway.ts (current state — `async function gatewayFetch<T>(...)` is NOT exported)
    - lib/payments/payment-types.ts (AuthorizeNetOpaqueData type)
    - .claude/skills/corepay-api/SKILL.md "CIM create + ARB link" code block (the exact request envelope shape for createCustomerProfileRequest)
    - .planning/research/SUMMARY.md §4.2 (one CIM customer per email lifetime, many payment profiles)
    - .planning/research/SUMMARY.md §4.3 (Path B default; Path A documented but not the default)
    - .planning/research/SANDBOX-GATE-RUNBOOK.md Q1 (the curl shapes are the JSON envelopes our helpers send)
    - tests/lib/auth.test.ts (pattern for vitest mock + describe/it style used in this project)
  </read_first>
  <behavior>
    - Test 1: createCustomerProfile builds the correct envelope with merchantCustomerId, email, opaqueData; gatewayFetch receives `{ createCustomerProfileRequest: { profile: {...}, validationMode: 'liveMode' } }`
    - Test 2: addPaymentProfile sends `{ createCustomerPaymentProfileRequest: { customerProfileId, paymentProfile: { payment: { opaqueData } }, validationMode } }`
    - Test 3: getCustomerProfile sends `{ getCustomerProfileRequest: { customerProfileId } }` and returns the response payload
    - Test 4: updateCustomerPaymentProfile (Path A — documented private use) sends correct envelope; the JSDoc explicitly notes Path B is the default per SUMMARY.md §4.3
    - Test 5: deleteCustomerProfile sends `{ deleteCustomerProfileRequest: { customerProfileId } }`
    - Test 6 (negative): each function throws when gatewayFetch returns `messages.resultCode === 'Error'` (gatewayFetch already enforces this — test confirms passthrough)
  </behavior>
  <action>
    Step 1 — Modify `lib/payments/corepay-gateway.ts` to export gatewayFetch. Change the line:
    ```typescript
    async function gatewayFetch<T>(...)
    ```
    to:
    ```typescript
    export async function gatewayFetch<T>(...)
    ```
    NO OTHER CHANGES to corepay-gateway.ts. The function body stays identical.

    Step 2 — Create `lib/payments/authorize-net-cim.ts` with the following structure:

    ```typescript
    // lib/payments/authorize-net-cim.ts
    // Phase 7 PLB-05 — Authorize.Net Customer Information Manager (CIM) operations.
    // ALL functions route through gatewayFetch() in corepay-gateway.ts (locked decision SUMMARY.md §1.1).
    // DO NOT install or import the `authorizenet` npm package.

    import { gatewayFetch, type GatewayCredentials } from './corepay-gateway';
    import type { AuthorizeNetOpaqueData } from './payment-types';

    // ---------------------
    // Types — Authorize.Net response shapes
    // ---------------------

    export interface CreateCustomerProfileResponse {
      customerProfileId?: string;
      customerPaymentProfileIdList?: string[];
      customerShippingAddressIdList?: string[];
      validationDirectResponseList?: string[];
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    export interface CreateCustomerPaymentProfileResponse {
      customerPaymentProfileId?: string;
      validationDirectResponse?: string;
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    export interface GetCustomerProfileResponse {
      profile?: {
        customerProfileId: string;
        merchantCustomerId?: string;
        email?: string;
        paymentProfiles?: Array<{
          customerPaymentProfileId: string;
          payment: {
            creditCard?: { cardNumber: string; expirationDate: string; cardType?: string };
          };
        }>;
      };
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    export interface UpdateCustomerPaymentProfileResponse {
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    export interface DeleteCustomerProfileResponse {
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    // ---------------------
    // Function: createCustomerProfile
    // Authorize.Net op: createCustomerProfileRequest
    // ---------------------

    export interface CreateCustomerProfileParams {
      merchantCustomerId: string;          // CULTR member.id (max 20 chars per Authorize.Net)
      email: string;
      opaqueData: AuthorizeNetOpaqueData;  // 15-min single-use Accept.js token
      description?: string;
      credentials?: GatewayCredentials;
    }

    /**
     * Create a CIM customer profile + initial payment profile from an Accept.js opaqueData token.
     *
     * One CIM customer profile per email LIFETIME (per locked decision SUMMARY.md §4.2 — Authorize.Net
     * supports up to 10 payment profiles per customer profile). Burns the 15-min opaqueData token.
     *
     * @example
     *   const cim = await createCustomerProfile({
     *     merchantCustomerId: member.id.substring(0, 20),
     *     email: member.email,
     *     opaqueData: { dataDescriptor, dataValue },
     *   });
     *   // cim.customerProfileId
     *   // cim.customerPaymentProfileIdList[0]
     */
    export async function createCustomerProfile(
      params: CreateCustomerProfileParams,
    ): Promise<CreateCustomerProfileResponse> {
      return gatewayFetch<CreateCustomerProfileResponse>(
        {
          createCustomerProfileRequest: {
            profile: {
              merchantCustomerId: params.merchantCustomerId.substring(0, 20),
              email: params.email,
              description: (params.description || 'CULTR member').substring(0, 255),
              paymentProfiles: {
                payment: { opaqueData: params.opaqueData },
              },
            },
            validationMode: 'liveMode',
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: addPaymentProfile
    // Authorize.Net op: createCustomerPaymentProfileRequest
    // ---------------------

    export interface AddPaymentProfileParams {
      customerProfileId: string;
      opaqueData: AuthorizeNetOpaqueData;
      credentials?: GatewayCredentials;
    }

    /**
     * Add an additional payment profile (saved card) to an existing CIM customer profile.
     * Used during Path B card-update flow (per locked decision SUMMARY.md §4.3): create new payment
     * profile, then call ARBUpdateSubscription to point the active sub at the new ID.
     */
    export async function addPaymentProfile(
      params: AddPaymentProfileParams,
    ): Promise<CreateCustomerPaymentProfileResponse> {
      return gatewayFetch<CreateCustomerPaymentProfileResponse>(
        {
          createCustomerPaymentProfileRequest: {
            customerProfileId: params.customerProfileId,
            paymentProfile: {
              payment: { opaqueData: params.opaqueData },
            },
            validationMode: 'liveMode',
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: getCustomerProfile
    // Authorize.Net op: getCustomerProfileRequest
    // ---------------------

    export interface GetCustomerProfileParams {
      customerProfileId: string;
      credentials?: GatewayCredentials;
    }

    export async function getCustomerProfile(
      params: GetCustomerProfileParams,
    ): Promise<GetCustomerProfileResponse> {
      return gatewayFetch<GetCustomerProfileResponse>(
        {
          getCustomerProfileRequest: {
            customerProfileId: params.customerProfileId,
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: updateCustomerPaymentProfile (Path A — documented but NOT the default)
    // Authorize.Net op: updateCustomerPaymentProfileRequest
    // ---------------------

    export interface UpdateCustomerPaymentProfileParams {
      customerProfileId: string;
      customerPaymentProfileId: string;
      opaqueData: AuthorizeNetOpaqueData;
      credentials?: GatewayCredentials;
    }

    /**
     * Path A: in-place edit of an existing CIM payment profile. PER LOCKED DECISION SUMMARY.md §4.3,
     * THE DEFAULT CARD-UPDATE FLOW IS PATH B (addPaymentProfile + ARBUpdateSubscription). Path A is
     * documented here for the future case where Q1 sandbox testing (.planning/research/SANDBOX-GATE-RUNBOOK.md)
     * confirms cascade behavior to the active ARB. Until then, prefer addPaymentProfile + ARB update.
     *
     * If you find yourself reaching for this function in Phase 10 portal code, STOP and re-read SUMMARY.md §4.3.
     */
    export async function updateCustomerPaymentProfile(
      params: UpdateCustomerPaymentProfileParams,
    ): Promise<UpdateCustomerPaymentProfileResponse> {
      return gatewayFetch<UpdateCustomerPaymentProfileResponse>(
        {
          updateCustomerPaymentProfileRequest: {
            customerProfileId: params.customerProfileId,
            paymentProfile: {
              customerPaymentProfileId: params.customerPaymentProfileId,
              payment: { opaqueData: params.opaqueData },
            },
            validationMode: 'liveMode',
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: deleteCustomerProfile
    // Authorize.Net op: deleteCustomerProfileRequest
    // ---------------------

    export interface DeleteCustomerProfileParams {
      customerProfileId: string;
      credentials?: GatewayCredentials;
    }

    /**
     * Delete a CIM customer profile entirely (and all its payment profiles).
     * Per locked default in SANDBOX-GATE-RUNBOOK.md Q5 (assume cancel-flow drops profile), this is
     * called from the cancel flow. If Q5 sandbox testing later returns "retain indefinitely," update
     * the cancel flow to skip this call but the helper itself is still needed.
     */
    export async function deleteCustomerProfile(
      params: DeleteCustomerProfileParams,
    ): Promise<DeleteCustomerProfileResponse> {
      return gatewayFetch<DeleteCustomerProfileResponse>(
        {
          deleteCustomerProfileRequest: {
            customerProfileId: params.customerProfileId,
          },
        },
        params.credentials,
      );
    }
    ```

    Step 3 — Create `tests/lib/authorize-net-cim.test.ts` (vitest) that mocks gatewayFetch and asserts the envelope shape for each of the five exported functions. The 6 tests cover envelope correctness + the negative-path passthrough behavior described in <behavior>.

    DO NOT install the `authorizenet` npm package. Verify with `grep -q '"authorizenet"' package.json` returning exit 1.
  </action>
  <verify>
    <automated>npx tsc --noEmit lib/payments/authorize-net-cim.ts && grep -q "^export async function gatewayFetch" lib/payments/corepay-gateway.ts && grep -q "export async function createCustomerProfile" lib/payments/authorize-net-cim.ts && grep -q "export async function addPaymentProfile" lib/payments/authorize-net-cim.ts && grep -q "export async function getCustomerProfile" lib/payments/authorize-net-cim.ts && grep -q "export async function updateCustomerPaymentProfile" lib/payments/authorize-net-cim.ts && grep -q "export async function deleteCustomerProfile" lib/payments/authorize-net-cim.ts && grep -q "createCustomerProfileRequest" lib/payments/authorize-net-cim.ts && grep -q "createCustomerPaymentProfileRequest" lib/payments/authorize-net-cim.ts && ! grep -q '"authorizenet"' package.json && npx vitest run tests/lib/authorize-net-cim.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `grep -q "^export async function gatewayFetch" lib/payments/corepay-gateway.ts` exits 0 (gatewayFetch is now exported)
    - `lib/payments/authorize-net-cim.ts` exists
    - `grep -c "export async function" lib/payments/authorize-net-cim.ts` returns 5 (createCustomerProfile, addPaymentProfile, getCustomerProfile, updateCustomerPaymentProfile, deleteCustomerProfile)
    - `grep -q "createCustomerProfileRequest" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -q "createCustomerPaymentProfileRequest" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -q "getCustomerProfileRequest" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -q "updateCustomerPaymentProfileRequest" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -q "deleteCustomerProfileRequest" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -q "import.*gatewayFetch.*from './corepay-gateway'" lib/payments/authorize-net-cim.ts` exits 0
    - `grep -v '^#\|^//\|^ \*' lib/payments/authorize-net-cim.ts | grep -c "import 'authorizenet'\|require('authorizenet')\|from 'authorizenet'"` returns 0 (no authorizenet imports)
    - `! grep -q '"authorizenet"' package.json` (package not installed)
    - `npx tsc --noEmit lib/payments/authorize-net-cim.ts` exits 0 (type-clean)
    - JSDoc on `updateCustomerPaymentProfile` references Path B as the default per SUMMARY.md §4.3 (`grep -q "Path B" lib/payments/authorize-net-cim.ts` exits 0)
    - `npx vitest run tests/lib/authorize-net-cim.test.ts` exits 0 (all 6 tests pass)
  </acceptance_criteria>
  <done>
    gatewayFetch is exported, authorize-net-cim.ts exports the five required functions all routing through gatewayFetch, type-clean, vitest passes, no authorizenet package installed, Path B documented as default in updateCustomerPaymentProfile JSDoc.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create lib/payments/authorize-net-arb.ts (PLB-06) and lib/payments/authorize-net-charges.ts (PLB-07)</name>
  <files>lib/payments/authorize-net-arb.ts, lib/payments/authorize-net-charges.ts, tests/lib/authorize-net-arb.test.ts, tests/lib/authorize-net-charges.test.ts</files>
  <read_first>
    - lib/payments/corepay-gateway.ts (gatewayFetch signature now exported in Task 1)
    - lib/payments/authorize-net-cim.ts (created in Task 1 — pattern to mirror)
    - .claude/skills/corepay-api/SKILL.md gotcha #5 (ARB next-cycle-only updates — explicit docstring requirement on updateSubscription)
    - .claude/skills/corepay-api/SKILL.md "Quick reference — operations" (envelope keys for ARB ops + transaction ops)
    - .planning/research/SANDBOX-GATE-RUNBOOK.md Q1 step 4 (ARBGetSubscriptionRequest envelope), Q1 step 5 (createTransactionRequest with profile envelope)
    - .planning/research/SUMMARY.md §3 lifecycle table (ARB use cases)
  </read_first>
  <behavior>
    ARB tests:
    - Test 1: cancelSubscription sends `{ ARBCancelSubscriptionRequest: { subscriptionId } }`
    - Test 2: getSubscriptionStatus sends `{ ARBGetSubscriptionRequest: { subscriptionId, includeTransactions: true } }` and returns the response
    - Test 3: updateSubscription sends `{ ARBUpdateSubscriptionRequest: { subscriptionId, subscription: {...} } }`
    - Test 4: updateSubscription JSDoc warns that updates apply to next cycle only (verified via grep, not runtime)

    Charges tests:
    - Test 5: chargeOpaqueData sends `{ createTransactionRequest: { transactionRequest: { transactionType: 'authCaptureTransaction', amount, payment: { opaqueData }, ... } } }`
    - Test 6: chargeCustomerProfile sends `{ createTransactionRequest: { transactionRequest: { transactionType: 'authCaptureTransaction', amount, profile: { customerProfileId, paymentProfile: { paymentProfileId } }, ... } } }`
    - Test 7: refundTransaction sends `{ createTransactionRequest: { transactionRequest: { transactionType: 'refundTransaction', amount, refTransId, payment: { creditCard: { cardNumber: lastFour, expirationDate: 'XXXX' } } } } }`
    - Test 8: voidTransaction sends `{ createTransactionRequest: { transactionRequest: { transactionType: 'voidTransaction', refTransId } } }`
    - Test 9: getTransactionDetails sends `{ getTransactionDetailsRequest: { transId } }`
  </behavior>
  <action>
    Step 1 — Create `lib/payments/authorize-net-arb.ts`:

    ```typescript
    // lib/payments/authorize-net-arb.ts
    // Phase 7 PLB-06 — Authorize.Net Automated Recurring Billing (ARB) operations.
    // ALL functions route through gatewayFetch() in corepay-gateway.ts.
    // ARB create lives in corepay-gateway.ts:createSubscription (already implemented).

    import { gatewayFetch, type GatewayCredentials } from './corepay-gateway';

    // ---------------------
    // Types
    // ---------------------

    export interface ArbStandardResponse {
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
      refId?: string;
    }

    export interface GetSubscriptionStatusResponse {
      subscription?: {
        name?: string;
        paymentSchedule?: {
          interval?: { length: string; unit: 'days' | 'months' };
          startDate?: string;
          totalOccurrences?: string;
          trialOccurrences?: string;
        };
        amount?: string;
        trialAmount?: string;
        status?: 'active' | 'expired' | 'suspended' | 'canceled' | 'terminated';
        profile?: {
          customerProfileId?: string;
          customerPaymentProfileId?: string;
        };
        arbTransactions?: Array<{
          response?: string;
          submitTimeUTC?: string;
          payNum?: string;
          attemptNum?: string;
        }>;
      };
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    // ---------------------
    // Function: cancelSubscription
    // Authorize.Net op: ARBCancelSubscriptionRequest
    // ---------------------

    export interface CancelSubscriptionParams {
      subscriptionId: string;
      credentials?: GatewayCredentials;
    }

    export async function cancelSubscription(
      params: CancelSubscriptionParams,
    ): Promise<ArbStandardResponse> {
      return gatewayFetch<ArbStandardResponse>(
        {
          ARBCancelSubscriptionRequest: {
            subscriptionId: params.subscriptionId,
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: getSubscriptionStatus
    // Authorize.Net op: ARBGetSubscriptionRequest
    // ---------------------

    export interface GetSubscriptionStatusParams {
      subscriptionId: string;
      includeTransactions?: boolean;
      credentials?: GatewayCredentials;
    }

    export async function getSubscriptionStatus(
      params: GetSubscriptionStatusParams,
    ): Promise<GetSubscriptionStatusResponse> {
      return gatewayFetch<GetSubscriptionStatusResponse>(
        {
          ARBGetSubscriptionRequest: {
            subscriptionId: params.subscriptionId,
            includeTransactions: params.includeTransactions ?? true,
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: updateSubscription (NEXT-CYCLE-ONLY — read JSDoc)
    // Authorize.Net op: ARBUpdateSubscriptionRequest
    // ---------------------

    export interface UpdateSubscriptionParams {
      subscriptionId: string;
      subscription: {
        amount?: string;
        paymentSchedule?: {
          startDate?: string;
          totalOccurrences?: string;
        };
        profile?: {
          customerProfileId?: string;
          customerPaymentProfileId?: string;
        };
        billTo?: { firstName?: string; lastName?: string };
      };
      credentials?: GatewayCredentials;
    }

    /**
     * Update an active ARB subscription.
     *
     * NEXT-CYCLE-ONLY: ARBUpdateSubscriptionRequest does NOT prorate, does NOT charge a difference,
     * and only takes effect on the NEXT scheduled billing date. (Locked finding SUMMARY.md §1.4 +
     * corepay-api SKILL gotcha #5.)
     *
     * To apply an immediate change (e.g., a discount applied today, a card change billed today, a
     * prorated upgrade), pair this call with a separate one-shot `chargeCustomerProfile` from
     * `authorize-net-charges.ts` for the difference.
     *
     * Card-update flow (Path B per SUMMARY.md §4.3): call `addPaymentProfile` from
     * `authorize-net-cim.ts` to mint a new customerPaymentProfileId, then call THIS function with
     * `subscription.profile.customerPaymentProfileId = <new id>` so the next charge bills the new card.
     */
    export async function updateSubscription(
      params: UpdateSubscriptionParams,
    ): Promise<ArbStandardResponse> {
      return gatewayFetch<ArbStandardResponse>(
        {
          ARBUpdateSubscriptionRequest: {
            subscriptionId: params.subscriptionId,
            subscription: params.subscription,
          },
        },
        params.credentials,
      );
    }
    ```

    Step 2 — Create `lib/payments/authorize-net-charges.ts`:

    ```typescript
    // lib/payments/authorize-net-charges.ts
    // Phase 7 PLB-07 — Authorize.Net one-shot transaction operations.
    // ALL functions route through gatewayFetch() in corepay-gateway.ts.
    // Used for: subscription month-1 prefund (FIRSTMONTH coupon), prorated upgrade diffs,
    //          one-shot product orders, refunds, voids, status lookups.

    import { gatewayFetch, type GatewayCredentials } from './corepay-gateway';
    import type { AuthorizeNetOpaqueData } from './payment-types';

    // ---------------------
    // Types
    // ---------------------

    export interface TransactionResponse {
      transactionResponse?: {
        responseCode?: '1' | '2' | '3' | '4'; // 1=approved, 2=declined, 3=error, 4=held
        authCode?: string;
        avsResultCode?: string;
        cvvResultCode?: string;
        cavvResultCode?: string;
        transId?: string;
        refTransID?: string;
        accountNumber?: string;       // last-4 only
        accountType?: string;
        messages?: Array<{ code: string; description: string }>;
        errors?: Array<{ errorCode: string; errorText: string }>;
      };
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
      refId?: string;
    }

    export interface GetTransactionDetailsResponse {
      transaction?: {
        transId?: string;
        submitTimeUTC?: string;
        transactionType?: string;
        transactionStatus?: 'authorizedPendingCapture' | 'capturedPendingSettlement' | 'communicationError' | 'refundSettledSuccessfully' | 'refundPendingSettlement' | 'approvedReview' | 'declined' | 'couldNotVoid' | 'expired' | 'failedReview' | 'generalError' | 'pendingFinalSettlement' | 'pendingSettlement' | 'returnedItem' | 'settledSuccessfully' | 'settlementError' | 'underReview' | 'updatingSettlement' | 'voided';
        responseCode?: number;
        authCode?: string;
        authAmount?: string;
        settleAmount?: string;
      };
      messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
    }

    // ---------------------
    // Function: chargeOpaqueData (one-shot charge of Accept.js token)
    // Authorize.Net op: createTransactionRequest (transactionType: authCaptureTransaction)
    // ---------------------

    export interface ChargeOpaqueDataParams {
      amountCents: number;
      opaqueData: AuthorizeNetOpaqueData;     // 15-min single-use token (corepay-api SKILL gotcha #3)
      orderId?: string;
      description?: string;
      customerEmail?: string;
      billing?: { firstName?: string; lastName?: string; address?: string; city?: string; state?: string; zip?: string };
      credentials?: GatewayCredentials;
    }

    /**
     * One-shot charge of an Accept.js opaqueData token. Used for FIRSTMONTH month-1 charge before
     * the ARB sub starts (CPN-05) and for one-shot product orders (PRT-08).
     *
     * The opaqueData is single-use and 15-min TTL — if checkout flow re-tokenizes due to user lingering,
     * call this with the FRESH token, not a retry of the burned one (corepay-api SKILL gotcha #3).
     */
    export async function chargeOpaqueData(
      params: ChargeOpaqueDataParams,
    ): Promise<TransactionResponse> {
      const amount = (params.amountCents / 100).toFixed(2);
      const transactionRequest: Record<string, unknown> = {
        transactionType: 'authCaptureTransaction',
        amount,
        payment: { opaqueData: params.opaqueData },
      };
      if (params.orderId || params.description) {
        transactionRequest.order = {
          invoiceNumber: params.orderId?.substring(0, 20) || '',
          description: (params.description || 'CULTR Health').substring(0, 255),
        };
      }
      if (params.customerEmail) {
        transactionRequest.customer = { email: params.customerEmail };
      }
      if (params.billing) {
        transactionRequest.billTo = {
          firstName: params.billing.firstName?.substring(0, 50),
          lastName: params.billing.lastName?.substring(0, 50),
          address: params.billing.address?.substring(0, 60),
          city: params.billing.city?.substring(0, 40),
          state: params.billing.state?.substring(0, 40),
          zip: params.billing.zip?.substring(0, 20),
        };
      }
      return gatewayFetch<TransactionResponse>(
        { createTransactionRequest: { transactionRequest } },
        params.credentials,
      );
    }

    // ---------------------
    // Function: chargeCustomerProfile (charge an existing CIM payment profile)
    // Authorize.Net op: createTransactionRequest (transactionType: authCaptureTransaction)
    // ---------------------

    export interface ChargeCustomerProfileParams {
      amountCents: number;
      customerProfileId: string;
      customerPaymentProfileId: string;
      orderId?: string;
      description?: string;
      credentials?: GatewayCredentials;
    }

    /**
     * Charge an existing CIM payment profile (saved card, no Accept.js token needed).
     * Used for: dunning retry (RDN-06), prorated upgrade diffs, repeat product orders.
     */
    export async function chargeCustomerProfile(
      params: ChargeCustomerProfileParams,
    ): Promise<TransactionResponse> {
      const amount = (params.amountCents / 100).toFixed(2);
      const transactionRequest: Record<string, unknown> = {
        transactionType: 'authCaptureTransaction',
        amount,
        profile: {
          customerProfileId: params.customerProfileId,
          paymentProfile: { paymentProfileId: params.customerPaymentProfileId },
        },
      };
      if (params.orderId || params.description) {
        transactionRequest.order = {
          invoiceNumber: params.orderId?.substring(0, 20) || '',
          description: (params.description || 'CULTR Health').substring(0, 255),
        };
      }
      return gatewayFetch<TransactionResponse>(
        { createTransactionRequest: { transactionRequest } },
        params.credentials,
      );
    }

    // ---------------------
    // Function: refundTransaction (refund a settled transaction)
    // Authorize.Net op: createTransactionRequest (transactionType: refundTransaction)
    // ---------------------

    export interface RefundTransactionParams {
      refTransId: string;       // original transId being refunded
      amountCents: number;
      cardLastFour: string;     // required by Authorize.Net for settled refunds (4-digit string)
      cardExpirationDate?: string; // 'XXXX' is acceptable for Authorize.Net refund identification
      credentials?: GatewayCredentials;
    }

    /**
     * Refund a SETTLED transaction. For pre-settlement use voidTransaction instead — Authorize.Net
     * rejects refundTransaction on unsettled transactions with code E00027.
     */
    export async function refundTransaction(
      params: RefundTransactionParams,
    ): Promise<TransactionResponse> {
      const amount = (params.amountCents / 100).toFixed(2);
      return gatewayFetch<TransactionResponse>(
        {
          createTransactionRequest: {
            transactionRequest: {
              transactionType: 'refundTransaction',
              amount,
              payment: {
                creditCard: {
                  cardNumber: params.cardLastFour,
                  expirationDate: params.cardExpirationDate || 'XXXX',
                },
              },
              refTransId: params.refTransId,
            },
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: voidTransaction (void an UNSETTLED transaction)
    // Authorize.Net op: createTransactionRequest (transactionType: voidTransaction)
    // ---------------------

    export interface VoidTransactionParams {
      refTransId: string;       // original transId being voided
      credentials?: GatewayCredentials;
    }

    /**
     * Void an UNSETTLED transaction. For settled use refundTransaction. The unified
     * `/api/refunds/create` endpoint (Phase 13 HRD-01) auto-chooses based on settlement status.
     */
    export async function voidTransaction(
      params: VoidTransactionParams,
    ): Promise<TransactionResponse> {
      return gatewayFetch<TransactionResponse>(
        {
          createTransactionRequest: {
            transactionRequest: {
              transactionType: 'voidTransaction',
              refTransId: params.refTransId,
            },
          },
        },
        params.credentials,
      );
    }

    // ---------------------
    // Function: getTransactionDetails
    // Authorize.Net op: getTransactionDetailsRequest
    // ---------------------

    export interface GetTransactionDetailsParams {
      transId: string;
      credentials?: GatewayCredentials;
    }

    export async function getTransactionDetails(
      params: GetTransactionDetailsParams,
    ): Promise<GetTransactionDetailsResponse> {
      return gatewayFetch<GetTransactionDetailsResponse>(
        {
          getTransactionDetailsRequest: {
            transId: params.transId,
          },
        },
        params.credentials,
      );
    }
    ```

    Step 3 — Create `tests/lib/authorize-net-arb.test.ts` and `tests/lib/authorize-net-charges.test.ts` covering the 9 behaviors listed in <behavior> using vitest mocks of `gatewayFetch`.

    DO NOT install authorizenet. Do NOT modify corepay-gateway.ts after Task 1. Do NOT bypass gatewayFetch.
  </action>
  <verify>
    <automated>npx tsc --noEmit lib/payments/authorize-net-arb.ts lib/payments/authorize-net-charges.ts && grep -q "export async function cancelSubscription" lib/payments/authorize-net-arb.ts && grep -q "export async function getSubscriptionStatus" lib/payments/authorize-net-arb.ts && grep -q "export async function updateSubscription" lib/payments/authorize-net-arb.ts && grep -q "NEXT-CYCLE-ONLY" lib/payments/authorize-net-arb.ts && grep -q "export async function chargeOpaqueData" lib/payments/authorize-net-charges.ts && grep -q "export async function chargeCustomerProfile" lib/payments/authorize-net-charges.ts && grep -q "export async function refundTransaction" lib/payments/authorize-net-charges.ts && grep -q "export async function voidTransaction" lib/payments/authorize-net-charges.ts && grep -q "export async function getTransactionDetails" lib/payments/authorize-net-charges.ts && ! grep -q '"authorizenet"' package.json && npx vitest run tests/lib/authorize-net-arb.test.ts tests/lib/authorize-net-charges.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `lib/payments/authorize-net-arb.ts` exists with exactly 3 exported functions: cancelSubscription, getSubscriptionStatus, updateSubscription (`grep -c "^export async function" lib/payments/authorize-net-arb.ts` returns 3)
    - `lib/payments/authorize-net-charges.ts` exists with exactly 5 exported functions: chargeOpaqueData, chargeCustomerProfile, refundTransaction, voidTransaction, getTransactionDetails (`grep -c "^export async function" lib/payments/authorize-net-charges.ts` returns 5)
    - `grep -q "ARBCancelSubscriptionRequest" lib/payments/authorize-net-arb.ts` exits 0
    - `grep -q "ARBGetSubscriptionRequest" lib/payments/authorize-net-arb.ts` exits 0
    - `grep -q "ARBUpdateSubscriptionRequest" lib/payments/authorize-net-arb.ts` exits 0
    - `grep -q "NEXT-CYCLE-ONLY" lib/payments/authorize-net-arb.ts` exits 0 (the docstring requirement from PLB-06)
    - `grep -q "createTransactionRequest" lib/payments/authorize-net-charges.ts` exits 0
    - `grep -q "authCaptureTransaction" lib/payments/authorize-net-charges.ts` exits 0
    - `grep -q "refundTransaction" lib/payments/authorize-net-charges.ts` exits 0
    - `grep -q "voidTransaction" lib/payments/authorize-net-charges.ts` exits 0
    - `grep -q "getTransactionDetailsRequest" lib/payments/authorize-net-charges.ts` exits 0
    - Both files import `gatewayFetch` from `'./corepay-gateway'` (`grep -l "import.*gatewayFetch.*from './corepay-gateway'" lib/payments/authorize-net-arb.ts lib/payments/authorize-net-charges.ts | wc -l` returns 2)
    - `! grep -q '"authorizenet"' package.json` (package not installed)
    - `npx tsc --noEmit lib/payments/authorize-net-arb.ts lib/payments/authorize-net-charges.ts` exits 0
    - `npx vitest run tests/lib/authorize-net-arb.test.ts tests/lib/authorize-net-charges.test.ts` exits 0 (all 9 tests pass)
  </acceptance_criteria>
  <done>
    Both files exist with the documented exports, all routing through gatewayFetch, NEXT-CYCLE-ONLY warning present in updateSubscription JSDoc, type-clean, vitest passes, no authorizenet package installed.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create lib/payments/corepay-webhooks.ts (PLB-08) with HMAC-SHA512 + length-checked timingSafeEqual</name>
  <files>lib/payments/corepay-webhooks.ts, tests/lib/corepay-webhooks.test.ts</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-08 verbatim)
    - .claude/skills/corepay-api/SKILL.md gotcha #4 (HMAC-SHA512 over raw body, X-ANET-Signature header, length-checked timingSafeEqual)
    - CLAUDE.md "HMAC timingSafeEqual" hard rule (verify buffer lengths match before crypto.timingSafeEqual)
    - .claude/skills/corepay-api/SKILL.md "Webhook verification" example (the pseudocode for verifyCorepayWebhook)
    - tests/lib/auth.test.ts (vitest pattern in this project)
  </read_first>
  <behavior>
    - Test 1: Returns true when signature matches HMAC-SHA512 of rawBody with secret
    - Test 2: Returns false when signature is the same length but bytes differ (NO crash from timingSafeEqual)
    - Test 3: Returns false when signature is a DIFFERENT length than computed HMAC — MUST short-circuit before timingSafeEqual to avoid `TypeError: Input buffers must have the same length`
    - Test 4: Strips `sha512=` prefix correctly (header value is `sha512=<hex>`)
    - Test 5: Returns false on missing/empty header
    - Test 6: Returns false on missing/empty secret
    - Test 7: Returns false when rawBody is mutated (any byte difference produces false)
    - Test 8: Hex case-insensitive — `sha512=ABC123` and `sha512=abc123` both verify identically (Node's `crypto.timingSafeEqual` requires exact byte match — verify lower-cases the input first OR confirms Authorize.Net always emits lower-case hex; this test asserts the canonical lowercase normalization)
  </behavior>
  <action>
    Create `lib/payments/corepay-webhooks.ts`:

    ```typescript
    // lib/payments/corepay-webhooks.ts
    // Phase 7 PLB-08 — Authorize.Net webhook signature verification.
    // HARD RULE (CLAUDE.md): verify buffer lengths match before crypto.timingSafeEqual().
    // SKILL gotcha #4: HMAC-SHA512 computed over raw request body via request.text().

    import { createHmac, timingSafeEqual } from 'node:crypto';

    const SIGNATURE_PREFIX = 'sha512=';

    /**
     * Verify an Authorize.Net webhook signature.
     *
     * Header format: `X-ANET-Signature: sha512=<hex>` where <hex> is the lowercase hex digest of
     * HMAC-SHA512 over the RAW request body bytes, keyed with the merchant's webhook signature key.
     *
     * @param rawBody    Exact bytes of the request body. MUST be obtained via `request.text()`
     *                   BEFORE any other body-reading method (Next.js consumes the body on first read).
     * @param headerValue Raw `x-anet-signature` header value, e.g. "sha512=abc123…". May or may not
     *                   include the `sha512=` prefix; this function strips it.
     * @param secret      Authorize.Net webhook signature key (a.k.a. signature key, configured per-webhook
     *                   in the merchant interface). NEVER hardcode; pass from process.env.COREPAY_WEBHOOK_SECRET.
     * @returns true if signature matches; false on any failure (mismatch, length-mismatch, missing inputs).
     *
     * SECURITY:
     *  - Length-checked timingSafeEqual (CLAUDE.md hard rule): if computed HMAC bytes and received
     *    signature bytes differ in length, return false WITHOUT calling timingSafeEqual (which throws
     *    `TypeError: Input buffers must have the same length`).
     *  - No early-return on byte difference: timingSafeEqual is constant-time once lengths match.
     *  - Lowercase normalization: Authorize.Net emits lowercase hex; we lowercase the received value
     *    so a hand-debugger entering uppercase doesn't get a spurious false. The HMAC bytes themselves
     *    are byte-compared (not text-compared), so this only normalizes the inputs to the same hex case.
     */
    export function verifyCorepayWebhook(
      rawBody: string,
      headerValue: string | null | undefined,
      secret: string | null | undefined,
    ): boolean {
      if (!rawBody || !headerValue || !secret) {
        return false;
      }

      // Strip the "sha512=" prefix if present, then lowercase.
      const received = headerValue
        .toLowerCase()
        .replace(new RegExp(`^${SIGNATURE_PREFIX}`), '')
        .trim();

      if (!received || !/^[0-9a-f]+$/.test(received)) {
        return false; // not valid hex
      }

      // Compute the expected HMAC-SHA512 hex digest.
      const computed = createHmac('sha512', secret).update(rawBody).digest('hex');

      // Convert both to Buffers for constant-time comparison.
      const receivedBuf = Buffer.from(received, 'hex');
      const computedBuf = Buffer.from(computed, 'hex');

      // CLAUDE.md HARD RULE: length-check BEFORE timingSafeEqual (otherwise it throws).
      if (receivedBuf.length !== computedBuf.length) {
        return false;
      }

      // Constant-time byte comparison.
      try {
        return timingSafeEqual(receivedBuf, computedBuf);
      } catch {
        return false;
      }
    }
    ```

    Step 2 — Create `tests/lib/corepay-webhooks.test.ts` with the 8 tests from <behavior> using vitest. Each test computes a known-good HMAC-SHA512 hex digest using `node:crypto` and asserts the helper's behavior under matching/mismatching/length-different/missing inputs.

    Example test for length-mismatch (the critical CLAUDE.md guard):
    ```typescript
    it('returns false when signature is a different length than computed HMAC (no timingSafeEqual crash)', () => {
      const result = verifyCorepayWebhook('body', 'sha512=abcdef', 'secret');
      // 'abcdef' is only 6 hex chars (3 bytes); HMAC-SHA512 is 128 hex chars (64 bytes)
      // Helper MUST return false WITHOUT throwing TypeError
      expect(result).toBe(false);
    });
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit lib/payments/corepay-webhooks.ts && grep -q "export function verifyCorepayWebhook" lib/payments/corepay-webhooks.ts && grep -q "createHmac.*sha512" lib/payments/corepay-webhooks.ts && grep -q "timingSafeEqual" lib/payments/corepay-webhooks.ts && grep -q "receivedBuf.length !== computedBuf.length" lib/payments/corepay-webhooks.ts && grep -q "import.*from 'node:crypto'" lib/payments/corepay-webhooks.ts && npx vitest run tests/lib/corepay-webhooks.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `lib/payments/corepay-webhooks.ts` exists
    - `grep -q "^export function verifyCorepayWebhook" lib/payments/corepay-webhooks.ts` exits 0
    - Function signature is `verifyCorepayWebhook(rawBody: string, headerValue: string | null | undefined, secret: string | null | undefined): boolean` (verified by `grep -q "rawBody: string" lib/payments/corepay-webhooks.ts`)
    - `grep -q "createHmac.*sha512" lib/payments/corepay-webhooks.ts` exits 0 (HMAC-SHA512 algorithm)
    - `grep -q "timingSafeEqual" lib/payments/corepay-webhooks.ts` exits 0
    - `grep -q "receivedBuf.length !== computedBuf.length" lib/payments/corepay-webhooks.ts` exits 0 (CLAUDE.md hard rule — length check BEFORE timingSafeEqual)
    - `grep -q "import.*timingSafeEqual.*from 'node:crypto'\|import.*from 'node:crypto'" lib/payments/corepay-webhooks.ts` exits 0 (uses node:crypto, NOT crypto-js or jsrsasign — locked decision §2)
    - `grep -q "sha512=" lib/payments/corepay-webhooks.ts` exits 0 (strips the prefix)
    - `npx tsc --noEmit lib/payments/corepay-webhooks.ts` exits 0
    - `npx vitest run tests/lib/corepay-webhooks.test.ts` exits 0 (all 8 tests pass — including length-mismatch and bad-hex)
    - The length-mismatch test specifically verifies that `verifyCorepayWebhook('body', 'sha512=abcdef', 'secret')` returns false WITHOUT throwing
  </acceptance_criteria>
  <done>
    verifyCorepayWebhook exported, uses node:crypto HMAC-SHA512, length-checks BEFORE timingSafeEqual (CLAUDE.md hard rule), all 8 vitest cases pass including the length-mismatch test that proves no TypeError is thrown.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Create app/api/webhook/corepay/route.ts (PLB-09 + PLB-10) — webhook receiver with raw body, HMAC verify, idempotent INSERT, IP allowlist (logged not rejected)</name>
  <files>app/api/webhook/corepay/route.ts, tests/api/corepay-webhook.test.ts</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-09 + PLB-10 verbatim)
    - .claude/skills/corepay-api/SKILL.md "Webhook verification" Phase 7 example (the route shape)
    - .claude/skills/corepay-api/SKILL.md gotcha #4 (request.text() FIRST — Next.js consumes body on first read)
    - .claude/skills/corepay-api/SKILL.md gotcha #7 (IP allowlist 198.241.206.38 / 198.241.207.38 — logged not rejected)
    - .planning/research/SUMMARY.md §1 item 5 (both webhook handlers run in parallel during migration — DO NOT remove app/api/webhook/stripe/route.ts)
    - .planning/research/SUMMARY.md §4.7 (lib/webhooks/dispatcher.ts is Phase 8 — Plan 02 emits a STUB import comment, no actual call)
    - lib/payments/corepay-webhooks.ts (created in Task 3 — verifyCorepayWebhook signature)
    - lib/db.ts (sql template literal pattern via @vercel/postgres)
    - app/api/webhook/stripe/route.ts (existing route — DO NOT MODIFY; just look at it for shape conventions)
    - migrations/063_webhook_events.sql (Plan 01 — column names: provider, event_id, event_type, raw_payload, processed_at, received_at)
  </read_first>
  <behavior>
    - Test 1: Returns 401 when X-ANET-Signature header is missing
    - Test 2: Returns 401 when signature is invalid (verifyCorepayWebhook returns false)
    - Test 3: Returns 200 when signature is valid AND event is new (INSERT into webhook_events succeeds)
    - Test 4: Returns 200 (idempotent skip) when signature is valid AND event_id already exists in webhook_events (ON CONFLICT DO NOTHING)
    - Test 5: When source IP is NOT in the allowlist but signature is valid → INSERT succeeds AND a console.warn line is emitted with the offending IP (logged, not rejected — corepay-api SKILL gotcha #7)
    - Test 6: Body is read via `request.text()` BEFORE any other body access (test asserts that calling `request.json()` after the handler completes still works — i.e., the handler did not consume the body via .json() first)
    - Test 7: Handler does NOT actually call into lib/webhooks/dispatcher.ts (Phase 8). Instead emits the TODO comment marker (`// TODO Phase 8`) — assert via grep on the route file source.
  </behavior>
  <action>
    Create `app/api/webhook/corepay/route.ts`:

    ```typescript
    // app/api/webhook/corepay/route.ts
    // Phase 7 PLB-09 + PLB-10 — Authorize.Net webhook receiver.
    // - Reads body via request.text() FIRST (corepay-api SKILL gotcha #4 — Next.js consumes body on first read).
    // - HMAC-SHA512 signature verification via verifyCorepayWebhook.
    // - Idempotent INSERT into webhook_events (Plan 01 PLB-01) using UNIQUE (provider, event_id).
    // - IP allowlist (198.241.206.38, 198.241.207.38): non-allowlist IPs with VALID signatures are LOGGED,
    //   NOT rejected (corepay-api SKILL gotcha #7 — graceful for Authorize.Net IP rotation).
    // - Side effects (Healthie / SiPhox / Mailchimp / Resend / commission) land in Phase 8 dispatcher.
    //   This route ONLY persists; dispatcher integration is gated by `// TODO Phase 8`.
    //
    // The Stripe webhook route (app/api/webhook/stripe/route.ts) stays alive in parallel — locked
    // decision SUMMARY.md §1.5. Do NOT modify it from this plan.

    import { type NextRequest, NextResponse } from 'next/server';
    import { sql } from '@vercel/postgres';
    import { verifyCorepayWebhook } from '@/lib/payments/corepay-webhooks';

    // TODO Phase 8: import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';
    // (LFC-01) — replace the persist-only behavior below with dispatcher.dispatchWebhookEvent(event)
    // once Phase 8 lands. Until then, side effects are deferred. Reconciliation cron (Phase 9 CPN-11)
    // catches drift in the meantime.

    const PROVIDER = 'authorize_net';
    const ALLOWED_IPS = ['198.241.206.38', '198.241.207.38'];

    export const dynamic = 'force-dynamic';
    export const runtime = 'nodejs';

    /**
     * Extract the originating IP from the request.
     * Trusts Vercel-provided x-real-ip / x-forwarded-for; if both absent (e.g. local dev), returns null.
     */
    function getRequestIp(request: NextRequest): string | null {
      const realIp = request.headers.get('x-real-ip');
      if (realIp) return realIp.trim();
      const forwardedFor = request.headers.get('x-forwarded-for');
      if (forwardedFor) {
        // x-forwarded-for can be a comma-separated list — leftmost is origin client.
        return forwardedFor.split(',')[0]?.trim() || null;
      }
      return null;
    }

    interface AuthorizeNetWebhookPayload {
      notificationId?: string;     // Authorize.Net's webhookId — used as event_id
      eventType?: string;          // e.g. "net.authorize.payment.authcapture.created"
      eventDate?: string;
      webhookId?: string;
      payload?: Record<string, unknown>;
    }

    export async function POST(request: NextRequest): Promise<NextResponse> {
      // CRITICAL: read raw body FIRST (corepay-api SKILL gotcha #4).
      const rawBody = await request.text();

      const headerValue = request.headers.get('x-anet-signature');
      const secret = process.env.COREPAY_WEBHOOK_SECRET;

      // 1. Signature verification (HMAC-SHA512, length-checked timingSafeEqual)
      const signatureValid = verifyCorepayWebhook(rawBody, headerValue, secret);
      if (!signatureValid) {
        return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
      }

      // 2. IP allowlist check (logged, NOT rejected — corepay-api gotcha #7)
      const sourceIp = getRequestIp(request);
      if (sourceIp && !ALLOWED_IPS.includes(sourceIp)) {
        // Non-allowlist IP with valid signature = either Authorize.Net rotated IPs, or a relayed call.
        // The HMAC is the trust boundary; we LOG and continue.
        console.warn(
          `[corepay-webhook] non-allowlist IP with valid signature: ${sourceIp}. Allowed: ${ALLOWED_IPS.join(', ')}. Continuing per gotcha #7.`,
        );
      }

      // 3. Parse JSON (we already verified the bytes — JSON.parse on rawBody is safe at this point).
      let event: AuthorizeNetWebhookPayload;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
      }

      const eventId = event.notificationId || event.webhookId;
      const eventType = event.eventType;
      if (!eventId || !eventType) {
        return NextResponse.json({ error: 'missing notificationId/eventType' }, { status: 400 });
      }

      // 4. Idempotent INSERT — UNIQUE (provider, event_id) constraint from migration 063.
      // ON CONFLICT DO NOTHING means a duplicate delivery returns 200 with no side effects.
      // (Phase 8 dispatcher will gate side-effect calls on `INSERT ... RETURNING id` to detect first-time delivery.)
      const insertResult = await sql`
        INSERT INTO webhook_events (provider, event_id, event_type, raw_payload, processed_at)
        VALUES (${PROVIDER}, ${eventId}, ${eventType}, ${rawBody}::jsonb, NOW())
        ON CONFLICT (provider, event_id) DO NOTHING
        RETURNING id
      `;

      const isFirstDelivery = insertResult.rowCount === 1;

      // TODO Phase 8 (LFC-01): if (isFirstDelivery) { await dispatchWebhookEvent(event); }
      // For now, persist-only.

      return NextResponse.json({
        received: true,
        idempotent: !isFirstDelivery,
      }, { status: 200 });
    }
    ```

    Step 2 — Create `tests/api/corepay-webhook.test.ts` covering the 7 behaviors. Mock `@vercel/postgres` `sql` template-literal call; assert SQL parameters and rowCount handling. The test for "raw body read first" can be done by checking that the handler awaits `request.text()` as the first body-reading call (use a spy on the NextRequest mock).

    Step 3 — DO NOT modify `app/api/webhook/stripe/route.ts`. Both handlers run in parallel during migration window (locked decision SUMMARY.md §1.5).
  </action>
  <verify>
    <automated>npx tsc --noEmit app/api/webhook/corepay/route.ts && grep -q "export async function POST" app/api/webhook/corepay/route.ts && grep -q "request.text()" app/api/webhook/corepay/route.ts && grep -q "verifyCorepayWebhook" app/api/webhook/corepay/route.ts && grep -q "X-ANET-Signature\|x-anet-signature" app/api/webhook/corepay/route.ts && grep -q "INSERT INTO webhook_events" app/api/webhook/corepay/route.ts && grep -q "ON CONFLICT (provider, event_id) DO NOTHING" app/api/webhook/corepay/route.ts && grep -q "198.241.206.38" app/api/webhook/corepay/route.ts && grep -q "198.241.207.38" app/api/webhook/corepay/route.ts && grep -q "TODO Phase 8" app/api/webhook/corepay/route.ts && test -f app/api/webhook/stripe/route.ts && npx vitest run tests/api/corepay-webhook.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - `app/api/webhook/corepay/route.ts` exists and exports `POST`
    - `grep -q "export async function POST" app/api/webhook/corepay/route.ts` exits 0
    - `grep -q "await request.text()" app/api/webhook/corepay/route.ts` exits 0 (raw body read FIRST)
    - The first body-reading call in the handler is `await request.text()` — verified by the order of statements (acceptance via the vitest test for behavior #6)
    - `grep -q "verifyCorepayWebhook" app/api/webhook/corepay/route.ts` exits 0 (uses Plan 02 Task 3 helper)
    - `grep -qi "x-anet-signature" app/api/webhook/corepay/route.ts` exits 0
    - `grep -q "INSERT INTO webhook_events" app/api/webhook/corepay/route.ts` exits 0
    - `grep -q "ON CONFLICT (provider, event_id) DO NOTHING" app/api/webhook/corepay/route.ts` exits 0
    - `grep -q "RETURNING id" app/api/webhook/corepay/route.ts` exits 0 (so dispatcher can detect first-delivery in Phase 8)
    - `grep -q "198.241.206.38" app/api/webhook/corepay/route.ts && grep -q "198.241.207.38" app/api/webhook/corepay/route.ts` exits 0 (PLB-10 IPs hardcoded)
    - `grep -q "console.warn" app/api/webhook/corepay/route.ts` exits 0 (non-allowlist IPs logged, not rejected — PLB-10 + gotcha #7)
    - The route does NOT call `return NextResponse.*status: 403` for IP mismatches (verified by absence of `403` near IP-related code)
    - `grep -q "TODO Phase 8" app/api/webhook/corepay/route.ts` exits 0 (dispatcher stub marker per locked decision SUMMARY.md §4.7)
    - `test -f app/api/webhook/stripe/route.ts` exits 0 (Stripe route NOT deleted — locked decision §1.5; both run in parallel)
    - `npx tsc --noEmit app/api/webhook/corepay/route.ts` exits 0
    - `npx vitest run tests/api/corepay-webhook.test.ts` exits 0 (all 7 tests pass)
  </acceptance_criteria>
  <done>
    Webhook route deployed at app/api/webhook/corepay/route.ts, reads body via request.text() first, verifies HMAC-SHA512, persists idempotently via ON CONFLICT DO NOTHING, IP allowlist non-rejecting (logged only), TODO Phase 8 dispatcher comment present, Stripe route untouched, all 7 vitest cases pass.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| internet → app/api/webhook/corepay/route.ts | Untrusted POST from Authorize.Net's webhook IPs (or attackers spoofing) |
| route handler → verifyCorepayWebhook | Length-checked HMAC-SHA512 is the actual trust boundary (IP allowlist is defense-in-depth only) |
| route handler → @vercel/postgres `sql` template literal | Parameterized query into webhook_events; no SQL injection vector |
| lib/payments/* helpers → gatewayFetch → api.authorize.net | Outbound HTTPS only; merchant credentials in process.env (server-only) |
| Phase 7 webhook receiver → Phase 8 dispatcher | Stub only in this plan (TODO comment) — no live integration boundary yet |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-08 | Spoofing | Forged webhook with no/invalid signature | mitigate | `verifyCorepayWebhook` HMAC-SHA512 check returns 401 on missing/invalid signature. Signature is the actual trust boundary (per gotcha #7). |
| T-07-09 | Tampering | Replay attack — same valid webhook delivered multiple times | mitigate | UNIQUE (provider, event_id) on webhook_events causes duplicate INSERTs to no-op via ON CONFLICT DO NOTHING. RETURNING id distinguishes first-delivery from replay so Phase 8 dispatcher only fires side effects once. |
| T-07-10 | Denial of Service | Length-mismatch HMAC inputs crash route via TypeError from timingSafeEqual | mitigate | `verifyCorepayWebhook` checks `receivedBuf.length !== computedBuf.length` BEFORE calling timingSafeEqual (CLAUDE.md hard rule). Returns false instead of throwing. |
| T-07-11 | Information Disclosure | Timing oracle via per-byte HMAC comparison | mitigate | `crypto.timingSafeEqual` is constant-time once lengths match. The early length-check returns at the same point for any length-mismatched input — uniform timing. |
| T-07-12 | Spoofing | IP allowlist bypassed by spoofed `x-forwarded-for` | accept | The HMAC is the actual trust boundary; the IP allowlist is defense-in-depth. PLB-10 explicitly says non-allowlist IPs with valid signatures are LOGGED not rejected (gotcha #7 — graceful for Authorize.Net IP rotation). Spoofed x-forwarded-for that ALSO has a valid HMAC = the attacker has the secret, in which case the IP check buys nothing. |
| T-07-13 | Information Disclosure | webhook_events.raw_payload contains billing names / last-4 / amounts | accept | DDL is in Plan 01; Plan 02 only INSERTs. The raw_payload is JSONB for replay/audit. Logging at INFO level of this payload is forbidden (HIPAA + non-PHI privacy). Plan 03 PLB-12 Sentry beforeSend hook scrubs this from breadcrumbs. |
| T-07-14 | Tampering | `authorizenet` npm package installed accidentally with HMAC bug | mitigate | All four helper modules use the existing `gatewayFetch()` (locked decision §1.1). `! grep -q '"authorizenet"' package.json` is part of every task's acceptance criteria. |
| T-07-15 | Spoofing | Vercel runtime serves x-real-ip from a misconfigured proxy chain | accept | x-real-ip is set by Vercel's edge platform, not user-controllable. If misconfigured at platform level, the IP allowlist is a soft-fail anyway (logged). |
| T-07-16 | Elevation of Privilege | COREPAY_WEBHOOK_SECRET missing in env causes verifyCorepayWebhook to return false on every call → 401 every time → silent total outage | mitigate | Boot-time validation lands in Plan 03 PLB-11 (`instrumentation.ts` `authenticateTestRequest` guard). For PLB-12 Sentry, captures the 401-rate spike as an error event. |
| T-07-17 | Information Disclosure | Card last-4, billing name, amounts logged to console.warn on IP-mismatch path | mitigate | The `console.warn` only logs the source IP and the literal allowlist — NO request body, no headers other than IP. Verified by code review: `console.warn(`...non-allowlist IP...: ${sourceIp}...`)`. |
</threat_model>

<verification>
**Plan-level verification (run after all 4 tasks complete):**

1. All four new lib files exist + are type-clean:
   ```bash
   ls lib/payments/authorize-net-cim.ts lib/payments/authorize-net-arb.ts lib/payments/authorize-net-charges.ts lib/payments/corepay-webhooks.ts
   npx tsc --noEmit lib/payments/authorize-net-cim.ts lib/payments/authorize-net-arb.ts lib/payments/authorize-net-charges.ts lib/payments/corepay-webhooks.ts
   ```

2. Webhook route exists + type-clean:
   ```bash
   test -f app/api/webhook/corepay/route.ts
   npx tsc --noEmit app/api/webhook/corepay/route.ts
   ```

3. authorizenet package NOT installed (locked decision §1.1):
   ```bash
   ! grep -q '"authorizenet"' package.json
   ```

4. All helpers route through gatewayFetch:
   ```bash
   grep -l "import.*gatewayFetch.*from './corepay-gateway'" lib/payments/authorize-net-*.ts | wc -l
   ```
   Expected: `3` (cim, arb, charges).

5. Stripe route untouched (parallel-handler decision §1.5):
   ```bash
   test -f app/api/webhook/stripe/route.ts && git diff app/api/webhook/stripe/route.ts --quiet
   ```

6. All vitest suites pass:
   ```bash
   npx vitest run tests/lib/authorize-net-cim.test.ts tests/lib/authorize-net-arb.test.ts tests/lib/authorize-net-charges.test.ts tests/lib/corepay-webhooks.test.ts tests/api/corepay-webhook.test.ts
   ```

7. CLAUDE.md HMAC hard rule enforced:
   ```bash
   grep -q "receivedBuf.length !== computedBuf.length" lib/payments/corepay-webhooks.ts
   ```

8. PLB-10 IPs hardcoded:
   ```bash
   grep -q "198.241.206.38" app/api/webhook/corepay/route.ts
   grep -q "198.241.207.38" app/api/webhook/corepay/route.ts
   ```

9. Phase 8 stub marker present:
   ```bash
   grep -q "TODO Phase 8" app/api/webhook/corepay/route.ts
   ```
</verification>

<success_criteria>
- 4 new TypeScript modules created (cim, arb, charges, webhooks) — all routing through `gatewayFetch()`
- 1 new webhook route created at `app/api/webhook/corepay/route.ts` — reads body via `request.text()` first, verifies HMAC-SHA512, idempotent INSERT into webhook_events, IP allowlist (non-rejecting), Phase 8 dispatcher stub
- `gatewayFetch` exported from `lib/payments/corepay-gateway.ts` (one-line change to existing file)
- `authorizenet` npm package NOT installed (locked decision §1.1)
- `app/api/webhook/stripe/route.ts` UNTOUCHED (parallel-handler decision §1.5)
- All 5 vitest test files pass
- All TypeScript files type-clean
- All `<acceptance_criteria>` automated checks pass on every task
</success_criteria>

<output>
After completion, create `.planning/phases/07-schema-gateway-plumbing/07-02-SUMMARY.md` documenting:
- Files created with line counts and exported symbol lists
- Confirmation that `gatewayFetch` was exported (one-line change to corepay-gateway.ts)
- Confirmation that `authorizenet` package was NOT installed
- Confirmation that Stripe webhook route was NOT modified
- Vitest pass/fail counts for each new test file
- Any deviations from plan
</output>
