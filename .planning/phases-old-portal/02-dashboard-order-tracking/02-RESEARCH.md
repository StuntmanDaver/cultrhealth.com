# Phase 2: Dashboard & Order Tracking - Research

**Researched:** 2026-03-11
**Domain:** Portal dashboard UI, Asher Med order API proxy, slide-over panel pattern, status presentation
**Confidence:** HIGH

## Summary

This phase replaces the placeholder dashboard at `app/portal/dashboard/page.tsx` with a status-first member dashboard showing live order data from the Asher Med API. The work is primarily frontend (client component with fetch calls) backed by two new thin API proxy routes (`/api/portal/orders` and `/api/portal/orders/[id]`) that verify portal authentication and forward requests to the existing `getOrders()` and `getOrderDetail()` functions in `lib/asher-med-api.ts`.

The existing codebase provides almost everything needed. The Asher Med API client (`lib/asher-med-api.ts`) already has `getOrders({ patientId })` returning paginated `AsherOrder[]` and `getOrderDetail(orderId)` returning a single `AsherOrder`. The portal auth system (`lib/portal-auth.ts`) provides `verifyPortalAuth(request)` which extracts `asherPatientId` from the JWT cookie. The portal layout (`app/portal/layout.tsx`) already handles auth guarding, activity-based token refresh, and the `bg-brand-cream` wrapper. No new npm packages are required.

The primary engineering work is: (1) two API proxy routes that authenticate via portal cookies and call Asher Med server-side, (2) a dashboard client component with hero card, order list, slide-over panel, and empty state, (3) status badge mapping with color-coded pills and plain-language labels as specified in CONTEXT.md, and (4) tests for the API routes and status mapping logic.

**Primary recommendation:** Build the two API proxy routes first (`/api/portal/orders` and `/api/portal/orders/[id]`), then the dashboard client component. Use no new libraries -- everything needed (fetch, Tailwind transitions, Lucide icons) is already in the project.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full summary hero card for the most recent active order: medication name, status badge with explanation, order date, last updated date, assigned doctor (if any)
- Below hero card: compact list rows for older/past orders (medication name, status badge, date -- tap to open detail)
- Quick links section (stacked, not sidebar) visible in all states including empty: Start Intake, Manage Subscription, Contact Support
- Single-column layout at all breakpoints -- always stacked, mobile-first. Quick links appear below order list
- Personalized dashboard (portal session provides `asherPatientId` for API calls)
- Color-coded badge pills with status-specific colors (amber=pending, green=approved, blue=completed, red=denied/cancelled)
- Each status has a medical-friendly plain-language label:
  - PENDING -> "Submitted"
  - APPROVED -> "Approved"
  - WaitingRoom -> "With Provider"
  - COMPLETED -> "Fulfilled"
  - DENIED -> "Not Approved"
  - CANCELLED -> "Cancelled"
- Short one-line explanation text accompanies each badge
- Slide-over panel from the right (Stripe-style), dashboard stays visible underneath
- Fresh data fetch via `getOrderDetail(id)` when panel opens (guarantees latest status, brief loading state)
- Fields shown in detail: medication name, status (badge + explanation), order date, last updated date, assigned doctor (if any), order ID/number, order type, partner notes
- Close button or click outside to dismiss
- Warm welcome message for new members: "Welcome to CULTR Health! Start your journey by completing your medical intake."
- Prominent "Start Intake" button (links to /intake)
- Simple icon or illustration at top of empty state
- Quick links section still visible in empty state (consistent layout)

### Claude's Discretion
- Exact animation/transition for the slide-over panel (duration, easing)
- Loading skeleton design for hero card and order list
- Exact spacing, typography scale, and color shades within the brand system
- Error state handling when Asher Med API is unreachable
- Whether to show a "Refresh" button on the order list
- Sort order of orders in the list (most recent first assumed)
- How to handle the doctor assignment display when doctorId exists but doctor name isn't in the API response

