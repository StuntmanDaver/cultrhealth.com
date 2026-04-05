-- Migration 048: Add IGF-1 LR3 to product_inventory
-- Legacy join catalog restore brought this therapy back to join.cultrhealth.com

INSERT INTO product_inventory (therapy_id, therapy_name, stock_status) VALUES
  ('igf1-lr3', 'IGF-1 LR3', 'in_stock')
ON CONFLICT (therapy_id) DO NOTHING;
