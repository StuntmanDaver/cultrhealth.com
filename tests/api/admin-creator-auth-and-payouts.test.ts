// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetCreatorByEmail = vi.fn()
const mockGetCreatorById = vi.fn()
const mockGetPayoutsByCreator = vi.fn()
const mockGetCommissionSummaryByCreator = vi.fn()
const mockGetCreatorDashboardStats = vi.fn()
const mockGetCommissionBreakdownByCreator = vi.fn()
const mockGetCreatorLinkStats = vi.fn()
const mockGetCreatorEarningsTrend = vi.fn()
const mockGetAllActiveCreators = vi.fn()
const mockGetApprovedCommissionsForPayout = vi.fn()
const mockCreatePayout = vi.fn()
const mockUpdateCommissionStatus = vi.fn()
const mockUpdatePayoutStatus = vi.fn()
const mockMarkCommissionsPaidForPayout = vi.fn()
const mockCreateAdminAction = vi.fn()

vi.mock('@/lib/creators/db', () => ({
  getCreatorByEmail: mockGetCreatorByEmail,
  getCreatorById: mockGetCreatorById,
  getPayoutsByCreator: mockGetPayoutsByCreator,
  getCommissionSummaryByCreator: mockGetCommissionSummaryByCreator,
  getCreatorDashboardStats: mockGetCreatorDashboardStats,
  getCommissionBreakdownByCreator: mockGetCommissionBreakdownByCreator,
  getCreatorLinkStats: mockGetCreatorLinkStats,
  getCreatorEarningsTrend: mockGetCreatorEarningsTrend,
  getAllActiveCreators: mockGetAllActiveCreators,
  getApprovedCommissionsForPayout: mockGetApprovedCommissionsForPayout,
  createPayout: mockCreatePayout,
  updateCommissionStatus: mockUpdateCommissionStatus,
  updatePayoutStatus: mockUpdatePayoutStatus,
  markCommissionsPaidForPayout: mockMarkCommissionsPaidForPayout,
  createAdminAction: mockCreateAdminAction,
}))

import {
  createSessionToken,
  verifyAdminAuth,
  verifyCreatorAuth,
} from '@/lib/auth'

function createAuthenticatedRequest(
  token: string,
  path: string,
  init?: { method?: string; body?: string; headers?: Record<string, string> }
): NextRequest {
  const request = new NextRequest(`http://localhost:3000${path}`, {
    method: init?.method || 'GET',
    body: init?.body,
    headers: init?.headers,
  })
  request.cookies.set('cultr_session', token)
  return request
}

describe('creator/admin auth parity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    process.env.STAGING_ACCESS_EMAILS = ''
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
  })

  it('accepts admin emails from ADMIN_ALLOWED_EMAILS in verifyAdminAuth', async () => {
    const token = await createSessionToken('ops@example.com', 'customer_1', undefined, 'member')
    const request = createAuthenticatedRequest(token, '/api/admin/creators/add')

    const result = await verifyAdminAuth(request)

    expect(result).toEqual({
      authenticated: true,
      email: 'ops@example.com',
    })
  })

  it('resolves staging_creator sessions to the real creator id by email', async () => {
    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_real_123',
      email: 'ops@example.com',
      status: 'active',
    })

    const token = await createSessionToken(
      'ops@example.com',
      'creator_customer',
      'staging_creator',
      'creator'
    )
    const request = createAuthenticatedRequest(token, '/api/creators/dashboard')

    const result = await verifyCreatorAuth(request)

    expect(mockGetCreatorByEmail).toHaveBeenCalledWith('ops@example.com')
    expect(result).toEqual({
      authenticated: true,
      email: 'ops@example.com',
      creatorId: 'creator_real_123',
    })
  })

  it('rejects real creator sessions when the creator is not active', async () => {
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_real_123',
      email: 'ops@example.com',
      status: 'pending',
    })

    const token = await createSessionToken(
      'ops@example.com',
      'creator_pending',
      'creator_real_123',
      'creator'
    )
    const request = createAuthenticatedRequest(token, '/api/creators/dashboard')

    const result = await verifyCreatorAuth(request)

    expect(mockGetCreatorById).toHaveBeenCalledWith('creator_real_123')
    expect(result).toEqual({
      authenticated: false,
      email: 'ops@example.com',
      creatorId: null,
    })
  })
})

