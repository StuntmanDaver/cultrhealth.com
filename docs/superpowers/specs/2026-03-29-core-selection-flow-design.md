# Core Selection Flow & Pricing Overhaul

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Pricing cards, checkout, plan config, copy/terminology

---

## Context

The current pricing page shows CULTR Core at a flat $199/month with no therapy selection. The top tier is still named "CULTR Curated" in code. The checkout page shows "due today" totals on plan cards and uses "clinical cycle" terminology. This update introduces:

- Variable Core pricing ($149-$239) based on selected therapy
- Expandable Core card with therapy selection on the pricing page
- Checkout redesigned around "initial 2-month clinical protocol" framing
- Full rename from "Curated" to "Concierge"
- Consent checkbox for 2-month commitment

---

## 1. Data Layer (`lib/config/plans.ts`)

### New: `CORE_THERAPIES` constant

```ts
export const CORE_THERAPIES = [
  { slug: 'semaglutide', name: 'Semaglutide', price: 149, image: '/images/therapies/semaglutide.png' },
  { slug: 'tirzepatide', name: 'Tirzepatide', price: 199, image: '/images/therapies/tirzepatide.png' },
  { slug: 'retatrutide', name: 'Retatrutide', price: 239, image: '/images/therapies/retatrutide.png' },
];
```

### Plan config changes

| Field | Current | New |
|---|---|---|
| Core `price` | `199` | `149` |
| Core `ctaLabel` | `"Join Core"` | `"Learn more"` |
| Core `tagline` | `"Foundation therapy"` | `"Foundational care for members getting started."` |
| Core `features` | blood test/doctor listed as add-on | `["1 Foundation Therapy", "Personalized protocol review", "Ongoing provider-guided care"]` |
| Concierge `name` | `"CULTR Curated"` | `"CULTR Concierge"` |
| Concierge `price` | `1099` | `1049` |
| Concierge `ctaLabel` | `"Join Curated"` | `"Join Concierge"` |
| Concierge `features` | blood test/doctor as add-on | `["2 Foundation Therapies", "Up to 4 Add-Ons", "At-home blood test kit included", "First doctor visit included", "Priority support"]` |
| Catalyst+ `features` | blood test/doctor as add-on | `["1 Foundation Therapy", "2 Add-Ons", "Personalized protocol review", "Ongoing provider-guided care"]` |
| Catalyst+ `tagline` | `"Multi-therapy optimization"` | `"Multi-therapy optimization for members who want more customization."` |

### New Plan type fields

- `priceLabel?: string` -- Core: `"$149*"`, Catalyst+: `"$499/month"`, Concierge: `"$1,049/month"`
- `disclaimer?: string` -- `"2 month commitment required"` on all paid plans
- `priceNote?: string` -- Core: `"*Starting price. Final monthly amount depends on selected therapy."`

### Updated constants

- `BLOOD_TEST_ADDON` and `DOCTOR_CONSULTATION_ADDON` prices unchanged ($135 and $75) -- used in checkout computation
- `MEMBERSHIP_DISCLAIMER` rewritten to "initial 2-month clinical protocol" language

---

## 2. PricingCard Expand-in-Place (`components/site/PricingCard.tsx`)

### Collapsed state (Core card)

- Title: "CULTR Core"
- Price: `$149*` (from `priceLabel`)
- Description: "Foundational care for members getting started."
- CTA: "Learn more" button -- toggles local `isExpanded` React state
- Disclaimer: small muted text "2 month commitment required"
- Microcopy: `*Starting price. Final monthly amount depends on selected therapy.`

### Expanded state (Core only)

- CSS transition: `max-h` + `opacity` + `overflow-hidden`, ~400ms ease-out
- Reveals 3 therapy option cards below features
- Each therapy card: horizontal row layout
  - Vial image (64x64 desktop, 48x48 mobile, `object-contain`)
  - Therapy name
  - `$X/month` price
  - "Select [Therapy] -->" button linking to `/join/core?therapy=[slug]`
- Collapse toggle: "Show less" link at bottom

### Catalyst+ and Concierge cards

- No expand behavior -- CTA goes directly to `/join/catalyst` or `/join/concierge`
- Both show "2 month commitment required" disclaimer
- No blood test / doctor visit amounts on cards

---

## 3. Checkout Page (`app/join/[tier]/page.tsx`)

### Core checkout

- Reads `searchParams.therapy` (e.g. `?therapy=semaglutide`)
- If Core and no therapy param --> redirect to `/pricing`
- Looks up therapy in `CORE_THERAPIES` for price

### Order summary block (replaces "First-Time Fees")

**Core (dynamic by therapy):**
```
Your initial 2-month clinical protocol
-----------------------------------------
CULTR Core with [Therapy] (2 months)    $[price x 2]
At-home blood test kit                  $135
First doctor visit                      $75
-----------------------------------------
Today's total                           $[computed]
```

Computed totals: Semaglutide $508, Tirzepatide $608, Retatrutide $688

**Catalyst+:**
```
CULTR Catalyst+ membership (2 months)   $998
At-home blood test kit                   $135
First doctor visit                       $75
-----------------------------------------
Today's total                          $1,208
```

