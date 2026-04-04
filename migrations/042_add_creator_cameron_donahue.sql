-- Migration 042: Add creator Cameron Donahue
-- Inserts as active creator with CAM10 affiliate code (10% off products, 20% commission)

-- Insert creator (skip if email already exists)
INSERT INTO creators (email, full_name, status, commission_rate, approved_at, approved_by, creator_start_date, created_at, updated_at)
VALUES (
  'camerondonahue08@gmail.com',
  'Cameron Donahue',
  'active',
  20.00,
  NOW(),
  'admin@cultrhealth.com',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ((lower(email))) DO NOTHING;

-- Create tracking link
INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
SELECT id, 'cameron', '/', TRUE
FROM creators WHERE lower(email) = 'camerondonahue08@gmail.com'
ON CONFLICT ((lower(slug))) DO NOTHING;

-- Create product code CAM10 (10% off products)
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'CAM10', TRUE, 'percentage', 10.00, 'product'
FROM creators WHERE lower(email) = 'camerondonahue08@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;
