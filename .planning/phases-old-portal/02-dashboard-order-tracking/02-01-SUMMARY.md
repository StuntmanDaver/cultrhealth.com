---
phase: 02-dashboard-order-tracking
plan: 01
subsystem: api
tags: [portal, orders, asher-med, status-mapping, jwt-auth, tdd]

# Dependency graph
requires:
  - phase: 01-phone-otp-auth
    provides: verifyPortalAuth for API route authentication, PortalSession type
provides:
  - PortalOrder type and OrderStatusDisplay type for dashboard UI
  - getStatusDisplay() status mapping utility (6 statuses with labels, explanations, colors)
  - isActiveStatus() and ACTIVE_STATUSES for hero card order selection
  - GET /api/portal/orders (authenticated order list with medication name merge)
  - GET /api/portal/orders/[id] (authenticated order detail with ownership verification)
affects: [02-02-dashboard-ui, portal-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [portal-api-proxy-with-local-db-enrichment, best-effort-medication-merge, ownership-verification-403]

key-files:
  created:
    - lib/portal-orders.ts
    - app/api/portal/orders/route.ts
    - app/api/portal/orders/[id]/route.ts
    - tests/lib/portal-orders.test.ts
    - tests/api/portal-orders.test.ts
    - tests/api/portal-order-detail.test.ts
  modified: []

key-decisions:
  - "Best-effort medication name enrichment from local asher_orders table with JSON parse fallback chain"
  - "Ownership verification returns 403 (not 404) for another patient's order to distinguish from not-found"
  - "Case C users (no asherPatientId) get empty orders array with 200 (not error) since it's a valid state"

patterns-established:
  - "Portal API proxy: verifyPortalAuth -> fetch from Asher Med -> enrich from local DB -> return typed response"
  - "Medication name fallback chain: local DB medication_packages[0].name -> orderType -> 'Medication'"
  - "Ownership check pattern: getOrderDetail then compare patientId to auth.asherPatientId"

requirements-completed: [ORDR-01, ORDR-03, ORDR-04]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 2 Plan 01: Portal Orders Data Layer Summary

**Status mapping utility with 6-status display config, authenticated order list/detail API proxy routes with Asher Med integration and local DB medication name enrichment**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T19:11:27Z
- **Completed:** 2026-03-11T19:16:15Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments
- Status mapping utility covering all 6 AsherOrderStatus values with labels, explanations, and Tailwind color classes
- Authenticated order list API route that fetches from Asher Med and merges medication names from local DB
- Authenticated order detail API route with ownership verification (403 for cross-patient access)
- 25 new tests (14 unit + 11 API) with zero regressions across 278 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Status mapping utility and shared types** - `a96552b` (feat) - pre-existing from prior session
2. **Task 2 RED: Failing API route tests** - `b777fda` (test)
3. **Task 2 GREEN: Portal orders API routes** - `f3d10e6` (feat)

## Files Created/Modified
- `lib/portal-orders.ts` - OrderStatusDisplay/PortalOrder types, getStatusDisplay(), isActiveStatus(), ACTIVE_STATUSES
- `app/api/portal/orders/route.ts` - GET handler for authenticated order list with medication name merge
- `app/api/portal/orders/[id]/route.ts` - GET handler for order detail with ownership verification
- `tests/lib/portal-orders.test.ts` - 14 unit tests for status mapping and active status helpers
- `tests/api/portal-orders.test.ts` - 6 tests for order list route (auth, empty state, merge, sort, errors)
- `tests/api/portal-order-detail.test.ts` - 5 tests for order detail route (auth, ownership, errors)

## Decisions Made
- Best-effort local DB enrichment: medication_packages query wrapped in try/catch so Asher Med data always returns even if local DB is down
- Ownership verification returns 403 (not 404) to clearly indicate authorization failure vs missing resource
- Case C users (verified phone, no patient record) receive 200 with empty orders array rather than an error

## Deviations from Plan

None - plan executed exactly as written. Task 1 was found pre-committed from a prior session; verified tests pass and proceeded to Task 2.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer complete: Plan 02-02 (dashboard UI) can consume these API routes and types directly
- PortalOrder type provides the exact shape for rendering order cards and detail panels
- getStatusDisplay() provides label/explanation/color for status badge rendering
- ACTIVE_STATUSES/isActiveStatus() ready for hero card order selection logic

## Self-Check: PASSED

All 7 files verified on disk. All 3 commits verified in git history.

---
*Phase: 02-dashboard-order-tracking*
*Completed: 2026-03-11*
