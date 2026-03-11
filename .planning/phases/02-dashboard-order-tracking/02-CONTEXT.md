# Phase 2: Dashboard & Order Tracking - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Members can see live order status from Asher Med the moment they log in, with the most important information front and center. Replaces the placeholder dashboard (`app/portal/dashboard/page.tsx`) with a status-first layout showing active order hero card, order history list, order detail slide-over panel, and quick links. New members with zero orders see a warm welcome with intake CTA.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Hero Card
- Full summary hero card for the most recent active order: medication name, status badge with explanation, order date, last updated date, assigned doctor (if any)
- Below hero card: compact list rows for older/past orders (medication name, status badge, date — tap to open detail)
- Quick links section (stacked, not sidebar) visible in all states including empty: Start Intake, Manage Subscription, Contact Support
- Single-column layout at all breakpoints — always stacked, mobile-first. Quick links appear below order list
- Personalized dashboard (portal session provides `asherPatientId` for API calls)

### Order Status Presentation
- Color-coded badge pills with status-specific colors (amber=pending, green=approved, blue=completed, red=denied/cancelled)
- Each status has a medical-friendly plain-language label:
  - PENDING → "Submitted"
  - APPROVED → "Approved"
  - WaitingRoom → "With Provider"
  - COMPLETED → "Fulfilled"
  - DENIED → "Not Approved"
  - CANCELLED → "Cancelled"
- Short one-line explanation text accompanies each badge:
  - Submitted: "Your order has been received and is being processed."
  - Approved: "Your provider approved your treatment."
  - With Provider: "A provider is reviewing your information."
  - Fulfilled: "Your order has been shipped."
  - Not Approved: "Your provider could not approve this order. Contact support."
  - Cancelled: "This order was cancelled."

### Order Detail View
- Slide-over panel from the right (Stripe-style), dashboard stays visible underneath
- Fresh data fetch via `getOrderDetail(id)` when panel opens (guarantees latest status, brief loading state)
- Fields shown: medication name, status (badge + explanation), order date, last updated date, assigned doctor (if any), order ID/number, order type, partner notes
- Close button or click outside to dismiss

### Empty State for New Members
- Warm welcome message: "Welcome to CULTR Health! Start your journey by completing your medical intake."
- Prominent "Start Intake" button (links to /intake)
- Simple icon or illustration at top
- Quick links section still visible in empty state (consistent layout)

### Claude's Discretion
- Exact animation/transition for the slide-over panel (duration, easing)
- Loading skeleton design for hero card and order list
- Exact spacing, typography scale, and color shades within the brand system
- Error state handling when Asher Med API is unreachable
- Whether to show a "Refresh" button on the order list
- Sort order of orders in the list (most recent first assumed)
- How to handle the doctor assignment display when doctorId exists but doctor name isn't in the API response

</decisions>

<specifics>
## Specific Ideas

- Slide-over panel should feel like Stripe's dashboard detail panels — fast, slides in from right, content loads fresh
- Hero card should be visually distinct from the compact list — bigger, more prominent, maybe a subtle gradient or border treatment
- Status badges should be immediately scannable — color is the primary differentiator, text is secondary
- "Full summary" hero card means member shouldn't need to tap to understand where their order stands
- Quick links: "Start Intake" → /intake, "Manage Subscription" → Stripe Customer Portal link, "Contact Support" → mailto:support@cultrhealth.com

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/asher-med-api.ts`: `getOrders({ patientId })` returns `AsherOrder[]` (id, status, createdAt, updatedAt, doctorId, orderType, partnerNote); `getOrderDetail(orderId)` returns full `AsherOrder`
- `lib/portal-auth.ts`: `getPortalSession()` returns `{ phone, asherPatientId }` — use `asherPatientId` to fetch orders
- `lib/portal-db.ts`: `getPortalSessionByPhone()` — has the cached patient ID
- `components/ui/Button.tsx`: Primary/secondary/ghost variants with isLoading state
- `components/ui/Spinner.tsx`: Loading spinner for async states
- `components/ui/ScrollReveal.tsx`: Entrance animations
- `lib/config/links.ts`: Has `portalLogin`, `portalDashboard` routes — add more portal routes here
- `app/portal/layout.tsx`: Auth guard + activity-based session refresh already in place
- `app/portal/dashboard/page.tsx`: Current placeholder — will be replaced

### Established Patterns
- Server/client split: `page.tsx` (metadata) + `*Client.tsx` (interactive) — follow for dashboard
- Portal uses `bg-brand-cream` wrapper, `font-display` headings, `text-brand-primary` colors
- API proxy routes: `/api/portal/*` pattern for server-side Asher Med calls (auth verified server-side)
- Asher Med API always called server-side (API key never exposed to client)

### Integration Points
- New API route needed: `/api/portal/orders` — proxy to Asher Med `getOrders({ patientId })`, verifies portal session server-side
- New API route needed: `/api/portal/orders/[id]` — proxy to Asher Med `getOrderDetail(id)`, verifies order belongs to patient
- `app/portal/dashboard/page.tsx` — replace placeholder with full dashboard
- `AsherOrderStatus` type already defined: `'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED' | 'WaitingRoom'`
- `AsherOrder` has: id, patientId, doctorId, status, orderType, partnerNote, createdAt, updatedAt

</code_context>

<deferred>
## Deferred Ideas

- Branded order timeline/progress bar (UX-01 in v2 requirements) — keep status as badge + text for now
- Push notifications for status changes — v2 feature
- Medication info cards linked to library content (UX-05) — future phase

</deferred>

---

*Phase: 02-dashboard-order-tracking*
*Context gathered: 2026-03-11*
