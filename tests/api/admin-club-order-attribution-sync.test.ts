// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockGetSession = vi.fn()
const mockIsProviderEmail = vi.fn()
const mockGetOrderAttributionByOrderId = vi.fn()
const mockReverseCommissionsForAttribution = vi.fn()
const mockRestoreCommissionsForAttribution = vi.fn()
const mockUpdateOrderAttributionStatus = vi.fn()

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/auth', () => ({
  getSession: mockGetSession,
  isProviderEmail: mockIsProviderEmail,
}))

vi.mock('@/lib/creators/db', () => ({
  getOrderAttributionByOrderId: mockGetOrderAttributionByOrderId,
  reverseCommissionsForAttribution: mockReverseCommissionsForAttribution,
  restoreCommissionsForAttribution: mockRestoreCommissionsForAttribution,
  updateOrderAttributionStatus: mockUpdateOrderAttributionStatus,
}))

function createStatusRouteSqlMock(currentStatus: string, nextStatus: string) {
  mockSql.mockImplementation(async (queryParts: TemplateStringsArray | string[]) => {
    const query = queryParts.join(' ')

    if (query.includes('FROM club_orders WHERE id =')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            order_number: 'CLB-TEST-123',
            member_name: 'Member Example',
            member_email: 'member@example.com',
            status: currentStatus,
            items: [],
            subtotal_usd: 225,
            tracking_carrier: null,
            tracking_number: null,
            tracking_url: null,
          },
        ],
        rowCount: 1,
      }
    }

    if (query.includes('UPDATE club_orders')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            order_number: 'CLB-TEST-123',
            status: nextStatus,
          },
        ],
        rowCount: 1,
      }
    }

    if (query.includes('INSERT INTO admin_actions')) {
      return { rows: [], rowCount: 1 }
    }

    return { rows: [], rowCount: 0 }
  })
}

describe('admin club order attribution sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.POSTGRES_URL = 'postgres://test'
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    delete process.env.RESEND_API_KEY

    mockGetSession.mockResolvedValue({ email: 'ops@example.com' })
    mockIsProviderEmail.mockReturnValue(false)
    mockReverseCommissionsForAttribution.mockResolvedValue(1)
    mockRestoreCommissionsForAttribution.mockResolvedValue(1)
    mockUpdateOrderAttributionStatus.mockResolvedValue(true)
  })

  it('reverses linked attribution records when a club order is cancelled', async () => {
    createStatusRouteSqlMock('approved', 'cancelled')
    mockGetOrderAttributionByOrderId.mockResolvedValue({
      id: 'attr_cancelled_1',
      status: 'pending',
    })

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/status/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockGetOrderAttributionByOrderId).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
    expect(mockReverseCommissionsForAttribution).toHaveBeenCalledWith('attr_cancelled_1')
    expect(mockUpdateOrderAttributionStatus).toHaveBeenCalledWith('attr_cancelled_1', 'refunded')
    expect(mockRestoreCommissionsForAttribution).not.toHaveBeenCalled()
  })

  it('restores linked attribution records when a cancelled club order is reopened', async () => {
    createStatusRouteSqlMock('cancelled', 'approved')
    mockGetOrderAttributionByOrderId.mockResolvedValue({
      id: 'attr_reopened_1',
      status: 'refunded',
    })

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/status/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockGetOrderAttributionByOrderId).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
    expect(mockRestoreCommissionsForAttribution).toHaveBeenCalledWith('attr_reopened_1')
    expect(mockUpdateOrderAttributionStatus).toHaveBeenCalledWith('attr_reopened_1', 'pending')
    expect(mockReverseCommissionsForAttribution).not.toHaveBeenCalled()
  })

  it('reverses linked attribution records when a club order is dismissed', async () => {
    mockSql.mockResolvedValue({
      rows: [{ id: '11111111-1111-1111-1111-111111111111', order_number: 'CLB-TEST-123' }],
      rowCount: 1,
    })
    mockGetOrderAttributionByOrderId.mockResolvedValue({
      id: 'attr_dismissed_1',
      status: 'pending',
    })

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/dismiss/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/dismiss', {
        method: 'POST',
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockGetOrderAttributionByOrderId).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
    expect(mockReverseCommissionsForAttribution).toHaveBeenCalledWith('attr_dismissed_1')
    expect(mockUpdateOrderAttributionStatus).toHaveBeenCalledWith('attr_dismissed_1', 'refunded')
  })
})
