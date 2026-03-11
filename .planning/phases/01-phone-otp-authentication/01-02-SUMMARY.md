---
phase: 01-phone-otp-authentication
plan: 02
subsystem: api
tags: [twilio, otp, sms, rate-limiting, jwt, cookies, vitest, api-routes]

# Dependency graph
requires:
  - "Dual-token JWT portal auth (15-min access, 7-day refresh) via lib/portal-auth.ts"
  - "Portal session DB helpers (upsert, lookup, update) via lib/portal-db.ts"
provides:
  - "POST /api/portal/send-otp: OTP delivery via Twilio Verify with dual rate limiting"
  - "POST /api/portal/verify-otp: OTP verification with three-way patient resolution and session creation"
  - "POST /api/portal/refresh: silent access token refresh using refresh cookie"
  - "POST /api/portal/logout: secure cookie clearing for both portal tokens"
  - "26 API route tests covering all endpoints, error cases, and edge cases"
affects: [01-03-PLAN, portal-login-ui, portal-dashboard]

# Tech tracking
tech-stack:
  added: [twilio]
  patterns: ["Twilio Verify for OTP delivery/verification", "three-way patient resolution (Asher Med + local cache + never-seen)", "staging OTP bypass (code 123456)", "dual rate limiting (IP + phone) on send-otp"]

key-files:
  created:
    - app/api/portal/send-otp/route.ts
    - app/api/portal/verify-otp/route.ts
    - app/api/portal/refresh/route.ts
    - app/api/portal/logout/route.ts
    - tests/api/portal-send-otp.test.ts
    - tests/api/portal-verify-otp.test.ts
    - tests/api/portal-refresh.test.ts
    - tests/api/portal-logout.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Plain object mocks for NextRequest in refresh test instead of mocked class constructor (avoids vitest module caching issues)"
  - "Patient resolution order: Asher Med lookup takes priority over cached local DB value, with graceful fallback when Asher Med is down"
  - "Cookies set in all three verify-otp cases (even never-seen phones) since phone is verified regardless of patient status"

patterns-established:
  - "Portal API routes: all use export const dynamic = 'force-dynamic' for Vercel compatibility"
  - "Twilio error mapping: specific error codes (60203, 20404, 60200, 60202) mapped to user-friendly messages"
  - "Three-way verify response: hasPatient + knownPhone flags determine redirect vs support message"
  - "API test pattern: @vitest-environment node with mocked next/server, mocked dependencies, plain Request objects"

requirements-completed: [AUTH-01, AUTH-05, AUTH-07, AUTH-08, AUTH-10]

# Metrics
duration: 7min
completed: 2026-03-11
---

# Phase 1 Plan 02: Portal API Routes Summary

**Four portal API endpoints (send-otp, verify-otp, refresh, logout) with Twilio Verify integration, three-way patient resolution, and 26 tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-11T01:55:52Z
- **Completed:** 2026-03-11T02:03:19Z
- **Tasks:** 2 (both TDD: RED-GREEN)
- **Files created:** 8
- **Files modified:** 2 (package.json, package-lock.json)

## Accomplishments
- Complete OTP login flow: phone validation, dual rate limiting (IP + phone), Twilio Verify SMS delivery, and OTP verification with staging bypass (code 123456)
- Three-way patient identity resolution on verify-otp: Asher Med lookup (priority), local DB cache fallback, and never-seen phone detection -- returning appropriate redirects or support message
- Token refresh endpoint reads refresh cookie and issues new access token without re-login; logout endpoint clears both portal cookies
- 26 tests across 4 test files covering all success paths, error codes, rate limiting, validation, cookie management, and Asher Med fallback behavior
- Full 221-test suite green with zero regressions, zero TypeScript errors

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: Failing tests for send-otp and verify-otp** - `3549826` (test)
2. **Task 1 GREEN: Implement send-otp and verify-otp routes** - `1cbf56f` (feat)
3. **Task 2 RED: Failing tests for refresh and logout** - `563a243` (test)
4. **Task 2 GREEN: Implement refresh and logout routes** - `46c2b25` (feat)

