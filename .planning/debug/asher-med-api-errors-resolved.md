---
status: resolved
resolution: "Asher Med fully removed from codebase on Apr 4 2026. Session obsolete."
trigger: "Asher Med API endpoints are returning errors. User just added ASHER_MED_API_KEY env var and needs to verify all Asher Med integration endpoints are compatible and working."
created: 2026-03-23T00:00:00Z
updated: 2026-04-04T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — all 5 issues validated via code review. Applying fixes now.
test: Fix all 5 issues, run tests
expecting: All tests pass, code handles both ID types, orders filtered correctly, admin link correct
next_action: Applying fix 1 — portal-auth.ts token verification to accept string IDs

## Symptoms

expected: All Asher Med API endpoints should successfully communicate with the Asher Med Partner Portal (create patients, submit orders, upload files, fetch data)
actual: Asher Med API errors occurring - need to identify which endpoints fail and why
errors: Unknown - need to investigate error handling, API configuration, and endpoint compatibility
reproduction: Trigger any Asher Med API call (intake submission, file upload, member data fetch)
started: User is setting up the Asher Med API key integration - may be first time connecting to real API

## Eliminated

- hypothesis: API key not configured or wrong header name
  evidence: API client correctly uses `X-API-KEY` header matching the docs. Key is read from `process.env.ASHER_MED_API_KEY`. Authentication header pattern is standard.
  timestamp: 2026-03-23T00:30:00Z

- hypothesis: Endpoint paths are wrong
  evidence: All endpoint paths follow the `/api/v1/external/partner/...` prefix pattern documented in the integration guide.
  timestamp: 2026-03-23T00:30:00Z

## Evidence

- timestamp: 2026-03-23T02:01:00Z
  checked: AsherEntityId type definition vs consuming code
  found: lib/asher-med-api.ts defines `AsherEntityId = number | string` (line 43) and uses it for id fields in AsherPatient and AsherOrder. However, every downstream consumer treats IDs as numbers — portal-auth.ts types asherPatientId as `number | null`, portal-db.ts types it as `number | null`, all DB columns are `INTEGER`, and 3 routes call `parseInt()` on IDs.
  implication: CRITICAL — If the real API returns numeric IDs, parseInt works. If it returns UUID strings, parseInt returns NaN, breaking all downstream logic. The code must handle both cases defensively.

- timestamp: 2026-03-23T02:02:00Z
  checked: Database schema for asher_patient_id columns
  found: All migrations (008, 012, 014, 019) define `asher_patient_id` as `INTEGER`. This means UUID string IDs cannot be stored in the DB at all — they would either silently truncate or throw a DB error.
  implication: CRITICAL — If IDs are UUIDs, needs DB migration to change columns to TEXT/VARCHAR.

- timestamp: 2026-03-23T02:03:00Z
  checked: getOrders patientId parameter
  found: getOrders() accepts `patientId?: number` and passes it as a query parameter. The integration guide example for listing orders shows only `{ page, limit, status }`. The API may silently ignore `patientId`, returning ALL partner orders. 4 call sites depend on patient-filtered results: portal/orders, intake/submit, portal/prefill, member/orders.
  implication: CRITICAL if API ignores patientId — all these endpoints return data from other patients. Need client-side filtering as fallback.

- timestamp: 2026-03-23T02:04:00Z
  checked: createNewOrder response parsing
  found: Code expects `result.data?.id` where result is `AsherApiSuccess<AsherPatient>`. But the integration guide shows `response.data` containing `{ patient, order }` not a flat patient object. If the real API returns `{ success: true, data: { patient: {...}, order: {...} } }`, then `result.data?.id` would be undefined.
  implication: CRITICAL — patient ID extraction from createNewOrder response may fail silently. Code should handle both `data.id` and `data.patient.id` shapes.

