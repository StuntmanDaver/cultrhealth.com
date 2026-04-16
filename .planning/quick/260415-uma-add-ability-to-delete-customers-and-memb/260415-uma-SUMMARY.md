---
phase: quick
plan: 260415-uma
subsystem: admin-dashboard
tags: [admin, delete, customers, members, crud]
dependency_graph:
  requires: [260415-kwb]
  provides: [admin-customer-delete, admin-member-delete]
  affects: [lib/db.ts, app/api/admin/customers, app/api/admin/members, app/admin/customers, app/admin/members]
tech_stack:
  added: []
  patterns: [FK-safe-deletion, audit-logged-destructive-ops, confirmation-dialog-overlay]
key_files:
  created:
    - app/api/admin/members/[customerId]/route.ts
  modified:
    - lib/db.ts
    - app/api/admin/customers/[email]/route.ts
    - app/admin/customers/CustomersClient.tsx
    - app/admin/members/MembersClient.tsx
decisions:
  - "Block customer deletion when orders exist (FK constraint on club_orders.member_id) rather than nullifying or force-deleting"
  - "Membership deletion is local-only; does not touch Stripe -- admin must cancel subscription separately"
  - "Delete confirmation uses an absolute-positioned overlay inside the modal rather than a separate fixed modal"
metrics:
  duration: 8m 9s
  completed: "2026-04-16T02:15:42Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 4
---

# Quick Task 260415-uma: Admin Delete Customers and Members

Admin can delete customer (club_member) records and membership records from the dashboard, with FK-safe guards, confirmation dialogs, and full audit logging.

## Task Completion

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add DELETE API endpoints + DB helpers | 6d8482f | lib/db.ts, app/api/admin/customers/[email]/route.ts, app/api/admin/members/[customerId]/route.ts |
| 2 | Add delete UI to CustomersClient and MembersClient | ccf34e5 | app/admin/customers/CustomersClient.tsx, app/admin/members/MembersClient.tsx |

## What Was Built

### Backend (Task 1)

**lib/db.ts** -- Three new exported functions:
- `getClubMemberOrderCount(email)` -- Counts club_orders by member_email, returns `{ hasOrders, orderCount }`
- `deleteClubMemberByEmail(email)` -- Checks order count first; if orders exist returns `{ deleted: false, blockedByOrders: N }`; otherwise deletes and returns the deleted member ID
- `deleteMembershipByCustomerId(customerId)` -- Deletes from memberships table by stripe_customer_id, returns boolean

**app/api/admin/customers/[email]/route.ts** -- Added `DELETE` export:
- Reuses existing `requireAdmin()` helper (no auth duplication)
- Returns 409 Conflict with order count if customer has orders
- Returns 404 if customer not found
- Logs `delete_customer` to admin_actions on success

**app/api/admin/members/[customerId]/route.ts** -- New file with `DELETE` export:
- Admin auth pattern matching cancel/pause/upgrade routes
- Verifies membership exists via `getMemberDetails()` before deleting
- Logs `delete_membership` with plan tier and subscription status
- Does NOT touch Stripe -- local record removal only

### Frontend (Task 2)

**CustomersClient.tsx** -- Delete button + confirmation overlay in customer detail modal:
- Red "Delete" button in modal header, visible only when not in edit mode and detail is loaded
- Absolute-positioned overlay inside the modal for confirmation
- If customer has orders (totalOrders > 0): shows red warning box explaining deletion is blocked, with "Go Back" button only
- If customer has 0 orders: shows confirmation prompt with "Delete Customer" and "Go Back" buttons
- Error handling for 409 (server-side double-check) and network errors
- On success: closes modal, triggers list refresh via setPeriodDays

**MembersClient.tsx** -- Delete button on every member row + confirmation modal:
- Red "Delete" button appears on all rows (active, paused, cancelled, any status)
- Confirmation modal follows existing cancel modal pattern (fixed overlay with bg-black/50)
- Warning explains this is local-only and does not cancel Stripe
- Extra amber warning box for active/trialing subscriptions about data mismatch risk
- Success/error messages use existing memberActionSuccess/memberActionError system
- On success: refreshes table via fetchAnalytics()

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Block deletion vs force deletion for customers with orders**: The FK constraint (`club_orders.member_id NOT NULL REFERENCES club_members(id)`) prevents deletion. Rather than altering the schema or nullifying FKs at runtime, we check order count first and return a clear 409 error. This preserves data integrity and matches the CLAUDE.md principle of preserving records with historical references.

2. **Local-only membership deletion**: The DELETE endpoint only removes the `memberships` table row. It intentionally does NOT cancel Stripe subscriptions. The UI warns admins about this, and the existing Cancel action handles Stripe separately.

3. **Overlay vs separate modal for customer delete confirmation**: Used an absolute-positioned overlay inside the existing modal rather than a separate fixed modal. This keeps the UX contained within the customer detail context and avoids z-index stacking issues with nested fixed modals.

## Self-Check: PASSED

All files verified:
- lib/db.ts: contains getClubMemberOrderCount, deleteClubMemberByEmail, deleteMembershipByCustomerId
- app/api/admin/customers/[email]/route.ts: exports DELETE handler
- app/api/admin/members/[customerId]/route.ts: new file exists with DELETE handler
- app/admin/customers/CustomersClient.tsx: delete button + confirmation overlay present
- app/admin/members/MembersClient.tsx: delete button + delete modal present
- Commits 6d8482f and ccf34e5 verified in git log
