-- Migration 068: Xero Integration
-- Adds Xero OAuth2 token storage and invoice reference to club_orders.

-- Xero OAuth2 token storage (mirrors qb_tokens pattern)
CREATE TABLE IF NOT EXISTS xero_tokens (
  key TEXT PRIMARY KEY DEFAULT 'main',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Xero invoice reference to club_orders
ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT;

CREATE INDEX IF NOT EXISTS idx_club_orders_xero_invoice_id
  ON club_orders (xero_invoice_id)
  WHERE xero_invoice_id IS NOT NULL;

-- Healthie payment/appointment tracking columns on member_onboarding
ALTER TABLE member_onboarding ADD COLUMN IF NOT EXISTS payment_failed BOOLEAN DEFAULT FALSE;
ALTER TABLE member_onboarding ADD COLUMN IF NOT EXISTS appointment_completed BOOLEAN DEFAULT FALSE;
