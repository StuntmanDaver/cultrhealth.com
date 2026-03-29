# Telehealth Consultations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HIPAA-compliant video telehealth consultations with Cal.com scheduling, Daily.co embedded video, S3 recording storage, and tier-gated booking.

**Architecture:** Cal.com embed for self-service booking, Daily.co React SDK for branded patient video rooms with provider direct links, webhook-driven recording pipeline to S3, cron-based email reminders. Extends existing `consult_requests` table with two new tables for recordings and notes.

**Tech Stack:** @calcom/embed-react, @daily-co/daily-react, @daily-co/daily-js, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, existing Resend emails, @vercel/postgres

**Spec:** `docs/superpowers/specs/2026-03-29-telehealth-consultations-design.md`

---

## File Map

### New Files

| File | Responsibility |
|---|---|
| `migrations/029_telehealth_consultations.sql` | Schema: extend consult_requests, create consultation_recordings + consultation_notes |
| `lib/config/consultations.ts` | Consultation types, tier limits, provider map, consent text |
| `lib/cal.ts` | Cal.com API client: event types, cancel booking, webhook verification |
| `lib/daily.ts` | Daily.co API client: room CRUD, meeting tokens, recording download, webhook verification |
| `lib/s3-recordings.ts` | S3 client: upload recording, generate presigned playback URL |
| `lib/consultations-db.ts` | Database queries: CRUD for consultations, recordings, notes, tier limit checks |
| `app/api/webhook/calcom/route.ts` | Webhook: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED |
| `app/api/webhook/daily/route.ts` | Webhook: meeting.ended, recording.ready-to-download |
| `app/api/consultations/route.ts` | Patient: list upcoming + past consultations |
| `app/api/consultations/book/route.ts` | Patient: validate tier + create booking |
| `app/api/consultations/[id]/route.ts` | Patient: get consultation details (room URL, status, notes) |
| `app/api/consultations/[id]/cancel/route.ts` | Patient: cancel consultation |
| `app/api/consultations/[id]/notes/route.ts` | Provider: GET/POST consultation notes |
| `app/api/consultations/[id]/recording/route.ts` | Admin/Provider: presigned S3 recording URL |
| `app/api/provider/consultations/route.ts` | Provider: list upcoming consultations |
| `app/api/provider/consultations/[id]/complete/route.ts` | Provider: mark complete + submit notes |
| `app/api/admin/consultations/route.ts` | Admin: list all consultations with filters |
| `app/api/admin/consultations/[id]/route.ts` | Admin: consultation detail + recording + notes |
| `app/api/cron/consultation-reminders/route.ts` | Cron: send 1-hour-before reminder emails |
| `components/consultations/BookingEmbed.tsx` | Cal.com inline embed, passes member metadata |
| `components/consultations/ConsultationTypeSelector.tsx` | Toggle pills: Initial / Follow-up / Renewal |
| `components/consultations/TierGateConsultation.tsx` | Monthly limit display, Club upgrade prompt |
| `components/consultations/VideoRoom.tsx` | Daily.co DailyProvider + video, branded controls |
| `components/consultations/WaitingRoom.tsx` | Pre-call: cam/mic test, consent checkbox, join button |
| `components/consultations/PostCallSummary.tsx` | Patient post-call: duration, notes link, follow-up CTA |
| `components/consultations/ProviderNotesForm.tsx` | Provider post-call form: reason, outcome, next steps |
| `components/consultations/ConsultationCard.tsx` | Reusable card for consultation listing |
| `components/consultations/RecordingPlayer.tsx` | Secure video player with presigned S3 URL |
| `app/consultations/page.tsx` | Booking page: tier gate + type selector + Cal.com embed |
| `app/consultations/[id]/page.tsx` | Video room page: waiting room → video → post-call summary |
| `app/consultations/[id]/ConsultationRoomClient.tsx` | Client component for video room state machine |
| `app/consultations/history/page.tsx` | Past consultations list |
| `app/provider/consultations/page.tsx` | Provider schedule page |
| `app/provider/consultations/[id]/page.tsx` | Provider call + notes page |
| `app/provider/consultations/[id]/ProviderConsultationClient.tsx` | Client component for provider view |
| `app/admin/consultations/page.tsx` | Admin consultations overview |
| `app/admin/consultations/AdminConsultationsClient.tsx` | Client component for admin consultations |

### Modified Files

| File | Change |
|---|---|
| `lib/config/plans.ts` | Add `consultationsPerMonth` field to Plan type and each plan |
| `lib/resend.ts` | Add 5 new email functions for consultation lifecycle |
| `components/admin/AdminSidebar.tsx` | Add "Consultations" nav item under CUSTOMERS group |
| `app/dashboard/page.tsx` | Add "Upcoming Consultations" section |
| `vercel.json` | Add consultation-reminders cron |
| `package.json` | Add new dependencies |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install npm packages**

```bash
cd "/Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr Health Website"
npm install @calcom/embed-react @daily-co/daily-react @daily-co/daily-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner --legacy-peer-deps
```

- [ ] **Step 2: Verify packages installed**

```bash
node -e "require('@calcom/embed-react'); require('@daily-co/daily-react'); require('@aws-sdk/client-s3'); console.log('All packages loaded')"
```

Expected: `All packages loaded`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Cal.com, Daily.co, and AWS S3 dependencies for telehealth"
```

---

## Task 2: Database Migration

**Files:**
- Create: `migrations/029_telehealth_consultations.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Migration 029: Telehealth Consultations
-- Extends consult_requests with Cal.com/Daily.co integration fields
-- Creates consultation_recordings and consultation_notes tables

-- =============================================
-- 1. Extend consult_requests table
-- =============================================

ALTER TABLE consult_requests
  ADD COLUMN IF NOT EXISTS calcom_booking_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS calcom_booking_uid VARCHAR(255),
  ADD COLUMN IF NOT EXISTS daily_room_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS daily_room_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) DEFAULT 'cultr_staff',
  ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(50) DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_mins INTEGER,
  ADD COLUMN IF NOT EXISTS recording_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recording_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Indexes for consult_requests
CREATE INDEX IF NOT EXISTS idx_consult_calcom_booking ON consult_requests(calcom_booking_id);
CREATE INDEX IF NOT EXISTS idx_consult_scheduled ON consult_requests(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consult_provider ON consult_requests(provider_email);
CREATE INDEX IF NOT EXISTS idx_consult_status_scheduled ON consult_requests(status, scheduled_at);

-- =============================================
-- 2. Consultation Recordings
-- =============================================

CREATE TABLE IF NOT EXISTS consultation_recordings (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consult_requests(id) ON DELETE CASCADE,
  daily_recording_id VARCHAR(255) UNIQUE,
  s3_key VARCHAR(500),
  s3_bucket VARCHAR(255),
  duration_secs INTEGER,
  file_size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recording_consultation ON consultation_recordings(consultation_id);
CREATE INDEX IF NOT EXISTS idx_recording_status ON consultation_recordings(status);

-- =============================================
-- 3. Consultation Notes
-- =============================================

CREATE TABLE IF NOT EXISTS consultation_notes (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consult_requests(id) ON DELETE CASCADE,
  provider_email VARCHAR(255) NOT NULL,
  reason TEXT,
  outcome TEXT,
  next_steps TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_consultation ON consultation_notes(consultation_id);

-- =============================================
-- 4. Webhook idempotency table
-- =============================================

CREATE TABLE IF NOT EXISTS consultation_webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: Run migration on staging**

```bash
node scripts/run-migration.mjs migrations/029_telehealth_consultations.sql
```

- [ ] **Step 3: Commit**

```bash
git add migrations/029_telehealth_consultations.sql
git commit -m "feat(db): add migration 029 for telehealth consultations"
```

---

## Task 3: Configuration & Plan Type Update

**Files:**
- Create: `lib/config/consultations.ts`
- Modify: `lib/config/plans.ts`

- [ ] **Step 1: Create consultation config**

Create `lib/config/consultations.ts`:

```typescript
export const CONSULTATION_TYPES = {
  initial: {
    slug: 'initial',
    label: 'Initial Consultation',
    duration: 30,
    description: 'First-time consultation with a CULTR provider',
  },
  follow_up: {
    slug: 'follow_up',
    label: 'Follow-up',
    duration: 15,
    description: 'Ongoing care check-in with your provider',
  },
  renewal: {
    slug: 'renewal',
    label: 'Renewal',
    duration: 15,
    description: 'Prescription renewal consultation',
  },
} as const

export type ConsultationType = keyof typeof CONSULTATION_TYPES

export const TIER_CONSULTATION_LIMITS: Record<string, number> = {
  club: 0,
  core: 1,
  catalyst: 2,
  concierge: Infinity,
}

export type ProviderType = 'cultr_staff' | 'cultr_provider' | 'asher_provider'

export interface ProviderConfig {
  name: string
  email: string
  type: ProviderType
  calcomEventTypeIds: Record<ConsultationType, number>
}

// Map provider emails to their Cal.com event type IDs
// Update these after creating event types in Cal.com dashboard
export const PROVIDER_MAP: Record<string, ProviderConfig> = {
  // Example — replace with real provider data:
  // 'provider@cultrhealth.com': {
  //   name: 'Dr. Provider',
  //   email: 'provider@cultrhealth.com',
  //   type: 'cultr_provider',
  //   calcomEventTypeIds: { initial: 123456, follow_up: 123457, renewal: 123458 },
  // },
}

export const CONSULTATION_STATUSES = {
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700' },
  in_progress: { label: 'In Progress', bg: 'bg-green-50', text: 'text-green-700' },
  completed: { label: 'Completed', bg: 'bg-brand-primary/5', text: 'text-brand-primary' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
  no_show: { label: 'No Show', bg: 'bg-red-50', text: 'text-red-700' },
} as const

export const RECORDING_CONSENT_TEXT =
  'I consent to this consultation being recorded for medical documentation purposes. Recordings are stored securely and accessible only to your care team.'
```

- [ ] **Step 2: Add consultationsPerMonth to Plan type**

In `lib/config/plans.ts`, add `consultationsPerMonth: number` to the `Plan` type and set values on each plan:

- Club: `consultationsPerMonth: 0`
- Core: `consultationsPerMonth: 1`
- Catalyst+: `consultationsPerMonth: 2`
- Concierge: `consultationsPerMonth: Infinity`

Read the file first to find the exact location of the type definition and each plan object.

- [ ] **Step 3: Commit**

```bash
git add lib/config/consultations.ts lib/config/plans.ts
git commit -m "feat: add consultation config and tier consultation limits"
```

---

## Task 4: Cal.com API Client

**Files:**
- Create: `lib/cal.ts`

- [ ] **Step 1: Create Cal.com API client**

Create `lib/cal.ts`:

```typescript
import crypto from 'crypto'

const CALCOM_API_URL = 'https://api.cal.com/v2'

function getApiKey(): string {
  const key = process.env.CALCOM_API_KEY
  if (!key) throw new Error('CALCOM_API_KEY not configured')
  return key
}

async function calFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${CALCOM_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Cal.com API error [${res.status}]: ${body}`)
    throw new Error(`Cal.com API error: ${res.status}`)
  }
  return res
}

