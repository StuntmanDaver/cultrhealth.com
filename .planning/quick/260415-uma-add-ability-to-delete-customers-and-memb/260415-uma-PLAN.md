---
phase: quick
plan: 260415-uma
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/db.ts
  - app/api/admin/customers/[email]/route.ts
  - app/api/admin/members/[customerId]/route.ts
  - app/admin/customers/CustomersClient.tsx
  - app/admin/members/MembersClient.tsx
autonomous: true
requirements: [QUICK-delete-customers-members]
must_haves:
  truths:
    - "Admin can delete a customer (club_member) who has zero orders from the detail modal"
    - "Admin sees a warning with order count when attempting to delete a customer who has orders, and can choose to delete the member record only (nullifies FK on club_orders) or cancel"
    - "Admin can delete a membership record from the Members table"
    - "All deletions are logged in admin_actions via logAdminAction"
    - "A confirmation dialog appears before every delete action"
  artifacts:
    - path: "app/api/admin/customers/[email]/route.ts"
      provides: "DELETE endpoint for club_members with order-aware logic"
    - path: "app/api/admin/members/[customerId]/route.ts"
      provides: "DELETE endpoint for memberships"
    - path: "app/admin/customers/CustomersClient.tsx"
      provides: "Delete button in customer detail modal with confirmation dialog"
    - path: "app/admin/members/MembersClient.tsx"
      provides: "Delete button on member rows with confirmation dialog"
    - path: "lib/db.ts"
      provides: "deleteClubMemberByEmail and deleteMembershipByCustomerId helper functions"
  key_links:
    - from: "CustomersClient.tsx"
      to: "/api/admin/customers/[email]"
      via: "fetch DELETE"
    - from: "MembersClient.tsx"
      to: "/api/admin/members/[customerId]"
      via: "fetch DELETE"
---

<objective>
Add the ability to delete customers (club_members) and members (memberships) from the admin dashboard.

Purpose: Admins need to remove stale/test/duplicate records. Deletions must be safe (no orphaned order data) and audited.
Output: DELETE API endpoints + confirmation UI for both Customers and Members pages.
</objective>

<execution_context>
@.planning/quick/260415-uma-add-ability-to-delete-customers-and-memb/260415-uma-PLAN.md
</execution_context>

<context>
@CLAUDE.md
@lib/db.ts (getCustomerFullProfile, logAdminAction, getMemberDetails, updateClubMemberByEmail)
@lib/admin-types.ts (CustomerProfile, MembershipAdminRow, CustomerAdminRow)
@app/api/admin/customers/[email]/route.ts (existing GET + PATCH with requireAdmin helper)
@app/api/admin/members/[customerId]/cancel/route.ts (pattern for member API + auth)
@app/admin/customers/CustomersClient.tsx (customer detail modal with edit UI)
@app/admin/members/MembersClient.tsx (member table with pause/cancel/upgrade modals)

<interfaces>
From lib/db.ts:
```typescript
export async function getCustomerFullProfile(email: string): Promise<CustomerFullProfile>
export async function getMemberDetails(customerId: string): Promise<MemberDetailRow | null>
export async function logAdminAction(action: string, targetId: string, details: Record<string, unknown>, adminEmail: string): Promise<void>
```

From app/api/admin/customers/[email]/route.ts:
```typescript
// requireAdmin() is a local helper (not exported) — returns { ok: true, session } or { ok: false, response }
// Reuse the same pattern in the DELETE handler within this file.
```

Key DB schema facts:
- `club_orders.member_id UUID NOT NULL REFERENCES club_members(id)` -- FK constraint exists
- `club_orders.member_email TEXT NOT NULL` -- email is denormalized (survives member deletion)
- `memberships` table has no FK to club_members -- independent table keyed by stripe_customer_id
- `order_attributions` references order_id (TEXT) not member email -- not affected by member deletion
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add DELETE API endpoints + DB helpers</name>
  <files>lib/db.ts, app/api/admin/customers/[email]/route.ts, app/api/admin/members/[customerId]/route.ts</files>
  <action>
**1. lib/db.ts** -- Add two new exported functions after the existing `updateClubMemberByEmail`:

```typescript
/**
 * Check if a club member has orders before deletion.
 * Returns { hasOrders: boolean, orderCount: number }
 */
export async function getClubMemberOrderCount(email: string): Promise<{ hasOrders: boolean; orderCount: number }>
```
Implementation: `SELECT COUNT(*)::integer AS count FROM club_orders WHERE LOWER(member_email) = ${email.toLowerCase()}`. Return `{ hasOrders: count > 0, orderCount: count }`.

