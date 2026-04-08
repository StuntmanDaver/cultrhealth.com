-- Migration: Add payment_provider columns for multi-provider support
-- Run this SQL in your Vercel Postgres dashboard or via psql
-- This enables support for Authorize.net alongside Stripe

-- Add payment_provider column to memberships table
-- Default to 'stripe' for existing records
ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) NOT NULL DEFAULT 'stripe';

-- Add payment_provider column to orders table
-- Default to 'stripe' for existing records
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) NOT NULL DEFAULT 'stripe';

-- Add generic provider ID columns (for non-Stripe providers)
-- These supplement the existing stripe_* columns
ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS provider_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_memberships_payment_provider ON memberships(payment_provider);
CREATE INDEX IF NOT EXISTS idx_memberships_provider_customer_id ON memberships(provider_customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_provider_subscription_id ON memberships(provider_subscription_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_provider_transaction_id ON orders(provider_transaction_id);

-- Add check constraints for valid payment providers
ALTER TABLE memberships
ADD CONSTRAINT valid_membership_payment_provider 
CHECK (payment_provider IN ('stripe', 'authorize_net', 'klarna', 'affirm'));

ALTER TABLE orders
ADD CONSTRAINT valid_order_payment_provider 
CHECK (payment_provider IN ('stripe', 'authorize_net', 'klarna', 'affirm'));

-- Add comments
COMMENT ON COLUMN memberships.payment_provider IS 'Payment provider used: stripe, authorize_net, klarna, affirm';
COMMENT ON COLUMN memberships.provider_customer_id IS 'Customer ID from non-Stripe provider';
COMMENT ON COLUMN memberships.provider_subscription_id IS 'Subscription ID from non-Stripe provider';

COMMENT ON COLUMN orders.payment_provider IS 'Payment provider used: stripe, authorize_net, klarna, affirm';
COMMENT ON COLUMN orders.provider_transaction_id IS 'Transaction ID from non-Stripe provider';

-- Note: Existing stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id columns
-- are preserved for backward compatibility. New code should check payment_provider
-- and use the appropriate ID column.
