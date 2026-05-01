# Phase 6: Skills - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 4 (2 new skill files, 1 targeted edit, 1 config edit)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.claude/skills/corepay-api/SKILL.md` | skill-doc | request-response | `.claude/skills/siphox-api/SKILL.md` | exact |
| `.claude/skills/healthie-api/SKILL.md` | skill-doc | request-response | `.claude/skills/siphox-api/SKILL.md` | exact |
| `.claude/skills/siphox-api/SKILL.md` | skill-doc (edit) | — | itself (targeted gotcha insert) | self |
| `.gitignore` | config (edit) | — | existing `!.claude/skills/siphox-api/` lines 49–50 | exact |

---

## Pattern Assignments

### `.claude/skills/corepay-api/SKILL.md` (new, skill-doc)

**Analog:** `.claude/skills/siphox-api/SKILL.md`

**Frontmatter pattern** (lines 1–4 of siphox analog):
```markdown
---
name: corepay-api
description: Use when integrating or calling the Corepay/Authorize.Net payment gateway — Accept.js token flow, ARB subscriptions, CIM customer profiles, webhook HMAC-SHA512 verification, or any code that touches `COREPAY_TRANSACTION_KEY`, `NEXT_PUBLIC_COREPAY_API_LOGIN_ID`, `gatewayFetch`, `ARBCreateSubscriptionRequest`, `createCustomerProfile`, or any `lib/payments/corepay-*.ts` file. NOTE: Corepay (corepay.net) is CULTR's payment ISO — it uses Authorize.Net as the underlying gateway. This is NOT Corpay (corpay.com / Fleetcor), a B2B FX company with zero presence in this codebase.
---
```

**Section ordering** (copy from siphox-api exactly):
1. Vocabulary / disambiguation (D-03 requires this FIRST — before Overview)
2. Overview
3. Gotchas — read these first
4. Quick reference — all endpoints / operations
5. When implementing a new Corepay call
6. CULTR integration patterns

**Vocabulary section pattern** (D-03):
```markdown
## Vocabulary — do not conflate these three companies

| Name | Domain | Role | In CULTR codebase? |
|---|---|---|---|
| **Corepay** | corepay.net | CULTR's payment ISO/merchant acquirer | Yes — env vars, credentials |
| **Authorize.Net** | authorize.net / apitest.authorize.net | The underlying payment gateway API | Yes — all API URLs |
| **Corpay** | corpay.com / developer.crossborder.corpay.com | Fleetcor B2B FX / cross-border payments | NO — zero presence |

> The URL `developer.crossborder.corpay.com` is for Corpay (Fleetcor). Do not confuse it with CULTR's gateway. CULTR sends requests to `api.authorize.net` (production) or `apitest.authorize.net` (sandbox) using Corepay merchant credentials.
```

**Core pattern: gatewayFetch** (`lib/payments/corepay-gateway.ts` lines 50–89):
```typescript
// Native fetch — NO npm SDK (authorizenet SDK breaks HMAC webhook verification)
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
      merchantAuthentication: auth,  // injected automatically
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });

  if (!response.ok) {
    throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.messages?.resultCode === 'Error') {
    const errorMessage = data.messages.message?.[0]?.text || 'Unknown error';
    throw new Error(`Gateway error: ${errorMessage}`);
  }

  return data as T;
}
```

**COREPAY_CONFIG pattern** (`lib/config/payments.ts` lines 34–45):
```typescript
export const COREPAY_CONFIG = {
  apiUrl: process.env.COREPAY_ENVIRONMENT === 'production'
    ? 'https://api.authorize.net/xml/v1/request.api'
    : 'https://apitest.authorize.net/xml/v1/request.api',
  acceptJsUrl: process.env.COREPAY_ENVIRONMENT === 'production'
    ? 'https://js.authorize.net/v1/Accept.js'
    : 'https://jstest.authorize.net/v1/Accept.js',
  apiLoginId: process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID || '',
  publicClientKey: process.env.NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY || '',
  environment: (process.env.COREPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  currency: 'USD',
} as const;
```

**ARB subscription call pattern** (`lib/payments/corepay-gateway.ts` lines 95–147):
```typescript
// Usage: gatewayFetch<SubscriptionResponse>(
//   { ARBCreateSubscriptionRequest: { subscription } },
//   params.credentials,  // optional override creds
// )
// Key: pass request body with the Authorize.Net operation name as the top-level key.
// gatewayFetch injects merchantAuthentication automatically.
```

**Env vars to document in skill:**
- `NEXT_PUBLIC_COREPAY_API_LOGIN_ID` — public (client + server), API login ID
- `COREPAY_TRANSACTION_KEY` — server-only, transaction signing key
- `NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY` — public, Accept.js client key
- `COREPAY_ENVIRONMENT` — `sandbox` | `production` (controls API URL selection)
- `NEXT_PUBLIC_ENABLE_COREPAY` — feature flag (`'true'` to enable)