```typescript
/**
 * Delete a club_members row by email.
 * If forceWithOrders is true, nullify the member_id FK on club_orders first
 * (the member_email column is preserved so order records remain identifiable).
 * Returns the deleted member's id or null if not found.
 */
export async function deleteClubMemberByEmail(email: string, forceWithOrders: boolean): Promise<string | null>
```
Implementation:
- Normalize email to lowercase.
- If `forceWithOrders`, run `UPDATE club_orders SET member_id = NULL WHERE LOWER(member_email) = ${normalizedEmail}` FIRST. IMPORTANT: This requires the FK column to be nullable. The migration `010_club_orders.sql` has `member_id UUID NOT NULL` -- so instead of nullifying, use a different approach: simply drop the FK constraint check. Actually, the safer approach is to NOT delete the member when they have orders, unless forceWithOrders is set. When forceWithOrders is true, we need to handle the FK. Since we cannot ALTER TABLE in a helper function at runtime, the correct approach is:
  - Run: `UPDATE club_orders SET member_id = (SELECT id FROM club_members WHERE LOWER(email) = ${normalizedEmail} LIMIT 1) WHERE LOWER(member_email) = ${normalizedEmail}` -- this is a no-op but confirms the ID. Actually, the FK is NOT NULL, so we cannot null it out.
  - REVISED APPROACH: When the customer has orders, do NOT delete the `club_members` row. Instead, the API should return an error telling the admin this customer has N orders and cannot be deleted. The UI will show this message. This preserves FK integrity and follows the same principle as "Admin coupon removal" in CLAUDE.md -- preserve records that have historical references.
  - When the customer has ZERO orders, simply `DELETE FROM club_members WHERE LOWER(email) = ${normalizedEmail} RETURNING id`.

Simplify the function signature:
```typescript
export async function deleteClubMemberByEmail(email: string): Promise<{ deleted: boolean; id: string | null; blockedByOrders?: number }>
```
- Query order count first. If > 0, return `{ deleted: false, id: null, blockedByOrders: orderCount }`.
- If 0, delete and return `{ deleted: true, id: row.id }`.

```typescript
/**
 * Delete a memberships row by stripe_customer_id.
 * Does NOT cancel the Stripe subscription -- caller must handle Stripe first if needed.
 * Returns true if a row was deleted.
 */
export async function deleteMembershipByCustomerId(customerId: string): Promise<boolean>
```
Implementation: `DELETE FROM memberships WHERE stripe_customer_id = ${customerId} RETURNING id`. Return `result.rowCount > 0`.

**2. app/api/admin/customers/[email]/route.ts** -- Add a `DELETE` export to the existing file:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { email: string } }
)
```
- Call `requireAdmin()` (already defined locally in this file).
- Decode email from params.
- Call `deleteClubMemberByEmail(email)`.
- If `blockedByOrders` returned, return 409 Conflict with `{ error: 'Cannot delete customer with existing orders', orderCount: N }`.
- If deleted, call `logAdminAction('delete_customer', id, { email }, adminEmail)`.
- Return `{ success: true, deleted: true }`.

**3. app/api/admin/members/[customerId]/route.ts** -- Create NEW file:

This is a new route file at `app/api/admin/members/[customerId]/route.ts`. Note: the existing cancel/pause/upgrade routes are at `[customerId]/cancel/route.ts` etc. This new file handles DELETE directly on the `[customerId]` segment.

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
)
```
- Replicate the admin auth pattern from `cancel/route.ts` (getSession + admin email check + isProviderEmail).
- `const { customerId } = await params`
- Call `getMemberDetails(customerId)` to verify membership exists. If not found, 404.
- Call `deleteMembershipByCustomerId(customerId)`.
- Call `logAdminAction('delete_membership', customerId, { email: membership.email, plan_tier: membership.plan_tier, subscription_status: membership.subscription_status }, session.email)`.
- Return `{ success: true }`.

IMPORTANT: Do NOT cancel the Stripe subscription in this endpoint. The existing cancel endpoint handles that. This delete endpoint removes the LOCAL database record only. The confirmation dialog in the UI will warn the admin about this.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- DELETE /api/admin/customers/[email] returns 200 on success for customers with 0 orders, 409 for customers with orders
- DELETE /api/admin/members/[customerId] returns 200 on success, 404 if not found
- Both endpoints log to admin_actions
- lib/db.ts exports deleteClubMemberByEmail and deleteMembershipByCustomerId
  </done>
</task>

<task type="auto">
  <name>Task 2: Add delete UI to CustomersClient and MembersClient</name>
  <files>app/admin/customers/CustomersClient.tsx, app/admin/members/MembersClient.tsx</files>
  <action>
**1. CustomersClient.tsx** -- Add a Delete button and confirmation dialog to the customer detail modal:

Add state variables at the top of the component (near existing edit state):
```typescript
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [deleting, setDeleting] = useState(false)
const [deleteError, setDeleteError] = useState<string | null>(null)
```

Reset delete state in the existing `closeCustomerModal` callback and the `useEffect` that resets on `selectedCustomerEmail` change.

Add a "Delete Customer" button in the customer detail modal, positioned in the modal header area next to the close button. Style it as a small red ghost button: `px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 border border-red-200`. Only show it when NOT in edit mode and customer detail is loaded.

When clicked, set `deleteConfirmOpen = true`.

Add a confirmation dialog (rendered conditionally when `deleteConfirmOpen` is true). This is a nested overlay inside the modal OR can be a separate fixed overlay on top. Use the same pattern as the existing cancel modal in MembersClient: a fixed inset-0 overlay with bg-black/50.

