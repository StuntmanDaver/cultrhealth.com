// @vitest-environment node
//
// Real-DB integration test — hits the staging Neon database.
// No mocks. All test data is created in beforeAll and cleaned in afterAll.
//

// Load .env.local BEFORE any @vercel/postgres imports (needs POSTGRES_URL)
import { config } from 'dotenv'
config({ path: '.env.local' })

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql } from '@vercel/postgres'

// Source modules under test (no mocks)
import { resolveAttribution, serializeAttributionCookie } from '@/lib/creators/attribution'
import { processOrderAttribution } from '@/lib/creators/commission'
import { validateCouponUnified } from '@/lib/config/coupons'
import {
  getCreatorDashboardStats,
  getCommissionBreakdownByCreator,
  getAffiliateCodesByCreator,
} from '@/lib/creators/db'

// ============================================================
// TEST DATA — unique per run to avoid collisions
// ============================================================

const NONCE = Date.now().toString(36).slice(-6) // e.g., "1k3f2a"
const TEST_PREFIX = `E2E_${NONCE}`

// Creator emails (unique per run)
const CREATOR_EMAIL = `${TEST_PREFIX}_creator@test-e2e.cultrhealth.com`
const RECRUITER_EMAIL = `${TEST_PREFIX}_recruiter@test-e2e.cultrhealth.com`
const RECRUITED_EMAIL = `${TEST_PREFIX}_recruited@test-e2e.cultrhealth.com`
const PAUSED_EMAIL = `${TEST_PREFIX}_paused@test-e2e.cultrhealth.com`
const CUSTOMER_EMAIL = `${TEST_PREFIX}_customer@test-e2e.cultrhealth.com`

// Coupon codes (unique per run)
const CODE_MEMBERSHIP = `${TEST_PREFIX}MEM`
const CODE_PRODUCT = `${TEST_PREFIX}PRD`
const CODE_RECRUITED = `${TEST_PREFIX}REC`
const CODE_PAUSED = `${TEST_PREFIX}PAU`

// Order IDs (unique per run)
const ORDER_DIRECT = `${TEST_PREFIX}-ORD-DIRECT`
const ORDER_OVERRIDE = `${TEST_PREFIX}-ORD-OVERRIDE`
const ORDER_SELF = `${TEST_PREFIX}-ORD-SELF`
const ORDER_E2E_1 = `${TEST_PREFIX}-ORD-E2E1`
const ORDER_E2E_2 = `${TEST_PREFIX}-ORD-E2E2`

// Stored IDs (populated in beforeAll)
let creatorId: string
let recruiterId: string
let recruitedId: string
let pausedId: string
let codeMemId: string
let codePrdId: string
let codeRecId: string
let codePauId: string
let trackedLinkId: string
let trackedClickEventId: string

const CLICK_TOKEN = `${TEST_PREFIX}-CLICK`
const CLICK_SESSION_ID = `${TEST_PREFIX}-SESSION`

// Track initial code stats for delta assertions
let initialCodeMemUseCount: number
let initialCodeMemRevenue: number

// ============================================================
// SETUP — create real rows in staging DB
// ============================================================

