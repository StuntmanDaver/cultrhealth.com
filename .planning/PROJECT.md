# CULTR Health — Asher Med Members Portal Integration

## What This Is

A seamless members portal for CULTR Health that connects authenticated patients directly to their Asher Med EHR/EMR data. Members log in with phone + OTP (Twilio), see their live order status, health profile, documents, and can start intake/renewal flows — all through a CULTR-branded experience backed by the Asher Med Partner Portal API. Providers get a lightweight patient lookup view that links out to Asher Med's portal for clinical workflows.

## Core Value

Members can log in and immediately see the status of their treatment — orders, profile, documents — without calling support or checking email. One authenticated view of their complete care journey.

## Requirements

### Validated

<!-- Existing capabilities already built and working -->

- ✓ Asher Med API client covering all 15 Partner Portal endpoints — `lib/asher-med-api.ts`
- ✓ Intake form components (12 form steps) — `components/intake/`
- ✓ Renewal flow — `app/renewal/`
- ✓ File upload via S3 presigned URLs — integrated with Asher Med upload API
- ✓ JWT authentication infrastructure — `lib/auth.ts` (sign, verify, middleware)
- ✓ Database with `asher_patient_id` columns across membership/order tables — `lib/db.ts`
- ✓ Asher Med config with medication options, intake steps, state validation — `lib/config/asher-med.ts`
- ✓ Admin dashboard with order management — `app/admin/`
- ✓ Stripe payment integration — checkout, subscriptions, webhooks

### Active

<!-- Current scope: building the authenticated portal experience -->

- [ ] Phone + OTP member authentication via Twilio SMS
- [ ] Member session management (JWT with phone-verified identity)
- [ ] Patient identity linking (phone lookup → cache `asher_patient_id` in DB)
- [ ] Status-first member dashboard (prominent order status card, then secondary sections)
- [ ] Member profile view (personal info, address, physical measurements from Asher Med)
- [ ] Member profile editing (update info, synced back to Asher Med via `updatePatient`)
- [ ] Order history with live status from Asher Med (Pending → Approved → Completed)
- [ ] Order detail view (medication, status, dates, doctor assignment)
- [ ] Document viewer (uploaded IDs, consent forms, prescriptions via `getPreviewUrl`)
- [ ] Document upload from member portal (new files via presigned URL flow)
- [ ] Inline intake form launch from dashboard (pre-filled from existing patient data)
- [ ] Inline renewal form launch from dashboard (pre-filled, simplified flow)
- [ ] Separate provider login page (`/provider`)
- [ ] Provider patient search/lookup view (lightweight, searches via Asher Med API)
- [ ] Provider patient detail view (read-only, key info + order summary)
- [ ] Provider link-out to Asher Med portal for clinical actions

### Out of Scope

- Full clinical provider dashboard inside CULTR — providers use Asher Med's own portal for clinical workflows
- Real-time notifications/push alerts — v2 feature
- In-app messaging between members and providers — use existing support channels
- Member-to-member social features — handled by Community page
- Password-based authentication — using phone OTP instead
- Multi-factor authentication beyond phone OTP — phone verification is sufficient for HIPAA with TLS

## Context

**Brownfield project.** CULTR Health is a live telehealth platform on staging (staging.cultrhealth.com). The Asher Med API client and intake forms are fully built. The gap is the authenticated member experience — currently login is just a phone lookup with no session, and the dashboard is a stub component.

**Asher Med API (15 endpoints):**
- **Patients:** List, get by ID, get by phone, update patient
- **Orders:** List, get detail, create new order, create renewal, update approval status
- **Intake Questions:** Get new intake questions, get renewal questions
- **File Upload:** Get presigned upload URL, get preview URL
- **Partners:** Get partner by ID, update partner profile

All endpoints authenticate via `X-API-KEY` header. API is HIPAA-compliant with PHI data handling.

**Current auth system:** JWT-based (`jose` library, HS256). Magic link flow exists for member login but doesn't create persistent patient-linked sessions. Creator portal has separate JWT auth. The new phone OTP flow needs to coexist with both.

**Key technical notes:**
- Database already has `asher_patient_id` (number) in memberships, orders, and other tables
- `getPatientByPhone()` exists in the API client — returns patient or null
- Existing intake form context (`IntakeFormContext`) manages multi-step form state
- Staging auth bypass auto-provisions team emails — new OTP flow should respect this

## Constraints

- **SMS Provider**: Twilio — must be HIPAA-eligible BAA option. Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **HIPAA**: No PHI in logs, all API calls over HTTPS/TLS 1.2+, OTP codes must expire (5 min), rate limit OTP requests
- **Tech Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS — must follow existing patterns (server/client split, `*Client.tsx` naming)
- **Auth Coexistence**: New phone OTP auth must work alongside existing JWT magic link (members), creator JWT (creators), and admin JWT (admins)
- **API Proxy**: All Asher Med API calls must go through CULTR backend routes (never expose API key to client)
- **Design System**: Use existing brand tokens (forest, cream, sage), Fraunces/Inter fonts, Button component variants, rounded-full buttons

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phone + OTP via Twilio (not magic link) | Members know their phone number; matches Asher Med's phone-based patient lookup. Lower friction than email. | — Pending |
| Lightweight provider view + link-out | Providers already use Asher Med portal for clinical work. Rebuilding it adds complexity without clear value. | — Pending |
| Status-first dashboard layout | Members check order status most often. Big status card reduces "where's my medication?" support tickets. | — Pending |
| Phone lookup → cache asher_patient_id | First login resolves phone → Asher patient ID. Cache in DB for fast future lookups. Survives phone changes after initial link. | — Pending |
| OTP codes via SMS (not email) | Matches the phone-based identity model. Email OTP would require a different lookup strategy. | — Pending |

---
*Last updated: 2026-03-10 after initialization*
