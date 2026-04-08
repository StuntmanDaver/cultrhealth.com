# Phase 1: Foundation - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

SiPhox API client library, Zod response schemas, database tables (customer mapping, kit orders, cached reports), biomarker mapping config, and customer sync layer. No UI. No checkout integration. Pure server-side foundation that all subsequent phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Customer Mapping
- Use portal phone number (E.164 format) as SiPhox `external_id` — ties SiPhox customer to portal login identity
- Create SiPhox customer record at checkout time (just-in-time) — no orphan records for members who never order a kit
- Store mapping in a **new dedicated table** `siphox_customers` (member_phone, siphox_customer_id, siphox_order_id, kit_status) — clean separation from memberships table
- Shipping address sourced from **intake form submission** data (already has address1, city, state, zip)

### SiPhox Credentials
- Env var: `SIPHOX_API_KEY` (consistent with `ASHER_MED_API_KEY` pattern)
- API key is available — user has it ready to add to Vercel env vars
- Sandbox/test environment: **unknown** — need to verify with SiPhox whether separate sandbox URL exists or just `is_test_order: true` flag. Build the client to support both patterns (configurable base URL via `SIPHOX_API_URL` env var, default to production)
- Add `SIPHOX_API_URL` env var for environment switching (like `ASHER_MED_API_URL`)

### Credit Monitoring
- Email admin via Resend to `ADMIN_APPROVAL_EMAIL` when credit balance drops below 5
- Check balance before every order placement (fail gracefully if insufficient)

### Claude's Discretion
- Exact Zod schema structure (follow existing `lib/validation.ts` patterns)
- DB table column types and indexes
- Error class design for SiPhox API errors
- Biomarker mapping config format (static config file vs DB table)
- Whether to use single file `lib/siphox-api.ts` or directory `lib/siphox/`

</decisions>

<specifics>
## Specific Ideas

- Follow the Asher Med API client pattern exactly (`lib/asher-med-api.ts`) — typed generic wrapper, auth header, error class
- Bearer token auth (not X-API-KEY header like Asher Med)
- DB caching strategy: biomarker reports are immutable after lab processing — fetch once from SiPhox, validate with Zod, store in PostgreSQL JSONB
- ~150+ biomarkers need mapping from SiPhox names to display categories (Metabolic, Heart, Hormonal, Inflammation, Thyroid, Nutritional, Extended)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/asher-med-api.ts`: Proven API client pattern with typed generic wrapper, error handling, query param serialization — structural template for SiPhox client
- `lib/validation.ts`: Zod schema patterns for request/response validation
- `lib/db.ts`: Database access patterns with `@vercel/postgres` sql tagged templates
- `lib/resilience.ts`: Has `BIOMARKER_DEFINITIONS` with weighted scoring — foundation for biological age calculation

### Established Patterns
- External API clients live in `lib/{service-name}-api.ts` or `lib/{service}/`
- Config constants in `lib/config/{name}.ts` with SCREAMING_SNAKE_CASE exports
- DB migrations in `migrations/NNN_description.sql`
- Type-first: interfaces defined at top of client file, exported for consumers

### Integration Points
- Stripe webhook handler (`app/api/webhook/stripe/route.ts`) — Phase 2 will extend this
- `lib/db.ts` — new DB operations for siphox tables
- `lib/config/plans.ts` — tier detection for kit eligibility

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-14*
