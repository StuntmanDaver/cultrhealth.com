-- Migration 015: Add sales tax columns to club_orders
ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount_usd NUMERIC(10,2) DEFAULT 0;
