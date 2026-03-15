# Technology Stack

**Project:** SiPhox Health Blood Test Kit Integration
**Researched:** 2026-03-14

## Recommended Stack

### SiPhox API Client

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `fetch` (Node 18+) | Built-in | HTTP client for SiPhox REST API | The codebase already uses native `fetch` for Asher Med API (`lib/asher-med-api.ts`). Follow the same `asherRequest<T>()` pattern -- typed wrapper function with Bearer token auth, error handling, and query param serialization. No new HTTP library needed. |
| `zod` | ^3.23.0 (existing) | Runtime validation of SiPhox API responses | Already in the codebase (`lib/validation.ts`). SiPhox is an external API returning health data -- every response MUST be validated at runtime before touching DB or UI. Define Zod schemas for all SiPhox response shapes and `safeParse()` before passing data downstream. TypeScript types alone are insufficient for external API data. |

**Confidence: HIGH** -- The `asherRequest<T>()` pattern in `lib/asher-med-api.ts` (lines 250-320) is proven. It handles auth headers, query params, content type detection, and error extraction. The SiPhox client should be structurally identical: `siphoxRequest<T>(endpoint, options)` with Bearer token instead of X-API-KEY header.

**Do NOT use axios, got, ky, or any HTTP client library.** Native `fetch` is available in Node 18+ and is already the codebase standard. Adding a new HTTP library for one integration creates an inconsistency.

### SiPhox Response Validation Pattern

```typescript
// lib/siphox/schemas.ts
import { z } from 'zod'

const SiPhoxBiomarkerSchema = z.object({
  _id: z.string(),
  name: z.string(),
  unit: z.string().optional(),
  value: z.number().nullable(),
  referenceRange: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
  }).optional(),
})

const SiPhoxReportSchema = z.object({
  _id: z.string(),
  biomarkers: z.array(SiPhoxBiomarkerSchema),
  createdAt: z.string(),
  status: z.string(),
})

// Usage in API client
export async function getReport(customerId: string, reportId: string) {
  const raw = await siphoxRequest(`/customers/${customerId}/reports/${reportId}`)
  const result = SiPhoxReportSchema.safeParse(raw)
  if (!result.success) {
    throw new SiPhoxApiError(`Invalid report response: ${result.error.message}`)
  }
  return result.data
}
```

**Confidence: HIGH** -- Zod `safeParse()` is the standard pattern for external API validation. This catches schema drift (SiPhox changes their API) before bad data enters the system.

### Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `recharts` | ^3.7.0 (existing, update to ^3.8.0) | Biomarker trend charts, range visualization | Already in the codebase for creator analytics (`components/creators/AnalyticsCharts.tsx`). Recharts 3.x supports `ReferenceArea` for optimal/acceptable range bands, `LineChart` for biomarker trends over time, `RadialBarChart` for score gauges. No new charting library needed. |
| Custom SVG components | -- | Gauge arcs, sparklines, range bars | Already in the codebase. `BiologicalAgeCard.tsx` has a custom SVG gauge. `BiomarkerTrends.tsx` has custom SVG sparklines. Continue this pattern for simple visualizations. Use Recharts only when you need axes, tooltips, or responsive containers. |

**Confidence: HIGH** -- Recharts 3.8.0 (released March 6, 2025) is the latest stable. The project is on ^3.7.0 which will auto-resolve to 3.8.0 on next `npm install`. Key Recharts features for this integration:

- **`ReferenceArea`** -- Draws colored bands on charts for optimal/acceptable/suboptimal ranges. Perfect for showing where a biomarker value falls relative to reference ranges.
- **`LineChart` + `Area`** -- Biomarker value trends over multiple reports.
- **`RadialBarChart`** -- Overall health score gauge (alternative to the custom SVG gauge already in BiologicalAgeCard).
- **`ResponsiveContainer`** -- Built into v3 charts, handles mobile/desktop resizing.

