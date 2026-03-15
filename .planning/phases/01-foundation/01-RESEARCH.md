# Phase 1: Foundation - Research

**Researched:** 2026-03-14
**Domain:** SiPhox Health REST API integration, Zod validation, PostgreSQL schema design
**Confidence:** MEDIUM (API docs are partner-only; schemas inferred from PROJECT.md + CSV data)

## Summary

Phase 1 builds the server-side foundation for SiPhox Health integration: a typed API client, Zod response schemas, database tables for customer mapping / kit orders / cached reports, and a biomarker mapping config. No UI. No checkout wiring. This phase follows well-established patterns already in the codebase -- the Asher Med API client (`lib/asher-med-api.ts`) is the structural template, `lib/db.ts` and `lib/portal-db.ts` show the data access pattern, and `lib/validation.ts` shows the Zod schema convention.

The SiPhox API is a REST API at `connect.siphoxhealth.com/api/v1/` with Bearer token auth (not X-API-KEY like Asher Med). It covers customers, orders, kits, reports, biomarkers, and credits. The API documentation is partner-only -- not publicly indexed -- so the schemas in this research are inferred from the endpoint list and request/response shapes documented in PROJECT.md. These schemas MUST be validated against real API responses during implementation (flagged as a known risk in STATE.md).

**Primary recommendation:** Build a single `lib/siphox/` directory with separate files for the API client, Zod schemas, types, and DB operations. Follow the Asher Med client pattern exactly (typed generic `siphoxRequest<T>()` wrapper, custom error class, config helpers), but use Bearer token auth and add Zod `.safeParse()` validation on all response data before it touches the database.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use portal phone number (E.164 format) as SiPhox `external_id` -- ties SiPhox customer to portal login identity
- Create SiPhox customer record at checkout time (just-in-time) -- no orphan records for members who never order a kit
- Store mapping in a **new dedicated table** `siphox_customers` (member_phone, siphox_customer_id, siphox_order_id, kit_status) -- clean separation from memberships table
- Shipping address sourced from **intake form submission** data (already has address1, city, state, zip)
- Env var: `SIPHOX_API_KEY` (consistent with `ASHER_MED_API_KEY` pattern)
- Add `SIPHOX_API_URL` env var for environment switching (like `ASHER_MED_API_URL`)
- Email admin via Resend to `ADMIN_APPROVAL_EMAIL` when credit balance drops below 5
- Check balance before every order placement (fail gracefully if insufficient)
- Bearer token auth (not X-API-KEY header like Asher Med)
- Follow the Asher Med API client pattern exactly (`lib/asher-med-api.ts`)
- DB caching strategy: biomarker reports are immutable after lab processing -- fetch once from SiPhox, validate with Zod, store in PostgreSQL JSONB

