-- 033: Add fulfillment tracking columns to club_orders
-- Extends the existing shipped_at (from 032) with full pipeline tracking

ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE club_orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
