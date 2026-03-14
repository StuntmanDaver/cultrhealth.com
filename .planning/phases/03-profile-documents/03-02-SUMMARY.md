---
phase: 03-profile-documents
plan: 02
subsystem: api, ui, database
tags: [s3, presigned-url, file-upload, portal, documents, asher-med, vitest]

# Dependency graph
requires:
  - phase: 01-phone-otp-auth
    provides: verifyPortalAuth, portal layout with auth guard
  - phase: 02-dashboard-order-tracking
    provides: portal page patterns (fetch-on-mount, loading/error states, design language)
provides:
  - Documents API route (GET list with S3 preview URLs, POST presigned upload with DB recording)
  - Documents client page with list view and upload UI
  - Migration 019 adding asher_patient_id index to asher_uploaded_files
affects: [04-forms-renewals]

# Tech tracking
tech-stack:
  added: [@testing-library/dom (dev peer dependency fix)]
  patterns: [S3 presigned upload with local DB recording, mock upload mode for staging]

key-files:
  created:
    - migrations/019_uploaded_files_patient_id.sql
    - tests/api/portal-documents.test.ts
    - app/api/portal/documents/route.ts
    - app/portal/documents/page.tsx
    - app/portal/documents/DocumentsClient.tsx
  modified: []

key-decisions:
  - "GET returns 401 (not empty array) when asherPatientId is null, since documents require a patient record to query"
  - "Preview URLs generated fresh on each page load, not cached, to avoid S3 presigned URL expiration"
  - "Portal upload purposes prefixed with portal_ to distinguish from intake upload purposes"
  - "Mock mode records in DB even for fake uploads, so document list works on staging"

patterns-established:
  - "S3 upload flow: POST for presigned URL + DB record, then client PUTs directly to S3"
  - "Purpose-based document categorization with portal_ prefix for portal uploads"

requirements-completed: [DOCS-01, DOCS-02]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 3 Plan 02: Documents Summary

**Document management API with S3 presigned upload flow, preview URL generation, and portal upload UI with purpose-based categorization**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T22:21:21Z
- **Completed:** 2026-03-14T22:25:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Documents API route with GET (list with S3 preview URLs) and POST (presigned upload + DB recording)
- Documents client page with document list, purpose icons/labels, and upload flow
- Migration 019 for asher_patient_id column and index on asher_uploaded_files table
- 14 unit tests covering auth, validation, preview URL generation, mock mode, and error handling
- Full test suite green: 314 tests passing across 21 files

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration, documents API route, and tests (TDD)**
   - `02d6190` (test: failing tests + migration)
   - `2ba3e7f` (feat: implement documents API route)
2. **Task 2: Documents client page with list and upload UI** - `3bbf54d` (feat)

## Files Created/Modified
- `migrations/019_uploaded_files_patient_id.sql` - Adds asher_patient_id column and index to asher_uploaded_files
- `tests/api/portal-documents.test.ts` - 14 unit tests for GET and POST documents routes
- `app/api/portal/documents/route.ts` - Documents API with GET list + POST upload, mock mode support
- `app/portal/documents/page.tsx` - Server page with metadata
- `app/portal/documents/DocumentsClient.tsx` - Client component with document list, upload UI, empty/loading/error states

## Decisions Made
- GET returns 401 (not empty array) when asherPatientId is null -- documents require a patient record, unlike orders which return empty array for Case C users. This is because document storage is tied to the patient ID.
- Preview URLs generated fresh on every page load to avoid S3 presigned URL expiration issues.
- Portal upload purposes use `portal_` prefix (`portal_id`, `portal_prescription`, `portal_lab_results`, `portal_other`) to distinguish from intake-created documents (`id_document`, `telehealth_signature`, etc.).
- Mock mode still records in DB so the document list works end-to-end on staging without Asher Med API key.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @testing-library/dom peer dependency**
- **Found during:** Task 1 (test setup)
- **Issue:** Pre-existing missing peer dependency prevented any test file from running
- **Fix:** `npm install -D @testing-library/dom --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** All 314 tests pass
- **Committed in:** 02d6190 (Task 1 RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing infrastructure issue, not caused by this plan's changes. Fix was necessary to run any tests.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Documents page accessible at `/portal/documents` when authenticated
- Upload flow works on staging via mock mode
- Plan 03-01 (profile page) can be executed independently
- Phase 4 (Forms & Renewals) can begin after Phase 3 completion

## Self-Check: PASSED

- All 5 files created: FOUND
- All 3 commits exist: FOUND (02d6190, 2ba3e7f, 3bbf54d)
- DocumentsClient.tsx: 463 lines (min 100)
- portal-documents.test.ts: 446 lines (min 60)
- All 314 tests passing across 21 test files

---
*Phase: 03-profile-documents*
*Completed: 2026-03-14*