**Do NOT add nivo, tremor, visx, Chart.js, or ApexCharts.** Recharts is already a dependency, is actively maintained (5 days since last release), covers all required chart types, and adding a second charting library creates bundle bloat and inconsistent styling.

### Biomarker Range Visualization (Recharts ReferenceArea)

```typescript
// Example: Biomarker value chart with optimal range band
<LineChart data={biomarkerHistory}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis domain={['auto', 'auto']} />
  {/* Optimal range band (green) */}
  <ReferenceArea y1={optimalLow} y2={optimalHigh} fill="#10B981" fillOpacity={0.1} />
  {/* Acceptable range band (yellow) */}
  <ReferenceArea y1={acceptableLow} y2={acceptableHigh} fill="#F59E0B" fillOpacity={0.05} />
  <Line type="monotone" dataKey="value" stroke="#2A4542" strokeWidth={2} />
  <Tooltip />
</LineChart>
```

### Biomarker Range Bar (Custom Tailwind Component)

For individual biomarker cards, the range bar visualization does NOT need Recharts. Use a custom Tailwind component (the existing `BiomarkerTrends.tsx` pattern of inline SVG + Tailwind divs is the right approach):

```typescript
// Horizontal range bar showing value position within reference range
function RangeBar({ value, low, high, optimalLow, optimalHigh }) {
  // Calculate percentage position of value within full range
  // Render as stacked Tailwind divs with colored segments
  // No chart library needed for this
}
```

**Confidence: HIGH** -- The existing codebase already does this. `BiologicalAgeCard.tsx` line 98 has a gradient range bar. `BiomarkerTrends.tsx` line 69 has SVG sparklines. This is the right pattern for small inline visualizations.

### Database & Caching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@vercel/postgres` | ^0.10.0 (existing) | Store SiPhox customer mappings, cached biomarker data, kit status | Already the database layer. Add tables for `siphox_customers` (member-to-SiPhox ID mapping), `siphox_kits` (kit registration and status), `siphox_reports` (cached report data). |
| Next.js `fetch` cache | Built-in | Cache SiPhox API responses on server | Use `next: { revalidate: 3600 }` on `fetch()` calls for biomarker reference data (changes rarely). For patient-specific report data, use `no-store` and cache in DB instead. |
| DB-level caching | -- | Store parsed biomarker results in PostgreSQL | SiPhox report data should be fetched once, parsed, and stored in local DB. Subsequent dashboard loads read from DB, not SiPhox API. Refresh when user explicitly requests or webhook fires. |

**Confidence: HIGH** -- The DB-caching-over-API-caching approach is correct for health data because:
1. SiPhox API has rate limits (undocumented but assumed for partner APIs)
2. Report data is immutable after lab processing (no reason to re-fetch)
3. Dashboard page loads should never depend on a third-party API being available
4. Cached data enables offline-first dashboard rendering

**Do NOT use Redis/Upstash for SiPhox data caching.** The project has optional Upstash Redis for rate limiting, but biomarker data belongs in PostgreSQL alongside the patient record. Redis is wrong for structured health data that needs querying by category, date range, and biomarker type.

**Do NOT use `unstable_cache`.** It is experimental in Next.js 14 and being replaced by `use cache` in Next.js 15. Stick with DB-level caching for durability and the built-in `fetch` cache for transient API responses.

