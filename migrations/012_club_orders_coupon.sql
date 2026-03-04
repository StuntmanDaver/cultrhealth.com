-- Migration 012: Add coupon code support to club_orders
ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
