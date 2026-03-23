---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/integration/creator-e2e-jon-collins.test.ts
autonomous: true
requirements: [E2E-CREATOR-TEST]
must_haves:
  truths:
    - "JON21 coupon validates with 20% discount, creator name, and correct metadata"
    - "Case-insensitive coupon lookup works for jon21, Jon21, JON21"
    - "Click tracking on /r/joncollins441 creates click_events, increments click_count, sets attribution cookie"
    - "Order with JON21 applies 20% discount, creates attribution, logs commission at 20% custom rate"
    - "Self-referral detection blocks commission when order email matches creator email"
    - "Dashboard metrics reflect correct totalClicks, totalOrders, totalRevenue, totalCommission, conversionRate, commissionRate: 20"
    - "Earnings overview returns correct lifetimeEarnings and pendingEarnings"
    - "Earnings orders returns the attributed order with correct amounts"
    - "Commission ledger shows entry with type: direct, rate: 20, correct amount"
    - "Codes API returns JON21 with discount_value: 20"
    - "Links API returns joncollins441 with updated click_count"
    - "Admin analytics includes creator commission totals"
  artifacts:
    - path: "tests/integration/creator-e2e-jon-collins.test.ts"
      provides: "Comprehensive E2E integration test for Jon Collins creator account"
      min_lines: 400
  key_links:
    - from: "tests/integration/creator-e2e-jon-collins.test.ts"
      to: "lib/config/coupons.ts"
      via: "validateCouponUnified import"
      pattern: "validateCouponUnified"
    - from: "tests/integration/creator-e2e-jon-collins.test.ts"
      to: "lib/creators/commission.ts"
      via: "processOrderAttribution import"
      pattern: "processOrderAttribution"
    - from: "tests/integration/creator-e2e-jon-collins.test.ts"
      to: "lib/creators/attribution.ts"
      via: "handleClickTracking import"
      pattern: "handleClickTracking"
---

<objective>
Create a comprehensive Vitest integration test for Jon Collins' creator account that validates the entire creator affiliate pipeline: coupon validation, click tracking, order attribution, commission calculation, dashboard metrics, earnings, and admin analytics.

Purpose: Verify all creator affiliate system functions work correctly with Jon Collins' real DB state (20% custom commission rate, JON21 code, joncollins441 tracking link).
Output: Single integration test file covering 12 test scenarios across the full creator lifecycle.
</objective>

<execution_context>
@/Users/davidk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/davidk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tests/setup.ts
@tests/integration/protocol-engine.test.ts
@lib/config/coupons.ts
@lib/config/affiliate.ts
@lib/creators/commission.ts
@lib/creators/attribution.ts
@lib/creators/db.ts
@app/api/club/orders/route.ts
@app/r/[slug]/route.ts
@app/api/creators/dashboard/route.ts
@app/api/creators/earnings/overview/route.ts
@app/api/creators/earnings/orders/route.ts
@app/api/creators/earnings/ledger/route.ts
@app/api/creators/codes/route.ts
@app/api/creators/links/route.ts
@vitest.config.js

<interfaces>
<!-- Key types and functions the test will mock and exercise -->

From lib/config/coupons.ts:
```typescript
export type UnifiedCouponResult = {
  discount: number
  label: string
  isCreatorCode: boolean
  creatorId?: string
  creatorName?: string
  codeId?: string
  codeType?: 'membership' | 'product' | 'general'
}
export async function validateCouponUnified(code: string): Promise<UnifiedCouponResult | null>
```

From lib/creators/commission.ts:
```typescript
export interface CommissionResult {
  attributionId: string
  directCommission: number
  overrideCommission: number
  totalCommission: number
  isSelfReferral: boolean
  creatorId: string
  recruiterId?: string
}
export async function processOrderAttribution(params: {
  orderId: string
  netRevenue: number
  customerEmail: string
  attribution: ResolvedAttribution
  isSubscription?: boolean
  subscriptionPaymentNumber?: number
}): Promise<CommissionResult | null>
```