### Caching Strategy Detail

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| SiPhox customer ID mapping | PostgreSQL `siphox_customers` | Permanent | Never (1:1 mapping doesn't change) |
| Kit registration status | PostgreSQL `siphox_kits` | Permanent, refreshed on status change | Poll SiPhox `/kits` endpoint daily via cron, or on user dashboard load if status != 'completed' |
| Biomarker report results | PostgreSQL `siphox_reports` + JSONB column | Permanent once processed | Fetched once when report status = 'completed', never re-fetched |
| Biomarker reference list | Next.js `fetch` cache | 24 hours (`revalidate: 86400`) | `GET /biomarkers` returns static catalog, changes rarely |
| SiPhox credit balance | No cache | N/A | Always fetch fresh from `GET /credits` before ordering |

### HIPAA Data Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing HIPAA patterns | -- | PHI handling for biomarker data | Biomarker results are PHI. Follow existing patterns: no console.log of values, no client-side error messages with data, `private, no-cache` response headers on authenticated routes (already configured in `next.config.js`). |
| `@vercel/postgres` | ^0.10.0 (existing) | Encrypted at rest via Neon PostgreSQL | Neon provides encryption at rest (AES-256) and in transit (TLS). No additional encryption layer needed for biomarker storage. |

**Confidence: HIGH** -- The codebase already handles PHI from Asher Med (patient data, intake forms, orders). Biomarker data follows the same classification and handling rules.

### Stripe Integration (Extend Existing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `stripe` | ^20.2.0 (existing) | Add $135 blood test kit add-on to Core tier checkout | Extend existing checkout flow in `app/api/checkout/route.ts`. Add a line item for the SiPhox kit when Core tier + add-on selected. Catalyst+ and Concierge auto-include it (modify checkout to always add the line item for those tiers). |

**Confidence: HIGH** -- The existing Stripe checkout already supports multiple line items, subscription + product bundles, and coupon codes. Adding a kit line item is a configuration change, not an architectural one.

### API Error Handling & Resilience

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing `lib/resilience.ts` patterns | -- | Retry logic for SiPhox API calls | The codebase has retry and circuit breaker patterns. Apply to SiPhox API calls, especially for order creation (must succeed) and report fetching (can gracefully degrade). |
| Custom `SiPhoxApiError` class | -- | Typed error handling | Follow `AsherMedApiError` pattern from `lib/asher-med-api.ts` line 239. Include `statusCode`, `response`, and `endpoint` for debugging. |

**Confidence: HIGH** -- The pattern is established. The SiPhox client should mirror the Asher Med client's error handling exactly.

### SiPhox API Client Architecture

```
lib/siphox/
  api.ts           # Core API client (siphoxRequest<T>, auth, error handling)
  schemas.ts       # Zod schemas for all SiPhox API responses
  types.ts         # TypeScript types (inferred from Zod schemas)
  customers.ts     # Customer CRUD operations
  orders.ts        # Kit order operations
  kits.ts          # Kit validation and registration
  reports.ts       # Report fetching and parsing
  biomarkers.ts    # Biomarker catalog and reference data
  credits.ts       # Credit balance checking
```

This mirrors the structure of existing integrations (`lib/asher-med-api.ts` is monolithic but the SiPhox client benefits from splitting by endpoint group due to the larger surface area).

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| HTTP Client | Native `fetch` | `axios` | Adds 29KB, the codebase uses `fetch` everywhere. Axios offers interceptors but `siphoxRequest<T>()` handles auth/error centrally without them. |
| HTTP Client | Native `fetch` | `ky` | Cleaner API than fetch but adds a dependency for no real benefit when the wrapper function handles everything. |
| Response Validation | `zod` (existing) | `io-ts`, `yup`, `typebox` | Zod is already in the project. Adding a second validation library creates confusion about which to use where. |
| Charting | `recharts` (existing) | `nivo` | Nivo has more chart types but adds ~150KB. Recharts covers LineChart, AreaChart, RadialBarChart, and ReferenceArea -- all we need. Already in the bundle. |
| Charting | `recharts` (existing) | `tremor` | Tremor is built on Recharts anyway. It provides higher-level dashboard components but fights with the existing Tailwind design system. |
| Charting | `recharts` (existing) | `visx` (Airbnb) | Lower-level D3 wrapper requiring more custom code. Overkill when Recharts already handles the chart types needed. |
| Charting | Custom SVG + Tailwind | `react-gauge-chart` | Adding a library for one gauge component is wasteful. The existing `BiologicalAgeCard.tsx` already has a custom gauge that can be adapted. |
| Data Caching | PostgreSQL DB cache | Redis (Upstash) | Biomarker data is structured, queryable, and persistent. Redis is for ephemeral cache (rate limits, sessions). Wrong tool for health records. |
| Data Caching | PostgreSQL DB cache | `unstable_cache` | Experimental API being deprecated in Next.js 15. DB caching is durable and portable. |
| State Management | React Context (existing) | Zustand, Jotai, Redux | The codebase uses React Context for all shared state. Biomarker data flows server->client via props or context. No state library needed. |

## New Dependencies to Install

```bash
# No new production dependencies needed
# All required libraries are already in the project:
#   - zod (validation)
#   - recharts (charts)
#   - @vercel/postgres (database)
#   - stripe (payments)
#   - jose (auth)

# Optional: update recharts to latest
npm install recharts@^3.8.0
```

**Total new dependencies: 0**

This is the ideal outcome. The existing stack covers every requirement for this integration. The work is entirely in new application code (API client, database tables, UI components), not in new library adoption.

## Environment Variables to Add

```bash
# SiPhox Health API (required)
SIPHOX_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx          # Bearer token for API auth
SIPHOX_API_URL=https://connect.siphoxhealth.com/api/v1  # Base URL

# SiPhox Configuration (required)
SIPHOX_KIT_TYPE=longevity_essentials             # Kit type to order (from SiPhox catalog)
SIPHOX_NOTIFY_RECEIVER=true                      # Email kit recipients

# SiPhox Configuration (optional)
SIPHOX_IS_TEST_ORDER=false                       # Set true for staging (if SiPhox supports test mode)
```

**SiPhox Partner Portal Setup Required:**
1. Confirm API credentials with SiPhox partner team
2. Verify available kit types and their IDs
3. Confirm credit balance and pricing per kit
4. Request webhook URL configuration (if SiPhox supports webhooks for report completion)
5. Obtain full API documentation (the public docs are minimal -- partner-level docs are needed)

## Key File Patterns to Follow

| Pattern | Existing Example | SiPhox Equivalent |
|---------|-----------------|-------------------|
| API client module | `lib/asher-med-api.ts` | `lib/siphox/api.ts` |
| Config constants | `lib/config/asher-med.ts` | `lib/config/siphox.ts` |
| Database operations | `lib/creators/db.ts` | `lib/siphox/db.ts` |
| API route handler | `app/api/intake/submit/route.ts` | `app/api/siphox/*/route.ts` |
| Client component | `app/intake/IntakeFormClient.tsx` | `app/dashboard/labs/LabsDashboardClient.tsx` |
| Webhook handler | `app/api/webhook/stripe/route.ts` | `app/api/webhook/siphox/route.ts` (if supported) |

## Sources

- [SiPhox Health Partner Program](https://siphoxhealth.com/partner) -- REST API overview, partner capabilities
- [SiPhox Partner FAQ](https://siphoxhealth.com/partner/faq) -- API implementation timeline, customization options
- [Recharts GitHub Releases](https://github.com/recharts/recharts/releases) -- v3.8.0 latest (March 2025)
- [Recharts ReferenceArea API](https://recharts.org/en-US/api/ReferenceArea) -- Range band visualization
- [Next.js 14 Data Fetching and Caching](https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating) -- Server-side fetch caching
- [Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) -- Deprecated, use DB caching instead
- [Zod Documentation](https://zod.dev/) -- Runtime validation for API responses
- [Fetch Wrapper Best Practices for Next.js](https://dev.to/dmitrevnik/fetch-wrapper-for-nextjs-a-deep-dive-into-best-practices-53dh) -- Typed fetch wrapper patterns

---

*Stack analysis: 2026-03-14*