The confirmation dialog should:
- Show the customer name and email
- If `customerDetail.totalOrders > 0`: Show a red warning box: "This customer has {N} order(s) on record. To preserve order history integrity, customers with existing orders cannot be deleted. Consider using the edit function to update their information instead." Show only a "Go Back" button.
- If `customerDetail.totalOrders === 0`: Show "Are you sure you want to permanently delete this customer record? This action cannot be undone." Show a red "Delete Customer" button + "Go Back" button.

On confirm (0 orders):
```typescript
setDeleting(true)
setDeleteError(null)
const res = await fetch(`/api/admin/customers/${encodeURIComponent(selectedCustomerEmail)}`, { method: 'DELETE' })
const json = await res.json().catch(() => ({}))
if (!res.ok) {
  // Handle 409 (orders exist -- server-side double check) or other errors
  setDeleteError(json?.error || 'Failed to delete customer')
  setDeleting(false)
  return
}
// Success: close modal, refresh list
setDeleteConfirmOpen(false)
closeCustomerModal()
// Force re-fetch by toggling periodDays
setPeriodDays(p => p)
```

**2. MembersClient.tsx** -- Add a Delete button to each member row and a confirmation modal:

Add state:
```typescript
const [deleteTarget, setDeleteTarget] = useState<{ customerId: string; email: string; planTier: string; status: string } | null>(null)
const [isDeleting, setIsDeleting] = useState(false)
```

In the member table row actions column (the `<td>` with Pause/Change/Cancel buttons), add a "Delete" button for ALL rows (active, paused, cancelled -- any status). Style: `px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50`. Show it as the last action button in the flex row.

On click: `setDeleteTarget({ customerId: m.stripe_customer_id, email: m.email, planTier: m.plan_tier, status: m.subscription_status })`.

Add a DELETE MEMBER MODAL (follow the exact pattern of the existing Cancel modal at lines 440-479 of the current file):
- Title: "Delete Membership Record" in red
- Warning box: "This will permanently delete the local membership record for {email} ({planTier} - {status}). This does NOT cancel any active Stripe subscription. If the subscription is still active in Stripe, use the Cancel action first."
- If status is 'active' or 'trialing': Add extra prominent warning: "WARNING: This member has an active subscription. Deleting the local record without cancelling in Stripe first will cause a data mismatch."
- "Confirm Delete" red button + "Go Back" text button.

On confirm:
```typescript
setIsDeleting(true)
clearMemberActionMessages()
const res = await fetch(`/api/admin/members/${deleteTarget.customerId}`, { method: 'DELETE' })
const result = await res.json()
if (!res.ok) {
  setMemberActionError(result.error || 'Failed to delete membership')
  setDeleteTarget(null)
  setIsDeleting(false)
  return
}
setMemberActionSuccess(`Membership record deleted for ${deleteTarget.email}.`)
setDeleteTarget(null)
setIsDeleting(false)
fetchAnalytics() // refresh table
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- Customer detail modal shows a Delete button (red, non-edit mode only)
- Clicking Delete on a customer with orders shows a blocking warning with no delete option
- Clicking Delete on a customer with 0 orders shows confirmation then deletes on confirm
- Member table rows show a Delete button
- Clicking Delete on a member shows confirmation dialog warning about Stripe
- Active/trialing members get extra warning about active subscription
- Successful deletes refresh the respective tables
- All delete operations show success/error feedback
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client -> Admin API | Admin role must be verified server-side before any destructive operation |
| Admin API -> Database | FK constraints prevent orphaning orders; server checks order count before delete |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Spoofing | DELETE endpoints | mitigate | requireAdmin() check on both endpoints -- same pattern as existing PATCH/POST |
| T-quick-02 | Tampering | club_orders FK | mitigate | Server-side order count check prevents deleting members with orders, preserving FK integrity |
| T-quick-03 | Repudiation | Delete actions | mitigate | logAdminAction audit trail for every successful delete |
| T-quick-04 | Information Disclosure | Error messages | accept | 409/404 responses reveal existence of records but admin is already authenticated with full access |
| T-quick-05 | Denial of Service | Bulk deletes | accept | No bulk delete endpoint; single-record only; admin auth required |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Open admin dashboard Customers page, click a customer with 0 orders, confirm delete works
3. Open admin dashboard Customers page, click a customer with orders, confirm delete is blocked with message
4. Open admin dashboard Members page, click Delete on a member row, confirm modal appears and delete works
5. Check admin_actions table contains audit rows for each delete
</verification>

<success_criteria>
- Customers with no orders can be permanently deleted from the admin customer detail modal
- Customers with orders see a clear message explaining deletion is blocked and why
- Membership records can be deleted from the admin members table with a confirmation warning
- Active subscription members get an extra warning about Stripe mismatch
- All delete actions are audit-logged in admin_actions
- No FK constraint violations, no orphaned order data
</success_criteria>

<output>
After completion, create `.planning/quick/260415-uma-add-ability-to-delete-customers-and-memb/260415-uma-SUMMARY.md`
</output>
