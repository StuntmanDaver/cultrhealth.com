# Architecture Patterns

**Domain:** SiPhox Health Lab API Integration into CULTR Health Platform
**Researched:** 2026-03-14
**Overall confidence:** HIGH (component boundaries and data flows follow proven codebase patterns)

---

## Recommended Architecture

The integration follows the codebase's established layered pattern: a dedicated API client in `lib/`, configuration constants in `lib/config/`, API routes in `app/api/`, and interactive UI in `*Client.tsx` components. No new architectural concepts are needed -- this is the same shape as the Asher Med, QuickBooks, and Stripe integrations.

### System Diagram

```
                    CULTR Health Platform
 +---------------------------------------------------------+
 |                                                         |
 |  lib/config/siphox.ts        lib/siphox-api.ts          |
 |  (biomarker categories,      (SiPhox API client:        |
 |   kit types, tier rules)      customers, orders,        |
 |                               kits, reports)            |
 |         |                          |                    |
 |         v                          v                    |
 |  app/api/siphox/           app/api/webhook/stripe/      |
 |  +-labs/route.ts           route.ts (extended)          |
 |  +-register-kit/route.ts                                |
 |  +-reports/route.ts                                     |
 |         |                          |                    |
 |         v                          v                    |
 |  components/dashboard/      DB: siphox_customers,       |
 |  LabsDashboardClient.tsx         siphox_orders,         |
 |  BiologicalAgeCard.tsx           siphox_reports         |
 |  BiomarkerTrends.tsx        (caching + mapping)         |
 |                                                         |
 +---------------------------------------------------------+
              |                           |
              v                           v
     SiPhox Health API            Stripe Payment Links
     connect.siphoxhealth.com     (checkout sessions)
```

### Component Boundaries

| Component | Responsibility | Communicates With | Layer |
|-----------|---------------|-------------------|-------|
| `lib/config/siphox.ts` | Biomarker category definitions, kit type constants, tier-to-kit mapping rules, display metadata | Nothing (pure constants) | Configuration |
| `lib/siphox-api.ts` | SiPhox REST API client -- all HTTP calls to `connect.siphoxhealth.com/api/v1/` | SiPhox API (external), `lib/config/siphox.ts` | Infrastructure |
| `lib/siphox-db.ts` | DB operations for SiPhox mapping tables (customer sync, order tracking, report caching) | `@vercel/postgres` | Infrastructure |
| `app/api/siphox/labs/route.ts` | Fetch member's lab reports + biomarker data, return structured for dashboard | `lib/siphox-api.ts`, `lib/siphox-db.ts`, `lib/portal-auth.ts` | API |
| `app/api/siphox/register-kit/route.ts` | Accept kit ID from member, validate + register via SiPhox API | `lib/siphox-api.ts`, `lib/siphox-db.ts`, `lib/portal-auth.ts` | API |
| `app/api/siphox/reports/[reportId]/route.ts` | Fetch single report detail from SiPhox, return biomarker values | `lib/siphox-api.ts`, `lib/siphox-db.ts`, `lib/portal-auth.ts` | API |
| `app/api/webhook/stripe/route.ts` | EXTENDED: On checkout.session.completed for Catalyst+/Concierge, auto-create SiPhox order | `lib/siphox-api.ts`, `lib/siphox-db.ts` (addition to existing file) | API |
| `components/dashboard/LabsDashboardClient.tsx` | Labs tab UI: kit status, registration form, biomarker results display, N/A handling | CULTR API routes (`/api/siphox/*`) | UI |
| `components/dashboard/BiologicalAgeCard.tsx` | EXISTING: Wire to real SiPhox age data instead of placeholder props | `/api/siphox/labs` | UI |
| `components/dashboard/BiomarkerTrends.tsx` | EXISTING: Wire to real SiPhox biomarker data instead of placeholder props | `/api/siphox/labs` | UI |
| `migrations/019_siphox_tables.sql` | DB schema for customer mapping, order tracking, report caching | PostgreSQL | Data |

---

## Data Flow

### Flow 1: Checkout --> SiPhox Kit Order (Automated)

This is the primary "happy path" for Catalyst+ and Concierge members.

