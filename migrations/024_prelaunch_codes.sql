-- Migration 024: Prelaunch Coupon Program
-- Adds expiry, program type, and company-owned code support to affiliate_codes

-- New columns for prelaunch program
ALTER TABLE affiliate_codes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow company-owned prelaunch codes (no creator assignment)
ALTER TABLE affiliate_codes ALTER COLUMN creator_id DROP NOT NULL;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_program_type ON affiliate_codes (program_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_expires_at ON affiliate_codes (expires_at) WHERE expires_at IS NOT NULL;
