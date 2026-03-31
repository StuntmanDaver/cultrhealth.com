---
phase: quick
plan: 260331-fpi
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/admin-utils.ts
  - lib/db.ts
  - app/admin/AdminDashboardClient.tsx
  - lib/admin-types.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Admin overview shows a fulfillment pipeline summary with correct counts per stage"
    - "Club Orders section in overview uses correct statuses matching the actual pipeline (pending_approval, approved, invoice_sent, paid, shipped, fulfilled)"
    - "Action buttons in overview Club Orders correctly advance orders through the real pipeline"
    - "Total Revenue metric on overview includes shipped and fulfilled club orders, not just invoice_sent and paid"
    - "Status badges across all admin views use consistent, correct labels"
  artifacts:
    - path: "lib/admin-utils.ts"
      provides: "Corrected ORDER_STATUS_STYLES and getStatusColor with all real pipeline statuses"
      contains: "shipped.*Shipped"
    - path: "lib/db.ts"
      provides: "Fixed getSalesStats including shipped/fulfilled revenue, corrected getInvoiceAging"
      contains: "shipped.*fulfilled"
    - path: "app/admin/AdminDashboardClient.tsx"
      provides: "Fulfillment pipeline summary on overview, corrected Club Orders actions"
      contains: "clubOrderFulfillment"
  key_links:
    - from: "app/admin/AdminDashboardClient.tsx"
      to: "lib/admin-utils.ts"
      via: "ORDER_STATUS_STYLES import"
      pattern: "ORDER_STATUS_STYLES"
    - from: "app/admin/AdminDashboardClient.tsx"
      to: "/api/admin/club-orders/[orderId]/status"
      via: "handleStatusUpdate fetch calls"
      pattern: "handleStatusUpdate"
---

<objective>
Fix the admin dashboard's fulfillment system, overview, and orders sections. The recently-built fulfillment pipeline (pending_approval -> approved -> invoice_sent -> paid -> shipped -> fulfilled) is not properly reflected in the admin overview or the shared utility code.

Purpose: The admin dashboard overview uses stale/wrong status names (needs_invoice, needs_shipment, shipped_complete) that don't match the actual database values, causing action buttons to not work, revenue to be undercounted, and the fulfillment pipeline to be invisible on the overview.

Output: Corrected admin dashboard where overview shows pipeline summary, correct status labels, working action buttons, and accurate revenue totals.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/admin-utils.ts
@lib/admin-types.ts
@lib/db.ts (lines 606-700: getSalesStats, lines 957-973: getInvoiceAging, lines 2550-2566: getClubOrderFulfillmentCounts)
@app/admin/AdminDashboardClient.tsx
@app/admin/orders/PendingApprovalTab.tsx (reference -- uses CORRECT statuses, do not modify)
@app/api/admin/club-orders/[orderId]/status/route.ts (reference -- the canonical ALLOWED_TRANSITIONS map)

<interfaces>
<!-- The canonical fulfillment pipeline from status/route.ts ALLOWED_TRANSITIONS: -->
pending_approval -> [cancelled]
approved         -> [invoice_sent, paid, cancelled]
invoice_sent     -> [paid, cancelled]
paid             -> [shipped, fulfilled, cancelled]
shipped          -> [fulfilled]
fulfilled        -> []  (terminal)

