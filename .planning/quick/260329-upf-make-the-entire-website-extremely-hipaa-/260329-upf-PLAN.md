---
phase: quick
plan: 260329-upf
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/hipaa-logger.ts
  - lib/resend.ts
  - lib/auth.ts
  - lib/quickbooks.ts
  - app/api/auth/verify/route.ts
  - app/api/auth/magic-link/route.ts
  - app/api/webhook/stripe/route.ts
  - app/api/creators/verify-login/route.ts
  - app/api/creators/apply/route.ts
  - app/api/creators/magic-link/route.ts
  - app/api/club/orders/route.ts
  - app/api/admin/orders/[orderNumber]/fulfill/route.ts
  - app/api/intake/submit/route.ts
  - app/api/intake/upload/route.ts
  - app/api/renewal/check/route.ts
  - app/api/renewal/submit/route.ts
  - app/api/checkout/route.ts
  - app/api/checkout/subscription/route.ts
  - app/api/checkout/authorize-net/route.ts
  - app/api/checkout/authorize-net/product/route.ts
  - app/api/checkout/corepay/route.ts
  - app/api/checkout/nowpayments/route.ts
  - app/api/checkout/product/route.ts
  - app/api/member/medical-records/route.ts
  - app/api/protocol/generate/route.ts
  - app/api/intake/questions/route.ts
  - app/api/meal-plan/route.ts
  - next.config.js
  - middleware.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "No PHI (email, phone, name, DOB, address) appears in any server log output"
    - "Client-facing error responses never expose internal error details (DB errors, API keys, stack traces)"
    - "Security headers include Content-Security-Policy"
    - "Session tokens have reduced lifetime and idle timeout protection"
  artifacts:
    - path: "lib/hipaa-logger.ts"
      provides: "PHI-safe logging utility that redacts emails, phones, names"
    - path: "next.config.js"
      provides: "CSP header, additional HIPAA-required security headers"
    - path: "middleware.ts"
      provides: "Session activity tracking for idle timeout"
  key_links:
    - from: "lib/hipaa-logger.ts"
      to: "all API routes"
      via: "import { safeLog } from '@/lib/hipaa-logger'"
      pattern: "safeLog\\."
    - from: "next.config.js"
      to: "all responses"
      via: "security headers"
      pattern: "Content-Security-Policy"
---

<objective>
Comprehensive HIPAA hardening across the entire CULTR Health website.

Purpose: The platform handles PHI (Protected Health Information) -- medical intake forms, prescriptions, health records, patient communications. HIPAA requires administrative, technical, and physical safeguards. This plan addresses the three most critical technical gaps: PHI leaking into logs, internal error details exposed to clients, and missing security headers.

Output: PHI-safe logging utility, sanitized error responses across all API routes, CSP and hardened security headers, session idle timeout.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@lib/auth.ts
@lib/resend.ts
@middleware.ts
@next.config.js
@app/api/intake/submit/route.ts
@app/api/auth/verify/route.ts
@app/api/webhook/stripe/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PHI-safe logging utility and purge PHI from all server logs</name>
  <files>
    lib/hipaa-logger.ts,
    lib/resend.ts,
    lib/auth.ts,
    lib/quickbooks.ts,
    app/api/auth/verify/route.ts,
    app/api/auth/magic-link/route.ts,
    app/api/webhook/stripe/route.ts,
    app/api/creators/verify-login/route.ts,
    app/api/creators/apply/route.ts,
    app/api/creators/magic-link/route.ts,
    app/api/club/orders/route.ts,
    app/api/admin/orders/[orderNumber]/fulfill/route.ts,
    app/api/intake/submit/route.ts
  </files>
  <action>
**1. Create `lib/hipaa-logger.ts`** -- a PHI-safe logging module:

