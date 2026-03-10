# Domain Pitfalls

**Domain:** Telehealth patient portal with phone OTP auth and EHR integration
**Researched:** 2026-03-10
**Confidence:** HIGH (verified against codebase, official docs, enforcement actions)

---

## Critical Pitfalls

Mistakes that cause security breaches, HIPAA violations, or rewrites.

---

### Pitfall 1: Google Analytics Running on Authenticated Patient Portal Pages

**What goes wrong:** The CULTR codebase includes Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) loaded globally in `app/layout.tsx`. When the new patient portal is built under authenticated routes (e.g., `/dashboard`, `/library`, `/intake`), GA4 will fire on pages displaying PHI -- order statuses, medication names, patient profiles. Google does not sign BAAs for Analytics. URL paths alone (e.g., `/dashboard/orders/tirzepatide-renewal`) constitute PHI when linkable to an individual. The OCR has classified this as willful neglect (Tier 4 penalties, $100M+ in settlements 2023-2025 across the industry). Advocate Aurora Health notified 3 million patients after MyChart portal tracking exposed PHI via Google and Meta pixels.

**Why it happens:** GA is loaded site-wide for marketing analytics and nobody thinks to exclude authenticated routes. The script runs before any auth check because it is in the root layout.

**Consequences:** HIPAA violation (potentially Tier 4 -- willful neglect), OCR investigation, patient notification requirements, $50K-$1.5M per violation category fines.

**Prevention:**
1. Move GA4 script loading out of the root `layout.tsx` and into a client component that checks the current route
2. Create an explicit allowlist of marketing routes where GA4 can fire (homepage, pricing, quiz, science, FAQ, community, how-it-works, creators public pages)
3. Block GA4 on all authenticated routes: `/dashboard/*`, `/library/*` (when authenticated), `/intake/*`, `/renewal/*`, `/provider/*`, `/admin/*`
4. Alternatively, use `LayoutShell.tsx` pattern -- the codebase already hides chrome for `/creators/portal` and `/admin`; extend this pattern to conditionally load GA4

**Detection:** Search for `gtag` or `GA_MEASUREMENT_ID` references and verify they cannot execute on authenticated pages. Audit network requests from the portal in browser DevTools to confirm no Google Analytics calls fire.

**Phase:** Must be addressed in Phase 1 (authentication/session setup) before any PHI-displaying pages are built. This is a pre-existing risk that becomes critical the moment authenticated portal pages go live.

**Confidence:** HIGH -- Google's own support page states GA4 is not HIPAA-compliant. OCR enforcement actions are public record.

---

### Pitfall 2: Using Twilio Programmable SMS Instead of Twilio Verify for OTP

**What goes wrong:** Building OTP from scratch with Twilio Programmable SMS means you must: buy a phone number, generate random codes, store codes in your database, manage expiration, build rate limiting per phone number, handle retry logic, implement brute-force lockout, detect toll fraud / SMS pumping, and manage geographic permissions. Every one of these is a security surface area you own. Projects routinely ship OTP with 4 of these 8 protections and get hit by SMS pumping attacks that cost $500-5000/day before anyone notices.

**Why it happens:** Developers reach for the more familiar Programmable SMS API because they have used it before, or because they think "we just need to send a text." Twilio Verify is a separate product that handles all of the above automatically.

**Consequences:** Toll fraud (SMS pumping can run up bills fast), brute force attacks on OTP codes (a 6-digit code has only 1 million combinations), OTP codes stored insecurely in database (new PHI-adjacent data to protect), and significantly more code to maintain.

**Prevention:**
1. Use **Twilio Verify API** (not Programmable SMS) -- it manages code generation, storage, expiry, rate limits per phone, Fraud Guard (automatic SMS pumping detection), and multi-channel fallback (SMS -> voice -> email)
2. You do not buy a phone number -- Verify manages its own sending pool
3. You do not store OTP codes -- Verify handles storage and validation server-side
4. Enable Verify Fraud Guard in the Twilio console (blocks suspicious SMS patterns automatically)
5. Set Verify Geographic Permissions to US-only (or US + territories) to prevent international toll fraud
6. Implement Service Rate Limits on the Verify service: 1 verification per 30 seconds per phone number with exponential backoff

