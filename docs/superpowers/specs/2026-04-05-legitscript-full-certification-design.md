# LegitScript Full Site Certification — Design Spec

**Date:** April 5, 2026
**Status:** Approved
**Scope:** Complete website compliance for LegitScript Healthcare Merchant Certification (Category C — Telemedicine)
**Prerequisite:** Plan A foundation (Apr 4, 2026) — compliance config, FDA badges, pharmacy info, testimonial disclaimers already deployed

---

## Context

CULTR Health needs LegitScript Healthcare Merchant Certification to:
- Process Visa/Mastercard card-not-present transactions (required by card networks)
- Advertise on Google, Meta, TikTok, LinkedIn (all require LegitScript certification)
- Avoid Visa Integrity Risk Program (VIRP) penalties

Plan A (Apr 4) built the compliance foundation: `lib/config/compliance.ts`, `FDAStatusBadge`, `DispensingPharmacyInfo`, `TestimonialDisclaimer`, pharmacy info in footer, FDA disclaimers on 11 therapies, legal page rewrites, provider credentials page.

This spec covers the remaining gaps identified in a full audit against LegitScript's 10 standards.

---

## LegitScript Standards Coverage

| Standard | Description | Status After Plan A | This Spec Closes |
|----------|-------------|--------------------|--------------------|
| 1 — Licensure | Provider/pharmacy licensure displayed | Partial — no NPI | Yes (NPI added) |
| 2 — Legal Compliance | FDA-compliant claims, valid prescribing | Partial | Yes (Rx disclaimers, consent) |
| 3 — Domain Registration | Accurate WHOIS | User action (not code) | N/A |
| 5 — Affiliates & Partners | Partner pharmacy disclosed | Done | N/A |
| 6 — Patient Services | State availability, contact info, pharmacy address | Partial — no state list | Yes (state availability) |
| 7 — Privacy | HIPAA-compliant privacy policy | Done | N/A |
| 8 — Validity of Prescription | Informed consent, valid Rx process | Missing consent | Yes (consent modal) |
| 9 — Transparency | No deceptive practices, full disclosure | Partial | Yes (ROSCA, Rx disclaimers) |
| 10 — Advertising | Transparent, compliant ads | Partial — blog has unqualified claims | Yes (blog removed) |

---

## Change 1: Compliance Config Updates

**File:** `lib/config/compliance.ts`

Add three new exports:

### SERVED_STATES
Array of 48 US state abbreviations where CULTR Health provides telehealth services. Two placeholder exclusions (user to confirm which states are excluded).

```typescript
export const EXCLUDED_STATES = ['NY', 'LA'] as const; // PLACEHOLDER — user to confirm

export const SERVED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'MD', 'MA', 'ME',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
  'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;
```

### PROVIDER_CREDENTIALS
Provider NPI numbers and license details. Placeholders for user to fill.

```typescript
export const PROVIDER_CREDENTIALS = {
  medical_director: {
    name: 'Dr. Ali Saberi, MD',
    npi: '', // PLACEHOLDER — user to provide
    specialty: 'Internal Medicine',
    states_licensed: [] as string[], // PLACEHOLDER — user to provide
  },
} as const;
```

### CONSENT_DOCUMENT
Structured content for the informed consent modal, organized by section.

---

## Change 2: PrescriptionDisclaimer Component

**New file:** `components/compliance/PrescriptionDisclaimer.tsx`

Small reusable block rendering:
> "All medications require a valid prescription from a licensed healthcare provider following a clinical evaluation. Not all patients will qualify for all treatments."

Props: `className` only. Consumes `DISCLAIMERS.prescriptionRequired` from compliance config.

Styled as `text-xs text-brand-primary/60` with a small pill/shield icon.

Used on: therapy page (below therapy grid), pricing page (below plan comparison).

---

## Change 3: Informed Consent Modal

**New file:** `components/compliance/ConsentModal.tsx`
**Test file:** `tests/components/ConsentModal.test.tsx`

### Behavior
- Triggered when user clicks any payment button on `/join/[tier]`
- Payment submission is blocked until:
  1. User scrolls to bottom of consent content (detected via `IntersectionObserver` on sentinel div)
  2. User checks "I have read and understand this informed consent document"
- "I Agree & Continue to Payment" button disabled + grayed until both conditions met
- Closing the modal returns to checkout with no state change
- On agree, calls `onConsent()` callback which proceeds with original payment action

