import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================
// MOCKS
// ============================================================

// Mock rate-limit module
vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {
    check: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
  },
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
  ),
}))

// Mock Stripe
const mockCheckoutSessionsCreate = vi.fn()
const mockStripeConstructor = vi.fn().mockImplementation(() => ({
  checkout: {
    sessions: {
      create: mockCheckoutSessionsCreate,
    },
  },
}))

const mockGetProductBySku = vi.fn()

vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor(...args: unknown[]) {
      return mockStripeConstructor(...args)
    }
  },
}))

vi.mock('@/lib/config/product-catalog', () => ({
  getProductBySku: mockGetProductBySku,
}))

// ============================================================
// HELPERS
// ============================================================

function createRequest(body: Record<string, unknown>, cookies?: Record<string, string>): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/checkout/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Set cookies if provided
  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value)
    }
  }

  return req
}

function createCheckoutRequest(body: Record<string, unknown>, cookies?: Record<string, string>): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value)
    }
  }

  return req
}

function createProductRequest(body: Record<string, unknown>, cookies?: Record<string, string>): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/checkout/product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value)
    }
  }

  return req
}

// ============================================================
// TESTS: POST /api/checkout/subscription
// ============================================================

describe('POST /api/checkout/subscription', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
    process.env.BLOOD_TEST_STRIPE_PRICE_ID = 'price_bloodtest_123'
    mockGetProductBySku.mockImplementation((sku: string) => {
      if (sku === 'TESTSKU') {
        return {
          sku: 'TESTSKU',
          name: 'Test Product',
          category: 'metabolic',
          priceUsd: 49,
        }
      }

      return null
    })

    // Default mock: successful session creation
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_session_123',
      url: 'https://checkout.stripe.com/cs_test_session_123',
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should create a Checkout Session with Core subscription and blood test add-on', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.redirectUrl).toBe('https://checkout.stripe.com/cs_test_session_123')

    // Verify Stripe was called with correct parameters
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledTimes(1)
    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]

    expect(createArgs.mode).toBe('subscription')
    expect(createArgs.customer_email).toBe('user@example.com')
    expect(createArgs.metadata).toEqual({ plan_tier: 'core' })
    expect(createArgs.allow_promotion_codes).toBe(true)

    // Line items should include Core subscription
    expect(createArgs.line_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ quantity: 1 }),
      ])
    )
  })

  it('should include blood test as optional_items', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]

    // Should attempt optional_items first
    // The route tries optional_items; if that throws, it falls back
    // Since our mock succeeds, optional_items should be present
    // OR adjustable_quantity fallback should be used
    const hasOptionalItems = !!createArgs.optional_items
    const hasAdjustableQuantity = createArgs.line_items?.some(
      (item: Record<string, unknown>) => item.adjustable_quantity
    )

    // One of these approaches must be used
    expect(hasOptionalItems || hasAdjustableQuantity).toBe(true)
  })

  it('should include plan_tier core in session metadata', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.metadata.plan_tier).toBe('core')
  })

  it('should forward attribution cookie as client_reference_id', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest(
      { planSlug: 'core', email: 'user@example.com' },
      { cultr_attribution: 'creator_abc123' }
    )
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.client_reference_id).toBe('attr_creator_abc123')
  })

  it('should not include client_reference_id when no attribution cookie', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.client_reference_id).toBeUndefined()
  })

  it('should return 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('should return 400 when planSlug is missing', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ email: 'user@example.com' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('should return 400 for non-core planSlug', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'catalyst', email: 'user@example.com' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('should set success_url with session_id parameter', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.success_url).toContain('/success')
    expect(createArgs.success_url).toContain('{CHECKOUT_SESSION_ID}')
  })

  it('should set cancel_url to /pricing', async () => {
    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.cancel_url).toContain('/pricing')
  })

  it('should fall back to adjustable_quantity when optional_items throws', async () => {
    // First call with optional_items throws, second without succeeds
    mockCheckoutSessionsCreate
      .mockRejectedValueOnce(new Error('Invalid parameter: optional_items'))
      .mockResolvedValueOnce({
        id: 'cs_test_fallback_123',
        url: 'https://checkout.stripe.com/cs_test_fallback_123',
      })

    const { POST } = await import('@/app/api/checkout/subscription/route')

    const request = createRequest({ planSlug: 'core', email: 'user@example.com' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.redirectUrl).toBe('https://checkout.stripe.com/cs_test_fallback_123')

    // Second call should use adjustable_quantity fallback
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledTimes(2)
    const fallbackArgs = mockCheckoutSessionsCreate.mock.calls[1][0]

    // Fallback should NOT have optional_items
    expect(fallbackArgs.optional_items).toBeUndefined()

    // Should have blood test as a line item with adjustable_quantity
    const bloodTestItem = fallbackArgs.line_items?.find(
      (item: Record<string, unknown>) => item.adjustable_quantity
    )
    expect(bloodTestItem).toBeDefined()
    expect(bloodTestItem.adjustable_quantity).toEqual({
      enabled: true,
      minimum: 0,
      maximum: 1,
    })
  })
})