```
1. Member completes Stripe checkout for Catalyst+ or Concierge plan
2. Stripe fires `checkout.session.completed` webhook
3. Existing webhook handler creates membership record (unchanged)
4. NEW: Webhook checks plan_tier metadata
   - If tier is 'catalyst' or 'concierge':
     a. Look up member's shipping address from portal session / intake data
     b. Call lib/siphox-api.ts:findOrCreateCustomer() with member info
        - Uses external_id = CULTR member ID for reliable sync
        - Creates SiPhox customer if not found
     c. Store mapping in siphox_customers table
     d. Call lib/siphox-api.ts:createOrder() with:
        - recipient address from member profile
        - kit_types: [{ kitType: 'longevity-essentials', quantity: 1 }]
        - purchase_with_attached_payment: false (use credits)
        - is_notify_receiver: true (SiPhox sends kit tracking)
     e. Store order in siphox_orders table (status: 'ordered')
     f. Log order ID, kit type (no PHI)
5. SiPhox ships kit directly to member (handled by SiPhox)
```

**Error handling:** SiPhox order creation is non-fatal (try/catch, same pattern as Asher Med PATCH). Membership is always created even if SiPhox call fails. Failed orders logged for manual retry via admin.

### Flow 2: Core Tier Add-On at Checkout

For Core members who opt into the $135 lab test.

```
1. Core checkout page shows optional "At-Home Lab Test" add-on ($135)
2. If selected, checkout session metadata includes siphox_addon: true
3. Stripe checkout includes the $135 line item
4. On webhook completion:
   - Same SiPhox order creation as Flow 1
   - Triggered by metadata flag rather than tier check
```

**Implementation note:** This requires either (a) a Stripe Checkout Session (not Payment Link) to support dynamic add-ons, or (b) a separate Stripe product/price for the lab add-on that gets added to the existing payment link. The simpler path is adding a line item to a Checkout Session. The Core tier currently uses a Payment Link (`buy.stripe.com/...`), so this may need to be migrated to a Checkout Session creation flow -- or the add-on can be a separate post-checkout purchase.

### Flow 3: Kit Registration (Member-Initiated)

After receiving the physical kit, members register it in their portal.

```
1. Member logs into portal (/portal/login via phone OTP)
2. Navigates to Labs tab in dashboard
3. UI shows "Register Your Kit" section with input field
4. Member enters kit ID (printed on physical kit)
5. Client POSTs to /api/siphox/register-kit with { kitId }
6. Route:
   a. Verify portal session (verifyPortalSession from lib/portal-auth.ts)
   b. Look up member's siphox_customer_id from siphox_customers table
   c. Call lib/siphox-api.ts:validateKit(kitId) -- pre-check
   d. If valid, call lib/siphox-api.ts:registerKit(kitId, customerData)
   e. Update siphox_orders table: status = 'kit_registered'
   f. Return { success: true, kitId, status: 'registered' }
7. UI updates to show "Kit Registered -- Send your sample!"
```

### Flow 4: Results Fetching and Display

After SiPhox processes the sample and generates a report.

```
1. Member visits Labs tab in dashboard
2. Client fetches /api/siphox/labs
3. Route:
   a. Verify portal session
   b. Look up siphox_customer_id from siphox_customers
   c. Check siphox_reports cache in DB
      - If cached report exists and is < 1 hour old: return cached
      - Otherwise: call lib/siphox-api.ts:getReports(customerId)
   d. For each report:
      - Fetch full report data via getReport(customerId, reportId)
      - Transform SiPhox biomarker data into CULTR display format
      - Map SiPhox biomarker names to lib/config/siphox.ts categories
      - Store/update in siphox_reports cache table
   e. Return structured data:
      {
        kitStatus: 'ordered' | 'registered' | 'sample_received'
                   | 'processing' | 'completed',
        reports: [{
          id, date, biomarkers: [{
            id, name, category, value, unit, referenceRange, status
          }]
        }],
        biologicalAge: { ... } | null,
        availableBiomarkers: [...] // full list with N/A for missing
      }
4. LabsDashboardClient renders:
   - Kit status timeline (if no results yet)
   - BiologicalAgeCard (if bio age data available)
   - BiomarkerTrends grouped by category
   - N/A markers for biomarkers in the panel but not in results
```

