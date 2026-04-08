-- Migration 011: QuickBooks OAuth token storage
-- Optional: store QB refresh tokens securely for auto-renewal

CREATE TABLE IF NOT EXISTS qb_tokens (
  key TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qb_tokens_expires_at ON qb_tokens (expires_at);

-- Note: In production, consider encrypting refresh_token column
-- Current implementation stores tokens in memory; this table is backup for graceful recovery
