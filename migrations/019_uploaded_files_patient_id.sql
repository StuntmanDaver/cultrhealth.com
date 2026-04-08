-- Migration 019: Add asher_patient_id to asher_uploaded_files for portal document lookups
ALTER TABLE asher_uploaded_files ADD COLUMN IF NOT EXISTS asher_patient_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_patient_id ON asher_uploaded_files(asher_patient_id);
