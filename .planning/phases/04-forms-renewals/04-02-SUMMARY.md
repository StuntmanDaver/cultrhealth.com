---
phase: 04-forms-renewals
plan: 02
subsystem: ui
tags: [portal, intake, renewal, prefill, dashboard, forms]

requires:
  - phase: 04-forms-renewals
    provides: mapPatientToIntakeData, mapPatientToRenewalData, estimateSupplyDays, GET /api/portal/prefill
  - phase: 01-phone-otp-authentication
    provides: Portal auth guard, portal layout
provides:
  - Portal intake page with prefill from Asher Med patient data
  - Portal renewal page with portalMode (skips phone verify)
  - IntakeFormProvider initialData prop for server-side prefill
  - RenewalFormClient portalMode, initialPatient, initialMedication props
  - Dashboard renewal prompt banner when supply is low
  - Portal-linked quick actions on dashboard
affects: []

tech-stack:
  added: []
  patterns: [portal-form-wrapper, prefill-enhancement-not-gate, supply-driven-renewal-prompt]

key-files:
  created:
    - app/portal/intake/page.tsx
    - app/portal/intake/PortalIntakeClient.tsx
    - app/portal/renewal/page.tsx
    - app/portal/renewal/PortalRenewalClient.tsx
  modified:
    - lib/contexts/intake-form-context.tsx
    - app/renewal/RenewalFormClient.tsx
    - app/portal/dashboard/DashboardClient.tsx
    - app/api/portal/prefill/route.ts
    - tests/components/PortalDashboard.test.tsx

key-decisions:
  - "IntakeFormProvider initialData only seeds form when localStorage is empty (resuming user keeps their progress)"
  - "Prefill failure is non-blocking: forms render without pre-fill, user fills manually"
  - "Prefill API response augmented with patientId for renewal form submission"
  - "Dashboard renewal prompt uses amber warning style, positioned between hero card and order list"

patterns-established:
  - "Portal form wrapper pattern: fetch prefill on mount, show spinner, render underlying form with initial data"
  - "Enhancement-not-gate pattern: prefill failure degrades gracefully to standard form flow"

requirements-completed: [FORM-01, FORM-02, FORM-03, FORM-04, FORM-05]

duration: 3min
completed: 2026-03-14
---

# Phase 4 Plan 02: Portal Forms & Dashboard Renewal Prompt Summary

**Portal intake/renewal pages with Asher Med prefill, portalMode skip-verify for renewals, and supply-driven renewal prompt on dashboard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T23:52:39Z
- **Completed:** 2026-03-14T23:55:45Z
- **Tasks:** 2 of 3 (Task 3 is human verification checkpoint)
- **Files created:** 4
- **Files modified:** 5

## Accomplishments
- IntakeFormProvider enhanced with initialData prop that seeds form when localStorage is empty
- RenewalFormClient enhanced with portalMode (skips phone verify, starts at medication step) and initialPatient/initialMedication props
- Portal intake and renewal wrapper pages fetch prefill data on mount and pass to underlying forms
- Dashboard shows amber renewal prompt banner when patient is eligible and supply <= 7 days
- Quick links updated to point to portal versions of intake and renewal
- All 328 tests passing with updated dashboard test mocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance IntakeFormProvider and RenewalFormClient, create portal wrapper pages** - `63bd45b` (feat)
2. **Task 2: Dashboard renewal prompt and portal form links** - `0eca072` (feat)
3. **Task 3: Human verification checkpoint** - awaiting

## Files Created/Modified
- `app/portal/intake/page.tsx` - Server component with metadata for portal intake page
- `app/portal/intake/PortalIntakeClient.tsx` - Client wrapper fetching prefill, rendering IntakeFormClient with initialData
- `app/portal/renewal/page.tsx` - Server component with metadata for portal renewal page
- `app/portal/renewal/PortalRenewalClient.tsx` - Client wrapper fetching prefill, rendering RenewalFormClient in portalMode
- `lib/contexts/intake-form-context.tsx` - Added initialData prop to IntakeFormProvider
- `app/renewal/RenewalFormClient.tsx` - Added portalMode, initialPatient, initialMedication props
- `app/portal/dashboard/DashboardClient.tsx` - Added renewal prompt banner and portal quick links
- `app/api/portal/prefill/route.ts` - Added patientId to prefill response
- `tests/components/PortalDashboard.test.tsx` - Updated fetch mocks to handle dual fetch (orders + prefill)

## Decisions Made
- IntakeFormProvider initialData only applies when localStorage is empty -- preserves user progress if they're resuming
- Prefill failure is non-blocking -- forms render without pre-fill so users can fill manually
- Prefill API augmented with patientId so renewal form can submit with correct patient reference
- Renewal prompt positioned between hero card and order list for visibility without displacing primary content

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added patientId to prefill API response**
- **Found during:** Task 1 (PortalRenewalClient creation)
- **Issue:** Prefill API did not include patientId, but RenewalFormClient needs it for form submission
- **Fix:** Added `patientId: auth.asherPatientId` to prefill response object
- **Files modified:** app/api/portal/prefill/route.ts
- **Verification:** PortalRenewalClient correctly maps patientId to initialPatient.id
- **Committed in:** 63bd45b (Task 1 commit)

**2. [Rule 1 - Bug] Fixed dashboard test fetch mocks for dual fetch**
- **Found during:** Task 2 (Dashboard modifications)
- **Issue:** Dashboard tests used mockResolvedValueOnce for single fetch; new prefill fetch caused undefined.then() error
- **Fix:** Replaced per-test mocks with URL-aware mock function routing orders vs prefill requests
- **Files modified:** tests/components/PortalDashboard.test.tsx
- **Verification:** All 328 tests passing
- **Committed in:** 0eca072 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All portal features complete pending human verification (Task 3 checkpoint)
- Members portal v1 feature set is fully implemented across all 4 phases

---
*Phase: 04-forms-renewals*
*Completed: 2026-03-14*
