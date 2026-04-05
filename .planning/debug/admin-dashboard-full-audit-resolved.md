---
status: resolved
resolution: "Stale — 12 days old, dashboard has evolved significantly. Re-audit if needed."
trigger: "Comprehensive audit of the admin dashboard — verify all features, buttons, metrics, CRUD operations, and reporting capabilities."
created: 2026-03-23T00:00:00Z
updated: 2026-04-04T00:00:00Z
---

## Current Focus

hypothesis: Prior audit found multiple issues. Re-audit shows most critical bugs FIXED. One remaining SQL bug in getCreatorROI discount calculation. Remaining gaps are MISSING features (not broken ones).
test: Full code re-audit of AdminDashboardClient.tsx (1735 lines), analytics API, all admin API routes, and all DB functions.
expecting: Verified list of what is fixed vs what still needs work.
next_action: Fix getCreatorROI discount formula bug, then address top missing features.

## Symptoms

expected: The admin dashboard should provide full control over the platform — CRUD for members and creators, accurate real-time metrics, working action buttons, and high-level business reporting for founder decision-making.
actual: Multiple gaps found - see Evidence section for comprehensive audit.
errors: getSalesStats uses broken INTERVAL syntax with @vercel/postgres parameterized queries.
reproduction: Visit https://staging.cultrhealth.com/admin with admin credentials.
started: Dashboard has been built incrementally over several weeks. Latest additions were operational intelligence features deployed March 22.

## Eliminated

(none)

## Evidence

### RE-AUDIT (2026-03-23) — Comprehensive Code Review

---

### PREVIOUSLY BROKEN — NOW FIXED

1. **getSalesStats INTERVAL SQL bug** — FIXED. Lines 609, 617, 631 all now use `make_interval(days => ${days})`.
2. **Top Products based on 20 most recent** — FIXED. Now uses separate `periodOrdersResult` query (line 629) fetching ALL paid/fulfilled orders in period.
3. **Order fulfillment NO UI** — FIXED. AdminDashboardClient now has clickable order rows (line 1470), order detail modal (line 1538-1642) with items display, "Mark Shipped" form (carrier, tracking number, tracking URL), "Mark Fulfilled" button.
4. **Order fulfillment auth** — FIXED. Route now supports session-based auth (line 27) plus legacy x-admin-secret fallback.
5. **Creator commission rate editing** — FIXED. Edit button on each creator row (line 1034-1039), edit modal with commission_rate, override_rate, status fields (line 1644-1706), backed by PATCH /api/admin/creators/update (validates inputs, audit-logged).
6. **Coupon code CREATE** — FIXED. "+ Create Coupon" button (line 1111-1116), inline form with code, discount %, type (membership/product) (line 1128-1175), backed by POST /api/admin/creators/codes (supports company-owned codes with no creator_id).
7. **Coupon code DEACTIVATE** — FIXED. Active/Inactive toggle button on each coupon row (line 1217-1222), backed by PATCH /api/admin/creators/codes.
8. **CSV Export buttons** — FIXED. Export CSV links on: Customers, Creators, Orders, Coupons, Tracking Links tables. Client-side CSV generation with proper escaping.
9. **Search on tracking links** — FIXED. Search input filters by slug or creator name (line 1057-1062).
10. **Search on coupon codes** — FIXED. Search input filters by code or creator name (line 1117-1123).

### REMAINING BUG: getCreatorROI Discount Calculation

- file: lib/db.ts line 1023
- issue: `SUM(ac.total_revenue * ac.discount_value / 100)` computes discount incorrectly
- `affiliate_codes.total_revenue` stores post-discount revenue (verified: club/orders/route.ts line 156 passes `subtotal` which is the discounted amount)
- Correct formula: `total_revenue * discount_value / (100 - discount_value)` (same as getCouponStats line 715)
- Current formula understates discount by `discount_value%` (e.g. for 20% discount: shows $16 instead of $20 on an $80 order)
- Impact: Creator ROI table shows lower-than-actual discount amounts, making creator ROI appear more favorable than it actually is
- severity: MODERATE (data accuracy)

### WORKING Features (all verified)

**Main Dashboard (AdminDashboardClient.tsx — 1735 lines)**:
- [WORKING] Period selector (7/30/90/365 days) with Refresh button
- [WORKING] 7 MetricCards: Total Revenue, Active Members, Waitlist, Period, Total Customers, Pending Invoices, Active Creators
- [WORKING] Operational Health: Intake Completion %, Refund Rate %, Payment Methods breakdown (conditional)
- [WORKING] Invoice Aging table with color-coded days pending
- [WORKING] Quick Links (7 links): Intake Submissions, Club Orders, Protocol Builder, Asher Med, Stripe, GA, Search Console
- [WORKING] Orders by Status badges
- [WORKING] Top Products table (period-filtered, revenue-sorted)
- [WORKING] Members by Tier & Members by Status breakdowns
- [WORKING] Coupon Performance table (all metrics)
- [WORKING] Prelaunch Codes CRUD (create, deactivate, view redemptions) via PrelaunchCodesSection component
- [WORKING] Revenue by Tier cards
- [WORKING] Creator ROI table (discount given vs commission earned, net) — note: discount calculation has bug
- [WORKING] Creator Program summary (pending/approved/paid, status badges, "Manage Creators" link)
- [WORKING] Creator Network table with search + CSV export + Edit button per row
- [WORKING] Creator Edit modal (status, commission rate, override rate)
- [WORKING] All Tracking Links table with search + CSV export + summary badges
- [WORKING] All Coupon Codes table with search + CSV export + Create Coupon button + Active/Inactive toggle
- [WORKING] Customer Master List with search + CSV export
- [WORKING] Waitlist by Source badges
- [WORKING] QR Code Scan Analytics (full breakdown)
- [WORKING] Recent Orders table with clickable rows + Ship button + CSV export
- [WORKING] Order Detail modal with items, fulfillment actions (ship/fulfill), tracking info form
- [WORKING] Recent Waitlist Signups table

