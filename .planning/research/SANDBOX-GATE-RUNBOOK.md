---
phase_gate: pre-phase-7
status: ready_for_execution
created: 2026-05-03
prereqs:
  - CorePay sandbox apiLoginId + transactionKey
  - Authorize.Net merchant interface login (apitest.authorize.net)
  - Sentry org access for `cultrhealth`
  - Vercel CLI authenticated (`vercel whoami`)
related:
  - .planning/research/SUMMARY.md §6
  - .claude/skills/corepay-api/SKILL.md
  - lib/payments/corepay-gateway.ts (gatewayFetch reference)
---

# Pre-Phase-7 Sandbox Gate Runbook

**Goal:** answer Q1–Q6 against the live CorePay/Authorize.Net sandbox so Phase 7 (Schema + Gateway Plumbing) can start without re-research. Each question gates a specific architectural decision; the **Decision rule** at the end of each section names the file or section in `.planning/research/SUMMARY.md` §4 that gets updated based on the answer.

**Time estimate when creds are in hand:** ~30 minutes total (Q1 + Q5 + Q6 share an ARB sub setup, Q2/Q3 are dashboard reads, Q4 is an email reply).

**Sandbox endpoint:** `https://apitest.authorize.net/xml/v1/request.api`
**Sandbox Accept.js:** `https://jstest.authorize.net/v1/Accept.js`

## Setup (run once before Q1/Q5/Q6)

Export sandbox credentials in your shell:

```bash
export AN_LOGIN="<sandbox apiLoginId>"
export AN_KEY="<sandbox transactionKey>"
export AN_URL="https://apitest.authorize.net/xml/v1/request.api"
```

Sanity-check creds are valid (this is `authenticateTestRequest` — Phase 7 PLB-11 uses the same call at boot):

```bash
curl -sX POST "$AN_URL" \
  -H 'Content-Type: application/json' \
  -d "{
    \"authenticateTestRequest\": {
      \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"}
    }
  }" | jq .
```

**Expected response (success):**
```json
{ "messages": { "resultCode": "Ok", "message": [{"code": "I00001", "text": "Successful."}] } }
```

If you see Code `E00007` ("User authentication failed") → wrong creds. Stop. Do NOT proceed — the rest of the runbook will produce misleading errors.

To get a sandbox opaqueData token (needed for Q1/Q5/Q6), use the Authorize.Net hosted Accept.js sample at https://developer.authorize.net/api/reference/index.html#payment-transactions or run a one-shot tokenization in the merchant interface's "API Test Tools." Save the result as:

```bash
export OPAQUE_DESCRIPTOR="COMMON.ACCEPT.INAPP.PAYMENT"
export OPAQUE_VALUE="<dataValue from tokenization>"  # 15-min TTL, single-use
```

**Reminder per corepay-api skill gotcha #3:** opaqueData burns on first use. Q1, Q5, Q6 each need a fresh token.

---

## Q1 — CIM payment profile cascade to ARB? (Path A vs Path B)

**Decision gates:** `lib/payments/authorize-net-cim.ts:updateCard` strategy (Phase 7 PLB-05).
**Default if unverified:** Path B (current locked decision in SUMMARY.md §4 — "Card update default: Path B (new payment profile + ARBUpdate)").
**Why this matters:** Path A is one round-trip (in-place edit). Path B is two round-trips (new payment profile + ARBUpdate to point sub at it). If Path A actually cascades, we save a request per card update across every member.

### Test steps