beforeAll(async () => {
  // 1. Create recruiter (active, tier 1, override 10%)
  const recruiterResult = await sql`
    INSERT INTO creators (email, full_name, status, tier, override_rate, recruit_count, creator_start_date, created_at, updated_at)
    VALUES (
      ${RECRUITER_EMAIL}, ${`${TEST_PREFIX} Recruiter`}, 'active', 1, 10.00, 6,
      NOW() - INTERVAL '60 days', NOW(), NOW()
    )
    RETURNING id
  `
  recruiterId = recruiterResult.rows[0].id

  // 2. Create main test creator (active, no recruiter)
  const creatorResult = await sql`
    INSERT INTO creators (email, full_name, status, tier, override_rate, recruit_count, creator_start_date, created_at, updated_at)
    VALUES (
      ${CREATOR_EMAIL}, ${`${TEST_PREFIX} Creator`}, 'active', 0, 5.00, 0,
      NOW() - INTERVAL '30 days', NOW(), NOW()
    )
    RETURNING id
  `
  creatorId = creatorResult.rows[0].id

  // 3. Create recruited creator (active, recruited by recruiter)
  const recruitedResult = await sql`
    INSERT INTO creators (email, full_name, status, tier, override_rate, recruit_count, recruiter_id, creator_start_date, created_at, updated_at)
    VALUES (
      ${RECRUITED_EMAIL}, ${`${TEST_PREFIX} Recruited`}, 'active', 0, 5.00, 0,
      ${recruiterId}, NOW() - INTERVAL '15 days', NOW(), NOW()
    )
    RETURNING id
  `
  recruitedId = recruitedResult.rows[0].id

  // 4. Create paused creator
  const pausedResult = await sql`
    INSERT INTO creators (email, full_name, status, tier, override_rate, recruit_count, creator_start_date, created_at, updated_at)
    VALUES (
      ${PAUSED_EMAIL}, ${`${TEST_PREFIX} Paused`}, 'paused', 0, 5.00, 0,
      NOW() - INTERVAL '30 days', NOW(), NOW()
    )
    RETURNING id
  `
  pausedId = pausedResult.rows[0].id

  // 5. Create affiliate codes
  const codeMemResult = await sql`
    INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type, program_type, use_count, total_revenue, active, created_at, updated_at)
    VALUES (${creatorId}, ${CODE_MEMBERSHIP}, TRUE, 'percentage', 10.00, 'membership', 'creator', 0, 0.00, TRUE, NOW(), NOW())
    RETURNING id
  `
  codeMemId = codeMemResult.rows[0].id

  const codePrdResult = await sql`
    INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type, program_type, use_count, total_revenue, active, created_at, updated_at)
    VALUES (${creatorId}, ${CODE_PRODUCT}, FALSE, 'percentage', 10.00, 'product', 'creator', 0, 0.00, TRUE, NOW(), NOW())
    RETURNING id
  `
  codePrdId = codePrdResult.rows[0].id

  const codeRecResult = await sql`
    INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type, program_type, use_count, total_revenue, active, created_at, updated_at)
    VALUES (${recruitedId}, ${CODE_RECRUITED}, TRUE, 'percentage', 10.00, 'membership', 'creator', 0, 0.00, TRUE, NOW(), NOW())
    RETURNING id
  `
  codeRecId = codeRecResult.rows[0].id

  const codePauResult = await sql`
    INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type, program_type, use_count, total_revenue, active, created_at, updated_at)
    VALUES (${pausedId}, ${CODE_PAUSED}, TRUE, 'percentage', 10.00, 'membership', 'creator', 0, 0.00, TRUE, NOW(), NOW())
    RETURNING id
  `
  codePauId = codePauResult.rows[0].id

  const trackedLinkResult = await sql`
    INSERT INTO tracking_links (
      creator_id, slug, destination_path, utm_source, utm_medium, active, is_default, click_count, conversion_count, created_at, updated_at
    )
    VALUES (
      ${creatorId},
      ${`${TEST_PREFIX.toLowerCase()}-link`},
      '/',
      'creator',
      'referral',
      TRUE,
      FALSE,
      0,
      0,
      NOW(),
      NOW()
    )
    RETURNING id
  `
  trackedLinkId = trackedLinkResult.rows[0].id

  const trackedClickEventResult = await sql`
    INSERT INTO click_events (
      creator_id, link_id, session_id, attribution_token, clicked_at, expires_at, converted
    )
    VALUES (
      ${creatorId},
      ${trackedLinkId},
      ${CLICK_SESSION_ID},
      ${CLICK_TOKEN},
      NOW(),
      NOW() + INTERVAL '30 days',
      FALSE
    )
    RETURNING id
  `
  trackedClickEventId = trackedClickEventResult.rows[0].id

  // Record initial code stats
  initialCodeMemUseCount = 0
  initialCodeMemRevenue = 0
}, 30000) // 30s timeout for DB setup

// ============================================================
// TEARDOWN — remove all test data (child rows first)
// ============================================================

