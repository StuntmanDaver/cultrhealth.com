-- Migration 010: CULTR Club members and orders
-- For join.cultrhealth.com landing page flow

-- Club members (created on signup popup)
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  social_handle TEXT,
  source TEXT DEFAULT 'join_landing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_club_members_email ON club_members (LOWER(email));

-- Club orders (submitted from join landing page cart)
CREATE TABLE IF NOT EXISTS club_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES club_members(id),
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  member_phone TEXT,
  items JSONB NOT NULL,
  subtotal_usd NUMERIC(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  approval_token TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  qb_invoice_id TEXT,
  qb_invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_club_orders_status ON club_orders (status);
CREATE INDEX IF NOT EXISTS idx_club_orders_member_id ON club_orders (member_id);
CREATE INDEX IF NOT EXISTS idx_club_orders_member_email ON club_orders (LOWER(member_email));
CREATE INDEX IF NOT EXISTS idx_club_orders_created_at ON club_orders (created_at DESC);

-- Status values: pending_approval, approved, invoice_sent, paid, rejected, cancelled
