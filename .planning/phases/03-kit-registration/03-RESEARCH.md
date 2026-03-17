# Phase 3: Kit Registration - Research

**Researched:** 2026-03-16
**Domain:** Member portal UI (kit registration, status timeline, sidebar navigation)
**Confidence:** HIGH

## Summary

Phase 3 builds the member-facing kit registration experience within the existing portal at `/portal/labs`. This is a frontend-heavy phase with one SiPhox API integration point (kit validation + registration) and new portal sidebar navigation. All foundational infrastructure exists: SiPhox API client with `validateKit()`, database tables for kit orders and customer mapping, portal authentication via phone OTP JWT, and established server/client component patterns.

The core technical challenge is bridging the portal session (phone-based JWT) to SiPhox customer records (via `siphox_customers.phone_e164`), then querying kit orders for that customer to drive the 7-state timeline UI. A secondary challenge is adding sidebar navigation to the portal layout without breaking the existing dashboard, which currently renders as a single-column layout with no sidebar.

**Primary recommendation:** Build incrementally -- sidebar first (layout change affects all portal pages), then labs page with registration, then dashboard summary card. Reuse existing CreatorSidebar pattern exactly, adapted with forest/dark styling per user decision.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dedicated **/portal/labs** page for all lab-related content (registration, status tracking, future results)
- **Summary card on portal dashboard** showing current kit status with "View Labs" link
- **Forest/dark sidebar** -- forest background, white text, icon+label links -- consistent with existing CreatorSidebar design
- Portal sidebar items: Dashboard, Labs (and future pages as they're added)
- **Validate on submit** -- member types kit ID, clicks "Register Kit", sees success/error after SiPhox API call
- **Single text field with helper text** -- one input field, placeholder showing expected format, helper text below explaining where to find the kit ID on the physical box
- **Inline error messages below input** -- red text for validation failures
- **Inline success + timeline appears** -- on successful registration, input area transitions to success message, then status timeline renders
- **Horizontal stepper** on desktop -- connected circles/dots in a row with labels below each step
- **Collapse to vertical on mobile** -- horizontal stepper on md+ breakpoints, vertical timeline on mobile
- **Detail card below timeline** -- card showing current stage info, next steps, estimated timing, CTA
- **Include estimated timings** for all steps
- 7 states: No Kit -> Ordered -> Shipped -> Registered -> Sample Mailed -> Processing -> Results Ready
- **Club tier ($0/mo)**: Simple locked message with upgrade button linking to /pricing
- **Core tier without add-on**: Targeted add-on CTA -- "Add a blood test kit to your plan for $135"
- **Kit ordered, not yet received**: Timeline at "Ordered" step with detail card
- **Registration input visibility**: Only shown at "Shipped" status or later

### Claude's Discretion
- Exact sidebar nav items and icons (Dashboard icon, Labs icon, etc.)
- Kit ID input field width, spacing, button styling (follow existing Button component)
- Timeline stepper circle sizes, connecting line style, animation on state transitions
- Detail card content per lifecycle stage (what's happening, next steps, estimated timing text)
- How the dashboard summary card is styled and what info it shows
- Loading states and skeleton patterns during API calls
- Whether to show tracking number when kit status is "Shipped"

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KIT-01 | Kit registration page where member enters kit ID from physical kit | Portal labs page at `/portal/labs` with text input, Button component, SiPhox API route |
| KIT-02 | Kit ID validation via SiPhox API before registration with clear error messages | `validateKit(kitId)` in `lib/siphox/client.ts` already exists; `POST /kits/:kitID/register` endpoint documented in PROJECT.md; inline error pattern from CONTEXT.md |
| KIT-03 | Kit registration submission linking kit to member's SiPhox customer | New API route calling SiPhox `POST /kits/:kitID/register`, linked via `siphox_customers.phone_e164` -> portal session phone |
| KIT-04 | 7-state order/kit status timeline (No Kit -> Ordered -> Shipped -> Registered -> Sample Mailed -> Processing -> Results Ready) | Horizontal stepper desktop / vertical mobile; detail card with per-stage messaging; status derived from `siphox_kit_orders` table |
| KIT-05 | Smart empty states with distinct messaging and CTAs per status | Club tier: upgrade CTA; Core without add-on: add-on CTA; Ordered: "Kit on its way" timeline; Shipped: show registration input |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^14.2.0 | App Router, server/client components | Project framework |
| TypeScript | ^5.4.0 | Type safety | Project standard |
| Tailwind CSS | ^3.4.3 | Styling (utility-first) | Project standard |
| Zod | ^3.23.0 | API request/response validation | Already used for SiPhox schemas |
| Lucide React | ^0.563.0 | Icons for sidebar, timeline, states | Project icon library |
| @vercel/postgres | ^0.10.0 | Database queries | Project DB access pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | ^2.1.1 / ^3.4.0 | `cn()` utility for conditional classes | All component styling |
| jose | ^6.1.3 | JWT verification via portal-auth | API route authentication |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom stepper | react-step-progress-bar or similar | Adds dependency for simple UI -- custom stepper is ~50 lines with Tailwind, no library needed |
| shadcn/ui Stepper | Project does not use shadcn | Would introduce new pattern; existing Button/Input components are sufficient |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/portal/
  layout.tsx              # MODIFY: add sidebar + mobile drawer
  labs/
    page.tsx              # NEW: server component, metadata
    LabsClient.tsx        # NEW: client component, all interactive UI
  dashboard/
    DashboardClient.tsx   # MODIFY: add kit status summary card

app/api/portal/
  labs/
    route.ts              # NEW: GET kit status, POST register kit
    validate/
      route.ts            # NEW: POST validate kit ID

components/portal/
  PortalSidebar.tsx       # NEW: sidebar navigation (follows CreatorSidebar pattern)
  KitTimeline.tsx         # NEW: 7-state horizontal/vertical stepper
  KitDetailCard.tsx       # NEW: per-stage messaging card below timeline
  KitRegistrationForm.tsx # NEW: kit ID input + submit + inline error/success
  KitEmptyState.tsx       # NEW: tier-based empty states with CTAs
```

### Pattern 1: Portal Session to SiPhox Customer Linkage
**What:** The portal authenticates via phone (E.164 format). SiPhox customers are keyed by `phone_e164` in `siphox_customers` table. The link is: `portal session phone -> siphox_customers.phone_e164 -> siphox_customer_id -> siphox_kit_orders`.
**When to use:** Every labs page load and every API call from the labs page.
**Example:**
```typescript
// In API route: get the authenticated member's kit orders
const auth = await verifyPortalAuth(request)
if (!auth.authenticated || !auth.phone) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}

// Look up SiPhox customer by portal phone
const siphoxCustomer = await getSiphoxCustomerByPhone(auth.phone)
if (!siphoxCustomer) {
  // No SiPhox customer yet -- check if they have a subscription tier
  // to determine which empty state to show
  return NextResponse.json({ kitOrders: [], siphoxCustomerId: null })
}

// Get kit orders for this customer
const kitOrders = await getKitOrdersByCustomer(siphoxCustomer.siphox_customer_id)
```

### Pattern 2: Server Component + Client Component Split
**What:** Page-level server component handles metadata and exports. Client component handles all interactive state.
**When to use:** All portal pages follow this pattern.
**Example:**
```typescript
// app/portal/labs/page.tsx (server component)
import type { Metadata } from 'next'
import LabsClient from './LabsClient'

export const metadata: Metadata = {
  title: 'Labs | CULTR Health',
  description: 'Register your blood test kit and track results.',
}

export default function PortalLabsPage() {
  return <LabsClient />
}
```

### Pattern 3: Portal Sidebar (Adapting CreatorSidebar)
**What:** Forest-themed sidebar with icon+label links, mobile drawer with backdrop.
**When to use:** Portal layout (`app/portal/layout.tsx`).
**Key differences from CreatorSidebar:**
- Forest background (`bg-brand-primary`) with white text instead of white background
- Fewer nav items (Dashboard, Labs vs. 9 items in Creator portal)
- Same mobile drawer pattern (backdrop + slide-in)
- Same desktop fixed sidebar (md:w-60, md:fixed, md:inset-y-0)
- Content area offset: `md:pl-60`
```typescript
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Labs', href: '/portal/labs', icon: TestTube2 },  // or FlaskConical, Microscope
]
```

### Pattern 4: Kit Status Derivation
**What:** Map internal DB status + fulfillment_status to the 7 user-facing timeline states.
**When to use:** Labs page rendering and dashboard summary card.
**Mapping logic:**
```typescript
type KitLifecycleState =
  | 'no_kit'
  | 'ordered'
  | 'shipped'
  | 'registered'
  | 'sample_mailed'
  | 'processing'
  | 'results_ready'

