-- Migration 060: Fix Mary Cooper's commission_rate display inconsistency
-- Her creators.commission_rate showed 10% in the admin network table, but
-- her affiliate codes (MARY, MARY20) both discount at 20% and her only
-- historical order_attribution direct_commission_rate was 20%. Align the
-- display rate with the actual economics she's been operating under.
UPDATE creators
SET commission_rate = 20.00, updated_at = NOW()
WHERE lower(full_name) = 'mary cooper'
  AND commission_rate = 10.00;
