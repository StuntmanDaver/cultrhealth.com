# Architecture Patterns: Patient Portal with EHR Integration

**Domain:** Authenticated patient portal for existing Next.js 14 telehealth platform
**Researched:** 2026-03-10
**Overall confidence:** HIGH (patterns derived from existing codebase analysis + established practices)

---

## Recommended Architecture

### System Overview

The patient portal adds an authenticated layer between the existing Next.js frontend and the Asher Med EHR API. The core architectural principle is **API proxy isolation**: the client never communicates with Asher Med directly. All EHR data flows through CULTR backend API routes that hold the `X-API-KEY` credential server-side.

```
                                 +------------------+
                                 |   Twilio Verify   |
                                 |   (SMS OTP)       |
                                 +--------+---------+
                                          |
                                          | send/check OTP
                                          |
+-------------------+    fetch    +-------+----------+    X-API-KEY    +------------------+
|                   |  -------->  |                    |  ----------->  |                  |
|  Client Browser   |            |  CULTR API Routes  |               |  Asher Med API   |
|  (React/Next.js)  |  <-------  |  (Next.js Route    |  <----------  |  (EHR/EMR)       |
|                   |    JSON     |   Handlers)        |    JSON        |                  |
+-------------------+            +----+-------+-------+               +------------------+
                                      |       |
                                      |       | JWT in httpOnly cookie
                                      |       |
                                 +----+-------+-------+
                                 |   Neon PostgreSQL    |
                                 |  (sessions, cache,   |
                                 |   identity mapping)  |
                                 +---------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **OTP Auth Module** (`lib/otp.ts`) | Twilio Verify API wrapper: send OTP, check OTP, rate limit by phone | Twilio Verify API, rate-limit module |
| **Session Manager** (extended `lib/auth.ts`) | Create/verify/refresh JWT sessions with phone-based identity claims | PostgreSQL (session lookup), cookie storage |
| **Patient Identity Resolver** (`lib/patient-identity.ts`) | Map phone number to `asher_patient_id`, cache in DB | Asher Med API (`getPatientByPhone`), PostgreSQL |
| **Member API Proxy Routes** (`app/api/portal/*`) | Authenticated proxy endpoints for all EHR data (profile, orders, documents) | Session Manager, Asher Med API, PostgreSQL |
| **Portal UI Components** (`app/portal/*`, `components/portal/*`) | Client-side dashboard, profile, orders, documents | Member API Proxy Routes only |
| **Provider API Routes** (`app/api/provider/*`) | Provider-authenticated proxy for patient search/lookup | Session Manager (admin/provider role check), Asher Med API |
| **Middleware** (extended `middleware.ts`) | Route-level auth gating: redirect unauthenticated users to login | JWT cookie verification (lightweight, Edge-compatible) |

---

## Auth Flow Architecture

### OTP Authentication Flow (Phone to Session)

This is the central new flow. It replaces the magic-link email flow for member portal access with phone + SMS OTP via Twilio Verify.

```
   Member                    CULTR Frontend              CULTR API                 Twilio Verify          Asher Med
     |                            |                         |                          |                     |
     |  1. Enter phone number     |                         |                          |                     |
     |  ========================> |                         |                          |                     |
     |                            |  2. POST /api/portal/   |                          |                     |
     |                            |     auth/send-otp       |                          |                     |
     |                            |  =====================> |                          |                     |
     |                            |                         |  3. Rate limit check     |                     |
     |                            |                         |  (strictLimiter: 3/15m)  |                     |
     |                            |                         |                          |                     |
     |                            |                         |  4. POST /Verifications  |                     |
     |                            |                         |  Channel: sms            |                     |
     |                            |                         |  ======================> |                     |
     |                            |                         |                          |                     |
     |  5. SMS arrives            |                         |  <== { sid, status }     |                     |
     |  <============             |  <== { success }        |                          |                     |
     |                            |                         |                          |                     |
     |  6. Enter OTP code         |                         |                          |                     |
     |  ========================> |                         |                          |                     |
     |                            |  7. POST /api/portal/   |                          |                     |
     |                            |     auth/verify-otp     |                          |                     |
     |                            |  =====================> |                          |                     |
     |                            |                         |  8. POST /Verification   |                     |
     |                            |                         |     Checks (code)        |                     |
     |                            |                         |  ======================> |                     |
     |                            |                         |                          |                     |
     |                            |                         |  <== { status: approved }|                     |
     |                            |                         |                          |                     |
     |                            |                         |  9. Resolve patient ID   |                     |
     |                            |                         |  ==============================================>|
     |                            |                         |  <== AsherPatient { id } =====================|
     |                            |                         |                          |                     |
     |                            |                         |  10. Cache phone ->      |                     |
     |                            |                         |      asher_patient_id    |                     |
     |                            |                         |      in portal_sessions  |                     |
     |                            |                         |                          |                     |
     |                            |                         |  11. Create JWT          |                     |
     |                            |                         |      { phone, patientId, |                     |
     |                            |                         |        role: 'patient' } |                     |
     |                            |                         |                          |                     |
     |                            |  <== Set-Cookie:        |                          |                     |
     |                            |      cultr_portal       |                          |                     |
     |  <== redirect /portal      |      (httpOnly)         |                          |                     |
     |                            |                         |                          |                     |
```

### Key Design Decisions in the Flow

**Separate cookie name (`cultr_portal`) from existing session (`cultr_session`).**
The existing `cultr_session` cookie carries email-based identity with `customerId` (Stripe customer ID). The new portal session carries phone-based identity with `asherPatientId`. These are fundamentally different identity models. Using separate cookies means:
- Members can be logged into the library (email/Stripe-based) AND the portal (phone/EHR-based) simultaneously without conflict
- Existing creator portal auth (`cultr_session` with `creatorId`) is untouched
- Each auth context validates against its own expected claims
- Logout from one does not break the other

**Confidence:** HIGH -- this follows the existing pattern where creator auth and member auth coexist on the same `cultr_session` cookie but with different role claims. However, the phone-based vs email-based identity split makes a separate cookie cleaner than overloading the existing one.

**Alternative considered:** Merging into the existing `cultr_session` by adding `asherPatientId` claim. Rejected because:
1. Existing session is email-keyed; phone OTP has no email
2. Would require modifying `createSessionToken` signature and all callers
3. Risk of breaking existing library/creator auth flows

### Session Token Structure

```typescript
// New portal session JWT payload
interface PortalSessionPayload {
  phone: string              // E.164 formatted phone number
  asherPatientId: number     // Cached Asher Med patient ID
  firstName: string          // For display (from Asher Med patient record)
  role: 'patient' | 'provider'
  type: 'portal_session'     // Distinguishes from 'session' type in existing JWT
}

// Token configuration
const PORTAL_SESSION_COOKIE = 'cultr_portal'
const PORTAL_SESSION_EXPIRY = '7d'   // Match existing session duration
const PORTAL_SESSION_SECRET = process.env.SESSION_SECRET  // Reuse existing secret
```

**Confidence:** HIGH -- reusing the existing `SESSION_SECRET` is safe because the `type` claim (`portal_session` vs `session`) prevents cross-acceptance. The `jose` library and HS256 algorithm match the existing pattern exactly.

---

## Patient Identity Resolution

### The Phone-to-PatientID Mapping Problem

Asher Med uses numeric patient IDs. Members authenticate with phone numbers. The system needs to resolve `phone -> asher_patient_id` efficiently without calling the Asher Med API on every request.

### Resolution Strategy: Lookup Once, Cache in DB

```
First Login:
  phone (E.164) --> getPatientByPhone(phone) --> Asher Med API
                                                    |
                                                    v
                                              AsherPatient { id: 12345 }
                                                    |
                                                    v
                                          INSERT INTO portal_sessions
                                          (phone, asher_patient_id, ...)
                                                    |
                                                    v
                                          JWT { asherPatientId: 12345 }

Subsequent Logins:
  phone (E.164) --> SELECT asher_patient_id
                    FROM portal_sessions
                    WHERE phone = $1
                         |
                         v
                   Found? --> Use cached ID, skip API call
                   Not found? --> Call getPatientByPhone(), cache result
```

### Database Schema: `portal_sessions` Table

```sql
CREATE TABLE portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,                    -- E.164 format (+15551234567)
  asher_patient_id INTEGER,              -- Cached patient ID from Asher Med
  first_name TEXT,                       -- Cached for display
  last_name TEXT,                        -- Cached for display
  last_login_at TIMESTAMPTZ,             -- Track activity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT portal_sessions_phone_unique UNIQUE (phone)
);

CREATE INDEX idx_portal_sessions_phone ON portal_sessions (phone);
CREATE INDEX idx_portal_sessions_patient_id ON portal_sessions (asher_patient_id);
```

**Why a new table instead of extending `memberships`?**
- Not all portal users have a Stripe membership (some are Asher Med patients without CULTR subscriptions)
- Not all CULTR members have Asher Med patient records yet (new signups before intake)
- Phone is the identity key for portal; email/stripe_customer_id is the key for memberships
- Clean separation of concerns: portal_sessions is an auth/identity table, memberships is a billing table

**Confidence:** HIGH -- the existing DB already separates concerns (waitlist, memberships, creators, club_members are all separate tables).

### Handling Edge Cases

| Scenario | Behavior |
|----------|----------|
| Phone matches no Asher Med patient | Login succeeds (OTP verified), `asher_patient_id` is NULL. Dashboard shows "Complete your intake to get started" with CTA to `/intake` |
| Phone matches multiple patients | `getPatientByPhone` returns first match. Asher Med deduplicates by phone natively |
| Patient changes phone number | Old session still works (JWT contains patientId). New phone creates new portal_session. Admin can manually link if needed |
| Patient has portal_session but Asher Med deleted them | API proxy calls will return errors. Portal shows appropriate error states. Does NOT break auth |

---

## API Proxy Pattern

### Why Proxy (Never Direct Client-to-EHR)

1. **Security:** The `X-API-KEY` for Asher Med must never reach the browser. Exposing it compromises all patient data for all partners.
2. **HIPAA:** Server-side proxy allows PHI filtering, audit logging, and rate limiting before data reaches the client.
3. **Resilience:** Proxy can cache, retry, and transform data. Client is insulated from Asher Med API instability.
4. **Data shaping:** Asher Med returns full patient records. Proxy strips fields the frontend does not need.

### Proxy Route Structure

```
app/api/portal/
  auth/
    send-otp/route.ts       -- POST: send OTP via Twilio Verify
    verify-otp/route.ts      -- POST: verify OTP, create session
    logout/route.ts          -- POST: clear portal session cookie
    session/route.ts         -- GET: return current session info (for client hydration)

  profile/route.ts           -- GET: fetch patient profile from Asher Med
                             -- PUT: update patient profile via Asher Med

  orders/route.ts            -- GET: fetch patient's orders from Asher Med
  orders/[orderId]/route.ts  -- GET: fetch single order detail from Asher Med

  documents/route.ts         -- GET: list patient documents (consent forms, IDs, prescriptions)
  documents/upload/route.ts  -- POST: get presigned URL, upload document
  documents/[key]/route.ts   -- GET: get preview URL for a document
```

### Proxy Auth Guard Pattern

Every proxy route follows this pattern. Use a shared helper to avoid duplication:

```typescript
// lib/portal-auth.ts
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const PORTAL_COOKIE = 'cultr_portal'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || '')

export interface PortalSession {
  phone: string
  asherPatientId: number | null
  firstName: string
  role: 'patient' | 'provider'
}

export async function verifyPortalSession(
  request: NextRequest
): Promise<PortalSession | null> {
  const token = request.cookies.get(PORTAL_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.type !== 'portal_session') return null

    return {
      phone: payload.phone as string,
      asherPatientId: payload.asherPatientId as number | null,
      firstName: payload.firstName as string,
      role: payload.role as 'patient' | 'provider',
    }
  } catch {
    return null
  }
}

// Usage in a proxy route:
export async function GET(request: NextRequest) {
  const session = await verifyPortalSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (!session.asherPatientId) {
    return NextResponse.json({ error: 'No patient record linked' }, { status: 404 })
  }

  // Now safe to call Asher Med with session.asherPatientId
  const patient = await getPatientById(session.asherPatientId)
  // ... strip sensitive fields, return to client
}
```

**Confidence:** HIGH -- this mirrors the existing `verifyAuth()` / `verifyCreatorAuth()` / `verifyAdminAuth()` pattern in `lib/auth.ts` exactly.

### Data Filtering at the Proxy Layer

The proxy MUST NOT blindly forward the full Asher Med response to the client. Filter to only what the UI needs:

```typescript
// Example: profile endpoint returns only display-safe fields
function sanitizePatientForClient(patient: AsherPatient) {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phoneNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: {
      line1: patient.address1,
      line2: patient.address2,
      city: patient.city,
      state: patient.stateAbbreviation,
      zip: patient.zipcode,
    },
    height: patient.height,
    weight: patient.weight,
    bmi: patient.bmi,
    // OMIT: internal IDs, partner notes, clinical data
  }
}
```

---

## Route Protection: Middleware Strategy

### Current Middleware State

The existing `middleware.ts` only handles `join.cultrhealth.com` hostname rewriting. It does NOT do auth checks. Auth is currently handled per-route (each API route calls `verifyAuth()` or `verifyCreatorAuth()` manually, and page layouts do client-side auth checks via `useEffect` + API calls).

### Recommended Approach: Extend Middleware for Portal Routes

Add lightweight JWT presence check in middleware for `/portal/*` routes. This provides instant redirect-to-login for unauthenticated users without waiting for client-side hydration.

```typescript
// middleware.ts (extended)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PORTAL_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'cultr-session-secret-change-in-production'
)

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // --- Existing: join.cultrhealth.com rewrite ---
  if (hostname === 'join.cultrhealth.com' || hostname === 'join.staging.cultrhealth.com') {
    // ... existing rewrite logic unchanged ...
  }

  // --- New: Portal route protection ---
  if (request.nextUrl.pathname.startsWith('/portal')) {
    const token = request.cookies.get('cultr_portal')?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      await jwtVerify(token, PORTAL_SECRET)
      // Valid token -- allow through
      return NextResponse.next()
    } catch {
      // Expired or invalid token -- redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      const response = NextResponse.redirect(loginUrl)
      // Clear the bad cookie
      response.cookies.delete('cultr_portal')
      return response
    }
  }

  // --- New: Provider route protection ---
  if (request.nextUrl.pathname.startsWith('/provider')) {
    const token = request.cookies.get('cultr_portal')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/provider/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, PORTAL_SECRET)
      if (payload.role !== 'provider') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/provider/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Why middleware instead of layout-level auth checks?**
- **Instant redirect:** No flash of unauthenticated content. User sees login page immediately instead of loading skeleton then redirect.
- **Edge-compatible:** `jose` works in Edge Runtime (no Node.js crypto dependency). The existing codebase already uses `jose`.
- **Lightweight:** JWT signature verification takes ~1-2ms. No database call in middleware.
- **Defense in depth:** Middleware is the first gate. API routes still independently verify with `verifyPortalSession()`. Both must pass.

**Why NOT move all auth to middleware?**
- Middleware should only do presence/validity checks, not authorization decisions that require DB lookups
- API routes need the full session payload (patientId, role) which requires `jwtVerify` anyway
- Keeping API-level auth guards means API routes are secure even if called directly (e.g., by mobile app in future)

**Confidence:** HIGH -- `jose` is already the JWT library in use, Edge Runtime compatible, and the middleware pattern is well-documented for Next.js 14.

### Coexistence with Existing Auth Flows

| Auth System | Cookie | Identity Key | Protected Routes | Changed? |
|-------------|--------|-------------|-----------------|----------|
| **Member Library** (existing) | `cultr_session` | email + Stripe customerId | `/library/*`, `/dashboard` | NO |
| **Creator Portal** (existing) | `cultr_session` | email + creatorId | `/creators/portal/*` | NO |
| **Admin** (existing) | `cultr_session` | email + provider allowlist | `/admin/*` | NO |
| **Patient Portal** (NEW) | `cultr_portal` | phone + asherPatientId | `/portal/*` | NEW |
| **Provider View** (NEW) | `cultr_portal` | phone + role=provider | `/provider/*` | NEW |

The separate cookie approach means zero changes to existing auth infrastructure. Existing routes do not read `cultr_portal`; new routes do not read `cultr_session`.

---

## Data Flow: How Information Moves

### Portal Dashboard Load

```
1. Browser: GET /portal
2. Middleware: check cultr_portal cookie JWT -> valid -> allow
3. Page component (server): render shell + loading states
4. Client hydration: PortalProvider context mounts
5. PortalProvider: GET /api/portal/session -> returns { phone, patientId, firstName }
6. PortalProvider: GET /api/portal/orders -> returns sanitized order list
7. PortalProvider: GET /api/portal/profile -> returns sanitized patient profile
8. Dashboard renders with data
```

### Profile Update

```
1. Member edits profile form
2. Client: PUT /api/portal/profile { firstName, lastName, address, ... }
3. API route: verifyPortalSession() -> get asherPatientId
4. API route: updatePatient(asherPatientId, data) -> Asher Med API
5. API route: update cached name in portal_sessions table
6. Response: { success: true, patient: sanitizedData }
7. Client: update PortalContext state
```

### Document Upload

```
1. Member selects file
2. Client: POST /api/portal/documents/upload { contentType: 'image/jpeg' }
3. API route: verifyPortalSession() -> authenticated
4. API route: getPresignedUploadUrl(contentType) -> Asher Med -> S3 presigned URL
5. Response: { uploadUrl, key }
6. Client: PUT to S3 presigned URL directly (file bytes, not through CULTR API)
7. Client: confirms upload to API route if needed
```

---

## Twilio Verify Integration

### Module Design (`lib/otp.ts`)

```typescript
// Thin wrapper around Twilio Verify REST API
// Does NOT use the Twilio Node SDK to avoid dependency bloat

const TWILIO_API_BASE = 'https://verify.twilio.com/v2'

export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  // POST to /Services/{ServiceSid}/Verifications
  // Channel: 'sms'
  // To: phone (E.164)
}

export async function verifyOTP(phone: string, code: string): Promise<{ valid: boolean; error?: string }> {
  // POST to /Services/{ServiceSid}/VerificationCheck
  // To: phone (E.164)
  // Code: code
}
```

**Use the REST API directly (not the Twilio Node SDK).** The Twilio Node SDK adds ~5MB to the bundle and pulls in dozens of dependencies. The Verify API is two HTTP endpoints. A `fetch`-based wrapper is simpler, lighter, and matches the existing `asherRequest()` pattern in `lib/asher-med-api.ts`.

**Confidence:** HIGH -- the Twilio Verify API is well-documented with two primary endpoints (create verification, check verification). REST calls via `fetch` are proven in this codebase.

### Rate Limiting for OTP

OTP endpoints are abuse-sensitive. Apply the existing `strictLimiter` from `lib/rate-limit.ts`:

```typescript
// In send-otp route handler:
const ip = getClientIp(request)
const rateLimitResult = await otpLimiter.check(ip)
if (!rateLimitResult.success) {
  return rateLimitResponse(rateLimitResult)
}

// Also rate limit by phone number (prevents targeted harassment):
const phoneLimitResult = await phoneOtpLimiter.check(formattedPhone)
if (!phoneLimitResult.success) {
  return NextResponse.json({ error: 'Too many attempts for this number' }, { status: 429 })
}
```

Recommended limits:
- **Per IP:** 5 OTP requests per 15 minutes (slightly more generous than strictLimiter's 3)
- **Per phone:** 3 OTP requests per 15 minutes
- **OTP verification attempts per phone:** 5 per 15 minutes (prevent brute force)

### HIPAA Considerations for OTP

- OTP codes expire in 5 minutes (Twilio Verify default is 10 minutes; configure via `custom_code_validity` parameter to 5 minutes)
- Never log OTP codes, phone numbers with codes, or verification SIDs in plaintext
- The OTP SMS content should not contain PHI (Twilio Verify's default message template is safe: "Your verification code is: XXXXXX")
- Twilio Verify is HIPAA-eligible when covered under a Twilio BAA (requires Security Edition or Enterprise Edition). Verify that CULTR's Twilio account has a signed BAA.

**Confidence:** MEDIUM on HIPAA eligibility specifically for Twilio Verify. Twilio offers HIPAA-eligible products list, and Programmable SMS is covered, but Verify as a product should be confirmed on the current eligible products list. The OTP flow itself (code via SMS) is architecturally sound for HIPAA -- the OTP is not PHI, and the phone number is already known to both parties.

---

## Provider View Architecture

### Separate Login, Lightweight Scope

Providers get a separate login page (`/provider/login`) with their own phone + OTP flow. The JWT `role` claim is set to `provider` based on a server-side allowlist check.

```typescript
// During verify-otp, check if phone belongs to a known provider
const isProvider = isProviderPhone(phone) // Check against env var or DB table
const role = isProvider ? 'provider' : 'patient'

// Provider allowlist (similar to existing PROTOCOL_BUILDER_ALLOWED_EMAILS)
// New env var: PROVIDER_PHONE_ALLOWLIST (comma-separated E.164 numbers)
```

### Provider Routes

```
app/provider/
  login/page.tsx                -- Provider login (phone + OTP, same flow)
  page.tsx                      -- Provider dashboard (patient search)
  ProviderClient.tsx            -- Client component with search + results

app/api/provider/
  patients/route.ts             -- GET: search patients (delegates to Asher Med getPatients)
  patients/[id]/route.ts        -- GET: patient detail (read-only summary)
```

The provider view is intentionally minimal. Providers do clinical work in Asher Med's own portal. CULTR's provider view is for quick patient lookup with a "View in Asher Med" link-out.

---

## File and Route Organization

### New Files to Create

```
lib/
  otp.ts                        -- Twilio Verify API wrapper (sendOTP, verifyOTP)
  portal-auth.ts                -- Portal session JWT creation/verification
  patient-identity.ts           -- Phone -> asher_patient_id resolution + caching

app/portal/
  layout.tsx                    -- Portal layout (PortalProvider context, sidebar, header)
  page.tsx                      -- Dashboard (redirects to /portal/dashboard)
  dashboard/page.tsx            -- Status-first dashboard
  profile/page.tsx              -- Patient profile view/edit
  orders/page.tsx               -- Order history
  orders/[orderId]/page.tsx     -- Order detail
  documents/page.tsx            -- Document viewer/upload
  PortalDashboardClient.tsx     -- Dashboard client component
  PortalProfileClient.tsx       -- Profile client component

app/api/portal/
  auth/send-otp/route.ts        -- Send OTP
  auth/verify-otp/route.ts      -- Verify OTP + create session
  auth/logout/route.ts          -- Clear portal cookie
  auth/session/route.ts         -- Get current session
  profile/route.ts              -- GET/PUT patient profile
  orders/route.ts               -- GET patient orders
  orders/[orderId]/route.ts     -- GET order detail
  documents/route.ts            -- GET document list
  documents/upload/route.ts     -- POST get presigned URL
  documents/[key]/route.ts      -- GET document preview URL

app/provider/
  login/page.tsx                -- Provider login
  page.tsx                      -- Provider patient search

app/api/provider/
  patients/route.ts             -- Search patients
  patients/[id]/route.ts        -- Get patient detail

components/portal/
  PortalHeader.tsx              -- Portal top bar (member name, logout)
  PortalSidebar.tsx             -- Portal navigation
  OrderStatusCard.tsx           -- Prominent status display
  OrderList.tsx                 -- Order history list
  PatientProfileForm.tsx        -- Editable profile form
  DocumentViewer.tsx            -- Document list + preview
  DocumentUploader.tsx          -- File upload component

lib/contexts/
  PortalContext.tsx              -- Portal state (patient data, orders, session)

migrations/
  013_portal_sessions.sql        -- portal_sessions table
```

### Files to Modify (Minimal)

| File | Change | Risk |
|------|--------|------|
| `middleware.ts` | Add portal/provider route guards | LOW -- additive, existing rewrite logic unchanged |
| `components/site/LayoutShell.tsx` | Add `/portal` and `/provider` to `HIDE_CHROME_PREFIXES` | LOW -- single array entry |
| `lib/config/links.ts` | Add `portalLogin`, `providerLogin` links | LOW -- config-only |
| `.env.example` | Add Twilio env vars | LOW -- documentation |

**Confidence:** HIGH -- no existing files need structural changes. All new functionality is additive.

---

## Patterns to Follow

### Pattern 1: Server/Client Component Split (Existing Convention)

**What:** Pages are server components. Interactive parts are extracted to `*Client.tsx` files.
**When:** Always for portal pages.
**Why:** This is the established pattern throughout the codebase (QuizClient.tsx, IntakeFormClient.tsx, ShopClient.tsx, ProtocolBuilderClient.tsx, etc.).

```typescript
// app/portal/dashboard/page.tsx (server component)
import PortalDashboardClient from '../PortalDashboardClient'
export default function PortalDashboardPage() {
  return <PortalDashboardClient />
}

// app/portal/PortalDashboardClient.tsx (client component)
'use client'
import { usePortal } from '@/lib/contexts/PortalContext'
export default function PortalDashboardClient() {
  const { patient, orders, loading } = usePortal()
  // ... render dashboard
}
```

### Pattern 2: Context Provider for Shared State (Existing Convention)

**What:** Portal state shared via React Context, loaded once in layout.
**When:** Portal layout wraps all portal pages.
**Why:** Matches `CreatorProvider` pattern in creator portal.

```typescript
// app/portal/layout.tsx
'use client'
import { PortalProvider } from '@/lib/contexts/PortalContext'

export default function PortalLayout({ children }) {
  // Auth check via API call (same pattern as creator portal layout)
  // On failure -> redirect to /login
  return (
    <PortalProvider>
      <PortalSidebar />
      <PortalHeader />
      <main>{children}</main>
    </PortalProvider>
  )
}
```

### Pattern 3: API Route Auth Guard (Existing Convention)

**What:** Every API route independently verifies the session.
**When:** All `/api/portal/*` and `/api/provider/*` routes.
**Why:** Defense in depth. Middleware handles redirect; API routes handle authorization.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Exposing Asher Med API Key to Client

**What:** Using `NEXT_PUBLIC_ASHER_MED_API_KEY` or making direct Asher Med API calls from client components.
**Why bad:** Compromises all patient data. Single leaked key = full API access to all partner patients.
**Instead:** All Asher Med calls go through `/api/portal/*` proxy routes.

### Anti-Pattern 2: Storing OTP Codes in the Database

**What:** Building a custom OTP system that stores codes in PostgreSQL.
**Why bad:** Twilio Verify handles code generation, storage, expiry, retry logic, and delivery. Reimplementing this adds attack surface and maintenance burden.
**Instead:** Use Twilio Verify's managed service. Your backend only calls "send" and "check" endpoints.

### Anti-Pattern 3: Using Middleware for Complex Authorization

**What:** Putting database lookups, tier checks, or patient-role validation in middleware.
**Why bad:** Middleware runs on Edge Runtime with limited APIs and should be fast. DB calls add latency to every matching request.
**Instead:** Middleware does lightweight JWT validity check only. API routes do full authorization.

### Anti-Pattern 4: Merging Portal Session into Existing Session Cookie

**What:** Adding `asherPatientId` to the existing `cultr_session` JWT.
**Why bad:** The existing session is email-keyed. Phone OTP has no email. Forces awkward null-email sessions that break existing `verifyAuth()` checks expecting email.
**Instead:** Separate `cultr_portal` cookie with phone-keyed identity.

### Anti-Pattern 5: Calling Asher Med API on Every Page Load

**What:** Fetching full patient profile from Asher Med on every portal page render.
**Why bad:** Asher Med API latency adds 200-500ms per call. Multiple calls per page = slow portal.
**Instead:** Cache patient profile and order data in PortalContext. Refresh on explicit actions (pull-to-refresh, profile edit, navigation to orders page). Use `stale-while-revalidate` pattern.

---

## Staging/Development Bypass

Following the existing pattern (team emails auto-provision on staging), the OTP flow should have staging bypass:

```typescript
// In verify-otp route:
function isStagingBypass(phone: string): boolean {
  if (!isStaging()) return false
  // Allow any phone on staging, or check specific test numbers
  const testPhones = process.env.STAGING_TEST_PHONES?.split(',') || []
  return testPhones.length === 0 || testPhones.includes(phone)
}

// If staging bypass, skip Twilio Verify call and accept any 6-digit code
// (or a fixed code like '000000')
```

**Confidence:** HIGH -- this exactly matches the existing staging bypass pattern in `app/api/auth/magic-link/route.ts`.

---

## Suggested Build Order

Based on dependency analysis, build in this order:

### Phase 1: Auth Foundation (no UI dependencies)

1. `lib/otp.ts` -- Twilio Verify wrapper
2. `lib/portal-auth.ts` -- Portal JWT session management
3. `lib/patient-identity.ts` -- Phone-to-patient resolution
4. `migrations/013_portal_sessions.sql` -- Database table
5. `app/api/portal/auth/send-otp/route.ts` -- Send OTP endpoint
6. `app/api/portal/auth/verify-otp/route.ts` -- Verify + session creation
7. `app/api/portal/auth/logout/route.ts` -- Logout
8. `app/api/portal/auth/session/route.ts` -- Session info

**Why first:** Everything depends on auth. API proxy routes need `verifyPortalSession()`. UI needs session context. Test the auth flow independently before building on it.

### Phase 2: API Proxy Layer (depends on Phase 1)

1. `app/api/portal/profile/route.ts` -- Patient profile CRUD
2. `app/api/portal/orders/route.ts` -- Order list
3. `app/api/portal/orders/[orderId]/route.ts` -- Order detail
4. `app/api/portal/documents/route.ts` -- Document list
5. `app/api/portal/documents/upload/route.ts` -- Upload presigned URL
6. `app/api/portal/documents/[key]/route.ts` -- Document preview

**Why second:** These are pure backend routes with no UI. They can be tested with `curl` or API testing tools. The UI layer consumes these.

### Phase 3: Portal UI (depends on Phases 1 + 2)

1. `lib/contexts/PortalContext.tsx` -- State management
2. `components/portal/*` -- UI components
3. `app/portal/layout.tsx` -- Portal layout with auth gate
4. `app/portal/dashboard/page.tsx` -- Dashboard page
5. `app/portal/profile/page.tsx` -- Profile page
6. `app/portal/orders/page.tsx` -- Orders page
7. `app/portal/documents/page.tsx` -- Documents page
8. Login page update (`app/login/page.tsx` or new `/portal/login`)

**Why third:** UI depends on both the auth system and API proxy. Building it last means all data fetching is already tested.

### Phase 4: Middleware + Provider View (depends on Phases 1-3)

1. `middleware.ts` -- Add portal/provider route guards
2. `components/site/LayoutShell.tsx` -- Hide chrome for portal routes
3. `app/provider/login/page.tsx` -- Provider login
4. `app/api/provider/patients/route.ts` -- Patient search
5. `app/provider/page.tsx` -- Provider dashboard

**Why last:** Middleware is a cross-cutting concern that is easier to test after the routes it protects exist. Provider view is a secondary feature that depends on the same auth infrastructure.

---

## Sources

- Twilio Verify API documentation: [https://www.twilio.com/docs/verify](https://www.twilio.com/docs/verify)
- Twilio HIPAA compliance: [https://www.twilio.com/en-us/hipaa](https://www.twilio.com/en-us/hipaa)
- Next.js authentication guide: [https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)
- jose library (Edge-compatible JWT): already in use in codebase via `lib/auth.ts`
- Existing codebase patterns: `lib/auth.ts`, `middleware.ts`, `lib/asher-med-api.ts`, `lib/rate-limit.ts`