**Spec-forward sections to mark with HTML comment** (D-01):
```markdown
<!-- Phase 7 work — not yet in codebase -->
```
Apply this to: CIM (createCustomerProfile), Accept.js token flow client component, HMAC-SHA512 webhook verification route, ARB update-next-cycle pattern.

**authorizenet SDK gotcha wording** (D-02 — include failure mode):
The `authorizenet` npm SDK has known issues with the HMAC signature envelope format used for webhook verification — it wraps the signature string incorrectly, causing signature mismatch on every webhook. This is WHY `lib/payments/corepay-gateway.ts` uses native `fetch()` directly. Do NOT introduce the `authorizenet` npm package for any Phase 7 work.

---

### `.claude/skills/healthie-api/SKILL.md` (new, skill-doc)

**Analog:** `.claude/skills/siphox-api/SKILL.md`

**Frontmatter pattern:**
```markdown
---
name: healthie-api
description: Use when integrating or calling the Healthie EHR/EMR GraphQL API — creating clients, scheduling appointments, submitting form answers, uploading documents, verifying webhooks, or any code that touches `HEALTHIE_API_KEY`, `healthieRequest`, `HealthieApiError`, or any file in `lib/healthie/`.
---
```

**Section ordering** (match siphox-api):
1. Overview
2. Gotchas — read these first
3. Quick reference — mutations and queries
4. Webhook verification
5. When implementing a new Healthie call
6. CULTR integration map
7. Research sub-task note (D-05 webhook event catalogue)

**Auth header pattern** (`lib/healthie/client.ts` lines 63–70 — the #1 gotcha):
```typescript
// CRITICAL: Basic auth, NOT Bearer. Two headers required.
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${apiKey}`,   // literal "Basic", not "Bearer"
  'AuthorizationSource': 'API',          // required second header
},
```

**Generic request wrapper pattern** (`lib/healthie/client.ts` lines 44–118):
```typescript
export async function healthieRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  resultKey: string,  // top-level key in data{} to extract
): Promise<T>
// Handles: 30s timeout, HTTP errors, GraphQL errors[], missing data,
//          Zod validation (logs paths only — HIPAA), returns parsed.data
```

**Error class pattern** (`lib/healthie/client.ts` lines 29–38):
```typescript
export class HealthieApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public graphqlErrors?: GraphQLError[],
  ) { ... }
}
```

**Mutation response nesting pattern** (`lib/healthie/mutations.ts` lines 28–43):
```typescript
// Healthie mutations return { mutationName: { entity: {...} } }
// Wrap with Zod schema that matches the nesting:
const CreateClientPayload = z.object({
  user: HealthieUserSchema,
}).passthrough()

// Then extract:
const result = await healthieRequest(CREATE_CLIENT, input, CreateClientPayload, 'createClient')
return result.user
```

**Webhook HMAC-SHA256 verification pattern** (`lib/healthie/webhooks.ts` lines 33–67):
```typescript
// Call order in route handler:
// 1. rawBody = await readWebhookBody(request)  — must be first body read
// 2. verified = verifyHealthieWebhook(request, rawBody)
// 3. if (!verified) return 401
// 4. event = parseWebhookBody(rawBody)

// Signature headers Healthie sends:
//   Content-Digest: sha-256=:<base64-hash>:
//   Signature-Input: sig1=("@method" "@path" ...);created=<ts>;keyid="..."
//   Signature: sig1=:<base64-hmac>:
// Verification is RFC 9421 HMAC-SHA256
```

**timingSafeEqual buffer length guard** (`lib/healthie/webhooks.ts` lines 57–62):
```typescript
// ALWAYS check lengths before timingSafeEqual — mismatched lengths throw TypeError
if (providedBuf.length !== secretBuf.length) return false
return timingSafeEqual(providedBuf, secretBuf)
```

**Patient sync pattern** (`lib/healthie/patient-sync.ts` lines 14–38):
```typescript
// Idempotent: check by email first, create only if absent
export async function ensureHealthiePatient(email, firstName, lastName)
// Always pass skipped_email: true — CULTR sends its own welcome email
// Returns null if HEALTHIE_API_KEY not set (graceful no-op)
```

**Lab sync pattern** (`lib/healthie/lab-sync.ts` lines 19–39):
```typescript
// SiPhox reports → Healthie via document upload (not native lab order)
export async function pushLabResultsToHealthie(
  healthiePatientId, reportId, reportDate, pdfBase64?)
// Returns null if Healthie not configured (graceful no-op)
```

**CULTR integration map** (four active points per D-06):
```
lib/healthie/patient-sync.ts  — CULTR member → Healthie client (ensureHealthiePatient)
lib/healthie/mutations.ts     — appointment CREATE/CANCEL (code-ready, Calendly active, Healthie latent)
app/api/webhook/healthie/     — raw-body webhook route with HMAC-SHA256 (RFC 9421)
lib/healthie/lab-sync.ts      — SiPhox biomarker results forwarded to Healthie form answers
```

**Env vars to document in skill:**
- `HEALTHIE_API_KEY` — server-only; used as `Basic <KEY>` not Bearer
- `HEALTHIE_API_URL` — defaults to `https://staging-api.gethealthie.com/graphql`; production: `https://api.gethealthie.com/graphql`
- `HEALTHIE_WEBHOOK_SECRET` — HMAC shared secret for webhook verification