From lib/creators/attribution.ts:
```typescript
export interface AttributionCookieData {
  token: string
  creatorId: string
  linkId?: string
  expiresAt: number
}
export async function handleClickTracking(params: {
  slug: string; ip: string; userAgent: string; referer?: string; existingSessionId?: string
}): Promise<{ success: boolean; destinationPath: string; cookieData?: AttributionCookieData; sessionId: string }>
```

From lib/creators/db.ts (key functions to mock):
```typescript
export async function getCreatorById(id: string): Promise<Creator | null>
export async function getAffiliateCodeByCode(code: string): Promise<AffiliateCode | null>
export async function getAffiliateCodesByCreator(creatorId: string): Promise<AffiliateCode[]>
export async function getTrackingLinkBySlug(slug: string): Promise<TrackingLink | null>
export async function getTrackingLinksByCreator(creatorId: string): Promise<TrackingLink[]>
export async function incrementLinkClickCount(linkId: string): Promise<void>
export async function createClickEvent(input: {...}): Promise<ClickEvent>
export async function getCreatorDashboardStats(creatorId: string): Promise<{totalClicks, totalOrders, totalRevenue, totalCommission, pendingCommission, thisMonthClicks, thisMonthOrders, thisMonthRevenue, thisMonthCommission}>
export async function getCommissionBreakdownByCreator(creatorId: string): Promise<{directMembership, directProduct, override}>
export async function getCommissionSummaryByCreator(creatorId: string): Promise<{pending, approved, paid, total}>
export async function getCreatorOrderStats(creatorId: string): Promise<{totalOrders, totalRevenue, totalCommission}>
export async function getCommissionTotalSince(creatorId: string, since: Date, until?: Date): Promise<number>
export async function getOrderAttributionsByCreator(creatorId: string, limit, offset): Promise<OrderAttribution[]>
export async function getCommissionsByCreator(creatorId: string, status?, limit?, offset?): Promise<CommissionLedgerEntry[]>
```

From lib/config/affiliate.ts:
```typescript
export const COMMISSION_CONFIG = {
  directRate: 10.00,
  totalCapRate: 25.00,
  postBonusRate: 10.00,
  bonusWindowMonths: 6,
  attributionWindowMs: 30 * 24 * 60 * 60 * 1000,
  attributionCookieName: 'cultr_attribution',
  ...
}
```

