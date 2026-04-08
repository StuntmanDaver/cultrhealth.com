-- ============================================================
-- BACKFILL: Creator attribution for historical club orders
-- ============================================================
-- Targets club_orders rows where attributed_creator_id IS NOT NULL
-- but no matching order_attributions entry exists.
--
-- Root causes these rows exist:
--   (A) Pre-Migration 024 coupon validation bug — coupons silently failed,
--       so attributed_creator_id was set on the order but
--       processOrderAttribution was never called.
--   (B) Quote-only carts (all items had null prices) — subtotal = 0 caused
--       the attribution gate to skip (fixed in latest code).
--
-- HOW TO RUN:
--   1. Run STEP 1 (read-only) to audit what will be backfilled.
--   2. Review the output — confirm creator names and commission amounts look right.
--   3. Run STEP 2 in your DB console (Neon / psql / Vercel dashboard).
--   4. Review the VERIFY output BEFORE un-commenting COMMIT.
--   5. COMMIT if everything looks correct, ROLLBACK if not.
-- ============================================================


-- ============================================================
-- STEP 1 (READ-ONLY): Audit — what will be backfilled?
-- ============================================================
SELECT
  co.id              AS order_uuid,
  co.order_number,
  co.member_name,
  co.member_email,
  co.status,
  co.coupon_code,
  co.attribution_method,
  co.subtotal_usd,
  co.created_at,
  c.full_name        AS creator_name,
  c.commission_rate  AS commission_rate_pct,
  ROUND(
    COALESCE(co.subtotal_usd, 0) * c.commission_rate / 100, 2
  )                  AS commission_would_be,
  CASE
    WHEN co.subtotal_usd IS NULL OR co.subtotal_usd = 0
    THEN 'quote-only — attribution tracked, $0 commission until invoiced'
    ELSE 'priced — commission will be recorded as pending'
  END                AS note
FROM club_orders co
JOIN creators c ON c.id = co.attributed_creator_id
WHERE co.attributed_creator_id IS NOT NULL
  AND co.status NOT IN ('pending_approval', 'rejected')
  AND NOT EXISTS (
    SELECT 1 FROM order_attributions oa
    WHERE oa.order_id = co.id::text
  )
ORDER BY c.full_name, co.created_at;


-- ============================================================
-- STEP 2: Execute backfill
-- ============================================================
BEGIN;

WITH

-- Identify every untracked attributed order
orders_to_backfill AS (
  SELECT
    co.id::text                        AS order_id,
    co.attributed_creator_id           AS creator_id,
    co.coupon_code,
    co.member_email,
    COALESCE(co.subtotal_usd, 0)       AS net_revenue,
    COALESCE(
      co.attribution_method,
      CASE
        WHEN co.coupon_code IS NOT NULL THEN 'coupon_code'
        ELSE 'manual'
      END
    )                                  AS attribution_method,
    c.commission_rate,
    ROUND(
      COALESCE(co.subtotal_usd, 0) * c.commission_rate / 100, 2
    )                                  AS commission_amount,
    ac.id                              AS code_id
  FROM club_orders co
  JOIN creators c ON c.id = co.attributed_creator_id
  -- Look up the affiliate code so we can link code_id on the attribution
  LEFT JOIN affiliate_codes ac
         ON ac.creator_id = co.attributed_creator_id
        AND UPPER(ac.code) = UPPER(co.coupon_code)
  WHERE co.attributed_creator_id IS NOT NULL
    AND co.status NOT IN ('pending_approval', 'rejected')
    AND NOT EXISTS (
      SELECT 1 FROM order_attributions oa
      WHERE oa.order_id = co.id::text
    )
),

-- Insert into order_attributions (one row per order)
inserted_attributions AS (
  INSERT INTO order_attributions (
    order_id,
    creator_id,
    attribution_method,
    code_id,
    customer_email,
    net_revenue,
    direct_commission_rate,
    direct_commission_amount,
    is_self_referral,
    is_subscription
  )
  SELECT
    order_id,
    creator_id,
    attribution_method,
    code_id,
    member_email,
    net_revenue,
    commission_rate,
    commission_amount,
    FALSE,   -- is_self_referral
    FALSE    -- is_subscription (club orders are not Stripe subscriptions)
  FROM orders_to_backfill
  RETURNING id, creator_id, net_revenue, direct_commission_rate, direct_commission_amount
)

-- Insert commission_ledger entries for orders where revenue is known.
-- Quote-only orders (net_revenue = 0) get an attribution record for tracking
-- but no commission entry — commission is recorded when the order is invoiced.
INSERT INTO commission_ledger (
  order_attribution_id,
  beneficiary_creator_id,
  commission_type,
  base_amount,
  commission_rate,
  commission_amount,
  tier_level,
  status
)
SELECT
  id                       AS order_attribution_id,
  creator_id               AS beneficiary_creator_id,
  'direct'                 AS commission_type,
  net_revenue              AS base_amount,
  direct_commission_rate   AS commission_rate,
  direct_commission_amount AS commission_amount,
  0                        AS tier_level,
  'pending'                AS status
FROM inserted_attributions
WHERE net_revenue > 0;


-- ============================================================
-- VERIFY: Review this output before committing
-- ============================================================
SELECT
  oa.order_id,
  c.full_name                        AS creator,
  oa.net_revenue,
  oa.direct_commission_rate          AS rate_pct,
  oa.direct_commission_amount        AS commission,
  oa.attribution_method,
  cl.status                          AS ledger_status,
  CASE
    WHEN cl.id IS NULL AND oa.net_revenue = 0
    THEN 'quote-only placeholder (no ledger entry yet)'
    WHEN cl.id IS NULL
    THEN 'WARNING: priced order has no ledger entry'
    ELSE 'ok'
  END                                AS check_note
FROM order_attributions oa
JOIN creators c ON c.id = oa.creator_id
LEFT JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
WHERE oa.created_at >= NOW() - INTERVAL '10 seconds'
ORDER BY c.full_name, oa.created_at;


-- ============================================================
-- Un-comment ONE of these after reviewing the VERIFY output:
-- ============================================================
-- COMMIT;   -- everything looks correct
-- ROLLBACK; -- something is wrong, no changes saved
