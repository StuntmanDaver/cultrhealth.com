# Phase 4: Forms & Renewals - Research

**Researched:** 2026-03-14
**Domain:** Intake/renewal form pre-fill, dashboard integration, supply-based renewal prompts
**Confidence:** HIGH

## Summary

Phase 4 wires the existing intake and renewal forms into the portal dashboard so authenticated members can launch them inline and see fields pre-filled from their Asher Med patient data. The existing `/intake` and `/renewal` pages are standalone flows that require manual phone verification. Portal members already have verified identity and cached `asherPatientId`, so the portal can skip identity steps and pre-populate form fields from the profile API (`/api/portal/profile`), the orders API (`/api/portal/orders`), and the local `asher_orders` DB table.

The three work areas are: (1) a portal-aware pre-fill API that assembles patient + last-order data into the `SimpleFormData` shape the `IntakeFormProvider` context already accepts, (2) portal wrapper pages/components that embed the intake and renewal form clients with pre-filled initial state, and (3) a renewal prompt system that estimates medication supply remaining from the most recent COMPLETED order's `createdAt` + medication duration and surfaces a banner on the dashboard when supply is running low.

**Primary recommendation:** Build a single `/api/portal/prefill` route that returns patient profile + last order data in a shape both intake and renewal forms can consume, then create thin portal wrapper pages (`/portal/intake`, `/portal/renewal`) that fetch prefill data and pass it as initial state to the existing form components. Add a `getRenewalEligibility()` utility that computes days-until-resupply from order data for the dashboard prompt.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORM-01 | Intake form pre-fills from existing Asher Med patient data | Portal profile API already returns all patient fields; need mapping from `AsherPatient` shape to `SimpleFormData` shape |
| FORM-02 | Renewal form pre-fills from last order and patient data | Portal orders API returns orders with medication names; renewal check API already returns patient data; need to merge both into renewal form state |
| FORM-03 | Member can launch intake form inline from dashboard | Dashboard has "Start Intake" quick link pointing to `/intake`; needs portal-wrapped version at `/portal/intake` that passes pre-fill data |
| FORM-04 | Member can launch renewal form inline from dashboard | Dashboard has no renewal link yet; needs portal-wrapped version at `/portal/renewal` that skips phone verification step |
| FORM-05 | Dashboard shows proactive renewal prompt when medication supply is running low | Need supply estimation logic: COMPLETED order `createdAt` + medication duration from `asher_orders.medication_packages` JSON |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^14.2.0 | App Router pages for `/portal/intake` and `/portal/renewal` | Already in use |
| React Context | (built-in) | `IntakeFormProvider` accepts initial state via localStorage hydration | Existing pattern |
| @vercel/postgres | ^0.10.0 | Query `asher_orders` for medication packages and order dates | Existing DB access |
| jose | ^6.1.3 | `verifyPortalAuth()` for portal route protection | Existing auth |
| Zod | ^3.23.0 | Validate prefill API responses | Existing validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.563.0 | Icons for renewal prompt banner (AlertCircle, RefreshCw, Clock) | Dashboard UI |
| date-fns or native Date | N/A | Date arithmetic for supply estimation | Prefer native Date -- no new dependency needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Portal wrapper pages | URL params on existing `/intake?prefill=portal` | Wrapper pages are cleaner -- existing intake reads `session_id` and `plan` from URL params already; adding more params gets messy. Dedicated portal routes keep auth boundary explicit. |
| Single prefill API | Separate profile + orders fetch on client | Single API call is simpler, reduces waterfall, and keeps mapping logic server-side |

## Architecture Patterns

### Recommended Project Structure
```
app/portal/
  intake/
    page.tsx              # Server component (metadata)
    PortalIntakeClient.tsx # Fetches prefill, renders IntakeFormClient with initial data
  renewal/
    page.tsx              # Server component (metadata)
    PortalRenewalClient.tsx # Fetches prefill, renders renewal form with initial data

app/api/portal/
  prefill/
    route.ts              # GET -- returns patient profile + last order merged into prefill shape

lib/
  portal-prefill.ts       # mapPatientToIntakeData(), mapPatientToRenewalData(), estimateSupplyDays()
```

