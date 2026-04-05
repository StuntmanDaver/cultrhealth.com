// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockConstructEvent = vi.fn()
const mockRetrieveCustomer = vi.fn()
const mockResolveAttribution = vi.fn()
const mockProcessOrderAttribution = vi.fn()
const mockUpsertPortfolioEntry = vi.fn()
const mockGetAffiliateCodeByStripeIds = vi.fn()
const mockCreateMembership = vi.fn()
const mockIsStripeEventProcessed = vi.fn()
const mockRecordStripeEvent = vi.fn()
const mockSql = vi.fn()
const mockSendWelcomeEmail = vi.fn()
const mockSyncContactToMailchimp = vi.fn()

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(
    new Headers({
      'stripe-signature': 'sig_test_123',
    })
  ),
}))

vi.mock('stripe', () => ({
  default: class MockStripe {
    webhooks = {
      constructEvent: mockConstructEvent,
    }

    customers = {
      retrieve: mockRetrieveCustomer,
    }
  },
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/db', () => ({
  createMembership: mockCreateMembership,
  isStripeEventProcessed: mockIsStripeEventProcessed,
  recordStripeEvent: mockRecordStripeEvent,
}))

vi.mock('@/lib/creators/attribution', () => ({
  resolveAttribution: mockResolveAttribution,
}))

vi.mock('@/lib/creators/commission', () => ({
  processOrderAttribution: mockProcessOrderAttribution,
}))

vi.mock('@/lib/creators/db', () => ({
  upsertPortfolioEntry: mockUpsertPortfolioEntry,
  getAffiliateCodeByStripeIds: mockGetAffiliateCodeByStripeIds,
}))

vi.mock('@/lib/resend', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}))

vi.mock('@/lib/mailchimp', () => ({
  syncContactToMailchimp: mockSyncContactToMailchimp,
}))

vi.mock('@/lib/config/feature-flags', () => ({
  USE_HEALTHIE: false,
}))

function createWebhookRequest(event: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhook/stripe', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

function createCheckoutCompletedEvent(sessionOverrides: Record<string, unknown>) {
  return {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        mode: 'subscription',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        metadata: { plan_tier: 'core' },
        customer_details: {
          email: 'buyer@example.com',
          name: 'Buyer Example',
        },
        client_reference_id: 'attr_cookie123',
        amount_total: 19900,
        total_details: {
          breakdown: {
            discounts: [],
          },
        },
        ...sessionOverrides,
      },
    },
  }
}

describe('stripe webhook attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
    process.env.POSTGRES_URL = 'postgres://localhost/test'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.cultrhealth.com'

    mockIsStripeEventProcessed.mockResolvedValue(false)
    mockRecordStripeEvent.mockResolvedValue(undefined)
    mockCreateMembership.mockResolvedValue(undefined)
    mockSql.mockResolvedValue({ rows: [], rowCount: 0 })
    mockResolveAttribution.mockResolvedValue(null)
    mockProcessOrderAttribution.mockResolvedValue(null)
    mockUpsertPortfolioEntry.mockResolvedValue(undefined)
    mockGetAffiliateCodeByStripeIds.mockResolvedValue(null)
    mockRetrieveCustomer.mockResolvedValue({
      email: 'buyer@example.com',
      name: 'Buyer Example',
    })
    mockSendWelcomeEmail.mockResolvedValue(undefined)
    mockSyncContactToMailchimp.mockResolvedValue(undefined)
  })

  it('prefers the Stripe promotion code value over coupon.name when resolving attribution', async () => {
    const event = createCheckoutCompletedEvent({
      total_details: {
        breakdown: {
          discounts: [
            {
              discount: {
                promotion_code: {
                  id: 'promo_123',
                  code: 'JON21',
                },
                coupon: {
                  id: 'coupon_123',
                  name: 'Friendly coupon label',
                },
              },
            },
          ],
        },
      },
    })
    mockConstructEvent.mockReturnValue(event)
    const request = createWebhookRequest(event)
    const { POST } = await import('@/app/api/webhook/stripe/route')

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockResolveAttribution).toHaveBeenCalledWith({
      customerEmail: 'buyer@example.com',
      attributionCookie: 'cookie123',
      couponCode: 'JON21',
    })
  })

  it('falls back to stored Stripe ids when Stripe only provides promotion/coupon ids', async () => {
    const event = createCheckoutCompletedEvent({
      total_details: {
        breakdown: {
          discounts: [
            {
              discount: {
                promotion_code: 'promo_456',
                coupon: {
                  id: 'coupon_456',
                },
              },
            },
          ],
        },
      },
    })
    mockConstructEvent.mockReturnValue(event)
    mockGetAffiliateCodeByStripeIds.mockResolvedValue({
      id: 'code_123',
      code: 'STEWART1',
    })
    const request = createWebhookRequest(event)
    const { POST } = await import('@/app/api/webhook/stripe/route')

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockGetAffiliateCodeByStripeIds).toHaveBeenCalledWith({
      stripePromotionCodeId: 'promo_456',
      stripeCouponId: 'coupon_456',
    })
    expect(mockResolveAttribution).toHaveBeenCalledWith({
      customerEmail: 'buyer@example.com',
      attributionCookie: 'cookie123',
      couponCode: 'STEWART1',
    })
  })
})
