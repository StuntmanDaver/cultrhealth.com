# Healthie + Podium Migration Context

**Gathered:** 2026-03-29  
**Status:** Ready for migration planning  
**Decision:** `Healthie` becomes the clinical system of record, `Podium` becomes the lead/CRM/inbox layer, and the CULTR app stays as the branded member, commerce, and custom integration layer.

<domain>
## Goal

Create a single source-of-truth context document for migrating the current codebase away from the existing Asher + Cal.com + Daily-heavy clinical stack and toward the following target model:

- `Healthie` owns clinical charting, patient/provider records, intake/forms, scheduling, telehealth, secure messaging, and provider-facing workflows.
- `Podium` owns lead capture follow-up, texting, reviews, and front-office CRM / inbox workflows.
- The CULTR app keeps only differentiated surfaces: branded member experience, Stripe membership / commerce, custom peptide catalog logic, SiPhox integration, creator/affiliate tooling, and any proprietary education / dashboards that are still worth owning.

The objective of this migration is to:

- reduce engineering burden
- reduce local PHI / PII duplication
- stop expanding the app into a custom EHR / provider operations product
- preserve the custom surfaces that are actually CULTR's moat

## Non-Goals

- This is **not** the implementation plan.
- This is **not** the cutover runbook.
- This document does **not** assume that SiPhox is replaced.
- This document does **not** assume that all transactional email moves out of the app.

</domain>

<target_model>
## Target Ownership Model

| System | Owns | Should not own |
|---|---|---|
| `Healthie` | patient chart, provider records, intake/forms, scheduling, telehealth, secure clinical messaging, provider permissions, patient documentation | marketing CRM, creator attribution, brand site, affiliate operations |
| `Podium` | top-of-funnel leads, shared inbox, lead-response texting, review acquisition, pre-clinical communication | chart data, intake answers, labs, prescriptions, clinical notes |
| `CULTR app` | marketing site, Stripe checkout, memberships, custom peptide catalog logic, SiPhox integration, member dashboard UX, creator/affiliate engine, admin analytics | custom provider portal, custom telehealth infrastructure, local PHI-first charting workflows |
| `Postgres` | auth/session data, memberships, creator/business data, minimal external ID linkage, app-owned commerce state | raw clinical records that Healthie already stores, duplicate chart/intake/document copies when avoidable |

</target_model>

<guardrails>
## Migration Guardrails

- Do **not** add new provider-facing clinical workflows to the app while this migration is being planned.
- Keep `Podium` on the **pre-clinical** side of the boundary unless a specific BAA-backed use case is deliberately approved.
- Prefer **fetching** clinical data from Healthie over persisting new local copies.
- Treat the current app as an orchestration and experience layer, not the chart of record.
- Avoid reintroducing vendor-specific schema churn if possible. The codebase already contains a historical vendor migration (`migrations/012_drop_healthie_columns.sql`) that renamed `healthie_patient_id` to `asher_patient_id`.
- Strongly prefer a **generic external identity strategy** for any new migration fields, or document clearly why a vendor-specific field is still acceptable.

</guardrails>

<current_state>
## Current State Inventory

### 1. Clinical / Provider Stack

The app currently implements a custom provider workspace under `app/provider/**` backed by bespoke APIs in `app/api/provider/**`.

Current characteristics:

- Provider access is email-allowlist based through `isProviderEmail()` in `lib/auth.ts`, not true vendor-managed RBAC.
- Provider UI includes a dashboard, patient list/detail, consultations list/detail, and protocol builder.
- Provider APIs aggregate data from local Postgres tables including `memberships`, `pending_intakes`, `asher_orders`, and `consult_requests`.
- Member consultations are orchestrated through **Cal.com** booking + **Daily.co** video / recordings + local webhook handling + S3 recording archival.
- Intake and renewal fulfillment are sent to **Asher Med** through `lib/asher-med-api.ts`.
- Clinical identity is spread across `memberships`, `orders`, `portal_sessions`, `protocol_generations`, and related tables through `asher_patient_id`.

Primary files:

