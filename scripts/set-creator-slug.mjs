/**
 * One-off script: set a creator's default tracking-link slug.
 *
 * Ensures the given creator owns a tracking_links row with the target slug
 * and is_default = TRUE, so their portal displays https://cultrclub.com/{slug}.
 *
 * Usage:
 *   POSTGRES_URL=... node scripts/set-creator-slug.mjs
 *
 * Idempotent: re-running after the slug is already owned is a no-op.
 */
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const sql = neon(process.env.POSTGRES_URL)

const EMAIL = 'teamjoncollins21@gmail.com'
const TARGET_SLUG = 'jon21'
const DESTINATION_PATH = '/'
const PUBLIC_BASE_URL = 'https://cultrclub.com'

const normalizedSlug = TARGET_SLUG.toLowerCase()

const creatorRows = await sql`
  SELECT id, full_name, email
  FROM creators
  WHERE LOWER(email) = LOWER(${EMAIL})
  LIMIT 1
`

if (creatorRows.length === 0) {
  console.error(`No creator found with email: ${EMAIL}`)
  process.exit(1)
}

const creator = creatorRows[0]
console.log(`Creator: ${creator.full_name} <${creator.email}> (${creator.id})`)

const slugConflict = await sql`
  SELECT id, creator_id
  FROM tracking_links
  WHERE LOWER(slug) = ${normalizedSlug}
  LIMIT 1
`

if (slugConflict.length > 0 && slugConflict[0].creator_id !== creator.id) {
  console.error(
    `Slug "${normalizedSlug}" is already owned by a different creator (link id ${slugConflict[0].id}, creator ${slugConflict[0].creator_id}). Aborting without changes.`
  )
  process.exit(1)
}

// Case A: the creator already owns a row with the target slug.
// Promote it to default (preserving click/conversion history) and demote
// any other default they currently have.
const existingTargetSlugRow = slugConflict.length > 0 && slugConflict[0].creator_id === creator.id
  ? slugConflict[0]
  : null

let row
if (existingTargetSlugRow) {
  const targetRow = await sql`
    UPDATE tracking_links
    SET is_default = TRUE, active = TRUE, updated_at = NOW()
    WHERE id = ${existingTargetSlugRow.id}
    RETURNING id, slug, destination_path, is_default, click_count, conversion_count
  `
  const demoted = await sql`
    UPDATE tracking_links
    SET is_default = FALSE, updated_at = NOW()
    WHERE creator_id = ${creator.id}
      AND id != ${existingTargetSlugRow.id}
      AND is_default = TRUE
    RETURNING id, slug
  `
  row = targetRow[0]
  if (demoted.length > 0) {
    console.log(`Demoted old default link(s):`, demoted.map(d => d.slug).join(', '))
  }
  console.log(`Promoted existing "${normalizedSlug}" link to default (preserving ${row.click_count} clicks, ${row.conversion_count} conversions)`)
} else {
  // Case B: creator does not own the target slug; either update their current
  // default's slug or create a new default row.
  const existingDefault = await sql`
    SELECT id, slug, destination_path, is_default
    FROM tracking_links
    WHERE creator_id = ${creator.id} AND is_default = TRUE
    LIMIT 1
  `

  if (existingDefault.length > 0) {
    const current = existingDefault[0]
    const updated = await sql`
      UPDATE tracking_links
      SET slug = ${normalizedSlug}, updated_at = NOW()
      WHERE id = ${current.id}
      RETURNING id, slug, destination_path, is_default
    `
    row = updated[0]
    console.log(`Updated default link slug: "${current.slug}" → "${normalizedSlug}"`)
  } else {
    const inserted = await sql`
      INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
      VALUES (${creator.id}, ${normalizedSlug}, ${DESTINATION_PATH}, TRUE)
      RETURNING id, slug, destination_path, is_default
    `
    row = inserted[0]
    console.log(`Inserted new default tracking link with slug "${normalizedSlug}"`)
  }
}

console.log('Row:', row)
console.log(`Shareable URL: ${PUBLIC_BASE_URL}/${row.slug}`)