- timestamp: 2026-03-23T02:05:00Z
  checked: Duplicate getAsherMedApiUrl() functions
  found: Two separate implementations — lib/asher-med-api.ts (line 230, reads ASHER_MED_API_URL env var with prod fallback) and lib/config/asher-med.ts (line 474, reads ASHER_MED_ENVIRONMENT env var to pick URL). The API client always uses its own version. If user sets ASHER_MED_ENVIRONMENT=sandbox but not ASHER_MED_API_URL, the API client still hits production.
  implication: MODERATE — Could cause confusion. API client should use the config version for consistency.

- timestamp: 2026-03-23T02:06:00Z
  checked: Admin dashboard Asher Med portal link
  found: AdminDashboardClient.tsx links to `https://prod-api.asherweightloss.com` (the API endpoint, not the partner portal). The actual partner portal is at `https://partners.joinasher.com` or `https://partner.joinasher.com`.
  implication: MINOR — Admin clicks this link and gets a JSON API response instead of the portal UI.

- timestamp: 2026-03-23T02:07:00Z
  checked: Error handling resilience across all Asher Med call sites
  found: Most call sites have good error handling (try/catch with non-fatal fallbacks). The portal routes (profile, orders, prefill, documents) all handle API errors gracefully. The member routes also catch and continue. The intake/submit route is the only critical path that throws on API failure (correctly — if order creation fails, the user needs to know).
  implication: Good — error handling is mostly sound. The primary issue is contract mismatches, not error handling gaps.

- timestamp: 2026-03-23T02:08:00Z
  checked: Local .env file for ASHER_MED_API_KEY value
  found: .env has `ASHER_MED_API_KEY=` (empty), `ASHER_MED_PARTNER_ID=` (empty), `ASHER_MED_API_URL=https://prod-api.asherweightloss.com`, `ASHER_MED_ENVIRONMENT=production`. User mentioned they "just added the ASHER_MED_API_KEY env var" — likely added to Vercel, not local .env.
  implication: On staging/local, the empty API key triggers the mock/bypass behavior. On Vercel deployment with the key set, the real API is called.

- timestamp: 2026-03-23T02:09:00Z
  checked: getOrders response shape parsing
  found: getOrders() does `response.orders || response.data || []` and `response.total || 0`. This flexible parsing handles multiple response shapes but the pagination might use `totalItems` instead of `total`.
  implication: MINOR — total count may be wrong but order data should still come through.

## Resolution

root_cause: Multiple API contract compatibility issues between our client code and the Asher Med API, found across 3 severity levels:

**CRITICAL (will cause errors/wrong behavior):**
1. **ID type handling inconsistency** — TypeScript interface allows `number | string` (AsherEntityId) but all downstream code (portal-auth, portal-db, DB columns, consuming routes) treats IDs as `number`. Three routes call `parseInt()` on IDs. DB columns are `INTEGER`. If API returns non-numeric IDs, everything breaks.
2. **getOrders patientId filtering** — API may not support `patientId` as a query parameter (not documented in integration guide). 4 routes depend on patient-filtered results. Without filtering, routes could expose other patients' data.
3. **createNewOrder response shape** — Code expects `data` to be a flat Patient object, but integration guide suggests `{ patient, order }`. Patient ID extraction may fail.

**MODERATE:**
4. **Duplicate getAsherMedApiUrl()** — API client ignores ASHER_MED_ENVIRONMENT setting, always using its own env var lookup. Could hit wrong environment.

**MINOR:**
5. **Admin portal link** — Points to API endpoint, not partner portal UI.
6. **Pagination total field** — May use `totalItems` vs `total`.

fix: Apply defensive fixes:
1. Make all ID handling accept both number and string — remove parseInt() calls on IDs, pass IDs as-is to API, store as TEXT in DB
2. Add client-side patientId filtering in getOrders consumers as safety net
3. Make createNewOrder response parsing handle both flat and nested shapes
4. Unify getAsherMedApiUrl() to a single implementation respecting ASHER_MED_ENVIRONMENT
5. Fix admin portal link to correct URL
6. Handle flexible pagination response shape

verification:
files_changed: []