**Concierge:**
```
CULTR Concierge membership (2 months)  $2,098
At-home blood test kit                 included
First doctor visit                     included
-----------------------------------------
Today's total                          $2,098
```

### Consent checkbox (required, unchecked, above payment button)

> I understand that I am enrolling in an initial 2-month membership protocol and will be charged the total shown at checkout. After my initial protocol, my membership will renew monthly at the rate shown unless I cancel before my next renewal date.

### Marketing checkbox (optional)

> I'd like to receive updates, offers, and educational content from CULTR Health.

### Submit button

Text: `Start my protocol -- $[total] today` (dynamic per plan/therapy)

### Renewal disclosure (below order summary)

> Renews at $[monthly]/month after your initial 2-month protocol unless canceled before your next renewal date.

---

## 4. Pricing Page Copy & Tables (`app/pricing/page.tsx`)

### Section copy

- **Headline:** "Transparent pricing built around an initial 2-month clinical protocol."
- **Subhead:** "Choose the membership that matches your goals. All paid plans begin with a 2-month starting protocol so your provider has enough time to evaluate your labs, personalize your protocol, and adjust care when appropriate."

### Global microcopy (new, below pricing cards)

> All paid memberships begin with an initial 2-month clinical protocol. After that, your membership renews month-to-month unless canceled before your next renewal date.

### Secondary microcopy (new)

> Medication, protocol eligibility, and refills are subject to clinical review and approval.

### Comparison table

- "Curated" --> "Concierge" in all headers
- Monthly Price row: `$149*` / `$499` / `$1,049`
- At Home Lab Test row: `$135` / `$135` / `Included`

### Therapy unlock matrix

- "Curated" --> "Concierge" in header

### FAQ (6 entries)

1. **Why do memberships start with a 2-month clinical protocol?** -- Our memberships begin with a 2-month starting protocol so your provider has enough time to review your intake, assess labs when needed, personalize your protocol, and evaluate your response before ongoing month-to-month care.
2. **Am I charged monthly or all at once?** -- We display pricing as a monthly rate for easy comparison. Your initial purchase covers your first 2-month clinical protocol. After that, your membership renews monthly at your plan rate unless canceled.
3. **Can I cancel anytime?** -- You can cancel future renewals anytime before your next renewal date. Your initial 2-month clinical protocol is the minimum starting term for paid memberships.
4. **Why is there an asterisk next to Core pricing?** -- CULTR Core starts at $149 per month, and the exact price depends on the selected therapy option.
5. **Are medications guaranteed?** -- No. Treatment recommendations, prescriptions, and refills are always subject to provider review, clinical appropriateness, and applicable pharmacy and state requirements.
6. **Can I use HSA/FSA funds?** -- Yes! CULTR memberships are HSA/FSA eligible. We provide all necessary documentation for reimbursement from your health savings account.

---

## 5. Images

3 vial images copied from `~/Downloads/` to `public/images/therapies/`:

- `semaglutide.png` (from `Semaglutide -- GLP1.png`)
- `tirzepatide.png` (from `Tirzepatide -- GLP1:GIP.png`)
- `retatrutide.png` (from `R3TA -- GLP1:GIP:GCG.png`)

---

## 6. Global Text Sweep

- All "CULTR Curated" --> "CULTR Concierge" across entire codebase
- All "clinical cycle" --> "clinical protocol" across entire codebase
- All "Join Curated" --> "Join Concierge"

---

## Files Modified

| File | Changes |
|---|---|
| `lib/config/plans.ts` | CORE_THERAPIES, plan prices/names/features, disclaimer, MEMBERSHIP_DISCLAIMER |
| `components/site/PricingCard.tsx` | Expand/collapse state, therapy cards, disclaimer, asterisk pricing |
| `app/join/[tier]/page.tsx` | Order summary redesign, consent checkbox, dynamic Core totals, therapy param |
| `app/pricing/page.tsx` | Section copy, comparison table, therapy matrix, FAQ, global microcopy |

## Files Added

| File | Description |
|---|---|
| `public/images/therapies/semaglutide.png` | Semaglutide vial photo |
| `public/images/therapies/tirzepatide.png` | Tirzepatide vial photo |
| `public/images/therapies/retatrutide.png` | Retatrutide vial photo |

**No new routes. No API changes. No DB migrations.**

---

## Verification

1. **Pricing page:** Core card shows $149*, expands to reveal 3 therapies with images/prices, collapses back cleanly
2. **Therapy selection:** Clicking "Select Semaglutide" routes to `/join/core?therapy=semaglutide`
3. **Core checkout:** Shows correct dynamic total ($508/$608/$688) based on therapy param
4. **Catalyst+ checkout:** Shows $1,208 total with blood test + doctor visit itemized
5. **Concierge checkout:** Shows $2,098 total with blood test + doctor visit as "included"
6. **Consent checkbox:** Required before payment submission, blocks form if unchecked
7. **Copy sweep:** No "Curated" or "clinical cycle" references remain
8. **Mobile:** Core expand/collapse and therapy cards render cleanly on mobile
9. **Comparison table:** Shows "Concierge" header, correct prices, "Included" for Concierge lab test