afterAll(async () => {
  const testIds = [creatorId, recruiterId, recruitedId, pausedId].filter(Boolean)
  if (testIds.length === 0) return

  try {
    // All child tables have ON DELETE CASCADE from creators(id),
    // but we delete explicitly for visibility and to handle cross-creator FKs
    // (e.g., override commission_ledger.beneficiary_creator_id = recruiter
    //  while order_attributions.creator_id = recruited creator)
    for (const id of testIds) {
      await sql`DELETE FROM commission_ledger WHERE beneficiary_creator_id = ${id}`
      await sql`
        DELETE FROM commission_ledger WHERE order_attribution_id IN (
          SELECT id FROM order_attributions WHERE creator_id = ${id}
        )
      `
      await sql`DELETE FROM order_attributions WHERE creator_id = ${id}`
      await sql`DELETE FROM click_events WHERE creator_id = ${id}`
      await sql`DELETE FROM tracking_links WHERE creator_id = ${id}`
      await sql`DELETE FROM affiliate_codes WHERE creator_id = ${id}`
      await sql`DELETE FROM creator_customer_portfolio WHERE creator_id = ${id}`
    }
    // Delete creators last (parent table)
    for (const id of testIds) {
      await sql`DELETE FROM creators WHERE id = ${id}`
    }
  } catch (err) {
    console.error('E2E cleanup failed:', err)
  }
}, 30000)

// ============================================================
// SUITE A: Coupon Validation Against Real DB
// ============================================================

describe('coupon validation — real DB', () => {
  it('A1: active creator code returns isCreatorCode=true with correct details', async () => {
    const result = await validateCouponUnified(CODE_MEMBERSHIP)

    expect(result).not.toBeNull()
    expect(result!.isCreatorCode).toBe(true)
    expect(result!.creatorId).toBe(creatorId)
    expect(result!.codeId).toBe(codeMemId)
    expect(Number(result!.discount)).toBe(10)
    expect(result!.codeType).toBe('membership')
  })

  it('A2: paused creator code returns isCreatorCode=false (discount honored)', async () => {
    const result = await validateCouponUnified(CODE_PAUSED)

    expect(result).not.toBeNull()
    expect(result!.isCreatorCode).toBe(false)
    expect(Number(result!.discount)).toBe(10)
  })

  it('A3: staff coupon skips DB entirely', async () => {
    const result = await validateCouponUnified('CULTRSTAFF')

    expect(result).not.toBeNull()
    expect(result!.isCreatorCode).toBe(false)
    expect(result!.discount).toBe(30)
    expect(result!.creatorId).toBeUndefined()
  })
})

// ============================================================
// SUITE B: Attribution Resolution Against Real DB
// ============================================================

describe('attribution resolution — real DB', () => {
  it('B1: coupon code resolves to correct creator', async () => {
    const result = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_MEMBERSHIP,
    })

    expect(result).not.toBeNull()
    expect(result!.creatorId).toBe(creatorId)
    expect(result!.method).toBe('coupon_code')
    expect(result!.codeId).toBe(codeMemId)
    expect(result!.codeType).toBe('membership')
    expect(result!.isSelfReferral).toBe(false)
  })

  it('B2: self-referral detected when creator email matches customer', async () => {
    const result = await resolveAttribution({
      customerEmail: CREATOR_EMAIL,
      couponCode: CODE_MEMBERSHIP,
    })

    expect(result).not.toBeNull()
    expect(result!.isSelfReferral).toBe(true)
    expect(result!.creatorId).toBe(creatorId)
  })

  it('B3: paused creator code returns null (no attribution)', async () => {
    const result = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_PAUSED,
    })

    expect(result).toBeNull()
  })

  it('B4: coupon attribution preserves tracked click metadata when a code and click cookie are both present', async () => {
    const attributionCookie = serializeAttributionCookie({
      token: CLICK_TOKEN,
      creatorId,
      linkId: trackedLinkId,
      expiresAt: Date.now() + 60_000,
    })

    const result = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_MEMBERSHIP,
      attributionCookie,
    })

    expect(result).not.toBeNull()
    expect(result!.creatorId).toBe(creatorId)
    expect(result!.method).toBe('coupon_code')
    expect(result!.codeId).toBe(codeMemId)
    expect(result!.linkId).toBe(trackedLinkId)
    expect(result!.clickEventId).toBe(trackedClickEventId)
  })
})