**Step 1 — Create a CIM customer + payment profile:**

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"createCustomerProfileRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"profile\": {
      \"merchantCustomerId\": \"sandbox-q1-$(date +%s)\",
      \"email\": \"q1-test@cultrhealth.com\",
      \"paymentProfiles\": {
        \"payment\": {\"opaqueData\": {\"dataDescriptor\": \"$OPAQUE_DESCRIPTOR\", \"dataValue\": \"$OPAQUE_VALUE\"}}
      }
    },
    \"validationMode\": \"liveMode\"
  }
}" | jq .
```

Capture `customerProfileId` and `customerPaymentProfileIdList[0]` from the response.

```bash
export CIM_CUSTOMER_ID="<customerProfileId>"
export CIM_PAYMENT_ID="<customerPaymentProfileIdList[0]>"
```

**Step 2 — Create an ARB sub linked to that payment profile (NOT to opaqueData directly — that's the Phase 7 default pattern):**

```bash
START_DATE=$(date -u -v+2d +%Y-%m-%d)  # 2 days out so we don't accidentally trigger
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBCreateSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscription\": {
      \"name\": \"Q1 Cascade Test\",
      \"paymentSchedule\": {
        \"interval\": {\"length\": \"1\", \"unit\": \"months\"},
        \"startDate\": \"$START_DATE\",
        \"totalOccurrences\": \"9999\"
      },
      \"amount\": \"1.00\",
      \"profile\": {
        \"customerProfileId\": \"$CIM_CUSTOMER_ID\",
        \"customerPaymentProfileId\": \"$CIM_PAYMENT_ID\"
      }
    }
  }
}" | jq .
```

Capture `subscriptionId`:
```bash
export ARB_SUB_ID="<subscriptionId>"
```

**Step 3 — Get a fresh opaqueData token for a different test card (e.g., Visa 4222222222222 → Mastercard 5424000000000015), then update the existing payment profile in place (Path A move):**

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"updateCustomerPaymentProfileRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"customerProfileId\": \"$CIM_CUSTOMER_ID\",
    \"paymentProfile\": {
      \"customerPaymentProfileId\": \"$CIM_PAYMENT_ID\",
      \"payment\": {\"opaqueData\": {\"dataDescriptor\": \"$OPAQUE_DESCRIPTOR\", \"dataValue\": \"$NEW_OPAQUE_VALUE\"}}
    },
    \"validationMode\": \"liveMode\"
  }
}" | jq .
```

**Step 4 — Inspect what the ARB sub now references:**

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBGetSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscriptionId\": \"$ARB_SUB_ID\",
    \"includeTransactions\": true
  }
}" | jq '.subscription.profile.paymentProfile, .subscription.profile.paymentProfile.payment'
```

**Step 5 — Force a charge to the sub** (sandbox only — use `ARBCancelSubscriptionRequest` first if you need to clean up): trigger by setting startDate to today and waiting an hour, OR easier: create a one-shot `chargeCustomerProfile` against the same `customerPaymentProfileId` and inspect the `accountNumber` last-4 in the response.

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"createTransactionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"transactionRequest\": {
      \"transactionType\": \"authCaptureTransaction\",
      \"amount\": \"1.00\",
      \"profile\": {
        \"customerProfileId\": \"$CIM_CUSTOMER_ID\",
        \"paymentProfile\": {\"paymentProfileId\": \"$CIM_PAYMENT_ID\"}
      }
    }
  }
}" | jq '.transactionResponse.accountNumber'
```

### Decision rule

| Result | Decision |
|--------|----------|
| `accountNumber` in step 5 ends in **the NEW card's last-4** AND step 4 shows the new card | **Path A is viable** → flip locked decision in SUMMARY.md §4; Phase 7 PLB-05 implements `updateCustomerPaymentProfile` only, skips `ARBUpdateSubscriptionRequest` for card updates. Save 1 round-trip per card update. |
| `accountNumber` ends in **the OLD card's last-4** OR step 4 still shows the old card | **Path B confirmed** → no change to SUMMARY.md §4. Phase 7 PLB-05 implements both `createCustomerPaymentProfile` (new profile) + `ARBUpdateSubscriptionRequest` (point sub at it). |

### Cleanup
```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBCancelSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscriptionId\": \"$ARB_SUB_ID\"
  }
}"
```

(Keep the CIM profile around — Q5 reuses it.)

---

## Q2 — Vercel staging on Fluid Compute or legacy serverless?

**Decision gates:** Phase 10 checkout async pattern (PRT-03 inline Accept.js path).
**Default if unverified:** Fluid (300s).
**Why this matters:** Sequential ARB calls fit in 3-8s; if staging is on legacy 60s serverless, edge cases like dunning retries or backfill jobs need an async pattern. If Fluid (300s), no special handling.

### Test steps

