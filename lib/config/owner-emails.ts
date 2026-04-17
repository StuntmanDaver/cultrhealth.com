// Owner/staff emails that must be excluded from admin-level creator
// analytics, network tables, payouts, and commission aggregates.
//
// Their own creator-portal dashboards (/creators/portal/*) stay untouched —
// this list only affects ADMIN views of aggregate data so internal test
// orders and owner activity don't skew marketplace metrics.
//
// Company-level coupon codes (CULTR20, CULTRSTAFF, etc.) are NOT filtered
// by this list. Filtering is applied on creator email / creator_id only.

export const OWNER_EMAILS: readonly string[] = [
  'erik@cultrhealth.com',
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'david@cultrhealth.com',
  'erik@threepointshospitality.com',
  // stewart@cultrhealth.com is a part owner but operates as a real creator
  // with his own code (STEWART1) — his metrics should appear in admin
  // dashboards alongside other creators.
] as const

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return OWNER_EMAILS.includes(email.trim().toLowerCase())
}

// Postgres array literal usable as a primitive ${binding}::text[]
// Example: sql`... WHERE lower(email) != ALL(${OWNER_EMAILS_PG_ARRAY}::text[])`
// Resolves to: {erik@cultrhealth.com,alex@cultrhealth.com,...}
export const OWNER_EMAILS_PG_ARRAY = `{${OWNER_EMAILS.join(',')}}`