### Deferred Ideas (OUT OF SCOPE)
- Branded order timeline/progress bar (UX-01 in v2 requirements) -- keep status as badge + text for now
- Push notifications for status changes -- v2 feature
- Medication info cards linked to library content (UX-05) -- future phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORDR-01 | Member can view list of orders with live status from Asher Med | `/api/portal/orders` proxy route calls `getOrders({ patientId })` server-side; dashboard client fetches on mount |
| ORDR-02 | Dashboard shows status-first layout with prominent hero card for active order | Hero card component renders most recent non-terminal order prominently; single-column stacked layout |
| ORDR-03 | Member can view order details (medication, status, dates, doctor assignment) | Slide-over panel fetches `/api/portal/orders/[id]` which calls `getOrderDetail(orderId)`; displays all `AsherOrder` fields |
| ORDR-04 | Order statuses display plain-language explanations | Status mapping utility converts `AsherOrderStatus` to label + explanation + color; used in hero card, list rows, and detail panel |
| ORDR-05 | New members with no orders see empty state with CTA to start intake | Dashboard checks `orders.length === 0`; renders welcome message + Start Intake button + quick links |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | ^14.2.0 | App Router, API routes, server/client components | Framework already in use |
| `jose` | ^6.1.3 | Portal JWT verification in API routes via `verifyPortalAuth()` | Already installed, used by portal auth |
| `lucide-react` | ^0.563.0 | Icons for status badges, empty state, quick links | Already installed project-wide |
| `tailwindcss` | ^3.4.3 | All styling including status colors, slide-over transitions | Already installed, project standard |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.4.0 | `cn()` utility for conditional classes on status badges | Every component |
| `@vercel/postgres` | ^0.10.0 | Not directly needed -- Asher Med API is the data source | Only if local DB fallback needed |

### No New Dependencies Required

This phase requires zero new npm packages. The Asher Med API client, portal auth, UI components (Button, Spinner), and Tailwind animations are all in place.

## Architecture Patterns

### Recommended File Structure
```
app/
├── portal/
│   └── dashboard/
│       ├── page.tsx                    # Server component: metadata only
│       └── DashboardClient.tsx         # Client component: all dashboard UI
│
├── api/
│   └── portal/
│       ├── orders/
│       │   └── route.ts               # GET: list orders for authenticated patient
│       └── orders/
│           └── [id]/
│               └── route.ts           # GET: single order detail
│
lib/
└── portal-orders.ts                    # Status mapping utility (shared types + helpers)
│
tests/
├── api/
│   ├── portal-orders.test.ts           # API route tests for /api/portal/orders
│   └── portal-order-detail.test.ts     # API route tests for /api/portal/orders/[id]
└── lib/
    └── portal-orders.test.ts           # Status mapping unit tests
```

### Pattern 1: Portal API Proxy Route
**What:** Thin server-side route that verifies portal auth and forwards to Asher Med API.
**When to use:** Every portal data fetch (orders, profile, documents in future phases).
**Why:** Asher Med API key must never reach the client. Portal session verification happens server-side.

```typescript
// app/api/portal/orders/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getOrders } from '@/lib/asher-med-api'

export async function GET(request: NextRequest) {
  // 1. Verify portal session
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Fetch from Asher Med
  try {
    const response = await getOrders({ patientId: auth.asherPatientId })
    return NextResponse.json({ success: true, orders: response.data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to fetch orders' },
      { status: 502 }
    )
  }
}
```

### Pattern 2: Server/Client Split for Dashboard
**What:** `page.tsx` exports metadata, `DashboardClient.tsx` handles all interactive UI.
**When to use:** All portal pages (established pattern from Phase 1).

```typescript
// app/portal/dashboard/page.tsx
import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | CULTR Health',
  description: 'View your order status and manage your CULTR Health membership.',
}

export default function PortalDashboardPage() {
  return <DashboardClient />
}
```