### Flow 5: Customer Sync (CULTR Member <--> SiPhox Customer)

```
Mapping Strategy:
- CULTR uses portal phone number as primary member identity
- SiPhox uses their own customer ID
- Bridge table: siphox_customers
  - cultr_phone_e164 (from portal session)
  - siphox_customer_id (from SiPhox API)
  - siphox_external_id (CULTR-generated, passed as external_id to SiPhox)
  - email (for fallback lookup)

Sync Direction: CULTR --> SiPhox (one-way push)
- Customer created in SiPhox when first kit is ordered
- external_id field used for reliable re-identification
- No SiPhox --> CULTR webhook needed (we poll for reports)

External ID Format: cultr_{membership_id or phone_hash}
- Deterministic, privacy-preserving
- Survives SiPhox customer recreation
- Unique per CULTR member
```

---

## Address Resolution for Kit Shipping

SiPhox kit orders require a shipping address. The address must be resolved at checkout webhook time. Here is the lookup priority chain:

```
1. Stripe Checkout Session -> session.customer_details.address
   (Stripe collects shipping address during checkout)

2. Portal session -> portal_sessions.phone -> pending_intakes.intake_data
   (Shipping address captured during medical intake)

3. Club members -> club_members table
   (address_street, address_city, address_state, address_zip)

4. Asher Med patient -> getPatientById(asherPatientId)
   (address1, city, stateAbbreviation, zipcode)
```

If no address can be resolved at webhook time, store the SiPhox customer record but skip the order. Set siphox_orders.status = 'pending_address'. The Labs dashboard can prompt the member to enter their shipping address before a kit can be ordered.

**Confidence:** MEDIUM -- Stripe checkout sessions do include customer address when configured, but the current checkout flow uses Payment Links which may or may not collect shipping address. Need to verify Stripe Payment Link configuration.

---

## Patterns to Follow

### Pattern 1: External API Client (matches lib/asher-med-api.ts)

The SiPhox client follows the exact same structure as `lib/asher-med-api.ts`:

```typescript
// lib/siphox-api.ts

class SiPhoxApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'SiPhoxApiError';
  }
}

async function siphoxRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<T> {
  const apiKey = process.env.SIPHOX_API_KEY;
  if (!apiKey) {
    throw new SiPhoxApiError('SIPHOX_API_KEY is not configured');
  }

  const baseUrl = process.env.SIPHOX_API_URL
    || 'https://connect.siphoxhealth.com/api/v1';

  // Bearer token auth (differs from Asher Med's X-API-KEY)
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // ... fetch, error handling matching Asher Med pattern
}

// Typed wrapper functions for each endpoint group
// Customers
export async function createCustomer(data: CreateSiPhoxCustomerInput): Promise<SiPhoxCustomer> { }
export async function getCustomers(params?: { external_id?: string }): Promise<SiPhoxCustomer[]> { }
export async function getCustomerById(id: string): Promise<SiPhoxCustomer> { }
export async function addCustomerData(data: CustomerDataInput): Promise<{ jobId: string }> { }

// Orders
export async function createOrder(data: CreateSiPhoxOrderInput): Promise<SiPhoxOrder> { }
export async function getOrders(params?: PaginationParams): Promise<SiPhoxOrder[]> { }
export async function getOrderById(id: string): Promise<SiPhoxOrder> { }

// Kits
export async function getKits(): Promise<SiPhoxKit[]> { }
export async function validateKit(kitId: string): Promise<KitValidation> { }
export async function registerKit(kitId: string, data: KitRegistrationInput): Promise<SiPhoxKit> { }

// Reports
export async function getReport(customerId: string, reportId: string): Promise<SiPhoxReport> { }

// Biomarkers
export async function getBiomarkerDefinitions(): Promise<SiPhoxBiomarker[]> { }

// Credits
export async function getCredits(): Promise<{ balance: number }> { }

// Utility
export function isSiPhoxConfigured(): boolean {
  return !!process.env.SIPHOX_API_KEY;
}
```

**Key differences from Asher Med client:**
- Auth: `Authorization: Bearer <token>` (not `X-API-KEY` header)
- Base URL: Configurable via `SIPHOX_API_URL` env var with sensible default
- Simpler payloads: Customer creation needs only name, email, address, external_id

