---
phase: 02-checkout-integration
plan: 01
subsystem: api
tags: [siphox, stripe, webhook, cron, fulfillment, resend, email, postgres]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: "Typed SiPhox API client with Bearer auth and Zod validation (lib/siphox/client.ts)"
  - phase: 01-foundation/02
    provides: "Database tables and data access layer for siphox_customers, siphox_kit_orders (lib/siphox/db.ts)"
provides:
  - "Fulfillment orchestration module with 4 exported functions (lib/siphox/fulfillment.ts)"
  - "6 new DB functions for fulfillment order lifecycle (insertFulfillmentOrder, getOrderByCheckoutSession, getPendingFulfillmentOrders, getDeferredIntakeOrders, updateFulfillmentStatus, incrementRetryCount)"
  - "Migration 021 extending siphox_kit_orders with 6 fulfillment columns and 2 indexes"
  - "3 email templates for kit fulfillment confirmation, refund alerts, and failure alerts"
  - "Cron route at /api/cron/siphox-fulfillment running every 15 minutes"
  - "Stripe webhook extensions for checkout fulfillment and refund notification"
affects: [02-02, 03-kit-registration, 04-labs-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Non-fatal try/catch blocks in webhook handler -- subscription always activates regardless of SiPhox outcome", "Cron job handles both deferred intake and retry logic in single route", "Dynamic import pattern for fulfillment module to avoid loading SiPhox code on every webhook", "FulfillmentStatus union type for 6-state lifecycle"]

key-files:
  created:
    - migrations/021_siphox_fulfillment_columns.sql
    - lib/siphox/fulfillment.ts
    - app/api/cron/siphox-fulfillment/route.ts
    - tests/lib/siphox-fulfillment.test.ts
    - tests/api/cron-siphox-fulfillment.test.ts
  modified:
    - lib/siphox/db.ts
    - lib/siphox/index.ts
    - lib/resend.ts
    - app/api/webhook/stripe/route.ts
    - vercel.json

key-decisions:
  - "SiPhox API response types use _id not id -- all fulfillment code accesses ._id from Zod-validated responses"
  - "SiphoxKitOrderRow interface extended with 6 new columns matching migration 021"
  - "Address resolution queries pending_intakes table by email (case-insensitive) for latest intake_data"
  - "Refund notification never auto-cancels SiPhox orders -- sends context-aware suggested action to support instead"
  - "Core tier add-on detection uses BLOOD_TEST_STRIPE_PRICE_ID env var to check line items"

patterns-established:
  - "triggerSiphoxFulfillment never throws: top-level try/catch logs errors, returns void"
  - "Idempotency via getOrderByCheckoutSession: duplicate webhook calls for same checkout session are safe"
  - "6-state fulfillment lifecycle: pending_intake -> pending_fulfillment -> processing -> fulfilled | failed | needs_credits"
  - "Context-aware refund alerts: suggested action varies by kit status (cancel if pending, return if shipped, no action if failed)"

requirements-completed: [CHK-01, CHK-03, CHK-04]

# Metrics
duration: 10min
completed: 2026-03-17
---

# Phase 2 Plan 1: SiPhox Fulfillment Orchestration Summary

**Automated SiPhox kit ordering on Stripe checkout with deferred fulfillment, 15-minute cron retry, refund notifications, and 3 email templates**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-17T00:49:02Z
- **Completed:** 2026-03-17T00:59:00Z
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 5

## Accomplishments
- Fulfillment orchestration module with 4 functions handling the complete kit order lifecycle from checkout through retry and refund
- Migration adding 6 columns to siphox_kit_orders (fulfillment_status, retry_count, last_error, stripe_checkout_session_id, customer_email, plan_tier) plus 2 partial indexes
- Non-fatal SiPhox integration in Stripe webhook -- subscription always activates regardless of kit order outcome
- Cron job processing deferred and failed orders every 15 minutes with 3-retry max and support email on permanent failure
- 32 new tests (27 fulfillment + 5 cron), full suite at 441 tests with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration, fulfillment DB functions, email templates** - `6f08c59` (feat)
2. **Task 2: Fulfillment orchestration module with tests** - `af8865e` (feat)
3. **Task 3: Stripe webhook wiring and cron route** - `2cdcd9e` (feat)

## Files Created/Modified
- `migrations/021_siphox_fulfillment_columns.sql` - 6 new columns on siphox_kit_orders + 2 indexes
- `lib/siphox/db.ts` - 6 new fulfillment DB functions + FulfillmentStatus type + extended SiphoxKitOrderRow
- `lib/siphox/fulfillment.ts` - Orchestration module: triggerSiphoxFulfillment, processDeferredOrders, retryFailedOrders, notifySiphoxRefund
- `lib/siphox/index.ts` - Updated barrel exports with all new functions and types
- `lib/resend.ts` - 3 new email functions: sendKitFulfillmentEmail, sendSiphoxRefundAlert, sendSiphoxFailureAlert
- `app/api/webhook/stripe/route.ts` - Non-fatal SiPhox blocks in handleCheckoutCompleted and handleChargeRefunded
- `app/api/cron/siphox-fulfillment/route.ts` - Cron route with CRON_SECRET auth
- `vercel.json` - Added crons array with 15-minute schedule
- `tests/lib/siphox-fulfillment.test.ts` - 27 tests covering all orchestration paths
- `tests/api/cron-siphox-fulfillment.test.ts` - 5 tests for cron route auth and execution

## Decisions Made
- SiPhox API responses use `_id` (not `id`) due to Zod schemas with `.passthrough()` -- all fulfillment code accesses `._id` on API response objects
- Address resolution queries `pending_intakes` table (not `asher_orders`) since that is where intake form data including shipping address is stored
- Refund notification provides context-aware suggested actions: "Cancel order" for pending, "Request return" for fulfilled, "No action needed" for failed/needs_credits
- Core tier blood test add-on detection uses `BLOOD_TEST_STRIPE_PRICE_ID` env var -- webhook checks line items only when plan_tier is 'core'
- SiphoxKitOrderRow interface updated with all 6 new columns to maintain type safety across the codebase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SiPhox API response field name (_id vs id)**
- **Found during:** Task 2 (fulfillment module implementation)
- **Issue:** Fulfillment code accessed `.id` on SiPhox customer and order responses, but Zod schemas define the field as `_id`. With `.passthrough()`, `.id` resolves to `unknown` from the index signature.
- **Fix:** Changed all API response field access from `.id` to `._id` in fulfillment.ts (9 occurrences across triggerSiphoxFulfillment, processDeferredOrders, retryFailedOrders)
- **Files modified:** lib/siphox/fulfillment.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** af8865e (Task 2 commit)

**2. [Rule 1 - Bug] Extended SiphoxKitOrderRow with fulfillment columns**
- **Found during:** Task 2 (type errors when accessing fulfillment_status, retry_count, customer_email, plan_tier)
- **Issue:** The existing SiphoxKitOrderRow interface only had the migration 020 columns. Code accessing new columns from migration 021 (fulfillment_status, retry_count, customer_email, plan_tier) produced TS2339 errors.
- **Fix:** Added 6 new fields to SiphoxKitOrderRow interface: fulfillment_status, retry_count, last_error, stripe_checkout_session_id, customer_email, plan_tier
- **Files modified:** lib/siphox/db.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** af8865e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary for type safety. No scope creep.

## Issues Encountered
- Code audit hook flagged pre-existing PHI logging patterns in webhook file (Asher Med patient ID logging) -- these are out of scope for this plan and were not modified
- Code audit hook has a shell script bug on line 34 (`integer expression expected`) -- pre-existing, not caused by this plan

## User Setup Required

**Environment variables to add in Vercel:**
- `BLOOD_TEST_STRIPE_PRICE_ID` - Stripe price ID for the $135 blood test add-on (required only if Core tier add-on is offered)
- `CRON_SECRET` - Bearer token for cron job authentication (may already be set for existing cron routes)

**Database migration to run:**
```bash
node scripts/run-migration.mjs
# Execute: migrations/021_siphox_fulfillment_columns.sql
```

## Next Phase Readiness
- Fulfillment orchestration is complete and ready for Plan 02-02 (Core tier checkout with add-on)
- Phase 3 (kit registration) can use the fulfillment_status tracking for kit lifecycle display
- Migration 021 must be run on staging DB before deploying this code
- CRON_SECRET must be set in Vercel env vars for the cron job to authenticate

## Self-Check: PASSED

All 10 files verified present. All 3 commits verified in git log.

---
*Phase: 02-checkout-integration*
*Completed: 2026-03-17*