<!-- PendingApprovalTab.tsx STATUS_STYLES (the CORRECT reference): -->
pending_approval: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' }
approved:         { label: 'Approved', bg: 'bg-blue-100', text: 'text-blue-800' }
invoice_sent:     { label: 'Invoice Sent', bg: 'bg-indigo-100', text: 'text-indigo-800' }
paid:             { label: 'Paid', bg: 'bg-green-100', text: 'text-green-800' }
shipped:          { label: 'Shipped', bg: 'bg-blue-100', text: 'text-blue-800' }
fulfilled:        { label: 'Fulfilled', bg: 'bg-emerald-100', text: 'text-emerald-800' }
rejected:         { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' }
cancelled:        { label: 'Cancelled', bg: 'bg-brand-primary/10', text: 'text-brand-primary/60' }
dismissed:        { label: 'Dismissed', bg: 'bg-brand-primary/10', text: 'text-brand-primary/40' }

<!-- AnalyticsData type includes clubOrderFulfillment: Record<string, number> but AdminDashboardClient never renders it -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix shared status utilities and DB revenue query</name>
  <files>lib/admin-utils.ts, lib/db.ts</files>
  <action>
**Fix lib/admin-utils.ts:**

1. Replace `ORDER_STATUS_STYLES` to match the ACTUAL pipeline statuses. Remove the non-existent statuses `needs_invoice`, `needs_shipment`, `shipped_complete`. Use the correct statuses from PendingApprovalTab.tsx as reference:

```typescript
export const ORDER_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending_approval: { label: 'Pending Approval', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved:         { label: 'Approved',          bg: 'bg-blue-100',   text: 'text-blue-800' },
  invoice_sent:     { label: 'Invoice Sent',      bg: 'bg-indigo-100', text: 'text-indigo-800' },
  paid:             { label: 'Paid',              bg: 'bg-green-100',  text: 'text-green-800' },
  shipped:          { label: 'Shipped',           bg: 'bg-blue-100',   text: 'text-blue-800' },
  fulfilled:        { label: 'Fulfilled',         bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled:        { label: 'Cancelled',         bg: 'bg-gray-100',   text: 'text-gray-600' },
  rejected:         { label: 'Rejected',          bg: 'bg-red-100',    text: 'text-red-800' },
  dismissed:        { label: 'Dismissed',         bg: 'bg-gray-100',   text: 'text-gray-400' },
}
```

2. Update `getStatusColor()` to add missing fulfillment statuses:
- `pending_approval` -> `text-yellow-700 bg-yellow-100`
- `invoice_sent` -> `text-indigo-700 bg-indigo-100`
- `shipped` -> `text-blue-700 bg-blue-100`
- `fulfilled` -> `text-emerald-700 bg-emerald-100`
- `dismissed` -> `text-gray-500 bg-gray-100`

**Fix lib/db.ts:**

3. In `getSalesStats()` (around line 622-624), fix the club_orders revenue query to include shipped and fulfilled orders. Change:
```sql
AND status IN ('invoice_sent', 'paid')
```
to:
```sql
AND status IN ('invoice_sent', 'paid', 'shipped', 'fulfilled')
```
These are all revenue-confirmed statuses (invoice_sent means QB invoice was created, paid/shipped/fulfilled are obviously paid).

4. In `getInvoiceAging()` (around line 957-973), the query is fine (returns all non-dismissed orders). No change needed here.
  </action>
  <verify>
    <automated>cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>ORDER_STATUS_STYLES contains exactly the real pipeline statuses (pending_approval, approved, invoice_sent, paid, shipped, fulfilled, cancelled, rejected, dismissed) with no stale keys. getStatusColor handles all fulfillment statuses. getSalesStats counts shipped and fulfilled club orders in revenue totals.</done>
</task>

<task type="auto">
  <name>Task 2: Fix overview Club Orders section and add fulfillment pipeline summary</name>
  <files>app/admin/AdminDashboardClient.tsx</files>
  <action>
**Part A: Add Fulfillment Pipeline Summary to Overview**

After the "Creator Link Performance" section (around line 469) and before the "External Tools" section (around line 471), add a new section that renders `data.clubOrderFulfillment` as a pipeline visualization. This data is already fetched by the analytics API but never displayed.

The pipeline summary should show:
- A horizontal bar with the 6 pipeline stages: Pending -> Approved -> Invoiced -> Paid -> Shipped -> Fulfilled
- Each stage shows its count from `data.clubOrderFulfillment` (keyed by status string)
- Use the same visual style as PendingApprovalTab's pipeline bar (colored boxes with count badges)
- Link to `/admin/orders?tab=pending` for detailed view
- Only render if `Object.values(data.clubOrderFulfillment).some(c => c > 0)` (skip if no club orders)

Minimal implementation — 6 stage boxes in a flex row with arrows between them:
```
const OVERVIEW_PIPELINE = [
  { key: 'pending_approval', label: 'Pending', color: 'yellow' },
  { key: 'approved', label: 'Approved', color: 'blue' },
  { key: 'invoice_sent', label: 'Invoiced', color: 'indigo' },
  { key: 'paid', label: 'Paid', color: 'green' },
  { key: 'shipped', label: 'Shipped', color: 'blue' },
  { key: 'fulfilled', label: 'Fulfilled', color: 'emerald' },
]
```

Each box: colored background when count > 0, muted when 0. Show count prominently.

**Part B: Fix Club Orders section status actions (around lines 640-700)**

The current action buttons reference non-existent statuses. Fix the action button logic to match the actual ALLOWED_TRANSITIONS:

1. Status `pending_approval`:
   - "Approve & Send Invoice" button (calls handleApproveOrder) -- keep as-is
   - Remove the "Skip Approval" button that calls `handleStatusUpdate(inv.id, 'needs_invoice')` -- `needs_invoice` is not a real status

2. Status `approved` or `invoice_sent`:
   - "Mark Paid" button -> `handleStatusUpdate(inv.id, 'paid')` -- this is correct

3. Status `paid`:
   - Change from `handleStatusUpdate(inv.id, 'needs_shipment')` to `handleStatusUpdate(inv.id, 'shipped')` -- "Mark Shipped" button
   - Also add a "Mark Fulfilled" option -> `handleStatusUpdate(inv.id, 'fulfilled')` for orders that skip shipping

4. Status `shipped`:
   - "Mark Fulfilled" button -> `handleStatusUpdate(inv.id, 'fulfilled')`

5. Remove the `needs_shipment` and `shipped_complete` status checks entirely

6. Update the `isPaid` check (line 546) from:
   ```
   const isPaid = ['paid', 'needs_shipment', 'shipped_complete'].includes(inv.status)
   ```
   to:
   ```
   const isPaid = ['paid', 'shipped', 'fulfilled'].includes(inv.status)
   ```

7. Update the cancel button exclusion list (line 688) from:
   ```
   !['cancelled', 'shipped_complete', 'rejected', 'dismissed'].includes(inv.status)
   ```
   to:
   ```
   !['cancelled', 'fulfilled', 'rejected', 'dismissed'].includes(inv.status)
   ```

**Part C: Verify Cron Jobs section labels (lines 745-752)**

The `labelMap` in the cron section includes 'stale-orders' → 'Stale Order Alerts' to correctly label the stale orders cron. Check if it's present; if not, add it.
  </action>
  <verify>
    <automated>cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Overview page shows a fulfillment pipeline summary section with correct stage counts. Club Orders section action buttons use real statuses (shipped, fulfilled instead of needs_shipment, shipped_complete). No references to needs_invoice, needs_shipment, or shipped_complete remain in AdminDashboardClient.tsx. The stale-orders cron is labeled in the cron section.</done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `grep -rn "needs_shipment\|shipped_complete\|needs_invoice" app/admin/AdminDashboardClient.tsx lib/admin-utils.ts` should return NO results
2. `grep -n "clubOrderFulfillment" app/admin/AdminDashboardClient.tsx` should show at least one rendering usage (not just the type import)
3. `grep -n "shipped.*fulfilled" lib/db.ts | head -5` should show the updated getSalesStats query including shipped and fulfilled
4. TypeScript compiles: `npx tsc --noEmit` passes
5. Tests pass: `npx vitest run`
</verification>

<success_criteria>
- The overview fulfillment pipeline section renders club order counts per stage using data.clubOrderFulfillment
- All status references in the overview Club Orders section match the canonical pipeline: pending_approval -> approved -> invoice_sent -> paid -> shipped -> fulfilled
- No stale status names (needs_invoice, needs_shipment, shipped_complete) exist in admin-utils.ts or AdminDashboardClient.tsx
- Revenue totals include shipped and fulfilled club orders
- getStatusColor covers all pipeline statuses
- TypeScript compiles and tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260331-fpi-audit-admin-dashboard-fix-fulfillment-sy/260331-fpi-SUMMARY.md`
</output>