// DB columns:
// - siphox_kit_orders.status: 'ordered' (default), can be updated
// - siphox_kit_orders.fulfillment_status: 'pending_intake' | 'pending_fulfillment' | 'processing' | 'fulfilled' | 'failed' | 'needs_credits'
// - siphox_kit_orders.tracking_number: present when shipped

function deriveKitLifecycleState(order: SiphoxKitOrderRow): KitLifecycleState {
  // Check if results exist (future Phase 4 -- for now, never true)
  // if (hasResults) return 'results_ready'

  // Check fulfillment status first
  if (['pending_intake', 'pending_fulfillment', 'needs_credits'].includes(order.fulfillment_status)) {
    return 'ordered'  // Still being processed internally
  }

  // Check kit-level status from DB
  if (order.status === 'results_ready') return 'results_ready'
  if (order.status === 'processing') return 'processing'
  if (order.status === 'sample_mailed') return 'sample_mailed'
  if (order.status === 'registered') return 'registered'

  // Fulfilled + has tracking = shipped
  if (order.fulfillment_status === 'fulfilled' && order.tracking_number) {
    return 'shipped'
  }

  // Fulfilled but no tracking yet
  if (order.fulfillment_status === 'fulfilled') {
    return 'ordered'  // SiPhox confirmed but hasn't shipped yet
  }

  return 'ordered'
}
```

### Anti-Patterns to Avoid
- **Calling SiPhox API on every page load:** DB is the source of truth for kit status. Only call SiPhox API for validation/registration actions. Status updates come from webhooks or cron (future).
- **Mixing server and client auth checks:** Portal auth is already handled by `layout.tsx` AuthGuard. Individual pages should NOT re-check auth -- they run inside the layout's auth wrapper. API routes DO need auth checks.
- **Hardcoding tier checks in components:** Pass tier info from API response, don't import plan configs client-side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar navigation | Custom nav from scratch | Adapt `CreatorSidebar.tsx` pattern | Mobile drawer, active state, responsive breakpoints already solved |
| Portal auth in API routes | Custom cookie parsing | `verifyPortalAuth(request)` | Handles JWT verification, token expiry, session extraction |
| Kit ID validation | Custom regex | SiPhox `GET /kits/:kitID/validate` API | SiPhox knows which IDs are valid, registered, expired |
| Class merging | String concatenation | `cn()` from `lib/utils.ts` | Handles Tailwind class conflicts correctly |
| Loading skeletons | Custom loading | `animate-pulse` with shaped divs | Established pattern in DashboardClient |

**Key insight:** Almost every pattern needed for Phase 3 already exists in the codebase. The CreatorSidebar is the sidebar template. The DashboardClient shows the fetch/loading/error/empty state pattern. The portal auth and SiPhox DB layers provide the data access. The primary new work is the timeline stepper component and the status derivation logic.

## Common Pitfalls

### Pitfall 1: Phone Format Mismatch Between Portal and SiPhox
**What goes wrong:** Portal stores phone as E.164 (`+13525551234`). SiPhox customer might be linked with a different format or the `external_id` might differ.
**Why it happens:** During fulfillment (Phase 2), the SiPhox customer is created with `external_id = phone || email`. The portal session has `phone` in E.164.
**How to avoid:** Always use `getSiphoxCustomerByPhone(auth.phone)` which queries by `phone_e164` column. This is the canonical link.
**Warning signs:** Member sees "No kit" despite having ordered one.

### Pitfall 2: Sidebar Breaking Existing Dashboard Layout
**What goes wrong:** Adding a sidebar to `portal/layout.tsx` adds left padding (`md:pl-60`) that shifts all existing portal pages.
**Why it happens:** DashboardClient uses `max-w-2xl mx-auto` which centers in available space -- adding sidebar offset changes the centering.
**How to avoid:** Test the dashboard visually after adding sidebar. The `md:pl-60` in layout + `max-w-2xl mx-auto` in content should still look fine since content auto-centers in remaining space.
**Warning signs:** Dashboard content pushed too far right on desktop.

### Pitfall 3: SiPhox Customer Not Yet Created
**What goes wrong:** Member registers kit before SiPhox fulfillment has completed (e.g., `fulfillment_status = 'pending_intake'`). No `siphox_customers` row exists yet.
**Why it happens:** Fulfillment is async -- happens via webhook + cron retry. Member might try to register before the system has created their SiPhox customer.
**How to avoid:** The labs page API should handle the case where `getSiphoxCustomerByPhone()` returns null. Distinguish between "no customer at all" (show tier-based empty state) and "customer exists but order still pending" (show ordered state).
**Warning signs:** Incorrect empty state shown to members who have a pending order.

### Pitfall 4: Kit Registration API Endpoint Not Yet in Client
**What goes wrong:** The SiPhox client has `validateKit()` but NOT a `registerKit()` function.
**Why it happens:** Phase 1 only built the validation endpoint. Registration (`POST /kits/:kitID/register`) was documented in PROJECT.md but not implemented.
**How to avoid:** Add `registerKit(kitId: string, customerId: string)` to `lib/siphox/client.ts` as part of this phase. Follow existing `siphoxRequest()` wrapper pattern.
**Warning signs:** Build error when trying to call nonexistent function.

### Pitfall 5: Race Condition on Kit Registration
**What goes wrong:** Member clicks "Register Kit" twice quickly, causing duplicate API calls.
**Why it happens:** No request deduplication or loading state on button.
**How to avoid:** Use `isLoading` state on Button component (already has built-in spinner). Disable form while request is in flight.
**Warning signs:** Double registration error from SiPhox API.

### Pitfall 6: Confusing Fulfillment Status with Kit Lifecycle State
**What goes wrong:** Mixing up internal `fulfillment_status` values with the 7 user-facing timeline states.
**Why it happens:** Two overlapping status systems: `fulfillment_status` (internal orchestration) and the user-facing timeline states.
**How to avoid:** Create a single `deriveKitLifecycleState()` function that maps from DB fields to the 7 user-facing states. All UI code references lifecycle state, never raw DB status.
**Warning signs:** Timeline showing "Processing" when kit hasn't been shipped yet.

## Code Examples

### SiPhox Kit Validation API Call (existing)
```typescript
// Source: lib/siphox/client.ts (line 190-192)
export async function validateKit(kitId: string): Promise<SiphoxKitValidation> {
  return siphoxRequest(`/kits/${kitId}/validate`, SiphoxKitValidationSchema)
}
// Returns: { valid: boolean, kitId?: string, status?: string }
```

### SiPhox Kit Registration API Call (needs to be added)
```typescript
// Source: PROJECT.md API endpoint table: POST /kits/:kitID/register
// Needs to be added to lib/siphox/client.ts
export async function registerKit(
  kitId: string,
  customerId: string
): Promise<SiphoxKitValidation> {
  return siphoxRequest(`/kits/${kitId}/register`, SiphoxKitValidationSchema, {
    method: 'POST',
    body: { customer_id: customerId },
  })
}
```

### Portal Auth in API Route (existing pattern)
```typescript
// Source: app/api/portal/profile/route.ts (lines 32-39)
const auth = await verifyPortalAuth(request)
if (!auth.authenticated) {
  return NextResponse.json(
    { success: false, error: 'Not authenticated' },
    { status: 401 }
  )
}
// auth.phone: string (E.164 format)
// auth.asherPatientId: number | null
```

### CreatorSidebar Desktop + Mobile Pattern (to adapt)
```typescript
// Source: components/creators/CreatorSidebar.tsx
// Desktop: hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0
// Mobile: fixed inset-y-0 left-0 w-72 z-50 shadow-xl (with backdrop)
// Active state: bg-cultr-forest text-white (for creator)
// For portal: bg-white/20 text-white (active on forest bg)
```

### Loading Skeleton Pattern (existing)
```typescript
// Source: app/portal/dashboard/DashboardClient.tsx (lines 198-214)
<div className="rounded-2xl border border-brand-primary/10 p-6 animate-pulse mb-4">
  <div className="h-6 bg-brand-primary/10 rounded w-1/2 mb-4" />
  <div className="h-4 bg-brand-primary/10 rounded w-1/3 mb-3" />
  <div className="h-4 bg-brand-primary/10 rounded w-2/3 mb-3" />
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No portal sidebar | CreatorSidebar pattern exists | Phase 3 (now) | Portal gains sidebar navigation for the first time |
| Asher Med orders only on dashboard | SiPhox kit status + Asher orders | Phase 3 (now) | Dashboard becomes multi-source |
| SiPhox client: validate only | SiPhox client: validate + register | Phase 3 (now) | New `registerKit()` function needed |

