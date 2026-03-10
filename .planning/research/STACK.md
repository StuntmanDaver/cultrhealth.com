# Technology Stack

**Project:** CULTR Health Members Portal (Phone OTP Auth + Patient Dashboard)
**Researched:** 2026-03-10

## Recommended Stack

### Phone OTP Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `twilio` | ^5.12.0 | Twilio Verify V2 SMS OTP delivery and verification | HIPAA-eligible with signed BAA. Verify V2 is the current API (Authy deprecated). Handles OTP generation, delivery, rate limiting, and verification server-side -- no custom OTP storage needed. $0.05/verification + $0.0083/SMS (US). |
| `libphonenumber-js` | ^1.12.0 | Phone number parsing, validation, and E.164 formatting | 145KB (vs Google's 550KB). Already aligns with Asher Med's `formatPhoneNumber()` in `lib/asher-med-api.ts`. Validates before sending to Twilio to avoid wasted API calls. |

**Confidence: HIGH** -- Twilio Verify V2 is the standard for SMS OTP in healthcare. The `twilio` npm package is at v5.12.2 (verified via npm). Twilio SMS is explicitly HIPAA-eligible per their docs.

### OTP Input UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `input-otp` | ^1.4.2 | Accessible, unstyled 6-digit OTP input component | Used by shadcn/ui. Single invisible input with `autocomplete='one-time-code'` enables auto-fill from SMS on iOS/Android. Detects password managers. Fully accessible with screen readers. Unstyled = works with existing Tailwind/brand design system without fighting a component library. |

**Confidence: HIGH** -- Verified on GitHub (guilhermerodz/input-otp). The "unstyled" approach matches CULTR's pattern of Tailwind-first styling without component libraries like shadcn/ui. React 18 compatible.

### Session Management (Extend Existing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `jose` | ^6.1.3 (existing) | JWT creation/verification for phone-authenticated sessions | Already in use (`lib/auth.ts`). Extend `createSessionToken()` to accept phone number as identity instead of email. No new dependency needed. |
| `@vercel/postgres` | ^0.10.0 (existing) | OTP attempt tracking, phone-to-patient-id cache | Already in use. Store phone verification records and cached `asher_patient_id` lookups. No new dependency. |

**Confidence: HIGH** -- These are already in the codebase and proven. The session system in `lib/auth.ts` uses `jose` for HS256 JWTs with 7-day expiry, httpOnly cookies. Extending it is lower risk than introducing a new auth library.

### Phone Number Input UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| No new library | -- | Phone number input on login form | Use a native `<input type="tel">` with Tailwind styling matching existing `Input.tsx` component. US-only phone numbers (matches Asher Med's US telehealth service). `libphonenumber-js` handles formatting on submit. Adding `react-phone-number-input` (with country dropdown, flag icons) is overkill for a US-only service. |

**Confidence: HIGH** -- Asher Med only operates in US states. A country selector adds complexity without value. The existing `isValidPhoneNumber()` in `asher-med-api.ts` already validates 10-15 digit numbers.

### Rate Limiting (Extend Existing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing `lib/rate-limit.ts` | -- | OTP request rate limiting (IP + phone-based) | Already supports in-memory (dev) and Upstash Redis (production) backends. Add a new preconfigured `otpLimiter` alongside existing `apiLimiter`, `formLimiter`, `strictLimiter`. |
| Twilio Verify built-in limits | -- | Server-side rate limiting on OTP delivery | Twilio enforces 5 verification attempts per phone per 10 minutes automatically. This is defense-in-depth. |

**Confidence: HIGH** -- Dual rate limiting (app-level + Twilio-level) is standard practice. The existing `rateLimit()` factory function supports custom window/limit configs.

### HIPAA Session Configuration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `jose` (existing) | ^6.1.3 | Short-lived session tokens for ePHI access | Current 7-day session is too long for HIPAA ePHI access. Phone-auth sessions should use 1-hour access token + sliding refresh. See Architecture section for details. |

**Confidence: MEDIUM** -- HIPAA's automatic logoff is an "addressable" safeguard (not a specific minute requirement), but 15 minutes of inactivity is the widely accepted maximum for web apps accessing ePHI. The existing 7-day session works for the marketing site/library but needs tighter controls for the patient portal.

## No New Auth Framework

**Do NOT introduce NextAuth.js, Auth.js, Clerk, or Supertokens.**

Rationale:
1. The existing JWT auth in `lib/auth.ts` is simple, working, and well-understood (200 lines of code)
2. NextAuth/Auth.js would require restructuring the entire auth flow including creator and admin auth
3. Phone OTP is a single flow: send code, verify code, issue JWT. This does not warrant a framework
4. Clerk/Supertokens add SaaS dependency and monthly costs for a feature that's 50 lines of Twilio API calls
5. The codebase has 3 coexisting auth types (member, creator, admin) -- bolting on a framework risks breaking the other two
6. HIPAA compliance is better controlled when you own the auth code (no black-box token storage)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| SMS Provider | Twilio Verify V2 | AWS SNS, Vonage, Sinch | Twilio offers HIPAA BAA. Verify handles OTP lifecycle (no custom code storage). AWS SNS requires building OTP logic yourself. Vonage/Sinch have smaller ecosystems. |
| SMS Provider | Twilio Verify V2 | Firebase Auth (phone) | Firebase Phone Auth is free but not HIPAA-eligible. No BAA available from Google for Firebase Auth. |
| OTP Input | `input-otp` | `react-otp-input` v3.1.1 | Last published 2 years ago. `input-otp` is more actively maintained, better accessibility (single invisible input vs multiple inputs), and has `autocomplete='one-time-code'` for SMS auto-fill. |
| OTP Input | `input-otp` | Custom 6-input implementation | Reinventing paste handling, focus management, screen reader support, and password manager detection is unnecessary when `input-otp` solves all of these. |
| Phone Input | Native `<input type="tel">` | `react-phone-number-input` | Country dropdown is unnecessary for US-only service. Adds 50KB+ for flag SVGs. |
| Auth Framework | Extend existing `jose` JWT | NextAuth.js / Auth.js | Would require restructuring 3 existing auth flows. Phone OTP is too simple to warrant a framework. Risk of breaking creator and admin auth. |
| Auth Framework | Extend existing `jose` JWT | Clerk | SaaS dependency ($25+/mo at scale), black-box token management, harder to HIPAA-audit. |
| Session Store | JWT in httpOnly cookie | Server-side sessions (Redis) | JWT approach is already working. Server-side sessions would require Redis for every request, adding infrastructure. The existing pattern of stateless JWTs is adequate for this scale. |
| Phone Validation | `libphonenumber-js` | Existing `isValidPhoneNumber()` | The existing function in `asher-med-api.ts` does basic digit-count validation. `libphonenumber-js` adds proper US number format validation, carrier type detection, and formatting -- worth the 65KB code cost for a phone-first auth system. |

## New Dependencies to Install

```bash
# Production dependencies
npm install twilio@^5.12.0 input-otp@^1.4.2 libphonenumber-js@^1.12.0

# No new dev dependencies needed
```

**Total new dependencies: 3** (twilio, input-otp, libphonenumber-js)

## Environment Variables to Add

```bash
# Twilio Verify (required)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX  # For caller ID display (optional with Verify)
```

**Twilio Console Setup Required:**
1. Create a Twilio account and upgrade (free trial cannot send to unverified numbers)
2. Sign the Business Associate Addendum (BAA) for HIPAA -- requires Security or Enterprise edition
3. Create a Verify Service in Twilio Console with:
   - `friendlyName`: "CULTR Health"
   - `codeLength`: 6
   - `doNotShareWarningEnabled`: true (adds "Don't share this code" to SMS)
4. Copy the Service SID (starts with `VA`) to `TWILIO_VERIFY_SERVICE_SID`

## Twilio Verify V2 API Usage Pattern

```typescript
// Server-side only (never expose credentials to client)
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Send OTP
await client.verify.v2
  .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
  .verifications.create({
    channel: 'sms',
    to: '+15551234567', // E.164 format
  })
// Returns { status: 'pending', sid: '...' }

// Verify OTP
const check = await client.verify.v2
  .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
  .verificationChecks.create({
    code: '123456',
    to: '+15551234567',
  })
// Returns { status: 'approved' | 'pending', valid: true | false }
```

**Key points:**
- Twilio stores and validates OTP codes server-side. You never store OTP codes in your database.
- Default OTP expiration: 10 minutes (configurable in Twilio Console)
- Built-in rate limit: 5 attempts per phone per 10 minutes
- `doNotShareWarningEnabled` adds security text to SMS body

## HIPAA-Specific Session Architecture

The existing session system needs two modifications for HIPAA compliance:

### 1. Dual-Token Strategy

| Token | Duration | Purpose | Storage |
|-------|----------|---------|---------|
| Access token | 15 minutes | Authorizes API requests to ePHI endpoints | httpOnly cookie (`cultr_portal_session`) |
| Refresh token | 7 days | Silently refreshes access token when user is active | httpOnly cookie (`cultr_portal_refresh`) |

**Why not keep the existing 7-day session?** The current `cultr_session` cookie (7 days, single token) is fine for the marketing site, library, and creator portal. But patient portal endpoints return ePHI (orders, profile, documents from Asher Med). HIPAA's automatic logoff requirement means sessions accessing ePHI should time out after inactivity. A 15-minute access token that only refreshes on active use achieves this.

### 2. Coexistence with Existing Auth

| Cookie | Auth Type | Used By | Duration |
|--------|-----------|---------|----------|
| `cultr_session` (existing) | Email magic link JWT | Library, marketing site, creator portal | 7 days |
| `cultr_portal_session` (new) | Phone OTP JWT + access token | Patient portal ePHI routes | 15 minutes |
| `cultr_portal_refresh` (new) | Phone OTP JWT + refresh token | Silent token refresh | 7 days |

The phone-auth session uses separate cookie names to avoid conflicts with existing auth. Portal API routes check `cultr_portal_session` first.

## Sources

- [Twilio Verify Node.js Quickstart](https://www.twilio.com/docs/verify/quickstarts/node-express)
- [Twilio Verify API Documentation](https://www.twilio.com/docs/verify/api)
- [Twilio Verify Developer Best Practices](https://www.twilio.com/docs/verify/developer-best-practices)
- [Twilio Verify Rate Limits and Timeouts](https://www.twilio.com/docs/verify/api/rate-limits-and-timeouts)
- [Twilio Verify Service Configuration](https://www.twilio.com/docs/verify/api/service)
- [Twilio and HIPAA](https://www.twilio.com/en-us/hipaa)
- [Twilio Verify Pricing](https://www.twilio.com/en-us/verify/pricing)
- [input-otp GitHub](https://github.com/guilhermerodz/input-otp)
- [libphonenumber-js npm](https://www.npmjs.com/package/libphonenumber-js)
- [twilio npm](https://www.npmjs.com/package/twilio) -- v5.12.2 verified
- [HIPAA Session Timeout Rules (Censinet)](https://censinet.com/perspectives/hipaa-compliance-session-timeout-rules)
- [HIPAA Automatic Logoff Requirements](https://compliancy-group.com/automatic-logoff-procedures-under-the-hipaa-security-rule/)
- [HIPAA MFA Requirements 2026 (StrongDM)](https://www.strongdm.com/blog/hipaa-mfa-requirements)