### Content Sections (scroll order)
1. **Header:** "Informed Consent for Telehealth Services"
2. **Nature of Services:** CULTR Health is a telehealth platform; prescriptions require clinical evaluation by licensed provider
3. **Compounded Medications:** Prepared by St. Luke Compounding Pharmacy (FL PH 32747); compounded drugs are not FDA-approved
4. **FDA Status of Selected Therapies:** Dynamic — renders `FDAStatusBadge` with `showDisclaimer` for therapies in the user's selected tier (pulls from `PLANS` config to determine which therapies are available)
5. **Risks & Benefits:** General telehealth risks + medication side effects; benefits of convenience + provider access
6. **Prescription Requirements:** Not all patients qualify; provider may determine treatment is not clinically appropriate
7. **No Guarantee of Results:** Individual results vary; testimonials are not guaranteed outcomes
8. **Refund & Cancellation:** 2-month initial protocol; renews monthly; cancel anytime after initial period; no partial-month refunds
9. **Privacy:** PHI handled per HIPAA; link to `/legal/privacy`
10. **Emergency:** If medical emergency, call 911
11. **Checkbox + Button:** Checkbox label: "I have read and understand this informed consent document" → Button: "I Agree & Continue to Payment"

### Styling
- Full-screen overlay on mobile (`fixed inset-0`)
- Centered `max-w-2xl` modal on desktop with `max-h-[80vh]` scroll container
- `bg-brand-cream` background, `text-brand-primary` text
- Scroll shadow indicators at top/bottom edges when content overflows
- Section headings in `font-fraunces text-lg font-semibold`
- Body text in `font-body text-sm leading-relaxed`

### Props
```typescript
interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
  tierSlug: string; // to determine which therapies to show
}
```

### Integration with `/join/[tier]/page.tsx`
- Add state: `const [showConsent, setShowConsent] = useState(false)`
- Add state: `const [consentGiven, setConsentGiven] = useState(false)`
- When user clicks payment button: if `!consentGiven`, show modal instead of submitting
- On modal `onConsent`: set `consentGiven = true`, close modal, proceed with payment
- If consent already given in this session, don't re-show

---

## Change 4: Blog/Science Removal

### Files to delete (17)
- `app/science/page.tsx`
- `app/science/[slug]/page.tsx`
- `content/blog/biomarker-basics.md`
- `content/blog/fasting-metabolic-health.md`
- `content/blog/glp1-beyond-weight-loss.md`
- `content/blog/inflammation-markers.md`
- `content/blog/mitochondrial-health.md`
- `content/blog/nad-and-longevity.md`
- `content/blog/peptide-stacking.md`
- `content/blog/sleep-and-recovery.md`
- `content/blog/tb500-tissue-repair.md`
- `content/blog/testosterone-optimization.md`
- `content/blog/thyroid-deep-dive.md`
- `content/blog/understanding-bpc-157.md`
- `lib/blog-content.ts`
- `app/join/page.tsx`
- `app/join/JoinLandingClient.tsx`

### Files to modify
- `components/site/Header.tsx` — remove "Science" from nav links array
- `app/sitemap.ts` — remove science/blog URL generation
- `next.config.js` — add redirects (see Change 11)

### Preserve
- `content/library/` — member library content (separate system)
- `lib/library-content.ts` — library content loader (separate)
- `app/join/layout.tsx` — still wraps `/join/[tier]`
- `app/join/[tier]/page.tsx` — active checkout page

---

## Change 5: Header Nav Update

**File:** `components/site/Header.tsx`

Remove "Science" from the left nav links array. The link currently points to `/science`.

No other nav changes.

---

## Change 6: Therapy Page — FDA Badges + Citations + Rx Disclaimer

**File:** therapy page client component (in `app/therapies/`)

### FDA Status Badges
Wire `FDAStatusBadge` component onto each therapy card. The component already exists and works — it just needs to be imported and rendered on each card, passing the therapy's ID to look up its FDA status.

### Clinical Citations
For therapies that have entries in `CLINICAL_CITATIONS` (semaglutide, tirzepatide, removed-therapy, NAD+, GHK-Cu), render the citation text below the therapy description as a small linked reference. Format: superscript number → footnote at bottom of section.

### Prescription Disclaimer
Add `PrescriptionDisclaimer` component below the therapy grid, above the page's existing medical disclaimer.

---

## Change 7: Pricing Page — ROSCA Disclosure + Rx Disclaimer

**File:** `app/pricing/page.tsx`

### ROSCA Auto-Renewal Disclosure
Add an amber/warm disclosure box in the pricing FAQ area or below the plan comparison table:

> **Subscription & Renewal Terms**
> All memberships include an initial 2-month clinical protocol. After your initial period, your membership renews monthly at the listed price until you cancel. You may cancel anytime after your initial protocol by contacting support@cultrhealth.com or through your Stripe billing portal.

Styled as `bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900`.

### Prescription Disclaimer
Add `PrescriptionDisclaimer` component below the plan cards section.

---

## Change 8: Checkout — Consent Modal Integration

**File:** `app/join/[tier]/page.tsx`