**Research sub-task note for planner** (D-05):
The plan must include a task to fetch and enumerate all ~120+ Healthie webhook event types from official docs. Do not document only the events CULTR uses today — the Phase 8 dispatcher will need the full catalogue. Mark this as a research fetch, not a coding task.

---

### `.claude/skills/siphox-api/SKILL.md` (targeted edit)

**Edit type:** Insert one new gotcha at the top of the "Gotchas" section, making the current gotcha #1 become gotcha #2.

**Insertion location:** Line 20 of the current file, after the `## Gotchas — read these first` heading, before the existing `1. **Auth prefix is Token...`

**New gotcha text to insert:**
```markdown
1. **Known repo bug: `lib/siphox/client.ts:80` sends `Authorization: Bearer` but SiPhox requires `Authorization: Token`.** The existing code is broken for auth. It returns 401 "Business session is required" in production. Will be fixed in Phase 13. Until then, do not rely on `lib/siphox/client.ts` for live API calls — use the `siphoxFetch` helper in `references/client-starter.ts` instead.
```

After insertion, renumber the existing gotchas #1→#10 to #2→#11.

**Bug location confirmed:** `lib/siphox/client.ts` lines 79–82:
```typescript
const headers: Record<string, string> = {
  'Authorization': `Bearer ${apiKey}`,   // BUG: should be Token, not Bearer
  'Content-Type': 'application/json',
}
```

---

### `.gitignore` (targeted edit)

**Edit type:** Append two lines after line 50 (`!.claude/skills/siphox-api/`).

**Exact context** (lines 48–51):
```
.claude/skills/*
# Project-specific skills (shared with team)
!.claude/skills/siphox-api/
skills-lock.json
```

**Insert after line 50**, before `skills-lock.json`:
```
!.claude/skills/corepay-api/
!.claude/skills/healthie-api/
```

Result after edit (lines 48–53):
```
.claude/skills/*
# Project-specific skills (shared with team)
!.claude/skills/siphox-api/
!.claude/skills/corepay-api/
!.claude/skills/healthie-api/
skills-lock.json
```

No `corpay-crossborder` exception — SKL-03 is dropped per D-12.

---

## Shared Patterns

### Skill frontmatter format
**Source:** `.claude/skills/siphox-api/SKILL.md` lines 1–4
**Apply to:** Both new skill files

YAML frontmatter with two fields only: `name` (kebab-case matching directory name) and `description` (prose sentence that doubles as trigger conditions — list the env vars and function names that should trigger loading the skill).

### Gotchas section placement
**Source:** `.claude/skills/siphox-api/SKILL.md` line 19 (`## Gotchas — read these first`)
**Apply to:** Both new skill files

Gotchas section appears immediately after Overview, before the Quick reference table. The heading is always `## Gotchas — read these first` (exact phrasing).

### Quick reference table format
**Source:** `.claude/skills/siphox-api/SKILL.md` lines 32–58
**Apply to:** Both new skill files

Three-column table: `| Method | Path | Purpose |` for REST skills. For Healthie (GraphQL), use `| Operation | Type | Purpose |`.

### HIPAA log discipline
**Source:** `lib/healthie/client.ts` lines 84–85, 105–109
**Apply to:** All skill "When implementing" sections

Skills must instruct: log only error messages and field paths, never variable values, response bodies, or patient data. Exact pattern from `client.ts`:
```typescript
// HIPAA: Only log error messages, not variable data
console.error('Healthie GraphQL errors:', json.errors.map(e => e.message))
// Validation failure: log paths only
console.error('Healthie response validation failed:', parsed.error.issues.map(i => ({
  path: i.path, code: i.code, message: i.message,
})))
```

### isConfigured() guard pattern
**Source:** `lib/healthie/patient-sync.ts` lines 20–22; `lib/siphox/client.ts` lines 39–41
**Apply to:** Both new skills' "CULTR integration patterns" section

All integration callers check `isHealthieConfigured()` / `isSiphoxConfigured()` before calling — return `null` if not configured, never throw. Skills should document this graceful no-op pattern.

### Spec-forward section marker
**Source:** D-01 decision
**Apply to:** corepay-api skill only

Unimplemented sections must be bracketed with:
```markdown
<!-- Phase 7 work — not yet in codebase -->
... section content ...
<!-- end Phase 7 work -->
```

---

## No Analog Found

All four files have close analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `.claude/skills/`, `lib/payments/`, `lib/config/`, `lib/healthie/`, `lib/siphox/`, `.gitignore`
**Files scanned:** 12 source files read directly
**Pattern extraction date:** 2026-05-01