### Pattern 2: Non-Fatal Side Effect in Webhook (matches Asher Med PATCH pattern)

The SiPhox kit ordering happens inside the existing Stripe webhook, following the same non-fatal pattern used for Asher Med partner notes and creator attribution:

```typescript
// Inside handleCheckoutCompleted() in webhook/stripe/route.ts

// ... existing membership creation code (unchanged) ...

// NEW: Auto-order SiPhox kit for eligible tiers
const planTier = session.metadata?.plan_tier;
const siphoxAddon = session.metadata?.siphox_addon === 'true';
const eligibleForKit = planTier === 'catalyst'
                    || planTier === 'concierge'
                    || siphoxAddon;

if (eligibleForKit) {
  try {
    const { orderSiPhoxKit } = await import('@/lib/siphox-db');
    await orderSiPhoxKit({
      customerEmail,
      customerName,
      planTier,
      stripeSessionId: session.id,
      // Address from Stripe session or member profile
    });
    console.log('SiPhox kit ordered:', { planTier, sessionId: session.id });
  } catch (siphoxError) {
    console.error('Failed to order SiPhox kit:', siphoxError);
    // Non-fatal -- membership still created
  }
}
```

This addition is ~15 lines inside the existing `handleCheckoutCompleted()` function. No structural changes to the webhook handler.

### Pattern 3: Auth-Gated API Route (matches portal pattern)

```typescript
// app/api/siphox/labs/route.ts
import { verifyPortalSession } from '@/lib/portal-auth';

export async function GET(request: NextRequest) {
  const session = await verifyPortalSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up SiPhox customer for this portal phone
  const siphoxCustomer = await getSiPhoxCustomerByPhone(session.phone);
  if (!siphoxCustomer) {
    return NextResponse.json({
      kitStatus: null,
      reports: [],
      biologicalAge: null,
      availableBiomarkers: getFullBiomarkerList(), // show what's possible
    });
  }

  // Fetch and return data...
}
```

All three SiPhox API routes use `verifyPortalSession()` -- the same auth guard used by existing portal endpoints. No new auth infrastructure needed.

### Pattern 4: Report Caching (DB-backed, time-limited)

SiPhox reports are immutable once generated. Cache aggressively to minimize API calls.

