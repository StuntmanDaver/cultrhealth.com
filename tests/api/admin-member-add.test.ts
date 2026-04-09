import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/members/add/route'
import * as auth from '@/lib/auth'
import * as db from '@/lib/db'
import * as postgres from '@vercel/postgres'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  isProviderEmail: vi.fn(),
  createMagicLinkToken: vi.fn().mockResolvedValue('fake_token'),
}))

vi.mock('@/lib/db', () => ({
  createMembership: vi.fn().mockResolvedValue({ id: 'test_membership_id' }),
}))

vi.mock('@vercel/postgres', () => ({
  sql: vi.fn().mockResolvedValue({ rowCount: 1, rows: [{ id: '123' }] }),
}))

const mockStripe = {
  customers: {
    list: vi.fn(),
    create: vi.fn(),
  },
}
vi.mock('stripe', () => ({
  default: class {
    customers = mockStripe.customers
  }
}))

// Mock Resend
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'email_1' }, error: null })
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend }
  }
}))

vi.mock('@/lib/resend', () => ({
  baseEmailTemplate: vi.fn(content => content),
  getFromEmail: vi.fn(() => 'test@example.com'),
}))

describe('POST /api/admin/members/add', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { 
      ...originalEnv, 
      ADMIN_ALLOWED_EMAILS: 'admin@example.com', 
      POSTGRES_URL: 'postgres://localhost',
      RESEND_API_KEY: 're_123',
    }
    
    // Setup default auth
    vi.mocked(auth.getSession).mockResolvedValue({
      email: 'admin@example.com',
      customerId: 'admin_123',
      role: 'admin',
    })
    vi.mocked(auth.isProviderEmail).mockReturnValue(false)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)
    
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects non-admin requests', async () => {
    vi.mocked(auth.getSession).mockResolvedValue({
      email: 'user@example.com',
      customerId: 'user_123',
      role: 'member',
    })
    
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('validates required fields', async () => {
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }), // missing firstName, lastName, tier
    })
    
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing required fields')
  })

  it('adds a club member directly to postgres without stripe', async () => {
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        tier: 'club'
      }),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)
    
    // Verify sql was called for club_members
    expect(postgres.sql).toHaveBeenCalled()
    // Verify Stripe was NOT called
    expect(mockStripe.customers.list).not.toHaveBeenCalled()
    // Verify email was sent
    expect(mockSend).toHaveBeenCalled()
  })

  it('adds a paid tier member and creates stripe customer', async () => {
    mockStripe.customers.list.mockResolvedValue({ data: [] })
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_new123' })
    
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        tier: 'core'
      }),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)
    
    // Verify Stripe was checked and created
    expect(mockStripe.customers.list).toHaveBeenCalledWith({ email: 'jane@example.com', limit: 1 })
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: undefined,
    })
    
    // Verify membership created
    expect(db.createMembership).toHaveBeenCalledWith(expect.objectContaining({
      stripe_customer_id: 'cus_new123',
      plan_tier: 'core',
      subscription_status: 'active',
      email: 'jane@example.com'
    }))
    
    // Verify email was sent
    expect(mockSend).toHaveBeenCalled()
  })

  it('uses existing stripe customer if found', async () => {
    mockStripe.customers.list.mockResolvedValue({ data: [{ id: 'cus_exist123' }] })
    
    const req = new NextRequest('http://localhost/api/admin/members/add', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@example.com',
        tier: 'catalyst'
      }),
    })
    
    const res = await POST(req)
    expect(res.status).toBe(200)
    
    expect(mockStripe.customers.list).toHaveBeenCalled()
    expect(mockStripe.customers.create).not.toHaveBeenCalled()
    
    expect(db.createMembership).toHaveBeenCalledWith(expect.objectContaining({
      stripe_customer_id: 'cus_exist123',
      plan_tier: 'catalyst'
    }))
  })
})
