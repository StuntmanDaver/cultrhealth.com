-- Migration 055: Seed product_inventory with CURRENT PRODUCT_CATALOG shop SKUs
-- Migration 044 seeded a pre-overhaul shop catalog (23 old SKUs, all stale after
-- the Apr 5 2026 product catalog overhaul). Migration 053 tagged any row matching
-- [0-9](MG|ML) as site_source='shop', which retagged the stale 044 rows but did
-- NOT insert the current 12 SKUs defined in lib/config/product-catalog.ts.
--
-- Result: admin "Members Shop" inventory tab is missing the current catalog.
-- This migration inserts every active shop SKU with site_source='shop' so the
-- admin tab mirrors the public-facing members shop exactly. Stale 044 rows are
-- retained for historical attribution and are filtered out by stock API joins
-- on SKU.

INSERT INTO product_inventory (therapy_id, therapy_name, stock_status, site_source) VALUES
  ('BACWATER-30ML',           'Bacteriostatic Water',                  'in_stock', 'shop'),
  ('TRZ-NIA-10MG-1ML',        'TIRZ/B3 (reconstituted)',               'in_stock', 'shop'),
  ('SMA-PYR-2.5MG-1ML',       'SEMA/B6 (reconstituted)',               'in_stock', 'shop'),
  ('NAD-200MG-5ML',           'NAD+ (reconstituted)',                  'in_stock', 'shop'),
  ('SERMORELIN-3MG-5ML',      'Sermorelin (reconstituted)',            'in_stock', 'shop'),
  ('LIPOC-10ML',              'Lipo-C (reconstituted)',                'in_stock', 'shop'),
  ('METHYLENE-BLUE-25MG',     'Methylene Blue (reconstituted)',        'in_stock', 'shop'),
  ('GLUTATHIONE-200MG-10ML',  'Glutathione (reconstituted)',           'in_stock', 'shop'),
  ('LCARNITINE-500MG-10ML',   'L-Carnitine (reconstituted)',           'in_stock', 'shop'),
  ('OXYTOCIN-TROCHE',         'Oxytocin (reconstituted)',              'in_stock', 'shop'),
  ('PT141-NASAL-2MG-10ML',    'PT-141 (Bremelanotide) Nasal Spray',    'in_stock', 'shop'),
  ('PT141-ORAL',              'PT-141 (Bremelanotide)',                'in_stock', 'shop')
ON CONFLICT (therapy_id, site_source) DO NOTHING;