**Detection:** If you see `client.messages.create()` in OTP code instead of `client.verify.v2.services(sid).verifications.create()`, you are using the wrong API.

**Phase:** Phase 1 (auth implementation). This is a foundational choice that affects all downstream OTP logic.

**Confidence:** HIGH -- Twilio's own migration guide explicitly recommends Verify over Programmable SMS for OTP use cases. Fraud Guard is documented as a built-in Verify feature.

---

### Pitfall 3: OTP Rate Limiting Only by IP, Not by Phone Number

**What goes wrong:** The existing `lib/rate-limit.ts` has `strictLimiter` (3 attempts per 15 minutes per IP) and `apiLimiter` (10 per minute per IP). These are IP-based only. An attacker can rotate IPs (trivial with cloud functions or botnets) and: (a) brute-force OTP codes by trying thousands of codes against a single phone number from different IPs, or (b) trigger SMS pumping by requesting OTPs for thousands of different phone numbers from the same IP range, each just under the per-IP limit.

**Why it happens:** The existing rate limiter was built for generic API protection. OTP has different threat models -- the identifier that matters is the phone number, not (just) the IP.

**Consequences:** OTP brute force (6-digit code = 1M combinations; at 10 attempts/min/IP from 100 IPs = 1000 attempts/min, cracked in ~17 minutes without phone-based limiting), Twilio bill shock from SMS pumping, account takeover.

**Prevention:**
1. Rate limit OTP **send** requests by phone number: max 1 per 30 seconds, max 5 per hour, max 10 per day (Twilio Verify handles this if used, but add your own layer too)
2. Rate limit OTP **verify** requests by phone number: max 5 attempts per code, then invalidate the code and require a new one
3. Rate limit by IP as a secondary layer (keep existing `strictLimiter`)
4. Combine: rate limit by phone + IP pair to catch distributed attacks against a single number
5. Use Redis (Upstash is already configured in env vars) for rate limiting -- the in-memory `Map` in `lib/rate-limit.ts` resets on every serverless cold start, making it effectively useless on Vercel

**Detection:** Monitor Twilio usage dashboard for unexpected spikes. Track OTP conversion rate (codes verified / codes sent) -- a rate below 30% indicates abuse. Alert on any phone number receiving > 10 OTPs in 24 hours.

**Phase:** Phase 1 (auth implementation). Must be built alongside the OTP flow, not bolted on later.

**Confidence:** HIGH -- The in-memory rate limiter resetting on cold starts is a verified fact based on reading `lib/rate-limit.ts` (it uses `Map` with `setInterval` cleanup, neither of which persists across Vercel function invocations).

---

### Pitfall 4: Single Cookie Session Conflicts Between Auth Flows

**What goes wrong:** The current codebase uses a single cookie name `cultr_session` for all user types. The `SessionPayload` includes `role: 'member' | 'creator' | 'admin'` but does NOT include a phone number, `asher_patient_id`, or any phone-auth-specific claims. Adding phone OTP auth means the new session token needs to carry phone + `asher_patient_id`. If you overwrite the same `cultr_session` cookie, a user who is both a creator (logged in via email magic link) and a patient (logged in via phone OTP) will lose one session when the other is created. The cookie is set with `path: '/'`, so it applies site-wide.

**Why it happens:** The existing auth was built for a single user type at a time. The PROJECT.md explicitly states "New phone OTP flow needs to coexist with both [magic link and creator JWT]." Using one cookie name forces mutual exclusion.

**Consequences:** Users who are both creators and patients get logged out of one role when logging into the other. Confusing UX. Support tickets. Workaround hacks that create security holes.

**Prevention:**
1. **Option A (Recommended): Unified session with merged claims.** When a user authenticates via phone OTP, look up whether they also have an existing email-based session. If so, merge claims into a single JWT: `{ email, phone, customerId, asher_patient_id, creatorId, role }`. This requires a "linking" step.
2. **Option B: Separate cookie names.** Use `cultr_session` for email/magic-link auth and `cultr_patient_session` for phone OTP auth. API routes check the appropriate cookie based on the route prefix. This is simpler but means duplicate auth checks in routes that serve both user types.
3. **Regardless of approach:** Add `phone` and `asher_patient_id` fields to `SessionPayload` interface. Update `createSessionToken` to accept these new fields. Update `verifyAuth` to return them.
4. **Do NOT store PHI in the JWT** -- `asher_patient_id` (a numeric ID) is acceptable as it is an internal identifier, not PHI by itself. Do not put patient names, DOB, or medical data in the token.

