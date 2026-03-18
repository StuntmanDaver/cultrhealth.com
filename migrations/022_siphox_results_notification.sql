-- Migration 022: Add results notification tracking to siphox_customers
-- Tracks which report was last emailed about per customer for dedup

ALTER TABLE siphox_customers
  ADD COLUMN IF NOT EXISTS last_notified_report_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS results_notified_at TIMESTAMPTZ;