export interface CalcomBooking {
  id: number
  uid: string
  title: string
  startTime: string
  endTime: string
  attendees: Array<{ email: string; name: string }>
  organizer: { email: string; name: string }
  status: string
  meetingUrl?: string
}

export async function getEventTypes(): Promise<Array<{ id: number; slug: string; title: string; length: number }>> {
  const res = await calFetch('/event-types')
  const data = await res.json()
  return data.data || []
}

export async function getBooking(bookingUid: string): Promise<CalcomBooking> {
  const res = await calFetch(`/bookings/${bookingUid}`)
  const data = await res.json()
  return data.data
}

export async function cancelBooking(bookingUid: string, cancellationReason?: string): Promise<void> {
  await calFetch(`/bookings/${bookingUid}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason }),
  })
}

export function verifyCalcomWebhook(payload: string, signature: string): boolean {
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (!secret) {
    console.error('CALCOM_WEBHOOK_SECRET not configured')
    return false
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/cal.ts
git commit -m "feat: add Cal.com API client"
```

---

## Task 5: Daily.co API Client

**Files:**
- Create: `lib/daily.ts`

- [ ] **Step 1: Create Daily.co API client**

Create `lib/daily.ts`:

```typescript
import crypto from 'crypto'

const DAILY_API_URL = 'https://api.daily.co/v1'

function getApiKey(): string {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY not configured')
  return key
}

async function dailyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${DAILY_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Daily.co API error [${res.status}]: ${body}`)
    throw new Error(`Daily.co API error: ${res.status}`)
  }
  return res
}

export interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: Record<string, unknown>
}

export interface DailyMeetingToken {
  token: string
}

export async function createRoom(options: {
  name: string
  expiresAt: Date
  enableRecording: boolean
}): Promise<DailyRoom> {
  const res = await dailyFetch('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: options.name,
      privacy: 'private',
      properties: {
        exp: Math.floor(options.expiresAt.getTime() / 1000),
        enable_recording: options.enableRecording ? 'cloud' : undefined,
        enable_chat: true,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
      },
    }),
  })
  return res.json()
}

export async function deleteRoom(roomName: string): Promise<void> {
  await dailyFetch(`/rooms/${roomName}`, { method: 'DELETE' })
}

export async function createMeetingToken(options: {
  roomName: string
  isOwner: boolean
  expiresAt: Date
  userName?: string
}): Promise<string> {
  const res = await dailyFetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: options.roomName,
        is_owner: options.isOwner,
        exp: Math.floor(options.expiresAt.getTime() / 1000),
        user_name: options.userName,
      },
    }),
  })
  const data: DailyMeetingToken = await res.json()
  return data.token
}

export async function getRecordingDownloadLink(recordingId: string): Promise<string> {
  const res = await dailyFetch(`/recordings/${recordingId}/access-link`, {
    method: 'GET',
  })
  const data = await res.json()
  return data.download_link
}

export async function updateRoomRecording(roomName: string, enableRecording: boolean): Promise<void> {
  await dailyFetch(`/rooms/${roomName}`, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        enable_recording: enableRecording ? 'cloud' : undefined,
      },
    }),
  })
}

export function verifyDailyWebhook(payload: string, signature: string): boolean {
  const secret = process.env.DAILY_WEBHOOK_SECRET
  if (!secret) {
    console.error('DAILY_WEBHOOK_SECRET not configured')
    return false
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/daily.ts
git commit -m "feat: add Daily.co API client"
```

---

## Task 6: S3 Recording Client

**Files:**
- Create: `lib/s3-recordings.ts`

- [ ] **Step 1: Create S3 recording client**

Create `lib/s3-recordings.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.CONSULTATION_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

function getBucket(): string {
  const bucket = process.env.CONSULTATION_S3_BUCKET
  if (!bucket) throw new Error('CONSULTATION_S3_BUCKET not configured')
  return bucket
}

export function buildRecordingKey(consultationId: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  return `recordings/${year}/${month}/${consultationId}_${timestamp}.mp4`
}

export async function uploadRecording(
  s3Key: string,
  body: Buffer | ReadableStream,
  contentLength?: number
): Promise<{ bucket: string; key: string }> {
  const bucket = getBucket()
  const client = getS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: body,
      ContentType: 'video/mp4',
      ServerSideEncryption: 'AES256',
      ...(contentLength ? { ContentLength: contentLength } : {}),
    })
  )

  return { bucket, key: s3Key }
}

