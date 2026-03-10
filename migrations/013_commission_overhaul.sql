-- ============================================================
-- Migration 013: Commission System Overhaul
-- Three-stream commission model: direct membership, direct product,
-- recruitment override. 25% total cap first 6 months, then flat 10%.
-- ============================================================

-- 1. Add code_type to affiliate_codes (membership vs product)
ALTER TABLE affiliate_codes
  ADD COLUMN IF NOT EXISTS code_type TEXT DEFAULT 'general'
  CHECK (code_type IN ('membership', 'product', 'general'));

-- 2. Add new columns to creators
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS active_member_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS creator_start_date TIMESTAMPTZ;

-- Backfill creator_start_date from approved_at
UPDATE creators SET creator_start_date = approved_at WHERE creator_start_date IS NULL AND approved_at IS NOT NULL;

-- 3. Add subscription tracking columns to order_attributions
ALTER TABLE order_attributions
  ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_payment_number INTEGER DEFAULT NULL;

-- 4. Create creator_customer_portfolio table
CREATE TABLE IF NOT EXISTS creator_customer_portfolio (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  customer_email        TEXT NOT NULL,
  stripe_subscription_id TEXT,
  subscription_status   TEXT DEFAULT 'active'
                        CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'paused')),
  first_payment_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_payment_at       TIMESTAMPTZ,
  payment_count         INTEGER NOT NULL DEFAULT 1,
  attribution_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_creator_customer
  ON creator_customer_portfolio (creator_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_portfolio_creator
  ON creator_customer_portfolio (creator_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_subscription
  ON creator_customer_portfolio (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_active
  ON creator_customer_portfolio (creator_id, attribution_active, subscription_status);

-- 5. Index for creator_start_date lookups
CREATE INDEX IF NOT EXISTS idx_creators_start_date ON creators (creator_start_date);