### Claude's Discretion
- Exact Zod schema structure (follow existing `lib/validation.ts` patterns)
- DB table column types and indexes
- Error class design for SiPhox API errors
- Biomarker mapping config format (static config file vs DB table)
- Whether to use single file `lib/siphox-api.ts` or directory `lib/siphox/`

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | SiPhox API client library with typed request/response for all endpoints (customers, orders, kits, reports, biomarkers, credits) | Asher Med client pattern provides structural template; Bearer auth differs from X-API-KEY; 6 endpoint groups identified |
| API-02 | Zod schemas for all SiPhox API responses with runtime validation | Zod ^3.23.0 already in project; `.safeParse()` pattern recommended; schemas must be validated against real responses |
| API-03 | SiPhox customer creation from CULTR member data with external_id mapping | `POST /customer` endpoint; external_id = phone E.164; address from intake form data |
| API-04 | SiPhox customer lookup by external_id for existing member resolution | `GET /customers` with query param or `GET /customers/:id`; prevents duplicate creation |
| API-05 | Credit balance check before order placement with low-balance alerting | `GET /credits` endpoint; threshold = 5; alert via Resend to ADMIN_APPROVAL_EMAIL |
| DB-01 | Database table for SiPhox customer mapping (member_id <-> siphox_customer_id) | New `siphox_customers` table; phone_e164 as link to portal_sessions; migration 020 |
| DB-02 | Database table for SiPhox kit orders (order_id, status, kit_type, tracking) | New `siphox_kit_orders` table; references siphox_customers; stores SiPhox order response |
| DB-03 | Database table for cached biomarker reports (JSONB storage, immutable after fetch) | New `siphox_reports` table; JSONB column for raw report data; immutable pattern (insert-only) |
| DB-04 | Biomarker mapping config (~150+ entries: SiPhox name -> display name, category, unit) | Static TypeScript config file in `lib/config/siphox-biomarkers.ts`; 50 biomarkers in CSV + extended panel |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.23.0 | Runtime response validation | Already in project; TypeScript-first; z.infer<> for type extraction |
| @vercel/postgres | ^0.10.0 | Database access (Neon PostgreSQL) | Already in project; `sql` tagged template pattern established |
| resend | ^4.0.0 | Low-credit alert emails | Already in project; established email sending patterns in lib/resend.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | ^6.1.3 | JWT utilities (if needed for auth context) | Already in project; only if SiPhox client needs portal session context |
| Node.js fetch | built-in | HTTP requests to SiPhox API | Node 18+ built-in; same as Asher Med client (no axios) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch | axios | Project already uses raw fetch for Asher Med -- stay consistent |
| @vercel/postgres sql templates | Drizzle/Prisma ORM | Project has no ORM; adding one for 3 tables is overhead |
| Static TS config for biomarkers | DB table for biomarker mapping | Static is simpler, version-controlled, and the mapping rarely changes; DB adds migration complexity for no benefit |

**Installation:**
```bash
# No new dependencies needed -- all libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
lib/siphox/
  index.ts              # Barrel export (public API surface)
  client.ts             # SiPhox API client (siphoxRequest<T>, endpoint wrappers)
  schemas.ts            # Zod schemas for all SiPhox API responses
  types.ts              # TypeScript interfaces (inferred from Zod where possible)
  db.ts                 # Database operations for siphox_* tables
  errors.ts             # SiphoxApiError class

lib/config/
  siphox-biomarkers.ts  # Biomarker mapping config (~50+ entries from CSV + extended panel)

migrations/
  020_siphox_tables.sql  # All 3 tables in one migration (customers, kit_orders, reports)
```

**Rationale for directory vs single file:** The SiPhox integration touches 6 API endpoint groups, 3 DB tables, and ~50 biomarker definitions. A single file would exceed 800+ lines. A directory keeps each concern isolated while the barrel export provides a clean public API. This follows the precedent set by `lib/creators/` (attribution.ts, commission.ts, db.ts) and `lib/payments/` (4 files).

### Pattern 1: Typed API Client with Zod Validation
**What:** Generic request wrapper that validates responses through Zod before returning data
**When to use:** Every SiPhox API call
**Example:**
```typescript
// lib/siphox/client.ts
// Follows lib/asher-med-api.ts pattern exactly

class SiphoxApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'SiphoxApiError'
  }
}

function getSiphoxApiUrl(): string {
  return process.env.SIPHOX_API_URL || 'https://connect.siphoxhealth.com/api/v1'
}

async function siphoxRequest<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<T> {
  const apiKey = process.env.SIPHOX_API_KEY
  if (!apiKey) {
    throw new SiphoxApiError('SIPHOX_API_KEY is not configured')
  }

  const baseUrl = getSiphoxApiUrl()
  let url = `${baseUrl}${endpoint}`

  // Query params (same as asherRequest)
  if (options.params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,  // Bearer, not X-API-KEY
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    ...(options.body && ['POST', 'PUT'].includes(options.method || '')
      ? { body: JSON.stringify(options.body) }
      : {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new SiphoxApiError(
      errorData?.message || `SiPhox API error: ${response.status}`,
      response.status,
      errorData
    )
  }

  const data = await response.json()

  // Zod validation gate -- NEVER skip this
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    console.error('SiPhox response validation failed:', parsed.error.issues)
    throw new SiphoxApiError(
      `Response validation failed: ${parsed.error.issues.map(i => i.message).join(', ')}`,
      response.status,
      data
    )
  }

  return parsed.data
}
```

