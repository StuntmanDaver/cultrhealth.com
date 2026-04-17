-- Migration 053: Add site_source to product_inventory
-- Separates cultrhealth.com, cultrclub.com, and shop inventory in admin

-- Add site_source column (default: join_cultrhealth for existing rows)
ALTER TABLE product_inventory
  ADD COLUMN IF NOT EXISTS site_source TEXT NOT NULL DEFAULT 'join_cultrhealth';

-- Tag shop products (SKU-format IDs contain digits + MG/ML units)
UPDATE product_inventory
  SET site_source = 'shop'
  WHERE therapy_id ~ '[0-9](MG|ML)';

-- Drop the single-column unique constraint on therapy_id alone
ALTER TABLE product_inventory
  DROP CONSTRAINT IF EXISTS product_inventory_therapy_id_key;

-- Add composite unique so same therapy_id can exist per site independently
ALTER TABLE product_inventory
  ADD CONSTRAINT product_inventory_therapy_id_site_key UNIQUE (therapy_id, site_source);

-- Seed cultrclub.com inventory from existing join_cultrhealth rows
INSERT INTO product_inventory (therapy_id, therapy_name, stock_status, site_source)
SELECT therapy_id, therapy_name, stock_status, 'cultrclub'
FROM product_inventory
WHERE site_source = 'join_cultrhealth'
ON CONFLICT (therapy_id, site_source) DO NOTHING;