describe('creator routes honor resolved staging creators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_ALLOWED_EMAILS = ''
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    process.env.STAGING_ACCESS_EMAILS = ''
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'

    mockGetCreatorByEmail.mockResolvedValue({
      id: 'creator_real_123',
      email: 'creator@example.com',
      status: 'active',
      payout_method: 'paypal',
      full_name: 'Creator Example',
      tier: 1,
      override_rate: 5,
      recruit_count: 2,
      active_member_count: 3,
      commission_rate: 10,
      creator_start_date: '2026-03-01T00:00:00.000Z',
    })
    mockGetCreatorById.mockImplementation(async (creatorId: string) => {
      if (creatorId === 'creator_real_123') {
        return {
          id: 'creator_real_123',
          email: 'creator@example.com',
          status: 'active',
          payout_method: 'paypal',
          full_name: 'Creator Example',
          tier: 1,
          override_rate: 5,
          recruit_count: 2,
          active_member_count: 3,
          commission_rate: 10,
          creator_start_date: '2026-03-01T00:00:00.000Z',
        }
      }

      return null
    })
    mockGetPayoutsByCreator.mockImplementation(async (creatorId: string) => {
      if (creatorId !== 'creator_real_123') {
        throw new Error(`unexpected creator id: ${creatorId}`)
      }

      return [
        {
          id: 'payout_1',
          creator_id: creatorId,
          amount: 75,
          status: 'completed',
        },
      ]
    })
    mockGetCommissionSummaryByCreator.mockImplementation(async (creatorId: string) => {
      if (creatorId !== 'creator_real_123') {
        throw new Error(`unexpected creator id: ${creatorId}`)
      }

      return {
        pending: 25,
        approved: 50,
        paid: 75,
        total: 150,
      }
    })
    mockGetCreatorDashboardStats.mockImplementation(async (creatorId: string) => {
      if (creatorId !== 'creator_real_123') {
        throw new Error(`unexpected creator id: ${creatorId}`)
      }

      return {
        totalClicks: 10,
        totalOrders: 2,
        totalRevenue: 300,
        totalCommission: 30,
        pendingCommission: 20,
        thisMonthClicks: 3,
        thisMonthOrders: 1,
        thisMonthRevenue: 150,
        thisMonthCommission: 15,
      }
    })
    mockGetCommissionBreakdownByCreator.mockResolvedValue({
      directMembership: 15,
      directProduct: 15,
      override: 0,
    })
    mockGetCreatorLinkStats.mockResolvedValue([])
    mockGetCreatorEarningsTrend.mockResolvedValue({
      thisMonth: 15,
      lastMonth: 15,
    })
  })

  it('returns creator payouts for a staging_creator session', async () => {
    const token = await createSessionToken(
      'creator@example.com',
      'creator_customer',
      'staging_creator',
      'creator'
    )
    const request = createAuthenticatedRequest(token, '/api/creators/payouts')
    const { GET } = await import('@/app/api/creators/payouts/route')

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockGetPayoutsByCreator).toHaveBeenCalledWith('creator_real_123')
    expect(body.payoutMethod).toBe('paypal')
    expect(body.pendingBalance).toBe(50)
    expect(body.holdBalance).toBe(25)
  })

  it('returns dashboard metrics for a staging_creator session', async () => {
    const token = await createSessionToken(
      'creator@example.com',
      'creator_customer',
      'staging_creator',
      'creator'
    )
    const request = createAuthenticatedRequest(token, '/api/creators/dashboard')
    const { GET } = await import('@/app/api/creators/dashboard/route')

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockGetCreatorDashboardStats).toHaveBeenCalledWith('creator_real_123')
    expect(body.creator.id).toBe('creator_real_123')
    expect(body.metrics.commissionRate).toBe(10)
  })
})

describe('admin payout batching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    process.env.STAGING_ACCESS_EMAILS = ''
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'

    mockGetAllActiveCreators.mockResolvedValue([
      {
        id: 'creator_real_123',
        full_name: 'Creator Example',
        payout_method: 'paypal',
      },
    ])
    mockGetApprovedCommissionsForPayout.mockResolvedValue([
      {
        id: 'commission_1',
        commission_amount: 60,
      },
    ])
    mockCreatePayout.mockResolvedValue({
      id: 'payout_123',
    })
    mockUpdateCommissionStatus.mockResolvedValue(true)
    mockUpdatePayoutStatus.mockResolvedValue(true)
    mockMarkCommissionsPaidForPayout.mockResolvedValue(1)
    mockCreateAdminAction.mockResolvedValue(undefined)
  })

  it('filters commissions by period and advances payout records through processing to completed', async () => {
    const token = await createSessionToken('ops@example.com', 'customer_1', undefined, 'member')
    const request = createAuthenticatedRequest(token, '/api/admin/creators/payouts/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period_start: '2026-03-01',
        period_end: '2026-03-31',
      }),
    })
    const { POST } = await import('@/app/api/admin/creators/payouts/batch/route')

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockGetApprovedCommissionsForPayout).toHaveBeenCalledWith('creator_real_123', {
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
    })
    expect(mockUpdatePayoutStatus).toHaveBeenNthCalledWith(1, 'payout_123', 'processing')
    expect(mockMarkCommissionsPaidForPayout).toHaveBeenCalledWith(['commission_1'], 'payout_123')
    expect(mockUpdatePayoutStatus).toHaveBeenNthCalledWith(2, 'payout_123', 'completed')
  })
})
