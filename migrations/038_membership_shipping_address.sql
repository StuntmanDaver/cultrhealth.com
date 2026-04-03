-- Migration 038: Add shipping_address JSONB to memberships
-- SiPhox fulfillment currently resolves shipping from pending_intakes (Asher intake data).
-- After the Healthie migration, intake data lives in Healthie, so we store shipping
-- address directly on the membership during onboarding.

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS shipping_address JSONB;
