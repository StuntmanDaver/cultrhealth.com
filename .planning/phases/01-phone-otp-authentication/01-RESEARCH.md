# Phase 1: Phone OTP Authentication - Research

**Researched:** 2026-03-10
**Domain:** SMS OTP authentication, JWT dual-token sessions, phone-to-patient identity linking
**Confidence:** HIGH

## Summary

This phase implements phone-based OTP login for the CULTR Health members portal using Twilio Verify for SMS delivery, `input-otp` for the 6-digit input UI, and the existing `jose` JWT library for dual-token session management. The architecture extends the project's established auth patterns (cookie-based JWT sessions) with a separate portal-scoped cookie and adds Twilio as the sole new external dependency.

The codebase already has strong foundations: `lib/auth.ts` provides JWT sign/verify with `jose`, `lib/rate-limit.ts` has configurable rate limiters with Redis fallback, `lib/asher-med-api.ts` includes `getPatientByPhone()` for identity resolution, and `lib/validation.ts` has phone formatting utilities. The primary new work is: (1) Twilio Verify integration (2 API calls: send + check), (2) dual-token session management (15-min access + 7-day refresh), (3) the portal login UI at `/portal/login`, and (4) a DB migration for the `portal_sessions` table.

**Primary recommendation:** Use Twilio Verify (managed OTP service) rather than Programmable SMS with self-managed codes. Twilio Verify handles code generation, expiration (10 min default), delivery optimization, and built-in rate limiting -- eliminating an entire category of security bugs from hand-rolled OTP.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Login page lives at `/portal/login` (new route, existing `/login` stays as-is)
- Dark hero theme (matches existing `/login` visual style -- `grad-dark` background, white text)
- CULTR logo with "Change the CULTR" tagline and "Access your portal" subtext
- Single-page transition: phone input slides/fades to OTP input on same page (no page navigation)
- 6 individual OTP input boxes, one digit each, auto-advance on entry (use `input-otp` library)
- Back arrow on OTP screen to return to phone input (typo correction)
- Resend OTP button with 30-second visible countdown timer ("Didn't get it? Resend in 28s")
- `autocomplete='one-time-code'` on OTP input for SMS auto-fill
- If phone verifies via OTP but no Asher Med patient record found: redirect straight to `/intake` with session active
- If phone doesn't match any patient AND no local DB record: show "We verified your phone but couldn't find your medical record. Contact support to link your account."
- After intake creates Asher Med patient record: auto-link `asher_patient_id` in local DB (no re-login required)
- Silent background refresh: access token refreshes automatically using refresh token
- On full expiry (7-day refresh token): soft redirect with "Your session expired. Please log in again." message
- Activity tracking: any interaction (mouse, keyboard, scroll, tap) resets the 15-min inactivity timer
- Multi-tab: shared session via cookie. Activity in any tab keeps the session alive across all tabs
- Portal lives at `/portal/*` -- new route group
- Existing `/login` and `/dashboard` remain unchanged
- Header "Members" nav link points to portal login (`/portal/login`)
- LayoutShell hides site chrome (header/footer) on `/portal` routes
- On staging, OTP is always `123456` (SMS still sends but fixed code accepted)