### Pattern 3: Status Mapping Utility
**What:** Centralized function mapping `AsherOrderStatus` to display properties (label, explanation, color).
**When to use:** Hero card, list rows, detail panel -- all render status consistently.

```typescript
// lib/portal-orders.ts
import type { AsherOrderStatus } from '@/lib/asher-med-api'

export interface OrderStatusDisplay {
  label: string
  explanation: string
  color: 'amber' | 'green' | 'blue' | 'red' | 'gray'
  bgClass: string
  textClass: string
}

export function getStatusDisplay(status: AsherOrderStatus): OrderStatusDisplay {
  const map: Record<AsherOrderStatus, OrderStatusDisplay> = {
    PENDING: {
      label: 'Submitted',
      explanation: 'Your order has been received and is being processed.',
      color: 'amber',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-800',
    },
    APPROVED: {
      label: 'Approved',
      explanation: 'Your provider approved your treatment.',
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800',
    },
    WaitingRoom: {
      label: 'With Provider',
      explanation: 'A provider is reviewing your information.',
      color: 'amber',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
    },
    COMPLETED: {
      label: 'Fulfilled',
      explanation: 'Your order has been shipped.',
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
    },
    DENIED: {
      label: 'Not Approved',
      explanation: 'Your provider could not approve this order. Contact support.',
      color: 'red',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
    },
    CANCELLED: {
      label: 'Cancelled',
      explanation: 'This order was cancelled.',
      color: 'gray',
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-600',
    },
  }
  return map[status] || map.PENDING
}
```

### Pattern 4: Slide-Over Panel (CSS Transform)
**What:** Right-side panel that slides in/out using Tailwind `translate-x` transitions.
**When to use:** Order detail view, following Stripe dashboard pattern.
**Why:** No library needed; CSS transitions provide smooth animation with zero bundle cost.

```typescript
// Inside DashboardClient.tsx
// Panel wrapper with backdrop
<>
  {/* Backdrop */}
  {selectedOrderId && (
    <div
      className="fixed inset-0 bg-black/20 z-40 transition-opacity"
      onClick={() => setSelectedOrderId(null)}
    />
  )}

  {/* Slide-over panel */}
  <div className={cn(
    'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50',
    'transform transition-transform duration-300 ease-out',
    selectedOrderId ? 'translate-x-0' : 'translate-x-full'
  )}>
    {/* Panel content */}
  </div>
</>
```

### Pattern 5: Loading Skeletons (Tailwind Animate)
**What:** Pulse-animated placeholder rectangles while data loads.
**When to use:** Initial dashboard load and slide-over panel opening.

