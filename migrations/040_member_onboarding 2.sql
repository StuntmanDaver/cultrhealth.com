-- Migration 040: Member Onboarding Progress Tracking
-- Tracks each member's progress through the post-checkout onboarding flow:
-- 1. Welcome (auto after checkout)
-- 2. Blood test kit ordered (SiPhox)
-- 3. Medical intake completed (Healthie)
-- 4. Appointment scheduled (Calendly)
-- 5. Complete

CREATE TABLE IF NOT EXISTS member_onboarding (
  id SERIAL PRIMARY KEY,
  membership_id INTEGER REFERENCES memberships(id),
  email TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'welcome',
  blood_test_ordered BOOLEAN DEFAULT FALSE,
  intake_completed BOOLEAN DEFAULT FALSE,
  appointment_scheduled BOOLEAN DEFAULT FALSE,
  healthie_patient_id TEXT,
  siphox_customer_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_onboarding_email ON member_onboarding (email);
CREATE INDEX IF NOT EXISTS idx_member_onboarding_membership ON member_onboarding (membership_id);