```
Cache strategy:
- siphox_reports table stores full JSONB report data
- TTL: 1 hour for "processing" status, permanent for "completed"
- On cache miss: fetch from SiPhox API, store in DB
- On cache hit: return DB data directly
- Reports never change once completed -- effectively permanent cache
- fetched_at column tracks when cache was last refreshed
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Polling SiPhox for Kit Status via Cron

**What:** Setting up a cron job to poll SiPhox for kit/report status changes.
**Why bad:** Unnecessary API calls; wastes SiPhox credits/rate limit; adds operational complexity; most poll results will show no change.
**Instead:** Fetch status on-demand when member visits their Labs tab. Cache results in DB. Reports are only actionable when the member is looking at them. The latency of a live API call on tab visit is acceptable (~200-500ms, same as Asher Med pattern).

### Anti-Pattern 2: Storing Raw Biomarker Values Without Context

**What:** Storing just `{ name: "hsCRP", value: 0.8 }` in the cache.
**Why bad:** Loses reference ranges, units, and status interpretation. Forces re-computation on every render.
**Instead:** Store the full transformed result including category, unit, reference range, and computed status (optimal/acceptable/suboptimal/critical). Transform once on fetch, serve pre-computed from cache.

### Anti-Pattern 3: Creating a Separate Auth System for Labs

**What:** Building a new auth flow or token system for the labs section.
**Why bad:** The portal OTP auth already gates the member dashboard. Adding another layer creates confusion and maintenance burden.
**Instead:** Use the existing `verifyPortalSession()` from `lib/portal-auth.ts`. The labs routes are just more portal-authenticated endpoints.

### Anti-Pattern 4: Direct SiPhox API Calls from Client Components

**What:** Having `LabsDashboardClient.tsx` call SiPhox directly.
**Why bad:** Exposes API key to client; bypasses auth; no caching; HIPAA violation (PHI transiting client without server-side control).
**Instead:** All SiPhox communication goes through CULTR API routes (`/api/siphox/*`), which handle auth, caching, and PHI-safe responses.

### Anti-Pattern 5: Tightly Coupling UI to SiPhox Schema

**What:** Using SiPhox's internal biomarker IDs and category names directly in UI components.
**Why bad:** If SiPhox changes their schema, every UI component breaks. Also, SiPhox categories don't match CULTR's desired display organization.
**Instead:** Define CULTR's biomarker taxonomy in `lib/config/siphox.ts` with a mapping layer that translates SiPhox names to CULTR display names. UI only references CULTR's canonical IDs.

---

## Database Schema

### New Tables (migration 019)

```sql
-- SiPhox customer mapping (CULTR member <--> SiPhox customer)
CREATE TABLE IF NOT EXISTS siphox_customers (
  id SERIAL PRIMARY KEY,
  cultr_phone_e164 VARCHAR(20) NOT NULL,
  siphox_customer_id VARCHAR(100),
  siphox_external_id VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cultr_phone_e164),
  UNIQUE(siphox_external_id)
);

-- SiPhox kit orders (tracks lifecycle: ordered -> registered -> completed)
CREATE TABLE IF NOT EXISTS siphox_orders (
  id SERIAL PRIMARY KEY,
  siphox_customer_id VARCHAR(100) NOT NULL,
  siphox_order_id VARCHAR(100),
  kit_type VARCHAR(50) NOT NULL DEFAULT 'longevity-essentials',
  status VARCHAR(30) NOT NULL DEFAULT 'ordered',
    -- ordered | pending_address | shipped | kit_registered
    -- | sample_received | processing | completed | failed
  kit_id VARCHAR(100),
  stripe_session_id VARCHAR(255),
  plan_tier VARCHAR(20),
  is_addon BOOLEAN DEFAULT FALSE,
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  registered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SiPhox report cache (stores transformed biomarker data)
CREATE TABLE IF NOT EXISTS siphox_reports (
  id SERIAL PRIMARY KEY,
  siphox_customer_id VARCHAR(100) NOT NULL,
  siphox_report_id VARCHAR(100) NOT NULL,
  report_date TIMESTAMPTZ,
  report_data JSONB NOT NULL,  -- full transformed report with biomarkers
  biological_age NUMERIC(5,2), -- extracted for quick query
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(siphox_customer_id, siphox_report_id)
);

CREATE INDEX idx_siphox_customers_phone ON siphox_customers(cultr_phone_e164);
CREATE INDEX idx_siphox_orders_customer ON siphox_orders(siphox_customer_id);
CREATE INDEX idx_siphox_orders_status ON siphox_orders(status);
CREATE INDEX idx_siphox_reports_customer ON siphox_reports(siphox_customer_id);
```

### Schema Design Rationale

**Why a separate `siphox_customers` table (not extending `portal_sessions` or `memberships`)?**
- SiPhox customer lifecycle is independent of portal sessions (which expire/recreate)
- SiPhox customer ID is an external system mapping, not an auth concern
- Follows the same separation pattern as `asher_orders` having its own patient mapping
- Clean boundary: `siphox_customers` is a sync table, `portal_sessions` is an auth table

**Why JSONB for `report_data`?**
- Biomarker reports have variable structure (different panels return different biomarkers)
- Avoids creating 150+ columns or a complex biomarker-per-row schema
- JSONB is queryable (`report_data->'biomarkers'`) for admin/analytics if needed
- Follows the pattern of `pending_intakes.intake_data` JSONB in the existing schema

**Why `biological_age` as a dedicated column?**
- Most frequent query: "show bio age card on dashboard"
- Extracting from JSONB on every page load is wasteful
- Dedicated column enables simple `SELECT biological_age FROM siphox_reports WHERE ...`

---

## Biomarker Data Transformation

The critical translation layer between SiPhox's schema and CULTR's UI.

### SiPhox Report Structure (input -- assumed from API docs)

```typescript
// What SiPhox returns from GET /customers/:id/reports/:reportID
interface SiPhoxReport {
  _id: string;
  createdAt: string;
  biomarkers: Array<{
    name: string;          // e.g., "hsCRP", "A1C", "Total Testosterone"
    value: number;
    unit: string;
    referenceRange?: { low: number; high: number };
  }>;
  suggestions?: Array<{
    _id: string;
    text: string;
    link?: string;
    category?: string;
  }>;
}
```

**Confidence on report schema:** LOW -- SiPhox API docs are not publicly available. This schema is inferred from the PROJECT.md endpoint descriptions and general patterns for lab report APIs. The mapping layer design is sound regardless of the exact schema, but field names may need adjustment when real API access is available.

### CULTR Display Structure (output)

```typescript
// What the dashboard components expect
interface CultrLabResult {
  id: string;             // CULTR canonical ID (e.g., 'hscrp', 'a1c')
  siphoxName: string;     // Original SiPhox name (for debugging/mapping updates)
  name: string;           // Display name (e.g., "High-Sensitivity CRP")
  category: SiPhoxCategory;
  value: number | null;   // null = N/A (biomarker in panel but not in results)
  unit: string;
  referenceRange: { low: number; high: number } | null;
  status: 'optimal' | 'acceptable' | 'suboptimal' | 'critical' | 'na';
}
```

### Mapping Layer Design

```typescript
// lib/config/siphox.ts

export type SiPhoxCategory =
  | 'metabolic'
  | 'nutritional'
  | 'heart'
  | 'hormonal'
  | 'inflammation'
  | 'thyroid'
  | 'cbc'
  | 'cmp'
  | 'liver'
  | 'kidney'
  | 'other';

// Map SiPhox biomarker names --> CULTR display metadata
// This is the single source of truth for name translation
export const SIPHOX_BIOMARKER_MAP: Record<string, {
  id: string;
  displayName: string;
  category: SiPhoxCategory;
  lowerIsBetter?: boolean;
}> = {
  // Metabolic Health
  'A1C':           { id: 'a1c', displayName: 'HbA1c', category: 'metabolic' },
  'Albumin':       { id: 'albumin', displayName: 'Albumin', category: 'metabolic' },
  'C-Peptide':     { id: 'c-peptide', displayName: 'C-Peptide', category: 'metabolic' },
  'eAG':           { id: 'eag', displayName: 'Estimated Avg Glucose', category: 'metabolic' },
  'Cortisol':      { id: 'cortisol', displayName: 'Cortisol', category: 'metabolic' },

  // Nutritional
  '25-(OH) Vitamin D': { id: 'vitamin-d', displayName: 'Vitamin D', category: 'nutritional' },
  'Ferritin':          { id: 'ferritin', displayName: 'Ferritin', category: 'nutritional' },

  // Heart Health
  'ApoB':              { id: 'apob', displayName: 'ApoB', category: 'heart', lowerIsBetter: true },
  'ApoA1':             { id: 'apoa1', displayName: 'ApoA1', category: 'heart' },
  'Total Cholesterol':  { id: 'total-chol', displayName: 'Total Cholesterol', category: 'heart' },
  'HDL':               { id: 'hdl', displayName: 'HDL Cholesterol', category: 'heart' },
  'LDL':               { id: 'ldl', displayName: 'LDL Cholesterol', category: 'heart', lowerIsBetter: true },
  'Triglycerides':     { id: 'triglycerides', displayName: 'Triglycerides', category: 'heart', lowerIsBetter: true },
  'VLDL':              { id: 'vldl', displayName: 'VLDL', category: 'heart', lowerIsBetter: true },

  // Hormonal Health
  'Total Testosterone':  { id: 'total-testosterone', displayName: 'Total Testosterone', category: 'hormonal' },
  'Free Testosterone':   { id: 'free-testosterone', displayName: 'Free Testosterone', category: 'hormonal' },
  'DHEA-S':             { id: 'dhea-s', displayName: 'DHEA-S', category: 'hormonal' },
  'Estradiol':          { id: 'estradiol', displayName: 'Estradiol', category: 'hormonal' },
  'SHBG':               { id: 'shbg', displayName: 'SHBG', category: 'hormonal' },
  'FSH':                { id: 'fsh', displayName: 'FSH', category: 'hormonal' },
  'LH':                 { id: 'lh', displayName: 'LH', category: 'hormonal' },

  // Inflammation
  'hsCRP':              { id: 'hscrp', displayName: 'hsCRP', category: 'inflammation', lowerIsBetter: true },

  // Thyroid
  'TSH':                { id: 'tsh', displayName: 'TSH', category: 'thyroid' },

  // ... 150+ additional entries for extended panel
};

// Tier eligibility rules
export const SIPHOX_TIER_CONFIG: Record<string, {
  included: boolean;
  addonPrice: number | null;
}> = {
  club:      { included: false, addonPrice: null },
  core:      { included: false, addonPrice: 135 },
  catalyst:  { included: true,  addonPrice: null },
  concierge: { included: true,  addonPrice: null },
};
```

### Category Reconciliation with Existing Components

The existing `BiomarkerTrends.tsx` uses `BiomarkerCategory` from `lib/resilience.ts`:
`inflammation | metabolic | hormonal | longevity | oxidative | mitochondrial`

SiPhox uses different categories:
`metabolic | nutritional | heart | hormonal | inflammation | thyroid` plus extended panel categories.

**Resolution approach:** Extend the `BiomarkerCategory` type in `lib/resilience.ts` to include the new SiPhox categories. Add corresponding color entries in `BiomarkerTrends.tsx`'s `categoryColors` map. This is a ~10-line additive change to each file.

```typescript
// Extended BiomarkerCategory (lib/resilience.ts)
export type BiomarkerCategory =
  | 'inflammation'
  | 'metabolic'
  | 'hormonal'
  | 'longevity'
  | 'oxidative'
  | 'mitochondrial'
  // SiPhox categories
  | 'heart'
  | 'nutritional'
  | 'thyroid'
  | 'cbc'
  | 'cmp'
  | 'liver'
  | 'kidney'
  | 'other'
```

---

## Suggested Build Order

Components have clear dependencies. Build bottom-up:

```
Phase 1: Foundation (no UI, no webhook changes)
  1. lib/config/siphox.ts              -- biomarker map, kit types, tier rules
  2. lib/siphox-api.ts                 -- SiPhox REST client (all endpoints)
  3. migrations/019_siphox_tables.sql  -- DB schema (3 tables)
  4. lib/siphox-db.ts                  -- DB operations (CRUD for all 3 tables)

Phase 2: Automated Ordering (webhook integration)
  5. Extend webhook/stripe/route.ts    -- auto-order on checkout completion
  6. lib/siphox-db.ts:orderSiPhoxKit() -- orchestrates: resolve address,
                                          find-or-create customer, create order

Phase 3: Kit Registration (first member-facing feature)
  7. app/api/siphox/register-kit/route.ts  -- kit validation + registration
  8. LabsDashboardClient.tsx (partial)      -- kit registration UI only

Phase 4: Results Display (full dashboard)
  9.  app/api/siphox/labs/route.ts              -- reports + biomarker data
  10. app/api/siphox/reports/[reportId]/route.ts -- single report detail
  11. Extend lib/resilience.ts                   -- add new BiomarkerCategory values
  12. Extend BiomarkerTrends.tsx                 -- add category colors
  13. LabsDashboardClient.tsx (complete)          -- full labs tab with results
  14. Wire BiologicalAgeCard.tsx                  -- real data from SiPhox
  15. Wire BiomarkerTrends.tsx                    -- real data from SiPhox
  16. Update app/dashboard/page.tsx               -- add Labs tab to dashboard
```

**Rationale for this order:**
- Phase 1 has zero external dependencies and produces testable, isolated units
- Phase 2 enables kits to start shipping as soon as members check out, before any member-facing UI exists
- Phase 3 is the first member-visible feature (simplest possible: one text input, one API call, one status update)
- Phase 4 depends on reports existing in SiPhox (which requires kit registration + sample processing + lab turnaround time -- typically 5-10 business days)

**Implication for roadmap:** Phase 4 cannot be fully tested until a real kit goes through the full cycle. Consider ordering a test kit early in Phase 1 so results are available by the time Phase 4 UI is built.

---

## File Inventory

### New files to create (8 files)

| File | Purpose | Depends On |
|------|---------|------------|
| `lib/config/siphox.ts` | Biomarker map, kit types, tier rules, category colors | Nothing |
| `lib/siphox-api.ts` | SiPhox REST client (all 6 endpoint groups) | `lib/config/siphox.ts` |
| `lib/siphox-db.ts` | DB ops: customer sync, order tracking, report cache | `@vercel/postgres`, `lib/siphox-api.ts` |
| `migrations/019_siphox_tables.sql` | 3 new tables + indexes | Migration 014+ |
| `app/api/siphox/labs/route.ts` | GET: member's lab data for dashboard | `lib/siphox-*`, `lib/portal-auth.ts` |
| `app/api/siphox/register-kit/route.ts` | POST: register kit ID | `lib/siphox-*`, `lib/portal-auth.ts` |
| `app/api/siphox/reports/[reportId]/route.ts` | GET: single report detail | `lib/siphox-*`, `lib/portal-auth.ts` |
| `components/dashboard/LabsDashboardClient.tsx` | Labs tab: status, registration, results | `/api/siphox/*` routes |

### Files to modify (5 files, all additive changes)

| File | Change | Lines Added | Risk |
|------|--------|-------------|------|
| `app/api/webhook/stripe/route.ts` | Add SiPhox kit ordering in `handleCheckoutCompleted()` | ~20 | LOW -- non-fatal try/catch block |
| `components/dashboard/BiomarkerTrends.tsx` | Extend `categoryColors` map with new SiPhox categories | ~15 | LOW -- additive only |
| `lib/resilience.ts` | Extend `BiomarkerCategory` union type | ~8 | LOW -- type-only change |
| `app/dashboard/page.tsx` | Restructure to tabbed layout, add Labs tab | ~30 | MEDIUM -- restructures existing page |
| `components/dashboard/BiologicalAgeCard.tsx` | No structural change -- already accepts real data via props | 0 | NONE -- just wire up correct props |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SIPHOX_API_KEY` | Yes | Bearer token for SiPhox API authentication |
| `SIPHOX_API_URL` | No | Base URL override (default: `https://connect.siphoxhealth.com/api/v1`) |
| `SIPHOX_IS_TEST` | No | Set `true` for test orders (maps to `is_test_order` in create order API) |
| `SIPHOX_NOTIFY_RECEIVER` | No | Set `false` to suppress SiPhox kit notification emails (default: `true`) |

---

## HIPAA Considerations

Biomarker data is Protected Health Information. Follow the codebase's established HIPAA patterns:

- **No PHI in logs:** Log only IDs, statuses, timestamps -- never biomarker values, patient names, or addresses
- **Server-side only:** All SiPhox API calls happen in API route handlers, never in client components
- **Cache security:** `siphox_reports.report_data` JSONB contains PHI -- same DB-level security as `pending_intakes.intake_data` JSONB
- **No client caching headers:** Lab data routes must include `Cache-Control: private, no-cache` (matches existing authenticated route pattern)
- **Secure transport:** HTTPS to SiPhox API (enforced by their `connect.siphoxhealth.com` endpoint)
- **Minimal client response:** API routes return only what the UI needs to display -- no raw SiPhox API responses forwarded to client

---

## Scalability Considerations

| Concern | At 100 members | At 10K members | At 100K members |
|---------|---------------|----------------|-----------------|
| SiPhox API calls | On-demand per tab visit; ~10/day | Cache in DB reduces to ~100/day | Need SiPhox webhook for push updates |
| Report storage | ~100 JSONB rows, negligible | ~10K rows, ~50MB | Consider archival to S3 |
| Kit ordering | 1-2/day, inline in webhook | 50+/day, still inline | Queue via background job |
| Credit monitoring | Manual check | Admin dashboard alert | Auto-reorder credits via API |

---

## Sources

- SiPhox Health Partner Program: [siphoxhealth.com/partner](https://siphoxhealth.com/partner)
- SiPhox Health Partner FAQ: [siphoxhealth.com/partner/faq](https://siphoxhealth.com/partner/faq)
- Existing codebase patterns: `lib/asher-med-api.ts`, `lib/quickbooks.ts`, `app/api/webhook/stripe/route.ts`, `lib/portal-auth.ts`
- SiPhox API endpoint reference: PROJECT.md (provided by user)

---

*Architecture analysis: 2026-03-14*