### Pattern 2: Database Operations with Error Wrapping
**What:** Dedicated db.ts file with typed functions using `sql` tagged templates
**When to use:** All siphox_* table operations
**Example:**
```typescript
// lib/siphox/db.ts
// Follows lib/portal-db.ts pattern exactly

import { sql } from '@vercel/postgres'

export class SiphoxDatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'SiphoxDatabaseError'
  }
}

export async function upsertSiphoxCustomer(
  phoneE164: string,
  siphoxCustomerId: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO siphox_customers (phone_e164, siphox_customer_id)
      VALUES (${phoneE164}, ${siphoxCustomerId})
      ON CONFLICT (phone_e164) DO UPDATE SET
        siphox_customer_id = EXCLUDED.siphox_customer_id,
        updated_at = NOW()
    `
  } catch (error) {
    throw new SiphoxDatabaseError('Failed to upsert SiPhox customer', error)
  }
}
```

### Pattern 3: Biomarker Config as Static TypeScript
**What:** SCREAMING_SNAKE_CASE exported constants with typed arrays
**When to use:** The biomarker mapping (SiPhox name -> display name, category, unit)
**Example:**
```typescript
// lib/config/siphox-biomarkers.ts
// Follows lib/config/asher-med.ts and lib/config/plans.ts patterns

export type BiomarkerCategory =
  | 'metabolic'
  | 'nutritional'
  | 'heart'
  | 'hormonal'
  | 'inflammation'
  | 'thyroid'
  | 'extended'

export interface SiphoxBiomarkerMapping {
  siphoxName: string       // Name from SiPhox API response
  displayName: string      // Human-readable name for UI
  abbreviation?: string    // Short form (e.g., "ApoB")
  category: BiomarkerCategory
  unit: string             // e.g., "mg/dL", "ng/mL"
  description: string      // From CSV "What It Measures" column
}

