-- Migration 052: Store actual coupon discount dollars on club_orders
-- Motivation: product-specific coupons (e.g. RETA — R3TA only) discount a
-- subset of line items, so the historical SQL estimate of
--   discount = revenue * pct / (100 - pct)
-- over-reports the discount for mixed carts. Persisting the actual amount at
-- order creation lets admin analytics aggregate the truth with SUM().

ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS coupon_discount_usd NUMERIC(10,2);

-- Backfill historical rows with the legacy formula so existing reports keep
-- their current values (the formula is exact for order-wide coupons, which is
-- every coupon that shipped before this migration).
UPDATE club_orders
SET coupon_discount_usd = ROUND(
  (subtotal_usd * discount_percent / (100.0 - discount_percent))::numeric,
  2
)
WHERE coupon_discount_usd IS NULL
  AND coupon_code IS NOT NULL
  AND coupon_code <> ''
  AND discount_percent IS NOT NULL
  AND discount_percent > 0
  AND discount_percent < 100
  AND subtotal_usd IS NOT NULL;
