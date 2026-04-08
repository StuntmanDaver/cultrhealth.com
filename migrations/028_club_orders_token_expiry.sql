-- Migration 028: Add token_expires_at to club_orders for cryptographic expiry enforcement
-- Fixes: HMAC approval token expiry was bypassable via URL param tampering
-- Now expiry is enforced at DB level — cannot be bypassed without knowing JWT_SECRET

ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Backfill existing rows: treat legacy tokens as expired (safer than treating them as valid forever)
-- Admins will need to re-request approval for any pending orders after this migration.
-- To instead keep existing pending orders valid, set to: NOW() + INTERVAL '48 hours'
UPDATE club_orders
  SET token_expires_at = NOW() - INTERVAL '1 second'
  WHERE token_expires_at IS NULL AND approval_token IS NOT NULL;

COMMENT ON COLUMN club_orders.token_expires_at IS 'Timestamp after which the HMAC approval_token is no longer valid. NULL = no expiry (legacy rows).';
