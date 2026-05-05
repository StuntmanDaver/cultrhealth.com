---
phase: 07-schema-gateway-plumbing
plan: 03
type: execute
wave: 2
depends_on: ["07-01", "07-02"]
files_modified:
  - instrumentation.ts
  - sentry.client.config.ts
  - sentry.server.config.ts
  - sentry.edge.config.ts
  - next.config.js
  - app/api/admin/corepay-smoke/route.ts
  - package.json
autonomous: true
requirements: [PLB-11, PLB-12, PLB-13]
must_haves:
  truths:
    - "@sentry/nextjs ^10.50.0 is installed via the wizard install path (locked Q3 — no existing Sentry project per SANDBOX-GATE-RUNBOOK.md)"
    - "instrumentation.ts initializes Sentry AND calls authenticateTestRequest at boot, refusing to start the app on Authorize.Net Code 13"
    - "PHI redaction beforeSend hook is installed in sentry.server.config.ts + sentry.client.config.ts (HIPAA — strip emails/phones/medical data from breadcrumbs, scope, user context)"
    - "next.config.js is wrapped with withSentryConfig()"
    - "app/api/admin/corepay-smoke/route.ts is admin-auth-gated and runs the full sandbox round-trip in 8 steps: authenticateTestRequest → createCustomerProfile → addPaymentProfile → createSubscription at $1 → cancelSubscription → chargeCustomerProfile → voidTransaction → deleteCustomerProfile"
    - "Smoke route logs each step with a Sentry trace span; any step failure surfaces in Sentry"
  artifacts:
    - path: "instrumentation.ts"
      provides: "Boot hook — Sentry register + Authorize.Net authenticateTestRequest credential validation"
      contains: "register"
    - path: "sentry.server.config.ts"
      provides: "Server-side Sentry init with PHI scrubbing beforeSend hook"
      contains: "beforeSend"
    - path: "sentry.client.config.ts"
      provides: "Client-side Sentry init with PHI scrubbing"
      contains: "beforeSend"
    - path: "sentry.edge.config.ts"
      provides: "Edge runtime Sentry init"
      contains: "Sentry.init"
    - path: "next.config.js"
      provides: "withSentryConfig wrapper for source-map upload + bundle analysis"
      contains: "withSentryConfig"
    - path: "app/api/admin/corepay-smoke/route.ts"
      provides: "Admin-gated sandbox round-trip endpoint"
      exports: ["GET", "POST"]
  key_links:
    - from: "instrumentation.ts"
      to: "lib/payments/corepay-gateway.ts (gatewayFetch — exported in Plan 02)"
      via: "authenticateTestRequest call at boot, throws on resultCode === 'Error' Code 13"
      pattern: "authenticateTestRequest"
    - from: "sentry.server.config.ts beforeSend"
      to: "Sentry SDK"
      via: "Strips PII keys (email, phone, dob, biomarker_*, medical_*) from event.user, event.contexts, event.breadcrumbs[].data, event.request.data"
      pattern: "beforeSend"
    - from: "app/api/admin/corepay-smoke/route.ts"
      to: "lib/payments/authorize-net-cim.ts + authorize-net-arb.ts + authorize-net-charges.ts (Plan 02)"
      via: "Sequential calls (8 steps): authenticateTestRequest → createCustomerProfile → addPaymentProfile (distinct, uses dataValueSecondary) → createSubscription → cancelSubscription → chargeCustomerProfile (against secondary profile) → voidTransaction → deleteCustomerProfile"
      pattern: "createCustomerProfile.*addPaymentProfile.*createSubscription.*cancelSubscription"
    - from: "app/api/admin/corepay-smoke/route.ts"
      to: "Sentry trace API"
      via: "Sentry.startSpan() wraps each step — failures surface in Sentry traces"
      pattern: "Sentry.startSpan"
---

<objective>
Land the boot-time observability layer: Sentry instrumentation (PLB-12) via the official wizard install path (Q3 confirmed no existing project, so wizard creates one), boot-time CorePay credential validation (PLB-11) that refuses to start the app on Authorize.Net Code 13, and the admin smoke route (PLB-13) that runs a complete sandbox round-trip with each step traced via Sentry.

Purpose: Phase 7 success criterion #5 requires that the smoke route can run end-to-end against the sandbox AND Sentry receives the trace. PLB-11 prevents the "sandbox-creds-in-prod silent fail" scenario from corepay-api SKILL gotcha #6. PLB-12's beforeSend hook is the HIPAA-critical layer that stops PHI from ever reaching Sentry's servers.

Output: 5 new TypeScript files (instrumentation.ts, 3 sentry.*.config.ts, smoke route), 1 modified file (next.config.js wrapped with withSentryConfig), 1 package.json change (sentry/nextjs added).

Wave: 2 (depends on Plan 01 schema being applied AND Plan 02 helpers existing — the smoke route imports both).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md
@.planning/research/SANDBOX-GATE-RUNBOOK.md
@.claude/skills/corepay-api/SKILL.md
@lib/payments/corepay-gateway.ts
@lib/payments/authorize-net-cim.ts
@lib/payments/authorize-net-arb.ts
@lib/payments/authorize-net-charges.ts
@next.config.js
@package.json

<interfaces>
<!-- Surface the smoke route consumes (created in Plan 02) + the wizard's expected file shapes -->

From lib/payments/corepay-gateway.ts (Plan 02 exported gatewayFetch):
```typescript
export async function gatewayFetch<T>(
  requestBody: Record<string, unknown>,
  overrides?: GatewayCredentials,
): Promise<T>;
export interface GatewayCredentials {
  apiLoginId: string;
  transactionKey: string;
  apiUrl?: string;
}
export async function createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResponse>;
```

From lib/payments/authorize-net-cim.ts (Plan 02):
```typescript
export async function createCustomerProfile(params: CreateCustomerProfileParams): Promise<CreateCustomerProfileResponse>;
export async function addPaymentProfile(params: AddPaymentProfileParams): Promise<CreateCustomerPaymentProfileResponse>;
export async function deleteCustomerProfile(params: DeleteCustomerProfileParams): Promise<DeleteCustomerProfileResponse>;
```

From lib/payments/authorize-net-arb.ts (Plan 02):
```typescript
export async function cancelSubscription(params: CancelSubscriptionParams): Promise<ArbStandardResponse>;
```

From lib/payments/authorize-net-charges.ts (Plan 02):
```typescript
export async function chargeCustomerProfile(params: ChargeCustomerProfileParams): Promise<TransactionResponse>;
export async function refundTransaction(params: RefundTransactionParams): Promise<TransactionResponse>;
export async function voidTransaction(params: VoidTransactionParams): Promise<TransactionResponse>;
```

From SANDBOX-GATE-RUNBOOK.md "Setup" section (the exact authenticateTestRequest envelope):
```json
{ "authenticateTestRequest": { "merchantAuthentication": { "name": "<apiLoginId>", "transactionKey": "<transactionKey>" } } }
```
Successful response: `{ "messages": { "resultCode": "Ok", "message": [{"code": "I00001", "text": "Successful."}] } }`
Code 13 (sandbox/prod mismatch): `messages.resultCode = 'Error'`, `messages.message[0].code = 'E00007'` ("User authentication failed").

