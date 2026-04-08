CREATE TABLE IF NOT EXISTS dosing_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_string TEXT UNIQUE NOT NULL,
  rules_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  published_at TIMESTAMPTZ,
  published_by TEXT
);

CREATE TABLE IF NOT EXISTS dosing_recommendation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  product_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  intake_data JSONB NOT NULL,
  recommendation_data JSONB NOT NULL,
  escalated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dosing_recommendation_user ON dosing_recommendation_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_dosing_recommendation_product ON dosing_recommendation_audit(product_id);
