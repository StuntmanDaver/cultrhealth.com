-- Migration 045: Visitor tracking for join.cultrhealth.com
-- Adds acquisition context (UTM, referrer, device) to club_members
-- Creates visitor_events table for server-side funnel tracking

-- =============================================
-- 1. Add visitor tracking columns to club_members
-- =============================================

ALTER TABLE club_members ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS device_type TEXT;       -- mobile | desktop | tablet
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS screen_resolution TEXT; -- e.g. "1920x1080"
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMPTZ;

-- =============================================
-- 2. Create visitor_events table
-- =============================================

CREATE TABLE IF NOT EXISTS visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  member_id UUID REFERENCES club_members(id),
  event_type TEXT NOT NULL,  -- page_view, signup, add_to_cart, remove_from_cart, begin_checkout, order_submitted
  event_data JSONB,          -- flexible payload (therapy name, cart total, etc.)
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_visitor_events_session ON visitor_events (session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_member ON visitor_events (member_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_type ON visitor_events (event_type);
CREATE INDEX IF NOT EXISTS idx_visitor_events_created ON visitor_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_members_utm_source ON club_members (utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_club_members_first_visit ON club_members (first_visit_at DESC) WHERE first_visit_at IS NOT NULL;
