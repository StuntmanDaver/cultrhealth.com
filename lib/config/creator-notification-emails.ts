// Recipients for "new creator signup / application" notification emails.
// Distinct from OWNER_EMAILS in lib/config/owner-emails.ts:
//   - OWNER_EMAILS is used to FILTER OUT internal/test activity from admin
//     analytics (includes Tony, excludes Stewart who operates as a real creator).
//   - CREATOR_NOTIFICATION_EMAILS is the inbox list owners want to be PINGED
//     on for new creator signups (includes Stewart, excludes Tony).
//
// Per founder request (May 2026): when a new creator signs up via either
// the join form (signupType='creator') or /creators/apply, these recipients
// receive an email so they can review the application in the admin queue.
export const CREATOR_NOTIFICATION_EMAILS: readonly string[] = [
  'david@cultrhealth.com',
  'erik@cultrhealth.com',
  'alex@cultrhealth.com',
  'stewart@cultrhealth.com',
] as const