### Claude's Discretion
- Whether to reveal phone registration status on login (security vs UX tradeoff for unregistered phones)
- Exact animation/transition timing for phone to OTP slide
- Error message copy for invalid OTP, expired OTP, rate limited
- Phone input mask implementation approach
- Refresh token rotation strategy (rotating vs. static)
- Cookie name for portal session (`cultr_portal_session` per research recommendation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Member can log in with phone number + OTP via Twilio SMS | Twilio Verify API (send + check), `input-otp` library for UI, portal login page at `/portal/login` |
| AUTH-02 | OTP input auto-fills from SMS notification (`autocomplete='one-time-code'`) | `input-otp` natively supports `autocomplete='one-time-code'`; single hidden input pattern enables browser SMS autofill |
| AUTH-03 | Member session persists across browser refresh (7-day JWT in httpOnly cookie) | Dual-token pattern: 15-min access token + 7-day refresh token, both in httpOnly cookies via `jose` library |
| AUTH-04 | Member session times out after 15 minutes of inactivity with auto-logout | Client-side activity tracker (mouse/keyboard/scroll/touch events) + `lastActivity` claim in access token; silent refresh resets timer |
| AUTH-05 | Member can securely log out from any portal page | Clear both portal cookies (`cultr_portal_access`, `cultr_portal_refresh`), redirect to `/portal/login` |
| AUTH-06 | Phone OTP auth coexists with existing magic link, creator, and admin JWT flows | Separate cookie names (`cultr_portal_*` vs `cultr_session`), separate `verifyPortalAuth()` function, no changes to existing auth code |
| AUTH-07 | First login resolves phone to Asher Med patient ID and caches in local DB | `getPatientByPhone()` from `lib/asher-med-api.ts` + new `portal_sessions` table caching phone-to-patient mapping |
| AUTH-08 | OTP requests are rate-limited to prevent SMS bombing | Dual layer: Twilio Verify built-in limits + project's `rateLimit()` factory (5 requests per phone per hour) |
| AUTH-09 | Phone number input displays with US formatting mask | Lightweight custom mask (US-only, `(XXX) XXX-XXXX`) -- no external library needed for single-country format |
| AUTH-10 | OTP flow shows loading states and clear error messages for invalid/expired codes | `Button` component's `isLoading` prop + error state UI with specific messages per Twilio Verify error code |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `twilio` | ^5.12.2 | Twilio Verify SMS OTP (server-side only) | Managed OTP service; handles code generation, expiration, delivery, rate limiting. HIPAA-eligible with BAA. |
| `input-otp` | ^1.4.2 | 6-digit OTP input component (client-side) | 3.1k GitHub stars, accessible single-input pattern, native `autocomplete='one-time-code'`, unstyled for full Tailwind control. Used by shadcn/ui. |
| `jose` | ^6.1.3 | JWT sign/verify for dual-token sessions | Already installed and used in `lib/auth.ts`. Supports all needed JWT operations. |
| `zod` | ^3.23.0 | Phone number and OTP validation schemas | Already installed, used throughout the project for API validation. |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vercel/postgres` | ^0.10.0 | Database for `portal_sessions` table | Phone-to-patient mapping cache, session metadata |
| `lucide-react` | ^0.563.0 | Icons (ArrowLeft, Phone, Shield, etc.) | Login page UI icons |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.4.0 | `cn()` utility for class merging | All component styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Twilio Verify | Twilio Programmable SMS + self-managed codes | Must hand-roll code generation, expiration, attempt tracking. Higher security risk. Use Verify. |
| `input-otp` | `react-otp-input` or custom implementation | `react-otp-input` uses multiple real inputs (accessibility issue). Custom adds maintenance. Use `input-otp`. |
| Custom phone mask | `react-phone-number-input` or `@react-input/mask` | Overkill for US-only. 15 lines of custom formatting handles `(XXX) XXX-XXXX`. Skip the dependency. |
| `jose` | `jsonwebtoken` | `jose` already installed, works in Edge/Vercel serverless, better TypeScript support. Keep `jose`. |

**Installation:**
```bash
npm install twilio input-otp
```

**Environment Variables (new):**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── portal/
│   ├── login/
│   │   ├── page.tsx                 # Server component (metadata only)
│   │   └── PortalLoginClient.tsx    # Client component (phone + OTP UI)
│   ├── layout.tsx                   # Portal layout (auth guard + PortalContext)
│   └── dashboard/
│       └── page.tsx                 # Placeholder for Phase 2
│
├── api/
│   └── portal/
│       ├── send-otp/route.ts        # POST: validate phone, send OTP via Twilio
│       ├── verify-otp/route.ts      # POST: check OTP, create session, resolve patient
│       ├── refresh/route.ts         # POST: refresh access token using refresh token
│       └── logout/route.ts         # POST: clear portal cookies
│
lib/
├── portal-auth.ts                   # Portal-specific auth functions (dual-token, cookies)
│
migrations/
└── 014_portal_sessions.sql          # portal_sessions table
```

### Pattern 1: Dual-Token Session Architecture
**What:** Two JWTs -- short-lived access token (15 min) and long-lived refresh token (7 days) -- stored in separate httpOnly cookies.
**When to use:** Any authenticated portal API call or page load.
**Why:** Access token expiry enforces the 15-min inactivity timeout; refresh token enables seamless re-authentication without re-entering OTP.

```typescript
// lib/portal-auth.ts

import { SignJWT, jwtVerify } from 'jose'

const PORTAL_ACCESS_COOKIE = 'cultr_portal_access'
const PORTAL_REFRESH_COOKIE = 'cultr_portal_refresh'
const PORTAL_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET)

interface PortalSession {
  phone: string
  asherPatientId: number | null
  type: 'portal_access' | 'portal_refresh'
}

// Access token: 15-minute expiry
export async function createPortalAccessToken(phone: string, patientId: number | null): Promise<string> {
  return new SignJWT({ phone, asherPatientId: patientId, type: 'portal_access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(PORTAL_SECRET)
}

// Refresh token: 7-day expiry
export async function createPortalRefreshToken(phone: string, patientId: number | null): Promise<string> {
  return new SignJWT({ phone, asherPatientId: patientId, type: 'portal_refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(PORTAL_SECRET)
}
```

### Pattern 2: Twilio Verify Integration (Server-Side Only)
**What:** Two API endpoints wrapping Twilio Verify's send and check operations.
**When to use:** OTP send and verify requests from the login page.

```typescript
// app/api/portal/send-otp/route.ts (simplified)

import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!

// Send OTP
const verification = await client.verify.v2
  .services(VERIFY_SERVICE_SID)
  .verifications.create({
    channel: 'sms',
    to: phoneE164,  // E.164 format: +15551234567
  })
// verification.status === 'pending'

// Verify OTP
const check = await client.verify.v2
  .services(VERIFY_SERVICE_SID)
  .verificationChecks.create({
    code: userEnteredCode,
    to: phoneE164,
  })
// check.status === 'approved' | 'pending' (wrong code)
```

### Pattern 3: Client-Side Activity Tracking for Inactivity Timeout
**What:** Event listeners track user activity to keep the 15-min access token fresh via silent background refresh.
**When to use:** All portal pages via the portal layout component.

```typescript
// Conceptual pattern for portal layout
// Activity events: mousemove, mousedown, keydown, scroll, touchstart
// On activity: if access token age > 12 min, call /api/portal/refresh
// On refresh failure (403): redirect to /portal/login with expired message
// Multi-tab: cookie is shared, so any tab's refresh extends all tabs
```

### Pattern 4: Staging OTP Bypass
**What:** On staging environment, accept `123456` as valid OTP regardless of actual Twilio verification result.
**When to use:** Staging testing only.

```typescript
// In verify-otp route handler
const isStaging = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('staging')
if (isStaging && code === '123456') {
  // Skip Twilio check, proceed with session creation
}
```

### Anti-Patterns to Avoid
- **Hand-rolling OTP codes:** Never generate, store, or manage OTP codes yourself. Twilio Verify handles this entirely. Self-managed OTPs introduce timing attacks, storage vulnerabilities, and replay attacks.
- **Single long-lived token:** A single 7-day JWT cannot enforce the 15-min inactivity timeout. Must use dual tokens.
- **Storing OTP codes in the database:** Twilio Verify manages code state. The `portal_sessions` table stores session metadata only, never OTP codes.
- **Modifying `lib/auth.ts` directly:** Portal auth uses separate functions in `lib/portal-auth.ts` to avoid breaking existing magic link, creator, and admin auth flows.
- **Using `cultr_session` cookie for portal:** Must use separate cookie names to ensure auth coexistence (AUTH-06).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTP code generation | Custom random 6-digit code with DB storage | Twilio Verify `.verifications.create()` | Timing attacks, replay attacks, expiration bugs, delivery optimization, international formatting |
| OTP rate limiting | Custom per-phone rate limiter | Twilio Verify built-in limits + project `rateLimit()` for defense-in-depth | Twilio already limits to prevent SMS bombing; project limiter adds IP-based layer |
| SMS delivery | Direct SMS via Programmable SMS | Twilio Verify managed delivery | Verify handles carrier routing, fallback channels, delivery receipts |
| Phone formatting (E.164) | Custom parser | Existing `formatPhoneNumber()` in `lib/asher-med-api.ts` | Already handles US numbers correctly, tested in production |
| JWT token management | Custom crypto | `jose` library (already installed) | Proven JWT implementation, handles HMAC-SHA256, expiration, claims validation |
| OTP input UI | 6 separate `<input>` elements | `input-otp` library | Handles clipboard paste, auto-advance, browser autofill, accessibility, cursor position |

**Key insight:** Twilio Verify is a fully managed OTP verification service, not just an SMS sender. It owns the entire OTP lifecycle (generation, delivery, expiration, validation, rate limiting). Treating it as infrastructure eliminates the most security-sensitive code from the implementation.

## Common Pitfalls

### Pitfall 1: Phone Number Format Mismatch
**What goes wrong:** Twilio Verify requires E.164 format (`+15551234567`), but the user enters `(555) 123-4567`. If conversion is inconsistent between send and verify, the OTP check fails silently.
**Why it happens:** The phone-to-E164 conversion happens in two places (send-otp and verify-otp routes), and if they use different formatting logic, the `to` parameter won't match.
**How to avoid:** Use a single shared function (`formatPhoneNumber()` from `lib/asher-med-api.ts`) in both routes. Store the E.164 form server-side and pass it back to the verify step.
**Warning signs:** OTP sends succeed but verification always returns `status: 'pending'` (wrong code / number mismatch).

### Pitfall 2: Cookie Scope Conflicts with Existing Auth
**What goes wrong:** If portal cookies use the same name or overlapping path as existing `cultr_session`, logging into the portal could break existing member library access, or vice versa.
**Why it happens:** The existing `cultr_session` cookie has `path: '/'`, which means it's sent to all routes including `/portal/*`.
**How to avoid:** Use distinct cookie names (`cultr_portal_access`, `cultr_portal_refresh`). The existing `cultr_session` continues to work for `/library`, `/dashboard`, etc. Portal auth reads only its own cookies via `verifyPortalAuth()`.
**Warning signs:** Logging into portal logs out of member library, or existing session tests start failing.

### Pitfall 3: Access Token Refresh Race Condition
**What goes wrong:** Multiple simultaneous API calls detect an expired access token and all try to refresh simultaneously, creating duplicate refresh requests or invalidating tokens mid-flight.
**Why it happens:** Without a lock/mutex on the refresh operation, concurrent tabs or fetch calls can race.
**How to avoid:** Use a client-side refresh lock (Promise-based singleton). The first caller triggers the refresh; subsequent callers await the same Promise. Only one `/api/portal/refresh` call fires per refresh cycle.
**Warning signs:** Intermittent 401/403 errors after access token expiry, especially with multiple API calls on page load.

### Pitfall 4: Twilio Verify Error Handling
**What goes wrong:** Twilio returns specific error codes (60202 = max attempts, 60203 = max send attempts, 20404 = invalid phone), but the app shows a generic "Something went wrong" for all failures.
**Why it happens:** Not mapping Twilio error codes to user-friendly messages.
**How to avoid:** Handle known Twilio error codes explicitly:
- `60202`: "Too many attempts. Please wait and try again." (max check attempts reached)
- `60203`: "Too many OTP requests. Please wait a few minutes." (max send attempts)
- `20404`: "Please enter a valid US phone number."
- `60200`: "Invalid code. Please check and try again." (wrong code)
**Warning signs:** Users reporting vague errors, support tickets about "code not working."

### Pitfall 5: Staging Bypass Security Leak
**What goes wrong:** The staging OTP bypass (`123456` always accepted) accidentally runs in production.
**Why it happens:** Environment check uses the wrong variable or flawed condition.
**How to avoid:** Check `NEXT_PUBLIC_SITE_URL` for `staging` in hostname (consistent with existing `isStaging()` in `lib/auth.ts`). Add a test that verifies the bypass is disabled when `NEXT_PUBLIC_SITE_URL` is set to production URL.
**Warning signs:** Any user can log in with `123456` on production.

### Pitfall 6: Browser Back/Forward Navigation Breaking OTP State
**What goes wrong:** User enters phone, gets OTP screen, hits browser back, then forward -- UI state is lost or stuck.
**Why it happens:** The phone-to-OTP transition is client-side state, not URL-based navigation.
**How to avoid:** Keep both phone and OTP as states within a single client component (`PortalLoginClient.tsx`). Don't use `router.push()` for the transition. The browser back button navigates away from `/portal/login` entirely (expected behavior).
**Warning signs:** OTP form shows blank phone number, or phone form shows after OTP was already sent.

## Code Examples

### Phone Number US Mask (Custom, No Library)
```typescript
// Lightweight US phone mask for the input field
function formatUSPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Usage in input onChange:
// onChange={(e) => setPhone(formatUSPhone(e.target.value))}
// When sending to API: strip to digits, formatPhoneNumber() converts to E.164
```

### Twilio Verify Send OTP Route
```typescript
// app/api/portal/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/asher-med-api'

const otpLimiter = rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: 'otp-send' })

export async function POST(request: NextRequest) {
  const ip = await getClientIp()
  const ipResult = await otpLimiter.check(ip)
  if (!ipResult.success) return rateLimitResponse(ipResult)

  const { phone } = await request.json()
  if (!phone || !isValidPhoneNumber(phone)) {
    return NextResponse.json({ error: 'Valid US phone number required' }, { status: 400 })
  }

  const phoneE164 = formatPhoneNumber(phone)

  // Per-phone rate limit (separate from IP)
  const phoneResult = await otpLimiter.check(`phone:${phoneE164}`)
  if (!phoneResult.success) return rateLimitResponse(phoneResult)

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ channel: 'sms', to: phoneE164 })

    return NextResponse.json({ success: true, phone: phoneE164 })
  } catch (error: unknown) {
    // Map Twilio error codes to user-friendly messages
    const twilioError = error as { code?: number }
    if (twilioError.code === 60203) {
      return NextResponse.json({ error: 'Too many OTP requests. Please wait.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
```

### Twilio Verify Check OTP Route
```typescript
// app/api/portal/verify-otp/route.ts (simplified)
export async function POST(request: NextRequest) {
  const { phone, code } = await request.json()
  const phoneE164 = formatPhoneNumber(phone)

  const isStaging = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('staging')

  let verified = false
  if (isStaging && code === '123456') {
    verified = true
  } else {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ code, to: phoneE164 })
    verified = check.status === 'approved'
  }

  if (!verified) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  // Resolve patient identity
  const patient = await getPatientByPhone(phoneE164)

  // Create dual tokens
  const accessToken = await createPortalAccessToken(phoneE164, patient?.id ?? null)
  const refreshToken = await createPortalRefreshToken(phoneE164, patient?.id ?? null)

  // Set cookies
  // ... (set both httpOnly cookies)

  // Cache in local DB
  await upsertPortalSession(phoneE164, patient?.id ?? null)

  return NextResponse.json({
    success: true,
    hasPatient: !!patient,
    redirect: patient ? '/portal/dashboard' : '/intake',
  })
}
```

### input-otp Component Integration
```typescript
// Source: github.com/guilhermerodz/input-otp
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp'

<OTPInput
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS}
  inputMode="numeric"
  autoComplete="one-time-code"
  value={otp}
  onChange={setOtp}
  onComplete={handleVerify}
  containerClassName="flex items-center gap-2"
  render={({ slots }) => (
    <div className="flex gap-2">
      {slots.map((slot, idx) => (
        <div
          key={idx}
          className={cn(
            'w-12 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-white/10 transition-all',
            slot.isActive && 'border-cultr-sage ring-2 ring-cultr-sage/30',
            !slot.isActive && 'border-white/20'
          )}
        >
          {slot.char ?? (slot.hasFakeCaret && (
            <div className="w-px h-6 bg-cultr-sage animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )}
/>
```

### Database Migration
```sql
-- migrations/014_portal_sessions.sql
CREATE TABLE IF NOT EXISTS portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  phone_e164 VARCHAR(20) NOT NULL,
  asher_patient_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_sessions_phone_e164
  ON portal_sessions(phone_e164);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_asher_patient_id
  ON portal_sessions(asher_patient_id);
```

### Activity-Based Token Refresh (Client-Side)
```typescript
// Conceptual pattern for usePortalSession hook
function usePortalSession() {
  const refreshLock = useRef<Promise<boolean> | null>(null)

  const refresh = useCallback(async () => {
    if (refreshLock.current) return refreshLock.current
    refreshLock.current = fetch('/api/portal/refresh', { method: 'POST' })
      .then(res => {
        refreshLock.current = null
        return res.ok
      })
      .catch(() => { refreshLock.current = null; return false })
    return refreshLock.current
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => refresh(), 12 * 60 * 1000) // Refresh at 12 min
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(timeout)
    }
  }, [refresh])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Twilio Authy for 2FA | Twilio Verify API v2 | 2023 (Authy deprecated) | Verify is the supported path; Authy SDK no longer maintained |
| Self-managed OTP codes in DB | Managed OTP via Verify | Standard since Verify v2 launch | Eliminates code storage, expiration management, and timing attack surface |
| Single JWT for session | Dual access/refresh tokens | Industry standard by 2024 | Enables inactivity timeout without forcing frequent re-login |
| Multiple `<input>` elements for OTP | Single hidden input with visual slots (`input-otp`) | 2024 (input-otp v1.0) | Better accessibility, clipboard handling, and browser autofill support |

**Deprecated/outdated:**
- **Twilio Authy SDK:** Deprecated. Use Twilio Verify v2 instead.
- **`react-otp-input`:** Uses multiple real inputs, causing accessibility and paste issues. `input-otp` is the modern replacement.

## Discretion Recommendations

### Phone Registration Status Disclosure
**Recommendation: Do NOT reveal registration status.** Always send OTP regardless of whether the phone is registered. After OTP verification, handle the "not found" case. This prevents phone number enumeration attacks (attacker probing which phones have healthcare accounts -- a HIPAA concern).

### Animation/Transition Timing
**Recommendation:** 300ms duration with ease-out for the phone-to-OTP slide transition. Use CSS `transform: translateX()` with opacity fade. This matches the existing `ScrollReveal` timing patterns in the codebase.

### Error Message Copy
**Recommendation:**
- Invalid OTP: "That code didn't match. Please check and try again."
- Expired OTP: "That code has expired. We've sent a new one."
- Rate limited: "Too many attempts. Please wait a few minutes."
- Invalid phone: "Please enter a valid US phone number."

### Phone Input Mask
**Recommendation:** Custom 15-line mask function (shown in Code Examples above). No external library needed since the app only supports US numbers. The mask formats as `(XXX) XXX-XXXX` on input and strips to digits for E.164 conversion.

### Refresh Token Rotation
**Recommendation: Use static (non-rotating) refresh tokens for v1.** Rationale:
- Rotating tokens add complexity (token family tracking, replay detection)
- The 7-day lifetime is relatively short
- The token is in an httpOnly, secure, sameSite cookie (not accessible to JS)
- Can upgrade to rotation in v2 if needed
- The access token already enforces the 15-min security boundary

### Cookie Names
**Recommendation:**
- Access token: `cultr_portal_access` (httpOnly, secure, sameSite: lax, maxAge: 900 / 15 min, path: `/`)
- Refresh token: `cultr_portal_refresh` (httpOnly, secure, sameSite: lax, maxAge: 604800 / 7 days, path: `/api/portal/refresh`)
- Note: The refresh cookie path is scoped to the refresh endpoint only, so it's never sent to other API routes (security best practice).

## Open Questions

1. **Twilio BAA Timeline**
   - What we know: Twilio Verify is HIPAA-eligible (announced Oct 2020). BAA requires Security Edition or Enterprise Edition.
   - What's unclear: Whether CULTR Health has already signed a Twilio BAA, or what the timeline/cost for Security Edition enrollment is.
   - Recommendation: Does not block staging development. Must be resolved before production deployment. Treat as a non-code blocker tracked in STATE.md.

2. **Asher Med `getPatientByPhone()` Phone Format Expectations**
   - What we know: The function exists in `lib/asher-med-api.ts` and accepts a phone string with `encodeURIComponent()`. Returns `AsherPatient | null`.
   - What's unclear: Whether Asher Med expects E.164 format, or 10-digit US format, or handles both. The current code does `encodeURIComponent(phoneNumber)` which suggests it might handle various formats.
   - Recommendation: Test against Asher Med sandbox with both `+15551234567` and `5551234567` formats to confirm. Use whichever format Asher Med expects, and normalize before calling.

3. **Intake Auto-Link Mechanism**
   - What we know: After intake creates an Asher Med patient, the `asher_patient_id` needs to be written back to `portal_sessions` so the member sees their data without re-login.
   - What's unclear: The exact hook point in `IntakeFormClient.tsx` or the intake submission API where this auto-link should happen.
   - Recommendation: The intake submission API (`app/api/intake/submit/route.ts`) already receives the phone number. After successful Asher Med order creation (which returns the patient), update `portal_sessions.asher_patient_id` in the same transaction. The portal dashboard can then read the cached patient ID.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Send OTP via Twilio, verify OTP, create session | unit + integration | `npx vitest run tests/api/portal-send-otp.test.ts tests/api/portal-verify-otp.test.ts -x` | Wave 0 |
| AUTH-02 | OTP input has autocomplete='one-time-code' attribute | unit (component) | `npx vitest run tests/components/PortalLogin.test.tsx -x` | Wave 0 |
| AUTH-03 | Session persists in httpOnly cookie with 7-day refresh | unit | `npx vitest run tests/lib/portal-auth.test.ts -x` | Wave 0 |
| AUTH-04 | Access token has 15-min expiry, refresh reissues | unit | `npx vitest run tests/lib/portal-auth.test.ts -x` | Wave 0 |
| AUTH-05 | Logout clears both portal cookies | unit | `npx vitest run tests/api/portal-logout.test.ts -x` | Wave 0 |
| AUTH-06 | Portal auth uses separate cookies from existing auth | unit | `npx vitest run tests/lib/portal-auth.test.ts -x` | Wave 0 |
| AUTH-07 | Phone resolves to Asher Med patient ID, cached in DB | integration | `npx vitest run tests/api/portal-verify-otp.test.ts -x` | Wave 0 |
| AUTH-08 | Rate limiting on OTP send (IP + phone) | unit | `npx vitest run tests/api/portal-send-otp.test.ts -x` | Wave 0 |
| AUTH-09 | Phone displays with US mask format | unit (component) | `npx vitest run tests/components/PortalLogin.test.tsx -x` | Wave 0 |
| AUTH-10 | Error messages for invalid/expired OTP | unit | `npx vitest run tests/api/portal-verify-otp.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/portal-auth.test.ts` -- covers AUTH-03, AUTH-04, AUTH-06 (dual-token creation, verification, cookie separation)
- [ ] `tests/api/portal-send-otp.test.ts` -- covers AUTH-01, AUTH-08 (OTP send, rate limiting)
- [ ] `tests/api/portal-verify-otp.test.ts` -- covers AUTH-01, AUTH-07, AUTH-10 (OTP verify, patient resolution, error handling)
- [ ] `tests/api/portal-logout.test.ts` -- covers AUTH-05 (cookie clearing)
- [ ] `tests/components/PortalLogin.test.tsx` -- covers AUTH-02, AUTH-09 (component rendering, autocomplete, phone mask)
- [ ] Mock for Twilio SDK in test setup (`vi.mock('twilio')`)

## Sources

### Primary (HIGH confidence)
- Twilio Verify Node.js Quickstart -- API calls, SDK pattern, configuration: https://www.twilio.com/docs/verify/quickstarts/node-express
- Twilio Verify Rate Limits and Timeouts -- 10-min default OTP expiry, status check limits: https://www.twilio.com/docs/verify/api/rate-limits-and-timeouts
- Twilio Verify Best Practices -- E.164 formatting, 30-second resend cooldown, phone masking: https://www.twilio.com/docs/verify/developer-best-practices
- Twilio Verify HIPAA Eligibility announcement: https://www.twilio.com/en-us/changelog/twilio-verify-and-lookup-are-now-hipaa-eligible-
- input-otp GitHub repository -- API, props, slot rendering pattern: https://github.com/guilhermerodz/input-otp
- jose library (already in project) -- JWT sign/verify API: used in `lib/auth.ts`
- Existing codebase files: `lib/auth.ts`, `lib/rate-limit.ts`, `lib/asher-med-api.ts`, `lib/db.ts`, `lib/validation.ts`

### Secondary (MEDIUM confidence)
- Twilio npm package version 5.12.2 (latest): https://www.npmjs.com/package/twilio
- input-otp npm package version 1.4.2 (latest): https://www.npmjs.com/package/input-otp
- JWT dual-token pattern (access + refresh) -- industry standard architecture confirmed across multiple sources

### Tertiary (LOW confidence)
- Twilio BAA enrollment process and Security Edition pricing -- unclear from public docs, needs direct Twilio contact

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via official docs, existing codebase patterns confirmed
- Architecture: HIGH -- dual-token pattern is well-established, Twilio Verify API is straightforward, codebase conventions clear
- Pitfalls: HIGH -- Twilio error codes documented officially, phone format issues observed in production codebases
- Discretion recommendations: MEDIUM -- security recommendations (enumeration prevention, static refresh tokens) are standard practice but context-dependent

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days -- Twilio Verify and jose are stable, input-otp at v1.4.2 is mature)