- `app/provider/layout.tsx`
- `app/provider/ProviderDashboardClient.tsx`
- `app/provider/patients/ProviderPatientsClient.tsx`
- `app/provider/patients/[id]/ProviderPatientDetailClient.tsx`
- `app/provider/consultations/ProviderConsultationsClient.tsx`
- `app/provider/consultations/[id]/ProviderConsultationClient.tsx`
- `app/provider/protocol-builder/page.tsx`
- `app/provider/protocol-builder/ProtocolBuilderClient.tsx`
- `components/provider/ProviderLayoutClient.tsx`
- `components/provider/ProviderSidebar.tsx`
- `components/consultations/ProviderNotesForm.tsx`
- `app/api/provider/dashboard/route.ts`
- `app/api/provider/patients/route.ts`
- `app/api/provider/patients/[id]/route.ts`
- `app/api/provider/consultations/route.ts`
- `app/api/provider/consultations/[id]/complete/route.ts`
- `app/api/provider/intakes/route.ts`
- `app/api/consultations/book/route.ts`
- `app/api/consultations/[id]/route.ts`
- `app/api/consultations/[id]/cancel/route.ts`
- `app/api/consultations/[id]/notes/route.ts`
- `app/api/webhook/calcom/route.ts`
- `app/api/webhook/daily/route.ts`
- `lib/consultations-db.ts`
- `lib/cal.ts`
- `lib/daily.ts`
- `components/consultations/BookingEmbed.tsx`
- `components/consultations/VideoRoom.tsx`
- `app/members/consultations/BookingPageClient.tsx`
- `app/members/consultations/[id]/ConsultationRoomClient.tsx`

### 2. Member / Labs / Catalog Stack

The app already contains a strong custom member surface and a meaningful custom domain layer that should not be discarded casually.

Current characteristics:

- Member clinical APIs merge local Postgres state with live Asher calls.
- Portal APIs mirror some of the same clinical data through the phone-OTP portal surface.
- SiPhox is a separate custom integration with its own DB tables, fulfillment logic, cron jobs, and processed-report presentation layer.
- The peptide / supplement / product catalog is internally defined and only partially mapped to Asher, which is one of the main reasons for the vendor change.
- Stripe memberships, product checkout, and creator attribution are all deeply integrated and should remain app-owned.

Primary files:

- `app/api/member/profile/route.ts`
- `app/api/member/medical-records/route.ts`
- `app/api/member/orders/route.ts`
- `app/api/member/files/route.ts`
- `app/api/member/consult-history/route.ts`
- `app/api/member/labs/route.ts`
- `app/api/member/labs/validate/route.ts`
- `app/api/member/results/route.ts`
- `app/api/member/consult-request/route.ts`
- `app/api/portal/profile/route.ts`
- `app/api/portal/orders/route.ts`
- `app/api/portal/orders/[id]/route.ts`
- `app/api/portal/documents/route.ts`
- `app/api/portal/prefill/route.ts`
- `app/api/portal/labs/route.ts`
- `app/api/portal/labs/validate/route.ts`
- `app/api/portal/results/route.ts`
- `app/api/intake/submit/route.ts`
- `app/api/intake/upload/route.ts`
- `app/api/intake/questions/route.ts`
- `app/api/renewal/check/route.ts`
- `app/api/renewal/submit/route.ts`
- `app/api/webhook/stripe/route.ts`
- `lib/asher-med-api.ts`
- `lib/config/asher-med.ts`
- `lib/config/product-to-asher-mapping.ts`
- `lib/config/product-catalog.ts`
- `lib/config/products.ts`
- `lib/siphox/client.ts`
- `lib/siphox/db.ts`
- `lib/siphox/reports.ts`
- `lib/siphox/fulfillment.ts`
- `lib/siphox/biomarkers.ts`
- `lib/portal-prefill.ts`
- `lib/portal-orders.ts`
- `lib/portal-db.ts`

### 3. CRM / Growth / Communications Stack

The app does **not** currently contain a true CRM / inbox product. It has a mix of waitlist capture, founder notification emails, Mailchimp tagging, Resend transactional flows, and GA tracking.

Current characteristics:

