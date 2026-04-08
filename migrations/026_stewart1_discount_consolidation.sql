-- Migration 026: Stewart coupon consolidation
-- STEWART1: discount 20% → 10%, code_type membership → general (works for all order types)
-- STEWART110: deactivated (consolidated into STEWART1)
-- Stewart's commission rate (20%) is unchanged.

UPDATE affiliate_codes
SET discount_value = 10, code_type = 'general', updated_at = NOW()
WHERE code = 'STEWART1' AND creator_id = '812c1645-f33e-4e65-995a-d59f24e5be24';

UPDATE affiliate_codes
SET active = FALSE, updated_at = NOW()
WHERE code = 'STEWART110' AND creator_id = '812c1645-f33e-4e65-995a-d59f24e5be24';