// ============================================================
// SUITE C: Commission Processing — Real Transactions
// ============================================================

describe('commission processing — real DB transactions', () => {
  it('C1: direct commission (no recruiter) — creates attribution + ledger + updates code', async () => {
    const attribution = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_MEMBERSHIP,
    })
    expect(attribution).not.toBeNull()

    const result = await processOrderAttribution({
      orderId: ORDER_DIRECT,
      netRevenue: 199,
      customerEmail: CUSTOMER_EMAIL,
      attribution: attribution!,
    })

    expect(result).not.toBeNull()
    expect(result!.directCommission).toBe(19.90)
    expect(result!.overrideCommission).toBe(0)
    expect(result!.totalCommission).toBe(19.90)
    expect(result!.isSelfReferral).toBe(false)
    expect(result!.creatorId).toBe(creatorId)
    expect(result!.recruiterId).toBeUndefined()

    // Verify order_attributions row in DB
    const attrRow = await sql`
      SELECT * FROM order_attributions WHERE order_id = ${ORDER_DIRECT}
    `
    expect(attrRow.rows).toHaveLength(1)
    expect(attrRow.rows[0].creator_id).toBe(creatorId)
    expect(attrRow.rows[0].attribution_method).toBe('coupon_code')
    expect(parseFloat(attrRow.rows[0].net_revenue)).toBe(199)
    expect(parseFloat(attrRow.rows[0].direct_commission_amount)).toBe(19.90)
    expect(attrRow.rows[0].code_id).toBe(codeMemId)
    expect(attrRow.rows[0].is_self_referral).toBe(false)

    // Verify commission_ledger entry
    const ledger = await sql`
      SELECT * FROM commission_ledger WHERE order_attribution_id = ${attrRow.rows[0].id}
    `
    expect(ledger.rows.length).toBeGreaterThanOrEqual(1)
    const directEntry = ledger.rows.find((r: Record<string, unknown>) => r.commission_type === 'direct')
    expect(directEntry).toBeDefined()
    expect(directEntry.beneficiary_creator_id).toBe(creatorId)
    expect(parseFloat(directEntry.commission_amount)).toBe(19.90)
    expect(parseFloat(directEntry.commission_rate)).toBe(10.00)
    expect(directEntry.status).toBe('pending')

    // Verify affiliate_codes.use_count and total_revenue updated
    const codeRow = await sql`
      SELECT use_count, total_revenue FROM affiliate_codes WHERE id = ${codeMemId}
    `
    expect(parseInt(codeRow.rows[0].use_count)).toBe(initialCodeMemUseCount + 1)
    expect(parseFloat(codeRow.rows[0].total_revenue)).toBe(initialCodeMemRevenue + 199)

    // Update tracked state for subsequent tests
    initialCodeMemUseCount = parseInt(codeRow.rows[0].use_count)
    initialCodeMemRevenue = parseFloat(codeRow.rows[0].total_revenue)
  })

  it('C2: override commission — recruiter gets override, creator gets direct', async () => {
    const attribution = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_RECRUITED,
    })
    expect(attribution).not.toBeNull()
    expect(attribution!.creatorId).toBe(recruitedId)

    const result = await processOrderAttribution({
      orderId: ORDER_OVERRIDE,
      netRevenue: 499,
      customerEmail: CUSTOMER_EMAIL,
      attribution: attribution!,
    })

    expect(result).not.toBeNull()
    // Direct: 499 * 10% = 49.90
    expect(result!.directCommission).toBe(49.90)
    // Override: 499 * 10% = 49.90 (recruiter is tier 1 with 10% override, cap=25% allows it)
    expect(result!.overrideCommission).toBe(49.90)
    expect(result!.totalCommission).toBe(99.80)
    expect(result!.creatorId).toBe(recruitedId)
    expect(result!.recruiterId).toBe(recruiterId)

    // Verify two commission_ledger entries
    const attrRow = await sql`
      SELECT id FROM order_attributions WHERE order_id = ${ORDER_OVERRIDE}
    `
    const ledger = await sql`
      SELECT * FROM commission_ledger WHERE order_attribution_id = ${attrRow.rows[0].id}
      ORDER BY commission_type
    `
    expect(ledger.rows).toHaveLength(2)

    // Direct entry → beneficiary is the recruited creator
    const directEntry = ledger.rows.find((r: Record<string, unknown>) => r.commission_type === 'direct')
    expect(directEntry).toBeDefined()
    expect(directEntry.beneficiary_creator_id).toBe(recruitedId)
    expect(parseFloat(directEntry.commission_amount)).toBe(49.90)

    // Override entry → beneficiary is the recruiter
    const overrideEntry = ledger.rows.find((r: Record<string, unknown>) => r.commission_type === 'override')
    expect(overrideEntry).toBeDefined()
    expect(overrideEntry.beneficiary_creator_id).toBe(recruiterId)
    expect(overrideEntry.source_creator_id).toBe(recruitedId)
    expect(parseFloat(overrideEntry.commission_amount)).toBe(49.90)
    expect(overrideEntry.tier_level).toBe(1)
  })

  it('C3: self-referral records correctly with is_self_referral=true', async () => {
    const attribution = await resolveAttribution({
      customerEmail: CREATOR_EMAIL,
      couponCode: CODE_MEMBERSHIP,
    })
    expect(attribution).not.toBeNull()
    expect(attribution!.isSelfReferral).toBe(true)

    const result = await processOrderAttribution({
      orderId: ORDER_SELF,
      netRevenue: 199,
      customerEmail: CREATOR_EMAIL,
      attribution: attribution!,
    })

    expect(result).not.toBeNull()
    expect(result!.isSelfReferral).toBe(true)
    expect(result!.directCommission).toBe(0) // self-referrals blocked from commission
    expect(result!.totalCommission).toBe(0)

    // Verify is_self_referral in DB
    const attrRow = await sql`
      SELECT is_self_referral FROM order_attributions WHERE order_id = ${ORDER_SELF}
    `
    expect(attrRow.rows[0].is_self_referral).toBe(true)
  })
})