- Waitlist capture is handled by `app/api/waitlist/route.ts`.
- Waitlist and quote flows route to founder / support email rather than a shared customer conversation system.
- Mailchimp is used as a lightweight contact / tag sync layer, mainly tied to subscriptions, intake completion, and lab lifecycle tags.
- Resend is the universal transactional email layer.
- There is no Podium, HubSpot, Intercom, or HubSpot-like inbox currently in the repo.

Primary files:

- `app/api/waitlist/route.ts`
- `components/site/CTASection.tsx`
- `components/site/ClubBanner.tsx`
- `components/site/LeadCapturePrompt.tsx`
- `app/api/quote/route.ts`
- `lib/mailchimp.ts`
- `lib/resend.ts`
- `lib/analytics.ts`
- `app/api/admin/analytics/route.ts`
- `app/api/club/signup/route.ts`
- `app/api/club/orders/route.ts`
- `app/api/creators/support/tickets/route.ts`

</current_state>

<code_inventory>
## File and Subsystem Migration Inventory

### A. Retire After Healthie Cutover

These files represent custom clinical/provider orchestration that should disappear once Healthie owns those responsibilities.

| Path | Current role | Target action |
|---|---|---|
| `app/provider/layout.tsx` | provider auth gate and layout wrapper | retire |
| `app/provider/ProviderDashboardClient.tsx` | custom provider dashboard | retire |
| `app/provider/page.tsx` | provider landing route | retire |
| `app/provider/patients/ProviderPatientsClient.tsx` | custom patient roster | retire |
| `app/provider/patients/[id]/ProviderPatientDetailClient.tsx` | custom patient detail / chart-lite | retire |
| `app/provider/patients/page.tsx` | provider patient page | retire |
| `app/provider/patients/[id]/page.tsx` | provider patient detail page | retire |
| `app/provider/consultations/ProviderConsultationsClient.tsx` | custom consultations list | retire |
| `app/provider/consultations/[id]/ProviderConsultationClient.tsx` | custom consultation detail | retire |
| `app/provider/consultations/page.tsx` | provider consultations page | retire |
| `app/provider/consultations/[id]/page.tsx` | provider consultation detail page | retire if present at cutover |
| `components/provider/ProviderLayoutClient.tsx` | provider app chrome | retire |
| `components/provider/ProviderSidebar.tsx` | provider navigation | retire |
| `components/consultations/ProviderNotesForm.tsx` | local provider note editing | retire or rewrite only if kept as custom overlay |
| `app/api/provider/dashboard/route.ts` | provider metrics aggregation | retire |
| `app/api/provider/patients/route.ts` | provider patient roster API | retire |
| `app/api/provider/patients/[id]/route.ts` | provider patient detail API | retire |
| `app/api/provider/consultations/route.ts` | provider consultation list API | retire |
| `app/api/provider/consultations/[id]/complete/route.ts` | provider consultation lifecycle API | retire |
| `app/api/provider/intakes/route.ts` | provider intake queue API | retire |
| `lib/consultations-db.ts` | local consultations persistence abstraction | retire or radically shrink |
| `lib/cal.ts` | Cal.com API / webhook verification client | retire |
| `lib/daily.ts` | Daily.co room / recording integration | retire |
| `app/api/webhook/calcom/route.ts` | Cal.com booking webhook | retire |
| `app/api/webhook/daily/route.ts` | Daily recording / meeting webhook | retire |
| `components/consultations/BookingEmbed.tsx` | Cal.com iframe embed | retire |
| `components/consultations/VideoRoom.tsx` | Daily.co video room wrapper | retire |
| `app/members/consultations/BookingPageClient.tsx` | custom booking surface | retire or replace with Healthie booking UX |
| `app/members/consultations/[id]/ConsultationRoomClient.tsx` | member room join client | retire or replace with Healthie telehealth UX |
| `app/api/consultations/book/route.ts` | custom plan-tier booking eligibility + Cal slug | retire or rewrite at app boundary only |
| `app/api/consultations/[id]/route.ts` | consultation room token / metadata API | retire |
| `app/api/consultations/[id]/cancel/route.ts` | custom consultation cancel API | retire |
| `app/api/consultations/[id]/notes/route.ts` | local consultation notes API | retire |
| `lib/config/consultations.ts` | Cal/Daily-centric consultation config | retire or reduce to app-tier eligibility only |
| `migrations/010_consult_requests.sql` | local consultations schema | legacy after cutover |
| `migrations/029_telehealth_consultations.sql` | Cal/Daily columns | legacy after cutover |

