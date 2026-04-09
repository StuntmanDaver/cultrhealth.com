// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockGetSession = vi.fn()
const mockIsProviderEmail = vi.fn()
const mockGetOrderAttributionByOrderId = vi.fn()
const mockReverseCommissionsForAttribution = vi.fn()
const mockRestoreCommissionsForAttribution = vi.fn()
const mockUpdateOrderAttributionStatus = vi.fn()
const mockResendSend = vi.fn()

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

vi.mock('resend', () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: mockResendSend,
      },
    }
  }),
}))

function createStatusRouteSqlMock(currentStatus: string, nextStatus: string) {
  mockSql.mockImplementation(async (queryParts: TemplateStringsArray | string[]) => {
    const query = queryParts.join(' ')

    if (query.includes('FROM club_orders WHERE id =')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            order_number: 'CLB-TEST-STATUS',
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
            order_number: 'CLB-TEST-STATUS',
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

describe('admin club order status suppressEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.POSTGRES_URL = 'postgres://test'
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.JWT_SECRET = 'test-jwt-secret'

    mockGetSession.mockResolvedValue({ email: 'ops@example.com' })
    mockIsProviderEmail.mockReturnValue(false)
    mockGetOrderAttributionByOrderId.mockResolvedValue(null)
    mockReverseCommissionsForAttribution.mockResolvedValue(0)
    mockRestoreCommissionsForAttribution.mockResolvedValue(0)
    mockUpdateOrderAttributionStatus.mockResolvedValue(true)
    mockResendSend.mockResolvedValue({ id: 'email_123' })
  })

  it('does not send status emails when suppressEmails is true', async () => {
    createStatusRouteSqlMock('approved', 'paid')

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/status/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'paid', suppressEmails: true }),
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('still attempts status emails when suppressEmails is omitted', async () => {
    createStatusRouteSqlMock('approved', 'paid')

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/status/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockResendSend).toHaveBeenCalled()
  })
})