**Detection:** Test the flow: log in as creator -> log in as patient on same browser -> check if creator session still works. If not, you have this bug.

**Phase:** Phase 1 (auth architecture). The session token structure must be designed before any auth endpoints are built.

**Confidence:** HIGH -- Verified by reading `lib/auth.ts`. The `SessionPayload` interface and `cultr_session` cookie name are confirmed single-purpose.

---

### Pitfall 5: Patient Identity Linking Fails on Phone Number Mismatch

**What goes wrong:** The project plan says "First login resolves phone -> Asher patient ID. Cache in DB for fast future lookups." But phone numbers are messy: users enter `(555) 123-4567`, the DB might have `+15551234567`, Asher Med might have `5551234567`. The `formatPhoneNumber()` function in `lib/asher-med-api.ts` normalizes to E.164, but if the phone the user verifies via OTP does not exactly match what is in Asher Med (e.g., user changed phones, used a different number at intake, typo during original registration), `getPatientByPhone()` returns `null`. The user authenticates successfully but sees an empty dashboard with no patient data. They call support. 71% of healthcare organizations report that patient self-registration contributes to duplicate records.

**Why it happens:** Phone number is treated as a reliable unique identifier, but in practice: patients change phones, share phones with family members, use work vs. personal numbers at different times, or their number was entered wrong during initial intake.

**Consequences:** Authenticated user with no data = broken experience. Worse: if you create a new Asher Med patient record as a fallback, you now have duplicate patient records in the EHR, which is a patient safety issue (split medical history, duplicate prescriptions).

**Prevention:**
1. **Never auto-create a new Asher Med patient on login failure.** If `getPatientByPhone()` returns null, show a clear "We couldn't find your records" state with instructions (not an error)
2. **Implement a manual linking flow:** If phone lookup fails, offer email-based verification as a fallback. Use email + DOB + last name to search Asher Med via `getPatients({ search: email })`. If found, link the patient and update their phone number via `updatePatient()`
3. **Normalize phone numbers before comparison:** Always strip to digits, handle +1 prefix, before calling `getPatientByPhone()`. The existing `formatPhoneNumber()` does this -- make sure the OTP verification phone goes through the same normalization
4. **Cache the asher_patient_id -> phone mapping bidirectionally** in the local DB so future lookups do not depend on the external API
5. **Handle the "no Asher Med record yet" case gracefully:** New Club ($0) members who have not completed intake will not have an Asher Med record. Show them a clear CTA to start their intake process instead of an empty/error state

**Detection:** Track the percentage of authenticated users whose `getPatientByPhone()` returns null. If > 10%, investigate data quality. Log (without PHI) the count of failed lookups per day.

**Phase:** Phase 2 (patient identity and dashboard). The linking logic is the core of the portal data flow.

**Confidence:** HIGH -- Verified by reading `getPatientByPhone()` in `lib/asher-med-api.ts` and `formatPhoneNumber()`. The 404 handling exists but the "what happens next" UX is unbuilt.

---

### Pitfall 6: Missing HIPAA Audit Trail for PHI Access

**What goes wrong:** HIPAA requires logging every access to ePHI: who accessed it, when, what data, from where (IP/device). The current codebase has `admin_actions` table for admin audit logging but no equivalent for member access to their own PHI through the portal. Viewing order details, profile data, documents -- every one of these is an ePHI access event that must be logged. Audit logs must be retained for 6 years.

**Why it happens:** Developers think of audit logging as an admin/security feature, not a per-request requirement. "The patient is viewing their own data, why log that?" Because HIPAA requires it, and because compromised accounts viewing patient data need to be detectable.

**Consequences:** HIPAA Security Rule violation (45 CFR 164.312(b) -- audit controls). Inability to investigate breaches. Inability to detect unauthorized access from compromised patient accounts.

