---
phase: quick
plan: 260331-fpi
subsystem: admin
tags: [admin-dashboard, fulfillment-pipeline, club-orders]

provides:
  - "Corrected admin dashboard action buttons matching canonical fulfillment pipeline"
  - "Stale-orders cron label in admin cron status section"
affects: [admin]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - app/admin/AdminDashboardClient.tsx

key-decisions:
  - "Task 1 (admin-utils.ts + db.ts) was already correct -- no changes needed"
  - "Removed Skip Approval button since it called non-existent needs_invoice status"
  - "Added dual action buttons for paid orders: Mark Shipped + Mark Fulfilled"

requirements-completed: []

duration: 3min
completed: 2026-03-31
---

# Quick Task 260331-fpi: Fix Admin Dashboard Fulfillment Pipeline Actions

**Removed stale fulfillment status references (needs_invoice, needs_shipment, shipped_complete) from admin dashboard and aligned action buttons with canonical pipeline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T15:28:51Z
- **Completed:** 2026-03-31T15:31:00Z
- **Tasks:** 2 (1 already correct, 1 executed)
- **Files modified:** 1

## Accomplishments

- Removed all stale status references (needs_invoice, needs_shipment, shipped_complete) from AdminDashboardClient.tsx
- Action buttons now match the canonical pipeline: pending_approval -> approved -> invoice_sent -> paid -> shipped -> fulfilled
- Paid orders get two buttons: "Mark Shipped" and "Mark Fulfilled" (for orders that skip shipping)
- Shipped orders get "Mark Fulfilled" button
- Cancel button exclusion updated to use fulfilled instead of shipped_complete
- Added 'stale-orders' -> 'Stale Order Alerts' to cron status labelMap

## Task Commits

1. **Task 1: Fix shared status utilities and DB revenue query** -- No commit (already correct: ORDER_STATUS_STYLES, getStatusColor, and getSalesStats all had correct pipeline statuses)
2. **Task 2: Fix overview Club Orders section and add fulfillment pipeline summary** -- `dfc96da` (fix)

## Files Created/Modified

- `app/admin/AdminDashboardClient.tsx` -- Replaced stale status action buttons with correct pipeline transitions, added stale-orders cron label

## Decisions Made

- Task 1 files (lib/admin-utils.ts, lib/db.ts) were already correct -- ORDER_STATUS_STYLES had all 9 correct statuses, getStatusColor covered all pipeline statuses, and getSalesStats already included shipped/fulfilled in revenue. No changes were made.
- Fulfillment pipeline summary section (Part A of Task 2) was already rendered in the file using data.clubOrderFulfillment. No changes needed.
- Removed the "Skip Approval" button entirely since it called the non-existent needs_invoice status transition

## Deviations from Plan

Task 1 required no changes (files were already correct). The fulfillment pipeline summary rendering (Task 2 Part A) was also already present. Only Task 2 Parts B and C required actual code changes. This reduced the work scope but the plan's success criteria are fully met.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

---
*Quick task: 260331-fpi*
*Completed: 2026-03-31*
