-- Migration 034: Product inventory table for join.cultrhealth.com stock control
-- Tracks stock status and quantity per therapy, managed from admin panel

CREATE TABLE IF NOT EXISTS product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapy_id TEXT UNIQUE NOT NULL,
  therapy_name TEXT NOT NULL,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  stock_quantity INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- Seed all current join therapies as in_stock
INSERT INTO product_inventory (therapy_id, therapy_name, stock_status) VALUES
  ('retatrutide',   'R3TA — GLP1/GIP/GCG',  'in_stock'),
  ('semaglutide',   'Semaglutide — GLP1',    'in_stock'),
  ('tirzepatide',   'Tirzepatide — GLP1/GIP','in_stock'),
  ('ghk-cu',        'GHK-CU',                'in_stock'),
  ('glutathione',   'Glutathione',            'in_stock'),
  ('tesa-ipa',      'TESA/IPA',              'in_stock'),
  ('cjc1295-ipa',   'CJC1295/IPA',           'in_stock'),
  ('nad-plus',      'NAD+',                  'in_stock'),
  ('semax-selank',  'Semax/Selank',          'low_stock'),
  ('bpc157-tb500',  'BPC157/TB500',          'low_stock'),
  ('melanotan-2',   'Melanotan 2 (MT2)',     'in_stock')
ON CONFLICT (therapy_id) DO NOTHING;

-- Set low stock quantities
UPDATE product_inventory SET stock_quantity = 1, updated_at = NOW() WHERE therapy_id = 'semax-selank';
UPDATE product_inventory SET stock_quantity = 1, updated_at = NOW() WHERE therapy_id = 'bpc157-tb500';
