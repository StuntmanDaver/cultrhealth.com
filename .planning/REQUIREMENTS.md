# Requirements: SiPhox Health Integration

**Defined:** 2026-03-14
**Core Value:** Members can see their real biomarker data — organized, visual, and actionable — directly in their CULTR Health dashboard.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### API Foundation

- [x] **API-01**: SiPhox API client library with typed request/response for all endpoints (customers, orders, kits, reports, biomarkers, credits)
- [x] **API-02**: Zod schemas for all SiPhox API responses with runtime validation
- [x] **API-03**: SiPhox customer creation from CULTR member data with external_id mapping
- [x] **API-04**: SiPhox customer lookup by external_id for existing member resolution
- [x] **API-05**: Credit balance check before order placement with low-balance alerting

### Database

- [x] **DB-01**: Database table for SiPhox customer mapping (member_id ↔ siphox_customer_id)
- [x] **DB-02**: Database table for SiPhox kit orders (order_id, status, kit_type, tracking)
- [x] **DB-03**: Database table for cached biomarker reports (JSONB storage, immutable after fetch)
- [x] **DB-04**: Biomarker mapping config (~150+ entries: SiPhox name → display name, category, unit)

### Checkout Integration

- [ ] **CHK-01**: Auto-order SiPhox kit on Catalyst+/Concierge subscription checkout via Stripe webhook
- [ ] **CHK-02**: $135 optional blood test add-on line item for Core tier at checkout
- [ ] **CHK-03**: Deferred order fulfillment pattern for address resolution from checkout data
- [ ] **CHK-04**: Non-fatal SiPhox order failure handling (email support, don't block subscription)

### Kit Management

- [ ] **KIT-01**: Kit registration page where member enters kit ID from physical kit
- [ ] **KIT-02**: Kit ID validation via SiPhox API before registration with clear error messages
- [ ] **KIT-03**: Kit registration submission linking kit to member's SiPhox customer
- [ ] **KIT-04**: 7-state order/kit status timeline (No Kit → Ordered → Shipped → Registered → Sample Mailed → Processing → Results Ready)
- [ ] **KIT-05**: Smart empty states with distinct messaging and CTAs per status

### Results Display

- [ ] **RES-01**: Fetch and cache biomarker reports from SiPhox API
- [ ] **RES-02**: Categorized biomarker display organized by body system (Metabolic, Heart, Hormonal, Inflammation, Thyroid, Nutritional, Extended)
- [ ] **RES-03**: Reference range visualization bar for each biomarker (low/optimal/high color-coded)
- [ ] **RES-04**: N/A display for biomarkers not included in member's test panel
- [ ] **RES-05**: Biomarker detail drill-down (description, range context, value interpretation)
- [ ] **RES-06**: HIPAA-compliant data handling (no PHI in logs, analytics exclusion on labs routes)

### Dashboard

- [ ] **DSH-01**: Dedicated labs section/tab on member dashboard
- [ ] **DSH-02**: BiologicalAgeCard powered by real SiPhox biomarker data
- [ ] **DSH-03**: BiomarkerTrends component wired to SiPhox report data
- [ ] **DSH-04**: Category health scores (aggregate per body system)
- [ ] **DSH-05**: SiPhox suggestions displayed as actionable insight cards
- [ ] **DSH-06**: Dashboard summary widgets (optimal count, needs attention, improving)
- [ ] **DSH-07**: Tier-gated messaging (Club: upgrade CTA, Core: add-on CTA, Catalyst+/Concierge: included)

### Notifications

- [ ] **NTF-01**: Email notification when biomarker results are ready (via Resend)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Longitudinal Intelligence

- **LNG-01**: Biomarker trend visualization across multiple test reports
- **LNG-02**: Treatment correlation view (biomarker changes overlaid with medication start dates from Asher Med)
- **LNG-03**: PDF lab report download with CULTR branding

### Extended Features

- **EXT-01**: Recurring/subscription blood test ordering
- **EXT-02**: Reorder kit from dashboard without new checkout

## Out of Scope

| Feature | Reason |
|---------|--------|
| Medical interpretation of results | Malpractice liability — use SiPhox reference ranges, frame as "optimization" |
| Custom reference ranges | Requires clinical team validation — use SiPhox-provided ranges exclusively |
| Camera barcode scanner for kit registration | Unreliable on web — manual text input with validation is simpler and more reliable |
| Wearable data integration | Scope creep — SiPhox's own app handles this |
| AI chatbot for biomarker Q&A | Liability risk — surface SiPhox suggestions instead |
| Third-party lab result uploads | Multi-month PDF parsing project — use SiPhox BiomarkerAI for outside labs |
| Club tier access | $0 tier has no revenue to offset kit cost |
| Real-time sample GPS tracking | No courier provides this — use status-based tracking only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Complete |
| API-04 | Phase 1 | Complete |
| API-05 | Phase 1 | Complete |
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| DB-04 | Phase 1 | Complete |
| CHK-01 | Phase 2 | Pending |
| CHK-02 | Phase 2 | Pending |
| CHK-03 | Phase 2 | Pending |
| CHK-04 | Phase 2 | Pending |
| KIT-01 | Phase 3 | Pending |
| KIT-02 | Phase 3 | Pending |
| KIT-03 | Phase 3 | Pending |
| KIT-04 | Phase 3 | Pending |
| KIT-05 | Phase 3 | Pending |
| RES-01 | Phase 4 | Pending |
| RES-02 | Phase 4 | Pending |
| RES-03 | Phase 4 | Pending |
| RES-04 | Phase 4 | Pending |
| RES-05 | Phase 4 | Pending |
| RES-06 | Phase 4 | Pending |
| DSH-01 | Phase 4 | Pending |
| DSH-02 | Phase 4 | Pending |
| DSH-03 | Phase 4 | Pending |
| DSH-04 | Phase 4 | Pending |
| DSH-05 | Phase 4 | Pending |
| DSH-06 | Phase 4 | Pending |
| DSH-07 | Phase 4 | Pending |
| NTF-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-15 after plan 01-01 completion*
