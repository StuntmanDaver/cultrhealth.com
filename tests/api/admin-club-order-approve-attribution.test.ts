// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockSql,
  mockDbConnect,
  mockGetSession,
  mockIsProviderEmail,
  mockGetAccessToken,
  mockGetCreatorById,
  mockCalculateOverrideCommission,
  mockInsertCommissionLedgerEntries,
} = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockDbConnect: vi.fn(),
  mockGetSession: vi.fn(),
  mockIsProviderEmail: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockGetCreatorById: vi.fn(),
  mockCalculateOverrideCommission: vi.fn(),
  mockInsertCommissionLedgerEntries: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
  db: {
    connect: mockDbConnect,
  },
}))

vi.mock('@/lib/auth', () => ({
  getSession: mockGetSession,
  isProviderEmail: mockIsProviderEmail,
}))

vi.mock('@/lib/quickbooks', () => ({
  getAccessToken: mockGetAccessToken,
  findOrCreateCustomer: vi.fn(),
  createInvoice: vi.fn(),
  sendInvoice: vi.fn(),
  getInvoiceLink: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  escapeHtml: (value: string) => value,
  brandedEmailHeader: () => '',
  brandedEmailFooter: () => '',
  EMAIL_FONT_IMPORT: '',
}))

vi.mock('@/lib/creators/db', () => ({
  getCreatorById: mockGetCreatorById,
}))

vi.mock('@/lib/creators/commission', () => ({
  calculateOverrideCommission: mockCalculateOverrideCommission,
  insertCommissionLedgerEntries: mockInsertCommissionLedgerEntries,
}))

function createPgClient(attrUpdateRows: Array<{ id: string }> = [{ id: 'attr_placeholder_1' }]) {
  const query = vi.fn(async (queryText: string) => {
    if (queryText === 'BEGIN' || queryText === 'COMMIT' || queryText === 'ROLLBACK') {
      return { rows: [], rowCount: 0 }
    }

    if (queryText.includes('UPDATE order_attributions')) {
      return { rows: attrUpdateRows, rowCount: attrUpdateRows.length }
    }

    if (queryText.includes('UPDATE affiliate_codes')) {
      return { rows: [], rowCount: 1 }
    }

    throw new Error(`Unexpected pg client query: ${queryText}`)
  })

  return {
    query,
    release: vi.fn(),
  }
}

function createOrderSqlMock() {
  mockSql.mockImplementation(async (queryParts: TemplateStringsArray | string[]) => {
    const query = queryParts.join(' ')

    if (query.includes('FROM club_orders')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            order_number: 'CLB-TEST-123',
            member_name: 'Member Example',
            member_email: 'member@example.com',
            member_phone: null,
            items: [
              {
                therapyId: 'semaglutide',
                name: 'Semaglutide',
                quantity: 1,
                price: null,
              },
            ],
            subtotal_usd: 225,
            status: 'pending_approval',
            coupon_code: 'JON21',
            discount_percent: 10,
            tax_rate: 0,
            tax_amount_usd: 0,
            attributed_creator_id: 'creator_123',
            attribution_method: 'coupon_code',
          },
        ],
        rowCount: 1,
      }
    }

    if (query.includes('UPDATE club_orders')) {
      return { rows: [], rowCount: 1 }
    }

    return { rows: [], rowCount: 0 }
  })
}

describe('admin club order approval attribution sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.POSTGRES_URL = 'postgres://test'
    process.env.ADMIN_ALLOWED_EMAILS = 'ops@example.com'
    process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS = ''
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
    delete process.env.RESEND_API_KEY

    mockGetSession.mockResolvedValue({ email: 'ops@example.com' })
    mockIsProviderEmail.mockReturnValue(false)
    mockGetAccessToken.mockResolvedValue(null)
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_123',
      commission_rate: 20,
    })
    mockCalculateOverrideCommission.mockResolvedValue(null)
    mockInsertCommissionLedgerEntries.mockResolvedValue({
      directCommission: 45,
      overrideCommission: 0,
    })
  })

  it('upgrades a zero-revenue placeholder attribution into real ledger entries on approval', async () => {
    createOrderSqlMock()
    const pgClient = createPgClient([{ id: 'attr_placeholder_1' }])
    mockDbConnect.mockResolvedValue(pgClient)

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/approve/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/approve', {
        method: 'POST',
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockInsertCommissionLedgerEntries).toHaveBeenCalledTimes(1)
    expect(mockInsertCommissionLedgerEntries).toHaveBeenCalledWith(
      pgClient,
      'attr_placeholder_1',
      'creator_123',
      225,
      20,
      45,
      null
    )
  })

  it('does not insert duplicate commission entries when the placeholder attribution was already upgraded', async () => {
    createOrderSqlMock()
    const pgClient = createPgClient([])
    mockDbConnect.mockResolvedValue(pgClient)

    const { POST } = await import('@/app/api/admin/club-orders/[orderId]/approve/route')
    const response = await POST(
      new Request('http://localhost:3000/api/admin/club-orders/11111111-1111-1111-1111-111111111111/approve', {
        method: 'POST',
      }),
      { params: Promise.resolve({ orderId: '11111111-1111-1111-1111-111111111111' }) }
    )

    expect(response.status).toBe(200)
    expect(mockInsertCommissionLedgerEntries).not.toHaveBeenCalled()
  })
})
