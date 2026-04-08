-- Migration 017: Add address fields to club_members
-- For shipping address collection on join.cultrhealth.com signup

ALTER TABLE club_members ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS address_zip TEXT;
