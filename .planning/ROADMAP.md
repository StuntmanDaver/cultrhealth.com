# Roadmap: SiPhox Health Integration

## Overview

This integration adds at-home blood testing to the CULTR Health platform by connecting the SiPhox Health API. The work moves through four phases: building the API client and database foundation, wiring automated kit ordering into the Stripe checkout flow, creating the member-facing kit registration experience, and delivering the full labs dashboard with categorized biomarker results. Each phase delivers a verifiable capability and unblocks the next. The existing BiologicalAgeCard and BiomarkerTrends components need wiring to real data, not rebuilding.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - SiPhox API client, Zod schemas, database tables, and customer sync layer
- [ ] **Phase 2: Checkout Integration** - Automated kit ordering on subscription checkout via Stripe webhook
- [ ] **Phase 3: Kit Registration** - Member-facing kit registration UI with status tracking
- [ ] **Phase 4: Labs Dashboard** - Categorized biomarker results, dashboard widgets, and results notification

## Phase Details

### Phase 1: Foundation
**Goal**: The SiPhox API can be called reliably from server-side code, all responses are validated, and member-to-SiPhox customer mapping is persisted
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04, API-05, DB-01, DB-02, DB-03, DB-04
**Success Criteria** (what must be TRUE):
  1. A CULTR member can be created as a SiPhox customer via the API client and the mapping is stored in the database
  2. An existing SiPhox customer can be looked up by CULTR member external_id without creating a duplicate
  3. SiPhox credit balance can be checked and a low-balance condition is detected and logged
  4. All SiPhox API responses are validated through Zod schemas before touching the database
**Plans**: TBD

Plans:
- [ ] 01-01: SiPhox API client and Zod schemas
- [ ] 01-02: Database migration and data access layer

### Phase 2: Checkout Integration
**Goal**: When a member completes a Catalyst+, Concierge, or Core+add-on checkout, a SiPhox kit order is created automatically without manual intervention
**Depends on**: Phase 1
**Requirements**: CHK-01, CHK-02, CHK-03, CHK-04
**Success Criteria** (what must be TRUE):
  1. Catalyst+ or Concierge subscription checkout triggers an automatic SiPhox kit order using the member's shipping address
  2. Core tier checkout offers a $135 blood test add-on and, when selected, triggers a kit order
  3. If the SiPhox API is down or credits are exhausted, the subscription still activates and support is notified via email
  4. A refunded order cancels the pending SiPhox kit order before credits are consumed
**Plans**: TBD

Plans:
- [ ] 02-01: Stripe webhook extension and deferred fulfillment
- [ ] 02-02: Core tier checkout add-on

### Phase 3: Kit Registration
**Goal**: A member who has received a physical blood test kit can register it in their portal and track its status through the lab lifecycle
**Depends on**: Phase 2
**Requirements**: KIT-01, KIT-02, KIT-03, KIT-04, KIT-05
**Success Criteria** (what must be TRUE):
  1. Member can enter a kit ID from their physical kit and see immediate validation feedback (valid, not found, already registered, expired)
  2. After successful registration, the kit status updates to "Registered" in a visual 7-state timeline
  3. Members with no kit order see a distinct empty state explaining how to get a kit (with upgrade or add-on CTA based on tier)
  4. Members at each lifecycle stage (ordered, shipped, registered, processing, results ready) see stage-appropriate messaging and next-step CTAs
**Plans**: TBD

Plans:
- [ ] 03-01: Kit registration API routes and UI
- [ ] 03-02: Status timeline and smart empty states

### Phase 4: Labs Dashboard
**Goal**: Members can view their complete biomarker results organized by body system, with reference ranges, health scores, and actionable insights directly in their CULTR dashboard
**Depends on**: Phase 3
**Requirements**: RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, DSH-01, DSH-02, DSH-03, DSH-04, DSH-05, DSH-06, DSH-07, NTF-01
**Success Criteria** (what must be TRUE):
  1. Member with completed lab results sees biomarkers organized by category (Metabolic, Heart, Hormonal, Inflammation, Thyroid, Nutritional, Extended) with color-coded reference range bars
  2. BiologicalAgeCard displays the member's real biological age from SiPhox data (not placeholder values)
  3. BiomarkerTrends shows real trend data and summary stats (optimal count, needs attention, improving)
  4. Biomarkers not included in the member's panel show "N/A" rather than being hidden, so members know what is available
  5. Club tier members see an upgrade CTA instead of lab results; Core members without the add-on see an add-on CTA
**Plans**: TBD

Plans:
- [ ] 04-01: Biomarker mapping config and report fetching
- [ ] 04-02: Labs dashboard UI and results display
- [ ] 04-03: Dashboard widgets, tier gating, and results notification email

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Checkout Integration | 0/2 | Not started | - |
| 3. Kit Registration | 0/2 | Not started | - |
| 4. Labs Dashboard | 0/3 | Not started | - |