**Deprecated/outdated:**
- None applicable to this phase.

## Open Questions

1. **SiPhox `POST /kits/:kitID/register` Request Schema**
   - What we know: Endpoint is documented in PROJECT.md as `POST /kits/:kitID/register`. Response likely matches `SiphoxKitValidationSchema` pattern.
   - What's unclear: Exact request body fields. Likely needs `customer_id` to link kit to SiPhox customer. May accept additional fields.
   - Recommendation: Build with `{ customer_id: string }` body. The Zod schema uses `.passthrough()` so extra response fields won't cause errors. Test against sandbox.

2. **Kit Status Updates After Registration**
   - What we know: After member registers kit and mails sample, SiPhox processes it. Status changes from registered -> sample_mailed -> processing -> results_ready.
   - What's unclear: How CULTR learns about these transitions. SiPhox may support webhooks or may require polling. STATE.md notes this as a blocker: "Unknown if SiPhox supports report-completion webhooks."
   - Recommendation: For Phase 3, show statuses from what DB knows. Status updates can be added via a polling cron job or webhook handler in Phase 4. The timeline UI is agnostic to HOW status updates happen.

3. **Kit ID Format**
   - What we know: SiPhox kits come with a unique ID printed on the physical box. QR code also available.
   - What's unclear: Exact format (alphanumeric? length? prefix?). SiPhox support docs don't specify.
   - Recommendation: Do NOT client-side validate format -- let SiPhox API determine validity. Use permissive text input with trim. Placeholder text: "e.g., KIT-XXXXX" (generic). Helper text: "Find this on the label inside your test kit box."

