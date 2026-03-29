# Telehealth Consultations — Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Stack:** Cal.com (scheduling) + Daily.co (video) + AWS S3 (recording storage)

---

## Overview

Add telehealth video consultations to CULTR Health. Patients self-service book appointments via an embedded Cal.com calendar, join calls in a branded Daily.co video room embedded in the app, and providers join via a direct link. Calls are recorded (with patient consent) and stored on S3. Post-call notes are captured from providers.

### Provider Types

- **CULTR Staff** — initial consultations, follow-ups (Stewart, Erik, etc.)
- **CULTR Providers** — clinical consultations
- **Asher Med Providers** — prescription-related clinical consultations

### Consultation Types

- **Initial** — 30 min, first-time patient consultation
- **Follow-up** — 15 min, ongoing care check-in
- **Renewal** — 15 min, prescription renewal consultation

### Tier Limits (per calendar month)

| Tier | Price | Consultations/Month |
|---|---|---|
| Club | $0 | 0 (upgrade prompt) |
| Core | $199 | 1 |
| Catalyst+ | $499 | 2 |
| Concierge | $1,099 | Unlimited |

---

## Database Schema

### Migration 029: Telehealth Consultations

**Extend `consult_requests` table:**

```sql
ALTER TABLE consult_requests
  ADD COLUMN calcom_booking_id VARCHAR(255) UNIQUE,
  ADD COLUMN calcom_booking_uid VARCHAR(255),
  ADD COLUMN daily_room_name VARCHAR(255),
  ADD COLUMN daily_room_url VARCHAR(500),
  ADD COLUMN provider_email VARCHAR(255),
  ADD COLUMN provider_type VARCHAR(50) DEFAULT 'cultr_staff',
  ADD COLUMN consultation_type VARCHAR(50) DEFAULT 'initial',
  ADD COLUMN plan_tier VARCHAR(50),
  ADD COLUMN scheduled_at TIMESTAMPTZ,
  ADD COLUMN started_at TIMESTAMPTZ,
  ADD COLUMN ended_at TIMESTAMPTZ,
  ADD COLUMN duration_mins INTEGER,
  ADD COLUMN recording_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN recording_consent_at TIMESTAMPTZ,
  ADD COLUMN reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN cancel_reason TEXT;

CREATE INDEX idx_consult_calcom_booking ON consult_requests(calcom_booking_id);
CREATE INDEX idx_consult_scheduled ON consult_requests(scheduled_at);
CREATE INDEX idx_consult_provider ON consult_requests(provider_email);
CREATE INDEX idx_consult_status_scheduled ON consult_requests(status, scheduled_at);
```

Valid values for `provider_type`: `cultr_staff`, `cultr_provider`, `asher_provider`
Valid values for `consultation_type`: `initial`, `follow_up`, `renewal`
Valid values for `status` (extended): `pending`, `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show`

**New `consultation_recordings` table:**

```sql
CREATE TABLE consultation_recordings (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consult_requests(id),
  daily_recording_id VARCHAR(255) UNIQUE,
  s3_key VARCHAR(500),
  s3_bucket VARCHAR(255),
  duration_secs INTEGER,
  file_size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recording_consultation ON consultation_recordings(consultation_id);
CREATE INDEX idx_recording_status ON consultation_recordings(status);
```

Valid values for `status`: `processing`, `ready`, `failed`, `deleted`

**New `consultation_notes` table:**

```sql
CREATE TABLE consultation_notes (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consult_requests(id),
  provider_email VARCHAR(255) NOT NULL,
  reason TEXT,
  outcome TEXT,
  next_steps TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_consultation ON consultation_notes(consultation_id);
```

---

## API Routes

### Patient-Facing

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/consultations` | List member's consultations (upcoming + past) |
| POST | `/api/consultations/book` | Create booking — validates tier limits, creates Daily.co room, stores in DB |
| GET | `/api/consultations/[id]` | Consultation details (room URL, status, notes) |
| POST | `/api/consultations/[id]/cancel` | Cancel consultation — updates DB + cancels Cal.com event |

### Provider-Facing

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/provider/consultations` | List provider's upcoming consultations |
| POST | `/api/provider/consultations/[id]/complete` | Mark complete + submit notes |