Jon Collins DB fixture data:
```typescript
const JON_CREATOR = {
  id: 'b08b9042-0c0f-44e0-806c-b1be2a8ce9bb',
  email: 'teamjoncollins21@gmail.com',
  full_name: 'Jon Collins',
  status: 'active',
  commission_rate: 20.00,
  tier: 0,
  override_rate: 5.00,
  recruit_count: 0,
  active_member_count: 0,
  email_verified: true,
}
const JON_CODE = {
  id: '25d9ce4c-30a7-447f-a240-20620c025185',
  creator_id: 'b08b9042-0c0f-44e0-806c-b1be2a8ce9bb',
  code: 'JON21',
  code_type: 'membership',
  discount_type: 'percentage',
  discount_value: 20,
  is_primary: true,
  use_count: 0,
  total_revenue: 0,
  active: true,
}
const JON_LINK = {
  id: '2dd0f39d-17a7-46b7-a3da-e4ac82b95114',
  creator_id: 'b08b9042-0c0f-44e0-806c-b1be2a8ce9bb',
  slug: 'joncollins441',
  destination_path: '/',
  utm_source: 'creator',
  utm_medium: 'referral',
  click_count: 0,
  conversion_count: 0,
  active: true,
  is_default: true,
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create comprehensive E2E integration test for Jon Collins creator account</name>
  <files>tests/integration/creator-e2e-jon-collins.test.ts</files>
  <action>
Create a single Vitest integration test file that mocks DB calls (vi.mock('@/lib/creators/db') and vi.mock('@vercel/postgres')) and tests the full creator affiliate pipeline using Jon Collins' real data.

**Test structure — 12 describe blocks:**

1. **Coupon Validation (validateCouponUnified)**
   - Import `validateCouponUnified` from `@/lib/config/coupons`
   - Mock `getAffiliateCodeByCode` to return JON_CODE fixture when code matches 'JON21' (case-insensitive)
   - Mock `getCreatorById` to return JON_CREATOR fixture when id matches
   - Test: `validateCouponUnified('JON21')` returns `{ discount: 20, label: "Jon Collins's Code", isCreatorCode: true, creatorId: 'b08b9042-...', creatorName: 'Jon Collins', codeId: '25d9ce4c-...', codeType: 'membership' }`
   - Test: Invalid code returns null
   - Test: Staff code 'CULTRSTAFF' returns isCreatorCode: false (no DB call)

2. **Case Insensitivity**
   - Test: `validateCouponUnified('jon21')` returns same result as 'JON21'
   - Test: `validateCouponUnified('Jon21')` returns same result as 'JON21'
   - The mock for `getAffiliateCodeByCode` should match on `.toLowerCase()` just like the real implementation does

3. **Click Tracking (handleClickTracking)**
   - Import `handleClickTracking` from `@/lib/creators/attribution`
   - Mock `getTrackingLinkBySlug('joncollins441')` to return JON_LINK fixture
   - Mock `getCreatorById` to return JON_CREATOR
   - Mock `createClickEvent` to return a fake ClickEvent with a generated id
   - Mock `incrementLinkClickCount` to resolve
   - Test: `handleClickTracking({ slug: 'joncollins441', ip: '1.2.3.4', userAgent: 'TestBot/1.0' })` returns:
     - `success: true`
     - `cookieData.creatorId === JON_CREATOR.id`
     - `cookieData.linkId === JON_LINK.id`
     - `cookieData.expiresAt` is roughly 30 days from now
   - Test: `createClickEvent` was called with `creator_id: JON_CREATOR.id`, `link_id: JON_LINK.id`
   - Test: `incrementLinkClickCount` was called with JON_LINK.id

4. **Order Attribution with Coupon (processOrderAttribution)**
   - Import `processOrderAttribution` from `@/lib/creators/commission`
   - Mock `@vercel/postgres` `db.connect()` to return a mock client with query/release methods
   - The mock client.query should:
     - On BEGIN/COMMIT/ROLLBACK: resolve
     - On INSERT INTO order_attributions: return `{ rows: [{ id: 'test-attr-id' }] }`
     - On INSERT INTO commission_ledger: resolve
     - On UPDATE affiliate_codes: resolve
   - Mock `getCreatorById` to return JON_CREATOR (commission_rate: 20)
   - Test: `processOrderAttribution({ orderId: 'test-order-1', netRevenue: 100, customerEmail: 'buyer@example.com', attribution: { creatorId: JON_CREATOR.id, method: 'coupon_code', codeId: JON_CODE.id, codeType: 'membership', isSelfReferral: false } })`
   - Verify result: `directCommission === 20` (20% of 100), `isSelfReferral === false`, `creatorId === JON_CREATOR.id`
   - Verify commission_ledger INSERT was called with `commission_rate: 20`, `commission_amount: 20`
   - Verify affiliate_codes UPDATE (use_count increment) was called with JON_CODE.id

5. **Self-Referral Detection**
   - Same setup as #4 but with `customerEmail: 'teamjoncollins21@gmail.com'` (Jon's own email)
   - The club/orders route code detects self-referral by comparing `creator.email.toLowerCase() === normalizedEmail`
   - Test: When `processOrderAttribution` is called with `isSelfReferral: true`, it still creates the attribution and commission (the `isSelfReferral` flag is informational, stored in order_attributions but commission is still created)
   - Verify the `is_self_referral` value passed to INSERT query is `true`

6. **Dashboard Metrics (GET /api/creators/dashboard)**
   - Import the GET handler from `@/app/api/creators/dashboard/route`
   - Mock `verifyCreatorAuth` from `@/lib/auth` to return `{ authenticated: true, creatorId: JON_CREATOR.id }`
   - Mock `getCreatorById` to return JON_CREATOR
   - Mock `getCreatorDashboardStats` to return: `{ totalClicks: 15, totalOrders: 3, totalRevenue: 450, totalCommission: 90, pendingCommission: 90, thisMonthClicks: 5, thisMonthOrders: 1, thisMonthRevenue: 150, thisMonthCommission: 30 }`
   - Mock `getCommissionBreakdownByCreator` to return: `{ directMembership: 0, directProduct: 90, override: 0 }`
   - Create a mock NextRequest
   - Test: Response JSON `.metrics.totalClicks === 15`, `.metrics.totalOrders === 3`, `.metrics.totalRevenue === 450`, `.metrics.totalCommission === 90`
   - Test: `.metrics.conversionRate === 20` (3/15 * 100 = 20%)
   - Test: `.metrics.commissionRate === 20` (Jon's custom rate)
   - Test: `.creator.commission_rate === 20`

7. **Earnings Overview (GET /api/creators/earnings/overview)**
   - Import GET from `@/app/api/creators/earnings/overview/route`
   - Mock `verifyCreatorAuth` to return Jon's creatorId
   - Mock `getCommissionSummaryByCreator` to return `{ pending: 60, approved: 20, paid: 10, total: 90 }`
   - Mock `getCommissionTotalSince` to return 30 (this month), 20 (last month)
   - Mock `getCreatorOrderStats` to return `{ totalOrders: 3, totalRevenue: 450, totalCommission: 90 }`
   - Test: `.earnings.lifetimeEarnings === 90`, `.earnings.pendingEarnings === 80` (pending + approved)

8. **Earnings Orders (GET /api/creators/earnings/orders)**
   - Import GET from `@/app/api/creators/earnings/orders/route`
   - Mock `verifyCreatorAuth`
   - Mock `getOrderAttributionsByCreator` to return one attribution: `{ order_id: 'test-order-1', creator_id: JON_CREATOR.id, attribution_method: 'coupon_code', customer_email: 'buyer@example.com', net_revenue: 100, direct_commission_rate: 20, direct_commission_amount: 20, is_self_referral: false, status: 'pending' }`
   - Test: Response has 1 order, customer_email is redacted (starts with 'b***@'), `direct_commission_rate === 20`

9. **Earnings Ledger (GET /api/creators/earnings/ledger)**
   - Import GET from `@/app/api/creators/earnings/ledger/route`
   - Mock `verifyCreatorAuth`
   - Mock `getCommissionsByCreator` to return one entry: `{ commission_type: 'direct', commission_rate: 20, commission_amount: 20, base_amount: 100, beneficiary_creator_id: JON_CREATOR.id, status: 'pending' }`
   - Test: Response `.ledger[0].commission_type === 'direct'`, `.commission_rate === 20`, `.commission_amount === 20`

10. **Creator Codes API (GET /api/creators/codes)**
    - Import GET from `@/app/api/creators/codes/route`
    - Mock `verifyCreatorAuth`
    - Mock `getAffiliateCodesByCreator` to return `[JON_CODE]`
    - Test: Response `.codes[0].code === 'JON21'`, `.codes[0].discount_value === 20`

11. **Creator Links API (GET /api/creators/links)**
    - Import GET from `@/app/api/creators/links/route`
    - Mock `verifyCreatorAuth`
    - Mock `getTrackingLinksByCreator` to return `[{ ...JON_LINK, click_count: 15 }]`
    - Test: Response `.links[0].slug === 'joncollins441'`, `.links[0].click_count === 15`

12. **Admin Analytics**
    - Import GET from `@/app/api/admin/analytics/route` (if it exists and exports a testable handler)
    - If the admin analytics route is too coupled to auth/DB, test the DB query functions directly instead:
    - Mock `getCreatorOrderStats(JON_CREATOR.id)` to return `{ totalOrders: 3, totalRevenue: 450, totalCommission: 90 }`
    - Test: The returned stats include the creator's commission totals
    - Alternatively, verify `getCommissionBreakdownByCreator` returns correct breakdown

**Mock patterns:**
- Use `vi.mock('@/lib/creators/db')` at the top level
- Use `vi.mock('@/lib/auth')` for verifyCreatorAuth
- Use `vi.mock('@vercel/postgres')` for processOrderAttribution's transaction
- Use `vi.mock('resend')` to prevent email sends
- Import mocked functions with `vi.mocked()` or cast with `as jest.Mock` pattern
- Use `beforeEach(() => { vi.clearAllMocks() })` for clean state
- Create mock NextRequest objects with `new NextRequest('http://localhost:3000/api/...')`
- Parse responses with `const json = await response.json()`

**Fixture constants at top of file:**
- `JON_CREATOR_ID`, `JON_CODE_ID`, `JON_LINK_ID` as const strings
- `JON_CREATOR`, `JON_CODE`, `JON_LINK` as typed fixture objects matching the DB row shapes from `lib/config/affiliate.ts`

**Important implementation details:**
- `validateCouponUnified` in coupons.ts first checks CLUB_COUPONS (hardcoded), then calls `getAffiliateCodeByCode`. So the mock for `getAffiliateCodeByCode` only fires when the code is NOT in CLUB_COUPONS.
- `processOrderAttribution` uses `db.connect()` from `@vercel/postgres` (NOT the `sql` template tag) for transactions. Mock `db` accordingly.
- The dashboard route computes `conversionRate = Math.round((totalOrders / totalClicks) * 10000) / 100` — verify this formula.
- `processOrderAttribution` reads `creator.commission_rate` for the direct rate. Jon's is 20, not the default 10.
- The earnings overview route computes `pendingEarnings = commissionSummary.pending + commissionSummary.approved`.
- The earnings orders route uses `redactEmail` from attribution.ts which takes first char + '***@domain'.
  </action>
  <verify>
    <automated>cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && npx vitest run tests/integration/creator-e2e-jon-collins.test.ts</automated>
  </verify>
  <done>
All 12 test groups pass:
- JON21 validates with 20% discount, correct creator metadata
- Case-insensitive lookup works (jon21, Jon21, JON21)
- Click tracking creates event, increments count, returns attribution cookie
- Order attribution creates records with 20% commission rate
- Self-referral flag correctly set when emails match
- Dashboard returns correct metrics including commissionRate: 20 and conversionRate
- Earnings overview shows correct lifetime and pending earnings
- Earnings orders returns attributed order with redacted email
- Commission ledger shows direct commission at 20% rate
- Codes API returns JON21 with discount_value 20
- Links API returns joncollins441 with click_count
- Admin/creator stats return correct commission totals
  </done>
</task>

</tasks>

<verification>
```bash
cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && npx vitest run tests/integration/creator-e2e-jon-collins.test.ts --reporter=verbose
```
All test suites pass with 0 failures. Verify verbose output shows all 12 describe blocks with their individual test cases passing.
</verification>

<success_criteria>
- Single test file at tests/integration/creator-e2e-jon-collins.test.ts
- All tests pass via `npx vitest run`
- Tests cover all 12 scenarios from the requirements
- Mocks use Jon Collins' real DB values (creator ID, code ID, link ID, 20% rate)
- No actual database or network calls made during tests
</success_criteria>

<output>
After completion, create `.planning/quick/2-end-to-end-test-jon-collins-creator-acco/2-SUMMARY.md`
</output>
