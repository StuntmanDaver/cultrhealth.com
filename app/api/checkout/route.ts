import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, BLOOD_TEST_ADDON } from '@/lib/config/plans';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  });
}

/**
 * Subscription Checkout
 *
 * For Core tier: Creates a Stripe Checkout Session with optional blood test add-on.
 * For all other tiers: Redirects to the pre-configured Stripe Payment Link.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`checkout:${clientIp}`);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { planSlug, email } = body;

    // Validate required fields
    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      );
    }

    // Find the plan
    const plan = PLANS.find((p) => p.slug === planSlug);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 400 }
      );
    }

    // Core tier: use Stripe Checkout Session with optional blood test add-on
    if (planSlug === 'core') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email is required for Core tier checkout' },
          { status: 400 }
        );
      }

      const stripe = getStripe();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com';

      // Read attribution cookie
      const attributionCookie = request.cookies.get('cultr_attribution')?.value;

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
      };

      let session: Stripe.Checkout.Session;

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
          } as Stripe.Checkout.SessionCreateParams);
        } catch {
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
          });
        }
      } else {
        session = await stripe.checkout.sessions.create(baseConfig);
      }

      return NextResponse.json({
        success: true,
        redirectUrl: session.url,
      });
    }

    // All other tiers: use Payment Link
    if (!plan.paymentLink) {
      return NextResponse.json(
        { error: 'Subscription plan not properly configured' },
        { status: 500 }
      );
    }

    // Build redirect URL with prefilled email if available
    let redirectUrl = plan.paymentLink;
    const params = new URLSearchParams();
    if (email) {
      params.set('prefilled_email', email);
    }

    // Read attribution cookie and pass as client_reference_id
    const attributionCookie = request.cookies.get('cultr_attribution')?.value;
    if (attributionCookie) {
      params.set('client_reference_id', `attr_${attributionCookie}`);
    }

    if (params.toString()) {
      redirectUrl += `?${params.toString()}`;
    }

    return NextResponse.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