From SANDBOX-GATE-RUNBOOK.md Q3 resolution:
- No existing Sentry project on cultrhealth.com — wizard install required.
- Configure: `tracesSampleRate: 0.1` (HIPAA — don't sample requests with PHI).
- `beforeSend` to scrub email/DOB/biomarker fields.

From CLAUDE.md HIPAA rule:
- "Never log PHI"
- The PHI fields that MUST be scrubbed by beforeSend:
  - email, phone, phoneNumber
  - dateOfBirth, dob
  - shippingAddress, billingAddress, address (any sub-key)
  - biomarker_* (any prefix match)
  - medical_*, healthie_*, siphox_*
  - lab_*, prescription_*, intake_*

From SUMMARY.md §4.5 (Vercel Fluid Compute confirmed):
- 300s timeout — smoke route can run sequential ARB calls inline without async pattern.

Smoke route admin-auth pattern: existing project uses `lib/auth.ts` for JWT auth and admin role check. Look at `app/api/admin/analytics/route.ts` or `app/api/admin/club-orders/route.ts` for the actual `requireAdmin()` shape — the smoke route mirrors that pattern.

env vars needed for PLB-11:
- COREPAY_TRANSACTION_KEY (server-only)
- NEXT_PUBLIC_COREPAY_API_LOGIN_ID
- COREPAY_ENVIRONMENT (`sandbox` | `production`)

env vars needed for PLB-12:
- SENTRY_DSN (server)
- NEXT_PUBLIC_SENTRY_DSN (client)
- SENTRY_AUTH_TOKEN (build-time only — for source-map upload)
- SENTRY_ORG, SENTRY_PROJECT
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install @sentry/nextjs via wizard and configure 3 sentry.*.config.ts files + next.config.js wrapper (PLB-12)</name>
  <files>package.json, next.config.js, sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, .env.example</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-12 verbatim — wizard install path, 3 config files, withSentryConfig wrapper, PHI redaction beforeSend hook)
    - .planning/research/SANDBOX-GATE-RUNBOOK.md Q3 resolution (no existing Sentry project — wizard creates fresh)
    - .planning/research/SUMMARY.md §2 "Install" (single npx command)
    - CLAUDE.md HIPAA rule (never log PHI; PHI fields list)
    - next.config.js (current state — verify it's NOT already wrapped)
    - package.json (verify @sentry/nextjs NOT yet installed)
  </read_first>
  <action>
    Step 1 — Run the Sentry wizard:

    `npx @sentry/wizard@latest -i nextjs --skip-connect=false`

    The wizard will:
    1. Prompt for the Sentry org slug — answer `cultr-health` (or whatever the user has set up).
    2. Prompt for the project slug — answer `cultrhealth`.
    3. Install `@sentry/nextjs` to `dependencies` in package.json (latest 10.x; verify resolved version is `>= 10.50.0`).
    4. Create `instrumentation.ts` (we OVERWRITE this in Task 2).
    5. Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
    6. Modify `next.config.js` to wrap the export with `withSentryConfig(...)`.
    7. Add `SENTRY_AUTH_TOKEN` to `.env.local` (and possibly `.env.example`).

    If the wizard cannot reach Sentry (e.g., not authenticated), use the manual path: `npm install --save @sentry/nextjs@^10.50.0` then manually create the four files per the wizard's documented templates and manually wrap `next.config.js` with `withSentryConfig()`.

    Step 2 — REPLACE the wizard-generated `sentry.server.config.ts` with this PHI-scrubbing version:

    ```typescript
    // sentry.server.config.ts
    // Phase 7 PLB-12 — Sentry server-side init with HIPAA PHI scrubbing.

    import * as Sentry from '@sentry/nextjs';

    const PHI_EXACT = new Set([
      'email', 'phone', 'phonenumber', 'dateofbirth', 'dob',
      'shippingaddress', 'billingaddress', 'address',
      'firstname', 'lastname', 'fullname',
      'ssn', 'socialsecuritynumber',
      'memberid', 'patientid',
    ]);
    const PHI_PREFIXES = ['biomarker_', 'medical_', 'healthie_', 'siphox_', 'lab_', 'prescription_', 'intake_'];

    function isPhiKey(key: string): boolean {
      const lower = key.toLowerCase();
      if (PHI_EXACT.has(lower)) return true;
      return PHI_PREFIXES.some((prefix) => lower.startsWith(prefix));
    }

    function scrubPhi(value: unknown): unknown {
      if (value == null) return value;
      if (Array.isArray(value)) return value.map(scrubPhi);
      if (typeof value !== 'object') return value;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (isPhiKey(k)) out[k] = '[REDACTED]';
        else out[k] = scrubPhi(v);
      }
      return out;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      debug: false,

      beforeSend(event) {
        if (event.user) {
          event.user = { id: event.user.id };
        }
        if (event.request) {
          if (event.request.headers) {
            const headers = event.request.headers as Record<string, string>;
            for (const k of Object.keys(headers)) {
              if (/cookie|authorization|x-api-key/i.test(k)) headers[k] = '[REDACTED]';
            }
          }
          if (event.request.data) {
            event.request.data = scrubPhi(event.request.data) as typeof event.request.data;
          }
          if (event.request.query_string && typeof event.request.query_string === 'string') {
            if (/email=|phone=|dob=/i.test(event.request.query_string)) {
              event.request.query_string = '[REDACTED]';
            }
          }
        }
        if (event.breadcrumbs && Array.isArray(event.breadcrumbs)) {
          event.breadcrumbs = event.breadcrumbs.map((bc) => ({
            ...bc,
            data: bc.data ? (scrubPhi(bc.data) as Record<string, unknown>) : bc.data,
          }));
        }
        if (event.contexts) event.contexts = scrubPhi(event.contexts) as typeof event.contexts;
        if (event.extra) event.extra = scrubPhi(event.extra) as typeof event.extra;
        return event;
      },

      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data) breadcrumb.data = scrubPhi(breadcrumb.data) as Record<string, unknown>;
        return breadcrumb;
      },
    });
    ```

    Step 3 — REPLACE the wizard-generated `sentry.client.config.ts` with this version:

    ```typescript
    // sentry.client.config.ts
    // Phase 7 PLB-12 — Sentry client-side init with HIPAA PHI scrubbing.

    import * as Sentry from '@sentry/nextjs';

    const PHI_EXACT = new Set([
      'email', 'phone', 'phonenumber', 'dateofbirth', 'dob',
      'shippingaddress', 'billingaddress', 'address',
      'firstname', 'lastname', 'fullname',
      'ssn', 'socialsecuritynumber',
      'memberid', 'patientid',
    ]);
    const PHI_PREFIXES = ['biomarker_', 'medical_', 'healthie_', 'siphox_', 'lab_', 'prescription_', 'intake_'];

    function isPhiKey(key: string): boolean {
      const lower = key.toLowerCase();
      if (PHI_EXACT.has(lower)) return true;
      return PHI_PREFIXES.some((prefix) => lower.startsWith(prefix));
    }

    function scrubPhi(value: unknown): unknown {
      if (value == null) return value;
      if (Array.isArray(value)) return value.map(scrubPhi);
      if (typeof value !== 'object') return value;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (isPhiKey(k)) out[k] = '[REDACTED]';
        else out[k] = scrubPhi(v);
      }
      return out;
    }

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
      tracesSampleRate: 0.1,
      debug: false,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend(event) {
        if (event.user) event.user = { id: event.user.id };
        if (event.request?.data) {
          event.request.data = scrubPhi(event.request.data) as typeof event.request.data;
        }
        if (event.breadcrumbs && Array.isArray(event.breadcrumbs)) {
          event.breadcrumbs = event.breadcrumbs.map((bc) => ({
            ...bc,
            data: bc.data ? (scrubPhi(bc.data) as Record<string, unknown>) : bc.data,
          }));
        }
        if (event.contexts) event.contexts = scrubPhi(event.contexts) as typeof event.contexts;
        if (event.extra) event.extra = scrubPhi(event.extra) as typeof event.extra;
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data) breadcrumb.data = scrubPhi(breadcrumb.data) as Record<string, unknown>;
        return breadcrumb;
      },
    });
    ```

    Step 4 — Verify `sentry.edge.config.ts` exists. The wizard creates a minimal one. If it doesn't, create:

    ```typescript
    // sentry.edge.config.ts
    // Phase 7 PLB-12 — Sentry edge runtime initialization (middleware, edge routes).

    import * as Sentry from '@sentry/nextjs';

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
    });
    ```

    Step 5 — Verify `next.config.js` is wrapped:

    ```javascript
    const { withSentryConfig } = require('@sentry/nextjs');
    // ... existing nextConfig assembled as before ...
    module.exports = withSentryConfig(nextConfig, {
      org: 'cultr-health',
      project: 'cultrhealth',
      silent: !process.env.CI,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    });
    ```

    Preserve every existing CULTR `next.config.js` setting (reactStrictMode, optimizePackageImports, image formats, headers, redirects). The wrap must be at the OUTERMOST layer; if a previous wrap (e.g., `withBundleAnalyzer`) exists, compose: `withSentryConfig(withBundleAnalyzer(nextConfig), { ... })`.

    Step 6 — Append to `.env.example`:

    ```
    # Sentry (Phase 7 PLB-12)
    SENTRY_DSN=
    NEXT_PUBLIC_SENTRY_DSN=
    SENTRY_ORG=cultr-health
    SENTRY_PROJECT=cultrhealth
    # Build-time only:
    SENTRY_AUTH_TOKEN=
    ```

    Step 7 — Smoke-check the install:

    ```bash
    npx tsc --noEmit sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts
    ```

    The `npm run build` MAY warn about missing DSN if SENTRY_DSN is not set; acceptable. UNACCEPTABLE: TypeScript errors or unresolved imports.
  </action>
  <verify>
    <automated>grep -q '"@sentry/nextjs":' package.json && test -f sentry.server.config.ts && test -f sentry.client.config.ts && test -f sentry.edge.config.ts && grep -q "withSentryConfig" next.config.js && grep -q "beforeSend" sentry.server.config.ts && grep -q "beforeSend" sentry.client.config.ts && grep -q "PHI_EXACT\|isPhiKey\|scrubPhi" sentry.server.config.ts && grep -q "tracesSampleRate: 0.1" sentry.server.config.ts && grep -q "replaysSessionSampleRate: 0" sentry.client.config.ts && npx tsc --noEmit sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts</automated>
  </verify>
  <acceptance_criteria>
    - `grep -q '"@sentry/nextjs":' package.json` exits 0
    - `node -e "const v=require('./package.json').dependencies['@sentry/nextjs'];const n=v.replace(/^[\\^~]/,'').split('.').map(Number);process.exit((n[0]>10||(n[0]===10&&n[1]>=50))?0:1)"` exits 0 (version >= 10.50.0)
    - `test -f sentry.server.config.ts` exits 0
    - `test -f sentry.client.config.ts` exits 0
    - `test -f sentry.edge.config.ts` exits 0
    - `grep -q "withSentryConfig" next.config.js` exits 0
    - `grep -q "beforeSend" sentry.server.config.ts` exits 0
    - `grep -q "beforeSend" sentry.client.config.ts` exits 0
    - `grep -q "scrubPhi\|isPhiKey" sentry.server.config.ts` exits 0
    - `grep -q "biomarker_" sentry.server.config.ts && grep -q "medical_" sentry.server.config.ts && grep -q "healthie_" sentry.server.config.ts` exits 0 (CULTR-specific PHI prefixes covered)
    - `grep -q "'email'" sentry.server.config.ts` exits 0 (email scrubbed)
    - `grep -q "tracesSampleRate: 0.1" sentry.server.config.ts` exits 0 (HIPAA-conservative sample rate per Q3 resolution)
    - `grep -q "replaysSessionSampleRate: 0" sentry.client.config.ts` exits 0 (HIPAA — no session replay)
    - `npx tsc --noEmit sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts` exits 0
    - `grep -q '^SENTRY_DSN=' .env.example` exits 0
    - `grep -q '^NEXT_PUBLIC_SENTRY_DSN=' .env.example` exits 0
  </acceptance_criteria>
  <done>
    @sentry/nextjs ^10.50.0+ installed, three sentry.*.config.ts files exist with PHI-scrubbing beforeSend, next.config.js wrapped with withSentryConfig (preserving all existing settings), .env.example updated, type-clean.
  </done>
</task>

<task type="auto">
  <name>Task 2: Write instrumentation.ts with boot-time CorePay credential validation (PLB-11)</name>
  <files>instrumentation.ts</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-11 verbatim — boot-time credential validation, refuse to start on Code 13)
    - .claude/skills/corepay-api/SKILL.md gotcha #6 (sandbox-creds-in-prod silent fail; Code 13 = "Merchant authentication failed")
    - .planning/research/SANDBOX-GATE-RUNBOOK.md "Setup" section (the exact authenticateTestRequest envelope)
    - .planning/research/SANDBOX-GATE-RUNBOOK.md Q3 resolution (Sentry wizard install confirmed)
    - lib/payments/corepay-gateway.ts (gatewayFetch is now exported per Plan 02 Task 1)
    - lib/config/payments.ts (COREPAY_CONFIG.apiUrl — sandbox vs production URL selection logic)
    - The wizard-generated instrumentation.ts (Task 1 created it; we OVERWRITE it now to add CorePay validation alongside the Sentry register call)
  </read_first>
  <action>
    OVERWRITE `instrumentation.ts` with the following (combining Sentry register + CorePay credential validation):

    ```typescript
    // instrumentation.ts
    // Phase 7 PLB-11 + PLB-12 — Next.js boot hook.
    // Runs ONCE per server start (Vercel Fluid Compute cold start, local dev start).
    //
    // Two responsibilities:
    //   1. Sentry registration (PLB-12) — wizard-installed via @sentry/nextjs.
    //   2. CorePay credential validation (PLB-11) — calls authenticateTestRequest and refuses to
    //      start the app on Authorize.Net Code 13 ("Merchant authentication failed").
    //
    // The Code 13 guard prevents the silent-failure mode where sandbox creds are accidentally
    // deployed to production (or vice versa) — corepay-api SKILL gotcha #6.

    import { gatewayFetch } from '@/lib/payments/corepay-gateway';

    interface AuthenticateTestResponse {
      messages: {
        resultCode: 'Ok' | 'Error';
        message: { code: string; text: string }[];
      };
    }

    async function validateCorepayCredentials(): Promise<void> {
      const apiLogin = process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID;
      const txnKey = process.env.COREPAY_TRANSACTION_KEY;

      if (!apiLogin || !txnKey) {
        // Dev/CI without secrets is acceptable; prod MUST have them set (separate ops concern).
        console.warn(
          '[instrumentation] CorePay credentials not configured (NEXT_PUBLIC_COREPAY_API_LOGIN_ID and/or COREPAY_TRANSACTION_KEY missing). Skipping authenticateTestRequest gate.',
        );
        return;
      }

      try {
        const response = await gatewayFetch<AuthenticateTestResponse>({
          authenticateTestRequest: {},
        });

        const code = response.messages.message?.[0]?.code || 'unknown';
        const text = response.messages.message?.[0]?.text || 'unknown';

        if (response.messages.resultCode !== 'Ok') {
          // Code 13 / E00007 = wrong creds (sandbox in prod or vice versa).
          // Refuse to start the app — fail loud, fail at boot, not later in production traffic.
          throw new Error(
            `[instrumentation] CorePay authenticateTestRequest FAILED: code=${code} text="${text}". ` +
            `This usually means sandbox credentials in production OR production credentials in sandbox. ` +
            `Verify NEXT_PUBLIC_COREPAY_API_LOGIN_ID and COREPAY_TRANSACTION_KEY against COREPAY_ENVIRONMENT (${process.env.COREPAY_ENVIRONMENT || 'sandbox'}). ` +
            `Refusing to start.`
          );
        }

        console.log(
          `[instrumentation] CorePay credentials validated: env=${process.env.COREPAY_ENVIRONMENT || 'sandbox'}, code=${code}`,
        );
      } catch (err) {
        // gatewayFetch throws on resultCode === 'Error' too; same outcome — refuse to start.
        throw err;
      }
    }

    export async function register(): Promise<void> {
      // Sentry init (per the wizard pattern — conditional require by runtime).
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
      }
      if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
      }

      // CorePay credential validation. Skip during Next.js build phase (no outbound calls during build).
      if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
        await validateCorepayCredentials();
      }
    }

    // Sentry's onRequestError export (wizard-generated; preserved).
    export const onRequestError = async (
      err: unknown,
      request: Request,
      errorContext: {
        routerKind: 'Pages Router' | 'App Router';
        routePath: string;
        routeType: 'render' | 'route' | 'action' | 'middleware';
      },
    ): Promise<void> => {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureRequestError(err, request, errorContext);
    };
    ```

    Notes:
    - Boot validation skipped during `npm run build` (NEXT_PHASE === 'phase-production-build') to avoid build-time outbound calls.
    - Boot validation skipped if creds are missing — dev/CI without secrets is acceptable.
    - `gatewayFetch` is imported via the path alias `@/lib/payments/corepay-gateway` (CLAUDE.md path alias rule).
    - The error message tells the operator how to debug Code 13: check the env vs COREPAY_ENVIRONMENT mismatch.
    - `onRequestError` preserved from the wizard install (used by Sentry's request error capture).

    Step 2 — Smoke-check compile:

    `npx tsc --noEmit instrumentation.ts`

    Step 3 — Local sanity (without sandbox creds set, the warning path is taken; the app starts):

    ```bash
    NEXT_PUBLIC_COREPAY_API_LOGIN_ID= COREPAY_TRANSACTION_KEY= timeout 10 npm run dev 2>&1 | grep -E "instrumentation|listening|Ready" | head -10
    ```

    Expected: warning line about credentials not configured. NO throw. App reaches "ready" / "listening" before timeout kills it.

    Do NOT call this with real production creds in dev. Sandbox creds only or nothing.
  </action>
  <verify>
    <automated>test -f instrumentation.ts && grep -q "export async function register" instrumentation.ts && grep -q "authenticateTestRequest" instrumentation.ts && grep -q "validateCorepayCredentials" instrumentation.ts && grep -q "Refusing to start" instrumentation.ts && grep -q "import.*gatewayFetch.*from '@/lib/payments/corepay-gateway'" instrumentation.ts && grep -q "sentry.server.config" instrumentation.ts && grep -q "phase-production-build" instrumentation.ts && npx tsc --noEmit instrumentation.ts</automated>
  </verify>
  <acceptance_criteria>
    - `test -f instrumentation.ts` exits 0
    - `grep -q "export async function register" instrumentation.ts` exits 0 (Next.js boot hook signature)
    - `grep -q "authenticateTestRequest" instrumentation.ts` exits 0 (PLB-11 — boot-time auth check)
    - `grep -q "validateCorepayCredentials" instrumentation.ts` exits 0
    - `grep -q "Refusing to start" instrumentation.ts` exits 0 (PLB-11 loud-failure semantics)
    - `grep -q "throw" instrumentation.ts` exits 0 (it actually throws on Code 13)
    - `grep -q "import.*gatewayFetch.*from '@/lib/payments/corepay-gateway'" instrumentation.ts` exits 0
    - `grep -q "sentry.server.config" instrumentation.ts` exits 0 (Sentry wired)
    - `grep -q "phase-production-build" instrumentation.ts` exits 0 (boot validation gated off during build)
    - `grep -q "captureRequestError" instrumentation.ts` exits 0 (Sentry request-error export preserved)
    - `npx tsc --noEmit instrumentation.ts` exits 0
  </acceptance_criteria>
  <done>
    instrumentation.ts has both Sentry register hook and CorePay authenticateTestRequest credential validation. Throws "Refusing to start" on Code 13. Skips during build phase and when creds are absent. Type-clean.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create app/api/admin/corepay-smoke/route.ts (PLB-13) — full sandbox round-trip with Sentry traces</name>
  <files>app/api/admin/corepay-smoke/route.ts</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-13 verbatim — round-trip steps: auth → CIM → ARB → cancel → refund)
    - .claude/skills/corepay-api/SKILL.md "Quick reference — operations" + the CIM create + ARB link code block
    - lib/payments/authorize-net-cim.ts (Plan 02 — createCustomerProfile, deleteCustomerProfile)
    - lib/payments/corepay-gateway.ts (createSubscription — already implemented; Plan 02 exported gatewayFetch)
    - lib/payments/authorize-net-arb.ts (Plan 02 — cancelSubscription)
    - lib/payments/authorize-net-charges.ts (Plan 02 — refundTransaction, voidTransaction, chargeCustomerProfile)
    - lib/auth.ts (admin auth pattern — find requireAdmin / verifyJwt / role-check helper)
    - app/api/admin/analytics/route.ts (existing admin route — pattern to mirror for auth check)
    - app/api/admin/club-orders/route.ts (another admin route example)
    - .planning/research/SANDBOX-GATE-RUNBOOK.md (the curl shapes are the reference for what the smoke route reproduces in TypeScript)
    - .planning/research/SUMMARY.md §4.5 (Fluid Compute 300s — sequential calls fit inline)
  </read_first>
  <action>
    Create `app/api/admin/corepay-smoke/route.ts`. The route mirrors `siphox-smoke` (mentioned in PLB-13) but for CorePay/Authorize.Net.

    First, READ `lib/auth.ts` to find the actual admin-auth helper (likely `requireAdmin` or similar). The exact import will look something like `import { requireAdmin } from '@/lib/auth';`. If the helper signature is different (e.g., returns a session vs throws on unauthorized), adapt the early-return pattern accordingly. The acceptance criteria use a generic `grep` for admin auth.

    File contents:

    ```typescript
    // app/api/admin/corepay-smoke/route.ts
    // Phase 7 PLB-13 — sandbox round-trip smoke route.
    // Admin-auth gated. Runs against the CorePay (Authorize.Net) sandbox:
    //   1. authenticateTestRequest      — credential sanity
    //   2. createCustomerProfile        — CIM customer + first payment profile from sandbox opaqueData (dataValue)
    //   3. addPaymentProfile            — DISTINCT second card on the same customer (Path B card update prep, uses dataValueSecondary)
    //   4. createSubscription (ARB)     — $1.00 sub starting +2 days, links CIM profile
    //   5. cancelSubscription           — clean teardown
    //   6. chargeCustomerProfile        — $1.00 charge against the secondary payment profile (proves Step 3 worked end-to-end)
    //   7. voidTransaction              — refund flow exercised (sandbox transactions stay unsettled — void is the right path)
    //   8. deleteCustomerProfile        — cleanup (per Q5 default — safe to delete in sandbox; cascades both payment profiles)
    //
    // Each step is wrapped in Sentry.startSpan() for trace observability — Phase 7 success criterion #5
    // requires that "Sentry receives the trace via the wizard-installed @sentry/nextjs".
    //
    // INPUT (POST body) — caller provides one or two fresh sandbox opaqueData tokens (15-min TTL each, single-use):
    //   { dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT', dataValue: '<token1>', dataValueSecondary?: '<token2>', email?: 'q-test@cultrhealth.com' }
    //   - dataValue: REQUIRED. Used by createCustomerProfile (Step 2) and createSubscription (Step 4).
    //   - dataValueSecondary: OPTIONAL but RECOMMENDED. Used by addPaymentProfile (Step 3) to add a distinct second card.
    //     If absent, Step 3 falls back to dataValue (sandbox accepts via gateway re-tokenization; production
    //     requires a fresh token because Accept.js opaqueData is single-use per corepay-api SKILL gotcha #3).
    //
    // OUTPUT — JSON with a step-by-step result array. On any failure, returns 500 with the failed-step name.

    import { type NextRequest, NextResponse } from 'next/server';
    import * as Sentry from '@sentry/nextjs';
    import { requireAdmin } from '@/lib/auth';
    import { gatewayFetch } from '@/lib/payments/corepay-gateway';
    import { createSubscription } from '@/lib/payments/corepay-gateway';
    import {
      createCustomerProfile,
      addPaymentProfile,
      deleteCustomerProfile,
    } from '@/lib/payments/authorize-net-cim';
    import { cancelSubscription } from '@/lib/payments/authorize-net-arb';
    import { chargeCustomerProfile, refundTransaction, voidTransaction } from '@/lib/payments/authorize-net-charges';

    export const dynamic = 'force-dynamic';
    export const runtime = 'nodejs';

    interface SmokeRequestBody {
      dataDescriptor?: string;
      dataValue?: string;
      dataValueSecondary?: string;
      email?: string;
    }

    interface SmokeStepResult {
      step: string;
      ok: boolean;
      duration_ms: number;
      summary?: Record<string, unknown>;
      error?: string;
    }

    async function runStep<T>(
      name: string,
      fn: () => Promise<T>,
      summarize: (result: T) => Record<string, unknown>,
    ): Promise<{ result: T; record: SmokeStepResult }> {
      return Sentry.startSpan({ name: `corepay-smoke:${name}`, op: 'corepay.smoke' }, async () => {
        const start = Date.now();
        try {
          const result = await fn();
          const duration = Date.now() - start;
          return {
            result,
            record: { step: name, ok: true, duration_ms: duration, summary: summarize(result) },
          };
        } catch (err) {
          const duration = Date.now() - start;
          throw {
            __smokeStepFailure: true,
            record: {
              step: name,
              ok: false,
              duration_ms: duration,
              error: err instanceof Error ? err.message : String(err),
            } as SmokeStepResult,
          };
        }
      });
    }

    export async function POST(request: NextRequest): Promise<NextResponse> {
      // Admin auth gate — refuse non-admin callers.
      try {
        await requireAdmin(request);
      } catch {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }

      // Refuse to run against production sandbox unless COREPAY_ENVIRONMENT === 'sandbox'.
      // Defense in depth: the smoke route creates real subscriptions and charges; a misconfigured
      // env could fire real charges against production.
      const env = process.env.COREPAY_ENVIRONMENT || 'sandbox';
      if (env !== 'sandbox') {
        return NextResponse.json(
          { error: 'corepay-smoke can only run when COREPAY_ENVIRONMENT=sandbox', env },
          { status: 400 },
        );
      }

      const body = (await request.json().catch(() => ({}))) as SmokeRequestBody;
      const dataDescriptor = body.dataDescriptor || 'COMMON.ACCEPT.INAPP.PAYMENT';
      const dataValue = body.dataValue;
      // Second token for explicit addPaymentProfile (Step 3). Falls back to dataValue with a warning
      // recorded in the step's summary so PLB-13 step 3 is always exercised distinctly.
      const dataValueSecondary = body.dataValueSecondary || dataValue;
      const usedFallbackTokenForAddProfile = !body.dataValueSecondary;
      const email = body.email || `corepay-smoke-${Date.now()}@cultrhealth.test`;

      if (!dataValue) {
        return NextResponse.json(
          { error: 'missing dataValue — supply a fresh sandbox Accept.js opaqueData token (15-min TTL)' },
          { status: 400 },
        );
      }

      const steps: SmokeStepResult[] = [];
      let cimCustomerId: string | undefined;
      let cimPaymentId: string | undefined;
      let arbSubscriptionId: string | undefined;
      let chargeTransId: string | undefined;

      try {
        // Step 1 — authenticateTestRequest (sanity check; same call instrumentation.ts uses at boot)
        const authResult = await runStep(
          'authenticateTestRequest',
          () => gatewayFetch<{ messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] } }>({
            authenticateTestRequest: {},
          }),
          (r) => ({ resultCode: r.messages.resultCode, code: r.messages.message?.[0]?.code }),
        );
        steps.push(authResult.record);

        // Step 2 — createCustomerProfile (burns the supplied opaqueData)
        const cimResult = await runStep(
          'createCustomerProfile',
          () => createCustomerProfile({
            merchantCustomerId: `smoke-${Date.now().toString(36)}`,
            email,
            opaqueData: { dataDescriptor, dataValue },
            description: 'PLB-13 smoke test',
          }),
          (r) => ({
            customerProfileId: r.customerProfileId,
            paymentProfileIds: r.customerPaymentProfileIdList,
            resultCode: r.messages.resultCode,
          }),
        );
        steps.push(cimResult.record);
        cimCustomerId = cimResult.result.customerProfileId;
        cimPaymentId = cimResult.result.customerPaymentProfileIdList?.[0];

        if (!cimCustomerId || !cimPaymentId) {
          throw new Error('createCustomerProfile did not return customer or payment profile id');
        }

        // Step 3 — addPaymentProfile (PLB-13 distinct step — adds a SECOND card to the existing customer).
        // Uses dataValueSecondary if supplied, else falls back to dataValue (sandbox-only — production
        // would refuse the second use because Accept.js opaqueData is single-use per SKILL gotcha #3).
        const addProfileResult = await runStep(
          'addPaymentProfile',
          () => addPaymentProfile({
            customerProfileId: cimCustomerId!,
            opaqueData: { dataDescriptor, dataValue: dataValueSecondary },
          }),
          (r) => ({
            customerPaymentProfileId: r.customerPaymentProfileId,
            resultCode: r.messages.resultCode,
            usedFallbackToken: usedFallbackTokenForAddProfile,
          }),
        );
        steps.push(addProfileResult.record);
        const cimPaymentIdSecondary = addProfileResult.result.customerPaymentProfileId;

        // Step 4 — createSubscription (ARB at $1.00, +2 days out so we don't accidentally trigger a sandbox charge)
        const startDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
        const arbResult = await runStep(
          'createSubscription',
          () => createSubscription({
            opaqueData: { dataDescriptor, dataValue },
            // NOTE: createSubscription currently uses opaqueData for ARB — Phase 7 PLB-06 follow-up
            // ticket should add a profile-based variant. For PLB-13 smoke we're testing the live path.
            amountCents: 100,
            subscriptionName: 'PLB-13 Smoke Sub',
            customerEmail: email,
            startDate,
          }),
          (r) => ({ subscriptionId: r.subscriptionId, resultCode: r.messages.resultCode }),
        );
        // NOTE: the live createSubscription call burns the same opaqueData token. Sandbox accepts this
        // because the gateway re-tokenizes server-side; in production we use the CIM profile reference
        // instead. PLB-13 documents the round-trip; PLB-06 covers the production pattern.
        steps.push(arbResult.record);
        arbSubscriptionId = arbResult.result.subscriptionId;

        if (!arbSubscriptionId) {
          throw new Error('createSubscription did not return subscriptionId');
        }

        // Step 5 — cancelSubscription
        const cancelResult = await runStep(
          'cancelSubscription',
          () => cancelSubscription({ subscriptionId: arbSubscriptionId! }),
          (r) => ({ resultCode: r.messages.resultCode, code: r.messages.message?.[0]?.code }),
        );
        steps.push(cancelResult.record);

        // Step 6 — chargeCustomerProfile $1.00 (so we have a transId to refund/void).
        // Uses the secondary payment profile if it was created in Step 3 (proves addPaymentProfile
        // worked end-to-end); otherwise falls back to the primary profile.
        const chargeProfileId = cimPaymentIdSecondary || cimPaymentId!;
        const chargeResult = await runStep(
          'chargeCustomerProfile',
          () => chargeCustomerProfile({
            amountCents: 100,
            customerProfileId: cimCustomerId!,
            customerPaymentProfileId: chargeProfileId,
            description: 'PLB-13 smoke charge',
          }),
          (r) => ({
            transId: r.transactionResponse?.transId,
            responseCode: r.transactionResponse?.responseCode,
            resultCode: r.messages.resultCode,
            chargedProfileId: chargeProfileId,
          }),
        );
        steps.push(chargeResult.record);
        chargeTransId = chargeResult.result.transactionResponse?.transId;

        // Step 7 — voidTransaction (sandbox transactions stay unsettled for hours; void is the right path)
        if (chargeTransId) {
          const voidResult = await runStep(
            'voidTransaction',
            () => voidTransaction({ refTransId: chargeTransId! }),
            (r) => ({
              transId: r.transactionResponse?.transId,
              responseCode: r.transactionResponse?.responseCode,
            }),
          );
          steps.push(voidResult.record);
        }

        // Step 8 — deleteCustomerProfile (cleanup per Q5 default — sandbox cleanup, never on prod).
        // Cascades both payment profiles (primary from Step 2 + secondary from Step 3).
        const deleteResult = await runStep(
          'deleteCustomerProfile',
          () => deleteCustomerProfile({ customerProfileId: cimCustomerId! }),
          (r) => ({ resultCode: r.messages.resultCode }),
        );
        steps.push(deleteResult.record);

        return NextResponse.json({
          ok: true,
          env,
          steps,
        });
      } catch (errAny) {
        // Step failure path — record the failed step then attempt teardown.
        const failure = errAny as { __smokeStepFailure?: boolean; record?: SmokeStepResult };
        if (failure?.__smokeStepFailure && failure.record) {
          steps.push(failure.record);
        } else {
          steps.push({
            step: 'unknown',
            ok: false,
            duration_ms: 0,
            error: errAny instanceof Error ? errAny.message : String(errAny),
          });
        }

        // Best-effort teardown so we don't leak sandbox subscriptions
        if (arbSubscriptionId) {
          try { await cancelSubscription({ subscriptionId: arbSubscriptionId }); } catch (e) {
            console.warn('[corepay-smoke] cleanup cancelSubscription failed', e instanceof Error ? e.message : e);
          }
        }
        if (cimCustomerId) {
          try { await deleteCustomerProfile({ customerProfileId: cimCustomerId }); } catch (e) {
            console.warn('[corepay-smoke] cleanup deleteCustomerProfile failed', e instanceof Error ? e.message : e);
          }
        }

        Sentry.captureException(errAny, {
          tags: { route: 'corepay-smoke', failed_step: steps[steps.length - 1]?.step || 'unknown' },
        });

        return NextResponse.json({ ok: false, env, steps }, { status: 500 });
      }
    }

    // GET returns a usage doc — no live calls. Lets admins verify the route is registered.
    export async function GET(request: NextRequest): Promise<NextResponse> {
      try {
        await requireAdmin(request);
      } catch {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      return NextResponse.json({
        route: 'POST /api/admin/corepay-smoke',
        env: process.env.COREPAY_ENVIRONMENT || 'sandbox',
        body: {
          dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
          dataValue: '<fresh sandbox opaqueData token #1>',
          dataValueSecondary: '<fresh sandbox opaqueData token #2 — optional but recommended>',
          email: 'optional',
        },
        steps: [
          'authenticateTestRequest',
          'createCustomerProfile (uses dataValue, creates customer + 1st payment profile)',
          'addPaymentProfile (uses dataValueSecondary if supplied else dataValue, adds 2nd payment profile)',
          'createSubscription (ARB at $1, +2 days)',
          'cancelSubscription',
          'chargeCustomerProfile ($1, against the 2nd payment profile when present)',
          'voidTransaction',
          'deleteCustomerProfile (cascades both payment profiles)',
        ],
      });
    }
    ```

    Notes for executor:
    - If `lib/auth.ts` has a different admin gate (e.g., `verifyAdminSession`, `requireRole('admin')`), substitute that import and call. The acceptance criteria check for an admin-auth-related import + early-return on unauthorized.
    - The smoke route refuses to run unless `COREPAY_ENVIRONMENT === 'sandbox'`. Defense in depth — even if creds were accidentally prod, the env check stops the route from creating live charges.
    - Each step is wrapped in `Sentry.startSpan({ name, op })` per PLB-13's "Sentry receives the trace" requirement.
    - On failure, the route attempts teardown (cancel sub + delete CIM) so sandbox doesn't accumulate cruft.
    - **PLB-13 step 3 (addPaymentProfile) is exercised distinctly.** The route accepts `dataValueSecondary` (optional, recommended) so addPaymentProfile uses a fresh token to add a *second* card to the existing customer. If absent, the route falls back to `dataValue` and records `usedFallbackToken: true` in the step summary so operators can see PLB-13 step 3 ran but with sandbox-only token re-tokenization (production would refuse — Accept.js opaqueData is single-use per corepay-api SKILL gotcha #3). The subsequent `chargeCustomerProfile` charges against the second payment profile when present, end-to-end-proving that addPaymentProfile created a usable card.
    - Generating two opaqueData tokens for the operator: use the Authorize.Net Accept.js sample at https://developer.authorize.net/api/reference/index.html#payment-transactions twice with different test card numbers (e.g., 4111111111111111 and 5424000000000015), or run two tokenizations in the merchant interface's "API Test Tools."
  </action>
  <verify>
    <automated>npx tsc --noEmit app/api/admin/corepay-smoke/route.ts && grep -q "export async function POST" app/api/admin/corepay-smoke/route.ts && grep -q "export async function GET" app/api/admin/corepay-smoke/route.ts && grep -q "Sentry.startSpan" app/api/admin/corepay-smoke/route.ts && grep -q "authenticateTestRequest" app/api/admin/corepay-smoke/route.ts && grep -q "createCustomerProfile" app/api/admin/corepay-smoke/route.ts && grep -q "addPaymentProfile" app/api/admin/corepay-smoke/route.ts && grep -q "createSubscription" app/api/admin/corepay-smoke/route.ts && grep -q "cancelSubscription" app/api/admin/corepay-smoke/route.ts && grep -qE "voidTransaction|refundTransaction" app/api/admin/corepay-smoke/route.ts && grep -q "deleteCustomerProfile" app/api/admin/corepay-smoke/route.ts && grep -qE "requireAdmin|verifyAdmin|require\(.*admin" app/api/admin/corepay-smoke/route.ts && grep -q "COREPAY_ENVIRONMENT" app/api/admin/corepay-smoke/route.ts && grep -q "dataValueSecondary" app/api/admin/corepay-smoke/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - `app/api/admin/corepay-smoke/route.ts` exists
    - `grep -q "export async function POST" app/api/admin/corepay-smoke/route.ts` exits 0 (POST runs the round-trip)
    - `grep -q "export async function GET" app/api/admin/corepay-smoke/route.ts` exits 0 (GET returns usage doc; verifies route registration)
    - Admin-auth gate present: `grep -qE "requireAdmin|verifyAdmin|requireRole.*admin" app/api/admin/corepay-smoke/route.ts` exits 0 (whatever admin helper exists in lib/auth.ts)
    - `grep -q "Sentry.startSpan" app/api/admin/corepay-smoke/route.ts` exits 0 (PLB-13 — Sentry trace per step)
    - `grep -q "authenticateTestRequest" app/api/admin/corepay-smoke/route.ts` exits 0 (step 1)
    - `grep -q "createCustomerProfile" app/api/admin/corepay-smoke/route.ts` exits 0 (step 2)
    - `grep -q "addPaymentProfile" app/api/admin/corepay-smoke/route.ts` exits 0 (step 3 — distinct call per PLB-13)
    - `grep -q "dataValueSecondary" app/api/admin/corepay-smoke/route.ts` exits 0 (second token plumbed end-to-end)
    - `grep -q "createSubscription" app/api/admin/corepay-smoke/route.ts` exits 0 (step 4 — ARB at $1)
    - `grep -q "amountCents: 100" app/api/admin/corepay-smoke/route.ts` exits 0 ($1 sub per PLB-13)
    - `grep -q "cancelSubscription" app/api/admin/corepay-smoke/route.ts` exits 0 (step 5 — clean teardown)
    - `grep -q "chargeCustomerProfile" app/api/admin/corepay-smoke/route.ts` exits 0 (step 6 — charges against the secondary profile to prove Step 3)
    - `grep -qE "voidTransaction|refundTransaction" app/api/admin/corepay-smoke/route.ts` exits 0 (step 7 — refund flow)
    - `grep -q "deleteCustomerProfile" app/api/admin/corepay-smoke/route.ts` exits 0 (step 8 — cleanup)
    - `grep -q "COREPAY_ENVIRONMENT" app/api/admin/corepay-smoke/route.ts` exits 0 (env check refuses to run on production)
    - `grep -q "Sentry.captureException" app/api/admin/corepay-smoke/route.ts` exits 0 (failures surface in Sentry)
    - `grep -qE "from '@/lib/payments/authorize-net-cim'" app/api/admin/corepay-smoke/route.ts` exits 0 (uses Plan 02 helpers)
    - `grep -qE "from '@/lib/payments/authorize-net-arb'" app/api/admin/corepay-smoke/route.ts` exits 0
    - `grep -qE "from '@/lib/payments/authorize-net-charges'" app/api/admin/corepay-smoke/route.ts` exits 0
    - `npx tsc --noEmit app/api/admin/corepay-smoke/route.ts` exits 0
    - End-to-end run (manual, dev shell, valid sandbox creds + two fresh opaqueData tokens):
      ```bash
      curl -X POST http://localhost:3000/api/admin/corepay-smoke \
        -H "Content-Type: application/json" -H "Cookie: <admin session cookie>" \
        -d '{"dataValue":"<fresh opaqueData #1>","dataValueSecondary":"<fresh opaqueData #2>"}' \
        | jq '.steps[] | {step, ok, duration_ms}'
      ```
      Expected output: 8 steps, all `ok: true`. The `addPaymentProfile` step's summary should show `usedFallbackToken: false` when `dataValueSecondary` is supplied. (The end-to-end run is OPTIONAL acceptance — record results in plan summary if executed.)
  </acceptance_criteria>
  <done>
    Smoke route created with admin-auth gate, COREPAY_ENVIRONMENT=sandbox-only check, Sentry.startSpan around each of 8 steps (auth → createCust → addPaymentProfile → ARB → cancel → charge → void → delete), captures exceptions to Sentry, attempts teardown on failure. PLB-13 step 3 (addPaymentProfile) is exercised distinctly via the optional `dataValueSecondary` request body field. Type-clean. End-to-end sandbox run is optional (gated on availability of sandbox creds + 2 opaqueData tokens).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Vercel boot → instrumentation.ts | First code that runs per cold start; refuses to start app on Code 13 |
| Sentry SDK → Sentry servers | Outbound HTTPS; PHI MUST be scrubbed by beforeSend before transmission |
| admin → /api/admin/corepay-smoke | Authenticated admin only; further gated on COREPAY_ENVIRONMENT=sandbox |
| smoke route → CorePay sandbox | Outbound HTTPS to apitest.authorize.net; sandbox creds only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-18 | Spoofing | Sandbox creds deployed to production environment (or vice versa) | mitigate | PLB-11 instrumentation.ts calls authenticateTestRequest at boot. On Code 13 / E00007, throws "Refusing to start" — Vercel halts boot. Without this gate, the silent-fail mode produces hard-to-diagnose webhook errors weeks later. |
| T-07-19 | Information Disclosure | PHI in Sentry breadcrumbs / scope / request body sent to Sentry servers | mitigate | sentry.server.config.ts + sentry.client.config.ts beforeSend hooks: redact PHI_EXACT keys (email, dob, address, name, ssn, memberId) and PHI_PREFIXES (biomarker_, medical_, healthie_, siphox_, lab_, prescription_, intake_) recursively from event.user, event.contexts, event.breadcrumbs, event.request.data, event.extra. Also strips cookie/authorization headers. |
| T-07-20 | Information Disclosure | Sentry session replay records member browsing + form input (HIPAA breach) | mitigate | sentry.client.config.ts sets replaysSessionSampleRate=0 AND replaysOnErrorSampleRate=0. No session replay data ever captured. |
| T-07-21 | Information Disclosure | Sentry trace samples 100% of requests, capturing request bodies with PHI | mitigate | tracesSampleRate=0.1 (10% sample) reduces PHI exposure surface. Combined with beforeSend scrubbing, the residual risk is acceptable per Q3 resolution. |
| T-07-22 | Tampering | smoke route invoked by non-admin or scripted attacker creating ARB sandbox subs to cause merchant-account warnings/lockout | mitigate | requireAdmin gate (mirrors existing admin route auth). Returns 401 on unauthorized. |
| T-07-23 | Elevation of Privilege | smoke route accidentally creates real charges against production by misreading env | mitigate | Defense in depth: route refuses to run unless `COREPAY_ENVIRONMENT === 'sandbox'`. PLB-11 boot validation already would have refused to start the app if creds-vs-env mismatched. |
| T-07-24 | Denial of Service | smoke route called rapidly to exhaust Authorize.Net sandbox rate limit | accept | Admin-only access; admin set is small (≤5 people per CLAUDE.md owner email list). If abused, mitigation is rate limiting (deferred to a future hardening phase — HRD-13). |
| T-07-25 | Tampering | Sandbox subscriptions/customer profiles leaked from failed smoke runs accumulate, eventually rate-limiting the sandbox account | mitigate | smoke route catch block attempts cancelSubscription + deleteCustomerProfile teardown. Best-effort; logs warnings via console.warn (not Sentry — not PHI-relevant). |
| T-07-26 | Spoofing | An attacker bypasses requireAdmin via a CSRF or session-fixation attack to fire the smoke route | mitigate | Existing admin auth uses HttpOnly cookie + same-site policy (per CLAUDE.md ghost-session rule). The route inherits that protection. CSRF is a layer below this plan's scope. |
| T-07-27 | Information Disclosure | Sentry source maps uploaded with build leak server-side code paths | mitigate | next.config.js withSentryConfig sets `hideSourceMaps: true` — source maps uploaded to Sentry but stripped from the public build artifacts. |
| T-07-28 | Tampering | Wizard-installed instrumentation.ts overwrites our PLB-11 logic on a future Sentry SDK upgrade | accept | Documented in this plan; future Sentry upgrades MUST manually preserve the validateCorepayCredentials block. The CI / type-check would surface a regression (the function would just be missing). |
</threat_model>

<verification>
**Plan-level verification (run after all 3 tasks complete):**

1. Sentry installed:
   ```bash
   grep -q '"@sentry/nextjs":' package.json
   node -e "const v=require('./package.json').dependencies['@sentry/nextjs'];const n=v.replace(/^[\^~]/,'').split('.').map(Number);process.exit((n[0]>10||(n[0]===10&&n[1]>=50))?0:1)"
   ```
   Both exit 0.

2. All 5 new TypeScript files exist + type-clean:
   ```bash
   ls instrumentation.ts sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts app/api/admin/corepay-smoke/route.ts
   npx tsc --noEmit instrumentation.ts sentry.server.config.ts sentry.client.config.ts sentry.edge.config.ts app/api/admin/corepay-smoke/route.ts
   ```

3. PHI scrubbing present in both client + server Sentry configs:
   ```bash
   grep -q "scrubPhi\|isPhiKey" sentry.server.config.ts
   grep -q "scrubPhi\|isPhiKey" sentry.client.config.ts
   ```

4. next.config.js wrapped:
   ```bash
   grep -q "withSentryConfig" next.config.js
   ```

5. instrumentation.ts has both Sentry init + CorePay validation:
   ```bash
   grep -q "sentry.server.config" instrumentation.ts
   grep -q "authenticateTestRequest" instrumentation.ts
   grep -q "Refusing to start" instrumentation.ts
   ```

6. Smoke route hits all 8 PLB-13 steps (addPaymentProfile is distinct from createCustomerProfile):
   ```bash
   for op in authenticateTestRequest createCustomerProfile addPaymentProfile createSubscription cancelSubscription chargeCustomerProfile voidTransaction deleteCustomerProfile; do
     grep -q "$op" app/api/admin/corepay-smoke/route.ts || echo "MISSING: $op"
   done
   ```
   Expected: no MISSING lines.

7. Smoke route admin-gated + sandbox-gated:
   ```bash
   grep -qE "requireAdmin|verifyAdmin|requireRole" app/api/admin/corepay-smoke/route.ts
   grep -q "COREPAY_ENVIRONMENT" app/api/admin/corepay-smoke/route.ts
   ```

8. Build still works:
   ```bash
   npm run build 2>&1 | tail -20
   ```
   Should complete (warnings about unset SENTRY_DSN acceptable in dev; production deploy will have it set).

9. (Optional, gated on sandbox creds + two fresh opaqueData tokens) End-to-end smoke run:
   ```bash
   curl -X POST http://localhost:3000/api/admin/corepay-smoke \
     -H "Content-Type: application/json" -H "Cookie: <admin session>" \
     -d '{"dataValue":"<fresh opaqueData #1>","dataValueSecondary":"<fresh opaqueData #2>"}' \
     | jq '.ok, .steps[] | .step + ":" + (.ok|tostring)'
   ```
   All 8 steps `:true`, top-level `ok: true`. Single-token runs (omit `dataValueSecondary`) still execute Step 3 but record `usedFallbackToken: true` in the summary.
</verification>

<success_criteria>
- @sentry/nextjs ^10.50.0+ installed
- Three sentry.*.config.ts files exist with PHI-scrubbing beforeSend (server + client)
- next.config.js wrapped with withSentryConfig (preserving all existing settings)
- instrumentation.ts initializes Sentry AND runs authenticateTestRequest at boot
- instrumentation.ts throws "Refusing to start" on Code 13 (sandbox-creds-in-prod / vice versa)
- app/api/admin/corepay-smoke/route.ts exists, admin-gated, sandbox-only, runs 8 steps each wrapped in Sentry.startSpan
- All TypeScript files type-clean
- All `<acceptance_criteria>` automated checks pass on every task
- (Optional) End-to-end sandbox round-trip succeeds when sandbox creds + opaqueData are available
</success_criteria>

<output>
After completion, create `.planning/phases/07-schema-gateway-plumbing/07-03-SUMMARY.md` documenting:
- @sentry/nextjs version installed (from package.json after wizard)
- Confirmation that PHI-scrubbing beforeSend hooks are present in BOTH server and client configs
- Confirmation that next.config.js was wrapped with withSentryConfig (and any previous wraps composed correctly)
- instrumentation.ts content verified to throw on Code 13
- Smoke route file path + line count
- Optional: results from a sandbox round-trip if executed (step-by-step ok/duration)
- Any deviations from plan
</output>