**Prevention:**
1. Create a `phi_access_log` table: `{ id, user_id, user_type, action, resource_type, resource_id, ip_address, user_agent, timestamp }`
2. Log every API call that returns PHI: patient profile reads, order list/detail reads, document preview URL generation, profile updates
3. **Do not log the PHI itself** in the audit trail -- log *that* the access happened, not *what* data was returned
4. Implement as middleware or wrapper function for all `/api/member/*` and `/api/provider/*` routes
5. Set up a 6-year retention policy on the audit log table (configure Neon/PostgreSQL accordingly)
6. Consider writing audit logs to a separate, append-only store that cannot be tampered with

**Detection:** Check: does every API route that returns Asher Med patient data also write an audit log entry? If not, you have a gap.

**Phase:** Phase 2 (patient dashboard) -- must be built alongside the first PHI-displaying API routes, not retrofitted.

**Confidence:** HIGH -- HIPAA Security Rule 45 CFR 164.312(b) is explicit. The current codebase has admin audit logging but no patient-access audit logging (verified by searching for `admin_actions` in the codebase).

---

## Moderate Pitfalls

Mistakes that cause significant rework, poor UX, or operational issues.

---

### Pitfall 7: Twilio Verify Not Covered Under HIPAA BAA Without Enterprise Edition

**What goes wrong:** Twilio offers HIPAA BAAs, but only for customers on Security Edition or Enterprise Edition plans. Standard Twilio accounts do not qualify. Additionally, while Programmable SMS, Voice, Video, and SIP are confirmed HIPAA-eligible, Twilio Verify's HIPAA eligibility as a distinct product is not clearly documented. If CULTR signs a BAA with Twilio but Verify is not a covered service under that BAA, OTP codes sent to patient phone numbers (which are PHI -- phone number + context of healthcare relationship) may not be covered.

**Why it happens:** Developers assume "Twilio is HIPAA compliant" without checking which specific products are covered under the BAA, or without upgrading to the required plan tier.

**Prevention:**
1. Before writing any code, confirm with Twilio sales that Verify is covered under the BAA you sign
2. If Verify is NOT covered, use Programmable SMS under the BAA (with all the DIY OTP logic that entails) -- this is less ideal but legally sound
3. Ensure CULTR has a Twilio account at Security Edition or Enterprise Edition tier
4. The OTP message content must not include health-related context ("Your CULTR Health verification code" is borderline -- "Your verification code" is safer)
5. Document the BAA coverage in your HIPAA compliance records

**Detection:** Check your Twilio account tier. Review the BAA appendix for covered services. Search for "Verify" in the BAA document.

**Phase:** Phase 0 (pre-development vendor setup). This is an administrative task that must be resolved before any OTP code is written.

**Confidence:** MEDIUM -- Twilio's HIPAA page lists eligible products but does not explicitly name Verify. Multiple third-party sources flag this ambiguity. Direct confirmation from Twilio sales is needed.

---

### Pitfall 8: Asher Med API Calls From the Client (Exposing the API Key)

**What goes wrong:** The project constraint states "All Asher Med API calls must go through CULTR backend routes (never expose API key to client)." But when building React portal components, it is tempting to call Asher Med endpoints directly from `useEffect` or event handlers, especially for real-time data like order status. If the API key leaks to the client (via an API route that proxies but also returns it, or via environment variable misconfiguration), an attacker gets full partner-level access to all patient data across all CULTR patients.

**Why it happens:** `ASHER_MED_API_KEY` is a server-side env var (no `NEXT_PUBLIC_` prefix), so it should be safe. But common mistakes include: accidentally including it in a response body, creating an API route that forwards the raw Asher Med response including internal headers, or using `getServerSideProps` patterns that serialize server state to the client.

**Prevention:**
1. All Asher Med data flows through `/api/member/*` proxy routes (e.g., `/api/member/orders`, `/api/member/profile`)
2. Proxy routes must: authenticate the request (verify JWT), authorize (user can only access their own data by `asher_patient_id`), call Asher Med, and return a **sanitized** response (strip internal fields, add only what the UI needs)
3. Never return raw Asher Med API responses to the client -- always map to a CULTR-specific response type
4. Add a CI check or linter rule: no imports of `lib/asher-med-api.ts` from files in `app/` client components (only from `route.ts` files)
5. Verify `ASHER_MED_API_KEY` is NOT in any `NEXT_PUBLIC_*` environment variable

