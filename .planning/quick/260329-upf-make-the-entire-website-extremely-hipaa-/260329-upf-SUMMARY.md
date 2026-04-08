---
phase: quick
plan: 260329-upf
subsystem: security/hipaa
tags: [hipaa, security, logging, error-handling, csp, session-management]
dependency_graph:
  requires: []
  provides: [phi-safe-logging, csp-headers, session-idle-timeout, sanitized-error-responses]
  affects: [all-api-routes, middleware, auth]
tech_stack:
  added: []
  patterns: [phi-redaction, generic-error-responses, idle-timeout-cookie]
key_files:
  created:
    - lib/hipaa-logger.ts
  modified:
    - lib/resend.ts
    - lib/auth.ts
    - lib/quickbooks.ts
    - lib/mailchimp.ts
    - app/api/auth/verify/route.ts
    - app/api/webhook/stripe/route.ts
    - app/api/creators/verify-login/route.ts
    - app/api/creators/apply/route.ts
    - app/api/creators/magic-link/route.ts
    - app/api/club/orders/route.ts
    - app/api/admin/orders/[orderNumber]/fulfill/route.ts
    - app/api/checkout/route.ts
    - app/api/checkout/subscription/route.ts
    - app/api/checkout/authorize-net/route.ts
    - app/api/checkout/authorize-net/product/route.ts
    - app/api/checkout/corepay/route.ts
    - app/api/checkout/nowpayments/route.ts
    - app/api/checkout/product/route.ts
    - app/api/intake/submit/route.ts
    - app/api/intake/upload/route.ts
    - app/api/intake/questions/route.ts
    - app/api/protocol/generate/route.ts
    - app/api/renewal/check/route.ts
    - app/api/renewal/submit/route.ts
    - next.config.js
    - middleware.ts
    - tests/api/protocol-generate.test.ts
    - tests/integration/intake-submission-e2e.test.ts
decisions:
  - Session JWT lifetime reduced from 7 days to 24 hours for HIPAA compliance
  - Session cookie maxAge reduced from 7 days to 24 hours across all login routes
  - 30-minute idle timeout enforced via middleware cookie (cultr_last_activity)
  - CSP allows unsafe-inline/unsafe-eval because Next.js requires them, but still blocks unexpected script sources
  - meal-plan route already had getFriendlyError pattern returning static messages, left as-is
  - code-audit.sh hook not updated because it lives in .claude/hooks/ (local-only, not in git)
metrics:
  duration_seconds: 750
  completed: "2026-03-30T02:29:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 28
---

# Quick Task 260329-upf: HIPAA Hardening Summary

Comprehensive HIPAA hardening: PHI-safe logging utility, sanitized error responses across 14 API routes, Content-Security-Policy header with integration allowlists, 30-minute session idle timeout, and JWT lifetime reduction from 7 days to 24 hours.

## Task 1: PHI-Safe Logging and PHI Purge

**Commit:** a1b948e

Created `lib/hipaa-logger.ts` with:
- `safeLog.info/warn/error()` -- redacts emails, phones, and PHI field names before logging
- `safeErrorResponse()` -- logs real error server-side, returns generic message to client
- PHI_FIELDS set covers email, phone, name, DOB, SSN, address, and common variants

Removed PHI from 20+ console statements across 10 files:
- `lib/resend.ts`: Removed `email` field from 8 success log objects (welcome, booking, reminder, follow-up, quote, order confirmation, shipping)
- `lib/auth.ts`: Removed email from creator DB lookup error and staging fallback warning
- `lib/quickbooks.ts`: Removed email from customer creation and invoice send logs
- `lib/mailchimp.ts`: Removed email from sync and tag failure error logs
- `app/api/auth/verify/route.ts`: Removed email from staging access and session creation logs
- `app/api/webhook/stripe/route.ts`: Replaced `custEmail`/`customerEmail` with action-only messages
- `app/api/creators/verify-login/route.ts`: Removed email from auto-create and session logs
- `app/api/creators/apply/route.ts`: Replaced email with creator ID in approval and submission logs
- `app/api/admin/orders/[orderNumber]/fulfill/route.ts`: Removed email from shipping notification log

## Task 2: Error Sanitization, CSP Headers, Session Idle Timeout