### Admin-Facing

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/consultations` | All consultations with filters (status, provider, date range) |
| GET | `/api/admin/consultations/[id]` | Consultation detail + recording + notes |
| GET | `/api/consultations/[id]/recording` | Presigned S3 URL for recording playback (admin/provider only) |
| GET/POST | `/api/consultations/[id]/notes` | Provider post-call notes CRUD |

### Webhooks

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/webhook/calcom` | Cal.com events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED` |
| POST | `/api/webhook/daily` | Daily.co events: `meeting.ended`, `recording.ready-to-download` |

### Cron

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/consultation-reminders` | Every 15 min | Send 1-hour-before reminder emails |

---

## Booking Flow

```
Patient visits /consultations
        |
        v
  TierGateConsultation checks plan + monthly usage
        |
        v (has remaining consultations)
  ConsultationTypeSelector: Initial / Follow-up / Renewal
        |
        v
  Cal.com BookingEmbed shows provider availability
        |
        v (patient selects slot)
  Cal.com fires BOOKING_CREATED webhook
        |
        v
  /api/webhook/calcom handler:
    1. Verify X-Cal-Signature-256 HMAC
    2. Check idempotency (prevent duplicate processing)
    3. Validate tier limit (query consult_requests for current month)
    4. Create Daily.co room via API (recording enabled)
    5. Generate provider meeting token (is_owner: true, expiry: scheduled_at + 1hr buffer)
    6. Insert into consult_requests (status: 'scheduled')
    7. Send confirmation email to patient (join link: /consultations/[id])
    8. Send confirmation email to provider (direct Daily.co room link with token)
        |
        v
  Cron: /api/cron/consultation-reminders
    - Runs every 15 min
    - Queries consultations where scheduled_at is within next hour AND reminder_sent_at IS NULL
    - Sends reminder email to patient
    - Sets reminder_sent_at to prevent duplicates
```

---

## Video Call Flow

```
Patient visits /consultations/[id]
        |
        v
  Auth check: JWT session + consultation belongs to this email
        |
        v
  Before scheduled time (> 10 min):
    "Your appointment is at [time]" with countdown
        |
        v
  Within 10 min of scheduled time:
    WaitingRoom renders:
      - Camera/mic test (Daily.co prebuilt)
      - Consent checkbox: "I consent to this consultation being recorded..."
      - "Join Call" button (disabled until consent checked)
        |
        v
  Patient clicks "Join Call":
    - POST consent timestamp to /api/consultations/[id] (recording_consent, recording_consent_at)
    - If consent declined: join room with recording disabled
    - VideoRoom renders with Daily.co DailyProvider + DailyVideo
    - Branded overlay: CULTR logo, provider name, call timer
        |
        v
  Provider joins via direct Daily.co link (with owner token)
        |
        v
  Call ends (either party leaves or provider ends):
    - Daily.co fires meeting.ended webhook
    - /api/webhook/daily updates: ended_at, duration_mins, status = 'completed'
    - Patient sees PostCallSummary: duration, provider, "Notes will be available soon"
        |
        v
  Daily.co processes recording:
    - Fires recording.ready-to-download webhook
    - /api/webhook/daily handler:
      1. Download recording from Daily.co temporary URL
      2. Upload to S3 (cultr-consultation-recordings bucket)
      3. Insert into consultation_recordings (status: 'ready')
      4. Delete recording from Daily.co cloud
      5. Send notification email to admin
```

---

## Frontend Structure

### Pages

```
app/
├── consultations/
|   ├── page.tsx                    # Booking page — tier gate, type selector, Cal.com embed
|   ├── [id]/page.tsx               # Video room — waiting room, consent, Daily.co embed, post-call summary
|   └── history/page.tsx            # Past consultations — recordings, notes, rebooking
|
├── provider/
|   └── consultations/
|       ├── page.tsx                # Provider schedule — upcoming calls, join buttons, pending notes
|       └── [id]/page.tsx           # Provider view — Daily.co room + notes form
|
└── admin/
    └── consultations/
        └── page.tsx                # Admin overview — all consultations, filters, recording access
```

