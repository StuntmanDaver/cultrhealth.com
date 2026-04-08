-- Migration 029: Cron execution log + Asher Med sync cache
-- Tracks every cron run for admin visibility and stores cached Asher Med data

-- Cron execution log
CREATE TABLE IF NOT EXISTS cron_runs (
  id SERIAL PRIMARY KEY,
  cron_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running',  -- running, success, error
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_name_started
  ON cron_runs(cron_name, started_at DESC);

-- Keep only last 100 runs per cron (cleanup trigger)
-- We'll handle cleanup in the logger utility instead

-- Asher Med cached sync data
CREATE TABLE IF NOT EXISTS asher_sync_cache (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,  -- 'dashboard', 'orders', 'patients'
  data JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asher_sync_cache_type
  ON asher_sync_cache(sync_type);
