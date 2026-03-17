import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: vi.fn(),
}))
vi.mock('@/lib/siphox/db', () => ({
  getSiphoxCustomerByPhone: vi.fn(),
  getKitOrdersByCustomer: vi.fn(),
  updateKitOrderStatus: vi.fn(),
}))
vi.mock('@/lib/siphox/client', () => ({
  registerKit: vi.fn(),
}))

import { GET } from '@/app/api/portal/labs/route'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getSiphoxCustomerByPhone, getKitOrdersByCustomer } from '@/lib/siphox/db'

const mockVerify = verifyPortalAuth as ReturnType<typeof vi.fn>
const mockGetCustomer = getSiphoxCustomerByPhone as ReturnType<typeof vi.fn>
const mockGetOrders = getKitOrdersByCustomer as ReturnType<typeof vi.fn>

function makeRequest(method = 'GET') {
  return new NextRequest('http://localhost:3000/api/portal/labs', { method })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/portal/labs', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockVerify.mockResolvedValue({ authenticated: false, phone: null, asherPatientId: null })

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })

  it('returns empty array when no SiPhox customer exists', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })
    mockGetCustomer.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.kitOrders).toEqual([])
    expect(data.siphoxCustomerId).toBeNull()
    expect(data.tier).toBeNull()
  })

  it('returns kit orders with lifecycle state', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: 1 })
    mockGetCustomer.mockResolvedValue({
      id: '1',
      phone_e164: '+13525551234',
      siphox_customer_id: 'siphox-cust-1',
    })
    mockGetOrders.mockResolvedValue([
      {
        id: '1',
        siphox_customer_id: 'siphox-cust-1',
        siphox_order_id: 'order-1',
        kit_type: 'basic_panel',
        quantity: 1,
        status: 'ordered',
        tracking_number: 'TRACK123',
        fulfillment_status: 'fulfilled',
        plan_tier: 'catalyst',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.kitOrders).toHaveLength(1)
    expect(data.kitOrders[0].lifecycleState).toBe('shipped')
    expect(data.siphoxCustomerId).toBe('siphox-cust-1')
    expect(data.tier).toBe('catalyst')
  })
})
