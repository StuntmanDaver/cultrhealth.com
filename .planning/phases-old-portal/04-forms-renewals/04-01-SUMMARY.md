---
phase: 04-forms-renewals
plan: 01
subsystem: api
tags: [prefill, asher-med, mapping, supply-estimation, portal, tdd]

requires:
  - phase: 01-phone-otp-authentication
    provides: verifyPortalAuth, portal session with asherPatientId
  - phase: 03-profile-documents
    provides: Asher Med API patterns (getPatientById, getOrders)
provides:
  - mapPatientToIntakeData utility (AsherPatient -> Partial<SimpleFormData>)
  - mapPatientToRenewalData utility (AsherPatient + medication -> renewal prefill)
  - estimateSupplyDays utility (order date + duration -> supply estimate)
  - GET /api/portal/prefill route assembling all prefill data
affects: [04-02-PLAN]

tech-stack:
  added: []
  patterns: [prefill-data-layer, supply-estimation-with-threshold]

key-files:
  created:
    - lib/portal-prefill.ts
    - app/api/portal/prefill/route.ts
    - tests/lib/portal-prefill.test.ts
    - tests/api/portal-prefill.test.ts
  modified: []

key-decisions:
  - "Height conversion uses Math.floor(height/12) for feet and height%12 for inches, matching AsherPatient total-inches format"
  - "Supply isLow threshold set at 7 days remaining to trigger renewal prompts"
  - "Default duration 28 days when medication_packages JSON is null or malformed"
  - "Address field mapping: stateAbbreviation->state, zipcode->zipCode to match SimpleFormData convention"

patterns-established:
  - "Prefill pattern: single API route consolidates all mapping logic server-side, returning typed prefill object"
  - "Supply estimation: date arithmetic with clamped daysRemaining and boolean threshold flag"

requirements-completed: [FORM-01, FORM-02, FORM-03, FORM-05]

duration: 2min
completed: 2026-03-14
---

# Phase 4 Plan 01: Prefill Data Layer Summary

**Prefill mapping utilities converting Asher Med patient data to intake/renewal form shapes, with supply estimation and consolidated portal API route**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T23:47:49Z
- **Completed:** 2026-03-14T23:50:05Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Three exported mapping/estimation functions with full TDD coverage (9 unit tests)
- Prefill API route handling all auth states: unauthenticated (401), Case C no patient (null), full prefill with intake+renewal+supply
- 14 new tests, 328 total suite-wide, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Prefill mapping utilities and supply estimation with tests** - `20f4684` (feat, TDD)
2. **Task 2: Prefill API route with tests** - `40d6d36` (feat, TDD)

## Files Created/Modified
- `lib/portal-prefill.ts` - mapPatientToIntakeData, mapPatientToRenewalData, estimateSupplyDays exports
- `app/api/portal/prefill/route.ts` - GET handler returning consolidated prefill data for authenticated members
- `tests/lib/portal-prefill.test.ts` - 9 unit tests for mapping functions and supply estimation
- `tests/api/portal-prefill.test.ts` - 5 API route tests covering auth, Case C, full prefill, no orders, missing medication_packages

## Decisions Made
- Height conversion: Math.floor(height/12) for feet, height%12 for inches -- matches AsherPatient total-inches format
- Supply isLow threshold at 7 days remaining -- provides adequate time for renewal prompt
- Default 28-day duration when medication_packages data is null/malformed -- safe default for most medications
- Address field name mapping (stateAbbreviation->state, zipcode->zipCode) consistent with Phase 3 profile patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Prefill data layer complete, ready for Plan 04-02 to build portal wrapper pages and dashboard renewal prompt
- All three exported functions available for import by wrapper components
- GET /api/portal/prefill route ready for client-side consumption

---
*Phase: 04-forms-renewals*
*Completed: 2026-03-14*