**Sub-Pages (all verified)**:
- [WORKING] /admin/creators — Hub with pending count, links to approvals & payouts
- [WORKING] /admin/creators/approvals — Approval queue with APPROVE (modal + notes) and REJECT buttons
- [WORKING] /admin/creators/payouts — Batch payout processing with results
- [WORKING] /admin/club-orders — Club orders with expand/collapse, approve + send invoice (QB)
- [WORKING] /admin/intakes — Intake submissions viewer (expand/collapse, full patient data)

**API Endpoints (19 endpoints, all verified)**:
- [WORKING] GET /api/admin/analytics (18 parallel queries, catch fallbacks)
- [WORKING] GET /api/admin/intakes
- [WORKING] GET /api/admin/club-orders
- [WORKING] POST /api/admin/club-orders/[orderId]/approve (QB invoice)
- [WORKING] POST /api/admin/creators/[id]/approve
- [WORKING] POST /api/admin/creators/[id]/reject
- [WORKING] GET /api/admin/creators/pending
- [WORKING] POST /api/admin/creators/payouts/batch
- [WORKING] GET/POST/PATCH/DELETE /api/admin/creators/codes (full CRUD)
- [WORKING] PATCH /api/admin/creators/update (commission, override, status)
- [WORKING] GET/POST /api/admin/prelaunch-codes (CRUD)
- [WORKING] GET /api/admin/prelaunch-codes/[codeId]/redemptions
- [WORKING] GET /api/admin/club-members/export (CSV, Bearer auth)
- [WORKING] GET/POST /api/admin/orders/[orderNumber]/fulfill (session + secret auth)

### REMAINING MISSING Features (CRUD Gap Analysis)

**Members/Users**:
- [MISSING] No member detail view (click customer to see orders, intake, subscription)
- [MISSING] No member CREATE (manual add)
- [MISSING] No member EDIT (tier, status, email changes)
- [MISSING] No member DEACTIVATE/CANCEL (pause/cancel membership)
- [MISSING] No Stripe subscription management from dashboard

**Creators**:
- [MISSING] No creator detail view from dashboard (full profile, all codes, commissions history)
- [MISSING] No manual creator creation (only via application flow)

**Orders**:
- [MISSING] No order search/filter (recent orders is just last 20, no date range, status filter, or text search)
- [MISSING] No order refund UI
- [MISSING] No order notes/annotations

**Products**:
- [MISSING] No product management (prices, stock, visibility)

### REMAINING Founder-Critical Gaps (Top 10 by Impact)

1. **Revenue time-series chart** — No graph of revenue over time. Dashboard only shows period totals. Key for seeing growth trajectory. All the data is there, just no visualization.

2. **Date range filtering on list tables** — Period selector affects metrics but NOT: Creator Network, All Tracking Links, All Coupon Codes, Customer Master List, Invoice Aging, Creator ROI. These always show ALL-TIME data.

3. **Member lifecycle management** — No way to pause, cancel, upgrade, or downgrade a membership from dashboard. No subscription management. No member notes.

4. **Click-to-detail on customers** — Customer Master List rows are not clickable. Can't click a customer to see their full order history, intake status, or subscription details.

5. **Order search and filtering** — Recent Orders only shows 20 most recent. No search by customer, order number, status, or date range. No pagination.

6. **Alerts/notifications** — No notification system for: new orders, new signups, failed payments, pending creator applications, orders aging > 7 days.

7. **Order refund workflow** — No UI to process refunds. Admin must use Stripe dashboard directly.

8. **Creator detail views** — Can edit commission/status, but can't see a creator's complete profile: all their codes, all orders attributed, commission history, payout history in one view.

9. **Manual member creation** — Can't add a member manually from dashboard (useful for comp accounts, VIPs).

10. **Product management** — No ability to manage product catalog (prices, stock, visibility) from the dashboard.

### Reporting Capabilities Assessment

**EXISTS (14 reports)**:
Revenue total, orders by status, top products, members by tier/status, coupon performance, creator commissions (pending/approved/paid), QR scan analytics, intake funnel completion rate, refund rate, revenue by tier, BNPL adoption, creator ROI, invoice aging, prelaunch code performance

**MISSING (10 reports)**:
- Revenue over time (daily/weekly/monthly chart)
- Customer acquisition cost
- Churn rate / retention metrics
- Average revenue per user (ARPU)
- Lifetime value (LTV) by tier
- Conversion funnel (visit > quiz > checkout > intake > order)
- Cohort analysis (monthly cohorts retention)
- Year-over-year comparisons
- Creator performance comparison (side-by-side)
- Product mix trends over time

## Resolution

root_cause: 1 remaining SQL bug in getCreatorROI discount formula (understates discount amounts). Prior critical bugs (getSalesStats INTERVAL, top products, fulfillment auth/UI, creator editing, coupon CRUD, CSV exports, search) all FIXED in prior sessions. Remaining gaps are MISSING features, not broken ones.
fix: Fixed getCreatorROI discount formula from `total_revenue * discount_value / 100` to `total_revenue * discount_value / (100.0 - discount_value)` with guard clause for edge cases. Matches the correct formula already used in getCouponStats and getPrelaunchStats.
verification: 608 tests pass (46 files). TypeScript type check clean. Formula is mathematically correct for back-calculating pre-discount amount from post-discount revenue.
files_changed: [lib/db.ts]
