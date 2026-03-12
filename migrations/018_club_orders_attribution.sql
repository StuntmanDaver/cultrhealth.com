-- Migration 018: Add attribution tracking to club orders and signup type to club members
-- Enables creator coupon code attribution for club orders and membership/products intent tracking

ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS attributed_creator_id UUID,
  ADD COLUMN IF NOT EXISTS attribution_method TEXT;

ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS signup_type VARCHAR DEFAULT 'products';

CREATE INDEX IF NOT EXISTS idx_club_orders_attributed_creator ON club_orders (attributed_creator_id);
