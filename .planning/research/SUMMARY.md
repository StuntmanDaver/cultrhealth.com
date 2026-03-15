# Project Research Summary

**Project:** SiPhox Health Blood Test Kit Integration
**Domain:** At-home lab testing integration — kit ordering, registration, and biomarker results for a telehealth platform
**Researched:** 2026-03-14
**Confidence:** HIGH (stack verified against existing codebase; architecture patterns match established integrations; pitfalls confirmed against live code)

## Executive Summary

This integration adds SiPhox Health blood testing to the CULTR platform: Catalyst+ and Concierge members receive a kit automatically at checkout, Core members can add one for $135, and all eligible members view their biomarker results in a new Labs dashboard tab. The full cycle spans four steps — member-to-SiPhox customer sync, automated kit ordering via Stripe webhook, member-initiated kit registration, and biomarker results display. Crucially, the codebase already contains two fully-built but unwired dashboard components (`BiologicalAgeCard.tsx`, `BiomarkerTrends.tsx`) and an existing scoring engine (`lib/resilience.ts`), which means roughly half the Phase 2 deliverables are UI work that reduces to prop-wiring rather than net-new builds.

The recommended approach is zero new dependencies: native `fetch` for the SiPhox API client (matching the Asher Med pattern exactly), existing Zod for response validation, existing Recharts for trend charts, and Neon PostgreSQL for three new tables (customer mapping, order tracking, report cache). The SiPhox client is architecturally identical to `lib/asher-med-api.ts` — a typed request wrapper, a custom error class, and grouped functions per endpoint. The critical data flow difference from Asher Med is that CULTR pushes data to SiPhox (kit orders, customer creation) and polls SiPhox for completion status (report ready), whereas Asher Med is primarily receive-only from a patient-data perspective.

The top risks are concentrated in Phase 2 (checkout integration): a race condition between Stripe checkout and shipping address availability, credit exhaustion with no alerting, the Core tier's Payment Links being unable to support dynamic add-ons (requiring a Checkout Session migration), and refunded orders that have already consumed SiPhox credits. All four are avoidable with a deferred fulfillment pattern and pre-order credit check. The biomarker ID mismatch between SiPhox naming and the local resilience engine is a Phase 3 risk that requires a mapping table built and unit-tested before any results UI is written.

## Key Findings

### Recommended Stack

The integration requires no new production dependencies. Every required capability — HTTP client, response validation, charting, payments, database, auth — is already in the project. The SiPhox API client should live at `lib/siphox-api.ts`, mirroring `lib/asher-med-api.ts` line by line except for the `Authorization: Bearer` header instead of `X-API-KEY`. Zod `safeParse()` validates every SiPhox response before it touches the database or UI. Report data is cached in PostgreSQL JSONB alongside the member record, not in Redis. Recharts `ReferenceArea` handles range band visualization; the existing custom SVG patterns in `BiologicalAgeCard.tsx` and `BiomarkerTrends.tsx` handle simpler inline visualizations.

**Core technologies:**
- Native `fetch` (Node 18+ built-in): SiPhox REST API client — follows Asher Med pattern exactly, no new library
- `zod` (^3.23.0, existing): runtime validation of every SiPhox response — external APIs can change schema without warning
- `recharts` (^3.7.0, existing): biomarker trend lines and ReferenceArea range bands — already in bundle
- `@vercel/postgres` (^0.10.0, existing): three new tables for customer mapping, order tracking, report caching
- `stripe` (^20.2.0, existing): extend existing checkout flow; Core tier requires Checkout Session migration
- `lib/resilience.ts` (existing): retry and circuit breaker patterns apply directly to SiPhox API calls

**New environment variables required:** `SIPHOX_API_KEY`, `SIPHOX_API_URL`, `SIPHOX_ENVIRONMENT` (production/staging/test), `SIPHOX_NOTIFY_RECEIVER`

**Total new npm dependencies: 0**

### Expected Features