export const SIPHOX_BIOMARKER_MAPPINGS: SiphoxBiomarkerMapping[] = [
  // Metabolic Health
  {
    siphoxName: 'HbA1c',
    displayName: 'Hemoglobin A1C',
    abbreviation: 'A1C',
    category: 'metabolic',
    unit: '%',
    description: '3-month average blood sugar control',
  },
  // ... 50+ entries from siphox-biomarkers.csv
]
```

### Anti-Patterns to Avoid
- **Skipping Zod validation:** Never cast `response.json() as T` without Zod -- the whole point of this phase is validated responses. Always use `schema.safeParse()`.
- **Using `z.any()` or `z.unknown()` for report data:** The report JSONB column stores validated data. The schema for reports should be as specific as possible (use `.passthrough()` for unknown extra fields, not `.any()`).
- **Putting all code in one file:** The SiPhox integration will grow across 4 phases. Starting with a directory structure prevents painful refactoring later.
- **Importing `sql` directly in the API client:** Keep API client (HTTP concerns) separate from DB operations (persistence concerns). The client returns validated data; the DB layer persists it.
- **Logging biomarker values or patient data:** This is PHI. Follow existing HIPAA patterns -- no `console.log` of response bodies.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Response validation | Manual type guards | Zod `.safeParse()` | Type-safe, generates TypeScript types, structured errors |
| HTTP client | Custom retry/timeout wrapper | Raw fetch + existing `withRetry()` from lib/resilience.ts | Retry logic already exists; don't duplicate |
| Email alerting | Custom email template | Existing `lib/resend.ts` patterns | Email infrastructure proven; just add a new template function |
| Phone E.164 formatting | Custom formatter | Existing `formatPhoneE164()` from `lib/validation.ts` or `formatPhoneNumber()` from `lib/asher-med-api.ts` | Already handles US number normalization |
| UUID generation | Manual ID generation | PostgreSQL `gen_random_uuid()` | Already used in all migrations (portal_sessions, etc.) |
| JSONB storage | Custom serialization | PostgreSQL JSONB + `JSON.stringify()` in sql template | `@vercel/postgres` handles JSONB natively via `sql` template |

**Key insight:** This phase is 90% boilerplate following existing patterns. The only novel work is the Zod schemas (which need real API responses to validate) and the biomarker mapping config (which has CSV data to populate from).

## Common Pitfalls

### Pitfall 1: Zod Schemas Don't Match Real API Responses
**What goes wrong:** Schemas written from documentation don't match actual API response shape (extra fields, different casing, nested differently)
**Why it happens:** SiPhox API documentation is partner-only; schemas in PROJECT.md are inferred from endpoint descriptions, not actual responses
**How to avoid:** Use `.passthrough()` on object schemas to allow unexpected fields initially. Write a one-time test script that calls each endpoint and logs the response shape. Tighten schemas after validation.
**Warning signs:** `safeParse` failures in staging logs after first real API call

### Pitfall 2: Duplicate SiPhox Customers from Race Conditions
**What goes wrong:** Two concurrent checkouts for the same member both try to create a SiPhox customer
**Why it happens:** Just-in-time creation pattern without database-level deduplication
**How to avoid:** Use `ON CONFLICT (phone_e164) DO UPDATE` in the database insert (upsert pattern). Before creating a SiPhox customer, check the DB first, then check SiPhox API by external_id.
**Warning signs:** Multiple siphox_customer_id values for the same phone_e164

### Pitfall 3: Credit Balance Race Condition
**What goes wrong:** Balance check shows 3 credits, two orders submit simultaneously, one fails at SiPhox
**Why it happens:** Check-then-act is inherently racy without locking
**How to avoid:** Design for failure -- if order creation fails due to insufficient credits, catch the error, email admin, and don't block the subscription. The credit check is advisory, not a gate.
**Warning signs:** `SiphoxApiError` with insufficient credits after balance check passed

### Pitfall 4: JSONB Column Bloat from Unvalidated Reports
**What goes wrong:** Raw SiPhox report responses stored without validation grow the table unpredictably
**Why it happens:** Storing entire API response including metadata, pagination, and nested objects
**How to avoid:** Validate with Zod, extract only the biomarker results data, store the validated subset. Keep a `raw_response_hash` for deduplication but not the full raw response.
**Warning signs:** `siphox_reports` table growing faster than expected; large row sizes

### Pitfall 5: Missing SIPHOX_API_KEY in Staging
**What goes wrong:** All SiPhox operations fail silently or throw unhandled errors in staging
**Why it happens:** New env vars not added to Vercel staging environment (this has happened before -- see MEMORY.md "Vercel Project Env Var Sync")
**How to avoid:** Add `SIPHOX_API_KEY` and `SIPHOX_API_URL` to Vercel env vars for staging environment immediately. Create an `isSiphoxConfigured()` utility (like `isAsherMedConfigured()`).
**Warning signs:** `SiphoxApiError: SIPHOX_API_KEY is not configured` in logs

### Pitfall 6: SiPhox `external_id` Format Mismatch
**What goes wrong:** Customer lookup by external_id returns no results despite customer existing
**Why it happens:** Phone stored as `+14155551234` in portal but sent to SiPhox as `4155551234` (or vice versa)
**How to avoid:** Always normalize to E.164 format before sending to SiPhox AND before storing in DB. Use the same `formatPhoneE164()` function everywhere.
**Warning signs:** Duplicate SiPhox customers created for the same member; lookup always returns null

## Code Examples

### SiPhox API Response Schemas (Zod)
```typescript
// lib/siphox/schemas.ts
import { z } from 'zod'

