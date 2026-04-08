-- Add Stripe promotion code tracking to affiliate_codes
ALTER TABLE affiliate_codes
  ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT;

-- Index for lookup by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_stripe_promo
  ON affiliate_codes(stripe_promotion_code_id)
  WHERE stripe_promotion_code_id IS NOT NULL;
