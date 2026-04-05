// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockConnect = vi.fn()
const mockCookies = vi.fn()
const mockValidateCouponUnified = vi.fn()
const mockResolveAttribution = vi.fn()
const mockSyncContactToMailchimp = vi.fn()

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
  db: {
    connect: mockConnect,
  },
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

vi.mock('@/lib/config/coupons', () => ({
  validateCouponUnified: mockValidateCouponUnified,
}))

vi.mock('@/lib/creators/attribution', () => ({
  resolveAttribution: mockResolveAttribution,
}))

vi.mock('@/lib/mailchimp', () => ({
  syncContactToMailchimp: mockSyncContactToMailchimp,
}))

describe('club orders catalog sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.POSTGRES_URL = 'postgres://test'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://join.cultrhealth.com'
    process.env.JWT_SECRET = 'test-jwt-secret'
    delete process.env.RESEND_API_KEY

    mockCookies.mockResolvedValue({
      get: vi.fn(),
    })
    mockValidateCouponUnified.mockResolvedValue(null)
    mockResolveAttribution.mockResolvedValue(null)
    mockSyncContactToMailchimp.mockResolvedValue(undefined)
  })

  it('rejects therapies that are no longer in the current join catalog', async () => {
    mockSql.mockResolvedValue({
      rows: [],
    })

    const mockQuery = vi.fn(async (query: string) => {
      if (query === 'BEGIN' || query === 'COMMIT') {
        return { rows: [] }
      }

      if (query.includes('INSERT INTO club_members')) {
        return { rows: [{ id: 'member_1' }] }
      }

      if (query.includes('INSERT INTO club_orders')) {
        return { rows: [{ id: 'order_1' }] }
      }

      if (query.includes('UPDATE product_inventory')) {
        return { rows: [] }
      }

      throw new Error(`Unexpected query: ${query}`)
    })

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: vi.fn(),
    })

    const { POST } = await import('@/app/api/club/orders/route')

    const request = new Request('http://localhost:3000/api/club/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'join.cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'pt-141',
            name: 'PT-141 (Bremelanotide)',
            price: 6.5,
            quantity: 1,
          },
        ],
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: 'One or more selected therapies are no longer available. Please refresh your cart.',
    })
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('rebuilds order items from the current join catalog before saving totals', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          therapy_id: 'semaglutide',
          therapy_name: 'Semaglutide — GLP1',
          stock_status: 'in_stock',
          stock_quantity: null,
        },
      ],
    })

    const mockQuery = vi.fn(async (query: string, params?: unknown[]) => {
      if (query === 'BEGIN' || query === 'COMMIT') {
        return { rows: [] }
      }

      if (query.includes('INSERT INTO club_members')) {
        return { rows: [{ id: 'member_1' }] }
      }

      if (query.includes('INSERT INTO club_orders')) {
        return { rows: [{ id: 'order_1' }] }
      }

      if (query.includes('UPDATE product_inventory')) {
        return { rows: [] }
      }

      throw new Error(`Unexpected query: ${query}`)
    })

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: vi.fn(),
    })

    const { POST } = await import('@/app/api/club/orders/route')

    const request = new Request('http://localhost:3000/api/club/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'join.cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'semaglutide',
            name: 'Semaglutide/Pyridoxine (reconstituted)',
            price: 104,
            note: '2.5–5 mg/mL | 1–5 mL',
            quantity: 1,
          },
        ],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)

    const orderInsertCall = mockQuery.mock.calls.find(
      ([query]) => typeof query === 'string' && query.includes('INSERT INTO club_orders')
    )

    expect(orderInsertCall).toBeDefined()

    const insertedParams = orderInsertCall?.[1] as unknown[]
    const insertedItems = JSON.parse(String(insertedParams[5]))

    expect(insertedItems).toEqual([
      {
        therapyId: 'semaglutide',
        name: 'Semaglutide — GLP1',
        price: 225,
        note: '5 MG | 3 ML · 2-3 month supply',
        quantity: 1,
      },
    ])
    expect(insertedParams[6]).toBe(225)
  })

  it('accepts bac water orders using the restored join catalog pricing and notes', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          therapy_id: 'bacteriostatic-water',
          therapy_name: 'Bacteriostatic Water',
          stock_status: 'in_stock',
          stock_quantity: 12,
        },
      ],
    })

    const mockQuery = vi.fn(async (query: string) => {
      if (query === 'BEGIN' || query === 'COMMIT') {
        return { rows: [] }
      }

      if (query.includes('INSERT INTO club_members')) {
        return { rows: [{ id: 'member_1' }] }
      }

      if (query.includes('INSERT INTO club_orders')) {
        return { rows: [{ id: 'order_1' }] }
      }

      if (query.includes('UPDATE product_inventory')) {
        return { rows: [] }
      }

      throw new Error(`Unexpected query: ${query}`)
    })

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: vi.fn(),
    })

    const { POST } = await import('@/app/api/club/orders/route')

    const request = new Request('http://localhost:3000/api/club/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'join.cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'bacteriostatic-water',
            name: 'Legacy Bac Water',
            price: 999,
            note: 'Wrong note',
            quantity: 4,
          },
        ],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)

    const orderInsertCall = mockQuery.mock.calls.find(
      ([query]) => typeof query === 'string' && query.includes('INSERT INTO club_orders')
    )

    expect(orderInsertCall).toBeDefined()

    const insertedParams = orderInsertCall?.[1] as unknown[]
    const insertedItems = JSON.parse(String(insertedParams[5]))

    expect(insertedItems).toEqual([
      {
        therapyId: 'bacteriostatic-water',
        name: 'Bacteriostatic Water',
        price: 29.99,
        note: '30 ML',
        quantity: 4,
      },
    ])
    expect(Number(insertedParams[6])).toBeCloseTo(119.96, 2)
  })
})