4. **Member Tier Detection for Empty States**
   - What we know: Empty states differ by tier (Club vs. Core-without-addon vs. Core-with-addon+).
   - What's unclear: How to determine the member's current tier from the portal session. The portal JWT has `phone` and `asherPatientId`, not subscription tier.
   - Recommendation: Query `siphox_kit_orders` by customer. If any exist, member has a kit order. If none exist, check Stripe subscription via `stripe_subscription_id` in orders table, or add a new query to determine tier from subscription data. Simplest approach: the labs API returns `{ tier: 'club' | 'core' | 'catalyst' | 'concierge', hasKitOrder: boolean, kitOrders: [...] }` and the tier detection logic lives server-side.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KIT-01 | Labs page renders registration form when kit shipped | component | `npx vitest run tests/components/LabsClient.test.tsx -x` | Wave 0 |
| KIT-02 | Kit validation API calls SiPhox and returns errors | unit | `npx vitest run tests/api/portal-labs-validate.test.ts -x` | Wave 0 |
| KIT-03 | Kit registration links kit to SiPhox customer | unit | `npx vitest run tests/api/portal-labs-register.test.ts -x` | Wave 0 |
| KIT-04 | Timeline renders correct state for each lifecycle status | component | `npx vitest run tests/components/KitTimeline.test.tsx -x` | Wave 0 |
| KIT-05 | Empty states show correct tier messaging | component | `npx vitest run tests/components/KitEmptyState.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/components/LabsClient.test.tsx` -- covers KIT-01 (registration form rendering)
- [ ] `tests/api/portal-labs-validate.test.ts` -- covers KIT-02 (validation API)
- [ ] `tests/api/portal-labs-register.test.ts` -- covers KIT-03 (registration API)
- [ ] `tests/components/KitTimeline.test.tsx` -- covers KIT-04 (timeline states)
- [ ] `tests/components/KitEmptyState.test.tsx` -- covers KIT-05 (tier empty states)
- [ ] `tests/lib/kit-lifecycle.test.ts` -- covers status derivation logic (deriveKitLifecycleState)

