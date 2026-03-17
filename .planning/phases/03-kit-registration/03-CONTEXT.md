# Phase 3: Kit Registration - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Member-facing kit registration UI with status tracking through the lab lifecycle. Members can enter a kit ID from their physical test kit, see validation feedback, and track their kit through a 7-state lifecycle. Includes smart empty states with tier-appropriate CTAs. No biomarker results display — that's Phase 4. No kit ordering — that's Phase 2 (complete).

</domain>

<decisions>
## Implementation Decisions

### Portal Location & Navigation
- Dedicated **/portal/labs** page for all lab-related content (registration, status tracking, future results)
- **Summary card on portal dashboard** showing current kit status (e.g. "Kit Shipped — arriving soon") with "View Labs" link — drives discoverability
- **Sidebar navigation** added to the portal layout, following the creator portal pattern (CreatorSidebar)
- **Forest/dark sidebar** — forest background, white text, icon+label links — consistent with existing CreatorSidebar design
- Portal sidebar items: Dashboard, Labs (and future pages as they're added)

### Kit ID Input Experience
- **Validate on submit** — member types kit ID, clicks "Register Kit", sees success/error after SiPhox API call. Simple, fewer API calls.
- **Single text field with helper text** — one input field, placeholder showing expected format, helper text below explaining where to find the kit ID on the physical box
- **Inline error messages below input** — red text: "Kit not found", "Kit already registered", "Kit expired". Standard form error pattern.
- **Inline success + timeline appears** — on successful registration, input area transitions to success message, then the status timeline renders below showing "Registered" as the current step

### Status Timeline Design
- **Horizontal stepper** on desktop — connected circles/dots in a row with labels below each step. Active step highlighted (brand-primary), completed steps filled, future steps gray/outline.
- **Collapse to vertical on mobile** — horizontal stepper on md+ breakpoints, switches to vertical timeline layout on mobile for readability
- **Detail card below timeline** — card below the stepper showing: what's happening now, what to expect next, estimated timing, and a next-step CTA if applicable
- **Include estimated timings** for all steps — shipping (3-5 days), processing (5-7 business days), etc. Sets member expectations.
- 7 states: No Kit → Ordered → Shipped → Registered → Sample Mailed → Processing → Results Ready

### Empty States & Tier Messaging
- **Club tier ($0/mo)**: Simple locked message — "Blood testing is available on Core ($199/mo) and above" with upgrade button linking to /pricing. No preview or TierGate overlay.
- **Core tier without add-on**: Targeted add-on CTA — "Add a blood test kit to your plan for $135" with button linking to add-on purchase flow. Explains what they'd get.
- **Kit ordered, not yet received**: Timeline at "Ordered" step with detail card: "Your kit is on its way! Look for it in 3-5 business days." No registration input shown yet.
- **Registration input visibility**: Only shown at "Shipped" status or later — no point showing registration before the kit is in transit. Hidden for "Ordered" and earlier states.

### Claude's Discretion
- Exact sidebar nav items and icons (Dashboard icon, Labs icon, etc.)
- Kit ID input field width, spacing, button styling (follow existing Button component)
- Timeline stepper circle sizes, connecting line style, animation on state transitions
- Detail card content per lifecycle stage (what's happening, next steps, estimated timing text)
- How the dashboard summary card is styled and what info it shows
- Loading states and skeleton patterns during API calls
- Whether to show tracking number when kit status is "Shipped"

</decisions>

<specifics>
## Specific Ideas

- The portal sidebar should feel professional like the creator portal — not a minimal nav bar
- Kit registration should be simple and fast — one field, one button, clear feedback
- The timeline should feel like a shipment tracker — members understand that mental model
- Empty states should be encouraging, not blocking — always show a path forward (upgrade, add-on, or wait)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/siphox/client.ts`: `validateKit(kitId)` method ready — returns `SiphoxKitValidation` (valid, kitId, status)
- `lib/siphox/db.ts`: `getKitOrdersByCustomer()`, `updateKitOrderStatus()` — kit order read/write operations
- `lib/siphox/schemas.ts`: `SiphoxKitValidationSchema` — Zod validation for kit validation response
- `lib/portal-auth.ts`: `verifyPortalAuth()`, `getPortalSession()` — portal JWT authentication
- `components/library/TierGate.tsx`: Tier-based access control (available but user chose simple message instead)
- `components/ui/Button.tsx`: Primary/secondary/ghost variants with isLoading state
- `components/site/CreatorSidebar.tsx`: Sidebar navigation pattern to follow for portal sidebar

### Established Patterns
- Portal pages: server component (`page.tsx`) for auth check + client component (`*Client.tsx`) for interactive UI
- Portal API routes: `verifyPortalAuth(request)` for authentication in all `/api/portal/*` endpoints
- Portal layout: `app/portal/layout.tsx` with AuthGuard wrapper and activity-based token refresh
- Kit orders linked to SiPhox customers via `siphox_customers` table (phone E.164 as external_id)
- Brand styling: forest primary, cream backgrounds, rounded-full buttons, Inter body text, Fraunces display

### Integration Points
- `app/portal/layout.tsx` — needs sidebar navigation added
- `app/portal/dashboard/DashboardClient.tsx` — needs summary card for kit status
- `lib/siphox/db.ts` — may need new query functions for portal-specific kit lookups
- `app/api/portal/` — new kit validation and registration API routes needed
- `lib/siphox/fulfillment.ts` — existing fulfillment status types inform the timeline states

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-kit-registration*
*Context gathered: 2026-03-16*
