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
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_consultation_unique ON consultation_notes(consultation_id);

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