**Detection:** Search client-side bundles for "ASHER_MED" or "X-API-KEY" strings. Review API route responses for leaked internal fields.

**Phase:** Phase 2 (dashboard/portal API routes). Must be enforced as a pattern from the first portal API route.

**Confidence:** HIGH -- The constraint is already documented in PROJECT.md. The `asherRequest()` function correctly reads from `process.env.ASHER_MED_API_KEY` (server-only). Risk is in implementation mistakes, not architecture.

---

### Pitfall 9: Showing Empty/Error States When Asher Med API Is Down

**What goes wrong:** The Asher Med API is an external dependency. When it is slow (> 5s) or down, every portal page that depends on it shows a loading spinner forever or an error screen. The patient sees "Something went wrong" when they just want to check their order status. If the portal has no caching layer, every page load hits the API -- and Asher Med rate limits or outages cascade into a fully broken portal.

**Why it happens:** The existing `asherRequest()` function in `lib/asher-med-api.ts` has no timeout, no caching, and no retry logic. It throws on any non-200 response. The `withRetry()` function exists in `lib/resilience.ts` but is not used by the Asher Med API client.

**Consequences:** Poor user experience during API degradation. High Asher Med API call volume (every page load = API call). No graceful degradation.

**Prevention:**
1. **Cache Asher Med responses in the local database:** Patient profile data changes rarely -- cache it for 1 hour. Order status changes more often -- cache for 5 minutes. Documents almost never change -- cache for 24 hours
2. **Add timeouts to `asherRequest()`:** Set `AbortController` with 10-second timeout. Return cached data on timeout
3. **Use `withRetry()` from `lib/resilience.ts`** for transient failures (5xx errors, timeouts). Do not retry 4xx errors
4. **Design "stale data" UI:** Show cached data with a "Last updated X minutes ago" indicator and a manual refresh button, rather than showing nothing or an error
5. **Background refresh pattern:** When cached data is served, trigger a background refresh. If it succeeds, update the cache. If it fails, keep serving stale data with a warning
6. **Health check endpoint:** Create a lightweight `/api/health/asher-med` route that pings the Asher Med API. Use this to show system status to users during outages

**Detection:** Monitor Asher Med API response times and error rates from your API routes. Alert on p95 latency > 5 seconds or error rate > 5%.

**Phase:** Phase 2-3 (dashboard and data display). Caching should be designed in Phase 2 and hardened in Phase 3.

**Confidence:** HIGH -- Verified by reading `lib/asher-med-api.ts`. No timeouts, no caching, no retry integration exists in the API client.

---

### Pitfall 10: OTP Session Expiry Too Long or Too Short

**What goes wrong:** The existing session cookie is set to 7 days (`maxAge: 60 * 60 * 24 * 7`). For a telehealth portal showing PHI, 7 days without re-authentication is a HIPAA risk -- if a user leaves their browser open on a shared/public device, anyone can see their medical data for a week. Conversely, if the session is too short (e.g., 15 minutes like the magic link token), users will be constantly re-entering OTP codes, which is frustrating for a portal they check multiple times per day.

**Why it happens:** The existing 7-day session was designed for the members library (educational content, not PHI). Reusing the same session duration for a PHI-displaying portal is inappropriate, but developers default to existing patterns.

**Consequences:** Too long: HIPAA compliance risk, unauthorized PHI access from unattended sessions. Too short: user frustration, high Twilio SMS costs from frequent re-authentication.

**Prevention:**
1. **Implement tiered session durations:**
   - Library/content access (non-PHI): 7 days (existing behavior, fine)
   - Portal/PHI access: 24 hours active, 30-minute idle timeout
   - Provider access: 8-hour active, 15-minute idle timeout