export async function getRecordingPresignedUrl(
  s3Key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: s3Key,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/s3-recordings.ts
git commit -m "feat: add S3 recording upload and presigned URL client"
```

---

## Task 7: Database Query Functions

**Files:**
- Create: `lib/consultations-db.ts`

- [ ] **Step 1: Create database query module**

Create `lib/consultations-db.ts`:

```typescript
import { sql } from '@vercel/postgres'

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface Consultation {
  id: number
  customer_email: string
  calcom_booking_id: string | null
  calcom_booking_uid: string | null
  daily_room_name: string | null
  daily_room_url: string | null
  provider_email: string | null
  provider_type: string
  consultation_type: string
  plan_tier: string | null
  preferred_date: string | null
  preferred_time: string | null
  reason: string | null
  notes: string | null
  status: string
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  duration_mins: number | null
  recording_consent: boolean
  recording_consent_at: string | null
  reminder_sent_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export interface ConsultationRecording {
  id: number
  consultation_id: number
  daily_recording_id: string | null
  s3_key: string | null
  s3_bucket: string | null
  duration_secs: number | null
  file_size_bytes: number | null
  status: string
  created_at: string
}

export interface ConsultationNote {
  id: number
  consultation_id: number
  provider_email: string
  reason: string | null
  outcome: string | null
  next_steps: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

// ===========================================
// CONSULTATION QUERIES
// ===========================================

export async function createConsultation(data: {
  customerEmail: string
  calcomBookingId: string
  calcomBookingUid: string
  dailyRoomName: string
  dailyRoomUrl: string
  providerEmail: string
  providerType: string
  consultationType: string
  planTier: string
  scheduledAt: string
  reason?: string
}): Promise<number> {
  const result = await sql`
    INSERT INTO consult_requests (
      customer_email, calcom_booking_id, calcom_booking_uid,
      daily_room_name, daily_room_url, provider_email, provider_type,
      consultation_type, plan_tier, scheduled_at, reason, status
    ) VALUES (
      ${data.customerEmail}, ${data.calcomBookingId}, ${data.calcomBookingUid},
      ${data.dailyRoomName}, ${data.dailyRoomUrl}, ${data.providerEmail},
      ${data.providerType}, ${data.consultationType}, ${data.planTier},
      ${data.scheduledAt}, ${data.reason || null}, 'scheduled'
    )
    RETURNING id
  `
  return result.rows[0].id
}

export async function getConsultationById(id: number): Promise<Consultation | null> {
  const result = await sql`
    SELECT * FROM consult_requests WHERE id = ${id}
  `
  return (result.rows[0] as Consultation) || null
}

export async function getConsultationByCalcomBookingId(bookingId: string): Promise<Consultation | null> {
  const result = await sql`
    SELECT * FROM consult_requests WHERE calcom_booking_id = ${bookingId}
  `
  return (result.rows[0] as Consultation) || null
}

export async function getConsultationsForMember(
  email: string,
  options?: { status?: string; limit?: number }
): Promise<Consultation[]> {
  const limit = options?.limit || 50
  if (options?.status) {
    const result = await sql`
      SELECT * FROM consult_requests
      WHERE lower(customer_email) = ${email.toLowerCase()}
        AND status = ${options.status}
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT ${limit}
    `
    return result.rows as Consultation[]
  }
  const result = await sql`
    SELECT * FROM consult_requests
    WHERE lower(customer_email) = ${email.toLowerCase()}
    ORDER BY scheduled_at DESC NULLS LAST
    LIMIT ${limit}
  `
  return result.rows as Consultation[]
}

export async function getConsultationsForProvider(
  providerEmail: string,
  options?: { upcoming?: boolean; limit?: number }
): Promise<Consultation[]> {
  const limit = options?.limit || 50
  if (options?.upcoming) {
    const result = await sql`
      SELECT * FROM consult_requests
      WHERE lower(provider_email) = ${providerEmail.toLowerCase()}
        AND status = 'scheduled'
        AND scheduled_at > NOW()
      ORDER BY scheduled_at ASC
      LIMIT ${limit}
    `
    return result.rows as Consultation[]
  }
  const result = await sql`
    SELECT * FROM consult_requests
    WHERE lower(provider_email) = ${providerEmail.toLowerCase()}
    ORDER BY scheduled_at DESC NULLS LAST
    LIMIT ${limit}
  `
  return result.rows as Consultation[]
}

export async function getMonthlyConsultationCount(email: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::integer AS count
    FROM consult_requests
    WHERE lower(customer_email) = ${email.toLowerCase()}
      AND status IN ('scheduled', 'in_progress', 'completed')
      AND scheduled_at >= date_trunc('month', NOW())
      AND scheduled_at < date_trunc('month', NOW()) + interval '1 month'
  `
  return Number(result.rows[0]?.count) || 0
}

export async function updateConsultationStatus(
  id: number,
  status: string,
  extras?: Record<string, unknown>
): Promise<void> {
  if (status === 'cancelled') {
    await sql`
      UPDATE consult_requests
      SET status = ${status}, cancelled_at = NOW(), cancel_reason = ${(extras?.cancelReason as string) || null}, updated_at = NOW()
      WHERE id = ${id}
    `
  } else if (status === 'completed') {
    await sql`
      UPDATE consult_requests
      SET status = ${status}, ended_at = NOW(),
          duration_mins = ${(extras?.durationMins as number) || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
  } else if (status === 'in_progress') {
    await sql`
      UPDATE consult_requests
      SET status = ${status}, started_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE consult_requests
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `
  }
}

export async function updateRecordingConsent(
  id: number,
  consent: boolean
): Promise<void> {
  await sql`
    UPDATE consult_requests
    SET recording_consent = ${consent},
        recording_consent_at = ${consent ? new Date().toISOString() : null},
        updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function markReminderSent(id: number): Promise<void> {
  await sql`
    UPDATE consult_requests
    SET reminder_sent_at = NOW()
    WHERE id = ${id}
  `
}

export async function getConsultationsNeedingReminder(): Promise<Consultation[]> {
  const result = await sql`
    SELECT * FROM consult_requests
    WHERE status = 'scheduled'
      AND scheduled_at > NOW()
      AND scheduled_at <= NOW() + interval '1 hour'
      AND reminder_sent_at IS NULL
    ORDER BY scheduled_at ASC
  `
  return result.rows as Consultation[]
}

export async function getAllConsultations(options?: {
  status?: string
  providerEmail?: string
  limit?: number
  offset?: number
}): Promise<{ consultations: Consultation[]; total: number }> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  let consultations: Consultation[]
  let total: number

  if (options?.status && options?.providerEmail) {
    const countResult = await sql`
      SELECT COUNT(*)::integer AS total FROM consult_requests
      WHERE status = ${options.status} AND lower(provider_email) = ${options.providerEmail.toLowerCase()}
    `
    total = Number(countResult.rows[0]?.total) || 0
    const result = await sql`
      SELECT * FROM consult_requests
      WHERE status = ${options.status} AND lower(provider_email) = ${options.providerEmail.toLowerCase()}
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `
    consultations = result.rows as Consultation[]
  } else if (options?.status) {
    const countResult = await sql`
      SELECT COUNT(*)::integer AS total FROM consult_requests WHERE status = ${options.status}
    `
    total = Number(countResult.rows[0]?.total) || 0
    const result = await sql`
      SELECT * FROM consult_requests WHERE status = ${options.status}
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `
    consultations = result.rows as Consultation[]
  } else if (options?.providerEmail) {
    const countResult = await sql`
      SELECT COUNT(*)::integer AS total FROM consult_requests
      WHERE lower(provider_email) = ${options.providerEmail.toLowerCase()}
    `
    total = Number(countResult.rows[0]?.total) || 0
    const result = await sql`
      SELECT * FROM consult_requests
      WHERE lower(provider_email) = ${options.providerEmail.toLowerCase()}
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `
    consultations = result.rows as Consultation[]
  } else {
    const countResult = await sql`SELECT COUNT(*)::integer AS total FROM consult_requests`
    total = Number(countResult.rows[0]?.total) || 0
    const result = await sql`
      SELECT * FROM consult_requests
      ORDER BY scheduled_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `
    consultations = result.rows as Consultation[]
  }

  return { consultations, total }
}

// ===========================================
// RECORDING QUERIES
// ===========================================

export async function createRecordingEntry(data: {
  consultationId: number
  dailyRecordingId: string
}): Promise<number> {
  const result = await sql`
    INSERT INTO consultation_recordings (consultation_id, daily_recording_id, status)
    VALUES (${data.consultationId}, ${data.dailyRecordingId}, 'processing')
    RETURNING id
  `
  return result.rows[0].id
}

export async function updateRecordingReady(
  dailyRecordingId: string,
  s3Key: string,
  s3Bucket: string,
  durationSecs: number,
  fileSizeBytes: number
): Promise<void> {
  await sql`
    UPDATE consultation_recordings
    SET s3_key = ${s3Key}, s3_bucket = ${s3Bucket},
        duration_secs = ${durationSecs}, file_size_bytes = ${fileSizeBytes},
        status = 'ready'
    WHERE daily_recording_id = ${dailyRecordingId}
  `
}

export async function updateRecordingFailed(dailyRecordingId: string): Promise<void> {
  await sql`
    UPDATE consultation_recordings SET status = 'failed'
    WHERE daily_recording_id = ${dailyRecordingId}
  `
}

export async function getRecordingForConsultation(consultationId: number): Promise<ConsultationRecording | null> {
  const result = await sql`
    SELECT * FROM consultation_recordings
    WHERE consultation_id = ${consultationId} AND status = 'ready'
    ORDER BY created_at DESC LIMIT 1
  `
  return (result.rows[0] as ConsultationRecording) || null
}

// ===========================================
// NOTES QUERIES
// ===========================================

export async function upsertConsultationNotes(data: {
  consultationId: number
  providerEmail: string
  reason?: string
  outcome?: string
  nextSteps?: string
  internalNotes?: string
}): Promise<number> {
  const result = await sql`
    INSERT INTO consultation_notes (consultation_id, provider_email, reason, outcome, next_steps, internal_notes)
    VALUES (${data.consultationId}, ${data.providerEmail}, ${data.reason || null},
            ${data.outcome || null}, ${data.nextSteps || null}, ${data.internalNotes || null})
    ON CONFLICT (consultation_id) DO UPDATE SET
      reason = EXCLUDED.reason,
      outcome = EXCLUDED.outcome,
      next_steps = EXCLUDED.next_steps,
      internal_notes = EXCLUDED.internal_notes,
      updated_at = NOW()
    RETURNING id
  `
  return result.rows[0].id
}

export async function getNotesForConsultation(
  consultationId: number,
  includeInternal: boolean = false
): Promise<ConsultationNote | null> {
  if (includeInternal) {
    const result = await sql`
      SELECT * FROM consultation_notes WHERE consultation_id = ${consultationId}
    `
    return (result.rows[0] as ConsultationNote) || null
  }
  const result = await sql`
    SELECT id, consultation_id, provider_email, reason, outcome, next_steps, created_at, updated_at
    FROM consultation_notes WHERE consultation_id = ${consultationId}
  `
  return (result.rows[0] as ConsultationNote) || null
}

// ===========================================
// WEBHOOK IDEMPOTENCY
// ===========================================

export async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM consultation_webhook_events WHERE event_id = ${eventId}
  `
  return result.rows.length > 0
}

export async function recordWebhookEvent(eventId: string, eventType: string, source: string): Promise<void> {
  await sql`
    INSERT INTO consultation_webhook_events (event_id, event_type, source)
    VALUES (${eventId}, ${eventType}, ${source})
    ON CONFLICT (event_id) DO NOTHING
  `
}
```

- [ ] **Step 2: Add unique constraint for notes upsert**

The `upsertConsultationNotes` function uses `ON CONFLICT (consultation_id)`. Add a unique index to the migration. Append to `migrations/029_telehealth_consultations.sql`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_consultation_unique ON consultation_notes(consultation_id);
```

- [ ] **Step 3: Commit**

```bash
git add lib/consultations-db.ts migrations/029_telehealth_consultations.sql
git commit -m "feat: add consultation database query functions"
```

---

## Task 8: Email Functions

**Files:**
- Modify: `lib/resend.ts`

- [ ] **Step 1: Read lib/resend.ts to find insertion point**

Read the full file to understand the existing email functions and find where to add new ones.

- [ ] **Step 2: Add consultation email functions**

Add the following functions to `lib/resend.ts` at the end of the file (before the closing of the module, after existing email functions). The file already has `sendBookingConfirmation` and `sendAppointmentReminder` — the new functions are specifically for the telehealth flow with video room links:

```typescript
// ===========================================
// TELEHEALTH CONSULTATION EMAILS
// ===========================================

interface ConsultationConfirmationData {
  patientName: string
  patientEmail: string
  providerName: string
  consultationType: string
  scheduledAt: Date
  joinUrl: string
  cancelUrl: string
}

export async function sendConsultationConfirmationToPatient(
  data: ConsultationConfirmationData
): Promise<EmailResult> {
  try {
    const client = getResendClient()
    const firstName = escapeHtml(data.patientName.split(' ')[0])
    const providerName = escapeHtml(data.providerName)
    const dateStr = data.scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const timeStr = data.scheduledAt.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })

    const content = `
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #2A4542; margin: 0 0 16px;">
        Your consultation is confirmed
      </h1>
      <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: #2A4542; margin: 0 0 24px;">
        Hi ${firstName}, your ${escapeHtml(data.consultationType)} with ${providerName} is all set.
      </p>
      <div style="background: #F5F0E8; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Date:</strong> ${dateStr}
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Time:</strong> ${timeStr}
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0;">
          <strong>Provider:</strong> ${providerName}
        </p>
      </div>
      <div style="text-align: center; margin: 0 0 16px;">
        <a href="${escapeHtml(data.joinUrl)}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
          Join Consultation
        </a>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #2A4542; opacity: 0.6; text-align: center; margin: 0 0 8px;">
        The video room will open 10 minutes before your scheduled time.
      </p>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #2A4542; opacity: 0.6; text-align: center;">
        <a href="${escapeHtml(data.cancelUrl)}" style="color: #2A4542;">Cancel or reschedule</a>
      </p>
    `

    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.patientEmail,
      subject: `Consultation Confirmed — ${dateStr} at ${timeStr}`,
      html: baseEmailTemplate(content),
    })

    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Failed to send consultation confirmation to patient:', err)
    return { success: false, error: String(err) }
  }
}

interface ProviderConsultationNotificationData {
  providerName: string
  providerEmail: string
  patientName: string
  patientEmail: string
  consultationType: string
  scheduledAt: Date
  dailyRoomUrl: string
  reason?: string
}

export async function sendConsultationNotificationToProvider(
  data: ProviderConsultationNotificationData
): Promise<EmailResult> {
  try {
    const client = getResendClient()
    const dateStr = data.scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const timeStr = data.scheduledAt.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })

    const content = `
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #2A4542; margin: 0 0 16px;">
        New consultation scheduled
      </h1>
      <div style="background: #F5F0E8; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Patient:</strong> ${escapeHtml(data.patientName)} (${escapeHtml(data.patientEmail)})
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Type:</strong> ${escapeHtml(data.consultationType)}
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Date:</strong> ${dateStr} at ${timeStr}
        </p>
        ${data.reason ? `<p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0;"><strong>Reason:</strong> ${escapeHtml(data.reason)}</p>` : ''}
      </div>
      <div style="text-align: center; margin: 0 0 16px;">
        <a href="${escapeHtml(data.dailyRoomUrl)}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
          Join Video Room
        </a>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #2A4542; opacity: 0.6; text-align: center;">
        This link will be active at the scheduled time. You can also access it from the provider dashboard.
      </p>
    `

    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.providerEmail,
      subject: `Consultation: ${escapeHtml(data.patientName)} — ${dateStr}`,
      html: baseEmailTemplate(content),
    })

    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Failed to send consultation notification to provider:', err)
    return { success: false, error: String(err) }
  }
}

interface ConsultationReminderData {
  patientName: string
  patientEmail: string
  providerName: string
  scheduledAt: Date
  joinUrl: string
}

export async function sendConsultationReminder(
  data: ConsultationReminderData
): Promise<EmailResult> {
  try {
    const client = getResendClient()
    const firstName = escapeHtml(data.patientName.split(' ')[0])
    const timeStr = data.scheduledAt.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })

    const content = `
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #2A4542; margin: 0 0 16px;">
        Your consultation starts soon
      </h1>
      <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: #2A4542; margin: 0 0 24px;">
        Hi ${firstName}, your consultation with ${escapeHtml(data.providerName)} starts at ${timeStr} — that's in about 1 hour.
      </p>
      <div style="text-align: center; margin: 0 0 24px;">
        <a href="${escapeHtml(data.joinUrl)}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
          Join Consultation
        </a>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #2A4542; opacity: 0.6; text-align: center;">
        The video room opens 10 minutes before start time. Please test your camera and microphone.
      </p>
    `

    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.patientEmail,
      subject: `Reminder: Consultation at ${timeStr}`,
      html: baseEmailTemplate(content),
    })

    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Failed to send consultation reminder:', err)
    return { success: false, error: String(err) }
  }
}

interface ConsultationCompletedData {
  patientName: string
  patientEmail: string
  providerName: string
  durationMins: number
  notesUrl: string
  bookFollowUpUrl: string
}

export async function sendConsultationCompleted(
  data: ConsultationCompletedData
): Promise<EmailResult> {
  try {
    const client = getResendClient()
    const firstName = escapeHtml(data.patientName.split(' ')[0])

    const content = `
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #2A4542; margin: 0 0 16px;">
        Consultation complete
      </h1>
      <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: #2A4542; margin: 0 0 24px;">
        Hi ${firstName}, your ${data.durationMins}-minute consultation with ${escapeHtml(data.providerName)} has been completed.
      </p>
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 24px;">
        Your provider's notes will be available in your dashboard once submitted.
      </p>
      <div style="text-align: center; margin: 0 0 16px;">
        <a href="${escapeHtml(data.notesUrl)}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
          View Notes
        </a>
      </div>
      <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #2A4542; text-align: center;">
        <a href="${escapeHtml(data.bookFollowUpUrl)}" style="color: #2A4542; text-decoration: underline;">Book a follow-up</a>
      </p>
    `

    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: data.patientEmail,
      subject: 'Your CULTR Consultation — Summary',
      html: baseEmailTemplate(content),
    })

    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Failed to send consultation completed email:', err)
    return { success: false, error: String(err) }
  }
}

interface RecordingReadyNotificationData {
  consultationId: number
  patientName: string
  providerName: string
  adminUrl: string
}

export async function sendRecordingReadyNotification(
  data: RecordingReadyNotificationData
): Promise<EmailResult> {
  try {
    const client = getResendClient()
    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

    const content = `
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #2A4542; margin: 0 0 16px;">
        Recording ready
      </h1>
      <div style="background: #F5F0E8; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          <strong>Consultation #${data.consultationId}</strong>
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0 0 8px;">
          Patient: ${escapeHtml(data.patientName)}
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2A4542; margin: 0;">
          Provider: ${escapeHtml(data.providerName)}
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${escapeHtml(data.adminUrl)}" style="display: inline-block; background: #2A4542; color: #FDFBF7; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 999px; text-decoration: none;">
          View Recording
        </a>
      </div>
    `

    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: adminEmail,
      subject: `Recording Ready — Consultation #${data.consultationId}`,
      html: baseEmailTemplate(content),
    })

    return { success: !error, error: error?.message }
  } catch (err) {
    console.error('Failed to send recording ready notification:', err)
    return { success: false, error: String(err) }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/resend.ts
git commit -m "feat: add telehealth consultation email functions"
```

---

## Task 9: Cal.com Webhook

**Files:**
- Create: `app/api/webhook/calcom/route.ts`

- [ ] **Step 1: Create Cal.com webhook handler**

Create `app/api/webhook/calcom/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyCalcomWebhook } from '@/lib/cal'
import { createRoom, createMeetingToken } from '@/lib/daily'
import {
  createConsultation,
  getConsultationByCalcomBookingId,
  updateConsultationStatus,
  getMonthlyConsultationCount,
  isWebhookProcessed,
  recordWebhookEvent,
} from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS, CONSULTATION_TYPES } from '@/lib/config/consultations'
import {
  sendConsultationConfirmationToPatient,
  sendConsultationNotificationToProvider,
} from '@/lib/resend'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-cal-signature-256') || ''

    if (!verifyCalcomWebhook(body, signature)) {
      console.error('Cal.com webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.triggerEvent as string
    const eventId = `calcom_${event.payload?.bookingId || event.payload?.uid}_${eventType}`

    // Idempotency check
    if (await isWebhookProcessed(eventId)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (eventType) {
      case 'BOOKING_CREATED': {
        const payload = event.payload
        const bookingId = String(payload.bookingId)
        const bookingUid = payload.uid
        const attendee = payload.attendees?.[0]
        const organizer = payload.organizer

        if (!attendee?.email) {
          console.error('Cal.com webhook: no attendee email')
          return NextResponse.json({ error: 'No attendee' }, { status: 400 })
        }

        const patientEmail = attendee.email.toLowerCase()
        const patientName = attendee.name || 'Patient'
        const providerEmail = organizer?.email?.toLowerCase() || ''
        const providerName = organizer?.name || 'Provider'
        const scheduledAt = payload.startTime
        const consultationType = payload.metadata?.consultationType || 'initial'
        const planTier = payload.metadata?.planTier || 'core'
        const reason = payload.metadata?.reason || payload.title || ''

        // Validate tier limit
        const tierLimit = TIER_CONSULTATION_LIMITS[planTier] ?? 0
        if (tierLimit !== Infinity) {
          const monthlyCount = await getMonthlyConsultationCount(patientEmail)
          if (monthlyCount >= tierLimit) {
            console.error(`Tier limit exceeded: ${patientEmail} has ${monthlyCount}/${tierLimit}`)
            // Cal.com already created the booking — we can't prevent it
            // But we don't create a room or store it as valid
            await recordWebhookEvent(eventId, eventType, 'calcom')
            return NextResponse.json({ received: true, limitExceeded: true })
          }
        }

        // Create Daily.co room
        const scheduledDate = new Date(scheduledAt)
        const roomExpiry = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours
        const roomName = `cultr-${bookingId}-${Date.now()}`

        const room = await createRoom({
          name: roomName,
          expiresAt: roomExpiry,
          enableRecording: true,
        })

        // Generate provider meeting token (owner)
        const providerToken = await createMeetingToken({
          roomName: room.name,
          isOwner: true,
          expiresAt: roomExpiry,
          userName: providerName,
        })

        const providerRoomUrl = `${room.url}?t=${providerToken}`

        // Store consultation
        const consultationId = await createConsultation({
          customerEmail: patientEmail,
          calcomBookingId: bookingId,
          calcomBookingUid: bookingUid,
          dailyRoomName: room.name,
          dailyRoomUrl: room.url,
          providerEmail,
          providerType: 'cultr_staff',
          consultationType,
          planTier,
          scheduledAt,
          reason,
        })

        const joinUrl = `${siteUrl}/consultations/${consultationId}`
        const cancelUrl = `${siteUrl}/consultations/${consultationId}?action=cancel`
        const typeConfig = CONSULTATION_TYPES[consultationType as keyof typeof CONSULTATION_TYPES]

        // Send emails (independent, don't fail the webhook)
        try {
          await sendConsultationConfirmationToPatient({
            patientName,
            patientEmail,
            providerName,
            consultationType: typeConfig?.label || consultationType,
            scheduledAt: scheduledDate,
            joinUrl,
            cancelUrl,
          })
        } catch (emailErr) {
          console.error('Failed to send patient confirmation:', emailErr)
        }

        try {
          await sendConsultationNotificationToProvider({
            providerName,
            providerEmail,
            patientName,
            patientEmail,
            consultationType: typeConfig?.label || consultationType,
            scheduledAt: scheduledDate,
            dailyRoomUrl: providerRoomUrl,
            reason,
          })
        } catch (emailErr) {
          console.error('Failed to send provider notification:', emailErr)
        }

        break
      }

      case 'BOOKING_CANCELLED': {
        const bookingId = String(event.payload?.bookingId)
        const consultation = await getConsultationByCalcomBookingId(bookingId)
        if (consultation) {
          await updateConsultationStatus(consultation.id, 'cancelled', {
            cancelReason: event.payload?.cancellationReason || 'Cancelled via Cal.com',
          })
        }
        break
      }

      case 'BOOKING_RESCHEDULED': {
        const bookingId = String(event.payload?.bookingId)
        const consultation = await getConsultationByCalcomBookingId(bookingId)
        if (consultation) {
          const newScheduledAt = event.payload?.startTime
          if (newScheduledAt) {
            await updateConsultationStatus(consultation.id, 'scheduled')
            // Update scheduled_at directly
            const { sql } = await import('@vercel/postgres')
            await sql`
              UPDATE consult_requests
              SET scheduled_at = ${newScheduledAt}, updated_at = NOW()
              WHERE id = ${consultation.id}
            `
          }
        }
        break
      }

      default:
        console.log(`Unhandled Cal.com event: ${eventType}`)
    }

    await recordWebhookEvent(eventId, eventType, 'calcom')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Cal.com webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhook/calcom/route.ts
git commit -m "feat: add Cal.com webhook handler for booking events"
```

---

## Task 10: Daily.co Webhook

**Files:**
- Create: `app/api/webhook/daily/route.ts`

- [ ] **Step 1: Create Daily.co webhook handler**

Create `app/api/webhook/daily/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyDailyWebhook, getRecordingDownloadLink } from '@/lib/daily'
import {
  getConsultationById,
  updateConsultationStatus,
  createRecordingEntry,
  updateRecordingReady,
  updateRecordingFailed,
  isWebhookProcessed,
  recordWebhookEvent,
} from '@/lib/consultations-db'
import { buildRecordingKey, uploadRecording } from '@/lib/s3-recordings'
import { sendConsultationCompleted, sendRecordingReadyNotification } from '@/lib/resend'
import { sql } from '@vercel/postgres'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature') || ''

    if (!verifyDailyWebhook(body, signature)) {
      console.error('Daily.co webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.type as string
    const eventId = `daily_${event.event_ts || Date.now()}_${eventType}`

    if (await isWebhookProcessed(eventId)) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (eventType) {
      case 'meeting.ended': {
        const roomName = event.payload?.room_name
        if (!roomName) break

        // Find consultation by room name
        const result = await sql`
          SELECT id, customer_email, provider_email, scheduled_at
          FROM consult_requests
          WHERE daily_room_name = ${roomName}
          LIMIT 1
        `
        const consultation = result.rows[0]
        if (!consultation) {
          console.error(`No consultation found for room: ${roomName}`)
          break
        }

        const startTime = event.payload?.start_ts
          ? new Date(event.payload.start_ts * 1000)
          : null
        const endTime = event.payload?.end_ts
          ? new Date(event.payload.end_ts * 1000)
          : new Date()
        const durationMins = startTime
          ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
          : null

        await updateConsultationStatus(consultation.id, 'completed', {
          durationMins,
        })

        // Send completion email to patient
        try {
          await sendConsultationCompleted({
            patientName: consultation.customer_email.split('@')[0],
            patientEmail: consultation.customer_email,
            providerName: consultation.provider_email || 'Your provider',
            durationMins: durationMins || 0,
            notesUrl: `${siteUrl}/consultations/${consultation.id}`,
            bookFollowUpUrl: `${siteUrl}/consultations`,
          })
        } catch (emailErr) {
          console.error('Failed to send completion email:', emailErr)
        }

        break
      }

      case 'recording.ready-to-download': {
        const recordingId = event.payload?.recording_id
        const roomName = event.payload?.room_name
        if (!recordingId || !roomName) break

        // Find consultation
        const result = await sql`
          SELECT id, customer_email, provider_email
          FROM consult_requests
          WHERE daily_room_name = ${roomName}
          LIMIT 1
        `
        const consultation = result.rows[0]
        if (!consultation) {
          console.error(`No consultation found for recording room: ${roomName}`)
          break
        }

        // Create recording entry
        await createRecordingEntry({
          consultationId: consultation.id,
          dailyRecordingId: recordingId,
        })

        try {
          // Download from Daily.co
          const downloadUrl = await getRecordingDownloadLink(recordingId)
          const downloadRes = await fetch(downloadUrl)
          if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`)

          const buffer = Buffer.from(await downloadRes.arrayBuffer())
          const s3Key = buildRecordingKey(consultation.id)

          // Upload to S3
          const { bucket } = await uploadRecording(s3Key, buffer, buffer.length)

          // Update recording as ready
          const durationSecs = event.payload?.duration
            ? Math.round(Number(event.payload.duration))
            : null
          await updateRecordingReady(
            recordingId,
            s3Key,
            bucket,
            durationSecs || 0,
            buffer.length
          )

          // Notify admin
          try {
            await sendRecordingReadyNotification({
              consultationId: consultation.id,
              patientName: consultation.customer_email,
              providerName: consultation.provider_email || 'Unknown',
              adminUrl: `${siteUrl}/admin/consultations/${consultation.id}`,
            })
          } catch (emailErr) {
            console.error('Failed to send recording notification:', emailErr)
          }
        } catch (err) {
          console.error(`Failed to process recording ${recordingId}:`, err)
          await updateRecordingFailed(recordingId)
        }

        break
      }

      default:
        console.log(`Unhandled Daily.co event: ${eventType}`)
    }

    await recordWebhookEvent(eventId, eventType, 'daily')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Daily.co webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhook/daily/route.ts
git commit -m "feat: add Daily.co webhook handler for meeting and recording events"
```

---

## Task 11: Patient API Routes

**Files:**
- Create: `app/api/consultations/route.ts`
- Create: `app/api/consultations/book/route.ts`
- Create: `app/api/consultations/[id]/route.ts`
- Create: `app/api/consultations/[id]/cancel/route.ts`
- Create: `app/api/consultations/[id]/notes/route.ts`
- Create: `app/api/consultations/[id]/recording/route.ts`

- [ ] **Step 1: Create list consultations route**

Create `app/api/consultations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationsForMember, getMonthlyConsultationCount } from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS } from '@/lib/config/consultations'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const consultations = await getConsultationsForMember(auth.email, { status })
    const monthlyCount = await getMonthlyConsultationCount(auth.email)

    // Determine tier from the most recent consultation or default
    const latestTier = consultations[0]?.plan_tier || 'club'
    const limit = TIER_CONSULTATION_LIMITS[latestTier] ?? 0

    return NextResponse.json({
      success: true,
      consultations,
      usage: {
        used: monthlyCount,
        limit: limit === Infinity ? 'unlimited' : limit,
        remaining: limit === Infinity ? 'unlimited' : Math.max(0, limit - monthlyCount),
      },
    })
  } catch (error) {
    console.error('Failed to list consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create book consultation route**

Create `app/api/consultations/book/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getMonthlyConsultationCount } from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS } from '@/lib/config/consultations'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { planTier, consultationType } = body

    if (!planTier || !consultationType) {
      return NextResponse.json(
        { success: false, error: 'Missing planTier or consultationType' },
        { status: 400 }
      )
    }

    // Validate tier limit
    const tierLimit = TIER_CONSULTATION_LIMITS[planTier] ?? 0
    if (tierLimit === 0) {
      return NextResponse.json(
        { success: false, error: 'Your plan does not include consultations. Please upgrade.' },
        { status: 403 }
      )
    }

    if (tierLimit !== Infinity) {
      const monthlyCount = await getMonthlyConsultationCount(auth.email)
      if (monthlyCount >= tierLimit) {
        return NextResponse.json(
          {
            success: false,
            error: `You have used all ${tierLimit} consultation(s) this month.`,
            used: monthlyCount,
            limit: tierLimit,
          },
          { status: 403 }
        )
      }
    }

    // Booking is handled by Cal.com embed client-side → webhook creates the DB record
    // This endpoint validates eligibility before showing the Cal.com embed
    return NextResponse.json({
      success: true,
      eligible: true,
      calcomOrgSlug: process.env.NEXT_PUBLIC_CALCOM_ORG_SLUG || 'cultrhealth',
    })
  } catch (error) {
    console.error('Failed to validate booking eligibility:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create consultation detail route**

Create `app/api/consultations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation } from '@/lib/consultations-db'
import { createMeetingToken } from '@/lib/daily'
import { updateRecordingConsent } from '@/lib/consultations-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Verify ownership
    if (consultation.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Generate patient meeting token if consultation is scheduled and room exists
    let meetingToken: string | null = null
    if (consultation.daily_room_name && consultation.status === 'scheduled') {
      try {
        const scheduledAt = new Date(consultation.scheduled_at || Date.now())
        const tokenExpiry = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000)
        meetingToken = await createMeetingToken({
          roomName: consultation.daily_room_name,
          isOwner: false,
          expiresAt: tokenExpiry,
          userName: consultation.customer_email.split('@')[0],
        })
      } catch (tokenErr) {
        console.error('Failed to generate meeting token:', tokenErr)
      }
    }

    // Get notes (exclude internal notes for patients)
    const notes = await getNotesForConsultation(Number(id), false)

    return NextResponse.json({
      success: true,
      consultation: {
        ...consultation,
        daily_room_name: undefined, // Don't expose room name to client
      },
      meetingToken,
      notes,
    })
  } catch (error) {
    console.error('Failed to get consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    if (consultation.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update recording consent
    if (typeof body.recordingConsent === 'boolean') {
      await updateRecordingConsent(Number(id), body.recordingConsent)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create cancel route**

Create `app/api/consultations/[id]/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationById, updateConsultationStatus } from '@/lib/consultations-db'
import { cancelBooking } from '@/lib/cal'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    if (consultation.customer_email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (consultation.status !== 'scheduled') {
      return NextResponse.json(
        { success: false, error: 'Only scheduled consultations can be cancelled' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'Cancelled by patient'

    // Cancel in Cal.com
    if (consultation.calcom_booking_uid) {
      try {
        await cancelBooking(consultation.calcom_booking_uid, reason)
      } catch (calErr) {
        console.error('Failed to cancel Cal.com booking:', calErr)
        // Continue — still cancel in our system
      }
    }

    await updateConsultationStatus(consultation.id, 'cancelled', { cancelReason: reason })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create notes route**

Create `app/api/consultations/[id]/notes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation, upsertConsultationNotes } from '@/lib/consultations-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const isProvider = isProviderEmail(auth.email)
    const isPatient = consultation.customer_email.toLowerCase() === auth.email.toLowerCase()

    if (!isProvider && !isPatient) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const notes = await getNotesForConsultation(Number(id), isProvider)
    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Failed to get notes:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const noteId = await upsertConsultationNotes({
      consultationId: Number(id),
      providerEmail: auth.email,
      reason: body.reason,
      outcome: body.outcome,
      nextSteps: body.nextSteps,
      internalNotes: body.internalNotes,
    })

    return NextResponse.json({ success: true, noteId })
  } catch (error) {
    console.error('Failed to save notes:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Create recording route**

Create `app/api/consultations/[id]/recording/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, getRecordingForConsultation } from '@/lib/consultations-db'
import { getRecordingPresignedUrl } from '@/lib/s3-recordings'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Only providers and admins can access recordings
    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const recording = await getRecordingForConsultation(Number(id))
    if (!recording || !recording.s3_key) {
      return NextResponse.json({ success: false, error: 'No recording available' }, { status: 404 })
    }

    const presignedUrl = await getRecordingPresignedUrl(recording.s3_key, 3600)

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        durationSecs: recording.duration_secs,
        fileSizeBytes: Number(recording.file_size_bytes),
        url: presignedUrl,
        expiresIn: 3600,
      },
    })
  } catch (error) {
    console.error('Failed to get recording:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/consultations/
git commit -m "feat: add patient consultation API routes (list, book, detail, cancel, notes, recording)"
```

---

## Task 12: Provider & Admin API Routes + Cron

**Files:**
- Create: `app/api/provider/consultations/route.ts`
- Create: `app/api/provider/consultations/[id]/complete/route.ts`
- Create: `app/api/admin/consultations/route.ts`
- Create: `app/api/admin/consultations/[id]/route.ts`
- Create: `app/api/cron/consultation-reminders/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create provider list route**

Create `app/api/provider/consultations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationsForProvider } from '@/lib/consultations-db'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'

    const consultations = await getConsultationsForProvider(auth.email, { upcoming })

    return NextResponse.json({ success: true, consultations })
  } catch (error) {
    console.error('Failed to list provider consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create provider complete route**

Create `app/api/provider/consultations/[id]/complete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationById, updateConsultationStatus, upsertConsultationNotes } from '@/lib/consultations-db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()

    // Mark as completed if not already
    if (consultation.status !== 'completed') {
      await updateConsultationStatus(consultation.id, 'completed', {
        durationMins: body.durationMins,
      })
    }

    // Save notes
    if (body.reason || body.outcome || body.nextSteps || body.internalNotes) {
      await upsertConsultationNotes({
        consultationId: consultation.id,
        providerEmail: auth.email,
        reason: body.reason,
        outcome: body.outcome,
        nextSteps: body.nextSteps,
        internalNotes: body.internalNotes,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to complete consultation:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create admin list route**

Create `app/api/admin/consultations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getAllConsultations } from '@/lib/consultations-db'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const providerEmail = searchParams.get('provider') || undefined
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const { consultations, total } = await getAllConsultations({
      status,
      providerEmail,
      limit,
      offset,
    })

    return NextResponse.json({ success: true, consultations, total })
  } catch (error) {
    console.error('Failed to list admin consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create admin detail route**

Create `app/api/admin/consultations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getConsultationById, getNotesForConsultation, getRecordingForConsultation } from '@/lib/consultations-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const consultation = await getConsultationById(Number(id))
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const notes = await getNotesForConsultation(Number(id), true)
    const recording = await getRecordingForConsultation(Number(id))

    return NextResponse.json({
      success: true,
      consultation,
      notes,
      recording: recording ? {
        id: recording.id,
        status: recording.status,
        durationSecs: recording.duration_secs,
        fileSizeBytes: Number(recording.file_size_bytes),
        hasRecording: recording.status === 'ready',
      } : null,
    })
  } catch (error) {
    console.error('Failed to get admin consultation detail:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create cron reminder route**

Create `app/api/cron/consultation-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConsultationsNeedingReminder, markReminderSent } from '@/lib/consultations-db'
import { sendConsultationReminder } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consultations = await getConsultationsNeedingReminder()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

    let sent = 0
    let failed = 0

    for (const consultation of consultations) {
      try {
        await sendConsultationReminder({
          patientName: consultation.customer_email.split('@')[0],
          patientEmail: consultation.customer_email,
          providerName: consultation.provider_email || 'Your provider',
          scheduledAt: new Date(consultation.scheduled_at!),
          joinUrl: `${siteUrl}/consultations/${consultation.id}`,
        })
        await markReminderSent(consultation.id)
        sent++
      } catch (err) {
        console.error(`Failed to send reminder for consultation ${consultation.id}:`, err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: consultations.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Cron consultation-reminders error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Add cron to vercel.json**

Read `vercel.json`, then add the new cron entry to the existing `crons` array:

```json
{
  "path": "/api/cron/consultation-reminders",
  "schedule": "*/15 * * * *"
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/provider/consultations/ app/api/admin/consultations/ app/api/cron/consultation-reminders/ vercel.json
git commit -m "feat: add provider, admin, and cron API routes for consultations"
```

---

## Task 13: Frontend Components

**Files:**
- Create: `components/consultations/BookingEmbed.tsx`
- Create: `components/consultations/ConsultationTypeSelector.tsx`
- Create: `components/consultations/TierGateConsultation.tsx`
- Create: `components/consultations/VideoRoom.tsx`
- Create: `components/consultations/WaitingRoom.tsx`
- Create: `components/consultations/PostCallSummary.tsx`
- Create: `components/consultations/ProviderNotesForm.tsx`
- Create: `components/consultations/ConsultationCard.tsx`
- Create: `components/consultations/RecordingPlayer.tsx`

- [ ] **Step 1: Create ConsultationCard**

Create `components/consultations/ConsultationCard.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { Calendar, Clock, Video, X, FileText, Play } from 'lucide-react'
import { CONSULTATION_STATUSES } from '@/lib/config/consultations'

interface ConsultationCardProps {
  consultation: {
    id: number
    status: string
    consultation_type: string
    provider_email: string | null
    scheduled_at: string | null
    duration_mins: number | null
    customer_email?: string
  }
  showPatient?: boolean
  showActions?: boolean
}

export function ConsultationCard({ consultation, showPatient, showActions = true }: ConsultationCardProps) {
  const statusConfig = CONSULTATION_STATUSES[consultation.status as keyof typeof CONSULTATION_STATUSES]
    || { label: consultation.status, bg: 'bg-gray-100', text: 'text-gray-600' }

  const scheduledDate = consultation.scheduled_at ? new Date(consultation.scheduled_at) : null
  const isUpcoming = scheduledDate && scheduledDate > new Date() && consultation.status === 'scheduled'
  const isJoinable = isUpcoming && scheduledDate.getTime() - Date.now() < 10 * 60 * 1000

  return (
    <div className="bg-white rounded-xl border border-brand-primary/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-brand-primary capitalize">
              {consultation.consultation_type.replace('_', ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>

          {scheduledDate && (
            <div className="flex items-center gap-4 text-sm text-brand-primary/60 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}

          {consultation.provider_email && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Provider: {consultation.provider_email}
            </p>
          )}

          {showPatient && consultation.customer_email && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Patient: {consultation.customer_email}
            </p>
          )}

          {consultation.duration_mins != null && consultation.status === 'completed' && (
            <p className="text-xs text-brand-primary/40 mt-1">
              Duration: {consultation.duration_mins} min
            </p>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2 shrink-0">
            {isJoinable && (
              <Link
                href={`/consultations/${consultation.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-xs font-medium hover:bg-forest-light transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Join
              </Link>
            )}
            {isUpcoming && !isJoinable && (
              <Link
                href={`/consultations/${consultation.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-xs font-medium hover:bg-brand-primary/10 transition-colors"
              >
                View
              </Link>
            )}
            {consultation.status === 'completed' && (
              <>
                <Link
                  href={`/consultations/${consultation.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-xs font-medium hover:bg-brand-primary/10 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ConsultationTypeSelector**

Create `components/consultations/ConsultationTypeSelector.tsx`:

```typescript
'use client'

import { CONSULTATION_TYPES, type ConsultationType } from '@/lib/config/consultations'

interface ConsultationTypeSelectorProps {
  selected: ConsultationType
  onChange: (type: ConsultationType) => void
}

export function ConsultationTypeSelector({ selected, onChange }: ConsultationTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(CONSULTATION_TYPES) as [ConsultationType, typeof CONSULTATION_TYPES[ConsultationType]][]).map(
        ([key, config]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected === key
                ? 'bg-brand-primary text-white'
                : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'
            }`}
          >
            {config.label} ({config.duration} min)
          </button>
        )
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create TierGateConsultation**

Create `components/consultations/TierGateConsultation.tsx`:

```typescript
'use client'

import Link from 'next/link'

interface TierGateConsultationProps {
  used: number
  limit: number | 'unlimited'
  tier: string
}

export function TierGateConsultation({ used, limit, tier }: TierGateConsultationProps) {
  if (tier === 'club' || limit === 0) {
    return (
      <div className="bg-cream-dark rounded-xl p-6 text-center">
        <h3 className="font-display text-lg text-brand-primary mb-2">
          Consultations require a paid membership
        </h3>
        <p className="text-sm text-brand-primary/60 mb-4">
          Upgrade to CULTR Core or higher to book telehealth consultations with our providers.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
        >
          View Plans
        </Link>
      </div>
    )
  }

  const remaining = limit === 'unlimited' ? 'unlimited' : Math.max(0, Number(limit) - used)
  const isAtLimit = remaining !== 'unlimited' && remaining <= 0

  return (
    <div className={`rounded-xl p-4 ${isAtLimit ? 'bg-yellow-50 border border-yellow-200' : 'bg-brand-primary/5'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-primary">
          {limit === 'unlimited'
            ? 'Unlimited consultations'
            : `${used} of ${limit} consultation${Number(limit) !== 1 ? 's' : ''} used this month`}
        </span>
        {!isAtLimit && remaining !== 'unlimited' && (
          <span className="text-xs text-brand-primary/60">
            {remaining} remaining
          </span>
        )}
      </div>
      {isAtLimit && (
        <p className="text-sm text-yellow-700 mt-2">
          You&apos;ve used all your consultations this month. They reset at the start of next month.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create BookingEmbed**

Create `components/consultations/BookingEmbed.tsx`:

```typescript
'use client'

import Cal, { getCalApi } from '@calcom/embed-react'
import { useEffect } from 'react'
import type { ConsultationType } from '@/lib/config/consultations'

interface BookingEmbedProps {
  calLink: string
  consultationType: ConsultationType
  memberEmail: string
  planTier: string
}

export function BookingEmbed({ calLink, consultationType, memberEmail, planTier }: BookingEmbedProps) {
  useEffect(() => {
    ;(async function () {
      const cal = await getCalApi()
      cal('ui', {
        theme: 'light',
        styles: { branding: { brandColor: '#2A4542' } },
        hideEventTypeDetails: false,
      })
    })()
  }, [])

  return (
    <Cal
      calLink={calLink}
      style={{ width: '100%', height: '100%', overflow: 'scroll' }}
      config={{
        layout: 'month_view',
        metadata: JSON.stringify({
          consultationType,
          planTier,
          patientEmail: memberEmail,
        }),
      }}
    />
  )
}
```

- [ ] **Step 5: Create WaitingRoom**

Create `components/consultations/WaitingRoom.tsx`:

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, MicOff, VideoOff } from 'lucide-react'
import { RECORDING_CONSENT_TEXT } from '@/lib/config/consultations'

interface WaitingRoomProps {
  providerName: string
  scheduledAt: Date
  onJoin: (consentGiven: boolean) => void
}

export function WaitingRoom({ providerName, scheduledAt, onJoin }: WaitingRoomProps) {
  const [consent, setConsent] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [timeUntil, setTimeUntil] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Camera/mic access error:', err)
      }
    }
    startPreview()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = scheduledAt.getTime() - Date.now()
      if (diff <= 0) {
        setTimeUntil('Starting now')
      } else {
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setTimeUntil(`${mins}m ${secs}s`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [scheduledAt])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = cameraOn))
    }
  }, [cameraOn])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = micOn))
    }
  }, [micOn])

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="font-display text-2xl text-brand-primary mb-2 text-center">
        Waiting Room
      </h2>
      <p className="text-sm text-brand-primary/60 text-center mb-6">
        Your consultation with {providerName} starts in {timeUntil}
      </p>

      {/* Camera preview */}
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`}
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff className="w-12 h-12 text-white/40" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`p-3 rounded-full transition-colors ${micOn ? 'bg-brand-primary/10 text-brand-primary' : 'bg-red-100 text-red-600'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-brand-primary/10 text-brand-primary' : 'bg-red-100 text-red-600'}`}
        >
          {cameraOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Recording consent */}
      <div className="bg-cream-dark rounded-xl p-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-sm text-brand-primary/80">{RECORDING_CONSENT_TEXT}</span>
        </label>
      </div>

      <button
        onClick={() => onJoin(consent)}
        className="w-full py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Join Consultation
      </button>
      {!consent && (
        <p className="text-xs text-brand-primary/40 text-center mt-2">
          You can join without consent — recording will be disabled.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create VideoRoom**

Create `components/consultations/VideoRoom.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { DailyProvider, DailyVideo, useLocalSessionId, useParticipantIds, useMeetingState, useDaily } from '@daily-co/daily-react'
import { Mic, MicOff, Camera, VideoOff, PhoneOff, Monitor } from 'lucide-react'

interface VideoRoomProps {
  roomUrl: string
  token: string
  userName: string
  onLeave: () => void
}

function CallUI({ onLeave }: { onLeave: () => void }) {
  const daily = useDaily()
  const localSessionId = useLocalSessionId()
  const participantIds = useParticipantIds()
  const meetingState = useMeetingState()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (meetingState === 'left-meeting') {
      onLeave()
    }
  }, [meetingState, onLeave])

  const toggleMic = () => {
    daily?.setLocalAudio(!micOn)
    setMicOn(!micOn)
  }

  const toggleCam = () => {
    daily?.setLocalVideo(!camOn)
    setCamOn(!camOn)
  }

  const toggleScreen = async () => {
    try {
      await daily?.startScreenShare()
    } catch {
      // User cancelled or not supported
    }
  }

  const leave = () => {
    daily?.leave()
    onLeave()
  }

  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  const remoteIds = participantIds.filter(id => id !== localSessionId)

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Remote video (main) */}
      <div className="w-full h-full">
        {remoteIds.length > 0 ? (
          <DailyVideo sessionId={remoteIds[0]} type="video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Waiting for provider to join...
          </div>
        )}
      </div>

      {/* Local video (picture-in-picture) */}
      {localSessionId && (
        <div className="absolute bottom-20 right-4 w-40 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
          <DailyVideo sessionId={localSessionId} type="video" mirror style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <img src="/cultr-logo-green.svg" alt="CULTR" className="h-6 opacity-80" />
        <span className="text-white/60 text-sm font-mono">{mins}:{secs}</span>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleCam} className={`p-3 rounded-full ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
          {camOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleScreen} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20">
          <Monitor className="w-5 h-5" />
        </button>
        <button onClick={leave} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export function VideoRoom({ roomUrl, token, userName, onLeave }: VideoRoomProps) {
  const [callObject, setCallObject] = useState<ReturnType<typeof DailyIframe.createCallObject> | null>(null)

  useEffect(() => {
    const co = DailyIframe.createCallObject({
      url: roomUrl,
      token,
      userName,
    })
    setCallObject(co)
    co.join()

    return () => {
      co.leave()
      co.destroy()
    }
  }, [roomUrl, token, userName])

  if (!callObject) {
    return (
      <div className="flex items-center justify-center h-full text-brand-primary/40">
        Connecting...
      </div>
    )
  }

  return (
    <DailyProvider callObject={callObject}>
      <CallUI onLeave={onLeave} />
    </DailyProvider>
  )
}
```

- [ ] **Step 7: Create PostCallSummary**

Create `components/consultations/PostCallSummary.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, FileText, CalendarPlus } from 'lucide-react'

interface PostCallSummaryProps {
  consultationId: number
  providerName: string
  durationMins: number | null
  hasNotes: boolean
}

export function PostCallSummary({ consultationId, providerName, durationMins, hasNotes }: PostCallSummaryProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="font-display text-2xl text-brand-primary mb-2">
        Consultation Complete
      </h2>
      <p className="text-sm text-brand-primary/60 mb-6">
        Your consultation with {providerName} has ended.
      </p>

      <div className="bg-cream-dark rounded-xl p-4 mb-6 text-left">
        {durationMins != null && (
          <div className="flex items-center gap-2 text-sm text-brand-primary mb-2">
            <Clock className="w-4 h-4 text-brand-primary/40" />
            Duration: {durationMins} minutes
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-brand-primary">
          <FileText className="w-4 h-4 text-brand-primary/40" />
          {hasNotes
            ? 'Provider notes are available.'
            : 'Provider notes will appear here once submitted.'}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {hasNotes && (
          <Link
            href={`/consultations/${consultationId}`}
            className="w-full py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors text-center"
          >
            View Notes
          </Link>
        )}
        <Link
          href="/consultations"
          className="w-full py-2.5 bg-brand-primary/5 text-brand-primary rounded-full text-sm font-medium hover:bg-brand-primary/10 transition-colors text-center flex items-center justify-center gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Follow-up
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create ProviderNotesForm**

Create `components/consultations/ProviderNotesForm.tsx`:

```typescript
'use client'

import { useState } from 'react'

interface ProviderNotesFormProps {
  consultationId: number
  existingNotes?: {
    reason?: string | null
    outcome?: string | null
    next_steps?: string | null
    internal_notes?: string | null
  }
  onSaved?: () => void
}

export function ProviderNotesForm({ consultationId, existingNotes, onSaved }: ProviderNotesFormProps) {
  const [reason, setReason] = useState(existingNotes?.reason || '')
  const [outcome, setOutcome] = useState(existingNotes?.outcome || '')
  const [nextSteps, setNextSteps] = useState(existingNotes?.next_steps || '')
  const [internalNotes, setInternalNotes] = useState(existingNotes?.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/consultations/${consultationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, outcome, nextSteps, internalNotes }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSaved(true)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Patient's reason for this consultation..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Outcome</label>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="What was discussed, decided, or prescribed..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">Next Steps</label>
        <textarea
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Follow-up actions for the patient..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-primary mb-1">
          Internal Notes <span className="text-brand-primary/40">(not visible to patient)</span>
        </label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Private notes for the care team..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Notes saved successfully.</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </button>
    </form>
  )
}
```

- [ ] **Step 9: Create RecordingPlayer**

Create `components/consultations/RecordingPlayer.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Play, AlertCircle } from 'lucide-react'

interface RecordingPlayerProps {
  consultationId: number
}

export function RecordingPlayer({ consultationId }: RecordingPlayerProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}/recording`)
        const data = await res.json()
        if (data.success && data.recording?.url) {
          setUrl(data.recording.url)
        } else {
          setError(data.error || 'No recording available')
        }
      } catch {
        setError('Failed to load recording')
      } finally {
        setLoading(false)
      }
    }
    fetchUrl()
  }, [consultationId])

  if (loading) {
    return <div className="text-sm text-brand-primary/40 py-4">Loading recording...</div>
  }

  if (error || !url) {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-primary/40 py-4">
        <AlertCircle className="w-4 h-4" />
        {error || 'No recording available'}
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden bg-gray-900">
      <video
        src={url}
        controls
        className="w-full"
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    </div>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add components/consultations/
git commit -m "feat: add consultation frontend components (booking, video, notes, cards)"
```

---

## Task 14: Frontend Pages

**Files:**
- Create: `app/consultations/page.tsx`
- Create: `app/consultations/[id]/page.tsx`
- Create: `app/consultations/[id]/ConsultationRoomClient.tsx`
- Create: `app/consultations/history/page.tsx`
- Create: `app/provider/consultations/page.tsx`
- Create: `app/provider/consultations/[id]/page.tsx`
- Create: `app/provider/consultations/[id]/ProviderConsultationClient.tsx`
- Create: `app/admin/consultations/page.tsx`
- Create: `app/admin/consultations/AdminConsultationsClient.tsx`

- [ ] **Step 1: Create booking page**

Create `app/consultations/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { BookingPageClient } from './BookingPageClient'

export const metadata = { title: 'Book a Consultation — CULTR Health' }

export default async function ConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <BookingPageClient email={session.email} />
}
```

Create `app/consultations/BookingPageClient.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ConsultationTypeSelector } from '@/components/consultations/ConsultationTypeSelector'
import { TierGateConsultation } from '@/components/consultations/TierGateConsultation'
import { BookingEmbed } from '@/components/consultations/BookingEmbed'
import type { ConsultationType } from '@/lib/config/consultations'

interface BookingPageClientProps {
  email: string
}

export function BookingPageClient({ email }: BookingPageClientProps) {
  const [consultationType, setConsultationType] = useState<ConsultationType>('initial')
  const [usage, setUsage] = useState<{ used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' } | null>(null)
  const [tier, setTier] = useState<string>('club')
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(false)
  const [calcomSlug, setCalcomSlug] = useState('')

  useEffect(() => {
    async function checkEligibility() {
      try {
        // Get usage
        const usageRes = await fetch('/api/consultations')
        const usageData = await usageRes.json()
        if (usageData.success) {
          setUsage(usageData.usage)
          const latestTier = usageData.consultations?.[0]?.plan_tier || 'club'
          setTier(latestTier)

          // Check booking eligibility
          const bookRes = await fetch('/api/consultations/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planTier: latestTier, consultationType }),
          })
          const bookData = await bookRes.json()
          if (bookData.success) {
            setEligible(true)
            setCalcomSlug(bookData.calcomOrgSlug)
          }
        }
      } catch {
        // Failed to check — show default state
      } finally {
        setLoading(false)
      }
    }
    checkEligibility()
  }, [consultationType])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-primary/40">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Book a Consultation
          </h1>
          <p className="text-white/70">
            Schedule a video consultation with one of our providers.
          </p>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {usage && (
            <TierGateConsultation used={usage.used} limit={usage.limit} tier={tier} />
          )}

          {eligible && (
            <>
              <div>
                <h3 className="text-sm font-medium text-brand-primary mb-2">Consultation Type</h3>
                <ConsultationTypeSelector selected={consultationType} onChange={setConsultationType} />
              </div>

              <div className="bg-white rounded-xl border border-brand-primary/10 overflow-hidden" style={{ minHeight: 500 }}>
                <BookingEmbed
                  calLink={`${calcomSlug}/${consultationType}`}
                  consultationType={consultationType}
                  memberEmail={email}
                  planTier={tier}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Create consultation room page**

Create `app/consultations/[id]/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ConsultationRoomClient } from './ConsultationRoomClient'

export const metadata = { title: 'Consultation — CULTR Health' }

export default async function ConsultationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  return <ConsultationRoomClient consultationId={Number(id)} />
}
```

Create `app/consultations/[id]/ConsultationRoomClient.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { WaitingRoom } from '@/components/consultations/WaitingRoom'
import { VideoRoom } from '@/components/consultations/VideoRoom'
import { PostCallSummary } from '@/components/consultations/PostCallSummary'

type RoomState = 'loading' | 'countdown' | 'waiting' | 'in_call' | 'post_call' | 'error'

interface ConsultationRoomClientProps {
  consultationId: number
}

export function ConsultationRoomClient({ consultationId }: ConsultationRoomClientProps) {
  const [state, setState] = useState<RoomState>('loading')
  const [consultation, setConsultation] = useState<Record<string, unknown> | null>(null)
  const [meetingToken, setMeetingToken] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchConsultation() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}`)
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Failed to load consultation')
          setState('error')
          return
        }

        setConsultation(data.consultation)
        setMeetingToken(data.meetingToken)
        setNotes(data.notes)

        if (data.consultation.status === 'completed') {
          setState('post_call')
          return
        }

        if (data.consultation.status === 'cancelled') {
          setError('This consultation has been cancelled.')
          setState('error')
          return
        }

        const scheduledAt = new Date(data.consultation.scheduled_at)
        const minutesUntil = (scheduledAt.getTime() - Date.now()) / 60000

        if (minutesUntil > 10) {
          setState('countdown')
        } else {
          setState('waiting')
        }
      } catch {
        setError('Failed to load consultation')
        setState('error')
      }
    }
    fetchConsultation()
  }, [consultationId])

  const handleJoin = useCallback(async (consentGiven: boolean) => {
    // Save consent
    await fetch(`/api/consultations/${consultationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingConsent: consentGiven }),
    })
    setState('in_call')
  }, [consultationId])

  const handleLeave = useCallback(() => {
    setState('post_call')
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-primary/40">Loading consultation...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <a href="/consultations" className="text-sm text-brand-primary underline">Back to consultations</a>
        </div>
      </div>
    )
  }

  if (state === 'countdown') {
    const scheduledAt = new Date(String(consultation?.scheduled_at))
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="font-display text-2xl text-brand-primary mb-2">Your Consultation</h2>
          <p className="text-brand-primary/60 mb-6">
            Scheduled for {scheduledAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
            {scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
          <p className="text-sm text-brand-primary/40">
            The waiting room will open 10 minutes before your appointment.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-12">
        <WaitingRoom
          providerName={String(consultation?.provider_email || 'Your provider')}
          scheduledAt={new Date(String(consultation?.scheduled_at))}
          onJoin={handleJoin}
        />
      </div>
    )
  }

  if (state === 'in_call' && consultation?.daily_room_url && meetingToken) {
    return (
      <div className="h-screen bg-gray-900 p-4">
        <VideoRoom
          roomUrl={String(consultation.daily_room_url)}
          token={meetingToken}
          userName={String(consultation.customer_email).split('@')[0]}
          onLeave={handleLeave}
        />
      </div>
    )
  }

  if (state === 'post_call') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-12">
        <PostCallSummary
          consultationId={consultationId}
          providerName={String(consultation?.provider_email || 'Your provider')}
          durationMins={consultation?.duration_mins as number | null}
          hasNotes={!!notes}
        />
      </div>
    )
  }

  return null
}
```

- [ ] **Step 3: Create consultation history page**

Create `app/consultations/history/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ConsultationHistoryClient } from './ConsultationHistoryClient'

export const metadata = { title: 'Consultation History — CULTR Health' }

export default async function ConsultationHistoryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <ConsultationHistoryClient />
}
```

Create `app/consultations/history/ConsultationHistoryClient.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'
import Link from 'next/link'

export function ConsultationHistoryClient() {
  const [consultations, setConsultations] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/consultations')
        const data = await res.json()
        if (data.success) setConsultations(data.consultations)
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Consultation History</h1>
            <p className="text-white/70">Your past and upcoming consultations.</p>
          </div>
          <Link
            href="/consultations"
            className="px-5 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Book New
          </Link>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {loading ? (
            <p className="text-brand-primary/40 text-center py-8">Loading...</p>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brand-primary/40 mb-4">No consultations yet.</p>
              <Link
                href="/consultations"
                className="inline-flex px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
              >
                Book Your First
              </Link>
            </div>
          ) : (
            consultations.map((c) => (
              <ConsultationCard key={c.id as number} consultation={c as never} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Create provider consultations page**

Create `app/provider/consultations/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderConsultationsClient } from './ProviderConsultationsClient'

export const metadata = { title: 'Provider Schedule — CULTR Health' }

export default async function ProviderConsultationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/library')

  return <ProviderConsultationsClient providerEmail={session.email} />
}
```

Create `app/provider/consultations/ProviderConsultationsClient.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'

interface ProviderConsultationsClientProps {
  providerEmail: string
}

export function ProviderConsultationsClient({ providerEmail }: ProviderConsultationsClientProps) {
  const [upcoming, setUpcoming] = useState<Array<Record<string, unknown>>>([])
  const [past, setPast] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [upRes, allRes] = await Promise.all([
          fetch('/api/provider/consultations?upcoming=true'),
          fetch('/api/provider/consultations'),
        ])
        const upData = await upRes.json()
        const allData = await allRes.json()
        if (upData.success) setUpcoming(upData.consultations)
        if (allData.success) setPast(allData.consultations.filter((c: Record<string, unknown>) => c.status === 'completed'))
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-brand-cream flex items-center justify-center"><p className="text-brand-primary/40">Loading...</p></div>
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-1">Provider Schedule</h1>
          <p className="text-white/70">{providerEmail}</p>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">Upcoming ({upcoming.length})</h2>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-brand-primary/40">No upcoming consultations.</p>
              ) : (
                upcoming.map((c) => (
                  <ConsultationCard key={c.id as number} consultation={c as never} showPatient />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl text-brand-primary mb-3">Completed ({past.length})</h2>
            <div className="space-y-3">
              {past.length === 0 ? (
                <p className="text-sm text-brand-primary/40">No completed consultations yet.</p>
              ) : (
                past.map((c) => (
                  <ConsultationCard key={c.id as number} consultation={c as never} showPatient />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Create provider consultation detail page**

Create `app/provider/consultations/[id]/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { ProviderConsultationClient } from './ProviderConsultationClient'

export default async function ProviderConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!isProviderEmail(session.email)) redirect('/library')

  const { id } = await params
  return <ProviderConsultationClient consultationId={Number(id)} />
}
```

Create `app/provider/consultations/[id]/ProviderConsultationClient.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { ProviderNotesForm } from '@/components/consultations/ProviderNotesForm'
import { RecordingPlayer } from '@/components/consultations/RecordingPlayer'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'

interface ProviderConsultationClientProps {
  consultationId: number
}

export function ProviderConsultationClient({ consultationId }: ProviderConsultationClientProps) {
  const [consultation, setConsultation] = useState<Record<string, unknown> | null>(null)
  const [notes, setNotes] = useState<Record<string, unknown> | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/consultations/${consultationId}/notes`)
        const data = await res.json()
        if (data.success) setNotes(data.notes)

        // Get consultation details via admin route (providers have admin access)
        const detailRes = await fetch(`/api/admin/consultations/${consultationId}`)
        const detailData = await detailRes.json()
        if (detailData.success) {
          setConsultation(detailData.consultation)
          setHasRecording(detailData.recording?.hasRecording || false)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [consultationId])

  if (loading) {
    return <div className="min-h-screen bg-brand-cream flex items-center justify-center"><p className="text-brand-primary/40">Loading...</p></div>
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className="py-12 px-6 bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold">Consultation #{consultationId}</h1>
        </div>
      </section>

      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {consultation && (
            <ConsultationCard consultation={consultation as never} showPatient showActions={false} />
          )}

          {hasRecording && (
            <div>
              <h3 className="font-display text-lg text-brand-primary mb-3">Recording</h3>
              <RecordingPlayer consultationId={consultationId} />
            </div>
          )}

          <div>
            <h3 className="font-display text-lg text-brand-primary mb-3">Consultation Notes</h3>
            <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
              <ProviderNotesForm
                consultationId={consultationId}
                existingNotes={notes as never}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Create admin consultations page**

Create `app/admin/consultations/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { getSession, isProviderEmail } from '@/lib/auth'
import { AdminConsultationsClient } from './AdminConsultationsClient'

export const metadata = { title: 'Consultations — Admin' }

export default async function AdminConsultationsPage() {
  const session = await getSession()
  if (!session || !isProviderEmail(session.email)) redirect('/admin')

  return <AdminConsultationsClient />
}
```

Create `app/admin/consultations/AdminConsultationsClient.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConsultationCard } from '@/components/consultations/ConsultationCard'
import { CONSULTATION_STATUSES } from '@/lib/config/consultations'

export function AdminConsultationsClient() {
  const [consultations, setConsultations] = useState<Array<Record<string, unknown>>>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        params.set('limit', '50')

        const res = await fetch(`/api/admin/consultations?${params}`)
        const data = await res.json()
        if (data.success) {
          setConsultations(data.consultations)
          setTotal(data.total)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [statusFilter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-brand-primary">Consultations</h1>
          <p className="text-sm text-brand-primary/50">{total} total</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? 'bg-brand-primary text-white' : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'}`}
        >
          All
        </button>
        {Object.entries(CONSULTATION_STATUSES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === key ? 'bg-brand-primary text-white' : `${config.bg} ${config.text} hover:opacity-80`}`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-brand-primary/40 text-center py-8">Loading...</p>
        ) : consultations.length === 0 ? (
          <p className="text-brand-primary/40 text-center py-8">No consultations found.</p>
        ) : (
          consultations.map((c) => (
            <Link key={c.id as number} href={`/provider/consultations/${c.id}`}>
              <ConsultationCard consultation={c as never} showPatient showActions={false} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/consultations/ app/provider/consultations/ app/admin/consultations/
git commit -m "feat: add consultation pages (booking, video room, history, provider, admin)"
```

---

## Task 15: Integration — Sidebar, Dashboard, Layout

**Files:**
- Modify: `components/admin/AdminSidebar.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `components/site/LayoutShell.tsx` (if needed to hide chrome on /consultations/[id])

- [ ] **Step 1: Add Consultations to admin sidebar**

Read `components/admin/AdminSidebar.tsx`, find the CUSTOMERS group in NAV_GROUPS, and add a Consultations entry after Intakes. Import `Video` from lucide-react.

Add to the CUSTOMERS items array:
```typescript
{ label: 'Consultations', href: '/admin/consultations', icon: Video },
```

- [ ] **Step 2: Add upcoming consultations to member dashboard**

Read `app/dashboard/page.tsx`, then add a section that fetches from `/api/consultations?status=scheduled` and displays the next upcoming ConsultationCard with a "Book Consultation" link.

Add the import:
```typescript
import { ConsultationCard } from '@/components/consultations/ConsultationCard'
import Link from 'next/link'
```

Add state and fetch logic in the component:
```typescript
const [upcomingConsultation, setUpcomingConsultation] = useState<Record<string, unknown> | null>(null)

// Inside the existing useEffect fetchProfile, add:
try {
  const consultRes = await fetch('/api/consultations?status=scheduled')
  const consultData = await consultRes.json()
  if (consultData.success && consultData.consultations?.length > 0) {
    setUpcomingConsultation(consultData.consultations[0])
  }
} catch { /* ignore */ }
```

Add the section in the JSX (after the existing dashboard content):
```typescript
{/* Consultations */}
<div className="mt-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-display text-lg text-brand-primary">Consultations</h3>
    <Link href="/consultations" className="text-sm text-brand-primary/60 hover:text-brand-primary underline">
      Book consultation
    </Link>
  </div>
  {upcomingConsultation ? (
    <ConsultationCard consultation={upcomingConsultation as never} />
  ) : (
    <div className="bg-cream-dark rounded-xl p-4 text-center">
      <p className="text-sm text-brand-primary/60 mb-3">No upcoming consultations.</p>
      <Link
        href="/consultations"
        className="inline-flex px-5 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-forest-light transition-colors"
      >
        Book Now
      </Link>
    </div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminSidebar.tsx app/dashboard/page.tsx
git commit -m "feat: integrate consultations into admin sidebar and member dashboard"
```

---

## Task 16: Final Integration & Verification

- [ ] **Step 1: Add consultationsPerMonth to each plan in lib/config/plans.ts**

Read the file, find each plan object, and add the `consultationsPerMonth` field:
- Club: `consultationsPerMonth: 0`
- Core: `consultationsPerMonth: 1`
- Catalyst: `consultationsPerMonth: 2`
- Concierge: `consultationsPerMonth: Infinity`

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors found.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Ensure existing tests still pass.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete telehealth consultations integration (Cal.com + Daily.co + S3)"
```
