// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockConnect = vi.fn()
const mockCookies = vi.fn()
const mockValidateCouponUnified = vi.fn()
const mockResolveAttribution = vi.fn()
const mockSyncContactToMailchimp = vi.fn()
const mockFormLimiterCheck = vi.fn()
const mockRateLimitResponse = vi.fn()

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

vi.mock('@/lib/rate-limit', () => ({
  formLimiter: {
    check: mockFormLimiterCheck,
  },
  rateLimitResponse: mockRateLimitResponse,
}))

describe('club orders catalog sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.POSTGRES_URL = 'postgres://test'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://cultrhealth.com'
    process.env.JWT_SECRET = 'test-jwt-secret'
    delete process.env.RESEND_API_KEY

    mockCookies.mockResolvedValue({
      get: vi.fn(),
    })
    mockValidateCouponUnified.mockResolvedValue(null)
    mockResolveAttribution.mockResolvedValue(null)
    mockSyncContactToMailchimp.mockResolvedValue(undefined)
    mockFormLimiterCheck.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
    mockRateLimitResponse.mockReturnValue(
      new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    )
  })

  it('rate limits club order submissions before touching inventory or the database', async () => {
    mockFormLimiterCheck.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 0 })

    const { POST } = await import('@/app/api/club/orders/route')

    const request = new Request('http://localhost:3000/api/club/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'semaglutide',
            name: 'Semaglutide',
            price: 299,
            quantity: 1,
          },
        ],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(mockConnect).not.toHaveBeenCalled()
    expect(mockSql).not.toHaveBeenCalled()
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
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

  it('rebuilds order items from the current join catalog and applies the first-purchase discount', async () => {
    mockSql.mockResolvedValue({
      rows: [{ count: 0 }],
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
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
    expect(insertedParams[6]).toBe(202.5)
    expect(insertedParams[10]).toBe('NEWCUSTOMER10')
    expect(insertedParams[11]).toBe(10)
    expect(insertedParams[16]).toBe(22.5)
  })

  it('does not apply the first-purchase discount when the customer already has an active order', async () => {
    mockSql.mockResolvedValue({
      rows: [{ count: 1 }],
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'semaglutide',
            name: 'Semaglutide — GLP1',
            price: 225,
            note: '5 MG | 3 ML · 2-3 month supply',
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
    const insertedParams = orderInsertCall?.[1] as unknown[]

    expect(insertedParams[6]).toBe(225)
    expect(insertedParams[10]).toBeNull()
    expect(insertedParams[11]).toBeNull()
    expect(insertedParams[16]).toBeNull()
  })

  it('rejects duplicate therapies in a club order payload', async () => {
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        items: [
          {
            therapyId: 'semaglutide',
            name: 'Semaglutide — GLP1',
            price: 225,
            note: '5 MG | 3 ML · 2-3 month supply',
            quantity: 1,
          },
          {
            therapyId: 'semaglutide',
            name: 'Semaglutide — GLP1',
            price: 225,
            note: '5 MG | 3 ML · 2-3 month supply',
            quantity: 2,
          },
        ],
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: 'Cart contains duplicate therapies. Please refresh your cart.',
    })
    expect(mockQuery).not.toHaveBeenCalled()
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
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

  it('rejects coupons when the cart only contains bacteriostatic water', async () => {
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

    mockValidateCouponUnified.mockResolvedValue({
      discount: 10,
      label: 'Promo Code',
      isCreatorCode: false,
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        couponCode: 'CULTR10',
        items: [
          {
            therapyId: 'bacteriostatic-water',
            name: 'Bacteriostatic Water',
            price: 29.99,
            note: '30 ML',
            quantity: 2,
          },
        ],
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: 'Coupons require another therapy in the cart. Bacteriostatic water alone is not eligible.',
    })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('does not stack coupon discounts with the ghk-cu and glutathione bundle', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          therapy_id: 'ghk-cu',
          therapy_name: 'GHK-CU',
          stock_status: 'in_stock',
          stock_quantity: null,
        },
        {
          therapy_id: 'glutathione',
          therapy_name: 'Glutathione',
          stock_status: 'in_stock',
          stock_quantity: null,
        },
      ],
    })

    mockValidateCouponUnified.mockResolvedValue({
      discount: 10,
      label: 'Promo Code',
      isCreatorCode: false,
      noBundleStack: false,
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
        return { rows: [{ therapy_name: 'Test', stock_quantity: 10 }], rowCount: 1 }
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
      headers: { 'content-type': 'application/json', host: 'cultrhealth.com' },
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member Example',
        couponCode: 'CULTR10',
        items: [
          {
            therapyId: 'ghk-cu',
            name: 'GHK-CU',
            price: 145,
            note: '100 MG | 3 ML',
            quantity: 1,
          },
          {
            therapyId: 'glutathione',
            name: 'Glutathione',
            price: 125,
            note: '200 MG | 10 ML',
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

    expect(Number(insertedParams[6])).toBe(243)
    expect(insertedParams[10]).toBe('CULTR10')
    expect(insertedParams[11]).toBe(10)
  })
})
