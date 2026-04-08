-- Migration 025: Change JON21 coupon discount from 20% to 10%
-- Jon Collins' commission rate (20%) is unchanged — only customer discount changes.
UPDATE affiliate_codes
SET discount_value = 10,
    updated_at = NOW()
WHERE code = 'JON21';
