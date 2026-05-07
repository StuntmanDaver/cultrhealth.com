// Recipients for "new creator signup / application" notification emails.
// Distinct from OWNER_EMAILS in lib/config/owner-emails.ts:
//   - OWNER_EMAILS is used to FILTER OUT internal/test activity from admin
//     analytics (includes Tony, excludes Stewart who operates as a real creator).
//   - CREATOR_NOTIFICATION_EMAILS is the inbox list for new creator signup
//     and application review pings.
//
// Per founder request (May 2026), send these review emails only to David.
export const CREATOR_NOTIFICATION_EMAILS: readonly string[] = [
  'david@cultrhealth.com',
] as const
