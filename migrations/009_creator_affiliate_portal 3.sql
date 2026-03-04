-- ============================================================
-- Migration 009: Creator Affiliate Portal
-- Creates tables for creator management, tracking, commissions,
-- and payouts for the CULTR affiliate program.
-- ============================================================

-- 1. CREATORS - Creator profiles and recruiting hierarchy
CREATE TABLE IF NOT EXISTS creators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  social_handle   TEXT,
  bio             TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'paused', 'rejected')),
  recruiter_id    UUID REFERENCES creators(id) ON DELETE SET NULL,
  recruit_count   INTEGER NOT NULL DEFAULT 0,
  tier            INTEGER NOT NULL DEFAULT 0 CHECK (tier BETWEEN 0 AND 4),
  override_rate   NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  payout_method   TEXT CHECK (payout_method IN ('stripe_connect', 'bank_transfer', 'paypal')),
  payout_destination_id TEXT,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at     TIMESTAMPTZ,
  approved_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creators_email ON creators (lower(email));
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators (status);
CREATE INDEX IF NOT EXISTS idx_creators_recruiter ON creators (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_creators_tier ON creators (tier);

-- 2. AFFILIATE_CODES - Coupon codes (e.g., DAVE10)
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  discount_type   TEXT NOT NULL DEFAULT 'percentage'
                  CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  use_count       INTEGER NOT NULL DEFAULT 0,
  total_revenue   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_codes_code ON affiliate_codes (lower(code));
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_creator ON affiliate_codes (creator_id);

-- 3. TRACKING_LINKS - Creator tracking URLs (/r/DAVE123)
CREATE TABLE IF NOT EXISTS tracking_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  destination_path TEXT NOT NULL DEFAULT '/',
  utm_source      TEXT DEFAULT 'creator',
  utm_medium      TEXT DEFAULT 'referral',
  utm_campaign    TEXT,
  click_count     INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_links_slug ON tracking_links (lower(slug));
CREATE INDEX IF NOT EXISTS idx_tracking_links_creator ON tracking_links (creator_id);

-- 4. CLICK_EVENTS - Server-side click tracking
CREATE TABLE IF NOT EXISTS click_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  link_id         UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  session_id      TEXT NOT NULL,
  attribution_token TEXT NOT NULL,
  ip_hash         TEXT,
  user_agent      TEXT,
  referer         TEXT,
  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  converted       BOOLEAN NOT NULL DEFAULT FALSE,
  order_id        TEXT
);

CREATE INDEX IF NOT EXISTS idx_click_events_creator ON click_events (creator_id);
CREATE INDEX IF NOT EXISTS idx_click_events_session ON click_events (session_id);
CREATE INDEX IF NOT EXISTS idx_click_events_token ON click_events (attribution_token);
CREATE INDEX IF NOT EXISTS idx_click_events_expires ON click_events (expires_at);

-- 5. ORDER_ATTRIBUTIONS - Links orders to creators (one-to-one)
CREATE TABLE IF NOT EXISTS order_attributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT NOT NULL,
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  attribution_method TEXT NOT NULL
                  CHECK (attribution_method IN ('link_click', 'coupon_code', 'manual')),
  link_id         UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  code_id         UUID REFERENCES affiliate_codes(id) ON DELETE SET NULL,
  click_event_id  UUID REFERENCES click_events(id) ON DELETE SET NULL,
  customer_email  TEXT,
  net_revenue     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  direct_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  direct_commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'paid', 'refunded')),
  is_self_referral BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_attributions_order ON order_attributions (order_id);
CREATE INDEX IF NOT EXISTS idx_order_attributions_creator ON order_attributions (creator_id);
CREATE INDEX IF NOT EXISTS idx_order_attributions_status ON order_attributions (status);

-- 6. COMMISSION_LEDGER - Detailed commission entries
CREATE TABLE IF NOT EXISTS commission_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_attribution_id UUID NOT NULL REFERENCES order_attributions(id) ON DELETE CASCADE,
  beneficiary_creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL
                  CHECK (commission_type IN ('direct', 'override', 'adjustment')),
  source_creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  base_amount     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tier_level      INTEGER DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),
  payout_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_attribution ON commission_ledger (order_attribution_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_beneficiary ON commission_ledger (beneficiary_creator_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status ON commission_ledger (status);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_payout ON commission_ledger (payout_id);

-- 7. PAYOUTS - Payout batches
CREATE TABLE IF NOT EXISTS payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  payout_method   TEXT CHECK (payout_method IN ('stripe_connect', 'bank_transfer', 'paypal')),
  provider_payout_id TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  commission_count INTEGER NOT NULL DEFAULT 0,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_creator ON payouts (creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status);

-- 8. ADMIN_ACTIONS - Audit log
CREATE TABLE IF NOT EXISTS admin_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email     TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  reason          TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions (admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_actions_entity ON admin_actions (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions (created_at DESC);

-- Add FK for commission_ledger.payout_id (created after payouts table)
ALTER TABLE commission_ledger
  ADD CONSTRAINT fk_commission_ledger_payout
  FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL;
