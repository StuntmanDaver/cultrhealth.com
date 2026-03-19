---
phase: 01-phone-otp-authentication
plan: 03
subsystem: ui
tags: [portal, otp, login, input-otp, react, tailwind, session-refresh, intake-auto-link]

# Dependency graph
requires:
  - "Dual-token JWT portal auth (15-min access, 7-day refresh) via lib/portal-auth.ts"
  - "Portal session DB helpers (upsert, lookup, update) via lib/portal-db.ts"
  - "POST /api/portal/send-otp, verify-otp, refresh, logout endpoints"
provides:
  - "Portal login page at /portal/login with phone mask, 6-digit OTP input, slide transitions"
  - "Portal layout with auth guard and activity-based session refresh (12-min timer)"
  - "Placeholder dashboard page with logout at /portal/dashboard"
  - "Site integration: Header Members link -> /portal/login, LayoutShell hides chrome on /portal/*"
  - "Intake submit auto-links portal session with new asher_patient_id"
  - "10 component tests for login UI"
affects: [02-01-PLAN, portal-dashboard, intake-form]

# Tech tracking
tech-stack:
  added: [input-otp]
  patterns: ["multi-step single-page login with CSS slide transitions", "activity-based silent token refresh", "portal auth guard in layout with login page exemption"]

key-files:
  created:
    - app/portal/login/page.tsx
    - app/portal/login/PortalLoginClient.tsx
    - app/portal/layout.tsx
    - app/portal/dashboard/page.tsx
    - tests/components/PortalLogin.test.tsx
  modified:
    - components/site/Header.tsx
    - components/site/LayoutShellClient.tsx
    - lib/config/links.ts
    - app/api/intake/submit/route.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Login page uses CSS translateX transitions for phone->OTP->support steps (not route navigation)"
  - "Portal layout auth guard skips /portal/login via pathname check (Next.js App Router nests login under portal layout)"
  - "Activity-based refresh fires at 12 minutes (3 minutes before 15-min access token expiry)"
  - "Intake submit auto-link is wrapped in try/catch so portal DB failures never break intake submission"

patterns-established:
  - "Portal pages: dark theme using grad-dark class, matching existing /login aesthetic"
  - "Portal layout: client component with usePathname() to exempt login page from auth guard"
  - "Session refresh: passive event listeners (mousemove, keydown, scroll, touchstart) with debounced timer"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04, AUTH-07, AUTH-09, AUTH-10, AUTH-06]

# Metrics
duration: 12min
completed: 2026-03-11
---

# Phase 1 Plan 03: Portal Login UI & Site Integration Summary

**Phone OTP login page with US mask input, 6-digit OTP boxes (input-otp), slide transitions, portal auth guard layout, and intake auto-link wiring**

## Performance

- **Duration:** ~12 min (across two execution sessions with human verification checkpoint)
- **Started:** 2026-03-11T02:10:00Z
- **Completed:** 2026-03-11T12:39:49Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files created:** 5
- **Files modified:** 6

