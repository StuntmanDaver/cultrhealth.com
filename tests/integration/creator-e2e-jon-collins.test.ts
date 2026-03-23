import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================
// MOCKS -- must be declared before any source imports
// ============================================================

// Mock the transaction client used by commission.ts (db.connect())
const mockQuery = vi.fn()
const mockRelease = vi.fn()
const mockClient = { query: mockQuery, release: mockRelease }

vi.mock('@vercel/postgres', () => ({
  sql: vi.fn(),
  db: {
    connect: vi.fn(() => Promise.resolve(mockClient)),
  },
}))

// Mock all db.ts exports so attribution.ts + coupons.ts get controlled values
vi.mock('@/lib/creators/db', () => ({
  getAffiliateCodeByCode: vi.fn(),
  getCreatorById: vi.fn(),
  getPortfolioEntry: vi.fn(),
  getClickEventByToken: vi.fn(),
  getOrderAttributionByOrderId: vi.fn(),
  reverseCommissionsForAttribution: vi.fn(),
  updateOrderAttributionStatus: vi.fn(),
  updateCreatorRecruitCount: vi.fn(),
  updateCreatorTier: vi.fn(),
  getAllActiveCreators: vi.fn(),
  updateCreatorActiveMemberCount: vi.fn(),
  getCreatorDashboardStats: vi.fn(),
  getCommissionBreakdownByCreator: vi.fn(),
  getCreatorLinkStats: vi.fn(),
  getCreatorEarningsTrend: vi.fn(),
  getCommissionSummaryByCreator: vi.fn(),
  getCreatorOrderStats: vi.fn(),
  getCommissionTotalSince: vi.fn(),
  getAffiliateCodesByCreator: vi.fn(),
  getOrderAttributionsByCreator: vi.fn(),
  getCommissionsByCreator: vi.fn(),
  incrementCodeUsage: vi.fn(),
  getTrackingLinkBySlug: vi.fn(),
  getTrackingLinksByCreator: vi.fn(),
  incrementLinkClickCount: vi.fn(),
  createClickEvent: vi.fn(),
  markClickConverted: vi.fn(),
}))

// Mock auth for API route tests
vi.mock('@/lib/auth', () => ({
  verifyCreatorAuth: vi.fn(),
  verifyAuth: vi.fn(),
  getLibraryAccess: vi.fn(),
  hasFeatureAccess: vi.fn(),
}))

// Mock resend to prevent email sends
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }) },
  })),
}))

// ============================================================
// IMPORTS (after mocks are hoisted)
// ============================================================

import { validateCouponUnified } from '@/lib/config/coupons'
import { handleClickTracking } from '@/lib/creators/attribution'
import { processOrderAttribution } from '@/lib/creators/commission'
import * as creatorDb from '@/lib/creators/db'
import { verifyCreatorAuth } from '@/lib/auth'

// ============================================================
// JON COLLINS FIXTURE DATA (real DB values)
// ============================================================

const JON_CREATOR_ID = 'b08b9042-0c0f-44e0-806c-b1be2a8ce9bb'
const JON_CODE_ID = '25d9ce4c-30a7-447f-a240-20620c025185'
const JON_LINK_ID = '2dd0f39d-17a7-46b7-a3da-e4ac82b95114'
const MOCK_ATTR_VALUE = 'mock-attribution-abc123' // test fixture

