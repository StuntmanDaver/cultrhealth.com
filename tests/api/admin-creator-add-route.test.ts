// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock Stripe
const mockStripeCouponsCreate = vi.fn()
const mockStripePromotionCodesCreate = vi.fn()

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      coupons = { create: mockStripeCouponsCreate }
      promotionCodes = { create: mockStripePromotionCodesCreate }
    },
  }
})

// Mock DB connection for transactions
const mockQuery = vi.fn()
const mockRelease = vi.fn()
const mockConnect = vi.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease,
})

vi.mock('@vercel/postgres', () => ({
  db: {
    connect: mockConnect,
  },
}))

// Mock other dependencies
const mockVerifyAdminAuth = vi.fn()
const mockCreateAdminAction = vi.fn()
const mockUpdateAffiliateCodeStripeIds = vi.fn()
const mockGenerateCreatorCodes = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
}))

vi.mock('@/lib/creators/db', () => ({
  createAdminAction: mockCreateAdminAction,
  updateAffiliateCodeStripeIds: mockUpdateAffiliateCodeStripeIds,
}))

vi.mock('@/lib/config/affiliate', () => ({
  generateCreatorCodes: mockGenerateCreatorCodes,
}))

describe('POST /api/admin/creators/add', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.STRIPE_SECRET_KEY = 'sk_test_123'

    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: true,
      email: 'admin@cultrhealth.com',
      role: 'admin',
    })

    // Setup default successful transaction queries
    mockQuery.mockImplementation((queryText: string, params?: any[]) => {
      const q = queryText.trim().toLowerCase()
      
      if (q.includes('begin') || q.includes('commit') || q.includes('rollback')) {
        return Promise.resolve()
      }
      
      if (q.includes('select id, status from creators')) {
        return Promise.resolve({ rows: [] }) // Email doesn't exist
      }
      
      if (q.includes('insert into creators')) {
        return Promise.resolve({ rows: [{ id: 'creator_123' }] })
      }
      
      if (q.includes('insert into tracking_links')) {
        return Promise.resolve({ rows: [{ id: 'link_123' }] })
      }
      
      if (q.includes('insert into affiliate_codes') && params?.[5] === 'membership') {
        return Promise.resolve({ rows: [{ id: 'code_mem_123' }] })
      }
      
      if (q.includes('insert into affiliate_codes') && params?.[5] === 'product') {
        return Promise.resolve({ rows: [{ id: 'code_prod_123' }] })
      }
      
      return Promise.resolve({ rows: [] })
    })

    mockGenerateCreatorCodes.mockReturnValue({
      membershipCode: 'DOE',
      productCode: 'DOE10',
    })

    mockStripeCouponsCreate.mockResolvedValue({ id: 'coupon_123' })
    mockStripePromotionCodesCreate.mockResolvedValue({ id: 'promo_123' })
    
    mockUpdateAffiliateCodeStripeIds.mockResolvedValue(undefined)
    mockCreateAdminAction.mockResolvedValue(undefined)
  })

  it('rejects unauthenticated requests', async () => {
    mockVerifyAdminAuth.mockResolvedValue({ authenticated: false })

    const { POST } = await import('@/app/api/admin/creators/add/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('rejects invalid inputs', async () => {
    const { POST } = await import('@/app/api/admin/creators/add/route')
    
    // Missing fields
    let request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe' }),
    })
    let response = await POST(request)
    expect(response.status).toBe(400)
    
    // Invalid email
    request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe', email: 'not-an-email' }),
    })
    response = await POST(request)
    expect(response.status).toBe(400)
    
    // Invalid commission
    request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe', email: 'john@example.com', commission_rate: 100 }),
    })
    response = await POST(request)
    expect(response.status).toBe(400)
    
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('rolls back and returns 409 if the creator already exists', async () => {
    mockQuery.mockImplementation((queryText: string) => {
      const q = queryText.trim().toLowerCase()
      if (q.includes('begin') || q.includes('commit') || q.includes('rollback')) {
        return Promise.resolve()
      }
      if (q.includes('select id, status from creators')) {
        return Promise.resolve({ rows: [{ id: 'creator_123', status: 'active' }] })
      }
      return Promise.resolve({ rows: [] })
    })

    const { POST } = await import('@/app/api/admin/creators/add/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe', email: 'john@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toContain('already exists')
    
    // Verify rollback was called
    const queryCalls = mockQuery.mock.calls.map(c => c[0].trim().toLowerCase())
    expect(queryCalls).toContain('rollback')
    expect(queryCalls).not.toContain('commit')
    expect(mockRelease).toHaveBeenCalled()
  })

  it('successfully creates a creator and syncs with Stripe', async () => {
    const { POST } = await import('@/app/api/admin/creators/add/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        full_name: 'John Doe', 
        email: 'john@example.com',
        phone: '1234567890',
        social_handle: '@johndoe',
        commission_rate: 15,
        discount_percent: 20,
        custom_code: 'JOHNDOE20'
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.creatorId).toBe('creator_123')
    expect(body.membershipCode).toBe('JOHNDOE20')
    expect(body.productCode).toBe('JOHNDOE2010')

    // Verify transaction queries
    const queryCalls = mockQuery.mock.calls.map(c => c[0].trim().toLowerCase())
    expect(queryCalls).toContain('begin')
    expect(queryCalls).toContain('commit')
    expect(mockRelease).toHaveBeenCalled()

    // Verify Stripe sync
    expect(mockStripeCouponsCreate).toHaveBeenCalledTimes(2)
    expect(mockStripePromotionCodesCreate).toHaveBeenCalledTimes(2)
    
    expect(mockStripeCouponsCreate).toHaveBeenCalledWith(expect.objectContaining({
      percent_off: 20,
      name: 'JOHNDOE20'
    }))
    
    expect(mockStripeCouponsCreate).toHaveBeenCalledWith(expect.objectContaining({
      percent_off: 20,
      name: 'JOHNDOE2010'
    }))
    
    expect(mockUpdateAffiliateCodeStripeIds).toHaveBeenCalledTimes(2)
    
    // Verify audit log
    expect(mockCreateAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      admin_email: 'admin@cultrhealth.com',
      action_type: 'add_creator',
      entity_type: 'creator',
      entity_id: 'creator_123',
      metadata: expect.objectContaining({
        full_name: 'John Doe',
        email: 'john@example.com',
        commission_rate: 15,
        discount_percent: 20,
        membership_code: 'JOHNDOE20',
        product_code: 'JOHNDOE2010',
      })
    }))
  })

  it('retries transaction upon slug or code collision', async () => {
    let attemptCount = 0
    mockQuery.mockImplementation((queryText: string, params?: any[]) => {
      const q = queryText.trim().toLowerCase()
      
      if (q.includes('begin') || q.includes('commit') || q.includes('rollback')) {
        return Promise.resolve()
      }
      
      if (q.includes('select id, status from creators')) {
        return Promise.resolve({ rows: [] })
      }
      
      if (q.includes('insert into creators')) {
        return Promise.resolve({ rows: [{ id: 'creator_123' }] })
      }
      
      // Simulate slug collision on first attempt
      if (q.includes('insert into tracking_links')) {
        if (attemptCount === 0) {
          attemptCount++
          throw new Error('duplicate key value violates unique constraint "idx_tracking_links_slug"')
        }
        return Promise.resolve({ rows: [{ id: 'link_123' }] })
      }
      
      if (q.includes('insert into affiliate_codes')) {
        return Promise.resolve({ rows: [{ id: 'code_123' }] })
      }
      
      return Promise.resolve({ rows: [] })
    })

    const { POST } = await import('@/app/api/admin/creators/add/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'John Doe', email: 'john@example.com' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    
    // Verify rollback was called for the first attempt and commit for the second
    const queryCalls = mockQuery.mock.calls.map(c => c[0].trim().toLowerCase())
    expect(queryCalls).toContain('rollback')
    expect(queryCalls).toContain('commit')
  })
})
