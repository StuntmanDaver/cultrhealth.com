---
name: healthie-api
description: Use when integrating or calling the Healthie EHR/EMR GraphQL API — creating clients, scheduling appointments, submitting form answers, uploading documents, verifying webhooks, or any code that touches `HEALTHIE_API_KEY`, `healthieRequest`, `HealthieApiError`, or any file in `lib/healthie/`. NOTE: Healthie auth is `Authorization: Basic <KEY>` + `AuthorizationSource: API` — NOT Bearer. JWT-trained sessions assume Bearer; that returns 401.
---

# Healthie EHR/EMR GraphQL API

## Overview

Healthie is an EHR/EMR platform for clinics. CULTR uses Healthie's GraphQL API for client (patient) records, appointment scheduling, form answer groups (intake/labs/biomarkers), and document storage (lab PDFs). All requests go to a single `/graphql` endpoint via POST.

- **Staging URL:** `https://staging-api.gethealthie.com/graphql`
- **Production URL:** `https://api.gethealthie.com/graphql`
- **Rate limits:** 250 RPS, 100 sign-ins/min
- **Auth:** `Authorization: Basic <API_KEY>` **plus** `AuthorizationSource: API` — BOTH headers required
- **Webhook signature scheme:** RFC 9421 HTTP Message Signatures with HMAC-SHA256
- **Realtime:** Rails ActionCable (NOT graphql-ws — see Gotcha #8)

### Environment variables

- `HEALTHIE_API_KEY` — server-only API key. Used as `Basic <KEY>`, NOT Bearer. Never expose to the client.
- `HEALTHIE_API_URL` — endpoint URL. **Defaults to staging** (`https://staging-api.gethealthie.com/graphql`); production deploys MUST set this explicitly to `https://api.gethealthie.com/graphql`.
- `HEALTHIE_WEBHOOK_SECRET` — HMAC shared secret used as the RFC 9421 signature key. Required for webhook verification.

### Current state

As of 2026-05-01, the API key has NOT been enabled on CULTR's Healthie Plus plan. The integration is **code-ready and latent**:

- All `lib/healthie/*` modules return `null` (graceful no-op) when `HEALTHIE_API_KEY` is unset — see `isHealthieConfigured()` in `lib/healthie/client.ts:21`.
- Calendly is the **active** scheduler today; Healthie scheduling mutations exist (`createAppointment`) and are queued to switch on once the key is provisioned.
- The `app/api/webhook/healthie/` route is live and verifies signatures; the Phase 8 dispatcher will route events to subscription/lifecycle handlers.

## Gotchas — read these first

1. **Auth is `Basic`, NOT `Bearer`. AND a second header is required.** Both:
   ```
   Authorization: Basic <HEALTHIE_API_KEY>
   AuthorizationSource: API
   ```
   Anything else returns 401. The API key value goes directly after `Basic ` — do **NOT** base64-encode it (it's already in API-key form, not username:password). JWT-trained sessions reflexively reach for `Bearer ${apiKey}` — that returns 401. The `healthieRequest` wrapper in `lib/healthie/client.ts:67-68` already handles this; never bypass it with raw `fetch()`. Source: `lib/healthie/client.ts:63-72`.

2. **Webhooks use RFC 9421 (HTTP Message Signatures), not raw HMAC-SHA256.** Three headers — `Content-Digest`, `Signature-Input`, `Signature` — must be combined per RFC 9421 to compute the signature base string. `lib/healthie/webhooks.ts` already implements this; do **not** roll a new HMAC routine. Read the raw body via `request.text()` BEFORE any other body access; Next.js consumes the body on first read, and `request.json()` after `request.text()` returns empty.

3. **`timingSafeEqual` requires equal-length buffers.** Always check `providedBuf.length === secretBuf.length` first; mismatched lengths throw `TypeError: Input buffers must have the same length`. The repo's helper does this guard at both `lib/healthie/webhooks.ts:59` (local-dev fallback) and `lib/healthie/webhooks.ts:138` (HMAC path). Forgetting the guard turns a silent rejection into a 500.

4. **GraphQL mutations return nested under the mutation name.** Pattern: `{ data: { createClient: { user: {...} } } }`. The `healthieRequest` wrapper takes a `resultKey` parameter — pass the mutation name (e.g. `'createClient'`), and the wrapper extracts `result.user` from the inner payload. Wrap your Zod schema accordingly:
   ```typescript
   const CreateClientPayload = z.object({
     user: HealthieUserSchema,
   }).passthrough()
   ```
   Source: `lib/healthie/mutations.ts:28-43`.

5. **`isHealthieConfigured()` graceful no-op pattern.** All Healthie callers (`ensureHealthiePatient`, `pushLabResultsToHealthie`, etc.) check `isHealthieConfigured()` first and return `null` (NOT throw) if `HEALTHIE_API_KEY` is unset. This lets the v2.0 cutover work even before Healthie's API key is provisioned. Do NOT throw on missing env in integration callers — the absence of a key is a legitimate runtime state during the staging→prod rollout.

6. **HIPAA log discipline.** Log only error messages and Zod issue paths — never variable values, response bodies, or patient data. The wrapper in `lib/healthie/client.ts` enforces this:
   ```typescript
   console.error('Healthie GraphQL errors:', json.errors.map(e => e.message))
   console.error('Healthie response validation failed:', parsed.error.issues.map(i => ({
     path: i.path, code: i.code, message: i.message,
   })))
   ```
   Skill consumers MUST follow this pattern. CULTR is HIPAA-compliant and the dev `code-audit.sh` hook scans for `console.log` near patient identifiers; lapses block the commit.

7. **Always pass `skipped_email: true` when creating clients via API.** CULTR sends its own welcome email; if you don't suppress, members receive a duplicate "Welcome to Healthie" email. Source: `lib/healthie/patient-sync.ts:34`. The `createClient` mutation also accepts `dont_send_welcome` — passing `skipped_email: true` is the canonical CULTR pattern.

8. **Subscriptions use ActionCable, NOT graphql-ws.** If a future feature needs realtime (e.g., conversation messages), Healthie's WebSocket protocol is Rails ActionCable — `graphql-ws` and `subscriptions-transport-ws` clients won't connect. Most server-to-server work uses webhooks instead, which is the recommended path. Reach for ActionCable only when you need browser-pushed in-app updates.

9. **Default `HEALTHIE_API_URL` points to STAGING.** Without an explicit env value, code hits `https://staging-api.gethealthie.com/graphql`. Production deploys MUST set `HEALTHIE_API_URL=https://api.gethealthie.com/graphql` explicitly; do not assume the prod env defaults correctly. Source: `lib/healthie/client.ts:18`.

10. **30-second client timeout.** `healthieRequest` aborts after 30s via `AbortController`. Long-running mutations (e.g., bulk form imports, large document uploads) need either a custom timeout wrapper or a job-queue pattern; do **not** block a webhook handler on a 60s+ Healthie call — Vercel functions cap function-duration well before that. Source: `lib/healthie/client.ts:59-60`.

## Quick reference — operations

The operations in this table are the ones currently exported from `lib/healthie/mutations.ts` and `lib/healthie/queries.ts`. When adding new operations, add them here too so the skill stays in sync.

| Operation | Type | Purpose |
|---|---|---|
| `createClient` | mutation | Create a new patient (User) record. Always pass `skipped_email: true`. Returns `{ user }`. |
| `createAppointment` | mutation | Schedule an appointment for a `user_id` with `appointment_type_id`, `datetime`, `contact_type` (e.g. video), optional `external_videochat_url`. Returns `{ appointment }`. |
| `createFormAnswerGroup` | mutation | Submit form answers (intake/labs/biomarker payloads) tied to a `custom_module_form_id` and `user_id`. Returns `{ form_answer_group }`. |
| `createDocument` | mutation | Upload a document (PDF/file) to a patient via `file_string` (base64) — used by `pushLabResultsToHealthie` for SiPhox reports. Returns `{ document }`. |
| `user` | query | Look up a single patient by `id`. Returns `HealthieUser`. |
| `users` | query | Fuzzy search patients by `keywords` (used internally by `getClientByEmail` to filter to exact email match). |
| `appointment` | query | Single appointment by `id`. |
| `appointments` | query | List appointments by `user_id` with optional `filter` string. |
| `formAnswerGroup` | query | Single form answer group by `id`, including the linked `user.email`. |
| `document` | query | Single document by `id`. |
| `documents` | query | List documents by `rel_user_id`. |

For raw queries that return simple/dynamic shapes (e.g., delete operations), use `healthieRawRequest` from `lib/healthie/client.ts:125` — it skips Zod validation. Use sparingly.

## Webhook verification

Healthie signs every webhook delivery using **RFC 9421 HTTP Message Signatures** with HMAC-SHA256. The route handler at `app/api/webhook/healthie/route.ts` MUST verify the signature before parsing the body.

**Three required headers from Healthie:**

- `Content-Digest: sha-256=:<base64-hash>:` — SHA-256 hash of the raw body
- `Signature-Input: sig1=("@method" "@path" "@query" "content-digest" "content-type" "content-length");created=<ts>;keyid="..."` — the signature parameter list
- `Signature: sig1=:<base64-hmac>:` — the HMAC-SHA256 signature itself

**Verification flow (use these helpers from `lib/healthie/webhooks.ts`):**

1. `const rawBody = await readWebhookBody(request)` — must be the FIRST body read; reading via `request.json()` first will leave `request.text()` empty.
2. `const verified = verifyHealthieWebhook(request, rawBody)` — performs RFC 9421 verification (see `lib/healthie/webhooks.ts:33-67`). Verifies Content-Digest matches the body, builds the signature base string from Signature-Input components, computes HMAC-SHA256, length-checks against the Signature header.
3. `if (!verified) return new Response('invalid signature', { status: 401 })` — fail closed.
4. `const event = parseWebhookBody(rawBody)` — only after verification succeeds; returns the typed `HealthieWebhookEvent` shape (`event_type`, `resource_id`, `resource_id_type`, `changed_fields`).

**Local-dev fallback (gated to non-prod only):** If Healthie does not send signature headers (e.g., a manual `curl` test from a developer), `verifyHealthieWebhook` falls back to a shared-secret check via query param `?secret=<HEALTHIE_WEBHOOK_SECRET>` or header `x-healthie-webhook-secret`. The comparison uses length-checked `timingSafeEqual`. **NEVER** ship this fallback enabled in production. Gate any test paths on `process.env.NODE_ENV !== 'production'` if you wire alternative verification.

## When implementing a new Healthie call

1. **Use `healthieRequest()` from `lib/healthie/client.ts`.** Don't `fetch()` Healthie's GraphQL endpoint directly — you'll forget the AuthorizationSource header (Gotcha #1).
2. **Define a Zod schema for the response shape.** Healthie returns nested objects; the schema gates Zod-validates each shape and blocks shape drift. Match the GraphQL mutation/query nesting (e.g. `z.object({ user: HealthieUserSchema }).passthrough()` for `createClient` — see Gotcha #4).
3. **Pass the `resultKey` parameter.** It must match the top-level GraphQL field name (e.g. `'createClient'` for `mutation { createClient(...) { user { ... } } }`). The wrapper extracts `data[resultKey]` and Zod-validates it.
4. **Handle `HealthieApiError` explicitly.** Three failure modes: HTTP error (`statusCode` populated), GraphQL `errors[]` (`graphqlErrors` populated), validation failure (just `message`). Surface a useful message to admin UI; never re-throw raw — the user sees an opaque 500.
5. **Log without PHI.** Names, DOB, email, address, biomarker values, and form answers are PHI. Healthie internal IDs (`user_id`, `appointment_id`, `document_id`) are OK to log. See Gotcha #6 and `./CLAUDE.md` HIPAA section.
6. **Wrap idempotent reads with `lib/resilience.ts` retry.** Mutations like `createClient` MUST NOT auto-retry — instead use the idempotent `ensureHealthiePatient` pattern (lookup-by-email, create only if absent) at `lib/healthie/patient-sync.ts:14`.
7. **NUMERIC coercion at the data boundary.** `@vercel/postgres` returns NUMERIC columns as strings; coerce with `Number()` before forwarding to Healthie or doing arithmetic. See `feedback_vercel_numeric_coercion.md` in MEMORY.
8. **`skipped_email: true` on every client create.** CULTR owns the welcome-email funnel; duplicates from Healthie hurt deliverability. See Gotcha #7.

## CULTR integration map

Per Phase 6 D-06, Healthie touches CULTR at four active integration points:

| Integration | File | Purpose | Active? |
|---|---|---|---|
| Patient sync | `lib/healthie/patient-sync.ts` | CULTR member → Healthie client (`ensureHealthiePatient`); idempotent lookup-then-create; always passes `skipped_email: true` | latent (awaiting API key) |
| Mutations | `lib/healthie/mutations.ts` | `createClient` / `createAppointment` / `createFormAnswerGroup` / `createDocument` (+ companion queries in `queries.ts`) | code-ready; Calendly active, Healthie scheduling latent |
| Webhook route | `app/api/webhook/healthie/` | Raw-body receiver; `verifyHealthieWebhook` (RFC 9421 HMAC-SHA256); Phase 8 dispatcher will route events to subscription/lifecycle handlers | live route, latent dispatch |
| Lab sync | `lib/healthie/lab-sync.ts` | `pushLabResultsToHealthie` — SiPhox biomarker reports → Healthie via document upload (`createDocument`), NOT native lab order | latent (awaiting Healthie key + SiPhox lab event hook) |

### File paths

- `lib/healthie/client.ts` — `healthieRequest`, `healthieRawRequest`, `HealthieApiError`, `isHealthieConfigured`, default URL resolver
- `lib/healthie/webhooks.ts` — `readWebhookBody`, `verifyHealthieWebhook`, `parseWebhookBody`, `HealthieWebhookEvent` type, RFC 9421 implementation
- `lib/healthie/mutations.ts` — `createClient`, `createAppointment`, `createFormAnswerGroup`, `createDocument` and their GraphQL strings + Zod payload wrappers
- `lib/healthie/queries.ts` — `getClient`, `getClientByEmail`, `getAppointment`, `getAppointments`, `getFormAnswerGroup`, `getDocument`, `getDocuments`
- `lib/healthie/schemas.ts` — Zod schemas for response shapes (`HealthieUserSchema`, `HealthieAppointmentSchema`, `HealthieFormAnswerGroupSchema`, `HealthieDocumentSchema`, `HealthieWebhookSchema`)
- `lib/healthie/types.ts` — TypeScript types (`GraphQLResponse`, `GraphQLError`, `HealthieUser`, `HealthieAppointment`, `HealthieFormAnswerGroup`, `HealthieDocument`, `CreateClientInput`, etc.)
- `lib/healthie/patient-sync.ts` — `ensureHealthiePatient(email, firstName, lastName)`, `linkHealthiePatient(membershipId, healthiePatientId)`
- `lib/healthie/lab-sync.ts` — `pushLabResultsToHealthie(healthiePatientId, reportId, reportDate, pdfBase64?)`
- `lib/healthie/portal-mapper.ts` — Healthie ↔ CULTR portal field mapping
- `lib/healthie/index.ts` — barrel re-exports for the entire module

### Example: idempotent patient creation

```typescript
import { ensureHealthiePatient } from '@/lib/healthie/patient-sync'

// Returns Healthie user object, or null if HEALTHIE_API_KEY is unset
const patient = await ensureHealthiePatient('<email>', '<firstName>', '<lastName>')
if (patient) {
  await linkHealthiePatient('<membershipId>', patient.id)
}
```

Use placeholder values (`<PATIENT_ID>`, `<email>`) in examples — never embed real PHI in skill or test fixtures.

## Webhook event catalogue

The full catalogue (171 events) is sourced from https://docs.gethealthie.com/guides/webhooks/event-reference/ on 2026-05-01 and persisted in `.planning/phases/06-skills/06-02-WEBHOOK-EVENTS.md`. Below is the Phase-8-relevant summary, grouped by resource type. Refresh by re-fetching the source URL and re-extracting `<code>`-tagged event identifiers.

The `CULTR action` column marks events the Phase 8 dispatcher will route:
- `dispatch` — route to a subscription/lifecycle handler
- `patient-sync` — call `ensureHealthiePatient` / membership reconciliation
- `lab-sync` — trigger SiPhox→Healthie lab document upload
- blank — out of scope for v2.0

### Appointment events

| event_type | trigger | CULTR action |
|---|---|---|
| `appointment.created` | New appointment scheduled | dispatch |
| `appointment.updated` | Appointment changed (time/type/provider/notes) | dispatch |
| `appointment.deleted` | Appointment cancelled / removed | dispatch |
| `appointment.patient_added` | Patient added to appointment roster | |
| `appointment.patient_removed` | Patient removed from appointment roster | |
| `appointment.participant_joined` | Participant joined telehealth session | |
| `appointment.participant_left` | Participant left telehealth session | |
| `appointment.recording_started` | Telehealth recording started | |
| `appointment.recording_stopped` | Telehealth recording stopped | |
| `appointment.recording_completed` | Recording finalized | |
| `appointment.transcript_available` | Transcript ready | |
| `appointment_form_answer_group_connection.created` | Form attached to appointment | |
| `appointment_form_answer_group_connection.updated` | Linked form connection changed | |
| `appointment_form_answer_group_connection.deleted` | Form connection removed | |
| `availability.created` | Provider added new availability slot | |
| `availability.updated` | Availability slot changed | |
| `availability.deleted` | Availability slot removed | |

### Patient (User) events

| event_type | trigger | CULTR action |
|---|---|---|
| `patient.created` | New patient created | patient-sync |
| `patient.updated` | Patient demographics changed | patient-sync |
| `patient.merged` | Two patient records merged | patient-sync |

### Form / Form Answer Group events

| event_type | trigger | CULTR action |
|---|---|---|
| `form_answer_group.created` | New form answer set created | dispatch |
| `form_answer_group.signed` | Form answer set signed by patient | dispatch |
| `form_answer_group.locked` | Form answer set locked | |
| `form_answer_group.unlocked` | Form answer set unlocked | |
| `form_answer_group.deleted` | Form answer set deleted | |
| `generated_form_answer_group.created` | Form answers auto-generated (e.g., AI scribe) | |
| `requested_form_completion.created` | Provider requested patient complete a form | |
| `requested_form_completion.updated` | Form-completion request status changed | |
| `requested_form_completion.deleted` | Form-completion request cancelled | |
| `custom_module_form.created` / `.updated` / `.deleted` | Form template lifecycle | |
| `custom_module.created` / `.updated` / `.deleted` | Form question/module lifecycle | |

### Document events

| event_type | trigger | CULTR action |
|---|---|---|
| `document.created` | Document uploaded to a patient | dispatch |
| `document.updated` | Document metadata or contents changed | |
| `document.deleted` | Document deleted | |
| `folder_sharing.created` | Document folder shared with another user | |
| `folder_sharing.deleted` | Folder share removed | |

### Conversation / Messaging events

| event_type | trigger | CULTR action |
|---|---|---|
| `conversation.created` | New conversation thread started | |
| `conversation.updated` | Conversation thread updated | |
| `conversation_membership.created` / `.deleted` / `.viewed` | Member added/removed/read | |
| `message.created` / `.deleted` | Message lifecycle | |
| `scheduled_message.sent` | Scheduled outbound message delivered | |

### Care plan / Goal events

| event_type | trigger | CULTR action |
|---|---|---|
| `care_plan.created` / `.updated` / `.activated` / `.deactivated` / `.deleted` | Care plan lifecycle | |
| `goal.created` / `.updated` / `.deleted` | Patient goal lifecycle | |
| `goal_history.created` / `.deleted` | Goal history entry | |
| `goal_template.created` / `.updated` / `.deleted` | Goal template lifecycle | |

### Metric / Tracking / Note events

| event_type | trigger | CULTR action |
|---|---|---|
| `metric_entry.created` / `.updated` / `.deleted` | Patient logged a tracked metric | |
| `entry.created` / `.updated` / `.deleted` | Generic journal entry lifecycle | |
| `comment.created` / `.updated` / `.deleted` | Comment on a chart/note | |
| `charting_note_addendum.created` / `.updated` / `.deleted` | Chart note addendum | |
| `applied_tag.created` / `.deleted` | Tag applied/removed from a record | |
| `task.created` / `.updated` / `.deleted` | Task lifecycle | |

### Lab / Diagnostic events

| event_type | trigger | CULTR action |
|---|---|---|
| `lab_order.created` / `.updated` | Lab order lifecycle in Healthie | |
| `lab_result.created` | Lab result received and attached | lab-sync |
| `lab_result.updated` | Lab result modified | lab-sync |

### Diagnosis / Allergy / Medication events

| event_type | trigger | CULTR action |
|---|---|---|
| `diagnosis.create` / `diagnosis.created` | Diagnosis recorded (docs show both spellings — verify before subscribing) | |
| `diagnosis.updated` / `.deleted` | Diagnosis lifecycle | |
| `allergy_sensitivity.created` / `.updated` / `.deleted` | Allergy/sensitivity lifecycle | |
| `family_history_condition.created` / `.updated` / `.deleted` | Family history condition lifecycle | |
| `medication.created` / `.updated` / `.deleted` | Medication lifecycle | |
| `prescription.updated` | Prescription status changed (DoseSpot) | |
| `dosespot_notification.created` | DoseSpot notification received | |

### Insurance / Claims events

| event_type | trigger | CULTR action |
|---|---|---|
| `accepted_insurance_plan.created` / `.deleted` | Practice's accepted plan list | |
| `insurance_authorization.created` / `.updated` / `.deleted` | Authorization lifecycle | |
| `policy.created` / `.updated` / `.deleted` | Patient insurance policy | |
| `claim_submission.created` / `.updated` / `.deleted` | Claim lifecycle | |
| `cms1500.created` / `.updated` / `.deleted` | CMS-1500 form lifecycle | |
| `referral.created` / `.updated` / `.deleted` | Referral lifecycle | |
| `referring_physician.created` / `.updated` / `.deleted` | Referring physician record | |
| `other_id_number.created` / `.updated` / `.deleted` | Other identifier (NPI etc.) | |

### Billing / Payment events

| event_type | trigger | CULTR action |
|---|---|---|
| `payment.created` / `.updated` / `.deleted` | Payment lifecycle | |
| `recurring_payment.created` / `.updated` | Recurring billing record | |
| `requested_payment.created` / `.updated` / `.deleted` | Payment request to patient | |
| `billing_item.created` / `.updated` / `.deleted` | Billing line item | |
| `super_bill.created` / `.updated` / `.deleted` | Super-bill lifecycle | |
| `charge_back.created` / `.updated` / `.deleted` | Chargeback lifecycle | |
| `stripe_customer_detail.created` / `.updated` / `.deleted` | Stripe customer linked to patient | |

### Course / Onboarding / Organization events

| event_type | trigger | CULTR action |
|---|---|---|
| `course_membership.created` / `.updated` / `.deleted` | Course enrollment | |
| `completed_onboarding_item.created` / `.updated` / `.deleted` | Onboarding item completion | |
| `organization_info.created` / `.updated` / `.deleted` | Organization info record | |
| `organization_member.updated` | Organization member changed | |
| `organization_membership.created` / `.updated` | Org membership | |
| `location.created` / `.updated` / `.deleted` | Practice location | |
| `feature_toggle.created` / `.updated` / `.deleted` | Feature flag | |

### Communication / Notification / External events

| event_type | trigger | CULTR action |
|---|---|---|
| `notification_contact.created` / `.updated` / `.deleted` | Notification contact | |
| `notification_setting.created` / `.updated` / `.deleted` | Notification setting | |
| `sent_notification_record.created` / `.updated` | Outbound notification record | |
| `received_fax.created` | Inbound fax received | |
| `sent_fax.created` / `.updated` / `.status_changed` | Outbound fax lifecycle | |
| `external_calendar.authorization_error` | External calendar OAuth failed | |

Total events sourced: 171. Source: https://docs.gethealthie.com/guides/webhooks/event-reference/ on 2026-05-01. Refresh by re-fetching the source URL.

## Refreshing this skill

The webhook event reference is the only part of this skill that drifts. To refresh the catalogue:

```bash
curl -sL "https://docs.gethealthie.com/guides/webhooks/event-reference/" -A "Mozilla/5.0" -o /tmp/h-events.html
grep -oE "\b[a-z_][a-z_0-9]+\.[a-z_][a-z_0-9]+\b" /tmp/h-events.html | sort -u | grep -E "\.(created|updated|deleted|activated|deactivated|locked|unlocked|signed|completed|started|stopped|joined|left|added|removed|merged|sent|viewed|create|status_changed|authorization_error|participant_joined|participant_left|patient_added|patient_removed|recording_completed|recording_started|recording_stopped|transcript_available)\b"
```

Then update the catalogue in `.planning/phases/06-skills/06-02-WEBHOOK-EVENTS.md` and re-summarize the relevant tables in this file.

For mutation/query and gotcha drift, re-read `lib/healthie/client.ts`, `lib/healthie/webhooks.ts`, `lib/healthie/mutations.ts`, and `lib/healthie/queries.ts` directly — the source files are the truth, not this document.