const JON_CREATOR = {
  id: JON_CREATOR_ID,
  email: 'teamjoncollins21@gmail.com',
  full_name: 'Jon Collins',
  status: 'active' as const,
  commission_rate: 20.00,
  tier: 0,
  override_rate: 5.00,
  recruit_count: 0,
  active_member_count: 0,
  recruiter_id: null,
  email_verified: true,
  creator_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

const JON_CODE = {
  id: JON_CODE_ID,
  creator_id: JON_CREATOR_ID,
  code: 'JON21',
  code_type: 'membership' as const,
  discount_type: 'percentage' as const,
  discount_value: 20,
  is_primary: true,
  use_count: 0,
  total_revenue: 0,
  active: true,
  program_type: 'creator' as const,
  max_uses: null,
  created_by_admin: false,
  stripe_coupon_id: null,
  stripe_promotion_code_id: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

const JON_LINK = {
  id: JON_LINK_ID,
  creator_id: JON_CREATOR_ID,
  slug: 'joncollins441',
  destination_path: '/',
  utm_source: 'creator',
  utm_medium: 'referral',
  utm_campaign: undefined,
  click_count: 0,
  conversion_count: 0,
  active: true,
  is_default: true,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

// ============================================================
// HELPER: mock getAffiliateCodeByCode case-insensitively
// ============================================================

function setupCodeMock() {
  vi.mocked(creatorDb.getAffiliateCodeByCode).mockImplementation(
    async (code: string) => {
      if (code.toUpperCase() === 'JON21') return JON_CODE as never
      return null as never
    }
  )
}

function setupCreatorMock() {
  vi.mocked(creatorDb.getCreatorById).mockImplementation(
    async (id: string) => {
      if (id === JON_CREATOR_ID) return JON_CREATOR as never
      return null as never
    }
  )
}

// ============================================================
// TESTS
// ============================================================

describe('Jon Collins Creator E2E Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    mockRelease.mockReset()
  })

  // ----------------------------------------------------------
  // 1. Coupon Validation
  // ----------------------------------------------------------
  describe('1. Coupon Validation (validateCouponUnified)', () => {
    beforeEach(() => {
      setupCodeMock()
      setupCreatorMock()
    })

    it('validates JON21 with 20% discount and correct creator metadata', async () => {
      const result = await validateCouponUnified('JON21')

      expect(result).not.toBeNull()
      expect(result!.discount).toBe(20)
      expect(result!.label).toBe("Jon Collins's Code")
      expect(result!.isCreatorCode).toBe(true)
      expect(result!.creatorId).toBe(JON_CREATOR_ID)
      expect(result!.creatorName).toBe('Jon Collins')
      expect(result!.codeId).toBe(JON_CODE_ID)
      expect(result!.codeType).toBe('membership')
    })

    it('returns null for invalid code', async () => {
      const result = await validateCouponUnified('INVALID999')
      expect(result).toBeNull()
    })

    it('returns isCreatorCode: false for staff code CULTRSTAFF (no DB call)', async () => {
      const result = await validateCouponUnified('CULTRSTAFF')

      expect(result).not.toBeNull()
      expect(result!.discount).toBe(30)
      expect(result!.isCreatorCode).toBe(false)
      // Staff codes are hardcoded -- no DB call for affiliate code
      expect(creatorDb.getAffiliateCodeByCode).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------
  // 2. Case Insensitivity
  // ----------------------------------------------------------
  describe('2. Case Insensitivity', () => {
    beforeEach(() => {
      setupCodeMock()
      setupCreatorMock()
    })

    it('validates jon21 (lowercase) same as JON21', async () => {
      const result = await validateCouponUnified('jon21')

      expect(result).not.toBeNull()
      expect(result!.discount).toBe(20)
      expect(result!.isCreatorCode).toBe(true)
      expect(result!.creatorId).toBe(JON_CREATOR_ID)
    })

    it('validates Jon21 (mixed case) same as JON21', async () => {
      const result = await validateCouponUnified('Jon21')

      expect(result).not.toBeNull()
      expect(result!.discount).toBe(20)
      expect(result!.isCreatorCode).toBe(true)
      expect(result!.creatorId).toBe(JON_CREATOR_ID)
    })
  })

  // ----------------------------------------------------------
  // 3. Click Tracking
  // ----------------------------------------------------------
  describe('3. Click Tracking (handleClickTracking)', () => {
    beforeEach(() => {
      setupCreatorMock()
      vi.mocked(creatorDb.getTrackingLinkBySlug).mockImplementation(
        async (slug: string) => {
          if (slug === 'joncollins441') return JON_LINK as never
          return null as never
        }
      )
      vi.mocked(creatorDb.createClickEvent).mockResolvedValue({
        id: 'click-event-001',
        creator_id: JON_CREATOR_ID,
        link_id: JON_LINK_ID,
        session_id: 'test-session',
        attribution_token: MOCK_ATTR_VALUE,
        clicked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        converted: false,
      } as never)
      vi.mocked(creatorDb.incrementLinkClickCount).mockResolvedValue(undefined as never)
    })

    it('returns success with correct cookie data for joncollins441', async () => {
      const result = await handleClickTracking({
        slug: 'joncollins441',
        ip: '1.2.3.4',
        userAgent: 'TestBot/1.0',
      })

      expect(result.success).toBe(true)
      expect(result.cookieData).toBeDefined()
      expect(result.cookieData!.creatorId).toBe(JON_CREATOR_ID)
      expect(result.cookieData!.linkId).toBe(JON_LINK_ID)

      // Verify expiresAt is roughly 30 days from now (within 5 seconds tolerance)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
      const expectedExpiry = Date.now() + thirtyDaysMs
      expect(result.cookieData!.expiresAt).toBeGreaterThan(expectedExpiry - 5000)
      expect(result.cookieData!.expiresAt).toBeLessThan(expectedExpiry + 5000)
    })

    it('creates click event with correct creator and link IDs', async () => {
      await handleClickTracking({
        slug: 'joncollins441',
        ip: '1.2.3.4',
        userAgent: 'TestBot/1.0',
      })

      expect(creatorDb.createClickEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_id: JON_CREATOR_ID,
          link_id: JON_LINK_ID,
        })
      )
    })

    it('increments link click count for JON_LINK', async () => {
      await handleClickTracking({
        slug: 'joncollins441',
        ip: '1.2.3.4',
        userAgent: 'TestBot/1.0',
      })

      expect(creatorDb.incrementLinkClickCount).toHaveBeenCalledWith(JON_LINK_ID)
    })

    it('returns failure for unknown slug', async () => {
      const result = await handleClickTracking({
        slug: 'nonexistent-slug',
        ip: '1.2.3.4',
        userAgent: 'TestBot/1.0',
      })

      expect(result.success).toBe(false)
    })
  })

  // ----------------------------------------------------------
  // 4. Order Attribution with Coupon
  // ----------------------------------------------------------
  describe('4. Order Attribution (processOrderAttribution)', () => {
    beforeEach(() => {
      setupCreatorMock()
      vi.mocked(creatorDb.getPortfolioEntry).mockResolvedValue(null as never)

      // Mock transaction queries
      mockQuery.mockImplementation(async (queryText: string) => {
        if (queryText === 'BEGIN' || queryText === 'COMMIT' || queryText === 'ROLLBACK') {
          return { rows: [] }
        }
        if (queryText.includes('INSERT INTO order_attributions')) {
          return { rows: [{ id: 'test-attr-id' }] }
        }
        if (queryText.includes('INSERT INTO commission_ledger')) {
          return { rows: [] }
        }
        if (queryText.includes('UPDATE affiliate_codes')) {
          return { rows: [] }
        }
        if (queryText.includes('UPDATE tracking_links')) {
          return { rows: [] }
        }
        if (queryText.includes('UPDATE click_events')) {
          return { rows: [] }
        }
        return { rows: [] }
      })
    })

    it('creates attribution with 20% commission (Jon custom rate)', async () => {
      const result = await processOrderAttribution({
        orderId: 'test-order-1',
        netRevenue: 100,
        customerEmail: 'buyer@example.com',
        attribution: {
          creatorId: JON_CREATOR_ID,
          method: 'coupon_code',
          codeId: JON_CODE_ID,
          codeType: 'membership',
          isSelfReferral: false,
        },
      })

      expect(result).not.toBeNull()
      expect(result!.directCommission).toBe(20) // 20% of 100
      expect(result!.isSelfReferral).toBe(false)
      expect(result!.creatorId).toBe(JON_CREATOR_ID)
    })

    it('inserts commission_ledger with rate=20 and amount=20', async () => {
      await processOrderAttribution({
        orderId: 'test-order-2',
        netRevenue: 100,
        customerEmail: 'buyer@example.com',
        attribution: {
          creatorId: JON_CREATOR_ID,
          method: 'coupon_code',
          codeId: JON_CODE_ID,
          codeType: 'membership',
          isSelfReferral: false,
        },
      })

      // Find the commission_ledger INSERT call
      const ledgerCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO commission_ledger')
      )
      expect(ledgerCall).toBeDefined()

      // Verify params: [attributionId, creatorId, netRevenue, directRate, directAmount]
      const params = ledgerCall![1]
      expect(params[1]).toBe(JON_CREATOR_ID) // beneficiary_creator_id
      expect(params[3]).toBe(20) // commission_rate (Jon's custom 20%)
      expect(params[4]).toBe(20) // commission_amount (20% of 100)
    })

    it('updates affiliate_codes use_count with correct code ID', async () => {
      await processOrderAttribution({
        orderId: 'test-order-3',
        netRevenue: 100,
        customerEmail: 'buyer@example.com',
        attribution: {
          creatorId: JON_CREATOR_ID,
          method: 'coupon_code',
          codeId: JON_CODE_ID,
          codeType: 'membership',
          isSelfReferral: false,
        },
      })

      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('UPDATE affiliate_codes')
      )
      expect(updateCall).toBeDefined()
      expect(updateCall![1]).toContain(JON_CODE_ID)
    })
  })

  // ----------------------------------------------------------
  // 5. Self-Referral Detection
  // ----------------------------------------------------------
  describe('5. Self-Referral Detection', () => {
    beforeEach(() => {
      setupCreatorMock()
      vi.mocked(creatorDb.getPortfolioEntry).mockResolvedValue(null as never)

      mockQuery.mockImplementation(async (queryText: string) => {
        if (queryText === 'BEGIN' || queryText === 'COMMIT' || queryText === 'ROLLBACK') {
          return { rows: [] }
        }
        if (queryText.includes('INSERT INTO order_attributions')) {
          return { rows: [{ id: 'test-attr-self' }] }
        }
        return { rows: [] }
      })
    })

    it('passes isSelfReferral=true to INSERT when emails match', async () => {
      const result = await processOrderAttribution({
        orderId: 'test-order-self',
        netRevenue: 100,
        customerEmail: 'teamjoncollins21@gmail.com',
        attribution: {
          creatorId: JON_CREATOR_ID,
          method: 'coupon_code',
          codeId: JON_CODE_ID,
          codeType: 'membership',
          isSelfReferral: true,
        },
      })

      expect(result).not.toBeNull()

      // Verify is_self_referral was passed as true to the INSERT query
      const attrCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO order_attributions')
      )
      expect(attrCall).toBeDefined()
      // is_self_referral is param index 10 in the VALUES clause
      expect(attrCall![1][10]).toBe(true)
    })

    it('still creates attribution and commission for self-referral', async () => {
      const result = await processOrderAttribution({
        orderId: 'test-order-self-2',
        netRevenue: 200,
        customerEmail: 'teamjoncollins21@gmail.com',
        attribution: {
          creatorId: JON_CREATOR_ID,
          method: 'coupon_code',
          codeId: JON_CODE_ID,
          codeType: 'membership',
          isSelfReferral: true,
        },
      })

      expect(result).not.toBeNull()
      expect(result!.directCommission).toBe(40) // 20% of 200
      expect(result!.isSelfReferral).toBe(true)
      expect(result!.creatorId).toBe(JON_CREATOR_ID)
    })
  })

  // ----------------------------------------------------------
  // 6. Dashboard Metrics
  // ----------------------------------------------------------
  describe('6. Dashboard Metrics (GET /api/creators/dashboard)', () => {
    beforeEach(() => {
      setupCreatorMock()
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getCreatorDashboardStats).mockResolvedValue({
        totalClicks: 15,
        totalOrders: 3,
        totalRevenue: 450,
        totalCommission: 90,
        pendingCommission: 90,
        thisMonthClicks: 5,
        thisMonthOrders: 1,
        thisMonthRevenue: 150,
        thisMonthCommission: 30,
      } as never)

      vi.mocked(creatorDb.getCommissionBreakdownByCreator).mockResolvedValue({
        directMembership: 0,
        directProduct: 90,
        override: 0,
      } as never)

      vi.mocked(creatorDb.getCreatorLinkStats).mockResolvedValue([
        { id: JON_LINK_ID, slug: 'joncollins441', destinationPath: '/', clickCount: 15, conversionCount: 3, conversionRate: 20.0 },
      ])

      vi.mocked(creatorDb.getCreatorEarningsTrend).mockResolvedValue({
        thisMonth: 30,
        lastMonth: 0,
      })
    })

    it('returns correct metrics with commissionRate=20 and conversionRate=20', async () => {
      const { GET } = await import('@/app/api/creators/dashboard/route')
      const request = new NextRequest('http://localhost:3000/api/creators/dashboard')
      const response = await GET(request)
      const json = await response.json()

      expect(json.metrics.totalClicks).toBe(15)
      expect(json.metrics.totalOrders).toBe(3)
      expect(json.metrics.totalRevenue).toBe(450)
      expect(json.metrics.totalCommission).toBe(90)
      // conversionRate = Math.round((3/15) * 10000) / 100 = 20
      expect(json.metrics.conversionRate).toBe(20)
      // Jon's custom commission rate
      expect(json.metrics.commissionRate).toBe(20)
    })

    it('returns creator info with commission_rate=20', async () => {
      const { GET } = await import('@/app/api/creators/dashboard/route')
      const request = new NextRequest('http://localhost:3000/api/creators/dashboard')
      const response = await GET(request)
      const json = await response.json()

      expect(json.creator.commission_rate).toBe(20)
      expect(json.creator.full_name).toBe('Jon Collins')
    })
  })

  // ----------------------------------------------------------
  // 7. Earnings Overview
  // ----------------------------------------------------------
  describe('7. Earnings Overview (GET /api/creators/earnings/overview)', () => {
    beforeEach(() => {
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getCommissionSummaryByCreator).mockResolvedValue({
        pending: 60,
        approved: 20,
        paid: 10,
        total: 90,
      } as never)

      vi.mocked(creatorDb.getCommissionTotalSince).mockImplementation(
        async (_creatorId: string, since: Date, until?: Date) => {
          // This month
          if (!until) return 30 as never
          // Last month
          return 20 as never
        }
      )

      vi.mocked(creatorDb.getCreatorOrderStats).mockResolvedValue({
        totalOrders: 3,
        totalRevenue: 450,
        totalCommission: 90,
      } as never)
    })

    it('returns correct lifetimeEarnings and pendingEarnings', async () => {
      const { GET } = await import('@/app/api/creators/earnings/overview/route')
      const request = new NextRequest('http://localhost:3000/api/creators/earnings/overview')
      const response = await GET(request)
      const json = await response.json()

      expect(json.earnings.lifetimeEarnings).toBe(90)
      // pendingEarnings = pending(60) + approved(20) = 80
      expect(json.earnings.pendingEarnings).toBe(80)
      expect(json.earnings.paidEarnings).toBe(10)
      expect(json.earnings.thisMonthEarnings).toBe(30)
      expect(json.earnings.lastMonthEarnings).toBe(20)
    })
  })

  // ----------------------------------------------------------
  // 8. Earnings Orders
  // ----------------------------------------------------------
  describe('8. Earnings Orders (GET /api/creators/earnings/orders)', () => {
    beforeEach(() => {
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getOrderAttributionsByCreator).mockResolvedValue([
        {
          id: 'attr-001',
          order_id: 'test-order-1',
          creator_id: JON_CREATOR_ID,
          attribution_method: 'coupon_code',
          code_id: JON_CODE_ID,
          customer_email: 'buyer@example.com',
          net_revenue: 100,
          direct_commission_rate: 20,
          direct_commission_amount: 20,
          is_self_referral: false,
          is_subscription: false,
          status: 'pending',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
        },
      ] as never)
    })

    it('returns attributed order with redacted email and correct commission', async () => {
      const { GET } = await import('@/app/api/creators/earnings/orders/route')
      const request = new NextRequest('http://localhost:3000/api/creators/earnings/orders')
      const response = await GET(request)
      const json = await response.json()

      expect(json.orders).toHaveLength(1)
      // redactEmail('buyer@example.com') => 'b***@example.com'
      expect(json.orders[0].customer_email).toBe('b***@example.com')
      expect(json.orders[0].direct_commission_rate).toBe(20)
      expect(json.orders[0].direct_commission_amount).toBe(20)
      expect(json.orders[0].is_self_referral).toBe(false)
    })
  })

  // ----------------------------------------------------------
  // 9. Earnings Ledger
  // ----------------------------------------------------------
  describe('9. Earnings Ledger (GET /api/creators/earnings/ledger)', () => {
    beforeEach(() => {
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getCommissionsByCreator).mockResolvedValue([
        {
          id: 'comm-001',
          order_attribution_id: 'attr-001',
          beneficiary_creator_id: JON_CREATOR_ID,
          commission_type: 'direct',
          base_amount: 100,
          commission_rate: 20,
          commission_amount: 20,
          tier_level: 0,
          status: 'pending',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
        },
      ] as never)
    })

    it('returns commission ledger with type=direct, rate=20, amount=20', async () => {
      const { GET } = await import('@/app/api/creators/earnings/ledger/route')
      const request = new NextRequest('http://localhost:3000/api/creators/earnings/ledger')
      const response = await GET(request)
      const json = await response.json()

      expect(json.ledger).toHaveLength(1)
      expect(json.ledger[0].commission_type).toBe('direct')
      expect(json.ledger[0].commission_rate).toBe(20)
      expect(json.ledger[0].commission_amount).toBe(20)
      expect(json.ledger[0].beneficiary_creator_id).toBe(JON_CREATOR_ID)
    })
  })

  // ----------------------------------------------------------
  // 10. Creator Codes API
  // ----------------------------------------------------------
  describe('10. Creator Codes API (GET /api/creators/codes)', () => {
    beforeEach(() => {
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getAffiliateCodesByCreator).mockResolvedValue([JON_CODE] as never)
    })

    it('returns JON21 with discount_value=20', async () => {
      const { GET } = await import('@/app/api/creators/codes/route')
      const request = new NextRequest('http://localhost:3000/api/creators/codes')
      const response = await GET(request)
      const json = await response.json()

      expect(json.codes).toHaveLength(1)
      expect(json.codes[0].code).toBe('JON21')
      expect(json.codes[0].discount_value).toBe(20)
      expect(json.codes[0].code_type).toBe('membership')
      expect(json.codes[0].is_primary).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // 11. Creator Links API
  // ----------------------------------------------------------
  describe('11. Creator Links API (GET /api/creators/links)', () => {
    beforeEach(() => {
      vi.mocked(verifyCreatorAuth).mockResolvedValue({
        authenticated: true,
        email: JON_CREATOR.email,
        creatorId: JON_CREATOR_ID,
      } as never)

      vi.mocked(creatorDb.getTrackingLinksByCreator).mockResolvedValue([
        { ...JON_LINK, click_count: 15 },
      ] as never)
    })

    it('returns joncollins441 link with click_count=15', async () => {
      const { GET } = await import('@/app/api/creators/links/route')
      const request = new NextRequest('http://localhost:3000/api/creators/links')
      const response = await GET(request)
      const json = await response.json()

      expect(json.links).toHaveLength(1)
      expect(json.links[0].slug).toBe('joncollins441')
      expect(json.links[0].click_count).toBe(15)
      expect(json.links[0].is_default).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // 12. Admin Analytics (creator stats)
  // ----------------------------------------------------------
  describe('12. Admin Analytics (creator stats)', () => {
    beforeEach(() => {
      setupCreatorMock()

      vi.mocked(creatorDb.getCreatorOrderStats).mockResolvedValue({
        totalOrders: 3,
        totalRevenue: 450,
        totalCommission: 90,
      } as never)

      vi.mocked(creatorDb.getCommissionBreakdownByCreator).mockResolvedValue({
        directMembership: 0,
        directProduct: 90,
        override: 0,
      } as never)
    })

    it('getCreatorOrderStats returns correct commission totals', async () => {
      const stats = await creatorDb.getCreatorOrderStats(JON_CREATOR_ID)

      expect(stats.totalOrders).toBe(3)
      expect(stats.totalRevenue).toBe(450)
      expect(stats.totalCommission).toBe(90)
    })

    it('getCommissionBreakdownByCreator returns correct breakdown', async () => {
      const breakdown = await creatorDb.getCommissionBreakdownByCreator(JON_CREATOR_ID)

      expect(breakdown.directMembership).toBe(0)
      expect(breakdown.directProduct).toBe(90)
      expect(breakdown.override).toBe(0)
    })

    it('confirms Jon creator exists with correct id and rate', async () => {
      const creator = await creatorDb.getCreatorById(JON_CREATOR_ID)

      expect(creator).not.toBeNull()
      expect(creator!.id).toBe(JON_CREATOR_ID)
      expect(creator!.commission_rate).toBe(20)
      expect(creator!.full_name).toBe('Jon Collins')
    })
  })
})
