-- Migration 056: Add lead capture columns to quiz_responses
-- Stores contact info captured after quiz completion (before checkout)

ALTER TABLE quiz_responses
  ADD COLUMN IF NOT EXISTS lead_first_name TEXT,
  ADD COLUMN IF NOT EXISTS lead_last_name  TEXT,
  ADD COLUMN IF NOT EXISTS lead_email      TEXT,
  ADD COLUMN IF NOT EXISTS lead_phone      TEXT,
  ADD COLUMN IF NOT EXISTS lead_captured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_lead_email ON quiz_responses (lead_email) WHERE lead_email IS NOT NULL;
