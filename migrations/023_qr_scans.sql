-- Migration 023: QR Code Scan Tracking
-- Tracks scans from physical business cards and marketing materials

CREATE TABLE IF NOT EXISTS qr_scans (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(32) UNIQUE NOT NULL,        -- Unique scan identifier
  source VARCHAR(50) NOT NULL DEFAULT 'business_card',  -- Which QR code (business_card, flyer, etc.)
  destination VARCHAR(100) NOT NULL,           -- Where it redirects (instagram, tiktok, website, etc.)
  ip_hash VARCHAR(16),                         -- SHA256 first 16 chars (privacy-safe)
  user_agent TEXT,                             -- Device/browser info
  referer TEXT,                                -- Referrer if available
  city VARCHAR(100),                           -- Geo info (from IP headers if available)
  region VARCHAR(100),                         -- State/region
  country VARCHAR(10),                         -- Country code
  device_type VARCHAR(20),                     -- mobile, tablet, desktop (parsed from UA)
  os VARCHAR(50),                              -- iOS, Android, Windows, etc.
  browser VARCHAR(50),                         -- Safari, Chrome, Instagram, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_qr_scans_source ON qr_scans(source);
CREATE INDEX idx_qr_scans_destination ON qr_scans(destination);
CREATE INDEX idx_qr_scans_created_at ON qr_scans(created_at);
CREATE INDEX idx_qr_scans_device_type ON qr_scans(device_type);
CREATE INDEX idx_qr_scans_ip_hash ON qr_scans(ip_hash);
