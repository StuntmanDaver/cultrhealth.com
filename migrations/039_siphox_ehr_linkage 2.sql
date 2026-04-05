-- Migration 039: Add ehr_patient_id to siphox_customers
-- Links SiPhox customers to Healthie patient records so lab results
-- can be routed to the correct Healthie patient for document upload.

ALTER TABLE siphox_customers ADD COLUMN IF NOT EXISTS ehr_patient_id TEXT;