2. **Add idle timeout detection:** Track last user activity (mouse/keyboard/touch). After 30 minutes of inactivity on PHI pages, show a "session expiring" modal with a countdown. If no response, clear the session
3. **Implement "step-up" authentication:** Store a session with two tiers -- a base session (phone verified, long-lived) and a PHI access grant (shorter, requires recent verification). If the PHI grant expires, prompt for OTP again without requiring full re-login
4. **Auto-logout on tab close is NOT recommended** -- it is too aggressive and causes confusion. Idle timeout is sufficient

**Detection:** Audit session `maxAge` values. Check if idle timeout is implemented on PHI-displaying pages. Test: leave portal open for 1 hour idle -- does it prompt for re-auth?

**Phase:** Phase 1 (auth architecture). Session duration strategy must be decided alongside the token structure.

**Confidence:** MEDIUM -- HIPAA does not specify exact timeout durations, but the Security Rule requires "automatic logoff" (45 CFR 164.312(a)(2)(iii)). Industry standard for healthcare portals is 15-30 minute idle timeout.

---

### Pitfall 11: Staging Auth Bypass Leaking Into Production

**What goes wrong:** The codebase has extensive staging bypass logic: `isStaging()` checks, `isStagingBypassEmail()`, `TEAM_EMAILS` hardcoded array, `STAGING_ACCESS_EMAILS` env var, `dev_customer` / `staging_customer` / `staging_creator` magic IDs, and development mode auto-grants admin access. When the new OTP auth flow is built, it will likely get its own staging bypass. If any of these checks are wrong (e.g., `isStaging()` checks `NEXT_PUBLIC_SITE_URL` which could be misconfigured), staging bypass logic could fire in production.

**Why it happens:** `isStaging()` depends on the `NEXT_PUBLIC_SITE_URL` environment variable containing the string "staging". If production is deployed with the wrong env var value, or if a new deployment target is added that does not include "staging" in its URL but is not production either, bypass logic may activate unexpectedly.

**Consequences:** Anyone with a team email can bypass OTP on production. Magic IDs like `staging_customer` might be accepted as valid customers. Auto-admin access in development mode could leak if `NODE_ENV` is not set correctly on a deployment.

**Prevention:**
1. Add a dedicated `CULTR_ENVIRONMENT` env var (`production` | `staging` | `development`) rather than inferring from URL strings
2. Never check `NODE_ENV === 'development'` for security-sensitive bypasses -- only use it for convenience features (logging verbosity, etc.)
3. The new OTP flow should have a single, clearly documented bypass mechanism for staging, not scattered across multiple files
4. Add a startup assertion in production: if `NODE_ENV === 'production'`, verify that no staging bypass conditions can evaluate to `true`
5. Remove hardcoded `TEAM_EMAILS` arrays (duplicated in `lib/auth.ts`, `app/api/auth/magic-link/route.ts`, and `app/api/auth/verify/route.ts`) -- centralize to one location

**Detection:** Search codebase for `isStaging()`, `TEAM_EMAILS`, `dev_customer`, `staging_customer`, `NODE_ENV === 'development'`. Count occurrences. If scattered across > 3 files, centralization is needed.

**Phase:** Phase 1 (auth architecture). Centralize staging bypass logic before adding new bypass paths for OTP.

**Confidence:** HIGH -- Verified: `isStaging()` and `TEAM_EMAILS` are duplicated in at least 3 files. `getSession()` returns admin access unconditionally in development mode.

---

## Minor Pitfalls

Issues that cause friction, tech debt, or suboptimal UX if not addressed.

---

### Pitfall 12: Phone Number Format Inconsistency Across the Codebase

**What goes wrong:** Phone numbers are used in three contexts with different format expectations: (1) Twilio Verify expects E.164 (`+15551234567`), (2) Asher Med API uses E.164 for `getPatientByPhone()` but the patient model stores `phoneNumber` in an unspecified format, (3) the UI displays formatted numbers (`(555) 123-4567`). Without a single normalization layer, comparisons fail silently. The existing `formatPhoneNumber()` and `isValidPhoneNumber()` in `lib/asher-med-api.ts` handle some cases but are not used everywhere.

