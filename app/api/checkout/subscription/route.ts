import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, BLOOD_TEST_ADDON } from '@/lib/config/plans'
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

/**
 * Core Tier Checkout Session
 *
 * Creates a Stripe Checkout Session for Core tier with the $149/mo subscription
 * as a line item and the $135 blood test as an optional add-on.
 *
 * This route handles Core only. Catalyst+ and Concierge continue using Payment Links.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp()
    const rateLimitResult = await apiLimiter.check(`checkout-subscription:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { planSlug, email } = body

    // Validate required fields
    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // This route is Core-only
    if (planSlug !== 'core') {
      return NextResponse.json(
        { error: 'This endpoint only handles Core tier checkout. Use Payment Links for other tiers.' },
        { status: 400 }
      )
    }

    // Look up Core plan
    const plan = PLANS.find(p => p.slug === 'core')
    if (!plan) {
      return NextResponse.json(
        { error: 'Core plan configuration not found' },
        { status: 500 }
      )
    }

    const stripe = getStripe()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

    // Read attribution cookie
    const attributionCookie = request.cookies.get('cultr_attribution')?.value

    // Build base session config
    const baseConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: { plan_tier: 'core' },
      client_reference_id: attributionCookie ? `attr_${attributionCookie}` : undefined,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      allow_promotion_codes: true,
    }

    let session: Stripe.Checkout.Session

    // Try optional_items first (newer Stripe API feature)
    // If unavailable, fall back to adjustable_quantity approach
    if (BLOOD_TEST_ADDON.stripePriceId) {
      try {
        session = await stripe.checkout.sessions.create({
          ...baseConfig,
          optional_items: [
            {
              price: BLOOD_TEST_ADDON.stripePriceId,
              quantity: 1,
              adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 },
            },
          ],
        } as Stripe.Checkout.SessionCreateParams)
      } catch (optionalError) {
        // Fallback: add blood test as a regular line item with adjustable quantity (min 0)
        session = await stripe.checkout.sessions.create({
          ...baseConfig,
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
            {
              price: BLOOD_TEST_ADDON.stripePriceId,
              quantity: 1,
              adjustable_quantity: {
                enabled: true,
                minimum: 0,
                maximum: 1,
              },
            },
          ],
        })
      }
    } else {
      // No blood test price configured -- create session without add-on
      session = await stripe.checkout.sessions.create(baseConfig)
    }

    return NextResponse.json({
      success: true,
      redirectUrl: session.url,
    })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Unable to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
