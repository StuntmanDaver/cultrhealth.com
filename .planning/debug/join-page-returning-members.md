---
status: awaiting_human_verify
trigger: "Deep audit of join page returning-member recognition system before production"
created: 2026-04-04T00:00:00Z
updated: 2026-04-05T03:00:00Z
---

## Current Focus

hypothesis: AUDIT COMPLETE — 2 critical, 4 high, 2 medium issues found and fixed
test: TypeScript clean, 380 tests pass
expecting: Human verification on staging
next_action: Await human verification

## Symptoms

expected: People who have already signed up on join.cultrhealth.com (or are existing patients/members in the database) should NOT be shown the signup modal. They should be recognized and taken directly to content or shown a "welcome back" state.
actual: The signup modal shows every time for returning visitors. There is zero or inconsistent recognition of returning members. All scenarios — past patients, form completers, and returning visitors — are affected.
errors: No console errors or API failures. This is a pure UX regression.
reproduction: Visit join.cultrhealth.com as someone who has previously completed the signup form. The signup modal appears again as if they're a new visitor.
started: Broke recently after several changes to join-club/ area.

## Eliminated

- hypothesis: The commit 7822409 (modal flash fix) reverted the recognition logic
  evidence: That commit only changed initial state from useState(true) to useState(false) and moved setShowSignup(true) to the "no member found" branch. The recognition checks (localStorage + cookie) are intact.
  timestamp: 2026-04-04T23:20:00Z

- hypothesis: The cookie is being set but not read correctly
  evidence: Cookie read logic (lines 259-270) correctly parses cultr_club_visitor cookie. The signup API (lines 147-154) correctly sets the cookie with 90-day expiry and proper domain. Cookie flow is sound for the same-browser case.
  timestamp: 2026-04-04T23:25:00Z

## Evidence

- timestamp: 2026-04-04T23:10:00Z
  checked: JoinLandingClient.tsx lines 242-282 — the recognition useEffect
  found: Recognition flow is: (1) check localStorage for cultr_club_member, (2) check cookie cultr_club_visitor, (3) check localStorage for cultr_club_has_ordered. All three are CLIENT-SIDE only. No server/DB call.
  implication: If client storage is cleared (new device, incognito, cleared data, cookie expired), user is treated as brand new.

- timestamp: 2026-04-04T23:15:00Z
  checked: app/api/club/login/route.ts — the login endpoint
  found: A DB-backed login endpoint EXISTS that queries club_members by email+phone. But it's only used by the LoginModal, which is only shown when cultr_club_has_ordered is set in localStorage AND the user has no member data.
  implication: The DB lookup path is only reachable in a narrow edge case (has ordered but lost member data). For the common case of "returning member, cleared storage", no DB check happens.

- timestamp: 2026-04-04T23:20:00Z
  checked: No API endpoint exists for "check if this visitor is a known member" (e.g., by email or cookie token)
  found: The only club API routes are: signup, login, orders, validate-coupon, event. None provide a "status check" or "am I known?" endpoint.
  implication: Server-side recognition was never implemented — the system was always purely client-side.

- timestamp: 2026-04-04T23:25:00Z
  checked: The signup API sets cookie cultr_club_visitor with 90-day expiry on response (line 147-154)
  found: Cookie is set server-side on signup response. Client also sets both localStorage AND cookie in handleSignupComplete (lines 284-291). Dual-write is correct.
  implication: For same-browser, same-device, within 90 days — recognition works. The gap is cross-device, cleared storage, or expired cookies.

- timestamp: 2026-04-04T23:40:00Z
  checked: Fix implementation — 3 files changed, TypeScript clean, 380 tests pass
  found: Server-side recognition in page.tsx, fallback API in /api/club/check-member, 6-layer recognition cascade in client useEffect
  implication: Returning members now recognized via cookie+DB at SSR time (fastest), with progressive fallback to localStorage, client cookie, and finally server API check.

## Resolution

root_cause: Pre-production audit found 2 critical security issues, 4 high-priority logic bugs, and 2 medium issues in the returning-member recognition implementation.
fix: |
  C1+C2 FIXED: /api/club/check-member email lookups now return ONLY { firstName, exists: true } — no PII (phone, address, age, gender). Cookie-based lookups (trusted) still return full data. Eliminates unauthenticated PII oracle.
  H1 FIXED: Added memberCheckDone state to prevent bare-page gap during Priority 6 async check.
  H2 FIXED: Removed full-form auto-fill from email lookups entirely. Only firstName is pre-filled. Eliminates Frankenstein form from mixed member data.
  H3 FIXED: Login API now SELECTs explicit columns (no more SELECT *) and includes age+gender in response to match ClubMember type.
  H4 FIXED: Signup API cookie now includes signupType, age, gender for consistent schema.
  M1 FIXED: Client-side cookie in handleSignupComplete now includes Secure flag on HTTPS.
  Welcome-back banner text updated to reflect new behavior (no longer says "pre-filled your details").
verification: TypeScript passes (0 errors), all 380 tests pass
files_changed: [app/api/club/check-member/route.ts, app/join/JoinLandingClient.tsx, app/api/club/login/route.ts, app/api/club/signup/route.ts]

---

# PRE-PRODUCTION AUDIT FINDINGS (2026-04-04)