## Accomplishments
- Complete phone OTP login flow: phone entry with US (XXX) XXX-XXXX mask, 6-digit OTP input with auto-advance and autocomplete='one-time-code', smooth CSS slide transitions between phone/OTP/support steps
- Portal layout with auth guard (redirects unauthenticated users to /portal/login) and activity-based session refresh that silently renews the access token after 12 minutes of activity
- Site integration: Header "Members" nav link now points to /portal/login, LayoutShell hides site chrome on all /portal/* routes, links.ts includes portalLogin and portalDashboard
- Intake submit route auto-links portal sessions with new Asher Med patient IDs after patient creation (AUTH-07), enabling seamless dashboard access without re-login
- 10 component tests covering rendering, phone formatting, OTP transitions, error display, and three-way verify branching (dashboard/intake/support)
- Two post-commit fixes applied during human verification: staging bypass for send-otp and increased login page sizing

## Task Commits

Each task was committed atomically:

1. **Task 1: Portal login page and OTP UI** - `42bedc7` (feat)
2. **Task 2: Portal layout, dashboard, site integration, intake auto-link** - `c609184` (feat)
3. **Task 3: Verify complete OTP login flow end-to-end** - checkpoint (human-verify, approved)

Post-verification fixes (applied during human testing):
- `8ba87ad` - fix(portal): increase login page sizing for better visual presence
- `1b0fa4e` - fix(portal): add staging bypass to send-otp route

## Files Created/Modified
- `app/portal/login/page.tsx` - Server component with metadata for portal login page
- `app/portal/login/PortalLoginClient.tsx` - Client component: phone mask input, 6-digit OTP (input-otp), CSS slide transitions, three-step flow (phone/OTP/support), error handling, resend countdown
- `app/portal/layout.tsx` - Client layout: auth guard with login page exemption, activity-based token refresh (12-min debounce), loading spinner during auth check
- `app/portal/dashboard/page.tsx` - Placeholder dashboard with welcome message and logout button
- `tests/components/PortalLogin.test.tsx` - 10 tests: rendering, phone formatting, OTP transition, back button, error messages, support message, intake redirect
- `components/site/Header.tsx` - Members nav link changed from /library to /portal/login, mobile drawer Sign In link updated
- `components/site/LayoutShellClient.tsx` - Added '/portal' to HIDE_CHROME_PREFIXES
- `lib/config/links.ts` - Added portalLogin and portalDashboard to LINKS object
- `app/api/intake/submit/route.ts` - Added auto-link block: calls updatePortalPatientId after Asher Med patient creation (try/catch, non-fatal)
- `package.json` / `package-lock.json` - Added input-otp dependency

## Decisions Made
- **CSS transitions over route navigation:** Login page uses translateX slide transitions between phone/OTP/support steps within a single client component, not separate routes. Provides the "Stripe/Hims feel" the user requested.
- **Auth guard exempts login page:** Since Next.js App Router nests /portal/login under the portal layout, the layout checks `usePathname()` and skips auth guard for the login route specifically.
- **12-minute refresh timer:** Activity-based refresh fires 3 minutes before the 15-minute access token expiry, giving a comfortable buffer for the refresh call.
- **Non-fatal intake auto-link:** The portal session linking in intake submit is wrapped in try/catch so a portal DB failure never prevents a successful intake submission.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Staging bypass missing from send-otp route**
- **Found during:** Task 3 (human verification)
- **Issue:** The send-otp route attempted to call Twilio on staging even though Twilio credentials are not configured, causing the OTP send to fail
- **Fix:** Added staging environment check to skip Twilio SMS delivery and return success directly on staging
- **Files modified:** app/api/portal/send-otp/route.ts
- **Verification:** OTP flow works end-to-end on staging with bypass code 123456
- **Committed in:** 1b0fa4e

**2. [Rule 1 - Bug] Login page visual sizing too small**
- **Found during:** Task 3 (human verification)
- **Issue:** Login card content appeared too compact on desktop, not matching the visual presence of the existing /login page
- **Fix:** Increased card max-width and adjusted spacing/padding for better visual balance
- **Files modified:** app/portal/login/PortalLoginClient.tsx
- **Verification:** Login page matches expected visual presence on desktop and mobile
- **Committed in:** 8ba87ad

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for staging usability. No scope creep.

## Issues Encountered
- Staging OTP flow required send-otp bypass (not just verify-otp bypass). The Plan 02 implementation had staging bypass only on verify-otp, but the send-otp endpoint still tried to call Twilio, which fails without credentials. Fixed by adding a staging check to send-otp.

## User Setup Required

None for this plan. Twilio credentials (documented in Plan 02 SUMMARY) are needed for production but not staging.

## Next Phase Readiness
- Phase 1 is complete: full phone OTP login flow working end-to-end on staging
- Portal dashboard at /portal/dashboard is a placeholder ready for Phase 2 to build out with order tracking
- Portal layout already has auth guard and session management -- Phase 2 can add sidebar/header within this layout
- Intake auto-link means members who complete intake will seamlessly see their data on the dashboard once Phase 2 builds it
- Blockers for production: Twilio BAA must be signed, Twilio Verify credentials must be added to production environment

## Self-Check: PASSED

All 9 source files verified present. All 4 commits verified in git log (42bedc7, c609184, 8ba87ad, 1b0fa4e).

---
*Phase: 01-phone-otp-authentication*
*Completed: 2026-03-11*