**Commit:** 1d94410

### Error Response Sanitization

Replaced `error.message` with static generic messages in 14 API route catch blocks:
- Renewal routes (check, submit)
- All checkout routes (stripe, subscription, authorize-net, authorize-net/product, corepay, nowpayments, product)
- Intake routes (submit, upload, questions)
- Protocol generate route

Pattern: `error.message` was being returned directly in `NextResponse.json()`. Now each route returns a context-appropriate static string (e.g., "Payment processing failed. Please try again.").

### Content-Security-Policy Header

Added to `next.config.js` security headers block:
- `default-src 'self'`
- Script sources: Cloudflare Turnstile, Google Analytics/Tag Manager, Curator.io, Stripe.js, Affirm, Klarna, Daily.co
- Style/font sources: Google Fonts, Curator.io
- Connect sources: Stripe API, Cloudflare, Google Analytics, Curator.io, Daily.co, SiPhox
- Frame sources: Stripe, Cloudflare, Affirm, Klarna, Daily.co
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`
- `form-action 'self' https://checkout.stripe.com`

Also added `X-Permitted-Cross-Domain-Policies: none` header.

### Session Idle Timeout

Added to `middleware.ts`:
- 30-minute idle timeout check for authenticated routes (/members, /intake, /dashboard, /admin, /provider, /creators/portal)
- Uses `cultr_last_activity` httpOnly cookie to track last request timestamp
- Expired sessions redirect to `/login?reason=session_timeout&redirect={original_path}`
- Cookie uses `.cultrhealth.com` domain for cross-subdomain support

### JWT Lifetime Reduction

- `lib/auth.ts`: Session token expiry changed from `'7d'` to `'24h'`
- `lib/auth.ts`: Session cookie `maxAge` changed from 7 days to 24 hours
- `app/api/auth/verify/route.ts`: Cookie `maxAge` changed from 7 days to 24 hours
- `app/api/creators/verify-login/route.ts`: Cookie `maxAge` changed from 7 days to 24 hours

### Test Updates

- `tests/api/protocol-generate.test.ts`: Updated "handles API errors gracefully" to expect generic message
- `tests/integration/intake-submission-e2e.test.ts`: Updated Asher Med failure test to expect generic message

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed additional PHI leaks not in plan**
- **Found during:** Task 1
- **Issue:** `app/api/creators/verify-login/route.ts` line 143 logged `{ email, creatorId }` in session creation; `lib/quickbooks.ts` line 473 logged `customerEmail` in invoice sent message
- **Fix:** Removed email from both log statements
- **Files modified:** app/api/creators/verify-login/route.ts, lib/quickbooks.ts
- **Commit:** a1b948e

**2. [Rule 1 - Bug] Test assertions expected raw error messages**
- **Found during:** Task 2
- **Issue:** 2 test assertions expected the old raw `error.message` to be returned by API routes
- **Fix:** Updated test expectations to match new generic error messages
- **Files modified:** tests/api/protocol-generate.test.ts, tests/integration/intake-submission-e2e.test.ts
- **Commit:** 1d94410

### Skipped Items

- **code-audit.sh PHI pattern update:** The file lives in `.claude/hooks/` which is local-only (not in git). Skipped since it cannot be committed.

## Known Stubs

None -- all functionality is fully implemented.

## Verification Results

| Check | Result |
|-------|--------|
| PHI email leak in console.* calls | 0 instances |
| Content-Security-Policy in next.config.js | Present |
| cultr_last_activity in middleware.ts | Present (3 refs) |
| 24h session expiry in lib/auth.ts | Present |
| lib/hipaa-logger.ts exists | Yes |
| TypeScript compilation | Clean |
| Test suite | 49/50 pass (1 pre-existing: coupon-attribution-e2e needs POSTGRES_URL) |

## Self-Check: PASSED

- [x] lib/hipaa-logger.ts exists and exports safeLog + safeErrorResponse
- [x] next.config.js contains Content-Security-Policy header
- [x] middleware.ts contains cultr_last_activity idle timeout logic
- [x] lib/auth.ts uses 24h session expiry
- [x] Commit a1b948e exists (Task 1)
- [x] Commit 1d94410 exists (Task 2)
