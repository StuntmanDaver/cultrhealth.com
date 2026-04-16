-- Migration 051: Add 'restocking_soon' to product_inventory stock_status CHECK constraint
-- Allows admin to mark products as restocking without using out_of_stock

ALTER TABLE product_inventory
  DROP CONSTRAINT IF EXISTS product_inventory_stock_status_check;

ALTER TABLE product_inventory
  ADD CONSTRAINT product_inventory_stock_status_check
  CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'restocking_soon'));