```bash
# From repo root
vercel project inspect 2>&1 | tee /tmp/vercel-inspect.txt
```

Look for:
- `compute.fluid: true` → Fluid Compute enabled
- `runtimeVersion` → Node.js 24 LTS implies Fluid
- `functions.runtime` per-route overrides

If `vercel project inspect` doesn't exist or doesn't expose Fluid status, fallback:

```bash
# Open Vercel Dashboard → cultrhealth-website project → Settings → Functions
# Check "Function Configuration" panel for "Fluid Compute" toggle
open "https://vercel.com/cultr-health/cultrhealth-website/settings/functions"
```

### Decision rule

| Result | Decision |
|--------|----------|
| Fluid Compute enabled (300s) | **No async pattern needed** for checkout — sequential ARB calls inline. Confirms locked decision in SUMMARY.md §4. |
| Legacy serverless (60s) | **Async pattern required** — Phase 10 PRT-03 needs `app/api/checkout/corepay-async/route.ts` that returns 202 + polls via job queue. Add to Phase 10 plan. Update SUMMARY.md §4 to flip the assumption. |

---

## Q3 — Existing Sentry project on cultrhealth.com?

**Decision gates:** Phase 7 PLB-12 (Sentry wizard config path).
**Default if unverified:** Wizard creates new project.
**Why this matters:** If a project already exists, we reuse the DSN and get historical context. If not, the wizard creates one with default sample-rate settings that we may want to tune.

### Test steps

```bash
# 1. Check repo for existing Sentry config
grep -rn "SENTRY_DSN\|@sentry/nextjs\|sentry.client.config\|sentry.server.config" \
  .env.example .env.production package.json next.config.js \
  app/ lib/ instrumentation.ts 2>/dev/null

# 2. Check Sentry dashboard for existing cultrhealth project
open "https://sentry.io/organizations/cultr-health/projects/"

# 3. Check Vercel env for SENTRY_* vars
vercel env ls | grep -i sentry
```

### Decision rule

| Result | Decision |
|--------|----------|
| Existing Sentry project found (DSN in env or dashboard) | **Reuse it.** Phase 7 PLB-12 wizard skipped — instead `npm install @sentry/nextjs@^10.50.0` and add `instrumentation.ts` manually pointing at existing DSN. Document the project URL/slug in PLB-12 plan. |
| No existing project | **Run `npx @sentry/wizard@latest -i nextjs` per PLB-12.** Wizard handles `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.js` integration. Configure: `tracesSampleRate: 0.1` (HIPAA — don't sample requests with PHI in URLs/headers), `beforeSend` to scrub email/DOB/biomarker fields. |

---

## Q4 — Account Updater enabled on the CorePay merchant account?

**Decision gates:** Phase 11 RDN-07 (card-on-file expiry pipeline necessity).
**Default if unverified:** Assume not enabled. Manual card-expiry email pipeline required.
**Why this matters:** Account Updater is Authorize.Net's automatic re-issuance of expired/replaced cards via the card networks (Visa/MC). If enabled, RDN-07's "card expiring at -30d/-7d" emails are still useful but not the only safety net. If not enabled, that pipeline is the **only** way we avoid mass-failed renewals when cards expire.

### Test steps

**Step 1 — Check the merchant interface:**

```
1. Log into https://account.authorize.net (or sandbox: https://sandbox.authorize.net)
2. Navigate: Account → Security Settings → Account Updater
3. Look for: "Account Updater is currently enabled" / disabled message
4. If enabled, note: per-month cost, supported card networks (Visa, MC, Discover, Amex), update frequency
```

**Step 2 — Email Corepay support** (use the draft at `.planning/research/Q4-EMAIL-DRAFT.md`). They quote pricing and confirm enrollment for our specific MID.

### Decision rule

| Result | Decision |
|--------|----------|
| Enabled, cost ≤ $X/month (decide threshold with finance) | **Keep RDN-07 expiry-emails as belt-and-braces** but reduce dunning-cron polling — Account Updater handles 80%+ of expiry transitions silently. Document the X/month spend in PROJECT.md. |
| Not enabled, can be enabled at acceptable cost | **Enable it before Phase 11 ships.** Adjust RDN-07 plan to assume Account Updater carries primary load. |
| Not enabled, cost prohibitive OR not available on our MID tier | **RDN-07 expiry pipeline is the ONLY safety net.** Increase cron frequency / tighten -30d/-7d email triggers. Consider adding -60d "heads up" tier. |

---

## Q5 — CIM payment profile retention policy?

**Decision gates:** Phase 10 PRT-04 (cancel-flow rule), Phase 12 MGR-04 (Stripe-cancel-then-CIM-create atomic flow).
**Default if unverified:** Retain indefinitely — deletion is unrecoverable, members can't restart sub without re-tokenizing.
**Why this matters:** When a member cancels, we want them to be able to come back without re-entering their card. If CIM retains forever, our cancel flow is "cancel ARB sub, leave CIM intact." If Authorize.Net auto-purges after N days, we need a re-onboarding flow when they return.

### Test steps

**Step 1 — Documented retention check:**

```
1. Log into https://account.authorize.net merchant interface
2. Navigate: Account → Settings → CIM Settings (or Tools → Customer Information Manager)
3. Look for: retention period, auto-deletion settings
```

**Step 2 — Sandbox delete-and-cancel test** (uses the CIM profile from Q1):

```bash
# Verify the CIM profile from Q1 still exists
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"getCustomerProfileRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"customerProfileId\": \"$CIM_CUSTOMER_ID\"
  }
}" | jq '.profile.paymentProfiles[].customerPaymentProfileId, .profile.paymentProfiles[].payment.creditCard.expirationDate'
```

**Step 3 — Delete the payment profile (NOT the customer profile) and re-attempt an ARB:**

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"deleteCustomerPaymentProfileRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"customerProfileId\": \"$CIM_CUSTOMER_ID\",
    \"customerPaymentProfileId\": \"$CIM_PAYMENT_ID\"
  }
}" | jq .

