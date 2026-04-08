-- STEWART1: customer discount 10% → 20% per Stewart's request
UPDATE affiliate_codes
SET discount_value = 20, updated_at = NOW()
WHERE code = 'STEWART1' AND creator_id = '812c1645-f33e-4e65-995a-d59f24e5be24';