### B. Rewire to Healthie

These files should remain in the codebase, but their external dependency boundary must move from Asher / local chart storage to Healthie.

| Path | Current role | Target action |
|---|---|---|
| `lib/auth.ts` | app auth + provider allowlist helpers | remove provider allowlist logic; keep member/admin/creator auth |
| `app/api/intake/submit/route.ts` | builds `AsherNewOrderRequest`, updates `pending_intakes`, inserts `asher_orders` | rewrite to create/update Healthie patient, forms, chart context, and downstream fulfillment trigger |
| `app/api/intake/upload/route.ts` | Asher presigned uploads | replace with Healthie document upload or eliminate if Healthie forms own files |
| `app/api/intake/questions/route.ts` | Asher-backed intake questions | replace with Healthie-backed form metadata or app-owned form schema |
| `app/api/renewal/check/route.ts` | renewal lookup using current fulfillment assumptions | rewire to Healthie / new prescribing boundary |
| `app/api/renewal/submit/route.ts` | renewal fulfillment via Asher | rewrite to Healthie / new prescribing boundary |
| `app/api/member/profile/route.ts` | merges local data with Asher patient profile | fetch clinical profile from Healthie, keep app-owned membership/commercial fields local |
| `app/api/member/medical-records/route.ts` | sanitized `pending_intakes` + Asher enrichment | move chart/clinical record source to Healthie |
| `app/api/member/orders/route.ts` | local `asher_orders` + live Asher orders | replace with Healthie or downstream fulfillment adapter |
| `app/api/member/files/route.ts` | Asher presigned file previews | replace with Healthie docs or app-owned attachments strategy |
| `app/api/member/consult-history/route.ts` | local consultations + order-derived consults | point to Healthie appointment / visit history |
| `app/api/member/consult-request/route.ts` | local consult request insert + Resend | decide whether Healthie scheduling subsumes this |
| `app/api/portal/profile/route.ts` | phone-OTP clinical profile via Asher | rewire to Healthie or collapse portal/member duplication |
| `app/api/portal/orders/route.ts` | portal order history via Asher | rewire to Healthie / new fulfillment source |
| `app/api/portal/orders/[id]/route.ts` | portal order detail | rewire |
| `app/api/portal/documents/route.ts` | Asher document preview/list | rewire |
| `app/api/portal/prefill/route.ts` | intake / renewal prefill from Asher + local orders | rewire to Healthie and/or simplify if forms are Healthie-native |
| `app/api/protocol/generate/route.ts` | validates patient via Asher, stores `asher_patient_id` | rewire to Healthie patient identity |
| `app/provider/protocol-builder/page.tsx` | exposes custom protocol builder inside provider shell | keep feature, but move out of retiring provider shell and rewire access / identity assumptions |
| `app/provider/protocol-builder/ProtocolBuilderClient.tsx` | custom protocol builder UI | keep custom, but rewire patient lookup / save flows to Healthie-backed identity and new internal access model |
| `app/api/webhook/stripe/route.ts` | membership creation tied to `asher_patient_id` lookup and Asher lifecycle assumptions | remove Asher lookup, rework post-checkout patient creation/linking |
| `lib/asher-med-api.ts` | Asher client used all across app | retire and replace with Healthie adapter plus separate fulfillment adapter if needed |
| `lib/config/asher-med.ts` | Asher medication config | retire |
| `lib/config/product-to-asher-mapping.ts` | internal SKU to Asher medication mapping | replace with new fulfillment / prescribing mapping, not with deletion of the pattern |
| `lib/portal-prefill.ts` | Asher-centric prefill shaping | rewire |
| `lib/portal-orders.ts` | Asher-centric portal order shaping | rewire |
| `lib/portal-db.ts` | portal linkage to Asher identity in some flows | rewire or simplify |
| `app/api/cron/asher-sync/route.ts` | syncs Asher to local DB | retire after data cutover |
| `app/api/admin/asher-dashboard/route.ts` | admin view over Asher-based state | retire or replace with Healthie/admin migration reporting |
| `app/api/admin/intakes/route.ts` | admin intake review over `pending_intakes` / `asher_orders` | retire or rewrite if admin still needs non-Healthie queue |
| `app/admin/intakes/IntakeViewerClient.tsx` | admin intake viewer | retire or rewrite depending on admin UX decision |