// ============================================================
// SUITE D: Dashboard Stats Reflect Real Data
// ============================================================

describe('dashboard stats — real DB after commissions', () => {
  it('D1: getCreatorDashboardStats reflects test orders and commissions', async () => {
    const stats = await getCreatorDashboardStats(creatorId)

    // We created at least 2 orders (ORDER_DIRECT + ORDER_SELF) for this creator
    expect(stats.totalOrders).toBeGreaterThanOrEqual(2)
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(398) // 199 + 199
    expect(stats.totalCommission).toBeGreaterThanOrEqual(19.80) // 19.90 from ORDER_DIRECT only (ORDER_SELF is self-referral, no commission)
    expect(stats.pendingCommission).toBeGreaterThanOrEqual(19.80)

    // Verify numeric types
    expect(typeof stats.totalClicks).toBe('number')
    expect(typeof stats.totalOrders).toBe('number')
    expect(typeof stats.totalRevenue).toBe('number')
    expect(typeof stats.totalCommission).toBe('number')
    expect(typeof stats.pendingCommission).toBe('number')
    expect(typeof stats.thisMonthClicks).toBe('number')
    expect(typeof stats.thisMonthOrders).toBe('number')
    expect(typeof stats.thisMonthRevenue).toBe('number')
    expect(typeof stats.thisMonthCommission).toBe('number')
  })

  it('D2: getCommissionBreakdownByCreator returns product commissions', async () => {
    const breakdown = await getCommissionBreakdownByCreator(creatorId)

    // Our test orders were non-subscription → directProduct
    // ORDER_SELF is a self-referral (no commission), so only ORDER_DIRECT's 19.90 counts
    expect(breakdown.directProduct).toBeGreaterThanOrEqual(19.80)
    expect(typeof breakdown.directMembership).toBe('number')
    expect(typeof breakdown.directProduct).toBe('number')
    expect(typeof breakdown.override).toBe('number')
  })

  it('D3: getAffiliateCodesByCreator shows updated use_count and total_revenue', async () => {
    const codes = await getAffiliateCodesByCreator(creatorId)

    expect(codes.length).toBeGreaterThanOrEqual(2) // membership + product codes

    const memCode = codes.find(c => c.code === CODE_MEMBERSHIP)
    expect(memCode).toBeDefined()
    // We processed 2 orders with this code (ORDER_DIRECT + ORDER_SELF)
    expect(memCode!.use_count).toBeGreaterThanOrEqual(2)
    expect(parseFloat(String(memCode!.total_revenue))).toBeGreaterThanOrEqual(398)
  })
})