**Must have (table stakes) — Phases 1-3:**
- Kit auto-ordering on Catalyst+/Concierge checkout — members pay for testing in their tier; kit must arrive without extra steps
- Kit add-on ($135) for Core tier at checkout — requires Stripe Checkout Session migration for Core tier
- Customer sync (CULTR member to SiPhox customer) — every kit order requires an existing SiPhox customer record
- Kit registration UI — physical kit arrives with unique ID; member registers it before mailing sample
- Order and kit status tracking — 7-state visual timeline (Ordered, Shipped, Registered, Sample Mailed, Processing, Results Ready)
- Smart empty states per lifecycle stage — distinct messaging and CTA at each step
- Categorized biomarker results display — 150+ markers by body system, color-coded
- Reference range visualization — horizontal range bar with member's value marked
- N/A display (two-tier, not a wall) — tested results first, untested markers collapsed in secondary section
- Results notification email via Resend — members notified when report is ready

**Should have (differentiators) — Phase 3-4:**
- Biological age card wired to real data — `BiologicalAgeCard.tsx` is already fully built; needs prop wiring only
- Category health scores — weighted aggregate per body system; extends existing `calculateResilienceScore()` algorithm
- SiPhox suggestions display — API returns pre-built suggestions; render as actionable cards with zero CULTR clinical liability
- Biomarker detail drill-down — expanded per-marker view with description, range context, trend, and related suggestions
- Dashboard summary widgets — at-a-glance counts; `BiomarkerTrends.tsx` summary stats grid already built
- Tier-gated access messaging — reuses existing `TierGate` component; Club members see upgrade CTA
- PDF report download — `@react-pdf/renderer` already in stack; follows existing invoice template pattern

**Defer to Phase 5 (future milestone):**
- Biomarker trend visualization — requires 2+ reports over time; `BiomarkerTrends.tsx` already architected for it
- Treatment correlation view — overlay protocol start dates on biomarker trends; unique CULTR moat over all standalone testing competitors; requires Phase 1-4 data foundation