### Pattern 1: Pre-fill Data Flow
**What:** Portal auth -> fetch patient profile + orders from Asher Med -> map to form data shape -> pass as initial state to existing form context
**When to use:** Any form that needs patient data pre-populated
**Example:**
```typescript
// lib/portal-prefill.ts
import type { AsherPatient, AsherOrder } from '@/lib/asher-med-api'
import type { SimpleFormData } from '@/lib/contexts/intake-form-context'

export function mapPatientToIntakeData(patient: AsherPatient): Partial<SimpleFormData> {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender?.toLowerCase() as 'male' | 'female',
    shippingAddress: patient.address1 ? {
      address1: patient.address1,
      address2: patient.address2 || undefined,
      city: patient.city,
      state: patient.stateAbbreviation,
      zipCode: patient.zipcode,
    } : undefined,
    heightFeet: patient.height ? Math.floor(patient.height / 12) : undefined,
    heightInches: patient.height ? patient.height % 12 : undefined,
    weightLbs: patient.weight,
  }
}
```

### Pattern 2: Renewal Supply Estimation
**What:** Calculate days remaining from last COMPLETED order's creation date + medication duration
**When to use:** Dashboard renewal prompt (FORM-05)
**Example:**
```typescript
// lib/portal-prefill.ts
export function estimateSupplyDays(
  orderCreatedAt: string,
  durationDays: number
): { daysRemaining: number; isLow: boolean } {
  const orderDate = new Date(orderCreatedAt)
  const supplyEnd = new Date(orderDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
  const now = new Date()
  const daysRemaining = Math.ceil((supplyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return {
    daysRemaining: Math.max(0, daysRemaining),
    isLow: daysRemaining <= 7, // 1-week threshold
  }
}
```

### Pattern 3: Portal Form Wrapper
**What:** Thin client component that fetches prefill data, then renders the existing form component with initial state injected
**When to use:** `/portal/intake` and `/portal/renewal` pages
**Example:**
```typescript
// app/portal/intake/PortalIntakeClient.tsx
'use client'
import { useState, useEffect } from 'react'
import { IntakeFormProvider } from '@/lib/contexts/intake-form-context'
// Fetch /api/portal/prefill, then render IntakeFormContent with initialData
// The IntakeFormProvider needs a small enhancement: accept optional initialData prop
// that seeds formData state before localStorage hydration
```

### Anti-Patterns to Avoid
- **Duplicating form components:** Do NOT copy intake/renewal form components for the portal. Wrap and reuse. The existing 13 intake components and renewal form already work -- just feed them pre-filled data.
- **Client-side Asher Med calls:** Never call Asher Med API from the browser. Always proxy through portal API routes that verify auth.
- **Skipping auth on portal form routes:** Every `/api/portal/*` route MUST call `verifyPortalAuth()`. The prefill route returns PII.
- **Blocking form on prefill failure:** If prefill API fails, let the member fill out the form manually. Prefill is enhancement, not gate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | New form context for portal | Existing `IntakeFormProvider` with `initialData` prop | Already handles localStorage persistence, step tracking, validation |
| Patient data fetching | Inline fetch in each form component | Single `/api/portal/prefill` route | Consolidates auth + data assembly in one place |
| Supply calculation | Complex pharmacy-grade estimation | Simple `createdAt + duration` arithmetic | Asher Med has no dispensation/tracking date; order creation date + medication duration from `medication_packages` is the best available signal |
| Phone verification bypass | Custom flag system | Portal auth token already proves identity | Renewal form currently re-verifies by phone; portal members skip this since they already OTP-verified |

**Key insight:** The renewal form (`RenewalFormClient.tsx`) currently has its own phone verification step (step 0: "verify"). Portal members have already verified via phone OTP. The portal renewal wrapper should skip the verify step entirely and start at step 1 (medication), with patient data pre-loaded from the portal auth context.

## Common Pitfalls

### Pitfall 1: IntakeFormProvider localStorage Overwrite
**What goes wrong:** `IntakeFormProvider` loads from localStorage on mount. If a member has stale partial data in localStorage from a previous session, it overwrites the pre-filled data.
**Why it happens:** The context loads localStorage before the parent component can pass initial data.
**How to avoid:** Add an `initialData` prop to `IntakeFormProvider`. On mount: if `initialData` is provided AND localStorage is empty (or stale), use `initialData`. If localStorage has recent data, prefer it (user may be resuming). Add a `source` flag or timestamp to distinguish.
**Warning signs:** Pre-fill data not appearing despite API returning correct values.

