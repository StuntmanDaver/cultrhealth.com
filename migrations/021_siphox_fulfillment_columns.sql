-- Migration 021: Add fulfillment columns to siphox_kit_orders
-- Extends the existing table from migration 020 with columns needed for
-- automated kit ordering via Stripe checkout webhook and cron retry logic.

-- New fulfillment status column (6 values)
-- pending_intake: waiting for member to submit intake (no address yet)
-- pending_fulfillment: ready to order but SiPhox API failed, queued for retry
-- processing: SiPhox API called, awaiting confirmation
-- fulfilled: kit order confirmed by SiPhox
-- failed: max retries exhausted or permanent error
-- needs_credits: SiPhox credit balance exhausted, admin notified
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'pending_fulfillment';

-- Retry tracking
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Link back to originating Stripe checkout
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Denormalized for email/lookup without joining
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE siphox_kit_orders ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50);

-- Partial index for cron job queries (only scans rows needing processing)
CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_fulfillment_pending
  ON siphox_kit_orders (fulfillment_status)
  WHERE fulfillment_status IN ('pending_intake', 'pending_fulfillment');

-- Index for refund lookups by checkout session
CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_checkout_session
  ON siphox_kit_orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
