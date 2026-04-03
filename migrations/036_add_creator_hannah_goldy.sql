-- Migration 036: Add creator Hannah Goldy
-- Inserts as active creator with GOLDY/GOLDY10 affiliate codes

-- Insert creator (skip if email already exists)
INSERT INTO creators (email, full_name, status, commission_rate, approved_at, approved_by, creator_start_date, created_at, updated_at)
VALUES (
  'hannahgoldy11@gmail.com',
  'Hannah Goldy',
  'active',
  10.00,
  NOW(),
  'admin@cultrhealth.com',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ((lower(email))) DO NOTHING;

-- Create tracking link (only if creator was just inserted)
INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
SELECT id, 'hannahgoldy', '/', TRUE
FROM creators WHERE lower(email) = 'hannahgoldy11@gmail.com'
ON CONFLICT (slug) DO NOTHING;

-- Create membership code GOLDY (10% off)
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'GOLDY', TRUE, 'percentage', 10.00, 'membership'
FROM creators WHERE lower(email) = 'hannahgoldy11@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;

-- Create product code GOLDY10 (10% off)
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'GOLDY10', FALSE, 'percentage', 10.00, 'product'
FROM creators WHERE lower(email) = 'hannahgoldy11@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;
