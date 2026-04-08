-- ============================================================
-- BACKFILL: Mark click_events as converted for existing order attributions
-- ============================================================
-- Fixes historical gap where coupon-code attributions didn't mark
-- the originating click event as converted, even though the user
-- DID arrive via a tracking link before using a coupon.
--
-- Also syncs tracking_links.conversion_count to match actual
-- converted click events.
--
-- HOW TO RUN:
--   1. Run STEP 1 (read-only) to audit current state.
--   2. Run STEP 2 to backfill.
--   3. Review STEP 3 verify output before COMMIT.
-- ============================================================


-- ============================================================
-- STEP 1 (READ-ONLY): Audit — click events that should be converted
-- ============================================================
-- Shows click events linked to order_attributions but not yet marked converted
SELECT
  ce.id AS click_event_id,
  ce.creator_id,
  c.full_name AS creator_name,
  tl.slug AS link_slug,
  ce.converted,
  oa.order_id,
  oa.attribution_method,
  oa.created_at AS order_date
FROM click_events ce
JOIN order_attributions oa ON oa.click_event_id = ce.id
JOIN creators c ON c.id = ce.creator_id
LEFT JOIN tracking_links tl ON tl.id = ce.link_id
WHERE ce.converted = FALSE
ORDER BY oa.created_at;


-- ============================================================
-- STEP 2: Execute backfill
-- ============================================================
BEGIN;

-- Mark click_events as converted where an order_attribution references them
UPDATE click_events ce
SET converted = TRUE, order_id = oa.order_id
FROM order_attributions oa
WHERE oa.click_event_id = ce.id
  AND ce.converted = FALSE;

-- Sync tracking_links.conversion_count to match actual converted clicks
UPDATE tracking_links tl
SET conversion_count = sub.real_count
FROM (
  SELECT link_id, COUNT(*) AS real_count
  FROM click_events
  WHERE converted = TRUE AND link_id IS NOT NULL
  GROUP BY link_id
) sub
WHERE sub.link_id = tl.id
  AND tl.conversion_count != sub.real_count;


-- ============================================================
-- STEP 3 (VERIFY): Review before committing
-- ============================================================
SELECT
  tl.slug,
  c.full_name AS creator,
  tl.click_count,
  tl.conversion_count,
  (SELECT COUNT(*) FROM click_events WHERE link_id = tl.id AND converted = TRUE) AS real_conversions
FROM tracking_links tl
LEFT JOIN creators c ON c.id = tl.creator_id
ORDER BY tl.click_count DESC;


-- ============================================================
-- Un-comment ONE:
-- ============================================================
-- COMMIT;
-- ROLLBACK;