// ============================================================
// TESTS: Non-regression for POST /api/checkout
// ============================================================

describe('POST /api/checkout (non-regression)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
    process.env.BLOOD_TEST_STRIPE_PRICE_ID = 'price_bloodtest_123'

    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_core_session',
      url: 'https://checkout.stripe.com/cs_test_core_session',
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return Checkout Session URL for Core tier (not Payment Link)', async () => {
    const { POST } = await import('@/app/api/checkout/route')

    const request = createCheckoutRequest({ planSlug: 'core', email: 'user@example.com' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    // Core should return a Checkout Session URL (contains checkout.stripe.com/cs_)
    expect(body.redirectUrl).toContain('checkout.stripe.com')
  })

  it('should return Checkout Session URL for Catalyst+ tier', async () => {
    const { POST } = await import('@/app/api/checkout/route')

    const request = createCheckoutRequest({ planSlug: 'catalyst', email: 'user@example.com' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    // All paid tiers now use Stripe Checkout Sessions (with one-time add-ons)
    expect(body.redirectUrl).toContain('checkout.stripe.com')
  })

  it('should return Checkout Session URL for Concierge tier', async () => {
    const { POST } = await import('@/app/api/checkout/route')

    const request = createCheckoutRequest({ planSlug: 'concierge', email: 'user@example.com' })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    // All paid tiers now use Stripe Checkout Sessions (with one-time add-ons)
    expect(body.redirectUrl).toContain('checkout.stripe.com')
  })

  it('should forward attribution cookie for paid tier checkout sessions', async () => {
    const { POST } = await import('@/app/api/checkout/route')

    const request = createCheckoutRequest(
      { planSlug: 'catalyst', email: 'user@example.com' },
      { cultr_attribution: 'creator_abc123' }
    )
    await POST(request)

    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.client_reference_id).toBe('attr_creator_abc123')
    expect(createArgs.allow_promotion_codes).toBe(true)
  })
})

describe('POST /api/checkout/product', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'
    mockGetProductBySku.mockImplementation((sku: string) => {
      if (sku === 'TESTSKU') {
        return {
          sku: 'TESTSKU',
          name: 'Test Product',
          category: 'metabolic',
          priceUsd: 49,
        }
      }

      return null
    })
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_product_123',
      url: 'https://checkout.stripe.com/cs_test_product_123',
    })
  })

  it('forwards attribution cookie and enables promotion codes for product checkout', async () => {
    const { POST } = await import('@/app/api/checkout/product/route')

    const request = createProductRequest(
      {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'Buyer',
        items: [{ sku: 'TESTSKU', quantity: 1 }],
      },
      { cultr_attribution: 'product_attr_123' }
    )
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    const createArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(createArgs.client_reference_id).toBe('attr_product_attr_123')
    expect(createArgs.allow_promotion_codes).toBe(true)
  })
})