# Now try to create an ARB referencing the deleted payment profile
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBCreateSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscription\": {
      \"name\": \"Q5 Retention Test\",
      \"paymentSchedule\": {\"interval\": {\"length\": \"1\", \"unit\": \"months\"}, \"startDate\": \"$(date -u -v+2d +%Y-%m-%d)\", \"totalOccurrences\": \"9999\"},
      \"amount\": \"1.00\",
      \"profile\": {\"customerProfileId\": \"$CIM_CUSTOMER_ID\", \"customerPaymentProfileId\": \"$CIM_PAYMENT_ID\"}
    }
  }
}" | jq '.messages'
```

### Decision rule

| Result | Decision |
|--------|----------|
| No documented auto-purge AND step 3 returns Code `E00040` ("record not found") only when payment profile is explicitly deleted | **Retain indefinitely on cancel.** Phase 10 PRT-04 cancel flow = `ARBCancelSubscriptionRequest` only; leaves CIM customer + payment profile intact. Member returning months later just creates a new ARB pointing at the same `customerPaymentProfileId`. |
| Documented auto-purge after N days | **Phase 10 PRT-04 needs a "re-onboard" flow** for returning members past N days — re-tokenize card, create new payment profile. Document N in plan. |
| Sandbox shows mysterious purges (e.g. payment profile gone after 30 days with no explicit delete) | **Treat as worst case** — re-onboard flow required. Add monitoring alert. |

### Cleanup
```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"deleteCustomerProfileRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"customerProfileId\": \"$CIM_CUSTOMER_ID\"
  }
}"
```

---

## Q6 — Authorize.Net first-charge limitation — does ARB charge day 1?

**Decision gates:** Phase 10 PRT-03 (checkout flow split vs straight ARB), Phase 9 CPN-02 (FOUNDER15 first-month coupon timing).
**Default per docs:** ARB schedules first charge per the schedule, NOT on creation.
**Why this matters:** If `startDate = today` triggers an immediate charge, our checkout flow is "tokenize → ARB create → done." If it doesn't, we need to split: a `createTransactionRequest` for month 1 + ARB starting `+1 month`. The split path is more code, more failure modes, and complicates coupon logic.

### Test steps

**Step 1 — Get a fresh opaqueData token** (Q1's token is burned).

**Step 2 — Create an ARB with `startDate = today`:**

```bash
TODAY=$(date -u +%Y-%m-%d)
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBCreateSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscription\": {
      \"name\": \"Q6 First-Charge Test\",
      \"paymentSchedule\": {
        \"interval\": {\"length\": \"1\", \"unit\": \"months\"},
        \"startDate\": \"$TODAY\",
        \"totalOccurrences\": \"9999\"
      },
      \"amount\": \"1.00\",
      \"payment\": {\"opaqueData\": {\"dataDescriptor\": \"$OPAQUE_DESCRIPTOR\", \"dataValue\": \"$OPAQUE_VALUE\"}},
      \"customer\": {\"email\": \"q6-test@cultrhealth.com\"}
    }
  }
}" | jq .
```

Capture `subscriptionId`:
```bash
export Q6_SUB_ID="<subscriptionId>"
```

**Step 3 — Wait 5–10 minutes, then check transactions:**

```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBGetSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscriptionId\": \"$Q6_SUB_ID\",
    \"includeTransactions\": true
  }
}" | jq '.subscription.arbTransactions, .subscription.status'
```

**Step 4 — Check the merchant interface "Unsettled Transactions" report** for any txn against this subscription dated today.

### Decision rule

| Result | Decision |
|--------|----------|
| Step 3 shows a transaction dated today AND status `active` | **ARB DOES charge day 1.** Confirms straight-ARB checkout path. Phase 10 PRT-03 = single `ARBCreateSubscriptionRequest`. Phase 9 CPN-02 FOUNDER15 = bake discounted amount into ARB `amount`. |
| Step 3 shows `arbTransactions: []` (or only future-dated entries) AND status `active` but no charge today | **ARB does NOT charge day 1 — split required.** Update SUMMARY.md §4 to lock this. Phase 10 PRT-03 = `createTransactionRequest` (month 1, full amount or discounted) + `ARBCreateSubscriptionRequest` with `startDate = +1 month`. Phase 9 CPN-02 FOUNDER15 needs: month-1 charge takes the discount, ARB at full amount thereafter — OR — bake-once into ARB amount and skip the month-1 charge (cron timing risk). |
| Sub created but `status: pending` | **Indeterminate — wait until startDate fires** (sandbox may queue rather than charge immediately). Re-check next day. |

### Cleanup
```bash
curl -sX POST "$AN_URL" -H 'Content-Type: application/json' -d "{
  \"ARBCancelSubscriptionRequest\": {
    \"merchantAuthentication\": {\"name\": \"$AN_LOGIN\", \"transactionKey\": \"$AN_KEY\"},
    \"subscriptionId\": \"$Q6_SUB_ID\"
  }
}"
```

---

## After all questions answered

1. **Update `.planning/research/SUMMARY.md` §4 (Locked Architectural Decisions)** with any decisions that flipped from default. Note the date and the sandbox evidence.
2. **Update `.planning/STATE.md`**: clear the "Hard sandbox gate before Phase 7" line in Open Blockers; mark gate as resolved.
3. **Run `/gsd-discuss-phase 7`** — the planner needs the Q1–Q6 answers to scope `lib/payments/authorize-net-cim.ts` correctly and to decide checkout shape.
4. **Save sandbox artifacts** (subscription IDs, customer IDs, response payloads) into `.planning/research/SANDBOX-EVIDENCE/` for later replay if assumptions need re-litigating.

## Sandbox safety notes

- **All test cards are sandbox-only.** Authorize.Net publishes test card numbers at https://developer.authorize.net/hello-world/testing-guide/.
- **Never use a real PAN against `apitest.authorize.net`** — sandbox does not store cards securely.
- **Code 13 ("Merchant authentication failed")** at any point = wrong creds OR sandbox-creds-against-prod / vice-versa. Stop and re-check `$AN_LOGIN`/`$AN_KEY`.
- **Sandbox occasionally lags** by a few minutes for ARB scheduling. If Q6 step 3 shows nothing immediately, re-check at +10 min and +1 hour before deciding.
- **Cleanup matters** — orphaned ARB subs in sandbox eventually rate-limit your account. Run the cleanup blocks at the end of each section.
