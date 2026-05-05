-- Migration 060: Seed product_inventory rows missing for join-therapies.ts entries
--
-- igf1-lr3, mots-c, and bacteriostatic-water were added to lib/config/join-therapies.ts
-- after migration 034 seeded the initial inventory. Without rows here:
--   1. Admin "cultrhealth.com" tab can't surface or manage these products
--   2. /api/stock returns no entry for them, so stockData[therapy.id] is undefined
--      on the join page and they always render as in_stock with no admin control
-- Also seeds their cultrclub mirror rows (per migration 053 seeding pattern).

INSERT INTO product_inventory (therapy_id, therapy_name, stock_status, site_source) VALUES
  ('igf1-lr3',             'IGF-1 LR3',            'in_stock', 'join_cultrhealth'),
  ('mots-c',               'MOTS-C',               'in_stock', 'join_cultrhealth'),
  ('bacteriostatic-water', 'Bacteriostatic Water', 'in_stock', 'join_cultrhealth')
ON CONFLICT (therapy_id, site_source) DO NOTHING;

-- Mirror to cultrclub site_source so the cultrclub admin tab also surfaces them
INSERT INTO product_inventory (therapy_id, therapy_name, stock_status, site_source)
SELECT therapy_id, therapy_name, stock_status, 'cultrclub'
FROM product_inventory
WHERE therapy_id IN ('igf1-lr3', 'mots-c', 'bacteriostatic-water')
  AND site_source = 'join_cultrhealth'
ON CONFLICT (therapy_id, site_source) DO NOTHING;