### Components

```
components/consultations/
├── BookingEmbed.tsx                # Cal.com @calcom/embed-react inline embed
|                                  # Passes member email, consultation type as metadata
|                                  # Client component ('use client')
|
├── ConsultationTypeSelector.tsx   # Toggle pills: Initial / Follow-up / Renewal
|                                  # Filters Cal.com event type shown in embed
|
├── TierGateConsultation.tsx       # Shows: "X of Y consultations used this month"
|                                  # Club tier: upgrade prompt, no booking
|                                  # Remaining = 0: "You've used all consultations this month"
|
├── VideoRoom.tsx                  # Daily.co DailyProvider + DailyVideo wrapper
|                                  # Branded controls: mic, camera, screen share, leave call
|                                  # Call timer overlay, provider name display
|                                  # Client component ('use client')
|
├── WaitingRoom.tsx                # Pre-call experience:
|                                  #   - Camera/mic device test
|                                  #   - Recording consent checkbox
|                                  #   - "Join Call" button (disabled until consent)
|                                  #   - Countdown to scheduled time
|
├── PostCallSummary.tsx            # Patient-facing post-call:
|                                  #   - Call duration, provider name
|                                  #   - "Notes will be available when your provider submits them"
|                                  #   - "Book Follow-up" CTA
|
├── ProviderNotesForm.tsx          # Provider-facing post-call form:
|                                  #   - Reason for visit (text)
|                                  #   - Outcome (text)
|                                  #   - Next steps (text)
|                                  #   - Internal notes (text, not visible to patient)
|                                  #   - Submit → POST /api/consultations/[id]/notes
|
├── ConsultationCard.tsx           # Reusable card for listing consultations:
|                                  #   - Status badge, date/time, provider, type
|                                  #   - Action buttons: Join / Cancel / View Notes / View Recording
|                                  #   - Used in: history, dashboard, admin
|
└── RecordingPlayer.tsx            # Secure video player:
                                   #   - Fetches presigned S3 URL from /api/consultations/[id]/recording
                                   #   - Renders <video> with controls
                                   #   - URL expires after 1 hour
```

### Existing Page Modifications

- **Member Dashboard** (`app/dashboard/page.tsx`): Add "Upcoming Consultations" section — shows next appointment ConsultationCard + "Book Consultation" CTA button
- **Admin Sidebar** (`components/admin/AdminSidebar.tsx`): Add `{ label: 'Consultations', href: '/admin/consultations', icon: Video }` under CUSTOMERS group
- **Plans config** (`lib/config/plans.ts`): Add `consultationsPerMonth` to each Plan: Club=0, Core=1, Catalyst+=2, Concierge=Infinity

---

## Lib Files

### `lib/cal.ts` — Cal.com API Client

```typescript
// Functions:
// - getEventTypes(): Fetch org event types (initial, follow-up, renewal)
// - cancelBooking(bookingId): Cancel a Cal.com booking
// - rescheduleBooking(bookingId, newTime): Reschedule
// - verifyWebhookSignature(payload, signature): HMAC verification
//
// Auth: CALCOM_API_KEY in Authorization header
// Base URL: https://api.cal.com/v2
```

### `lib/daily.ts` — Daily.co API Client

```typescript
// Functions:
// - createRoom(name, options): Create room with recording config + expiry
// - deleteRoom(name): Cleanup after recording downloaded
// - createMeetingToken(roomName, options): Generate participant/owner tokens
// - getRecordingDownloadLink(recordingId): Get temporary download URL
// - verifyWebhookSignature(payload, signature): HMAC verification
//
// Auth: DAILY_API_KEY in Authorization header
// Base URL: https://api.daily.co/v1
```

### `lib/config/consultations.ts` — Configuration

```typescript
// CONSULTATION_TYPES: { initial: { duration: 30, label: 'Initial Consultation' }, ... }
// TIER_LIMITS: { club: 0, core: 1, catalyst: 2, concierge: Infinity }
// PROVIDER_MAP: { [email]: { name, type, calcomEventTypeId } }
// RECORDING_CONSENT_TEXT: string
```

