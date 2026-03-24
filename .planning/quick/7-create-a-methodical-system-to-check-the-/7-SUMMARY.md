---
phase: quick-7
plan: 01
subsystem: testing
tags: [smoke-tests, health-check, site-reliability, devops]
dependency_graph:
  requires: []
  provides: [site-health-check, smoke-tests]
  affects: [CI, deployment-verification]
tech_stack:
  added: []
  patterns: [tier-based-health-check, import-smoke-tests]
key_files:
  created:
    - scripts/site-health-check.mjs
    - tests/smoke/critical-pages.test.ts
    - tests/smoke/critical-apis.test.ts
  modified:
    - package.json
decisions:
  - Replaced app/api/stripe/checkout/route.ts (does not exist) with 9 verified API routes
  - Connection-refused detection triggers early exit to avoid hammering dead server
  - Tier 1 failures drive exit code (non-zero for CI integration)
metrics:
  duration: 2m 24s
  completed: 2026-03-24T04:09:00Z
  tasks: 3/3
  files_created: 3
  files_modified: 1
---

# Quick Task 7: Site Health-Check System Summary

Tier-based HTTP health check (24 endpoints) and Vitest smoke tests (21 import checks) for verifying critical site sections after deployments.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Standalone HTTP site health-check script | bac8d1a | scripts/site-health-check.mjs |
| 2 | Vitest smoke tests for critical pages and API routes | b67ab48 | tests/smoke/critical-pages.test.ts, tests/smoke/critical-apis.test.ts |
| 3 | npm scripts for health check and smoke tests | 99501bf | package.json |

## What Was Built

### HTTP Health Check Script (`scripts/site-health-check.mjs`)

A standalone Node.js ESM script (zero dependencies) that methodically checks 24 endpoints across 4 priority tiers:

- **Tier 1 (Revenue-Critical):** Homepage, pricing, 3 join pages, quiz, checkout API, club signup API
- **Tier 2 (Patient Experience):** Intake, login, portal login, how-it-works, therapies, auth API, intake questions API
- **Tier 3 (Marketing & SEO):** Science, FAQ, community, creators, privacy, terms
- **Tier 4 (Admin & Creator):** Admin panel, creator login, creator application

Features: ANSI color output (PASS/FAIL/WARN), per-request timing, body content validation, 10s timeout, graceful connection-refused handling, early exit on dead server, exit code 1 on any Tier 1 failure.

### Vitest Smoke Tests

**critical-pages.test.ts** (12 tests): Verifies page modules for homepage, pricing, quiz, FAQ, how-it-works, science, login, intake, creators, community, therapies, and portal login can be imported and export valid page component functions.

**critical-apis.test.ts** (9 tests): Verifies API route modules for checkout, club signup, auth magic-link, auth verify, intake questions, intake submit, creators apply, club orders, and member profile export the expected HTTP method handlers.

### npm Scripts

- `npm run check:health` -- check localhost:3000
- `npm run check:health:staging` -- check staging.cultrhealth.com
- `npm run test:smoke` -- run 21 import-level smoke tests via Vitest

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] app/api/stripe/checkout/route.ts does not exist**
- **Found during:** Task 2
- **Issue:** Plan specified `app/api/stripe/checkout/route.ts` as a smoke test target, but no such file exists in the codebase
- **Fix:** Removed it from the API smoke tests; the checkout functionality is at `app/api/checkout/route.ts` which is already covered
- **Files modified:** tests/smoke/critical-apis.test.ts

## Verification

- Health check script runs without errors, outputs structured tier-based results
- All 21 Vitest smoke tests pass (2 test files, 21 tests, 1.13s)
- All 3 npm scripts correctly defined in package.json

## Self-Check: PASSED

All 3 created files verified on disk. All 3 commit hashes (bac8d1a, b67ab48, 99501bf) verified in git log.
