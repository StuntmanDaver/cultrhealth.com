---
status: awaiting_human_verify
trigger: "Proactive health check of the SiPhox Health API integration — verify all endpoints are configured correctly, API key is set, and the integration is functional end-to-end."
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T01:30:00Z
---

## Current Focus

hypothesis: CONFIRMED -- SiPhox integration had 3 critical code/config issues, 2 important gaps, and 2 low-priority debt items
test: Full codebase audit of 86 SiPhox-related files, all tests, type check
expecting: Code fixes verified; env var setup requires user action
next_action: User needs to (1) set env vars in Vercel, (2) run migration 027

## Symptoms

expected: All SiPhox Health API endpoints should be working correctly — biomarker catalog, lab results fetching, kit ordering, and dashboard data display should all function properly.
actual: Unknown — this is a proactive health check. User wants to verify everything is working before relying on it.
errors: None reported yet — need to discover if any exist.
reproduction: Check all SiPhox-related code paths, API configuration, env vars, and endpoint connectivity.
started: User is preparing the SiPhox integration for active use and wants to verify it's fully operational.

## Eliminated

- hypothesis: Code has structural defects (missing exports, broken imports, type errors)
  evidence: All 608 tests pass across 46 test files. All exports resolve correctly. Zero TypeScript compile errors.
  timestamp: 2026-03-23T00:30:00Z

- hypothesis: Zod schemas are too strict and will reject real API responses
  evidence: Schemas use .passthrough() on all objects and .optional() on non-critical fields. This is resilient to extra fields from the API.
  timestamp: 2026-03-23T00:35:00Z

- hypothesis: Cron jobs are not configured
  evidence: vercel.json has both cron jobs configured (siphox-fulfillment every 15 min, siphox-results every hour)
  timestamp: 2026-03-23T00:40:00Z

- hypothesis: Stripe webhook integration is fragile
  evidence: Both SiPhox integration points in the Stripe webhook (checkout fulfillment and refund notification) are wrapped in non-fatal try/catch. Subscriptions always activate regardless of SiPhox outcome.
  timestamp: 2026-03-23T00:37:00Z

- hypothesis: Portal API routes will crash without SiPhox tables
  evidence: /api/portal/results and /api/portal/labs both catch SiphoxDatabaseError and return graceful empty state. UI will show "No results available yet" instead of crashing.
  timestamp: 2026-03-23T00:42:00Z

## Evidence

- timestamp: 2026-03-23T00:20:00Z
  checked: All .env files (.env, .env.local, .env.example)
  found: SIPHOX_API_KEY, SIPHOX_API_URL, and CRON_SECRET were NOT present in any local env files or .env.example
  implication: CRITICAL -- FIXED by adding to .env.example

- timestamp: 2026-03-23T00:22:00Z
  checked: docs/env-vars-go-live.md
  found: SIPHOX_API_KEY and SIPHOX_API_URL were completely missing from the go-live checklist
  implication: CRITICAL -- FIXED by adding SiPhox section to go-live doc

- timestamp: 2026-03-23T00:25:00Z
  checked: Migration 020 siphox_kit_orders FK constraint vs fulfillment.ts insertFulfillmentOrder
  found: siphox_kit_orders has FK REFERENCES siphox_customers(siphox_customer_id). But insertFulfillmentOrder defaults siphoxCustomerId to 'pending' when no customer exists yet.
  implication: CRITICAL -- FIXED by migration 027 (drops FK constraint)

- timestamp: 2026-03-23T00:28:00Z
  checked: isSiphoxConfigured() usage
  found: Function existed but was NEVER called from production code. Missing API key would throw instead of gracefully degrading.
  implication: IMPORTANT -- FIXED by adding guards to triggerSiphoxFulfillment, processDeferredOrders, retryFailedOrders

- timestamp: 2026-03-23T00:30:00Z
  checked: All 608 tests across 46 test files
  found: 100% pass rate (before and after fixes)
  implication: Code is structurally sound

- timestamp: 2026-03-23T00:32:00Z
  checked: lib/config/siphox-biomarkers.ts vs lib/siphox/biomarkers.ts
  found: Two separate biomarker catalog files exist. Phase 1 version only used by its own test.
  implication: LOW PRIORITY -- legacy file, not causing bugs

- timestamp: 2026-03-23T00:35:00Z
  checked: BLOOD_TEST_STRIPE_PRICE_ID env var
  found: Used in webhook Core tier add-on detection. Not documented anywhere.
  implication: FIXED in .env.example and go-live doc

- timestamp: 2026-03-23T00:38:00Z
  checked: Email functions for SiPhox
  found: All 5 email functions properly implemented in lib/resend.ts
  implication: Email infrastructure is ready -- no issues

- timestamp: 2026-03-23T00:40:00Z
  checked: Database migrations 020, 021, 022
  found: Three migrations are idempotent (IF NOT EXISTS). Need confirmation they've been run against staging DB.
  implication: Requires user verification

- timestamp: 2026-03-23T01:00:00Z
  checked: Pre-existing type errors (DashboardClient.tsx, intake/submit/route.ts)
  found: Two type errors existed before this health check. Fixed as part of cleanup.
  implication: Not SiPhox-specific but fixed during this session

- timestamp: 2026-03-23T01:15:00Z
  checked: Test suite after all fixes
  found: 608/608 tests pass. Zero TypeScript errors.
  implication: All code changes verified

## Resolution

root_cause: Three categories of issues found and addressed:

**CRITICAL (code fixes applied):**
1. FK constraint violation -- migration 027 drops the FK so deferred orders with siphox_customer_id='pending' can be inserted
2. No graceful degradation -- isSiphoxConfigured() guards added to all 3 fulfillment functions
3. Missing env var documentation -- SIPHOX_API_KEY, SIPHOX_API_URL, CRON_SECRET, BLOOD_TEST_STRIPE_PRICE_ID added to .env.example and go-live doc

**REQUIRES USER ACTION:**
4. SIPHOX_API_KEY must be set in Vercel env vars (both staging and production)
5. CRON_SECRET must be set in Vercel env vars
6. Migration 027 must be run against the staging database
7. Migrations 020-022 must be confirmed as already executed

**LOW PRIORITY (not fixed, noted):**
8. Duplicate lib/config/siphox-biomarkers.ts (Phase 1 legacy)
9. siphox-biomarkers.csv in project root (reference data)

fix: Applied code fixes (FK migration, isSiphoxConfigured guards, env var documentation, pre-existing type error fixes)
verification: 608/608 tests pass, zero TypeScript errors
files_changed:
  - migrations/027_siphox_relax_fk.sql (NEW)
  - lib/siphox/fulfillment.ts (isSiphoxConfigured guards)
  - tests/lib/siphox-fulfillment.test.ts (mock update)
  - docs/env-vars-go-live.md (SiPhox section added)
  - .env.example (SiPhox, CRON_SECRET, BLOOD_TEST_STRIPE_PRICE_ID)
  - app/portal/dashboard/DashboardClient.tsx (pre-existing type fix)
  - app/api/intake/submit/route.ts (pre-existing type fix)