---

## Email Notifications

Five email triggers using existing branded templates from `lib/resend.ts`:

| Trigger | Recipient | Content |
|---|---|---|
| Booking confirmed | Patient | Date/time, provider name, join link (`/consultations/[id]`), cancel link |
| Booking confirmed | Provider | Date/time, patient name, direct Daily.co room link, consultation reason |
| Reminder (1hr before) | Patient | "Your consultation starts in 1 hour" + join link |
| Call completed | Patient | Duration, provider name, link to view notes, "Book Follow-up" CTA |
| Recording ready | Admin | Consultation ID, patient/provider names, admin recording link |

**Reminder delivery:** Vercel cron job (`/api/cron/consultation-reminders`) runs every 15 minutes. Queries consultations where `scheduled_at` is within the next hour and `reminder_sent_at IS NULL`. Sets `reminder_sent_at` after sending to prevent duplicates.

---

## Security & HIPAA

### Recording Consent

- Patient must check consent checkbox before "Join Call" enables
- Consent timestamp stored: `recording_consent = true`, `recording_consent_at = NOW()`
- Consent text: "I consent to this consultation being recorded for medical documentation purposes. Recordings are stored securely and accessible only to your care team."
- If patient declines: they can still join, but recording is disabled for that room via Daily.co API

### Video Room Access Control

- **Patient:** Authenticated via JWT (`cultr_session` cookie) + consultation must belong to their email
- **Provider:** Daily.co meeting token with `is_owner: true`, expires at `scheduled_at + 1 hour buffer`
- **Admin recording access:** `verifyAdminAuth()` required, presigned S3 URLs expire after 1 hour

### S3 Recording Storage

- **Bucket:** `cultr-consultation-recordings`
- **Key pattern:** `recordings/{year}/{month}/{consultation_id}_{timestamp}.mp4`
- **Encryption:** SSE-S3 server-side encryption
- **Access:** No public access, presigned URLs only
- **Retention:** Indefinite (HIPAA minimum 6 years)

### Webhook Security

- **Cal.com:** Verify `X-Cal-Signature-256` HMAC against `CAL_WEBHOOK_SECRET`
- **Daily.co:** Verify `X-Webhook-Signature` HMAC against `DAILY_WEBHOOK_SECRET`
- Both use idempotency tracking (store processed webhook IDs)

### Rate Limiting

- Booking endpoint: max 5 attempts per user per hour via `lib/rate-limit.ts`

---

## Environment Variables

### New Required

```env
CALCOM_API_KEY=cal_live_...
CALCOM_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CALCOM_ORG_SLUG=cultrhealth

DAILY_API_KEY=...
DAILY_WEBHOOK_SECRET=...
DAILY_DOMAIN=cultrhealth

CONSULTATION_S3_BUCKET=cultr-consultation-recordings
CONSULTATION_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### New npm Dependencies

```
@calcom/embed-react
@daily-co/daily-react
@daily-co/daily-js
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

### Vercel Cron (new `vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/consultation-reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## One-Time Setup Steps

### Cal.com
1. Create org "CULTR Health" on Team plan ($20/user/month)
2. Add event types: "Initial Consultation" (30 min), "Follow-up" (15 min), "Renewal" (15 min)
3. Add providers as team members with availability schedules
4. Create webhook: `https://staging.cultrhealth.com/api/webhook/calcom`
5. Subscribe to events: `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`
6. Note event type IDs for `lib/config/consultations.ts`

### Daily.co
1. Sign up for Scale plan
2. Contact sales for HIPAA BAA signing
3. Configure webhook: `https://staging.cultrhealth.com/api/webhook/daily`
4. Subscribe to events: `meeting.ended`, `recording.ready-to-download`
5. Note API key for env vars

### AWS S3
1. Create bucket `cultr-consultation-recordings` in us-east-1
2. Enable SSE-S3 encryption
3. Block all public access
4. Create IAM user with S3 access scoped to this bucket
5. Store credentials in Vercel env vars
