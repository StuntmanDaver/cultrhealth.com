---
phase: 01-foundation
plan: 01
subsystem: api
tags: [siphox, zod, biomarkers, api-client, resend, email]

# Dependency graph
requires: []
provides:
  - "Typed SiPhox API client with Bearer auth and Zod validation (lib/siphox/)"
  - "6 Zod schemas for all SiPhox API responses (customer, order, credits, kit validation, report, biomarker result)"
  - "53-entry biomarker mapping config with 7 categories (lib/config/siphox-biomarkers.ts)"
  - "sendLowCreditAlert admin email function in lib/resend.ts"
  - "SiphoxApiError class for error handling"
  - "isSiphoxConfigured utility function"
affects: [01-02, 02-checkout-integration, 03-kit-registration, 04-labs-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["siphoxRequest<T> generic wrapper with Zod schema parameter", "schema.safeParse validation gate on all API responses", ".passthrough() on all Zod object schemas for forward compatibility"]

key-files:
  created:
    - lib/siphox/client.ts
    - lib/siphox/schemas.ts
    - lib/siphox/types.ts
    - lib/siphox/errors.ts
    - lib/siphox/index.ts
    - lib/config/siphox-biomarkers.ts
    - tests/lib/siphox-client.test.ts
    - tests/lib/siphox-schemas.test.ts
    - tests/lib/siphox-biomarkers.test.ts
  modified:
    - lib/resend.ts
    - tests/setup.ts

key-decisions:
  - "Used directory structure lib/siphox/ (5 files) over single file for separation of concerns"
  - "All Zod schemas use .passthrough() since API response shapes are inferred, not confirmed against real API"
  - "HOMA-IR unit set to 'index' rather than '%' since it is a calculated ratio, not a percentage"
  - "53 biomarkers mapped (3 more than 50 CSV rows due to derived/ratio entries like DHEA-S, Free Testosterone, LH:FSH Ratio)"

patterns-established:
  - "siphoxRequest<T>(endpoint, schema, options): Generic wrapper that validates every response through Zod before returning"
  - "Dynamic import for email alerts: checkCreditBalance uses import('@/lib/resend') to avoid circular dependencies"
  - "SiPhox env vars: SIPHOX_API_KEY (required) + SIPHOX_API_URL (optional, defaults to production)"

requirements-completed: [API-01, API-02, API-03, API-04, API-05, DB-04]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 1 Plan 1: SiPhox API Client & Biomarker Config Summary

**Typed SiPhox Health API client with Bearer auth, Zod-validated responses, 53-entry biomarker mapping, and low-credit admin alerting**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T04:04:38Z
- **Completed:** 2026-03-15T04:11:04Z
- **Tasks:** 2 (both TDD: RED-GREEN)
- **Files created:** 9
- **Files modified:** 2

## Accomplishments
- SiPhox API client with Bearer token auth, Zod validation on every response, and 9 endpoint functions
- 6 Zod response schemas with .passthrough() for forward compatibility against unverified API shapes
- 53-entry biomarker mapping config covering all 7 categories (heart, metabolic, hormonal, nutritional, inflammation, thyroid, extended)
- sendLowCreditAlert admin email function following existing Resend pattern
- 51 new tests (14 client + 23 schema + 14 biomarker), full suite at 379 tests with zero regressions

## Task Commits

Each task was committed atomically (TDD: test commit then implementation commit):

1. **Task 1: SiPhox API client, Zod schemas, error class, low-credit alert**
   - `04b23ac` (test: failing tests for client and schemas - RED)
   - `dfc3793` (feat: implement client, schemas, types, errors, barrel export, sendLowCreditAlert - GREEN)
2. **Task 2: Biomarker mapping config**
   - `a344448` (test: failing test for biomarker config - RED)
   - `6eda87c` (feat: implement 53-entry biomarker mapping config - GREEN)

## Files Created/Modified
- `lib/siphox/errors.ts` - SiphoxApiError class following AsherMedApiError pattern
- `lib/siphox/schemas.ts` - 6 Zod schemas for SiPhox API responses (all use .passthrough())
- `lib/siphox/types.ts` - TypeScript types inferred from Zod schemas + request types
- `lib/siphox/client.ts` - Typed API client with siphoxRequest<T> wrapper, 9 endpoint functions
- `lib/siphox/index.ts` - Barrel export for public API surface
- `lib/config/siphox-biomarkers.ts` - 53 biomarker mappings with categories, units, descriptions
- `lib/resend.ts` - Added sendLowCreditAlert function (appended to existing file)
- `tests/setup.ts` - Added SIPHOX_API_KEY and SIPHOX_API_URL mock env vars
- `tests/lib/siphox-client.test.ts` - 14 tests covering auth, URL, errors, credit check
- `tests/lib/siphox-schemas.test.ts` - 23 tests covering good/bad/extra field fixtures
- `tests/lib/siphox-biomarkers.test.ts` - 14 tests covering completeness, uniqueness, helpers

## Decisions Made
- Used `lib/siphox/` directory (5 files) over single file -- separation of concerns for client, schemas, types, errors, and barrel export
- All Zod schemas use `.passthrough()` since API response shapes are inferred from documentation, not validated against real API responses
- HOMA-IR uses unit `index` rather than `%` since it is a calculated ratio (fasting glucose x fasting insulin / 405)
- Mapped 53 biomarkers total (50 from CSV + 3 derived entries: DHEA-S, Free Testosterone, LH:FSH Ratio that appear in PROJECT.md category definitions but were implicitly represented in CSV)
- checkCreditBalance uses dynamic import for sendLowCreditAlert to avoid circular dependency between siphox client and resend module

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest `-x` flag not supported in v4.0.18 -- used `--bail 1` instead (minor CLI difference, no impact)

## User Setup Required

None - no external service configuration required. SIPHOX_API_KEY and SIPHOX_API_URL will need to be added to Vercel env vars before Phase 2 checkout integration, but that is out of scope for this plan.

## Next Phase Readiness
- lib/siphox/ client is ready for consumption by Plan 01-02 (database migration and data access layer)
- Biomarker config is ready for Phase 4 (labs dashboard) to use for result categorization
- Zod schemas need validation against real SiPhox API responses (flagged as known risk in STATE.md blockers)

---
*Phase: 01-foundation*
*Completed: 2026-03-15*