```typescript
/**
 * HIPAA-compliant logger. Redacts PHI before any console output.
 * RULE: Never log email, phone, name, DOB, SSN, address, or medical data.
 * Use this instead of raw console.log/error/warn in all API routes.
 */

// Redaction patterns: emails, phone numbers, names in known log shapes
function redactPhi(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') return redactString(arg);
    if (arg && typeof arg === 'object') return redactObject(arg as Record<string, unknown>);
    return arg;
  });
}

function redactString(s: string): string {
  // Redact email addresses
  s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  // Redact phone numbers (various formats)
  s = s.replace(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g, '[REDACTED_PHONE]');
  return s;
}

// PHI field names to redact in objects
const PHI_FIELDS = new Set([
  'email', 'phone', 'phoneNumber', 'phone_number', 'phoneE164',
  'firstName', 'lastName', 'first_name', 'last_name', 'name', 'displayName',
  'dateOfBirth', 'dob', 'date_of_birth',
  'ssn', 'social_security',
  'address', 'address1', 'address2', 'shippingAddress',
  'city', 'zipCode', 'zip_code',
  'custEmail', 'customerEmail', 'customer_email',
  'patientName', 'providerName',
]);

function redactObject(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 3) return { '[REDACTED_DEEP]': true };
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PHI_FIELDS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const safeLog = {
  info: (...args: unknown[]) => console.log(...redactPhi(args)),
  warn: (...args: unknown[]) => console.warn(...redactPhi(args)),
  error: (...args: unknown[]) => console.error(...redactPhi(args)),
};
```

**2. Replace PHI-leaking console statements across all files.** The audit found 40+ instances. Here are the specific changes per file:

**`lib/resend.ts`** (~20 instances):
- Every `console.log('... email sent:', { email, ... })` -- replace `email` with `'[sent]'` or remove the email field entirely. Example: `console.log('Welcome email sent:', { email, planName })` becomes `console.log('Welcome email sent:', { planName })`. Do NOT import safeLog here -- just remove the email field from the log objects since these are simple success confirmations. Keep error logs but strip email: `console.error('Welcome email error:', error)` is fine (no PHI). For the ~5 lines that log `{ email, orderNumber }`, keep `orderNumber` but drop `email`.
- `lib/resend.ts:1302` logs `{ email, orderNumber, carrier, trackingNumber }` -- remove `email`, keep rest.

**`lib/auth.ts`** (2 instances):
- Line 374: `console.error('[auth] Creator DB lookup failed for:', auth.email, dbError)` -- change to `console.error('[auth] Creator DB lookup failed', dbError instanceof Error ? dbError.message : 'Unknown')`
- Line 381: `console.warn('[auth] staging_creator fallback for team email:', auth.email, ...)` -- change to `console.warn('[auth] staging_creator fallback used -- dashboard will show no real data')`

**`lib/quickbooks.ts`** (3 instances):
- Line 219: `console.log('[quickbooks] Found existing customer by email:', existing.Id)` -- change to `console.log('[quickbooks] Found existing customer:', existing.Id)`
- Line 238: `console.log('[quickbooks] Creating new customer for:', email)` -- change to `console.log('[quickbooks] Creating new customer')`
- Line 232 is fine (logs by name, not email) -- but change `console.log('[quickbooks] Found existing customer by name:', existing.Id)` to just `console.log('[quickbooks] Found existing customer by name match:', existing.Id)` (no change needed, Id is safe).

**`app/api/auth/verify/route.ts`** (2 instances):
- Line 88: `console.log('Staging admin access granted:', { email, timestamp: ... })` -- remove `email` field: `console.log('Staging admin access granted:', { timestamp: new Date().toISOString() })`
- Line 129-133: `console.log('Session created:', { email, customerId, timestamp })` -- remove `email`: `console.log('Session created:', { customerId, timestamp: new Date().toISOString() })`

**`app/api/webhook/stripe/route.ts`** (5+ instances):
- Line 348: `console.log('Welcome email sent to:', custEmail)` -- change to `console.log('Welcome email sent for subscription:', subscriptionId)` (or just `console.log('Welcome email sent')`)
- Line 599: `console.log('Order confirmation with LMN sent:', { email: customerEmail })` -- change to `console.log('Order confirmation with LMN sent')`
- Line 618: `console.log('Order confirmation sent:', { email: customerEmail })` -- change to `console.log('Order confirmation sent')`
- Other error logs in this file that mention "email" in the context of "failed to send email" are fine -- they describe the action, not the data.

