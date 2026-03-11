# Phase 1: Phone OTP Authentication - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phone-based OTP login via Twilio SMS, session management (dual-token: 15-min access + 7-day refresh), patient identity linking (phone → `asher_patient_id`), and rate limiting. Delivers the auth foundation that all subsequent portal phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Login Flow Experience
- Login page lives at `/portal/login` (new route, existing `/login` stays as-is)
- Dark hero theme (matches existing `/login` visual style — `grad-dark` background, white text)
- CULTR logo with "Change the CULTR" tagline and "Access your portal" subtext
- Single-page transition: phone input slides/fades to OTP input on same page (no page navigation)
- 6 individual OTP input boxes, one digit each, auto-advance on entry (use `input-otp` library)
- Back arrow on OTP screen to return to phone input (typo correction)
- Resend OTP button with 30-second visible countdown timer ("Didn't get it? Resend in 28s")
- `autocomplete='one-time-code'` on OTP input for SMS auto-fill

### New Member Handling
- If phone verifies via OTP but no Asher Med patient record found → redirect straight to `/intake` with session active (don't show dashboard)
- If phone doesn't match any patient AND no local DB record → show "We verified your phone but couldn't find your medical record. Contact support to link your account."
- After intake creates Asher Med patient record → auto-link `asher_patient_id` in local DB (no re-login required)
- Post-intake, next dashboard visit shows full data automatically

### Session Timeout UX
- Silent background refresh: access token refreshes automatically using refresh token. Member never sees anything unless refresh token also expired.
- On full expiry (7-day refresh token): soft redirect on next page navigation or API call. Show "Your session expired. Please log in again." message on login page.
- Activity tracking: any interaction (mouse, keyboard, scroll, tap) resets the 15-min inactivity timer
- Multi-tab: shared session via cookie. Activity in any tab keeps the session alive across all tabs.

### Portal URL Structure
- Portal lives at `/portal/*` — new route group (`/portal/login`, `/portal/dashboard`, `/portal/orders`, `/portal/profile`, etc.)
- Existing `/login` and `/dashboard` remain unchanged
- Header "Members" nav link points to portal login (`/portal/login`)
- LayoutShell hides site chrome (header/footer) on `/portal` routes (add to `HIDE_CHROME_PREFIXES`)

### Staging Behavior
- On staging, OTP is always `123456` (SMS still sends but fixed code accepted)
- Preserves Twilio credits for production while enabling full-flow testing

### Claude's Discretion
- Whether to reveal phone registration status on login (security vs UX tradeoff for unregistered phones)
- Exact animation/transition timing for phone → OTP slide
- Error message copy for invalid OTP, expired OTP, rate limited
- Phone input mask implementation approach
- Refresh token rotation strategy (rotating vs. static)
- Cookie name for portal session (`cultr_portal_session` per research recommendation)

</decisions>

<specifics>
## Specific Ideas

- Login should feel like Stripe or Hims OTP flow — seamless single-page transition, not clunky multi-page
- 6 individual digit boxes is the expected modern pattern (banks, Stripe, auth apps)
- "Didn't get it? Resend in 28s" countdown reduces support friction significantly
- Members who complete intake should never need to re-login to see their data appear

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/auth.ts`: Full JWT infrastructure — `createSessionToken()`, `verifySessionToken()`, `setSessionCookie()`, `getSession()`, `clearSession()`, `verifyAuth()`. Extend with portal-specific variants.
- `lib/rate-limit.ts`: Pre-built `strictLimiter` (3/15min) perfect for OTP. `getClientIp()` and `rateLimitResponse()` helpers ready.
- `lib/asher-med-api.ts`: `getPatientByPhone()` returns `AsherPatient | null` — direct use for identity linking.
- `components/ui/Button.tsx`: Has `isLoading` prop with built-in spinner — use for OTP send/verify loading states.
- `components/ui/ScrollReveal.tsx`: Existing animation wrapper used on current login page.
- `lib/config/links.ts`: Centralized URL registry — add portal routes here.

### Established Patterns
- Server/client split: `*Client.tsx` for interactive components (follow `LoginClient.tsx` pattern)
- Cookie-based sessions: `cultr_session` cookie with `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`
- Auth coexistence: `verifyAuth()` reads `cultr_session`; new portal auth uses separate cookie name
- Rate limiting: `rateLimit()` factory with config → `check(identifier)` pattern
- React Context: `CreatorContext`, `IntakeFormContext` — follow for `PortalContext`

### Integration Points
- `components/site/LayoutShell.tsx`: Add `/portal` to `HIDE_CHROME_PREFIXES` array
- `components/site/Header.tsx`: Update "Members" nav link to point to `/portal/login`
- `lib/db.ts`: Add `phone_sessions` table operations for phone → patient ID cache
- `app/intake/IntakeFormClient.tsx`: Hook into for auto-linking after intake completion
- New migration needed: `phone_sessions` table (phone, asher_patient_id, verified_at, session data)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-phone-otp-authentication*
*Context gathered: 2026-03-10*
