import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { buildAffirmCheckoutConfig } from '@/lib/payments/affirm-api';
import { AFFIRM_ENABLED, isAmountEligible } from '@/lib/config/payments';
import { PLANS } from '@/lib/config/plans';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`affirm-checkout:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!AFFIRM_ENABLED) {
      return NextResponse.json(
        { error: 'Affirm payments are not currently available' },
        { status: 403 }
      );
    }

    if (!process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY || !process.env.AFFIRM_PRIVATE_API_KEY) {
      return NextResponse.json(
        { error: 'Affirm not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planSlug, amountCents, items, description } = body;

    // Determine amount
    let totalCents = amountCents;
    let orderDescription = description;
    if (planSlug) {
      const plan = PLANS.find((p) => p.slug === planSlug);
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
      }
      if (!plan.bnplEnabled) {
        return NextResponse.json(
          { error: 'BNPL not available for this plan' },
          { status: 400 }
        );
      }
      totalCents = plan.price * 100;
      orderDescription = `CULTR ${plan.name} Membership`;
    }

    if (!totalCents || totalCents <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!isAmountEligible('affirm', totalCents)) {
      return NextResponse.json(
        { error: 'Amount not eligible for Affirm' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const orderId = `CULTR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const isSubscription = !!planSlug;
    const cancelPath = isSubscription ? '/pricing' : '/library/cart';

    const checkoutConfig = buildAffirmCheckoutConfig({
      orderId,
      amountCents: totalCents,
      items,
      description: orderDescription,
      confirmationUrl: `${baseUrl}/success?provider=affirm&order_id=${orderId}&checkout_token={checkout_token}${!isSubscription ? '&type=product' : ''}`,
      cancelUrl: `${baseUrl}${cancelPath}?cancelled=true`,
    });

    console.log('Affirm checkout config built:', {
      order_id: orderId,
      amount: totalCents,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ checkout: checkoutConfig });
  } catch (error) {
    console.error('Affirm checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to build Affirm checkout' },
      { status: 500 }
    );
  }
}
