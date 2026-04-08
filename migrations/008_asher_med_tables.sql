-- Migration 008: Asher Med Integration Tables
-- Adds tables for Asher Med order tracking and pending intakes
-- Replaces Healthie-specific columns with Asher Med equivalents

-- ============================================================
-- PENDING INTAKES TABLE
-- Stores intake form data after checkout, before form completion
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_intakes (
  id SERIAL PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  customer_email VARCHAR(255) NOT NULL,
  plan_tier VARCHAR(50) NOT NULL,
  intake_status VARCHAR(50) DEFAULT 'pending',
  intake_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_intakes_email ON pending_intakes(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_pending_intakes_status ON pending_intakes(intake_status);
CREATE INDEX IF NOT EXISTS idx_pending_intakes_created ON pending_intakes(created_at);

-- ============================================================
-- ASHER ORDERS TABLE
-- Tracks orders created in Asher Med system
-- ============================================================

CREATE TABLE IF NOT EXISTS asher_orders (
  id SERIAL PRIMARY KEY,
  asher_order_id INTEGER,
  asher_patient_id INTEGER,
  customer_email VARCHAR(255) NOT NULL,
  order_type VARCHAR(50) DEFAULT 'new', -- 'new' or 'renewal'
  order_status VARCHAR(50),
  partner_note TEXT,
  medication_packages JSONB,
  stripe_payment_intent_id VARCHAR(255),
  pending_intake_id INTEGER REFERENCES pending_intakes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asher_orders_email ON asher_orders(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_asher_orders_asher_id ON asher_orders(asher_order_id);
CREATE INDEX IF NOT EXISTS idx_asher_orders_patient_id ON asher_orders(asher_patient_id);
CREATE INDEX IF NOT EXISTS idx_asher_orders_status ON asher_orders(order_status);

-- ============================================================
-- ADD ASHER PATIENT ID TO MEMBERSHIPS TABLE
-- Replaces healthie_patient_id (will be renamed in production)
-- ============================================================

-- Add new column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE memberships ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

-- Create index for asher_patient_id
CREATE INDEX IF NOT EXISTS idx_memberships_asher_patient_id ON memberships(asher_patient_id);

-- ============================================================
-- ADD ASHER PATIENT ID TO ORDERS TABLE
-- For product orders linked to Asher Med patients
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_asher_patient_id ON orders(asher_patient_id);

-- ============================================================
-- ADD ASHER PATIENT ID TO DAILY LOGS TABLE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_logs' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE daily_logs ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

-- ============================================================
-- ADD ASHER PATIENT ID TO BIOMARKER ENTRIES TABLE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'biomarker_entries' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE biomarker_entries ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

-- ============================================================
-- ADD ASHER PATIENT ID TO PROTOCOL OUTCOMES TABLE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocol_outcomes' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE protocol_outcomes ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

-- ============================================================
-- ADD ASHER PATIENT ID TO RESILIENCE SCORES TABLE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resilience_scores' AND column_name = 'asher_patient_id'
  ) THEN
    ALTER TABLE resilience_scores ADD COLUMN asher_patient_id INTEGER;
  END IF;
END $$;

-- ============================================================
-- INTAKE FORM SESSIONS TABLE
-- Tracks form progress for analytics and recovery
-- ============================================================

CREATE TABLE IF NOT EXISTS intake_form_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  form_type VARCHAR(50) DEFAULT 'new', -- 'new' or 'renewal'
  current_step INTEGER DEFAULT 0,
  form_data JSONB,
  completed_steps TEXT[],
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  submitted_at TIMESTAMP,
  asher_order_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_intake_sessions_email ON intake_form_sessions(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_intake_sessions_session_id ON intake_form_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_created ON intake_form_sessions(started_at);

-- ============================================================
-- UPLOADED FILES TRACKING
-- Tracks files uploaded to Asher Med S3
-- ============================================================

CREATE TABLE IF NOT EXISTS asher_uploaded_files (
  id SERIAL PRIMARY KEY,
  s3_key VARCHAR(500) UNIQUE NOT NULL,
  content_type VARCHAR(100),
  file_purpose VARCHAR(100), -- 'id_document', 'telehealth_signature', 'compounded_consent', 'prescription_photo'
  customer_email VARCHAR(255),
  intake_session_id INTEGER REFERENCES intake_form_sessions(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_email ON asher_uploaded_files(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_uploaded_files_purpose ON asher_uploaded_files(file_purpose);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE pending_intakes IS 'Stores intake form state after Stripe checkout, before Asher Med submission';
COMMENT ON TABLE asher_orders IS 'Tracks orders created in Asher Med Partner Portal';
COMMENT ON TABLE intake_form_sessions IS 'Tracks intake form progress for recovery and analytics';
COMMENT ON TABLE asher_uploaded_files IS 'Tracks files uploaded to Asher Med S3 storage';
