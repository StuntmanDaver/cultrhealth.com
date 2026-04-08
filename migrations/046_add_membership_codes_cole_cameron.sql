-- Migration 046: Add missing membership codes for Cole Sidner and Cameron Donahue
-- Both creators only had product codes (COLE10, CAM10). Standard pattern is dual codes:
-- primary membership code + secondary product code (see Hannah Goldy: GOLDY + GOLDY10).

-- Add COLE membership code (primary) for Cole Sidner
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'COLE', TRUE, 'percentage', 10.00, 'membership'
FROM creators WHERE lower(email) = 'cole.sidner@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;

-- Demote COLE10 to secondary (is_primary = false)
UPDATE affiliate_codes SET is_primary = FALSE, updated_at = NOW()
WHERE lower(code) = 'cole10' AND is_primary = TRUE;

-- Add CAM membership code (primary) for Cameron Donahue
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'CAM', TRUE, 'percentage', 10.00, 'membership'
FROM creators WHERE lower(email) = 'camerondonahue08@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;

-- Demote CAM10 to secondary (is_primary = false)
UPDATE affiliate_codes SET is_primary = FALSE, updated_at = NOW()
WHERE lower(code) = 'cam10' AND is_primary = TRUE;
