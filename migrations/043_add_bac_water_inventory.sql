-- Migration 043: Add Bacteriostatic Water to product_inventory
-- Was added to join-therapies catalog but missing from inventory table

INSERT INTO product_inventory (therapy_id, therapy_name, stock_status) VALUES
  ('bacteriostatic-water', 'Bacteriostatic Water', 'in_stock')
ON CONFLICT (therapy_id) DO NOTHING;