**`app/api/creators/verify-login/route.ts`** (1 instance):
- Line 113: `console.log('Auto-created staging creator:', { email, creatorId, membershipCode, productCode })` -- remove `email`: `console.log('Auto-created staging creator:', { creatorId, membershipCode, productCode })`

**`app/api/creators/apply/route.ts`** (2 instances):
- Line 151: `console.log('Creator auto-approved: ${email}')` -- change to `console.log('Creator auto-approved:', creatorId || 'new')`
- Line 179: `console.log('Creator application submitted: ${email}')` -- change to `console.log('Creator application submitted')`

**`app/api/creators/magic-link/route.ts`** (1 instance):
- `console.error('Failed to send creator magic link email:', emailError)` -- this is fine (logs the error, not the email address).

**`app/api/club/orders/route.ts`** (1 instance):
- Line 315: `console.warn('[club/orders] Partial email failure for', orderNumber, { customerEmailSent, adminEmailSent })` -- this is fine (orderNumber + booleans, no PHI).

**`app/api/admin/orders/[orderNumber]/fulfill/route.ts`** (1 instance):
- Line 116: `console.log('Shipping notification sent:', { email: order.customer_email, orderNumber })` -- remove email: `console.log('Shipping notification sent:', { orderNumber })`

**`lib/mailchimp.ts`** (2 instances):
- Line 69: `console.error('[mailchimp] Sync failed:', { email: opts.email, error })` -- remove email: `console.error('[mailchimp] Sync failed:', { error })`
- Line 102: `console.error('[mailchimp] Tag failed:', { email, tags, error })` -- remove email: `console.error('[mailchimp] Tag failed:', { tags, error })`

**`app/api/intake/submit/route.ts`** (1 instance):
- Line 302: `console.error('Failed to update database:', dbError instanceof Error ? dbError.message : 'Unknown error')` -- this is fine (no PHI).

**3. Update `code-audit.sh` PHI patterns** to also flag `console.*email` and `console.*phone` patterns (currently only checks for patient/ssn/dob/medical/diagnosis/prescription).

In `.claude/hooks/code-audit.sh`, expand the PHI_PATTERNS grep on line 48 to:
```bash
PHI_PATTERNS=$(grep -n -i "console\.\(log\|warn\|error\).*\(patient\|ssn\|dob\|date.of.birth\|social.security\|medical\|diagnosis\|prescription\|\.email\|\.phone\|firstName\|lastName\|dateOfBirth\|shippingAddress\)" "$FILE" 2>/dev/null | head -5)
```
  </action>
  <verify>
    <automated>grep -rn "console\.\(log\|warn\|error\).*\(email\|phone\|firstName\|lastName\|dateOfBirth\)" lib/resend.ts lib/auth.ts lib/quickbooks.ts app/api/auth/verify/route.ts app/api/webhook/stripe/route.ts app/api/creators/verify-login/route.ts app/api/creators/apply/route.ts app/api/admin/orders/\[orderNumber\]/fulfill/route.ts lib/mailchimp.ts 2>/dev/null | grep -v "REDACTED\|emailError\|emailErr\|email_error\|send.*email\|email.*sent\|email.*failed\|Failed to send" | wc -l | xargs test 0 -eq</automated>
  </verify>
  <done>Zero PHI fields (email, phone, name, DOB, address) appear in any console.log/warn/error call across all API routes and library files. The hipaa-logger.ts utility exists for any future logging needs. The code-audit.sh hook catches new PHI logging violations.</done>
</task>

<task type="auto">
  <name>Task 2: Sanitize all client-facing error responses and add security headers</name>
  <files>
    app/api/intake/submit/route.ts,
    app/api/intake/upload/route.ts,
    app/api/intake/questions/route.ts,
    app/api/renewal/check/route.ts,
    app/api/renewal/submit/route.ts,
    app/api/checkout/route.ts,
    app/api/checkout/subscription/route.ts,
    app/api/checkout/authorize-net/route.ts,
    app/api/checkout/authorize-net/product/route.ts,
    app/api/checkout/corepay/route.ts,
    app/api/checkout/nowpayments/route.ts,
    app/api/checkout/product/route.ts,
    app/api/protocol/generate/route.ts,
    app/api/meal-plan/route.ts,
    app/api/member/medical-records/route.ts,
    next.config.js,
    middleware.ts
  </files>
  <action>