### C. Rewire or Integrate with Podium

These files are the current lead / inquiry surfaces most likely to integrate with Podium.

| Path | Current role | Target action |
|---|---|---|
| `app/api/waitlist/route.ts` | lead capture + founder notification email | dual-write to Podium first, then decide whether local waitlist DB remains source of truth |
| `components/site/CTASection.tsx` | newsletter / lead form submitter | point to Podium-backed flow or keep app form + Podium sync |
| `components/site/ClubBanner.tsx` | lead capture surface | same as above |
| `components/site/LeadCapturePrompt.tsx` | lead capture surface | same as above |
| `app/api/quote/route.ts` | quote request notification | route into Podium inbox / workflow instead of founder-only email |
| `lib/mailchimp.ts` | lightweight CRM / tagging layer | decide whether Podium augments or replaces Mailchimp for top-of-funnel and lifecycle tagging |
| `app/api/club/signup/route.ts` | club signup + Mailchimp tags | review against Podium ownership |
| `app/api/club/orders/route.ts` | club order + Mailchimp tags | review against Podium ownership |
| `app/api/creators/support/tickets/route.ts` | support via Resend email | optional Podium shared inbox candidate if support centralizes there |

### D. Keep Custom in the App

These are the high-value areas that should remain app-owned even after the migration.

| Path / subsystem | Why it stays custom |
|---|---|
| `lib/config/product-catalog.ts` | custom peptide / supplement catalog and business logic |
| `lib/config/products.ts` | marketing product / tier representation |
| `app/api/checkout/**` | Stripe checkout and product purchasing remain core app capabilities |
| `app/api/webhook/stripe/route.ts` | Stripe is still the commercial system of record, even after its clinical side is rewired |
| `lib/db.ts` memberships / creator / analytics areas | business state, not chart-of-record clinical state |
| `lib/siphox/**` | unique labs integration and proprietary processing layer |
| `lib/protocol-templates.ts` and protocol-builder logic | custom protocol-generation / care design logic that is specific to CULTR |
| `app/api/member/labs/**`, `app/api/member/results/route.ts` | custom labs UX, unless a later decision fully replaces it |
| `app/api/portal/labs/**`, `app/api/portal/results/route.ts` | same as above, pending auth model simplification |
| `lib/lmn/**` and LMN-related checkout/order flows | custom business process |
| creator / attribution stack under `lib/creators/**`, `app/api/track/**`, `app/creators/**`, `app/admin/creators/**` | revenue engine and growth moat |
| marketing site under `app/**`, `components/site/**`, content in `content/**` | brand and acquisition moat |

</code_inventory>

<data_inventory>
## Data, Schema, and Environment Impact

### Tables and Columns Tightly Coupled to the Current Clinical Stack

