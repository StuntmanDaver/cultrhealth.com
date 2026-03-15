-- Migration 020: SiPhox Health Integration Tables
-- Creates tables for SiPhox customer mapping, kit order tracking, and biomarker report caching.
-- Run manually: node scripts/run-migration.mjs
--
-- Tables:
--   siphox_customers    - Maps CULTR members (by phone_e164) to SiPhox customer IDs
--   siphox_kit_orders   - Tracks kit orders with status, tracking, and Stripe linkage
--   siphox_reports      - Cached biomarker reports (immutable after insert)

-- ============================================================
-- Table 1: siphox_customers (customer mapping)
-- Links CULTR portal sessions to SiPhox customer records.
-- phone_e164 is the shared key between portal_sessions and SiPhox.
-- ============================================================

CREATE TABLE IF NOT EXISTS siphox_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 VARCHAR(20) NOT NULL,
  siphox_customer_id VARCHAR(100) NOT NULL,
  external_id VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_customers_phone_e164
  ON siphox_customers (phone_e164);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_customers_siphox_customer_id
  ON siphox_customers (siphox_customer_id);

-- ============================================================
-- Table 2: siphox_kit_orders (kit order tracking)
-- Tracks SiPhox kit orders from creation through results.
-- References siphox_customers via siphox_customer_id.
-- ============================================================

CREATE TABLE IF NOT EXISTS siphox_kit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siphox_customer_id VARCHAR(100) NOT NULL REFERENCES siphox_customers(siphox_customer_id),
  siphox_order_id VARCHAR(100) NOT NULL,
  kit_type VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ordered',
  tracking_number VARCHAR(200),
  stripe_subscription_id VARCHAR(255),
  is_test_order BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_kit_orders_siphox_order_id
  ON siphox_kit_orders (siphox_order_id);

CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_siphox_customer_id
  ON siphox_kit_orders (siphox_customer_id);

-- ============================================================
-- Table 3: siphox_reports (cached biomarker reports, immutable)
-- Stores Zod-validated biomarker report data from SiPhox API.
-- Reports are immutable -- insert only, never updated.
-- ============================================================

CREATE TABLE IF NOT EXISTS siphox_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siphox_customer_id VARCHAR(100) NOT NULL REFERENCES siphox_customers(siphox_customer_id),
  siphox_report_id VARCHAR(100) NOT NULL,
  report_data JSONB NOT NULL,
  suggestions JSONB,
  report_status VARCHAR(50),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_reports_siphox_report_id
  ON siphox_reports (siphox_report_id);

CREATE INDEX IF NOT EXISTS idx_siphox_reports_siphox_customer_id
  ON siphox_reports (siphox_customer_id);