**Part A: Sanitize error responses**

Create a helper in `lib/hipaa-logger.ts` (same file from Task 1):

```typescript
/**
 * Return a safe, generic error message for client responses.
 * NEVER expose error.message to clients -- it may contain DB schema,
 * API keys, internal URLs, or PHI from query parameters.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  // Log the real error server-side (redacted)
  safeLog.error('[API Error]', error instanceof Error ? error.message : String(error));
  // Return generic message to client
  return fallback;
}
```

Then update each file that returns `error.message` or `errorMessage` (derived from `error.message`) to clients:

**Pattern to find and fix:** `const errorMessage = error instanceof Error ? error.message : '...'` followed by `return NextResponse.json({ ... error: errorMessage }, { status: 500 })`.

Replace with: `return NextResponse.json({ success: false, error: 'GENERIC_MESSAGE' }, { status: 500 })` where GENERIC_MESSAGE is a static, context-appropriate string.

Specific files and their generic messages:

| File | Current error leak | Replace with |
|------|-------------------|--------------|
| `app/api/renewal/check/route.ts:70` | `error.message` | `'Unable to check eligibility. Please try again.'` |
| `app/api/renewal/submit/route.ts:156` | `error.message` | `'Unable to submit renewal. Please try again.'` |
| `app/api/checkout/route.ts:155` | `error.message` | `'Checkout failed. Please try again.'` |
| `app/api/checkout/subscription/route.ts:134` | `error.message` | `'Unable to create checkout session. Please try again.'` |
| `app/api/checkout/authorize-net/route.ts:148` | `error.message` | `'Payment processing failed. Please try again.'` |
| `app/api/checkout/authorize-net/product/route.ts:206` | `error.message` | `'Payment processing failed. Please try again.'` |
| `app/api/checkout/corepay/route.ts:114` | `error.message` | `'Payment processing failed. Please try again.'` |
| `app/api/checkout/nowpayments/route.ts:109` | `error.message` | `'Unable to create payment. Please try again.'` |
| `app/api/checkout/product/route.ts:129` | `error.message` | `'Checkout failed. Please try again.'` |
| `app/api/protocol/generate/route.ts:155` | `error.message` | `'Protocol generation failed. Please try again.'` |
| `app/api/intake/submit/route.ts:386` | `error.message` | `'Unable to submit intake form. Please try again or contact support.'` |
| `app/api/intake/upload/route.ts:114` | `error.message` | `'File upload failed. Please try again.'` |
| `app/api/intake/questions/route.ts:31` | `error.message` | `'Unable to load questions. Please refresh.'` |
| `app/api/meal-plan/route.ts:43` | `error.message` (raw) | `'Unable to generate meal plan. Please try again.'` |