**Prevention:**
1. Create a `lib/phone.ts` utility with `normalizePhone()` (always returns E.164), `formatPhoneDisplay()` (returns user-facing format), and `isValidUSPhone()` (validates US numbers)
2. Normalize at the boundary: immediately on form input and immediately on API response
3. Store E.164 format in all database columns
4. Use the same `normalizePhone()` for both OTP send and Asher Med lookup

**Detection:** Search for phone-related regex patterns and `replace(/\D/g, '')` calls scattered across the codebase. All should route through the centralized utility.

**Phase:** Phase 1 (utility creation before auth endpoints).

---

### Pitfall 13: Provider View Accidentally Exposing Full Patient Data

**What goes wrong:** The PROJECT.md describes a "lightweight provider view" that shows key patient info and links out to Asher Med for clinical workflows. But if the provider API routes use the same Asher Med endpoints as the patient portal (e.g., `getPatientById()` returns the full patient object), the provider view has access to all patient data even if the UI only shows a subset. An API response returning the full `AsherPatient` object when only name + status + order summary is needed violates the HIPAA minimum necessary standard.

**Prevention:**
1. Create separate response DTOs for provider views that include only: patient name, status, last order status, date, and a link to Asher Med portal
2. Do not return full `AsherPatient` objects to the provider UI -- map server-side to a minimal type
3. Provider search should return results with masked data: `J*** D**` with last 4 of phone, not full PII
4. Log provider access to the audit trail (same `phi_access_log` table from Pitfall 6)

**Detection:** Compare the TypeScript types returned by provider API routes to the minimum data needed by the provider UI. If the route returns more fields than the component consumes, you are over-exposing.

**Phase:** Phase 3 (provider view). Apply minimum necessary principle from the start.

---

### Pitfall 14: Not Handling the "New User, No Asher Med Record" State

**What goes wrong:** Club members ($0/mo) sign up without completing medical intake. They have no Asher Med patient record. When they log in via phone OTP, `getPatientByPhone()` returns null. Without explicit handling, they see an empty dashboard or an error, which feels broken even though it is the expected state for their membership tier.

**Prevention:**
1. Design a distinct "getting started" dashboard state for users without `asher_patient_id`
2. Show clear CTAs: "Complete your intake to see your health data" or "Upgrade your plan to access telehealth services"
3. Do not treat `asher_patient_id = null` as an error -- it is a valid state for Club tier members
4. Store the phone -> user mapping in local DB even without an Asher Med link, so the user can log in consistently

**Detection:** Test login with a phone number that has no Asher Med record. The experience should be intentional, not broken.

**Phase:** Phase 2 (dashboard design). Must be wireframed before building the dashboard component.

---

### Pitfall 15: In-Memory Rate Limiter Ineffective on Vercel Serverless

**What goes wrong:** The existing `lib/rate-limit.ts` defaults to an in-memory `Map` when Redis is not configured. On Vercel, each serverless function invocation may run in a different container. The `Map` is not shared across containers, and cold starts create fresh instances. A determined attacker hitting different containers bypasses the rate limit entirely. The `setInterval` cleanup in the module also does not persist across invocations.

