-- Migration 061: Backfill coupon_discount_usd for club orders where the
-- column is null but a coupon is on file.
--
-- Context: migration 052 added coupon_discount_usd and backfilled historical
-- rows, but some orders created afterward skipped the persistence (older code
-- paths, dismissed/cancelled states, etc). getCreatorROI and getCouponStats
-- both fall back to a SQL formula when the column is null, but keeping the
-- persisted column authoritative is simpler and avoids formula drift for
-- future product-specific coupons.
UPDATE club_orders
SET coupon_discount_usd = ROUND(
  (subtotal_usd * discount_percent / (100.0 - discount_percent))::numeric,
  2
),
    updated_at = NOW()
WHERE coupon_discount_usd IS NULL
  AND coupon_code IS NOT NULL
  AND coupon_code <> ''
  AND discount_percent IS NOT NULL
  AND discount_percent > 0
  AND discount_percent < 100
  AND subtotal_usd IS NOT NULL
  AND subtotal_usd > 0;
