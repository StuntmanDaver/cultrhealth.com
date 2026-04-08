---
phase: 02-checkout-integration
plan: 02
subsystem: api
tags: [stripe, checkout-sessions, blood-test, add-on, subscription, payments]

# Dependency graph
requires:
  - phase: 02-checkout-integration/01
    provides: "SiPhox fulfillment orchestration with Core tier add-on detection via BLOOD_TEST_STRIPE_PRICE_ID"
  - phase: 01-foundation/01
    provides: "SiPhox API client and biomarker configuration"
provides:
  - "Stripe Checkout Session route for Core tier with optional $135 blood test add-on"
  - "BLOOD_TEST_ADDON config export from lib/config/plans.ts"
  - "Modified checkout route that uses Checkout Sessions for Core, Payment Links for other tiers"
  - "optional_items API with adjustable_quantity fallback for blood test presentation"
affects: [03-kit-registration, 04-labs-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["optional_items with adjustable_quantity fallback for Stripe Checkout Session add-ons", "Core tier checkout uses server-side Checkout Sessions while other tiers keep Payment Links"]

key-files:
  created:
    - app/api/checkout/subscription/route.ts
    - tests/api/checkout-subscription.test.ts
  modified:
    - app/api/checkout/route.ts
    - lib/config/plans.ts

key-decisions:
  - "Core tier uses Stripe Checkout Sessions (server-side) while Catalyst+ and Concierge continue using Payment Links"
  - "Blood test add-on presented via optional_items API first, falls back to adjustable_quantity (min 0, max 1) if API version doesn't support it"
  - "Dedicated /api/checkout/subscription route created for Core-only use; main /api/checkout route also handles Core inline"
  - "BLOOD_TEST_ADDON stripePriceId sourced from BLOOD_TEST_STRIPE_PRICE_ID env var -- must be created in Stripe dashboard"

patterns-established:
  - "optional_items + adjustable_quantity fallback: try newer Stripe feature first, catch error and use older approach"
  - "Plan-specific checkout routing: Core gets server-side Checkout Session, all other tiers get Payment Link redirect"

requirements-completed: [CHK-02]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 2 Plan 2: Core Tier Checkout Session with Blood Test Add-On Summary

**Stripe Checkout Session for Core tier with $135 optional blood test add-on using optional_items API and adjustable_quantity fallback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T01:02:28Z
- **Completed:** 2026-03-17T01:07:00Z
- **Tasks:** 1
- **Files created:** 2
- **Files modified:** 2

## Accomplishments
- Core tier checkout now creates a server-side Stripe Checkout Session with the $199/mo subscription as a line item and the $135 blood test as an optional add-on the customer can accept or decline
- Catalyst+ and Concierge tiers continue using their existing Payment Links unchanged
- 14 new tests covering Checkout Session creation, optional_items/adjustable_quantity fallback, attribution forwarding, validation, and non-regression for other tiers
- Full suite at 455 tests with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Core tier Checkout Session route with optional blood test add-on** - `ec3beb8` (feat)

## Files Created/Modified
- `app/api/checkout/subscription/route.ts` - New Core-only Checkout Session route with optional blood test add-on
- `app/api/checkout/route.ts` - Modified to create Checkout Session for Core tier, Payment Links for all others
- `lib/config/plans.ts` - Added BLOOD_TEST_ADDON export with name, description, price ($135), and stripePriceId
- `tests/api/checkout-subscription.test.ts` - 14 tests: session creation, optional_items, metadata, attribution, validation, fallback, non-regression

## Decisions Made
- Used Stripe Checkout Sessions (server-side) for Core tier instead of Payment Links -- Payment Links cannot dynamically add optional one-time items alongside subscriptions
- Blood test add-on presented via `optional_items` API first; if Stripe throws (API version incompatibility), falls back to adding blood test as a regular `line_item` with `adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 }`
- Created both a dedicated `/api/checkout/subscription` route (Core-only) and integrated the same logic into the main `/api/checkout` route -- the dedicated route provides a clean separation, the main route provides backward compatibility for the join page
- `BLOOD_TEST_ADDON.stripePriceId` is read from env var `BLOOD_TEST_STRIPE_PRICE_ID` -- if not set, checkout session is created without the add-on gracefully

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Environment variables to add in Vercel:**
- `BLOOD_TEST_STRIPE_PRICE_ID` - Create a one-time $135 product/price in the Stripe dashboard for the at-home blood test kit. Set the resulting price ID (e.g., `price_xxx`) as this env var.

**Stripe dashboard setup:**
1. Create a new Product: "At-Home Blood Test Kit" ($135, one-time)
2. Copy the Price ID from the product
3. Set `BLOOD_TEST_STRIPE_PRICE_ID` in Vercel env vars (both staging and production)

## Next Phase Readiness
- Core tier checkout with optional blood test add-on is fully wired
- When a customer selects the blood test during Core checkout, the webhook (Plan 02-01) detects `BLOOD_TEST_STRIPE_PRICE_ID` in the line items and triggers SiPhox fulfillment
- When a customer declines the blood test, the webhook sees no matching line item and skips SiPhox fulfillment for Core
- Phase 3 (kit registration) can proceed -- the checkout-to-fulfillment pipeline is complete
- The `BLOOD_TEST_STRIPE_PRICE_ID` env var must be set in Vercel before this feature goes live

## Self-Check: PASSED

All 4 files verified present. Task commit ec3beb8 verified in git log.

---
*Phase: 02-checkout-integration*
*Completed: 2026-03-17*