```typescript
function HeroCardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-primary/10 p-6 animate-pulse">
      <div className="h-5 bg-brand-primary/10 rounded w-1/3 mb-4" />
      <div className="h-8 bg-brand-primary/10 rounded w-2/3 mb-3" />
      <div className="h-4 bg-brand-primary/10 rounded w-1/2 mb-2" />
      <div className="h-4 bg-brand-primary/10 rounded w-1/4" />
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Calling Asher Med API from client-side:** API key would be exposed. Always proxy through `/api/portal/*` routes.
- **Caching orders aggressively:** Asher Med statuses change externally (provider actions). Fetch fresh on page load; brief staleness is acceptable.
- **Building a custom status badge component library:** Use Tailwind utility classes directly. A `getStatusDisplay()` function returning class strings is sufficient.
- **Using `useEffect` chains for data fetching:** Use a single `useEffect` on mount with proper cleanup and loading state.
- **Importing from `lib/asher-med-api.ts` in client components:** This file uses server-only env vars. Only import types from it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-over panel | Custom modal/dialog library | Tailwind `translate-x` + fixed positioning | Zero dependencies, 10 lines of CSS, matches Stripe pattern |
| Loading skeletons | Skeleton component library | Tailwind `animate-pulse` on div elements | Already works, project uses this pattern |
| Status color mapping | Inline conditionals per status | Centralized `getStatusDisplay()` utility | Single source of truth, testable, used in 3 places |
| Portal auth verification | Custom cookie parsing | `verifyPortalAuth(request)` from `lib/portal-auth.ts` | Already built in Phase 1, handles all edge cases |
| Date formatting | date-fns or moment | `Intl.DateTimeFormat` or simple `.toLocaleDateString()` | Native API, zero bundle cost |

**Key insight:** This phase is 90% UI assembly using existing building blocks. The Asher Med API client, portal auth, UI components, and Tailwind config are all in place. The risk is over-engineering what should be straightforward proxy routes and a single-page client component.

## Common Pitfalls

### Pitfall 1: Portal Session Without Patient ID
**What goes wrong:** User authenticated via OTP but `asherPatientId` is `null` (Case C from Phase 1 -- never-seen phone). Dashboard tries to fetch orders and crashes or shows error.
**Why it happens:** Portal login stores session even for unrecognized phones. The session has `phone` but no `asherPatientId`.
**How to avoid:** Check `asherPatientId` in the API route. If null, return empty orders array (not an error). Dashboard treats this same as "no orders" -- shows empty state with intake CTA.
**Warning signs:** 401 errors in console for newly registered users who haven't completed intake.

### Pitfall 2: Asher Med API Unavailability
**What goes wrong:** Asher Med API returns 500/503 or times out. Dashboard shows error instead of useful information.
**Why it happens:** External API dependency. Network issues, Asher Med maintenance, rate limits.
**How to avoid:** API proxy route catches errors and returns `{ success: false, error: 'Unable to fetch orders', orders: [] }`. Dashboard shows a gentle error banner ("Unable to load orders right now. Please try again.") with a retry button, not a broken page.
**Warning signs:** `AsherMedApiError` thrown but not caught.

### Pitfall 3: Stale Order List After Detail View
**What goes wrong:** User opens order detail (which fetches fresh data from Asher Med), sees updated status, closes panel, but list still shows old status.
**Why it happens:** Detail panel fetches fresh data independently but list was fetched on page load.
**How to avoid:** When detail panel closes, optionally update the specific order in the list state with the detail response data. Or simply re-fetch the list. Either approach works given the small data size.
**Warning signs:** User sees "Approved" in detail panel but "Submitted" in the list.

### Pitfall 4: Missing Medication Name in Asher Order
**What goes wrong:** `AsherOrder` type does not have a `medicationName` field directly. The medication info comes from `partnerNote` or the original `medication_packages` stored in the local `asher_orders` table.
**Why it happens:** The Asher Med API `getOrders()` returns orders with `id`, `patientId`, `doctorId`, `status`, `orderType`, `partnerNote`, `createdAt`, `updatedAt` -- but no explicit medication name field.
**How to avoid:** Two strategies: (1) Parse medication name from `partnerNote` if it contains it, or (2) fall back to `orderType` as a display string. The existing `/api/member/orders` route pulls `medication_packages` from the local `asher_orders` table. The portal orders route should merge Asher Med live data with local DB medication info.
**Warning signs:** Dashboard showing "Medication" or "Unknown" instead of actual drug name.

### Pitfall 5: Order Ownership Verification for Detail Route
**What goes wrong:** Authenticated user A fetches detail for user B's order via `/api/portal/orders/[id]`.
**Why it happens:** The Asher Med `getOrderDetail(orderId)` returns any order by ID if the partner API key is valid.
**How to avoid:** After fetching the order detail, verify that `order.patientId === auth.asherPatientId`. Return 403 if mismatch.
**Warning signs:** Security audit finding.

### Pitfall 6: Doctor ID Without Doctor Name
**What goes wrong:** `AsherOrder` has `doctorId` (number) but no doctor name. Dashboard shows "Doctor: 47" instead of a name.
**Why it happens:** Asher Med API returns only the doctor ID, not the doctor's name in the order response.
**How to avoid:** Display "Assigned Provider" when doctorId exists (confirming a provider is assigned), or omit the field entirely when null. Do not try to resolve doctor ID to a name -- there is no partner API endpoint for this. The information value is "a provider has been assigned" vs "no provider yet."
**Warning signs:** Numeric doctor ID displayed to end user.

## Code Examples

### API Route: List Orders with Local DB Medication Merge

```typescript
// app/api/portal/orders/route.ts
// Fetches live order status from Asher Med, merges medication names from local DB

export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated || !auth.asherPatientId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Fetch live orders from Asher Med
    const asherResponse = await getOrders({ patientId: auth.asherPatientId })

    // Fetch local medication info for enrichment
    let medicationMap: Record<number, string> = {}
    try {
      const { sql } = await import('@vercel/postgres')
      const localOrders = await sql`
        SELECT asher_order_id, medication_packages
        FROM asher_orders
        WHERE asher_patient_id = ${auth.asherPatientId}
      `
      localOrders.rows.forEach((row) => {
        const packages = row.medication_packages as Array<{ name: string }> | null
        if (row.asher_order_id && packages?.[0]?.name) {
          medicationMap[row.asher_order_id] = packages[0].name
        }
      })
    } catch {
      // Local DB enrichment is best-effort
    }

    // Merge and return
    const orders = (asherResponse.data || []).map((order) => ({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      doctorId: order.doctorId,
      partnerNote: order.partnerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      medicationName: medicationMap[order.id] || order.orderType || 'Medication',
    }))

    return NextResponse.json({
      success: true,
      orders: orders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unable to load orders', orders: [] },
      { status: 502 }
    )
  }
}
```

### Dashboard Client: Data Fetching with Error Handling

```typescript
// Inside DashboardClient.tsx
const [orders, setOrders] = useState<PortalOrder[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  let cancelled = false

  async function fetchOrders() {
    try {
      const res = await fetch('/api/portal/orders')
      if (!res.ok) {
        if (res.status === 401) {
          // Session expired -- layout auth guard will handle redirect
          return
        }
        throw new Error('Failed to fetch')
      }
      const data = await res.json()
      if (!cancelled) {
        setOrders(data.orders || [])
        setError(null)
      }
    } catch {
      if (!cancelled) {
        setError('Unable to load your orders right now.')
      }
    } finally {
      if (!cancelled) setIsLoading(false)
    }
  }

  fetchOrders()
  return () => { cancelled = true }
}, [])
```

### Quick Links (Consistent Across All States)

```typescript
// Quick links data
const QUICK_LINKS = [
  {
    label: 'Start Intake',
    href: '/intake',
    icon: FileText,
    description: 'Begin your medical intake form',
  },
  {
    label: 'Manage Subscription',
    href: LINKS.stripeCustomerPortal,
    icon: CreditCard,
    external: true,
    description: 'Update billing and subscription',
  },
  {
    label: 'Contact Support',
    href: `mailto:${LINKS.supportEmail}`,
    icon: HelpCircle,
    description: 'Get help from our team',
  },
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Magic link auth + email-based order lookup | Phone OTP + patient ID-based API calls | Phase 1 (Mar 2026) | Orders fetched by `asherPatientId` not email; more reliable |
| `/api/member/orders` (email-based, old auth) | `/api/portal/orders` (phone OTP auth, patient ID-based) | This phase | New route uses portal auth system; old route still exists for legacy members |
| Placeholder dashboard | Status-first hero card layout | This phase | First real data displayed in portal |

**Existing route note:** `/api/member/orders` (in `app/api/member/orders/route.ts`) uses the old magic link auth (`cultr_session` cookie) and email-based lookup. The new `/api/portal/orders` route uses portal auth (`cultr_portal_access` cookie) and patient ID-based lookup. Both can coexist.

## Open Questions

1. **Medication Name Availability from Asher Med API**
   - What we know: `AsherOrder` has `orderType` and `partnerNote` but no explicit `medicationName` field. Local `asher_orders` table has `medication_packages` JSONB.
   - What's unclear: Whether `orderType` reliably contains the medication name (e.g., "Tirzepatide" vs "GLP1" vs "new"). Whether `partnerNote` is used consistently.
   - Recommendation: Merge local DB `medication_packages[0].name` with Asher Med live data. Fall back to `orderType` if local data unavailable. Display "Medication" as last resort.

2. **Doctor Name Resolution**
   - What we know: `AsherOrder.doctorId` is a number. No partner API endpoint to resolve doctor ID to name.
   - What's unclear: Whether doctor names are available through any Asher Med API endpoint.
   - Recommendation: Show "Provider assigned" (boolean) rather than doctor name. This is more useful to the patient than an ID number.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + React Testing Library ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORDR-01 | Portal orders API returns order list from Asher Med | unit | `npx vitest run tests/api/portal-orders.test.ts -x` | Wave 0 |
| ORDR-02 | Hero card renders most recent active order prominently | unit | `npx vitest run tests/components/PortalDashboard.test.tsx -x` | Wave 0 |
| ORDR-03 | Order detail API returns full order and verifies ownership | unit | `npx vitest run tests/api/portal-order-detail.test.ts -x` | Wave 0 |
| ORDR-04 | Status mapping returns correct label, explanation, and color | unit | `npx vitest run tests/lib/portal-orders.test.ts -x` | Wave 0 |
| ORDR-05 | Empty state renders when no orders exist | unit | `npx vitest run tests/components/PortalDashboard.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/api/portal-orders.test.ts` -- covers ORDR-01 (API proxy route: auth check, order list, error handling)
- [ ] `tests/api/portal-order-detail.test.ts` -- covers ORDR-03 (detail fetch, ownership verification, 403 on mismatch)
- [ ] `tests/lib/portal-orders.test.ts` -- covers ORDR-04 (status mapping for all 6 AsherOrderStatus values)
- [ ] `tests/components/PortalDashboard.test.tsx` -- covers ORDR-02, ORDR-05 (hero card rendering, empty state, loading state)

## Sources

### Primary (HIGH confidence)
- `lib/asher-med-api.ts` -- Verified `getOrders()` signature, `getOrderDetail()` signature, `AsherOrder` type definition, `AsherOrderStatus` enum
- `lib/portal-auth.ts` -- Verified `verifyPortalAuth()` return type `{ authenticated, phone, asherPatientId }`, `getPortalSession()` for server components
- `app/portal/layout.tsx` -- Verified auth guard pattern, `bg-brand-cream` wrapper, activity refresh
- `app/portal/login/PortalLoginClient.tsx` -- Verified established UI patterns (dark theme for login, brand cream for portal interior)
- `app/api/member/orders/route.ts` -- Verified existing order fetch pattern with local DB + Asher Med merge
- `migrations/008_asher_med_tables.sql` -- Verified `asher_orders` schema: `asher_order_id`, `asher_patient_id`, `medication_packages` JSONB
- `lib/config/links.ts` -- Verified `stripeCustomerPortal` and `supportEmail` link constants
- `components/ui/Button.tsx` -- Verified variant props (`primary`, `secondary`, `ghost`), `isLoading` prop
- `tailwind.config.ts` -- Verified brand color tokens, animation keyframes, font families

### Secondary (MEDIUM confidence)
- `lib/resilience.ts` -- Contains `withRetry()` utility; could wrap Asher Med calls but adds complexity for a simple GET. Not recommended for initial implementation.

### Tertiary (LOW confidence)
- None. All findings verified against source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all code paths verified in existing source
- Architecture: HIGH -- follows established portal patterns from Phase 1 (server/client split, API proxy, portal auth)
- Pitfalls: HIGH -- identified from examining existing `/api/member/orders` implementation and `AsherOrder` type gaps
- Validation: HIGH -- test infrastructure verified working (253 tests passing), test patterns established in Phase 1

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no moving dependencies)