**Defer indefinitely (anti-features):**
- Custom reference ranges (clinical validation burden and liability; use SiPhox-provided ranges only)
- AI chatbot for biomarker Q&A (liability; SiPhox BiomarkerAI product already exists)
- Wearable data integration (SiPhox's own app handles this)
- Camera-based barcode scanner for kit registration (unreliable on web; manual text input is sufficient)
- Third-party PDF lab uploads (SiPhox BiomarkerAI already exists)
- Recurring/subscription blood tests (separate billing complexity; one-time kit per checkout only)

### Architecture Approach

The integration follows the codebase's established four-layer pattern: `lib/config/` for constants and mapping definitions, `lib/siphox-api.ts` for the API client, `lib/siphox-db.ts` for database operations, and `app/api/siphox/*` routes as the authenticated HTTP surface for client components. One existing file gets a non-fatal extension (`app/api/webhook/stripe/route.ts` adds ~20 lines inside `handleCheckoutCompleted()`). Two existing dashboard components get their props wired to real data (`BiologicalAgeCard.tsx`, `BiomarkerTrends.tsx`). One existing page gets a tabbed layout addition (`app/dashboard/page.tsx`). All SiPhox API calls happen server-side only; client components call CULTR's own API routes, never SiPhox directly (HIPAA requirement and API key security).

**Major components:**
1. `lib/config/siphox.ts` — biomarker display name map (`SIPHOX_BIOMARKER_MAP`), category definitions, kit type constants, tier eligibility rules; single source of truth for SiPhox-to-CULTR translation
2. `lib/siphox-api.ts` — REST client for all SiPhox endpoint groups (customers, orders, kits, reports, biomarkers, credits); `siphoxRequest<T>()` wrapper with Bearer auth, Zod validation, and custom `SiPhoxApiError`
3. `lib/siphox-db.ts` — DB operations for three new tables; `orderSiPhoxKit()` orchestrates address resolution, find-or-create customer, and kit order creation
4. `migrations/019_siphox_tables.sql` — `siphox_customers` (CULTR phone to SiPhox ID mapping), `siphox_orders` (kit lifecycle with 8 status values), `siphox_reports` (JSONB report cache with extracted `biological_age` column)
5. `app/api/siphox/labs/route.ts` — authenticated GET returning kit status, reports, biomarkers, and biological age for the Labs tab
6. `app/api/siphox/register-kit/route.ts` — authenticated POST for kit validation and registration
7. `components/dashboard/LabsDashboardClient.tsx` — new Labs tab UI: status timeline, registration form, categorized results; renders existing `BiologicalAgeCard` and `BiomarkerTrends` with real data

**Total new files: 8. Files modified: 5 (all additive changes, no rewrites).**

### Critical Pitfalls

1. **SiPhox customer creation race condition** — Stripe `checkout.session.completed` fires before the member's shipping address is available from intake. Prevention: store order intent locally as `status: 'pending_address'`; trigger actual SiPhox API call when intake `ShippingAddressForm` is submitted. This is the most architecturally significant decision — it determines the entire order flow design.

2. **SiPhox credit exhaustion with no alerting** — Members can complete checkout when CULTR has zero SiPhox credits, resulting in a paid order with no fulfillment. Prevention: call `GET /credits` before every `POST /orders`; set order to `status: 'pending_credits'` if insufficient; send admin alert via Resend when balance drops below threshold.

3. **Biomarker ID mismatch between SiPhox and resilience engine** — `lib/resilience.ts` uses IDs like `hs-crp` and `hba1c`; SiPhox returns `hsCRP` and `A1C`. Without a mapping table, `calculateResilienceScore()` produces 0% completeness for members with real results. Prevention: build `lib/config/siphox.ts` biomarker map first and unit-test that every `BIOMARKER_DEFINITIONS` entry has a SiPhox mapping before writing any UI.

4. **Core tier Payment Links cannot support optional add-ons** — Stripe Payment Links are static URLs. The $135 Core add-on requires a server-side Checkout Session. Prevention: migrate Core checkout to `app/api/checkout/route.ts`-style session creation before building the add-on UI; keep Payment Links for Catalyst+/Concierge where the kit is auto-included.

5. **Refunded orders orphaning SiPhox credits** — Member checks out Core + $135 add-on, then requests refund. Stripe refunds both charges; SiPhox credit is already consumed. Prevention: deferred fulfillment with 24-48 hour window before creating the SiPhox order; extend existing `handleChargeRefunded` in the Stripe webhook to cancel pending SiPhox orders before credit is consumed.

## Implications for Roadmap

Based on research, suggested phase structure (4 phases plus a future Phase 5):

### Phase 1: Foundation — API Client and Database
**Rationale:** Zero external dependencies, fully testable in isolation, required by every subsequent phase. Order a real test kit now so lab results are available when Phase 4 UI is built (lab turnaround is 5-10 business days).
**Delivers:** Complete SiPhox API client, Zod schemas for all responses, three DB tables with indexes, and the DB operations layer. No member-facing changes.
**Addresses:** Customer sync (table-stakes), `external_id` setup (Pitfall 11), environment-aware `is_test_order` flag (Pitfall 13)
**Avoids:** Duplicate customer creation on webhook retry (Pitfall 15) via idempotent find-or-create in `lib/siphox-db.ts`
**Files:** `lib/config/siphox.ts`, `lib/siphox-api.ts`, `lib/siphox-db.ts`, `migrations/019_siphox_tables.sql`

### Phase 2: Checkout Integration — Automated Kit Ordering
**Rationale:** Enables kits to start shipping as soon as members check out, before any member-facing UI exists. Kits take days to arrive and samples take days to process — this clock starts only once ordering is wired. Contains the highest-risk pitfalls; all four must be designed here, not bolted on later.
**Delivers:** Automatic kit ordering on Catalyst+/Concierge checkout; $135 Core add-on with Checkout Session migration; deferred fulfillment pattern (pending_address state machine); credit monitoring and admin alerting; refund cancellation hook.
**Implements:** Non-fatal block in `handleCheckoutCompleted()` (~20 lines); Core tier Checkout Session migration; `handleChargeRefunded()` extension
**Avoids:** Race condition (Pitfall 1), credit exhaustion (Pitfall 2), Payment Link limitation (Pitfall 5), refund orphan (Pitfall 10), tier downgrade edge case (Pitfall 14)

### Phase 3: Kit Registration — First Member-Facing Feature
**Rationale:** Simplest possible member interaction (one input, one API call, one status update). Validates the auth flow before building the complex results display. Gives early adopters something to do while their sample processes.
**Delivers:** Kit registration UI with validate-before-register flow; specific error messages per failure mode (not found, already registered, expired, not yet in system); 7-state status timeline; smart per-stage empty states.
**Avoids:** Silent registration failures (Pitfall 6); GA4 on authenticated lab pages must be resolved here before any labs page ships (Pitfall 9 — inherited from portal research, applies with greater urgency to biomarker data)
**Addresses:** All Kit Registration and Kit Status Tracking table-stakes features

### Phase 4: Results Display — Full Labs Dashboard
**Rationale:** Depends on real reports existing in SiPhox (requires Phase 1-3 running; lab turnaround is 5-10 business days). Build the biomarker mapping table before writing any UI.
**Delivers:** Categorized biomarker results with reference range visualization; biological age card wired to real data; category health scores; SiPhox suggestions display; biomarker detail drill-down; dashboard summary widgets; tier-gated access messaging; PDF report download; results notification email.
**Uses:** Existing `BiologicalAgeCard.tsx` (wiring only); existing `BiomarkerTrends.tsx` (wiring + category extension); existing `TierGate` component; existing `@react-pdf/renderer`; existing Recharts `ReferenceArea`
**Avoids:** Biomarker ID mismatch (Pitfall 4 — mapping table built first); unit mismatch (Pitfall 12 — conversion layer in data transform); wall of N/A (Pitfall 8 — two-tier display); PHI in logs and analytics (Pitfall 3 and 9)

### Phase 5: Longitudinal Intelligence (future milestone — defer)
**Rationale:** Requires 2+ reports accumulated over time; can only be built after real members have gone through multiple test cycles.
**Delivers:** Biomarker trend sparklines and delta calculations across multiple reports; treatment correlation view overlaying medication start dates from Asher Med order history on biomarker trend charts.
**Note:** This is CULTR's unique long-term moat — the only health platform that can answer "is my treatment working?" with real biomarker data. `BiomarkerTrends.tsx` is already architected for multi-report data; the Phase 5 work is primarily data infrastructure (historical storage), cross-system SQL joins (SiPhox reports x `asher_orders`), and timeline overlay visualization.

### Phase Ordering Rationale

- Phase 1 must come first: the API client and DB tables are prerequisites for all API calls in Phase 2. Nothing works without them.
- Phase 2 before Phase 3: kits must be ordered before members can register them. The deferred fulfillment pattern also resolves the address race condition that would otherwise block end-to-end Phase 3 testing.
- Phase 3 before Phase 4: kit registration must work before reports exist. Also validates auth flow with a simple operation before building the complex results UI.
- Phase 4 cannot be fully tested until a real kit completes the lab cycle (5-10 business days). Ordering a test kit in Phase 1 avoids being blocked waiting for lab results when Phase 4 code is ready.
- Phase 5 is deferred by design: longitudinal data only accumulates after Phase 1-4 have been live and real members have tested multiple times.

### Research Flags

Phases needing deeper research or early API confirmation:

- **Phase 1:** Confirm exact SiPhox API response schemas with a partner API key before finalizing Zod schemas. Public docs are minimal; the report schema in ARCHITECTURE.md is inferred (confidence: LOW). Request a sandbox API key from SiPhox at project kickoff.
- **Phase 2:** Test that Stripe Checkout Sessions support a recurring subscription line item plus a one-time add-on in the same session. PITFALLS.md flags the mode constraint (`subscription` vs `payment`). Verify in Stripe sandbox before writing the Core checkout migration.
- **Phase 3-4:** Confirm with SiPhox whether they support webhooks for report completion. If webhooks are available, the polling strategy described in Pitfall 7 is unnecessary. This is a single email to the SiPhox partner team and could save significant cron infrastructure.

Phases with standard, well-documented patterns (skip additional research):

- **Phase 1 API client structure:** Direct structural copy of `lib/asher-med-api.ts`. No novel patterns.
- **Phase 4 PDF generation:** Follows existing `lib/invoice/invoice-generator.tsx` and `lib/lmn/` patterns exactly; same `@react-pdf/renderer` library.
- **Phase 4 tier gating:** Reuses `components/library/TierGate.tsx` unchanged.
- **Phase 5 data joins:** Standard PostgreSQL joins between existing tables; no new infrastructure or libraries.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies confirmed. All required capabilities verified in existing project. SiPhox client structure has a direct analog in `lib/asher-med-api.ts`. |
| Features | MEDIUM-HIGH | Table-stakes features confirmed via competitor analysis and existing component shells. SiPhox-specific capabilities (exact biomarker count, suggestion schema, webhook availability) need live API confirmation. |
| Architecture | HIGH | Component boundaries follow established codebase patterns. Data flow maps cleanly onto existing Asher Med and Stripe webhook patterns. DB schema design is conservative (JSONB for variable report data, dedicated columns for frequent queries). |
| Pitfalls | HIGH | All critical pitfalls verified against live code. Race condition (Pitfall 1) is confirmed to already exist for Asher Med in the Stripe webhook handler. Payment Link limitation (Pitfall 5) confirmed against Stripe docs. Biomarker ID mismatch (Pitfall 4) confirmed by reading both `lib/resilience.ts` and SiPhox biomarker names from PROJECT.md. |

**Overall confidence:** HIGH

### Gaps to Address

- **SiPhox API schema confirmation:** The SiPhox report response schema is inferred from PROJECT.md endpoint descriptions and general lab API patterns (confidence: LOW per ARCHITECTURE.md). Zod schemas must be validated against a real API response before Phase 4 UI is built. Request a sandbox API key early in Phase 1.
- **SiPhox webhook availability:** Unknown whether SiPhox supports report-completion webhooks. This determines whether the polling strategy for Pitfall 7 is necessary at all. Confirm with SiPhox partner team before building any polling infrastructure in Phase 4.
- **Stripe session mode for subscription + one-time add-on:** The Core tier add-on requires mixing a recurring subscription with a one-time $135 charge. Stripe supports this but the exact `invoice_creation` configuration needs a sandbox test before Phase 2 implementation.
- **SiPhox credit balance and per-kit cost:** The pre-order credit check (Pitfall 2 prevention) requires knowing actual balance and per-kit cost. Confirm current credit balance and wholesale cost with SiPhox before going live with ordering.
- **Address availability at webhook time:** The deferred fulfillment pattern assumes shipping address is collected during intake. Confirm `ShippingAddressForm` is consistently completed before Kit Registration is needed; if members commonly skip intake, a fallback address prompt on the Labs dashboard is required.
- **BiomarkerCategory type extension conflict:** `lib/resilience.ts` uses `BiomarkerCategory` for the resilience score engine; `BiomarkerTrends.tsx` uses the same type for category colors. Extending the type union to include SiPhox categories must be verified not to break the resilience scoring algorithm, which has fixed `BIOMARKER_DEFINITIONS` weights per category.

## Sources

### Primary (HIGH confidence)
- `lib/asher-med-api.ts` — definitive pattern for SiPhox client structure; bearer token auth, error class, typed wrappers
- `components/dashboard/BiologicalAgeCard.tsx` — fully built gauge, sparkline, status messaging; requires only prop wiring
- `components/dashboard/BiomarkerTrends.tsx` — fully built sparklines, trend indicators, category grouping, summary stats; requires only prop wiring and category extension
- `lib/resilience.ts` — biomarker definitions with weights, optimal/acceptable ranges, scoring algorithm; confirmed ID naming mismatch with SiPhox
- `app/api/webhook/stripe/route.ts` — confirmed race condition pattern (lines 149-168), idempotency handling (lines 72-76), refund flow (line 107)
- PROJECT.md (internal) — SiPhox API endpoint surface, kit types, biomarker categories, tier pricing, integration constraints

### Secondary (MEDIUM confidence)
- [SiPhox Health Partner FAQ](https://siphoxhealth.com/partner/faq) — API capabilities, co-branded dashboard vs API-only tiers
- [SiPhox White Label for Telehealth](https://siphoxhealth.com/articles/how-can-telehealth-companies-add-white-label-blood-testing) — Integration timeline, implementation process
- [InsideTracker Personal Health Dashboard](https://info.insidetracker.com/personal-health-dashboard) — Competitor feature reference (10 healthspan categories, InnerAge)
- [Stripe Checkout optional items](https://docs.stripe.com/payments/checkout/optional-items) — Payment Link limitation confirmation
- [HIPAA Encryption Requirements 2025](https://www.keragon.com/hipaa/hipaa-explained/hipaa-encryption-requirements) — PHI storage requirements for JSONB biomarker cache
- [Webhook Race Condition Solution Guide](https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide) — Deferred fulfillment pattern validation
- [PMC: Patient-Facing Health Data Visualizations](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785326/) — UX patterns for lab results display
- [Function Health vs Superpower Comparison](https://www.productpep.com/blog/2025/10/7/is-function-health-a-superpower) — Competitor feature baseline

### Tertiary (LOW confidence — needs live API confirmation)
- SiPhox report response schema (inferred from PROJECT.md and analogous lab APIs) — exact field names, biomarker ID format, suggestion schema, webhook support; must be confirmed with a sandbox API key before Phase 4 implementation

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