| Table / column family | Current role | Migration note |
|---|---|---|
| `pending_intakes` | raw pre-submission / post-submission intake state in local DB | should stop being the long-term clinical source of truth |
| `pending_intakes.intake_data` | large PHI-bearing JSONB payload | reduce or eliminate long-term local storage where Healthie already stores equivalent data |
| `asher_orders` | local mirror of Asher order state | retire or replace with new fulfillment boundary |
| `asher_uploaded_files` | local document references for Asher uploads | retire or replace |
| `asher_sync_cache` | sync helper cache | retire |
| `consult_requests` | local appointment / consult lifecycle | retire after Healthie scheduling cutover |
| `consultation_notes` | local provider notes | retire after Healthie charting cutover |
| `consultation_recordings` | local Daily recording metadata + S3 linkage | retire after telehealth cutover |
| `consultation_webhook_events` | webhook idempotency for Cal/Daily | retire or repurpose if Healthie webhooks are persisted similarly |
| `memberships.asher_patient_id` | external clinical identity reference | replace with new strategy |
| `orders.asher_patient_id` | external clinical identity reference | replace with new strategy |
| `portal_sessions.asher_patient_id` | portal auth linkage | replace with new strategy |
| `protocol_generations.asher_patient_id` | protocol history keyed to Asher | replace with new strategy |
| `daily_logs.asher_patient_id` | historical renamed external patient reference | decide whether to generalize or remap |
| `biomarker_entries.asher_patient_id` | historical renamed external patient reference | decide whether to generalize or remap |
| `protocol_outcomes.asher_patient_id` | historical renamed external patient reference | decide whether to generalize or remap |
| `resilience_scores.asher_patient_id` | historical renamed external patient reference | decide whether to generalize or remap |
| `siphox_customers`, `siphox_kit_orders`, `siphox_reports` | custom labs data model | keep unless SiPhox itself is replaced; still consider tighter PHI minimization |

### Historical Migration Note

`migrations/012_drop_healthie_columns.sql` proves the codebase already performed a Healthie-to-Asher migration once:

- `healthie_patient_id` was copied into `asher_patient_id`
- Healthie columns were dropped from multiple tables
- `protocol_generations.patient_healthie_id` was renamed into an Asher-oriented model

Implications:

- this migration is **not** a greenfield Healthie integration
- old naming assumptions may exist in docs, tests, or mental models
- blindly reintroducing `healthie_patient_id` fields without a broader identity strategy will repeat the same vendor-specific schema churn

### Environment Variables

