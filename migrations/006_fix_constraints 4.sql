-- Migration: Fix constraints to support 'shipped' status and 'healthie' provider
-- Run this SQL in your Vercel Postgres dashboard or via psql

-- ============================================
-- FIX 1: Add 'shipped' to valid order statuses
-- ============================================

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_status;

-- Add updated constraint that includes 'shipped'
ALTER TABLE orders
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'shipped', 'fulfilled', 'cancelled', 'refunded'));

COMMENT ON COLUMN orders.status IS 'Order status: pending, paid, shipped, fulfilled, cancelled, refunded';

-- ============================================
-- FIX 2: Add 'healthie' to valid payment providers
-- ============================================

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_order_payment_provider;

-- Add updated constraint that includes 'healthie'
ALTER TABLE orders
ADD CONSTRAINT valid_order_payment_provider 
CHECK (payment_provider IN ('stripe', 'authorize_net', 'klarna', 'affirm', 'healthie'));

COMMENT ON COLUMN orders.payment_provider IS 'Payment provider used: stripe, authorize_net, klarna, affirm, healthie';

-- Also update memberships table to support healthie (for future use)
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS valid_membership_payment_provider;

ALTER TABLE memberships
ADD CONSTRAINT valid_membership_payment_provider 
CHECK (payment_provider IN ('stripe', 'authorize_net', 'klarna', 'affirm', 'healthie'));

COMMENT ON COLUMN memberships.payment_provider IS 'Payment provider used: stripe, authorize_net, klarna, affirm, healthie';