### Pitfall 2: Asher Med Height Field Units
**What goes wrong:** `AsherPatient.height` is in total inches (e.g., 70 for 5'10"). The intake form uses `heightFeet` + `heightInches` as separate fields.
**Why it happens:** Unit mismatch between Asher Med API and form interface.
**How to avoid:** In `mapPatientToIntakeData()`, convert: `heightFeet = Math.floor(height / 12)`, `heightInches = height % 12`.
**Warning signs:** Height showing as "70 feet" or similar.

### Pitfall 3: Renewal Form Requires Fields Not in Portal Auth
**What goes wrong:** The renewal submit route (`/api/renewal/submit`) requires `firstName`, `lastName`, `email`, `phone`, `dateOfBirth`, `gender` -- all patient identity fields. The current renewal form gets these from the phone verification step.
**Why it happens:** Portal renewal skips the verify step, so these fields must come from prefill data instead.
**How to avoid:** The prefill API must return all patient identity fields. The portal renewal wrapper must inject them into the form state so they're present at submit time, even though the user never sees a "verify" step.
**Warning signs:** 400 errors on renewal submit with "Missing required fields" message.

### Pitfall 4: Supply Estimation Without Duration Data
**What goes wrong:** `medication_packages` in `asher_orders` may be null or malformed for some orders (especially older ones or manual entries).
**Why it happens:** Not all orders store medication duration consistently.
**How to avoid:** Default to 28 days (4 weeks -- the most common GLP-1 supply duration) when duration is unavailable. Only show "running low" prompt when we have reasonable confidence in the estimate.
**Warning signs:** Renewal prompt showing for brand-new orders, or never showing at all.

### Pitfall 5: Renewal Eligibility vs. Supply Check
**What goes wrong:** Confusing "eligible for renewal" (Asher Med patient status = ACTIVE) with "supply running low" (time-based estimate).
**Why it happens:** Two separate concepts that serve different purposes.
**How to avoid:** The renewal prompt (FORM-05) is about supply timing. The renewal form access (FORM-04) is about eligibility. Both are needed: only show the prompt if eligible AND supply is low.
**Warning signs:** Showing renewal prompt to ineligible patients, or blocking eligible patients from self-initiating renewal.

## Code Examples

### Prefill API Route
```typescript
// app/api/portal/prefill/route.ts
export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!auth.asherPatientId) return NextResponse.json({ success: true, prefill: null })

  const patient = await getPatientById(auth.asherPatientId)
  const ordersResult = await getOrders({ patientId: auth.asherPatientId })

  // Get last completed order for renewal data
  const completedOrders = ordersResult.data.filter(o => o.status === 'COMPLETED')
  const lastCompletedOrder = completedOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  // Best-effort medication info from local DB
  let lastMedication: string | null = null
  let lastDuration: number | null = null
  if (lastCompletedOrder) {
    // query asher_orders for medication_packages
  }

  return NextResponse.json({
    success: true,
    prefill: {
      intake: mapPatientToIntakeData(patient),
      renewal: mapPatientToRenewalData(patient, lastMedication),
      supply: lastCompletedOrder ? estimateSupplyDays(
        lastCompletedOrder.createdAt,
        lastDuration || 28
      ) : null,
      renewalEligible: patient.status === 'ACTIVE',
    }
  })
}
```

### Dashboard Renewal Prompt Component
```typescript
// Inline in DashboardClient.tsx or extracted component
function RenewalPrompt({ daysRemaining, medicationName }: {
  daysRemaining: number
  medicationName: string
}) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800">
            {daysRemaining <= 0
              ? `Your ${medicationName} supply may have run out`
              : `~${daysRemaining} days of ${medicationName} remaining`}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            Start your renewal now to avoid a gap in treatment.
          </p>
          <Link href="/portal/renewal">
            <Button variant="primary" size="sm" className="mt-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Renewal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Renewal requires phone re-verification | Portal auth proves identity; skip verify step | Phase 4 (new) | Faster renewal UX, fewer steps |
| Intake always starts empty | Pre-fill from existing patient record | Phase 4 (new) | Returning patients see their data populated |
| Manual renewal initiation only | Proactive supply-based prompt | Phase 4 (new) | Better medication adherence, less churn |

## Open Questions

1. **Asher Med medication duration field availability**
   - What we know: `asher_orders.medication_packages` is a JSONB column storing `[{name, duration, medicationType}]` from intake submission. The `duration` field is in days (28, 56, 84).
   - What's unclear: Do ALL orders have this field populated? Are there orders created outside CULTR (via Asher Med portal directly) that lack it?
   - Recommendation: Default to 28 days when missing. Log when duration is null so we can monitor data quality.

2. **IntakeFormProvider initial data injection**
   - What we know: Currently loads from `localStorage('cultr-intake-simple')` on mount. Has no prop for initial data.
   - What's unclear: Whether we should modify the provider to accept an `initialData` prop, or have the portal wrapper write to localStorage before the provider mounts.
   - Recommendation: Add `initialData` prop to `IntakeFormProvider`. If `initialData` provided and localStorage is empty, use initialData. Cleaner than a localStorage race condition.

3. **Renewal form step skipping**
   - What we know: `RenewalFormClient` has 5 steps (verify, medication, wellness, consent, review). Portal should skip step 0 (verify).
   - What's unclear: Whether to modify `RenewalFormClient` to accept a `skipVerify` prop, or build a separate `PortalRenewalClient` that reuses individual step components.
   - Recommendation: Add a `portalMode` prop to `RenewalFormClient` that starts at step 1 with patient pre-loaded. Simpler than extracting step sub-components. The verify step is already a clear boundary (it sets `patient` state + advances to step 1).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + React Testing Library ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | mapPatientToIntakeData maps Asher patient fields to SimpleFormData shape | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "intake" --reporter=verbose` | Wave 0 |
| FORM-02 | mapPatientToRenewalData maps patient + last order to renewal form state | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "renewal" --reporter=verbose` | Wave 0 |
| FORM-03 | GET /api/portal/prefill returns intake prefill data for authenticated member | unit | `npx vitest run tests/api/portal-prefill.test.ts --reporter=verbose` | Wave 0 |
| FORM-04 | RenewalFormClient in portalMode starts at medication step with patient pre-loaded | unit | `npx vitest run tests/components/portal-renewal.test.tsx --reporter=verbose` | Wave 0 |
| FORM-05 | estimateSupplyDays returns correct days remaining and isLow flag | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "supply" --reporter=verbose` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/portal-prefill.test.ts` -- covers FORM-01, FORM-02, FORM-05 (mapping + supply estimation)
- [ ] `tests/api/portal-prefill.test.ts` -- covers FORM-03 (prefill API route)
- [ ] `tests/components/portal-renewal.test.tsx` -- covers FORM-04 (portal mode rendering)

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct reading of: `lib/contexts/intake-form-context.tsx` (SimpleFormData interface, localStorage persistence), `app/renewal/RenewalFormClient.tsx` (5-step flow, phone verify step), `lib/asher-med-api.ts` (AsherPatient fields, getOrders/getPatientById), `app/api/portal/profile/route.ts` (existing patient data mapping), `app/api/portal/orders/route.ts` (order fetching + medication enrichment pattern), `app/portal/dashboard/DashboardClient.tsx` (current UI layout, quick links section)
- **Existing portal patterns** -- Phases 1-3 established: `verifyPortalAuth()` for route protection, `asherPatientId` from portal session, field name mapping (state vs stateAbbreviation, zipCode vs zipcode)

### Secondary (MEDIUM confidence)
- **Supply estimation approach** -- Based on `MEDICATION_OPTIONS` in `lib/config/asher-med.ts` showing duration values of 28/56/84 days, and `asher_orders.medication_packages` JSONB structure. Actual data completeness in production DB is unknown.

### Tertiary (LOW confidence)
- **Asher Med order lifecycle** -- Assumption that COMPLETED status means medication shipped and supply clock starts. If Asher Med uses COMPLETED for a different lifecycle event, supply estimation will be off.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Follows exact same patterns as Phases 1-3 (portal API route + client component + portal auth)
- Pitfalls: HIGH - Identified from direct code reading of form context, renewal flow, and Asher Med data shapes
- Supply estimation: MEDIUM - Logic is sound but depends on data completeness of medication_packages in production

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- no external library changes, all internal code)
