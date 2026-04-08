-- Migration 044: Seed all members shop products into product_inventory
-- Allows admin to manage stock status for shop products (not just join therapies)
-- Uses SKU as therapy_id to avoid collision with join therapy IDs

INSERT INTO product_inventory (therapy_id, therapy_name, stock_status) VALUES
  ('AOD9604-5MG-3ML',                'AOD-9604',                  'in_stock'),
  ('BPC157-5MG-3ML',                 'BPC-157',                   'in_stock'),
  ('BPC157-TB500-5MG-3ML',           'BPC-157 | TB-500',          'in_stock'),
  ('CJC1295-5MG-3ML',                'CJC-1295',                  'in_stock'),
  ('CJC1295-IPAMORELIN-5MG-3ML',     'CJC-1295 | Ipamorelin',    'in_stock'),
  ('EPITHALON-10MG-3ML',             'Epithalon',                 'in_stock'),
  ('GHKCU-50MG-3ML',                 'GHK-CU',                    'in_stock'),
  ('GHRP2-5MG-3ML',                  'GHRP-2',                    'in_stock'),
  ('GHRP6-5MG-3ML',                  'GHRP-6',                    'in_stock'),
  ('IPAMORELIN-5MG-3ML',             'Ipamorelin',                'in_stock'),
  ('IPAMORELIN-SERMORELIN-5MG-3ML',  'Ipamorelin / Sermorelin',   'in_stock'),
  ('KISSPEPTIN-5MG-3ML',             'Kisspeptin',                'in_stock'),
  ('KPV-5MG-3ML',                    'KPV',                       'in_stock'),
  ('MOTSC-10MG-3ML',                 'MOTS-C',                    'in_stock'),
  ('MT2-10MG-3ML',                   'MT-2 (Melanotan 2 Acetate)','in_stock'),
  ('NAD-500MG-10ML',                 'NAD+',                      'in_stock'),
  ('OXYTOCIN-2MG-3ML',               'Oxytocin',                  'in_stock'),
  ('PEGMGF-2MG-3ML',                 'PEG MGF',                   'in_stock'),
  ('PT141-10MG-3ML',                 'PT-141',                    'in_stock'),
  ('SELANK-5MG-3ML',                 'Selank',                    'in_stock'),
  ('SELANK-SEMAX-5MG-3ML',           'Selank | Semax',            'in_stock'),
  ('SEMAX-5MG-3ML',                  'Semax',                     'in_stock'),
  ('SERMORELIN-5MG-3ML',             'Sermorelin',                'in_stock'),
  ('SMA-5MG-3ML',                    'SMA (Semaglutide)',         'in_stock'),
  ('TB500-5MG-3ML',                  'TB-500',                    'in_stock'),
  ('TESAMORELIN-5MG-3ML',            'Tesamorelin',               'in_stock'),
  ('TESAMORELIN-IPAMORELIN-5MG-3ML', 'Tesamorelin | Ipamorelin',  'in_stock'),
  ('THYMOSINALPHA1-5MG-3ML',         'Thymosin Alpha 1',          'in_stock'),
  ('TRZ-5MG-3ML',                    'TRZ (Tirzepatide)',         'in_stock'),
  ('BACWATER-30ML',                   'Bacteriostatic Water',      'in_stock')
ON CONFLICT (therapy_id) DO NOTHING;