// Customer response from POST /customer or GET /customers/:id
export const SiphoxCustomerSchema = z.object({
  _id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  external_id: z.string().optional(),
}).passthrough() // Allow unknown fields until validated against real API

// Order response from POST /orders
export const SiphoxOrderSchema = z.object({
  _id: z.string(),
  status: z.string(),
  kit_types: z.array(z.object({
    kitType: z.string(),
    quantity: z.number(),
  })),
  recipient: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    external_id: z.string().optional(),
  }).passthrough(),
  created_at: z.string().optional(),
}).passthrough()

// Credit balance from GET /credits
export const SiphoxCreditsSchema = z.object({
  balance: z.number(),
}).passthrough()

// Kit validation from GET /kits/:kitID/validate
export const SiphoxKitValidationSchema = z.object({
  valid: z.boolean(),
  kitId: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

// Biomarker report from GET /customers/:id/reports/:reportID
export const SiphoxBiomarkerResultSchema = z.object({
  biomarker: z.string(),
  value: z.number().nullable(),
  unit: z.string(),
  reference_range: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    optimal_low: z.number().optional(),
    optimal_high: z.number().optional(),
  }).passthrough().optional(),
  status: z.string().optional(),
}).passthrough()

export const SiphoxReportSchema = z.object({
  _id: z.string(),
  customer_id: z.string(),
  biomarkers: z.array(SiphoxBiomarkerResultSchema),
  suggestions: z.array(z.object({
    _id: z.string().optional(),
    text: z.string(),
    category: z.string().optional(),
    link: z.string().optional(),
  }).passthrough()).optional(),
  created_at: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

// Type inference from schemas
export type SiphoxCustomer = z.infer<typeof SiphoxCustomerSchema>
export type SiphoxOrder = z.infer<typeof SiphoxOrderSchema>
export type SiphoxCredits = z.infer<typeof SiphoxCreditsSchema>
export type SiphoxReport = z.infer<typeof SiphoxReportSchema>
export type SiphoxBiomarkerResult = z.infer<typeof SiphoxBiomarkerResultSchema>
```

### Database Migration
```sql
-- Migration 020: SiPhox Integration Tables
-- Creates tables for SiPhox customer mapping, kit orders, and cached reports

-- 1. Customer mapping (CULTR member <-> SiPhox customer)
CREATE TABLE IF NOT EXISTS siphox_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 VARCHAR(20) NOT NULL,
  siphox_customer_id VARCHAR(100) NOT NULL,
  external_id VARCHAR(50),          -- same as phone_e164, stored for reference
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_customers_phone
  ON siphox_customers (phone_e164);
CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_customers_siphox_id
  ON siphox_customers (siphox_customer_id);

-- 2. Kit orders (tracks SiPhox orders and their lifecycle)
CREATE TABLE IF NOT EXISTS siphox_kit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siphox_customer_id VARCHAR(100) NOT NULL REFERENCES siphox_customers(siphox_customer_id),
  siphox_order_id VARCHAR(100) NOT NULL,
  kit_type VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ordered',
  tracking_number VARCHAR(200),
  stripe_subscription_id VARCHAR(255),
  is_test_order BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_kit_orders_order_id
  ON siphox_kit_orders (siphox_order_id);
CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_customer
  ON siphox_kit_orders (siphox_customer_id);

-- 3. Cached biomarker reports (immutable after insert)
CREATE TABLE IF NOT EXISTS siphox_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siphox_customer_id VARCHAR(100) NOT NULL REFERENCES siphox_customers(siphox_customer_id),
  siphox_report_id VARCHAR(100) NOT NULL,
  report_data JSONB NOT NULL,            -- Zod-validated biomarker results
  suggestions JSONB,                      -- SiPhox suggestions array
  report_status VARCHAR(50),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_siphox_reports_report_id
  ON siphox_reports (siphox_report_id);
CREATE INDEX IF NOT EXISTS idx_siphox_reports_customer
  ON siphox_reports (siphox_customer_id);
```

### Credit Balance Check with Admin Alert
```typescript
// lib/siphox/client.ts (credit check function)

const LOW_CREDIT_THRESHOLD = 5

export async function checkCreditBalance(): Promise<{
  balance: number
  isLow: boolean
}> {
  const credits = await siphoxRequest('/credits', SiphoxCreditsSchema)
  const isLow = credits.balance < LOW_CREDIT_THRESHOLD

  if (isLow) {
    // Non-blocking: send alert but don't fail
    try {
      const { sendLowCreditAlert } = await import('@/lib/resend')
      await sendLowCreditAlert(credits.balance, LOW_CREDIT_THRESHOLD)
    } catch (emailError) {
      console.error('Failed to send low credit alert email')
      // Don't throw -- credit check result is more important than email
    }
  }

  return { balance: credits.balance, isLow }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `as T` type casting for API responses | Zod runtime validation with `.safeParse()` | Zod 3.x (2023+) | Catches API shape changes at runtime instead of silent data corruption |
| Separate TypeScript interfaces + Zod schemas | `z.infer<typeof Schema>` to derive types from schemas | Zod 3.x | Single source of truth; types and validation always in sync |
| `any` for JSONB columns | Typed JSONB with Zod validation before insert | Current best practice | Prevents garbage data in JSONB columns |

**Deprecated/outdated:**
- The existing `BIOMARKER_DEFINITIONS` in `lib/resilience.ts` uses hardcoded biomarker definitions (12 markers). Phase 4 will need to reconcile this with the SiPhox mapping config (~50+ markers). This is out of scope for Phase 1 but worth noting -- the resilience engine's scoring will eventually consume SiPhox data.

## Open Questions

1. **SiPhox API response shapes are unverified**
   - What we know: Endpoint paths and request schemas from PROJECT.md; response fields are inferred
   - What's unclear: Exact field names, nesting, optional fields, error response format, pagination structure
   - Recommendation: Use `.passthrough()` on all Zod schemas initially; run a validation script against real API after implementation; tighten schemas based on actual responses
   - Confidence: LOW -- this is the biggest risk in this phase

2. **SiPhox sandbox/test environment**
   - What we know: `is_test_order: true` flag exists on order creation; PROJECT.md mentions unknown whether separate sandbox URL exists
   - What's unclear: Whether `connect.siphoxhealth.com` has a sandbox variant or just uses the flag
   - Recommendation: Build client with configurable `SIPHOX_API_URL` (already decided); default to production URL; use `is_test_order: true` for staging
   - Confidence: MEDIUM

3. **SiPhox customer lookup by external_id**
   - What we know: `POST /customer` accepts external_id; `GET /customers` endpoint exists
   - What's unclear: Whether GET /customers supports filtering by external_id as a query param, or if you need to list all and filter client-side
   - Recommendation: Try `GET /customers?external_id={phone}` first; fall back to `GET /customers/:id` using stored siphox_customer_id from DB
   - Confidence: LOW

4. **Exact kit_type values for SiPhox orders**
   - What we know: Orders include `kit_types: [{kitType, quantity}]`; SiPhox offers different panels (Core Health, Longevity Essentials, Ultimate)
   - What's unclear: The exact string values for kitType (e.g., "longevity_essentials", "ultimate", etc.)
   - Recommendation: Add a `SIPHOX_DEFAULT_KIT_TYPE` constant that can be updated after checking with SiPhox; parameterize in the order creation function
   - Confidence: LOW

5. **Migration number collision**
   - What we know: Latest migration is 019. Next should be 020.
   - What's unclear: Whether other work is in progress that might also use 020
   - Recommendation: Use 020 for this migration. If collision occurs, renumber.
   - Confidence: HIGH

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | vitest.config.js |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | SiPhox client calls all 6 endpoint groups with correct auth/URL | unit | `npx vitest run tests/lib/siphox-client.test.ts -x` | -- Wave 0 |
| API-02 | Zod schemas validate known-good and reject known-bad responses | unit | `npx vitest run tests/lib/siphox-schemas.test.ts -x` | -- Wave 0 |
| API-03 | Customer creation sends correct payload, stores mapping in DB | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "createCustomer" -x` | -- Wave 0 |
| API-04 | Customer lookup by external_id resolves without duplicate creation | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "getCustomerByExternalId" -x` | -- Wave 0 |
| API-05 | Credit check returns balance, triggers alert when below threshold | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "checkCreditBalance" -x` | -- Wave 0 |
| DB-01 | siphox_customers table upserts correctly, prevents duplicates | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "upsertSiphoxCustomer" -x` | -- Wave 0 |
| DB-02 | siphox_kit_orders table inserts and queries by customer | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "kitOrders" -x` | -- Wave 0 |
| DB-03 | siphox_reports table stores JSONB, retrieves by customer | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "reports" -x` | -- Wave 0 |
| DB-04 | Biomarker mapping config has entries for all known SiPhox names | unit | `npx vitest run tests/lib/siphox-biomarkers.test.ts -x` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/siphox-client.test.ts` -- covers API-01 through API-05 (mock fetch, verify request shapes, test Zod validation)
- [ ] `tests/lib/siphox-schemas.test.ts` -- covers API-02 (known-good and known-bad response fixtures)
- [ ] `tests/lib/siphox-db.test.ts` -- covers DB-01 through DB-03 (mock @vercel/postgres sql, verify query shapes)
- [ ] `tests/lib/siphox-biomarkers.test.ts` -- covers DB-04 (config completeness, category coverage, no duplicate siphoxNames)
- [ ] `tests/setup.ts` needs `process.env.SIPHOX_API_KEY = 'test-siphox-key'` and `process.env.SIPHOX_API_URL = 'https://connect.siphoxhealth.com/api/v1'` added

## Sources

### Primary (HIGH confidence)
- `lib/asher-med-api.ts` -- Structural template for API client pattern (verified by reading source)
- `lib/portal-db.ts` -- Data access pattern with error wrapping (verified by reading source)
- `lib/validation.ts` -- Zod schema conventions (verified by reading source)
- `lib/resilience.ts` -- Existing BIOMARKER_DEFINITIONS and withRetry utility (verified by reading source)
- `migrations/014_portal_sessions.sql` -- Migration convention (verified by reading source)
- `siphox-biomarkers.csv` -- 50 biomarker entries with descriptions, ranges, categories (verified by reading source)
- `package.json` -- zod ^3.23.0, @vercel/postgres ^0.10.0 already installed (verified by reading source)

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md` -- SiPhox API endpoint list, request schemas, tier integration rules (user-provided)
- `.planning/phases/01-foundation/01-CONTEXT.md` -- User decisions on customer mapping, env vars, auth pattern
- [SiPhox Partner FAQ](https://siphoxhealth.com/partner/faq) -- Confirms REST API exists for orders/customers/reports

### Tertiary (LOW confidence)
- SiPhox API response schemas -- Inferred from PROJECT.md endpoint descriptions, NOT validated against real API responses. All Zod schemas use `.passthrough()` as safety net.
- Customer lookup by external_id -- Assumed query param support; not confirmed
- Kit type string values -- Unknown; parameterized with configurable constant

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, patterns well-established
- Architecture: HIGH -- follows existing directory and file patterns (lib/creators/, lib/payments/)
- API client structure: HIGH -- direct copy of Asher Med pattern with Bearer auth swap
- Zod schemas: LOW -- inferred from documentation, not validated against real API responses
- DB schema: MEDIUM -- table design follows established patterns; column choices are reasonable but may need adjustment
- Biomarker config: HIGH -- CSV data provides 50 entries; category mapping from PROJECT.md
- Pitfalls: MEDIUM -- based on experience with similar integrations and project history (env var sync, race conditions)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain -- patterns won't change; schemas need validation against real API)