// ============================================================
// SUITE E: Full End-to-End Chain
// ============================================================

describe('full end-to-end chain — validate → resolve → process → verify', () => {
  it('E1: complete flow with creator coupon', async () => {
    // Step 1: Validate coupon
    const coupon = await validateCouponUnified(CODE_PRODUCT)
    expect(coupon).not.toBeNull()
    expect(coupon!.isCreatorCode).toBe(true)
    expect(coupon!.creatorId).toBe(creatorId)

    // Step 2: Resolve attribution
    const attribution = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_PRODUCT,
    })
    expect(attribution).not.toBeNull()
    expect(attribution!.creatorId).toBe(creatorId)
    expect(attribution!.method).toBe('coupon_code')

    // Step 3: Process commission
    const result = await processOrderAttribution({
      orderId: ORDER_E2E_1,
      netRevenue: 150,
      customerEmail: CUSTOMER_EMAIL,
      attribution: attribution!,
    })
    expect(result).not.toBeNull()
    expect(result!.directCommission).toBe(15.00)

    // Step 4: Verify dashboard stats include this order
    const stats = await getCreatorDashboardStats(creatorId)
    expect(stats.totalOrders).toBeGreaterThanOrEqual(3) // ORDER_DIRECT + ORDER_SELF + ORDER_E2E_1

    // Step 5: Verify code stats
    const codes = await getAffiliateCodesByCreator(creatorId)
    const prdCode = codes.find(c => c.code === CODE_PRODUCT)
    expect(prdCode).toBeDefined()
    expect(prdCode!.use_count).toBeGreaterThanOrEqual(1)
    expect(parseFloat(String(prdCode!.total_revenue))).toBeGreaterThanOrEqual(150)
  })

  it('E2: complete flow with recruited creator — override appears in recruiter stats', async () => {
    // Step 1: Validate + resolve
    const coupon = await validateCouponUnified(CODE_RECRUITED)
    expect(coupon!.isCreatorCode).toBe(true)

    const attribution = await resolveAttribution({
      customerEmail: CUSTOMER_EMAIL,
      couponCode: CODE_RECRUITED,
    })
    expect(attribution).not.toBeNull()

    // Step 2: Process
    const result = await processOrderAttribution({
      orderId: ORDER_E2E_2,
      netRevenue: 299,
      customerEmail: CUSTOMER_EMAIL,
      attribution: attribution!,
    })
    expect(result).not.toBeNull()
    expect(result!.directCommission).toBe(29.90) // 299 * 10%
    expect(result!.overrideCommission).toBe(29.90) // 299 * 10% (Alice's tier 1 rate)
    expect(result!.recruiterId).toBe(recruiterId)

    // Step 3: Verify recruiter's dashboard shows override earnings
    const recruiterBreakdown = await getCommissionBreakdownByCreator(recruiterId)
    expect(recruiterBreakdown.override).toBeGreaterThanOrEqual(79.80) // 49.90 (from C2) + 29.90 (this test)

    // Step 4: Recruited creator's dashboard shows direct earnings
    const recruitedStats = await getCreatorDashboardStats(recruitedId)
    expect(recruitedStats.totalOrders).toBeGreaterThanOrEqual(2) // ORDER_OVERRIDE + ORDER_E2E_2
    expect(recruitedStats.totalCommission).toBeGreaterThanOrEqual(79.80) // 49.90 + 29.90
  })
})