_TDD tasks: RED committed first, then GREEN_

## Files Created/Modified
- `app/api/portal/send-otp/route.ts` - POST endpoint: validates phone, dual rate limits, sends OTP via Twilio Verify, maps error codes to user-friendly messages
- `app/api/portal/verify-otp/route.ts` - POST endpoint: verifies OTP (or staging bypass), resolves patient via Asher Med + local cache, creates dual-token session, returns three-way response (dashboard/intake/support)
- `app/api/portal/refresh/route.ts` - POST endpoint: reads refresh cookie, verifies token, issues new access token cookie (15-min maxAge)
- `app/api/portal/logout/route.ts` - POST endpoint: clears both portal cookies (idempotent)
- `tests/api/portal-send-otp.test.ts` - 7 tests: valid phone, invalid phone, IP/phone rate limit, Twilio error codes (60203, 20404, generic)
- `tests/api/portal-verify-otp.test.ts` - 13 tests: three cases (patient/knownPhone/never-seen), staging bypass, validation, rate limit, cookies, upsert, cached fallback
- `tests/api/portal-refresh.test.ts` - 4 tests: valid refresh, missing token, expired token, preserves phone/patientId
- `tests/api/portal-logout.test.ts` - 2 tests: returns success, calls clearPortalCookies

## Decisions Made
- **Plain object mocks for NextRequest:** Used plain objects with `.cookies.get()` method instead of mocked NextRequest class constructor to avoid vitest module caching issues with `require()` inside test helpers
- **Patient resolution order:** Asher Med lookup takes priority over cached local DB value. When Asher Med is down, falls back gracefully to cached `asher_patient_id` from portal_sessions
- **Cookies set unconditionally:** Even for never-seen phones (Case C), session cookies are set because the phone number IS verified -- the user just needs manual account linking via support

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest mock incompatibility with MockNextRequest class**
- **Found during:** Task 2 (GREEN phase -- refresh tests)
- **Issue:** MockNextRequest class defined inside `vi.mock('next/server')` was not properly receiving cookies when instantiated via `require('next/server')` inside test helper function. The `cookies.get()` returned undefined despite correct mock logic.
- **Fix:** Replaced MockNextRequest with plain object construction in `makeRefreshRequest()` helper -- creates a simple object with `{ cookies: { get(name) } }` shape matching what the route handler reads
- **Files modified:** tests/api/portal-refresh.test.ts
- **Verification:** All 4 refresh tests pass
- **Committed in:** 46c2b25 (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test mock approach changed but behavior and coverage identical. No scope creep.

## Issues Encountered
- vitest's module mock hoisting combined with `require()` calls inside helper functions does not reliably pass constructor arguments through mocked classes. Resolved by using plain object mocks for NextRequest (the route handler only reads `request.cookies.get()`, so a duck-typed object works correctly).

## User Setup Required

The following environment variables must be configured before the portal login flow will work in production/staging:

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account SID (ACxxxxxxxxx) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service SID (VAxxxxxxxxx) |

**Note:** On staging, the OTP code `123456` is always accepted without Twilio, so these variables are only strictly required for production. However, the send-otp endpoint will fail without them even on staging (it still calls Twilio to send the SMS).

## Next Phase Readiness
- All 4 portal API endpoints ready for Plan 03 (login UI): send-otp, verify-otp, refresh, logout
- The login UI can call POST /api/portal/send-otp with { phone } and POST /api/portal/verify-otp with { phone, code }
- Three-way verify response (hasPatient/knownPhone flags + optional redirect) enables UI routing logic
- Token refresh can be triggered by client-side activity tracker calling POST /api/portal/refresh
- Logout button calls POST /api/portal/logout

## Self-Check: PASSED

All 9 files verified present. All 4 task commits verified in git log.

---
*Phase: 01-phone-otp-authentication*
*Completed: 2026-03-11*
