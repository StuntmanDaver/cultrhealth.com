-- Migration 031: Create missing tables (memberships, pending_intakes, asher_orders)
-- and add email column to memberships
-- These tables are referenced throughout the app but were never created in the database

-- ============================================================
-- MEMBERSHIPS TABLE (was never in any migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_tier VARCHAR(50),
  subscription_status VARCHAR(50) DEFAULT 'active',
  asher_patient_id INTEGER,
  email VARCHAR(255),
  payment_provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_memberships_customer_id ON memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_subscription_id ON memberships(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_memberships_asher_patient_id ON memberships(asher_patient_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_provider ON memberships(payment_provider);

-- ============================================================
-- PENDING INTAKES TABLE (from migration 008, never run)
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
-- ASHER ORDERS TABLE (from migration 008, never run)
-- ============================================================

CREATE TABLE IF NOT EXISTS asher_orders (
  id SERIAL PRIMARY KEY,
  asher_order_id INTEGER,
  asher_patient_id INTEGER,
  customer_email VARCHAR(255) NOT NULL,
  order_type VARCHAR(50) DEFAULT 'new',
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
-- ASHER MED SYNC CACHE (used by asher-dashboard endpoint)
-- ============================================================

CREATE TABLE IF NOT EXISTS asher_sync_cache (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  data JSONB,
  synced_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ADD ASHER PATIENT ID TO ORDERS TABLE (if missing)
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_orders_asher_patient_id ON orders(asher_patient_id);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE memberships IS 'Stripe subscription memberships for paid plan tiers';
COMMENT ON TABLE pending_intakes IS 'Stores intake form state after Stripe checkout, before Asher Med submission';
COMMENT ON TABLE asher_orders IS 'Tracks orders created in Asher Med Partner Portal';
