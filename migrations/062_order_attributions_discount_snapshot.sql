-- Migration 062: Snapshot discount rate on order_attributions.
--
-- Problem: getCreatorROI derives the Stripe-side discount for a historical
-- order by joining order_attributions to affiliate_codes and using the CURRENT
-- ac.discount_value. If the code's discount rate changes (e.g. STEWART1 moved
-- 10% → 20% via migration 030), historical ROI numbers silently shift.
--
-- Fix: store the rate in effect at order time on the attribution row, mirroring
-- the pattern already used for direct_commission_rate. getCreatorROI can then
-- COALESCE(oa.discount_rate, ac.discount_value) so historical rows stay stable
-- and new rows use the snapshotted value.
ALTER TABLE order_attributions
  ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5,2);

COMMENT ON COLUMN order_attributions.discount_rate IS
  'Discount % in effect when the attribution was recorded. NULL for legacy rows; fall back to affiliate_codes.discount_value.';

-- Backfill existing rows from the current affiliate_codes value. No existing
-- coupon-code Stripe attributions exist in production today, so this is a
-- no-op in current data, but it future-proofs the column for older rows if
-- any do exist.
UPDATE order_attributions oa
SET discount_rate = ac.discount_value
FROM affiliate_codes ac
WHERE oa.code_id = ac.id
  AND oa.discount_rate IS NULL
  AND ac.discount_value IS NOT NULL;
