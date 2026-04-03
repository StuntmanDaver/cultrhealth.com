-- Migration 037: Add generic EHR identity columns
-- Adds ehr_patient_id (TEXT) and ehr_provider (TEXT) to all tables that have asher_patient_id.
-- Backfills from existing asher_patient_id values. Does NOT drop asher_patient_id — both coexist
-- during the Healthie migration transition period.

-- ============================================
-- MEMBERSHIPS TABLE
-- ============================================
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE memberships
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- ORDERS TABLE
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE orders
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- DAILY_LOGS TABLE
-- ============================================
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE daily_logs
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- BIOMARKER_ENTRIES TABLE
-- ============================================
ALTER TABLE biomarker_entries ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE biomarker_entries ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE biomarker_entries
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- PROTOCOL_OUTCOMES TABLE
-- ============================================
ALTER TABLE protocol_outcomes ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE protocol_outcomes ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE protocol_outcomes
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- RESILIENCE_SCORES TABLE
-- ============================================
ALTER TABLE resilience_scores ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE resilience_scores ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE resilience_scores
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- PROTOCOL_GENERATIONS TABLE
-- ============================================
ALTER TABLE protocol_generations ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE protocol_generations ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE protocol_generations
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;

-- ============================================
-- PORTAL_SESSIONS TABLE
-- ============================================
ALTER TABLE portal_sessions ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
ALTER TABLE portal_sessions ADD COLUMN IF NOT EXISTS ehr_provider TEXT DEFAULT 'asher';

UPDATE portal_sessions
SET ehr_patient_id = asher_patient_id::text,
    ehr_provider = 'asher'
WHERE asher_patient_id IS NOT NULL
  AND ehr_patient_id IS NULL;