| Category | Variables | Migration direction |
|---|---|---|
| Asher | `ASHER_MED_API_KEY`, `ASHER_MED_API_URL`, `ASHER_MED_PARTNER_ID`, `ASHER_MED_ENVIRONMENT` | retire after cutover |
| Cal.com | `CALCOM_API_KEY`, `CALCOM_WEBHOOK_SECRET`, `NEXT_PUBLIC_CALCOM_ORG_SLUG` | retire after cutover |
| Daily.co | `DAILY_API_KEY`, `DAILY_WEBHOOK_SECRET` | retire after cutover |
| recording S3 | `CONSULTATION_S3_BUCKET`, `CONSULTATION_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | retire if Healthie owns recordings; keep only if app still archives media |
| provider allowlist | `PROTOCOL_BUILDER_ALLOWED_EMAILS` | retire when provider auth moves into Healthie |
| current keepers | `STRIPE_*`, `POSTGRES_URL`, `JWT_SECRET`, `SESSION_SECRET`, `RESEND_API_KEY`, `SIPHOX_API_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_*` | mostly keep |
| new expected additions | Healthie API keys / webhook secrets / org IDs; Podium API/webhook/config values | add during execution planning |

### PHI / PII Boundary Notes

- `app/api/waitlist/route.ts` currently logs lead submissions including `treatment_reason`; this is care-adjacent and should be reviewed before Podium cutover.
- `lib/mailchimp.ts` currently receives lifecycle tags such as `intake-complete` and `labs-results-ready`; decide deliberately whether those remain outside the clinical boundary.
- `lib/resend.ts` contains both purely operational emails and care-adjacent emails (consultation, labs, post-visit, shipping). Podium should not absorb those by default.

</data_inventory>

<test_inventory>
## Current Test Surface Tied to This Migration

The migration will require test cleanup and replacement in addition to application code changes.

Important current tests and suites:

- `tests/integration/intake-submission-e2e.test.ts`
- `tests/api/protocol-generate.test.ts`
- `tests/api/portal-orders.test.ts`
- `tests/api/portal-order-detail.test.ts`
- `tests/api/portal-prefill.test.ts`
- `tests/api/portal-documents.test.ts`
- `tests/lib/portal-orders.test.ts`
- `tests/lib/portal-prefill.test.ts`
- `tests/lib/portal-db.test.ts`
- `tests/lib/mailchimp.test.ts`
- `tests/lib/siphox-client.test.ts`
- `tests/lib/siphox-db.test.ts`
- `tests/lib/siphox-fulfillment.test.ts`
- `tests/api/cron-siphox-fulfillment.test.ts`
- `tests/api/portal-labs.test.ts`
- `tests/api/portal-labs-validate.test.ts`
- `tests/api/portal-results.test.ts`
- `tests/components/LabsClient.test.tsx`
- `tests/components/LabsResultsView.test.tsx`

Test strategy implications:

- all Asher-specific tests will need replacement or deletion
- all Cal/Daily telehealth tests will need replacement or deletion
- SiPhox tests likely stay but may need identity / linking updates
- new Healthie adapter boundaries should get focused integration tests instead of duplicating Healthie UI behavior
- Podium integration should be tested as event routing and state transitions, not as an inbox product clone

</test_inventory>

<sequencing>
## Sequencing Constraints

1. **Identity first**
   - Define the future patient / provider identity model before touching routing or UI.
   - Decide whether new fields are vendor-specific (`healthie_patient_id`) or generic (`clinical_patient_id`, `ehr_patient_id`, etc.).

2. **Clinical source-of-truth cutover**
   - Re-point intake, patient creation, and renewal flows to Healthie before retiring Asher reads.
   - Do not delete `asher_patient_id` or local clinical APIs until Healthie writes and reads are proven in staging.

3. **Scheduling / telehealth cutover**
   - Healthie scheduling and telehealth must replace Cal.com and Daily before removing `consult_requests` and room flows.
   - Historical recordings and appointment history need an explicit archival decision.

4. **Member API simplification**
   - Rewire member and portal APIs after Healthie is authoritative for patient / appointment data.
   - Collapse duplicated member vs portal clinical APIs where possible.

5. **Podium dual-write period**
   - Introduce Podium to waitlist / quote / lead routing first.
   - Keep local DB + current notifications until lead routing, ownership, and analytics are validated.

6. **Decommissioning**
   - Only after successful read/write cutover: remove Asher client, cron sync, Cal/Daily webhooks, provider portal, and vendor-specific env vars.

</sequencing>

<open_questions>
## Open Questions to Resolve Before Execution

### Healthie Boundary

- Will Healthie also own document uploads, or will some file flows remain app-owned?
- Will Healthie own all scheduling / telehealth, or does the app keep any plan-tier gating logic ahead of booking?
- How will external providers be modeled in Healthie, and does that remove the need for any provider UI in this app?
- Does Healthie become the canonical place for patient-facing clinical history, or will the app still render a branded member clinical summary by API?

### Podium Boundary

- Is Podium replacing only top-of-funnel lead routing, or also some non-clinical member communications?
- Does Mailchimp remain for nurture / lifecycle campaigns, or is Podium intended to replace it?
- Which operational notifications continue in Resend, and which should become Podium conversations or automations?

### Fulfillment / Catalog

- What is the replacement for Asher's prescribing / order fulfillment boundary for the parts of the peptide catalog Asher could not support?
- Does Healthie only own the chart and provider workflow, while a separate pharmacy / fulfillment adapter remains app-owned?
- Which custom peptide rules remain policy logic in the app even after Healthie adoption?

### SiPhox

- Does SiPhox remain a first-class custom integration with results surfaced in the app, or are results pushed into Healthie and merely displayed there?
- If results remain cached in Postgres, what data minimization and retention rules should apply?

### Historical Data

- Which historical Asher orders, intake records, consultations, and recordings must be migrated vs archived vs left read-only?
- Should the app support a temporary historical "legacy records" mode during the cutover window?

</open_questions>

<recommendation>
## Recommended Migration Posture

- Freeze custom provider feature work immediately.
- Treat this as a **boundary migration**, not a like-for-like vendor swap.
- Keep the branded member experience, commerce, custom catalog, and SiPhox value layer in the app.
- Push clinical workflows and PHI-heavy records into Healthie.
- Keep Podium at the lead / front-office boundary until a deliberate decision expands it.
- Prefer generic linkage fields and adapter layers over a new round of hard-coded vendor naming.

</recommendation>

---

*Context gathered: 2026-03-29*  
*Primary decision: `Healthie + Podium + thin custom CULTR layer`*  
*This document is context, not the phased execution plan.*
