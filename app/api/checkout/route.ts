import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/config/plans';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

/**
 * Subscription Checkout
 *
 * Redirects to the Stripe payment link for the selected plan.
 * Each plan has a pre-configured Stripe payment link.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`checkout:${clientIp}`);

    if (!rateLimitResult.success) {
      console.log('Checkout rate limit exceeded:', { ip: clientIp });
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

    if (!plan.paymentLink) {
      console.error('Payment link not configured for plan:', plan.slug);
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
      // Encode the attribution token into the client_reference_id
      // Stripe will include this in the checkout.session.completed webhook
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
    console.error('Checkout error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