## Sources

### Primary (HIGH confidence)
- `lib/siphox/client.ts` -- existing `validateKit()` function, `siphoxRequest` wrapper pattern
- `lib/siphox/db.ts` -- `getSiphoxCustomerByPhone()`, `getKitOrdersByCustomer()`, `updateKitOrderStatus()`, `SiphoxKitOrderRow` interface
- `lib/siphox/schemas.ts` -- `SiphoxKitValidationSchema` (validates kit API responses)
- `lib/siphox/fulfillment.ts` -- fulfillment orchestration, status values
- `lib/portal-auth.ts` -- `verifyPortalAuth()`, `PortalSession` (phone + asherPatientId)
- `lib/portal-db.ts` -- portal session DB operations
- `app/portal/layout.tsx` -- AuthGuard pattern, activity-based token refresh
- `app/portal/dashboard/DashboardClient.tsx` -- loading/error/empty state patterns
- `components/creators/CreatorSidebar.tsx` -- sidebar pattern (desktop fixed + mobile drawer)
- `app/creators/portal/layout.tsx` -- sidebar integration pattern (md:pl-60, mobile toggle)
- `migrations/020_siphox_tables.sql` -- siphox_customers, siphox_kit_orders, siphox_reports schema
- `migrations/021_siphox_fulfillment_columns.sql` -- fulfillment_status, retry_count, stripe fields

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md` -- SiPhox API endpoint table listing `POST /kits/:kitID/register`
- [SiPhox Help Center: How to register a kit](https://support.siphoxhealth.com/en/articles/10354227-how-to-register-a-kit) -- user-facing registration flow

### Tertiary (LOW confidence)
- `POST /kits/:kitID/register` request body shape -- inferred as `{ customer_id: string }` but not verified against real API. Needs sandbox testing.
- Kit ID format -- not documented; using permissive text input with no client-side format validation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used extensively in project
- Architecture: HIGH -- every pattern (sidebar, server/client split, portal auth, SiPhox DB) exists in codebase and has been verified by reading source
- Pitfalls: HIGH -- identified from direct code reading (phone linkage, missing registerKit, fulfillment_status mapping, layout shift)
- SiPhox register endpoint: LOW -- request body shape is inferred, needs sandbox validation

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no fast-moving dependencies)
