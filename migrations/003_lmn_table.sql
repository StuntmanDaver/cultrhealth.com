-- Migration: Create LMN (Letter of Medical Necessity) table for HSA/FSA documentation
-- Run this SQL in your Vercel Postgres dashboard or via psql

-- LMN records table
CREATE TABLE IF NOT EXISTS lmn_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lmn_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  eligible_total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata for compliance
  attestation_text TEXT,
  provider_reference VARCHAR(255)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lmn_customer_email ON lmn_records(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_lmn_order_number ON lmn_records(order_number);
CREATE INDEX IF NOT EXISTS idx_lmn_issue_date ON lmn_records(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_lmn_created_at ON lmn_records(created_at DESC);

-- Add comment
COMMENT ON TABLE lmn_records IS 'Letters of Medical Necessity for HSA/FSA reimbursement';

-- Grant permissions (if needed)
-- GRANT ALL ON lmn_records TO your_app_user;
