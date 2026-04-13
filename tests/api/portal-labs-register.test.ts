import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

import { POST } from '@/app/api/portal/labs/route'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getSiphoxCustomerByPhone, getKitOrdersByCustomer, updateKitOrderStatus } from '@/lib/siphox/db'
import { registerKit } from '@/lib/siphox/client'

const mockVerify = verifyPortalAuth as ReturnType<typeof vi.fn>
const mockGetCustomer = getSiphoxCustomerByPhone as ReturnType<typeof vi.fn>
const mockGetOrders = getKitOrdersByCustomer as ReturnType<typeof vi.fn>
const mockUpdateStatus = updateKitOrderStatus as ReturnType<typeof vi.fn>
const mockRegister = registerKit as ReturnType<typeof vi.fn>

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/portal/labs', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/portal/labs (register)', () => {
  it('returns 401 when not authenticated', async () => {
    mockVerify.mockResolvedValue({ authenticated: false, phone: null, asherPatientId: null })

    const res = await POST(makeRequest({ kitId: 'KIT-123' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing kitId', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Kit ID is required')
  })

  it('returns 400 when no SiPhox customer exists', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })
    mockGetCustomer.mockResolvedValue(null)

    const res = await POST(makeRequest({ kitId: 'KIT-123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('No SiPhox customer')
  })

  it('registers kit and updates order status', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: 1 })
    mockGetCustomer.mockResolvedValue({
      id: '1',
      phone_e164: '+13525551234',
      siphox_customer_id: 'siphox-cust-1',
    })
    mockRegister.mockResolvedValue({ valid: true, kitId: 'KIT-123', status: 'registered' })
    mockGetOrders.mockResolvedValue([
      { id: '1', siphox_order_id: 'order-1', siphox_customer_id: 'siphox-cust-1' },
    ])
    mockUpdateStatus.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ kitId: 'KIT-123' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.registration.valid).toBe(true)
    expect(mockRegister).toHaveBeenCalledWith('KIT-123', 'siphox-cust-1')
    expect(mockUpdateStatus).toHaveBeenCalledWith('order-1', 'registered')
  })
})
