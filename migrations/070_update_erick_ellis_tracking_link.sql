-- Migration 070: Update Erick Ellis creator tracking link
-- Public referral URL: https://cultrclub.com/erick

DO $$
DECLARE
  v_creator_id UUID;
  v_default_link_id UUID;
  v_conflicting_link_id UUID;
BEGIN
  SELECT id INTO v_creator_id
  FROM creators
  WHERE lower(email) = 'ellis.erick1@gmail.com'
     OR lower(full_name) = 'erick ellis'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE 'Erick Ellis creator row not found; skipping tracking link update.';
    RETURN;
  END IF;

  SELECT id INTO v_default_link_id
  FROM tracking_links
  WHERE creator_id = v_creator_id
    AND (
      lower(slug) IN ('erick', 'erikellis16')
      OR is_default = TRUE
    )
  ORDER BY
    CASE
      WHEN lower(slug) = 'erick' THEN 0
      WHEN lower(slug) = 'erikellis16' THEN 1
      WHEN is_default = TRUE THEN 2
      ELSE 3
    END,
    created_at ASC
  LIMIT 1;

  IF v_default_link_id IS NULL THEN
    RAISE NOTICE 'Erick Ellis tracking link not found; skipping tracking link update.';
    RETURN;
  END IF;

  SELECT id INTO v_conflicting_link_id
  FROM tracking_links
  WHERE lower(slug) = 'erick'
    AND id <> v_default_link_id
  LIMIT 1;

  IF v_conflicting_link_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update Erick Ellis link: slug "erick" is already used by tracking_links.id %', v_conflicting_link_id;
  END IF;

  UPDATE tracking_links
  SET is_default = FALSE,
      updated_at = NOW()
  WHERE creator_id = v_creator_id
    AND id <> v_default_link_id;

  UPDATE tracking_links
  SET slug = 'erick',
      destination_path = '/',
      active = TRUE,
      is_default = TRUE,
      updated_at = NOW()
  WHERE id = v_default_link_id;
END $$;
