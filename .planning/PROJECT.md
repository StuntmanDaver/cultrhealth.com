# SiPhox Health Integration

## What This Is

Integration of SiPhox Health's at-home blood test kit platform into the CULTR Health Members area. Members receive blood test kits, register them in the portal, send samples back, and view comprehensive biomarker results in a dedicated labs dashboard section — powered by real data from SiPhox's API.

## Core Value

Members can see their real biomarker data — organized, visual, and actionable — directly in their CULTR Health dashboard, closing the loop between treatment protocols and measurable health outcomes.

## Requirements

### Validated

- ✓ Member authentication via portal OTP (phone-based JWT) — existing
- ✓ Member dashboard at `/dashboard` — existing
- ✓ BiologicalAgeCard and BiomarkerTrends components in `components/dashboard/` — existing (placeholder)
- ✓ Stripe subscription checkout with add-on support — existing
- ✓ Stripe webhook handler for subscription events — existing
- ✓ Membership tier configuration (Club, Core, Catalyst+, Concierge) — existing

### Active

- [ ] SiPhox API client library with all endpoint coverage
- [ ] Customer sync between CULTR members and SiPhox customers
- [ ] Auto-order kit on Catalyst+/Concierge subscription checkout
- [ ] $135 optional add-on for Core tier at checkout
- [ ] Kit registration UI in member portal
- [ ] Biomarker results fetching and caching from SiPhox reports
- [ ] Labs dashboard section with categorized biomarker display
- [ ] BiologicalAgeCard powered by real SiPhox data
- [ ] BiomarkerTrends powered by real SiPhox data
- [ ] N/A display for biomarkers with no data returned
- [ ] ~150+ biomarkers organized by category (Metabolic, Nutritional, Heart, Hormonal, Inflammation, Thyroid, plus extended panel)

### Out of Scope

- Recurring/subscription blood tests — one-time kit per checkout only
- Club tier access — blood testing not available for free tier
- In-app sample collection instructions — SiPhox handles this via their kit materials
- Direct payment to SiPhox — CULTR uses credits-based ordering via API
- Custom biomarker reference ranges — use SiPhox-provided ranges

## Context

**SiPhox Health API:** REST API at `connect.siphoxhealth.com/api/v1/` with Bearer token auth. Covers customers, orders, kits, reports, biomarkers, and credits.

**API Endpoints:**
| Group | Endpoints |
|---|---|
| Customers | `POST /customer`, `GET /customers`, `GET /customers/:id`, `POST /customer/add_data`, `GET /customer/add_data/jobs/:id` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id` |
| Kits | `GET /kits`, `GET /kits/:kitID/validate`, `POST /kits/:kitID/register` |
| Reports | `GET /customers/:id/reports/:reportID` |
| Biomarkers | `GET /biomarkers` |
| Credits | `GET /credits` |

**Key Schemas:**
- CreateOrderRequest: `recipient` (first_name*, last_name*, email*, phone, external_id, address*), `kit_types*` [{kitType, quantity}], `purchase_with_attached_payment` (bool), `is_notify_receiver` (bool), `is_test_order` (bool)
- Address: street1, street2, city, state, zip, country
- ProductOffering: id*, type (enum: "product"), name*, longDescription*, shortDescription, keywords, imageUrl, productUrl, biomarkers[]
- Suggestion: _id, text, link, category, settings [{biomarker, value}]

**Tier Integration:**
- Catalyst+ ($499/mo): Kit included in price (auto-order on checkout)
- Concierge ($1,099/mo): Kit included in price (auto-order on checkout)
- Core ($199/mo): Optional $135 add-on at checkout
- Club ($0/mo): Not eligible

**Biomarker Categories (Longevity Essentials Program):**
- Metabolic Health: A1C, Albumin, C-Peptide, eAG, Trig:HDL Ratio, Cortisol
- Nutritional: 25-(OH) Vitamin D, Ferritin
- Heart Health: ApoB:ApoA1 Ratio, ApoA1, ApoB, Total Cholesterol, HDL, LDL, LDL-C:ApoB Ratio, LDL-C:HDL-C Ratio, Total Chol:HDL Ratio, Triglycerides, VLDL, VLDL (Calc)
- Hormonal Health: Cortisol:DHEA-S Ratio, DHEA-S, Estradiol, FSH, LH:FSH Ratio, LH, SHBG, Free Testosterone, Total Testosterone, Testosterone:Cortisol Ratio
- Inflammation: hsCRP
- Thyroid Health: TSH

**Extended Panel:** ~150+ additional biomarkers across CBC, CMP, liver function, kidney function, urinalysis, heavy metals, and more. Full list provided by user.

**Existing Dashboard Components:**
- `components/dashboard/BiologicalAgeCard.tsx` — currently placeholder, will be powered by SiPhox
- `components/dashboard/BiomarkerTrends.tsx` — currently placeholder, will be powered by SiPhox

## Constraints

- **Auth:** SiPhox API uses Bearer token authentication — need `SIPHOX_API_KEY` env var
- **Credits:** Orders use SiPhox credit system — CULTR pre-purchases credits, API deducts on order
- **HIPAA:** Biomarker data is PHI — must follow existing HIPAA patterns (no logging, secure transport)
- **Existing stack:** Must use Next.js 14 App Router, TypeScript, Tailwind CSS, existing auth system
- **Brownfield:** Integration into existing codebase — follow established patterns (lib/ client, app/api/ routes, *Client.tsx components)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SiPhox customer sync via external_id | Map CULTR member ID to SiPhox customer for reliable lookup | — Pending |
| Credits-based ordering (not attached payment) | CULTR pre-buys credits, avoids per-order payment complexity | — Pending |
| One-time kit per checkout | Simpler MVP, recurring tests can be added later | — Pending |
| Categorized biomarker display | Longevity Essentials categories for clean organization, extended panel for comprehensive view | — Pending |
| N/A for missing biomarkers | Show all possible biomarkers with N/A when no data, so members know what's available | — Pending |

---
*Last updated: 2026-03-14 after initialization*
