-- Migration 012: Drop Healthie columns and rename to Asher Med
-- RUN THIS AFTER deploying the code changes to production
-- This migration:
-- 1. Adds asher_patient_id column where missing
-- 2. Copies healthie_patient_id values to asher_patient_id
-- 3. Drops healthie_patient_id columns
-- 4. Drops Healthie-specific columns from protocol_generations

-- ============================================
-- MEMBERSHIPS TABLE
-- ============================================
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE memberships
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE memberships DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- ORDERS TABLE
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE orders
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE orders DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- DAILY_LOGS TABLE
-- ============================================
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE daily_logs
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE daily_logs DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- BIOMARKER_ENTRIES TABLE
-- ============================================
ALTER TABLE biomarker_entries ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE biomarker_entries
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE biomarker_entries DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- PROTOCOL_OUTCOMES TABLE
-- ============================================
ALTER TABLE protocol_outcomes ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE protocol_outcomes
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE protocol_outcomes DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- RESILIENCE_SCORES TABLE
-- ============================================
ALTER TABLE resilience_scores ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;

UPDATE resilience_scores
SET asher_patient_id = healthie_patient_id::integer
WHERE healthie_patient_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE resilience_scores DROP COLUMN IF EXISTS healthie_patient_id;

-- ============================================
-- PROTOCOL_GENERATIONS TABLE
-- ============================================
ALTER TABLE protocol_generations ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;
ALTER TABLE protocol_generations ADD COLUMN IF NOT EXISTS protocol_notes TEXT;

UPDATE protocol_generations
SET asher_patient_id = patient_healthie_id::integer
WHERE patient_healthie_id IS NOT NULL
  AND asher_patient_id IS NULL;

ALTER TABLE protocol_generations DROP COLUMN IF EXISTS patient_healthie_id;
ALTER TABLE protocol_generations DROP COLUMN IF EXISTS healthie_care_plan_id;