**Prevention:**
1. Make Redis (Upstash) **required** for OTP rate limiting, not optional
2. The codebase already has `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars configured -- ensure they are set in both staging and production Vercel environments
3. For the OTP endpoints specifically, fail closed: if Redis is unavailable, reject the OTP request rather than allowing it through (the current `createRedisRateLimiter` falls back to allowing requests on Redis error -- this is wrong for OTP)
4. Add a startup check in OTP routes: if Redis is not configured, return 503 instead of proceeding without rate limiting

**Detection:** Check Vercel env vars for `UPSTASH_REDIS_REST_URL`. Test rate limiting by sending 10 OTP requests in 30 seconds -- if more than 1 succeeds per phone number, the rate limiter is not working.

**Phase:** Phase 1 (auth infrastructure). Redis must be verified working before OTP endpoints go live.

**Confidence:** HIGH -- Verified by reading `lib/rate-limit.ts`. The in-memory fallback and the "allow on Redis error" behavior are confirmed in the code (line 156-161).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Phase 0: Vendor Setup | Twilio BAA does not cover Verify product | Confirm with Twilio sales before writing code (Pitfall 7) |
| Phase 1: Auth/OTP | OTP rate limiting bypassed on serverless | Require Redis, fail closed (Pitfalls 3, 15) |
| Phase 1: Auth/OTP | Session cookie conflicts between auth flows | Design unified session payload first (Pitfall 4) |
| Phase 1: Auth/OTP | Staging bypass leaks to production | Centralize bypass logic, add production assertions (Pitfall 11) |
| Phase 1: Auth/OTP | Using Programmable SMS instead of Verify | Use Twilio Verify API from day one (Pitfall 2) |
| Phase 2: Dashboard | GA4 fires on authenticated portal pages | Exclude portal routes from GA4 before shipping (Pitfall 1) |
| Phase 2: Dashboard | Phone lookup returns null, empty dashboard | Design "no records" state, fallback linking flow (Pitfalls 5, 14) |
| Phase 2: Dashboard | No HIPAA audit trail for PHI access | Build phi_access_log alongside first PHI route (Pitfall 6) |
| Phase 2: Dashboard | Asher Med API down = broken portal | Cache responses in local DB, serve stale with warning (Pitfall 9) |
| Phase 2: Dashboard | Raw Asher Med responses leaked to client | Always map to sanitized CULTR response types (Pitfall 8) |
| Phase 3: Provider View | Over-exposing patient data to providers | Separate minimal DTOs, enforce minimum necessary (Pitfall 13) |
| All Phases | Phone number format mismatches | Centralize normalization in lib/phone.ts (Pitfall 12) |

---

## Sources

### Official Documentation and Enforcement
- [Twilio Verify Developer Best Practices](https://www.twilio.com/docs/verify/developer-best-practices) -- rate limits, implementation patterns
- [Twilio Preventing Toll Fraud in Verify](https://www.twilio.com/docs/verify/preventing-toll-fraud) -- Fraud Guard, geographic permissions
- [Twilio HIPAA Eligible Services](https://www.twilio.com/en-us/hipaa) -- BAA requirements, covered products
- [HHS OCR Online Tracking Technologies Guidance](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html) -- tracking pixels on patient portals
- [Google Analytics HIPAA Guidance](https://support.google.com/analytics/answer/13297105?hl=en) -- Google does not sign BAAs for Analytics
- [HIPAA Security Rule 45 CFR 164.312](https://www.hhs.gov/hipaa/index.html) -- audit controls, automatic logoff, access controls

### Industry Analysis and Incidents
- [HIPAA Violation Examples: Website Tracking (Feroot)](https://www.feroot.com/blog/hipaa-violation-examples-website-tracking/) -- $100M+ in tracking-related penalties
- [GA4 HIPAA Compliance Guide 2026 (Feroot)](https://www.feroot.com/blog/google-analytics-4-hipaa-compliance/) -- healthcare CISO guidance
- [Patient Portal HIPAA Compliance (Buchanan)](https://www.buchanan.com/blog/ensure-patient-portal-hipaa-compliance/) -- portal-specific requirements
- [Duplicate Patient Records (Medical Economics)](https://www.medicaleconomics.com/view/why-duplicate-and-mismatched-patient-records-are-a-bigger-problem-than-you-think) -- 10-18% duplication rates
- [SMS OTP Security Vulnerabilities (Authgear)](https://www.authgear.com/post/sms-otp-vulnerabilities-and-alternatives) -- SIM swap, SS7 exploits
- [Twilio Verify vs Programmable SMS Migration](https://www.twilio.com/blog/migrate-programmable-sms-to-verify) -- why to use Verify

### Codebase Verification (direct reads)
- `lib/auth.ts` -- Session payload structure, cookie name, dev mode bypass, rate limiting
- `lib/rate-limit.ts` -- In-memory Map fallback, Redis integration, fail-open on Redis error
- `lib/asher-med-api.ts` -- Phone number handling, no timeouts, no caching, no retry
- `app/api/auth/magic-link/route.ts` -- Duplicated team emails, staging bypass logic
- `app/api/auth/verify/route.ts` -- Session creation, Stripe verification, staging bypass
- `middleware.ts` -- Current route rewriting (join subdomain only, no auth checks)
- `lib/resilience.ts` -- withRetry() exists but is not used by Asher Med client
