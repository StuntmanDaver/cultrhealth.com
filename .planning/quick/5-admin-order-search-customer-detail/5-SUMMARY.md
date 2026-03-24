---
phase: quick
plan: 5
subsystem: admin-dashboard
tags: [admin, orders, customers, search, pagination, modal]
key-files:
  created:
    - app/api/admin/orders/route.ts
    - app/api/admin/customers/[email]/route.ts
  modified:
    - lib/db.ts
    - app/admin/AdminDashboardClient.tsx
decisions:
  - Used CTE with UNION ALL to search across both orders and club_orders tables in a single query
  - Added source badge (Club vs Product) to differentiate order origins in unified view
  - Customer profile modal uses three tabs (Overview/Orders/Activity) for organized data presentation
  - Debounce set to 300ms for search input to balance responsiveness and API load
metrics:
  duration: 6m 32s
  completed: 2026-03-24
  tasks: 2
  files-created: 2
  files-modified: 2
---

# Quick Plan 5: Admin Order Search & Customer Detail Summary

Order search with filtering/pagination across both order tables, plus click-to-detail customer profile modals with full history view.

## Feature 5: Order Search & Filtering with Pagination

### What was built

1. **`searchOrders()` DB function** (`lib/db.ts`): CTE-based query that UNIONs `orders` and `club_orders` tables. Supports ILIKE search across order_number and customer_email, status filtering, date range filtering, and OFFSET/LIMIT pagination with total count.

2. **`GET /api/admin/orders`** (`app/api/admin/orders/route.ts`): New dedicated endpoint with query params `q`, `status`, `page`, `limit`, `dateFrom`, `dateTo`. Admin auth check matches existing analytics route pattern. Limit capped at 100 per request.

3. **Enhanced Orders section** (`AdminDashboardClient.tsx`): Replaced the static "Recent Orders" table (last 20, no search) with a full search/filter/pagination UI:
   - Search input with 300ms debounce (setTimeout pattern)
   - Status dropdown with all possible statuses from both tables
   - Date range inputs (From/To)
   - Results summary: "X orders found, Page Y of Z"
   - Source badge per row: "Club" (purple) or "Product" (blue)
   - Pagination: Previous/Next buttons, "Showing X-Y of Z"
   - Rows still clickable to open existing order detail modal

### Commit
- `fe68071` — feat(admin): add order search with filtering and pagination

## Feature 4: Click-to-Detail Customer Views

### What was built

1. **`getCustomerFullProfile()` DB function** (`lib/db.ts`): Queries 5 tables in parallel via Promise.all:
   - `club_members` — signup info, address, signup_type, source
   - `club_orders` — all orders with items, status, amounts, coupon codes
   - `orders` — product orders with payment provider
   - `memberships` — subscription status via stripe_customer_id JOIN
   - `pending_intakes` — intake completion status
   - Returns structured profile with lifetimeValue and totalOrders computed

2. **`GET /api/admin/customers/[email]`** (`app/api/admin/customers/[email]/route.ts`): URL-decoded email param, admin auth check, returns full profile.

3. **Customer Master List rows now clickable**: Added `cursor-pointer hover:bg-brand-primary/5` — clicking a row opens the customer detail modal.

4. **Customer Detail Modal** (`AdminDashboardClient.tsx`): Full-width (max-w-2xl) modal with three tabs:
   - **Overview**: Lifetime value + total orders cards, member info (phone, address, signup type, source), membership status (plan tier, subscription status)
   - **Orders**: Separated lists of club orders and product orders with status badges, amounts, coupon codes, payment providers
   - **Activity**: Intake status with plan tier and dates, coupon usage history (deduplicated badges)

### Commit
- `d1e8359` — feat(admin): add click-to-detail customer profile modal

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

All 4 files verified on disk. Both commits (fe68071, d1e8359) verified in git log. 608 tests passing with zero regressions. TypeScript compilation clean.
