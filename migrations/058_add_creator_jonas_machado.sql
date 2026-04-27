-- Migration 058: Add creator Jonas Machado
-- Email: jonasmachaddo@gmail.com | Phone: (385) 461-4645
-- Coupon JM20 → 20% off products | Commission: 10%

INSERT INTO creators (email, full_name, phone, status, commission_rate, approved_at, approved_by, creator_start_date, created_at, updated_at)
VALUES (
  'jonasmachaddo@gmail.com',
  'Jonas Machado',
  '(385) 461-4645',
  'active',
  10.00,
  NOW(),
  'admin@cultrhealth.com',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ((lower(email))) DO NOTHING;

-- Tracking link (cultrclub.com/jonasmachado)
INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
SELECT id, 'jonasmachado', '/', TRUE
FROM creators WHERE lower(email) = 'jonasmachaddo@gmail.com'
ON CONFLICT ((lower(slug))) DO NOTHING;

-- Primary product code JM20 — 20% off
INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
SELECT id, 'JM20', TRUE, 'percentage', 20.00, 'product'
FROM creators WHERE lower(email) = 'jonasmachaddo@gmail.com'
ON CONFLICT ((lower(code))) DO NOTHING;
