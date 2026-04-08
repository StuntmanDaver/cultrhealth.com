---
phase: 03-kit-registration
plan: 01
subsystem: api
tags: [siphox, kit-lifecycle, portal, sidebar, next-api-routes]

requires:
  - phase: 01-foundation
    provides: SiPhox API client, Zod schemas, DB tables
  - phase: 02-checkout-integration
    provides: Fulfillment columns on siphox_kit_orders, SiphoxKitOrderRow interface
provides:
  - deriveKitLifecycleState function mapping DB columns to 7 user-facing states
  - registerKit SiPhox client function (POST /kits/:kitID/register)
  - GET /api/portal/labs returning kit orders with lifecycle state
  - POST /api/portal/labs for kit registration
  - POST /api/portal/labs/validate for kit ID validation
  - PortalSidebar component with forest theme
  - Portal layout with sidebar integration (desktop fixed + mobile drawer)
affects: [03-02-labs-ui, 04-labs-dashboard]

tech-stack:
  added: []
  patterns: [portal-sidebar-navigation, kit-lifecycle-state-derivation]

key-files:
  created:
    - lib/siphox/kit-lifecycle.ts
    - app/api/portal/labs/route.ts
    - app/api/portal/labs/validate/route.ts
    - components/portal/PortalSidebar.tsx
    - tests/lib/kit-lifecycle.test.ts
    - tests/api/portal-labs.test.ts
    - tests/api/portal-labs-validate.test.ts
    - tests/api/portal-labs-register.test.ts
  modified:
    - lib/siphox/client.ts
    - lib/siphox/db.ts
    - lib/siphox/index.ts
    - app/portal/layout.tsx

key-decisions:
  - "getKitOrdersByCustomer changed to SELECT * for consistency with other queries and to include fulfillment columns"
  - "Kit registration POST updates most recent order status to 'registered' (non-fatal if DB update fails)"
  - "Portal sidebar uses same forest theme as CreatorSidebar but with white/20 active state on forest background"

patterns-established:
  - "Portal sidebar: PortalSidebar with mobileOpen/onClose props, md:w-60 fixed desktop, w-72 slide-in mobile"
  - "Kit lifecycle derivation: check status field first for advanced states, then fulfillment_status + tracking_number"

requirements-completed: [KIT-01, KIT-02, KIT-03, KIT-04, KIT-05]

duration: 5min
completed: 2026-03-17
---

# Phase 3 Plan 01: Kit Registration API and Portal Sidebar Summary

**Kit lifecycle state derivation, registerKit client, labs API routes (GET/POST/validate), and forest-themed portal sidebar with layout integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T03:36:18Z
- **Completed:** 2026-03-17T03:41:01Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Kit lifecycle module correctly maps all DB status combinations to 7 user-facing states (no_kit, ordered, shipped, registered, sample_mailed, processing, results_ready)
- Three API endpoints: GET /api/portal/labs (kit data), POST /api/portal/labs (registration), POST /api/portal/labs/validate (validation)
- Portal sidebar with Dashboard and Labs navigation, forest theme, mobile drawer
- 23 new tests covering lifecycle derivation and all API routes; full suite at 478 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Kit lifecycle module, registerKit, DB fix, API routes** - `6367cd0` (feat)
2. **Task 2: Portal sidebar and layout integration** - `10d6796` (feat)

## Files Created/Modified
- `lib/siphox/kit-lifecycle.ts` - KitLifecycleState type, KIT_LIFECYCLE_STAGES array, deriveKitLifecycleState function
- `lib/siphox/client.ts` - Added registerKit function (POST /kits/:kitID/register)
- `lib/siphox/db.ts` - Fixed getKitOrdersByCustomer to SELECT * (includes fulfillment columns)
- `lib/siphox/index.ts` - Updated barrel exports with registerKit, lifecycle exports
- `app/api/portal/labs/route.ts` - GET (kit orders + lifecycle state) and POST (kit registration)
- `app/api/portal/labs/validate/route.ts` - POST kit ID validation via SiPhox API
- `components/portal/PortalSidebar.tsx` - Forest-themed sidebar with Dashboard and Labs nav
- `app/portal/layout.tsx` - Added sidebar + mobile header + content offset

## Decisions Made
- Changed getKitOrdersByCustomer to SELECT * for consistency with getPendingFulfillmentOrders, getDeferredIntakeOrders, and getOrderByCheckoutSession patterns
- Kit registration updates the most recent order's status to 'registered'; failure is non-fatal (SiPhox registration already succeeded)
- Portal sidebar uses forest bg (bg-brand-primary) with white/20 active state, matching the user decision from CONTEXT.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All API routes ready for the Labs UI page (Plan 03-02)
- PortalSidebar already has Labs nav item pointing to /portal/labs
- Kit lifecycle stages exported for timeline component in Plan 02
- Portal layout with sidebar offset ready for new pages

---
*Phase: 03-kit-registration*
*Completed: 2026-03-17*