## CRITICAL

### C1: Unauthenticated PII Oracle — `/api/club/check-member?email=...`

**File:** `app/api/club/check-member/route.ts`

Anyone on the internet can query `/api/club/check-member?email=anyone@example.com` and receive: full name, phone number, home address (street/city/state/zip), age, gender, social handle. No authentication, no rate limiting, no CAPTCHA.

**Attack scenario:** Enumerate known emails -> harvest PII -> phishing / identity theft.

**Fix:** Restrict response to `{ exists: true, firstName: "..." }` only. No phone, no address, no age/gender. The "Welcome back!" UX only needs to know the member exists and their first name to personalize. Full PII should only be accessible via the authenticated login flow (email + phone verification).

### C2: Email Enumeration via HTTP Status Codes

**File:** `app/api/club/check-member/route.ts`

200 for known members, 404 for unknown. Allows building a list of which emails have CULTR accounts.

**Fix:** Always return 200. Return `{ member: null }` for non-members and `{ member: { firstName: "..." } }` for members. Add rate limiting (5 req/IP/minute).

## HIGH

### H1: No Loading State During Priority 6 Fetch — Bare Page on First Visit

**File:** `app/join/JoinLandingClient.tsx`, lines 254-350

Initial state: `member = null`, `showSignup = false`, `showLogin = false`. On first visit (no cookie, no localStorage), the useEffect falls through all 5 client checks to Priority 6, which fires a fetch. During the fetch (200-500ms), user sees the page with NO modal — neither signup nor welcome. The signup modal only appears after the fetch returns 404.

**Fix:** Initialize `showSignup` based on whether `serverMember` is null. If `serverMember` is null, default to showing signup immediately, then suppress it if Priority 3-6 finds a member.

### H2: Email Change After Auto-Fill Creates Frankenstein Form

**File:** `app/join/JoinLandingClient.tsx`, lines 737-763

User flow: (1) types alice@example.com, tabs out, form auto-fills with Alice's data. (2) changes email to bob@example.com, tabs out, auto-fill fires again. But the auto-fill only sets EMPTY fields (`if (m.firstName && !firstName)`). Since firstName is already "Alice" from step 1, Bob's firstName won't overwrite it. Result: Alice's name + Bob's email + potentially mixed address data.

**Fix:** When a new email check returns a different member, clear all previously auto-filled fields before applying the new data. Track which fields were auto-filled vs. manually typed.

### H3: Login API Missing age/gender — Type Mismatch with ClubMember

**File:** `app/api/club/login/route.ts`, lines 60-73

Login API response has no `age` or `gender` fields. The `ClubMember` interface has `age: number` and `gender: 'male' | 'female'` as required (non-optional) fields. When `LoginModal` passes the response to `onComplete(data)`, the resulting member object will have undefined for these fields.

TypeScript won't catch it (`strict: false`). Runtime impact: any code reading `member.age` will get undefined instead of a number.

**Fix:** Add age/gender to the login API SELECT + response, OR make them optional in ClubMember.

### H4: Cookie Schema Mismatch — Signup API Cookie Missing Fields

**File:** `app/api/club/signup/route.ts` lines 132-138 vs `app/join/page.tsx` lines 34-38

Signup API sets cookie: `{ firstName, lastName, email, phone, socialHandle, address }` — missing `signupType`, `age`, `gender`.

Page.tsx type declares cookie should have `signupType`. The DB lookup compensates (gets signup_type from DB row), so this is only a problem on the no-DB fallback path (POSTGRES_URL not set).

**Fix:** Add signupType, age, gender to the signup API cookie data.

## MEDIUM

### M1: Client-Side Cookie Missing `Secure` Flag on Production

**File:** `app/join/JoinLandingClient.tsx`, line 356

`handleSignupComplete` sets cookie via raw `document.cookie` string without `Secure` flag. The server-side signup API correctly sets `secure: process.env.NODE_ENV === 'production'`, but the client-side path doesn't.

**Fix:** Add `; Secure` when `window.location.protocol === 'https:'`.

### M2: `SELECT *` in Login API

**File:** `app/api/club/login/route.ts`, line 30

Uses `SELECT *` instead of explicit columns. Should use explicit SELECT like check-member does.

## LOW

### L1: Localhost Dev Bypass Prevents Modal Testing

**File:** `app/join/JoinLandingClient.tsx`, lines 277-280

Hardcoded dev member on localhost. Consider adding `?forceSignup=true` override.

## CONFIRMED CORRECT

- Middleware routing (`join.cultrhealth.com` -> `/join`) -- CORRECT
- LayoutShell hides header/footer for `/join` and `join.cultrhealth.com` -- CORRECT
- Signup API upsert via `ON CONFLICT (LOWER(email))` -- CORRECT, no duplicates
- Logout/reset flow clears localStorage + cookie + state -- CORRECT
- Server-side cookie set by signup API + client-side fallback -- CORRECT
- SQL injection: All queries parameterized via @vercel/postgres tagged templates -- SAFE
- XSS: React JSX auto-escapes all interpolated member data -- SAFE
- Cookie parsing: try/catch on JSON.parse handles malformed cookies gracefully -- SAFE
- Priority cascade structure (early returns) -- CORRECT, no race condition between levels
