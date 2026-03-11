-- Migration 014: Portal Sessions
-- Creates the portal_sessions table for phone-to-patient mapping cache.
-- Used by the phone OTP authentication flow to cache verified phone numbers
-- and their associated Asher Med patient IDs.

CREATE TABLE IF NOT EXISTS portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  phone_e164 VARCHAR(20) NOT NULL,
  asher_patient_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index on E.164 phone number (used for all lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_sessions_phone_e164
  ON portal_sessions (phone_e164);

-- Index on asher_patient_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_portal_sessions_asher_patient_id
  ON portal_sessions (asher_patient_id);