Intercept payment button clicks. If consent not yet given in this session, show `ConsentModal` instead of proceeding to payment. After consent is given, proceed with the original payment action. Consent state is session-local (React state) — refreshing the page resets it.

See Change 3 for full integration details.

---

## Change 9: Footer Updates

**File:** `components/site/Footer.tsx`

### State Availability Note
Add a one-liner in the bottom section:
> "CULTR Health telehealth services are available in 48 states. [Restrictions apply](/legal/medical-disclaimer#availability)."

Styled as `text-xs text-white/40`.

### LegitScript Seal Placeholder
Add conditional render in the trust badges area:

```typescript
{process.env.NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID && (
  <div id="legitscript-seal">
    {/* LegitScript official embed renders here */}
  </div>
)}
```

Uses LegitScript's official verification seal script. Only renders when the env var is set (post-certification).

---

## Change 10: Medical Disclaimer — State Availability Section

**File:** `app/legal/medical-disclaimer/page.tsx`

Add a new "Service Availability" section with `id="availability"` (for footer anchor link):
- Heading: "Service Availability"
- Body: "CULTR Health telehealth services are currently available in the following states:" followed by a grid of state abbreviations/names
- Note excluded states: "We do not currently serve [excluded states]. Service availability may change as regulations evolve."
- Additional note: "Some states may have additional telemedicine requirements. Your provider will confirm service availability during your clinical evaluation."

---

## Change 11: Provider Credentials — NPI Numbers

**File:** `app/legal/provider-credentials/page.tsx`

Add NPI number display for each provider listed on the page. Format:
> **NPI:** 1234567890

Pulls from `PROVIDER_CREDENTIALS` in compliance config. Shows placeholder text if NPI is empty string (user needs to provide actual numbers).

---

## Change 12: Testimonial Disclaimer Visibility

**File:** `components/compliance/TestimonialDisclaimer.tsx`

Current styling: `text-[11px] leading-relaxed text-white/40 max-w-2xl mx-auto text-center italic`

Updated styling: `text-xs leading-relaxed text-white/50 bg-white/5 rounded-lg px-4 py-3 max-w-2xl mx-auto text-center not-italic`

Changes: larger text (11px → 12px), non-italic, subtle background, more padding. Still subdued but noticeably more readable.

---

## Change 13: Redirects

**File:** `next.config.js`

Add to existing redirects array:

```javascript
// /join bare → /pricing (join.cultrhealth.com is separate via middleware)
{ source: '/join', destination: '/pricing', permanent: true },

// Blog/science removed
{ source: '/science', destination: '/', permanent: true },
{ source: '/science/:slug', destination: '/', permanent: true },
```

Note: The `/join` redirect only affects `cultrhealth.com` — `join.cultrhealth.com` is handled by middleware rewriting to `/join-club`, so the `/join` redirect won't interfere.

---

## Dependency Order

```
Phase 1 (foundation — no deps):
  1. compliance.ts updates (SERVED_STATES, NPI, CONSENT_DOCUMENT)
  2. PrescriptionDisclaimer component
  3. ConsentModal component + test

Phase 2 (deletions — independent):
  4. Blog/science file deletion
  5. Header nav: remove Science link
  6. /join page deletion

Phase 3 (wiring — depends on Phase 1):
  7. Therapy page: FDA badges + citations + Rx disclaimer
  8. Pricing page: ROSCA disclosure + Rx disclaimer
  9. Checkout: consent modal integration
  10. Footer: state availability note + LegitScript seal
  11. Medical disclaimer: state availability section
  12. Provider credentials: NPI numbers
  13. Testimonial disclaimer visibility

Phase 4 (cleanup):
  14. Redirects in next.config.js
  15. Sitemap cleanup
```

---

## Out of Scope

- Database migrations (none needed)
- Healthie EMR changes
- Creator portal changes
- Admin panel changes
- `join.cultrhealth.com` / `app/join-club/` (separate subdomain)
- LegitScript application submission (user action)
- Business documentation preparation (jurisdiction spreadsheet, audit docs)
- Domain WHOIS privacy removal (user action)
- Cookie consent banner (optional, for future EU expansion)
- St. Luke pharmacy accreditation verification (user action)

---

## Placeholders Requiring User Input

| Item | Location | Current Value |
|------|----------|---------------|
| Excluded states | `EXCLUDED_STATES` in compliance.ts | `['NY', 'LA']` — placeholder |
| Dr. Ali Saberi NPI | `PROVIDER_CREDENTIALS` in compliance.ts | Empty string |
| Additional provider details | `PROVIDER_CREDENTIALS` in compliance.ts | Only 1 provider listed |
| States where providers are licensed | `PROVIDER_CREDENTIALS` in compliance.ts | Empty array |
