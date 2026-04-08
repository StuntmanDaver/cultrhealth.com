-- Migration: Create orders table for sales tracking
-- Run this SQL in your Vercel Postgres dashboard or via psql

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  healthie_patient_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_customer_id ON orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_healthie_patient_id ON orders(healthie_patient_id);

-- Add comment
COMMENT ON TABLE orders IS 'Product orders from the CULTR Health shop';

-- Grant permissions (if needed)
-- GRANT ALL ON orders TO your_app_user;
