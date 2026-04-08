-- Migration 030: Remove ON DELETE CASCADE from medical records tables
-- HIPAA requires retention of consultation recordings and notes
-- even if the parent consultation is deleted.

-- 1. Drop CASCADE on consultation_recordings
ALTER TABLE consultation_recordings
  DROP CONSTRAINT IF EXISTS consultation_recordings_consultation_id_fkey;

ALTER TABLE consultation_recordings
  ADD CONSTRAINT consultation_recordings_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consult_requests(id)
  ON DELETE RESTRICT;

-- 2. Drop CASCADE on consultation_notes
ALTER TABLE consultation_notes
  DROP CONSTRAINT IF EXISTS consultation_notes_consultation_id_fkey;

ALTER TABLE consultation_notes
  ADD CONSTRAINT consultation_notes_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consult_requests(id)
  ON DELETE RESTRICT;
