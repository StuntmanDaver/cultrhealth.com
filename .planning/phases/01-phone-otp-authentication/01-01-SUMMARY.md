---
phase: 01-phone-otp-authentication
plan: 01
subsystem: auth
tags: [jwt, jose, portal, otp, cookies, postgres, vitest]

# Dependency graph
requires: []
provides:
  - "Dual-token JWT portal auth (15-min access, 7-day refresh) via lib/portal-auth.ts"
  - "Portal session DB helpers (upsert, lookup, update) via lib/portal-db.ts"
  - "Database migration for portal_sessions table (migration 014)"
  - "Cookie constants PORTAL_ACCESS_COOKIE and PORTAL_REFRESH_COOKIE"
  - "verifyPortalAuth for API route auth guards"
affects: [01-02-PLAN, 01-03-PLAN, dashboard, portal-layout]

# Tech tracking
tech-stack:
  added: []
  patterns: ["dual-token JWT (access + refresh)", "scoped refresh cookie path", "lazy secret initialization for test compatibility"]

key-files:
  created:
    - lib/portal-auth.ts
    - lib/portal-db.ts
    - migrations/014_portal_sessions.sql
    - tests/lib/portal-auth.test.ts
    - tests/lib/portal-db.test.ts
  modified: []

key-decisions:
  - "Used lazy secret getter to avoid jsdom/Node Uint8Array mismatch in vitest with jose"
  - "Portal auth tests run in @vitest-environment node (not jsdom) for jose compatibility"
  - "Refresh cookie scoped to /api/portal/refresh path for security"

patterns-established:
  - "Portal auth: separate from existing cultr_session auth (AUTH-06 coexistence)"
  - "Portal tokens: type claim prevents cross-use between access and refresh"
  - "Portal DB: PortalDatabaseError class follows existing DatabaseError pattern"

requirements-completed: [AUTH-03, AUTH-04, AUTH-06]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 1 Plan 01: Portal Auth Foundation Summary

**Dual-token JWT session management (15-min access, 7-day refresh) with portal_sessions DB migration and phone-to-patient mapping helpers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T01:48:18Z
- **Completed:** 2026-03-11T01:53:01Z
- **Tasks:** 1 (TDD: RED-GREEN)
- **Files created:** 5

## Accomplishments
- Portal auth library with 8 exported functions, PortalSession type, and cookie name constants -- completely separate from existing cultr_session auth
- Portal DB helpers for upserting, looking up, and updating portal_sessions records with phone-to-patient mapping
- Database migration 014 for portal_sessions table with unique index on phone_e164 and index on asher_patient_id
- 24 passing tests covering token round-trips, type rejection, expiry, cookie management, session retrieval, and API route auth verification
- Zero regressions across full 195-test suite

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests + migration** - `0669d48` (test)
2. **Task 1 GREEN: Implementation passes all tests** - `bf3ecaa` (feat)

_TDD task: RED committed first, then GREEN_

## Files Created/Modified
- `lib/portal-auth.ts` - Dual-token JWT auth: create, verify, cookie management, getPortalSession, verifyPortalAuth
- `lib/portal-db.ts` - DB operations: upsertPortalSession, getPortalSessionByPhone, updatePortalPatientId
- `migrations/014_portal_sessions.sql` - portal_sessions table with phone_e164 unique index
- `tests/lib/portal-auth.test.ts` - 19 tests: token round-trips, type rejection, expiry, cookies, session, verifyPortalAuth
- `tests/lib/portal-db.test.ts` - 5 tests: upsert, lookup, update with SQL verification

## Decisions Made
- **Lazy secret initialization:** Used a getter function for PORTAL_SECRET instead of module-level `TextEncoder().encode()` to avoid jsdom/Node Uint8Array class mismatch when jose v6 checks `instanceof Uint8Array`
- **Node test environment:** Portal auth tests use `@vitest-environment node` directive since jose JWT operations require Node.js native `Uint8Array` (jsdom provides a different global)
- **Refresh cookie path scoping:** Refresh cookie restricted to `/api/portal/refresh` path so it is only sent to the refresh endpoint, reducing exposure
- **COALESCE in upsert:** Used `COALESCE(EXCLUDED.value, portal_sessions.value)` pattern so null values in updates don't overwrite existing data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jose v6 Uint8Array incompatibility with jsdom test environment**
- **Found during:** Task 1 (GREEN phase -- running tests)
- **Issue:** jose v6 `FlattenedSign` constructor checks `payload instanceof Uint8Array` using Node.js global, but jsdom provides its own `Uint8Array` class causing the check to fail
- **Fix:** Added `@vitest-environment node` directive to portal-auth test file and used lazy secret initialization in portal-auth.ts
- **Files modified:** tests/lib/portal-auth.test.ts, lib/portal-auth.ts
- **Verification:** All 24 portal tests pass, all 195 tests pass
- **Committed in:** bf3ecaa (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test environment fix was necessary for jose v6 compatibility. No scope creep.

## Issues Encountered
- jose v6 + jsdom test environment incompatibility required switching portal-auth tests to node environment. Existing auth tests were unaffected because they don't exercise JWT creation/verification directly.

## User Setup Required

None - no external service configuration required for this plan. (Twilio setup is needed for Plan 02.)

## Next Phase Readiness
- Portal auth foundation complete: Plan 02 can import `createPortalAccessToken`, `createPortalRefreshToken`, `verifyPortalAuth`, `setPortalCookies`, `clearPortalCookies` for API route implementation
- Portal DB helpers ready: Plan 02 can import `upsertPortalSession`, `getPortalSessionByPhone`, `updatePortalPatientId` for OTP verification flow
- Migration 014 ready to run on staging Neon DB before deploying Plan 02

---
*Phase: 01-phone-otp-authentication*
*Completed: 2026-03-11*
