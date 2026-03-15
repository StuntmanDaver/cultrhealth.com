# Feature Landscape: SiPhox Health Blood Test Integration

**Domain:** At-home blood test kit ordering, registration, and biomarker results display for telehealth platform
**Researched:** 2026-03-14
**Overall confidence:** MEDIUM-HIGH (API schemas from PROJECT.md, competitor patterns validated via multiple sources, existing component shells verified in codebase)

---

## Table Stakes

Features users expect. Missing any of these = the integration feels broken or pointless.

### Kit Ordering & Fulfillment

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Kit auto-ordering on Catalyst+/Concierge checkout** | These tiers include blood testing in their price. Kit must arrive without extra steps after subscribing. Every DTC testing competitor ships a kit immediately after purchase. | Medium | Stripe webhook (`checkout.session.completed`) triggers SiPhox `POST /orders` with member shipping address. Must check SiPhox credit balance via `GET /credits` before ordering. Handle order failure gracefully (email support, don't block subscription). Store `siphox_order_id` in DB. |
| **Kit add-on for Core tier at checkout** | $135 optional add-on at checkout. Standard upsell pattern -- Stripe checkout supports multiple line items natively. | Low | Add line item to Stripe checkout session with metadata flag (`blood_test_addon: true`). Same SiPhox order flow once payment succeeds. |
| **Customer sync (CULTR member -> SiPhox customer)** | Every SiPhox order requires a customer record. Must create SiPhox customer before first kit order and maintain the mapping. | Medium | `POST /customer` on first kit order. Store `siphox_customer_id` in local DB (new column on `users` table or separate mapping table). Use `external_id` field set to CULTR member ID for bidirectional lookup via `GET /customers`. Handle idempotency: check if customer already exists before creating. |
| **Results notification** | Members need to know when results are ready without checking the portal daily. Every competitor (SiPhox's own app, InsideTracker, Superpower) sends email when results arrive. | Low | Email via Resend when report status detected as complete. Poll SiPhox `GET /customers/:id/reports/:reportID` on a schedule or use webhook if SiPhox supports it. Fallback: check on member portal login. |

### Kit Registration & Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Kit registration UI** | Physical kit arrives with a unique ID printed on it. Member must link kit to their account before mailing the sample. Standard flow for Everlywell, SiPhox, LetsGetChecked, and every at-home testing company. | Medium | Two-step: (1) `GET /kits/:kitID/validate` to confirm kit ID is valid and unregistered, (2) `POST /kits/:kitID/register` to link kit to customer. Manual text input for kit ID -- no camera barcode scanning (unreliable on web). Clear error states: "Kit not found", "Kit already registered", "Invalid format". |
| **Order/kit status tracking** | Members need to know "did my kit ship?", "was my sample received?", "are results ready?" -- the most common reason to check the portal after ordering. Hims, Ro, and every DTC health platform show clear status timelines. | Medium | Poll `GET /orders/:id` for shipment/fulfillment status. Display as visual timeline: Ordered -> Shipped -> Kit Received -> Kit Registered -> Sample Mailed -> Processing -> Results Ready. Cache status in local DB to reduce API calls. Show estimated timelines at each step ("Results typically ready in 5-7 business days"). |
| **Smart empty states** | Each stage of the flow needs distinct messaging and CTAs. "Your kit is on its way!" is different from "Register your kit to get started" is different from "Results processing, check back in 5-7 days." Blank screens with no guidance = support tickets. | Low | State machine with 7 states: No Kit -> Ordered -> Shipped -> Registered -> Sample Mailed -> Processing -> Results Ready. Each state gets a card with: illustration/icon, status message, next action CTA, estimated timeline. Reuses existing component patterns (`ScrollReveal`, card layout). |

### Biomarker Results Display

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Categorized biomarker results** | The core value proposition of this entire integration. Members must see their numbers organized by body system (Metabolic, Heart, Hormonal, Inflammation, Thyroid, Nutritional, Extended). Every competitor organizes by system -- dumping 150 markers in a flat list is unusable. | High | Fetch `GET /customers/:id/reports/:reportID`. Map 150+ biomarkers into categories matching the Longevity Essentials Program (defined in PROJECT.md). Render category sections with collapsible/expandable groups. Color-coded status per marker. Existing `BiomarkerTrends.tsx` has category grouping scaffolded but uses old category names (inflammation, metabolic, hormonal, longevity, oxidative, mitochondrial) -- must align to SiPhox categories. |
| **Reference range visualization** | Users must understand "is this good or bad?" at a glance. Every lab report (Quest, Labcorp, InsideTracker, SiPhox's own dashboard) shows a range bar with the patient's value marked on it. Without this, numbers are meaningless to non-medical users. | Medium | Horizontal range bar for each biomarker: low (red/amber) | optimal (green) | high (red/amber) with marker showing member's value position. Use SiPhox-provided reference ranges exclusively (per PROJECT.md constraint -- no custom ranges). Color: green for optimal, amber for borderline, red for out-of-range. Accessible: don't rely solely on color -- add labels/icons. |
| **N/A display for untested biomarkers** | Show all possible biomarkers with "N/A" or "No data" when the report doesn't include them. Sets expectations for what's available and serves as upsell surface for future testing. Explicitly required in PROJECT.md. | Low | Render full category layout with all known biomarkers. For any marker not present in report results, show grayed-out card with "N/A" or "Not tested" and optionally which panel includes it. |
| **HIPAA-compliant data handling** | Biomarker results are PHI. Existing HIPAA patterns must be followed throughout. Not a visible feature but a hard requirement -- violation = legal exposure. | Low | No PHI in server logs, error tracking, or analytics. HTTPS for all SiPhox API calls. Cache results in DB with same access controls as patient data. Follow existing patterns from `lib/auth.ts` and `lib/asher-med-api.ts`. |

---

## Differentiators

Features that set CULTR apart from competitors. Not expected by users, but create real value and justify the premium membership price.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Biological age card (real data)** | Hero metric that makes abstract biomarker data emotionally resonant. "You're aging 3 years slower than your chronological age." InsideTracker's InnerAge and Superpower's Biological Age are their highest-engagement features. Transforms clinical data into a story. | Medium | `BiologicalAgeCard.tsx` already fully built with gauge visualization, sparkline trend, status messages (Exceptional/Strong/Healthy/Room for optimization/Accelerated), and target display. Props: `chronologicalAge`, `biologicalAge`, `ageGap`, `historicalData`. Needs: (1) calculation algorithm -- SiPhox may not provide bio-age directly, so compute from biomarker values using existing `BIOMARKER_DEFINITIONS` weights in `lib/resilience.ts` (PhenoAge-like model from hsCRP, glucose, etc.), (2) wire to real report data, (3) store chronological age from member profile. |
| **Biomarker trend visualization** | Shows progress over time across multiple tests. "Your ApoB dropped 22% since starting treatment." This is what closes the loop between treatment and outcomes -- the entire thesis of this integration. InsideTracker, Superpower, and TrackBiomarkers all show longitudinal trend lines. | Medium | `BiomarkerTrends.tsx` already built with sparklines, trend indicators (improving/stable/declining), percent change, category grouping, summary stats (optimal count, improving count, declining count), and both compact and expanded card modes. Needs: storing multiple reports over time (historical data table), computing deltas between reports, and graceful single-test state (no trend line yet, just current values with "First measurement" label). Only meaningful after 2+ tests. |
| **SiPhox suggestions display** | SiPhox API returns a `Suggestion` schema: `{ _id, text, link, category, settings: [{biomarker, value}] }`. Free insights without building recommendation logic. Surface these as actionable cards tied to specific biomarker results. | Low | Parse suggestions from report response. Render as cards grouped by category with link-out for more detail. Connect to CULTR's own science library (`/science/[slug]`) where article topics match suggestion categories. Low engineering effort, high perceived value. |
| **Category health scores** | Aggregate score per body system (e.g., "Heart Health: 85/100") instead of making members interpret 10+ individual markers per category. InsideTracker uses 10 healthspan category scores as their primary navigation. Simplifies complexity. | Medium | Weighted average of individual biomarker scores within each category. Existing `lib/resilience.ts` already has a scoring algorithm with weighted `BIOMARKER_DEFINITIONS` and `calculateResilienceScore()`. Extend to work with SiPhox category groupings and the full 150+ marker set. Display as circular progress or gauge per category in a grid. |
| **Biomarker detail drill-down** | Tap any biomarker to see: full name, description, what it measures, optimal vs your value, reference range context, trend chart (if multiple tests), and related suggestions. The difference between a "dashboard" and a "data dump." Every serious competitor has this. | Medium | Per-biomarker detail view (modal or page). Content: description from SiPhox `GET /biomarkers` response, reference range visualization, current value with status, trend sparkline from historical data, related suggestions. Existing `BiomarkerCard` component in `BiomarkerTrends.tsx` has most of the compact view; needs an expanded detail view. |
| **Dashboard summary widgets** | At-a-glance stats: "X biomarkers optimal, Y need attention, Z improving since last test." Quick triage before diving into details. Prevents information overload on the main labs page. | Low | `BiomarkerTrends.tsx` already has a summary stats grid (Average Score, Optimal, Improving, Needs Attention). Wire to real data. Add: date of last test, days since sample, next recommended test date. |
| **PDF report download** | Members want to share results with their primary care doctor or keep records. Standard in InsideTracker, Function Health, SiPhox's own app. Useful for HSA/FSA reimbursement documentation. | Medium | `@react-pdf/renderer` already in the stack (used for invoices and LMN documents). Create a lab report template showing: member info, test date, all biomarkers organized by category with values/ranges/status, summary scores, and CULTR branding. Follow existing invoice template patterns in `lib/invoice/`. |
| **Treatment correlation view** | "Your hsCRP dropped 40% since starting BPC-157 three months ago." Connect biomarker changes to the member's active CULTR protocols and medications. **This is the unique differentiator no standalone testing company can offer.** SiPhox, InsideTracker, and Superpower have no treatment data -- CULTR does via Asher Med. | High | Requires joining: (1) biomarker trend data from SiPhox reports, (2) order/prescription history from `asher_orders` table and Asher Med API, (3) medication start dates and durations from `MEDICATION_OPTIONS`. Timeline overlay showing "Started Semaglutide" / "Added BPC-157" markers on biomarker trend charts. Very high perceived value but complex data join. Phase 3 feature -- needs Phase 1-2 data foundation first. |
| **Tier-gated lab access messaging** | Club members ($0) see "Upgrade to Core to add blood testing" with pricing and CTA. Creates upgrade pressure and explains the value proposition. Core members see "Add blood testing for $135" on their dashboard. | Low | Reuses existing `TierGate` component from `components/library/TierGate.tsx`. Check member tier from session/subscription data. Show appropriate messaging and CTA per tier. |

---

## Anti-Features

Features to explicitly NOT build. Each is either out of scope, a liability risk, or scope creep that delays the core integration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Medical interpretation of results** | CULTR is a telehealth platform, not a diagnostic service. Interpreting lab values as medical advice creates malpractice liability. InsideTracker carefully frames everything as "wellness optimization" and still faces regulatory scrutiny. State medical board regulations vary on what constitutes "practicing medicine." | Use SiPhox-provided reference ranges and suggestions (SiPhox carries the clinical liability for those). Frame all language as "optimization" not "diagnosis." Include disclaimer on every results page: "These results are for informational purposes and do not constitute medical advice. Discuss results with your healthcare provider." |
| **Custom reference ranges** | Maintaining proprietary "optimal" ranges requires ongoing clinical validation, medical advisory board review, and documentation. Gets outdated, creates liability, and is explicitly out of scope per PROJECT.md. Competitors who do this (InsideTracker with "longevity-optimized" ranges) have full-time clinical teams. | Use SiPhox-provided reference ranges exclusively. Display them faithfully. If CULTR wants longevity-optimized ranges later, that's a separate clinical decision requiring medical advisory input and legal review. |
| **Barcode/QR camera scanner for kit registration** | Web-based camera barcode scanning is unreliable: requires camera permissions (users decline), lighting and focus issues, browser compatibility gaps, and graceful fallback needed anyway. Native apps do this well; web apps do not. Failed scans = frustrated users who end up typing the ID manually anyway. | Manual text input for kit ID. The kit ID is printed on the box as a string (e.g., "KIT-ABC123"). Users type 8-12 characters. Validate via `GET /kits/:kitID/validate` with clear error messaging ("Kit not found -- check the ID printed on your box"). |
| **Recurring/subscription blood tests** | Explicitly out of scope per PROJECT.md. Adds significant complexity: recurring SiPhox orders, credit inventory management, reorder timing logic, subscription billing for add-on tests, and cancellation flows. | One-time kit per checkout. If recurring testing is wanted, it's a separate milestone with its own ordering, billing, and inventory management. |
| **Wearable data integration (Apple Health, Oura, Whoop, etc.)** | Scope creep. SiPhox's own app already integrates with these wearables. Rebuilding web-based wearable sync requires OAuth integrations per vendor, continuous data ingestion pipelines, and storage for streaming data. Months of work for marginal value in a web portal. | Link to SiPhox's app for wearable data integration. Focus CULTR's portal on the unique value: connecting biomarkers to treatment protocols, which no wearable integration provides. |
| **AI chatbot for biomarker Q&A** | Superpower does this ("ask why your Magnesium is low"). Building an AI chat interface that interprets health data is a massive liability risk (medical advice without a license) and a large engineering effort (RAG pipeline, guardrails, citation verification, prompt injection prevention). The existing AI SDK is for protocol generation by providers, not patient-facing health interpretation. | Surface SiPhox's pre-built suggestions (they handle liability). Link to CULTR's science library articles for educational content. If AI Q&A is wanted later, scope it as a separate project with legal review. |
| **Third-party lab result uploads (PDF parsing)** | SiPhox and some competitors let users upload PDF lab results from Quest, Labcorp, etc. Building PDF parsing, OCR, and data normalization for hundreds of lab report formats is a multi-month project with low accuracy and high maintenance. SiPhox's own BiomarkerAI product does this -- no need to rebuild it. | Only display SiPhox results in CULTR's portal. Members with outside labs can use SiPhox's BiomarkerAI tool directly (it's free). |
| **Club tier blood test access** | Club is $0/mo free tier. Blood test kits have real per-unit cost (SiPhox credits, estimated $30-60 wholesale). Giving away tests to free users burns margin with no subscription revenue to offset. PROJECT.md explicitly excludes Club from eligibility. | Blood testing available to Core ($135 add-on), Catalyst+ (included), and Concierge (included) only. Club members see a locked/upgrade messaging card on the labs section. |
| **Real-time sample tracking (GPS/logistics)** | No courier or lab provides real-time GPS tracking of mailed-in blood samples. The sample goes USPS/FedEx in a prepaid envelope. There's no tracking API for "your blood vial is in sorting facility X." | Status-based tracking only: Kit Shipped -> Kit Registered -> Sample Mailed -> Processing -> Results Ready. Show estimated timelines at each step. If SiPhox provides sample-received confirmation via API, surface that as a status update. |

---

## Feature Dependencies

```
Customer Sync (CULTR member -> SiPhox) ────────────────┐
                                                        |
                                                        v
Kit Auto-Order (Catalyst+/Concierge) ──────> Order Status Tracking ──> Results Notification
                                                        ^
Kit Add-On (Core checkout) ─────────────────────────────┘
                                                        |
                                                        v
                                               Kit Registration UI
                                               (validate + register)
                                                        |
                                                        v
                                              Smart Empty States
                                              (per-stage messaging)
                                                        |
                                                        v
                                    ┌───────── Biomarker Results Display ──────────┐
                                    |            (categorized, color-coded)         |
                                    v                      |                       v
                           Reference Range           N/A Display            HIPAA Compliance
                           Visualization           (untested markers)       (cross-cutting)
                                    |
                    ┌───────────────┼───────────────────────────────────┐
                    v               v                                   v
          Category Health    SiPhox Suggestions              Biomarker Detail
          Scores             Display                         Drill-Down
                    |                                               |
                    v                                               v
          Biological Age Card                              PDF Report Download
          (computed from scores)
                    |
                    v
          Biomarker Trend Visualization ────────> Treatment Correlation View
          (requires 2+ reports)                   (Phase 3, requires order history)
                    |
                    v
          Dashboard Summary Widgets
          (aggregates all the above)
```

**Critical path:** Customer Sync -> Kit Ordering -> Kit Registration -> Results Display

Everything downstream of "Biomarker Results Display" can be built incrementally. The ordering/registration pipeline and results display must ship together or the integration has no value.

**Tier-gated access** is orthogonal -- it gates entry to the entire flow, not a specific feature within it.

---

## MVP Recommendation

### Phase 1: Core Pipeline (must ship as a unit)

These features form the complete loop from "subscribe" to "see results." Shipping any subset is incomplete.

1. **SiPhox API client** (`lib/siphox-api.ts`) -- typed client for all endpoints
2. **Customer sync** -- create/lookup SiPhox customer from CULTR member
3. **Kit auto-ordering** -- Stripe webhook triggers SiPhox order for Catalyst+/Concierge
4. **Kit add-on** -- $135 Stripe line item for Core tier checkout
5. **Kit registration UI** -- validate + register kit ID
6. **Order/kit status tracking** -- visual timeline with 7 states
7. **Smart empty states** -- per-stage messaging and CTAs
8. **Biomarker results display** -- categorized, color-coded, 150+ markers
9. **Reference range visualization** -- range bar per marker with position indicator
10. **N/A display** -- grayed-out cards for untested markers
11. **Results notification** -- email when report is complete

### Phase 2: Insights Layer (ship after Phase 1 is stable)

12. **Biological age card** -- wire `BiologicalAgeCard.tsx` to computed score from report data
13. **Category health scores** -- weighted aggregate per body system
14. **SiPhox suggestions display** -- render API suggestions as actionable cards
15. **Biomarker detail drill-down** -- expanded view with description, range, trend
16. **Dashboard summary widgets** -- at-a-glance optimal/attention/improving counts
17. **Tier-gated lab access messaging** -- upgrade CTAs for Club/Core members
18. **PDF report download** -- branded lab report via `@react-pdf/renderer`

### Phase 3: Longitudinal Intelligence (future milestone)

19. **Biomarker trend visualization** -- sparklines and deltas across multiple reports
20. **Treatment correlation view** -- overlay protocol start dates on biomarker trends

### Defer indefinitely:
- Wearable integration (SiPhox's own app handles this)
- AI chatbot for Q&A (liability, engineering cost)
- Third-party lab uploads (SiPhox BiomarkerAI exists)
- Custom reference ranges (clinical validation burden)
- Recurring test subscriptions (separate billing complexity)
- Camera-based barcode scanner (unreliable on web)

---

## Complexity Budget

| Phase | Feature Count | Estimated Effort | Primary Work |
|-------|---------------|-----------------|--------------|
| Phase 1 | 11 features | High (2-3 weeks) | SiPhox API client, Stripe webhook integration, new DB tables/columns, kit registration UI, results display with 150+ markers, status tracking state machine |
| Phase 2 | 7 features | Medium (1-2 weeks) | Mostly UI/visualization using existing component shells (`BiologicalAgeCard`, `BiomarkerTrends`). Scoring algorithm extension. PDF template. |
| Phase 3 | 2 features | High (1-2 weeks) | Historical data storage, cross-system data joins (SiPhox reports x Asher Med orders), timeline overlay visualization |

---

## Competitor Feature Matrix

| Feature | SiPhox (own app) | InsideTracker | Superpower | Function Health | CULTR (planned) |
|---------|-----------------|---------------|------------|-----------------|-----------------|
| Biomarker count | 60+ | 48 | 100+ | 100+ | **150+** (via SiPhox extended panel) |
| Category grouping | Yes | Yes (10 cats) | Yes | Yes | Yes |
| Color-coded status | Yes | Yes (R/Y/G) | Yes | Yes | Yes |
| Reference ranges | Standard | Longevity-optimized | Standard | Standard | Standard (SiPhox) |
| Biological age | No | Yes (InnerAge) | Yes (Bio Age) | No | **Yes** (Phase 2) |
| Trend tracking | Yes | Yes | Yes | Yes | **Yes** (Phase 3) |
| AI suggestions | BiomarkerAI | Action Plan | Chat with data | Clinician notes | **SiPhox suggestions** (Phase 2) |
| Wearable sync | Yes (6+ devices) | Yes (5 devices) | No | No | No (anti-feature) |
| PDF upload | Yes (BiomarkerAI) | No | Yes | No | No (anti-feature) |
| PDF download | Yes | Yes | Unknown | Yes | **Yes** (Phase 2) |
| Treatment correlation | **No** | **No** | **No** | **No** | **Yes** (Phase 3) |
| Integrated telehealth | **No** | **No** | **No** | **No** | **Yes** (core platform) |
| Kit ordering in-app | Yes | Separate | Yes | Yes | **Yes** (auto on checkout) |
| Provider access to results | No | No | No | No | **Future potential** |

**CULTR's moat:** No standalone testing company connects biomarker results to active treatment protocols. SiPhox, InsideTracker, and Superpower have zero treatment data. CULTR has the member's medication history, dosing, and protocol timeline via Asher Med. The treatment correlation view (Phase 3) is where CULTR becomes the only place a member can answer "is my treatment working?" with real data. But this only matters if Phase 1-2 work flawlessly.

---

## Sources

### Primary (HIGH confidence)
- PROJECT.md -- SiPhox API schema, endpoint coverage, tier pricing, biomarker categories, constraints, out-of-scope items
- `components/dashboard/BiologicalAgeCard.tsx` -- Existing component with gauge, sparkline, status messaging, fully implemented UI
- `components/dashboard/BiomarkerTrends.tsx` -- Existing component with sparklines, trend indicators, category grouping, summary stats
- `lib/resilience.ts` -- Biomarker definitions with weights, optimal/acceptable ranges, scoring algorithm, 6 categories

### Market Research (MEDIUM confidence)
- [SiPhox Health Partner FAQ](https://siphoxhealth.com/partner/faq) -- API capabilities, co-branded dashboard vs API, white label tiers
- [SiPhox White Label for Telehealth](https://siphoxhealth.com/articles/how-can-telehealth-companies-add-white-label-blood-testing) -- Integration timeline, implementation process
- [SiPhox BiomarkerAI - Y Combinator](https://www.ycombinator.com/launches/Ljp-siphox-health-biomarkerai-transform-your-pdf-blood-test-results-into-simple-actionable-insights) -- AI analysis features
- [InsideTracker Personal Health Dashboard](https://info.insidetracker.com/personal-health-dashboard) -- 10 healthspan categories, InnerAge, Action Plan
- [Function Health vs Superpower Comparison](https://www.productpep.com/blog/2025/10/7/is-function-health-a-superpower) -- Feature comparison, UX quality assessment
- [Elo Health Blood Biomarker Tests 2026 Review](https://elo.health/blogs/articles/the-best-comprehensive-blood-biomarker-tests-2026-review) -- Market landscape overview
- [Outliyr Best Blood Biomarker Testing 2026](https://outliyr.com/best-blood-biomarker-testing-services) -- 11+ services compared
- [Ultrahuman Blood Vision](https://blog.ultrahuman.com/blog/introducing-blood-vision-with-ultratrace/) -- 100+ biomarkers, AI interpretation features
- [TopFlight Biomarker Tracking App Development](https://topflightapps.com/ideas/biomarker-tracking-app-development/) -- Feature checklist for biomarker apps

### Academic/UX Research (MEDIUM-HIGH confidence)
- [PMC: Patient-Facing Health Data Visualizations](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785326/) -- Systematic review of visualization patterns
- [PMC: Usable Data Visualization for Digital Biomarkers](https://pmc.ncbi.nlm.nih.gov/articles/PMC9719035/) -- Usability analysis
- [UXmatters: Color Psychology in Health Apps](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php) -- Color-coding best practices
- [PMC: Biological Age from Blood Chemistry - BioAge toolkit](https://pmc.ncbi.nlm.nih.gov/articles/PMC8602613/) -- PhenoAge, Klemera-Doubal algorithms
- [Nature: Biological Age Estimation from Blood Biomarkers](https://www.nature.com/articles/s42003-023-05456-z) -- ML approaches for bio-age calculation
