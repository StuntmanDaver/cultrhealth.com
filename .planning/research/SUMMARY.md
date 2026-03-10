# Research Summary: CULTR Health Members Portal

**Domain:** HIPAA-Compliant Patient Portal with Phone OTP Auth + EHR Integration
**Researched:** 2026-03-10
**Overall confidence:** HIGH

## Executive Summary

The CULTR Health Members Portal adds phone-based OTP authentication and a patient-facing dashboard to an existing Next.js 14 telehealth platform. The existing codebase already contains the two most complex pieces -- a full Asher Med API client (15 endpoints) and JWT session infrastructure (`jose` library) -- making this primarily an integration and UI project rather than a greenfield build.

The recommended stack adds only 3 new npm packages: `twilio` (v5.12.x) for SMS OTP via the Verify V2 API, `input-otp` (v1.4.x) for an accessible OTP input component with SMS auto-fill, and `libphonenumber-js` (v1.12.x) for phone number validation and E.164 formatting. Everything else leverages existing infrastructure: `jose` for JWTs, `@vercel/postgres` for the phone-to-patient cache, and the existing `rateLimit()` module for abuse prevention.

The architecture follows the existing codebase patterns exactly: server/client component split (`*Client.tsx`), React Context for shared state (`PortalContext`), API routes as proxy layer (never expose Asher Med API key to client), and separate cookie-based sessions (`cultr_portal_session`) to avoid conflicts with existing member, creator, and admin auth flows.

The key HIPAA-driven decision is a dual-token session strategy: 15-minute access tokens for ePHI endpoints with silent refresh via 7-day refresh tokens. This satisfies the automatic logoff addressable safeguard without degrading UX for active users. The existing 7-day `cultr_session` cookie continues to work unchanged for non-portal features.

## Key Findings

**Stack:** 3 new packages (`twilio`, `input-otp`, `libphonenumber-js`) + extending existing `jose`/`@vercel/postgres`/`rate-limit.ts`. No new auth framework needed.

**Architecture:** Separate `cultr_portal_session` cookie with 15-min access + 7-day refresh tokens. All Asher Med data proxied through `/api/portal/*` routes. New `phone_sessions` DB table caches phone-to-patient-id mapping.

**Critical pitfall:** Twilio BAA must be signed before production deployment. Without it, phone numbers used for healthcare OTP may constitute a HIPAA compliance gap.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Auth Foundation** - Build phone OTP flow end-to-end first
   - Addresses: OTP send/verify, session creation, patient identity linking, rate limiting
   - Avoids: Building UI that depends on auth that doesn't exist yet
   - Includes: Twilio setup, `lib/twilio.ts` wrapper, `lib/portal-session.ts`, migration `013_phone_sessions.sql`
   - Dependencies: None (foundational)

2. **API Proxy Layer** - Backend routes that proxy Asher Med data through portal session auth
   - Addresses: Dashboard data, orders, profile, documents endpoints
   - Avoids: Client-side Asher Med API key exposure
   - Includes: `/api/portal/*` routes with `verifyPortalSession()` guards
   - Dependencies: Phase 1 (auth must work before data routes can validate sessions)

3. **Portal UI** - Patient-facing dashboard, orders, profile, documents pages
   - Addresses: Status-first dashboard, order detail, profile view/edit, document viewer
   - Avoids: Premature UI work before data layer is tested
   - Includes: `app/portal/*` pages, `components/portal/*`, `PortalContext`, login page
   - Dependencies: Phases 1 + 2 (UI consumes both auth and data)

4. **Provider View + Polish** - Lightweight provider lookup + middleware route guards
   - Addresses: Provider patient search, patient detail, link-out to Asher Med
   - Avoids: Scope creep into clinical dashboard (providers use Asher Med for that)
   - Includes: Provider login, `/provider/*` routes, middleware extension, LayoutShell update
   - Dependencies: Phase 1 (same auth infrastructure, different role)

**Phase ordering rationale:**
- Auth first because literally everything depends on session tokens
- API proxy before UI because routes can be tested with curl/API tools without building React components
- Portal UI before provider view because members are the primary users; providers have Asher Med
- Each phase produces a testable, deployable increment

**Research flags for phases:**
- Phase 1: Likely needs deeper research on Twilio BAA enrollment process and timeline (Security Edition vs Enterprise)
- Phase 1: Verify that Twilio Verify (specifically, not just Programmable SMS) is on the HIPAA-eligible products list
- Phase 2: Standard patterns based on existing `verifyAuth()` / `verifyCreatorAuth()`, unlikely to need research
- Phase 3: Standard React/Next.js patterns, unlikely to need research
- Phase 4: May need research on Asher Med deep-linking (can we link directly to a patient record in their portal?)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified via npm. Twilio HIPAA eligibility confirmed via official docs. `jose` and `@vercel/postgres` already in production. |
| Features | HIGH | Feature list derived from existing API capabilities (15 Asher Med endpoints) + PROJECT.md requirements. No speculative features. |
| Architecture | HIGH | Follows existing codebase patterns exactly (server/client split, React Context, API proxy, separate cookies). No new patterns introduced. |
| Pitfalls | HIGH | HIPAA requirements verified against official guidance. Twilio rate limits verified against their docs. Session timeout guidance from multiple HIPAA compliance sources. |
| HIPAA Session Timeout | MEDIUM | 15-minute access token is industry best practice but HIPAA does not mandate a specific duration. Risk assessment should document the chosen timeout. |
| Twilio BAA Scope | MEDIUM | Twilio SMS is HIPAA-eligible. Twilio Verify as a specific product should be confirmed on their current eligible list (may be covered under Programmable SMS umbrella). |

## Gaps to Address

- **Twilio BAA enrollment timeline:** How long does it take to upgrade to Security Edition and sign the BAA? This could be a blocking dependency if it takes weeks.
- **Twilio Verify HIPAA scope:** Confirm that Verify (not just Programmable SMS) is explicitly listed as HIPAA-eligible. The OTP content itself is not PHI, but the phone-number-to-healthcare-service association could be argued as such.
- **Asher Med deep-linking:** Can providers link directly from CULTR's patient detail view to the same patient in Asher Med's portal? Needs API/URL investigation.
- **Refresh token rotation storage:** If implementing proper refresh token rotation (recommended in PITFALLS.md), a `refresh_tokens` table or `jti` tracking in `phone_sessions` is needed. This adds moderate complexity vs. a simpler non-rotating refresh token.
- **Twilio test phone numbers:** Twilio provides test credentials that don't send real SMS. Verify that Twilio Verify works with test credentials for CI/CD, or rely solely on the staging bypass.
