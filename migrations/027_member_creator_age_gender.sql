-- Migration 027: Add age and gender to club_members and creators

ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