Keep `console.error` with the real error for server-side debugging (but make sure it doesn't contain PHI -- per Task 1 fixes). The key change is: **never return `error.message` in the HTTP response body**.

Also check `app/api/intake/upload/route.ts:107` which returns `message: error instanceof Error ? error.message : String(error)` in the response -- replace with generic message.

**Part B: Add Content-Security-Policy and additional HIPAA headers**

In `next.config.js`, add these headers to the existing `/(.*)`  security headers block:

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.curator.io https://js.stripe.com https://cdn1.affirm.com https://x.klarnacdn.net https://cdn.daily.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.curator.io",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://*.curator.io https://*.daily.co https://*.siphox.com wss://*.daily.co",
    "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://cdn1.affirm.com https://x.klarnacdn.net https://*.daily.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
  ].join('; '),
},
```

Note: `'unsafe-inline'` and `'unsafe-eval'` are required for Next.js. The CSP is still valuable because it blocks unexpected script sources, restricts frame-ancestors (clickjacking), object-src, and form-action.

Also add to the `/(.*)`  headers:
```javascript
{ key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
```

**Part C: Add session idle timeout via middleware**

In `middleware.ts`, add session activity tracking. After the join.cultrhealth.com rewrite block, add logic for authenticated routes:

```typescript
// Session idle timeout for HIPAA compliance (30 min inactivity)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const authenticatedPrefixes = ['/members', '/intake', '/dashboard', '/admin', '/provider', '/creators/portal'];
const isAuthRoute = authenticatedPrefixes.some(p => request.nextUrl.pathname.startsWith(p));

if (isAuthRoute) {
  const sessionCookie = request.cookies.get('cultr_session');
  const lastActivity = request.cookies.get('cultr_last_activity')?.value;

  if (sessionCookie && lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed > IDLE_TIMEOUT_MS) {
      // Session idle too long -- clear and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('reason', 'session_timeout');
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('cultr_session');
      response.cookies.delete('cultr_last_activity');
      return response;
    }
  }

  // Update last activity timestamp
  if (sessionCookie) {
    const response = NextResponse.next();
    const domain = request.headers.get('host')?.includes('cultrhealth.com')
      ? '.cultrhealth.com'
      : undefined;
    response.cookies.set('cultr_last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h (cookie itself doesn't expire, value is checked)
      path: '/',
      ...(domain ? { domain } : {}),
    });
    return response;
  }
}
```

Also reduce the session JWT expiry from 7 days to 24 hours in `lib/auth.ts` line 62: change `.setExpirationTime('7d')` to `.setExpirationTime('24h')`. And update the cookie `maxAge` on line 101 from `60 * 60 * 24 * 7` (7 days) to `60 * 60 * 24` (24 hours). Similarly update the same values in `app/api/auth/verify/route.ts` line 43 where `maxAge: 60 * 60 * 24 * 7` should become `60 * 60 * 24`.
  </action>
  <verify>
    <automated>grep -rn "error\.message\|err\.message" app/api/checkout/ app/api/renewal/ app/api/intake/submit/route.ts app/api/intake/upload/route.ts app/api/intake/questions/route.ts app/api/protocol/generate/route.ts app/api/meal-plan/route.ts 2>/dev/null | grep -v "console\.\|emailError\|dbError\|REDACTED\|\/\/" | grep "NextResponse\|return\|json" | wc -l | xargs test 0 -eq && grep -q "Content-Security-Policy" next.config.js && grep -q "cultr_last_activity" middleware.ts && grep -q "24h" lib/auth.ts</automated>
  </verify>
  <done>
    - Zero API routes return raw error.message to clients -- all use static generic messages
    - Content-Security-Policy header is configured in next.config.js
    - Session idle timeout (30 min) enforced via middleware cookie check
    - Session JWT lifetime reduced from 7 days to 24 hours
    - X-Permitted-Cross-Domain-Policies: none header added
  </done>
</task>

</tasks>

<verification>
1. `npm run build` completes without errors (TypeScript + Next.js compilation)
2. `npm test` passes (existing tests still work)
3. `grep -rn "console\.\(log\|warn\|error\).*email" lib/ app/api/ | grep -v REDACTED | grep -v emailError | grep -v "send.*email" | grep -v "email.*fail"` returns minimal/zero results
4. `grep -c "Content-Security-Policy" next.config.js` returns 1
5. `grep -c "cultr_last_activity" middleware.ts` returns at least 1
6. No API route catch blocks return `error.message` directly in `NextResponse.json()`
</verification>

<success_criteria>
- PHI (emails, phones, names, DOB, addresses) completely removed from all server-side log statements across lib/ and app/api/
- All client-facing error responses use static generic messages, never exposing internal error details
- Content-Security-Policy header configured with appropriate source allowlists for all integrations (Stripe, Cloudflare, GA, Curator, Daily, Affirm, Klarna, SiPhox)
- Session idle timeout of 30 minutes enforced via middleware for all authenticated routes
- Session JWT lifetime reduced from 7 days to 24 hours
- HIPAA-safe logging utility (`lib/hipaa-logger.ts`) available for future development
- Code audit hook updated to catch PHI logging in new code
- Build and tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260329-upf-make-the-entire-website-extremely-hipaa-/260329-upf-SUMMARY.md`
</output>
