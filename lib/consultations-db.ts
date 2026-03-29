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
