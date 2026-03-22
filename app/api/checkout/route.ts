import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, BLOOD_TEST_ADDON, DOCTOR_CONSULTATION_ADDON } from '@/lib/config/plans';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  });
}

/**
 * Subscription Checkout
 *
 * Creates a Stripe Checkout Session for all paid tiers with:
 * - The subscription (recurring monthly price)
 * - Blood test add-on ($135, one-time, optional — quantity 0-1)
 * - Doctor consultation add-on ($75, one-time, optional — quantity 0-1)
 *
 * Falls back to Payment Link if plan has no stripePriceId.
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

    // Club tier is free — no checkout needed
    if (plan.price === 0) {
      return NextResponse.json(
        { error: 'Free tier does not require checkout' },
        { status: 400 }
      );
    }

    // All paid tiers: create Stripe Checkout Session with one-time add-ons
    if (plan.stripePriceId) {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email is required for checkout' },
          { status: 400 }
        );
      }

      const stripe = getStripe();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com';

      // Read attribution cookie
      const attributionCookie = request.cookies.get('cultr_attribution')?.value;

      // Build one-time add-on line items
      const addonLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      if (BLOOD_TEST_ADDON.stripePriceId) {
        addonLineItems.push({
          price: BLOOD_TEST_ADDON.stripePriceId,
          quantity: 1,
          adjustable_quantity: {
            enabled: true,
            minimum: 0,
            maximum: 1,
          },
        });
      }

      if (DOCTOR_CONSULTATION_ADDON.stripePriceId) {
        addonLineItems.push({
          price: DOCTOR_CONSULTATION_ADDON.stripePriceId,
          quantity: 1,
          adjustable_quantity: {
            enabled: true,
            minimum: 0,
            maximum: 1,
          },
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
          ...addonLineItems,
        ],
        metadata: { plan_tier: plan.slug },
        client_reference_id: attributionCookie ? `attr_${attributionCookie}` : undefined,
        success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing`,
        allow_promotion_codes: true,
      });

      return NextResponse.json({
        success: true,
        redirectUrl: session.url,
      });
    }

    // Fallback: use Payment Link (if no stripePriceId configured)
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
