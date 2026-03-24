---
phase: quick
plan: 6-admin-member-lifecycle
subsystem: admin-dashboard
tags: [admin, stripe, member-management, lifecycle]
key-files:
  created:
    - app/api/admin/members/[customerId]/cancel/route.ts
    - app/api/admin/members/[customerId]/pause/route.ts
    - app/api/admin/members/[customerId]/upgrade/route.ts
  modified:
    - lib/db.ts
    - app/api/admin/analytics/route.ts
    - app/admin/AdminDashboardClient.tsx
decisions:
  - Used Stripe pause_collection with void behavior for pause (no invoices generated during pause)
  - Upgrade uses proration (create_prorations) so customers are charged fairly for mid-cycle changes
  - Memberships exposed via analytics endpoint (allMemberships) rather than separate API to reuse existing auth pattern
  - Member table shows Stripe customer ID since memberships table does not store email directly
metrics:
  duration: 7m40s
  completed: 2026-03-24T03:37:00Z
  tasks: 5/5
  files-created: 3
  files-modified: 3
---

# Feature 3: Member Lifecycle Management Summary

Admin can now pause, cancel, and upgrade/downgrade member subscriptions directly from the admin dashboard, with all actions flowing through Stripe and logged to the audit table.

## Completed Tasks

| Task | Description | Commit | Key Files |
|------|------------|--------|-----------|
| 1 | DB functions (getMemberDetails, logAdminAction, getAllMembershipsForAdmin) | 4e5241f | lib/db.ts |
| 2 | Cancel endpoint with Stripe integration | 4e5241f | app/api/admin/members/[customerId]/cancel/route.ts |
| 3 | Pause endpoint with resume date | 4e5241f | app/api/admin/members/[customerId]/pause/route.ts |
| 4 | Upgrade/change tier endpoint with proration | 4e5241f | app/api/admin/members/[customerId]/upgrade/route.ts |
| 5 | Admin dashboard Member Management section with modals | 4e5241f | app/admin/AdminDashboardClient.tsx |

## Implementation Details

### API Endpoints

**POST /api/admin/members/[customerId]/cancel**
- Auth: admin session required (same pattern as analytics endpoint)
- Calls `stripe.subscriptions.cancel(subscriptionId)`
- Updates membership: `subscription_status = 'cancelled'`, sets `cancelled_at` and `cancellation_reason`
- Logs to `admin_actions` table with previous status and plan tier

**POST /api/admin/members/[customerId]/pause**
- Auth: admin session required
- Body: `{ resumeDate: string }` (ISO date, must be future)
- Calls `stripe.subscriptions.update()` with `pause_collection: { behavior: 'void', resumes_at }`
- Updates membership: `subscription_status = 'paused'`
- Logs to `admin_actions` with resume date

**POST /api/admin/members/[customerId]/upgrade**
- Auth: admin session required
- Body: `{ newTier: 'core' | 'catalyst' | 'concierge' }`
- Retrieves current subscription to get item ID
- Maps tier to Stripe price ID from `lib/config/plans.ts` (PLANS array)
- Calls `stripe.subscriptions.update()` with new price and `proration_behavior: 'create_prorations'`
- Updates membership: `plan_tier = newTier`
- Validates: tier must be different, subscription must not be cancelled

### Database Functions Added

- `getAllMembershipsForAdmin()` — Returns all rows from memberships table (id, stripe_customer_id, stripe_subscription_id, plan_tier, subscription_status, timestamps, cancellation info)
- `getMemberDetails()` and `logAdminAction()` already existed from a prior session

### Admin Dashboard UI

- **Member Management** section added between "Membership Breakdown" and "Coupon Performance"
- Search by Stripe customer ID
- Filter by status (active, paused, cancelled, trialing, past_due)
- Per-row action buttons: Pause (yellow), Change (blue), Cancel (red) — only shown for active subscriptions
- Paused/cancelled members show status text instead of action buttons
- **Pause Modal**: Date picker for resume date (minimum: tomorrow), confirmation button
- **Cancel Modal**: Red warning banner with "Are you sure?", optional reason input, confirmation
- **Upgrade Modal**: Dropdown with available tiers (excludes current), shows pricing, confirmation
- Success/error messages displayed as banners above the table
- Loading states on all action buttons during API calls
- Data refreshes automatically after any action

### Auth Pattern

All three endpoints use the same admin authentication pattern as the analytics route:
1. Verify JWT session via `getSession()`
2. Check email against `ADMIN_ALLOWED_EMAILS` or `PROTOCOL_BUILDER_ALLOWED_EMAILS` env vars
3. Also accepts provider emails via `isProviderEmail()`

### Stripe API Version

Using `apiVersion: '2026-02-25.clover'` consistent with the existing webhook handler.

## Deviations from Plan

### Auto-added: getAllMembershipsForAdmin DB function [Rule 2]

**Found during:** Task 5 (UI implementation)
**Issue:** The plan suggested using `allCustomers` data, but `allCustomers` comes from the `club_members` table which has no Stripe subscription IDs or membership status. The Member Management section requires data from the `memberships` table.
**Fix:** Added `getAllMembershipsForAdmin()` to `lib/db.ts` and included `allMemberships` in the analytics endpoint response.
**Files modified:** lib/db.ts, app/api/admin/analytics/route.ts

### Pre-existing cancel and pause routes

**Found during:** Task 2-3
**Issue:** The cancel and pause API routes already existed as untracked files from a previous session. They were well-implemented with proper auth, Stripe integration, and audit logging.
**Fix:** Reviewed existing code, confirmed correctness, and committed as-is. Only the upgrade route was newly created.

## Test Results

- 608 tests passing (46 test files)
- TypeScript type check clean (npx tsc --noEmit)
- Zero regressions

## Self-Check: PASSED

All 7 files verified present. Commit 4e5241f verified in git log.
