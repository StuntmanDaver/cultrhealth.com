import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createKlarnaOrder } from '@/lib/payments/klarna-api';
import { KLARNA_ENABLED } from '@/lib/config/payments';
import { PLANS } from '@/lib/config/plans';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`klarna-order:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!KLARNA_ENABLED) {
      return NextResponse.json(
        { error: 'Klarna payments are not currently available' },
        { status: 403 }
      );
    }

    if (!process.env.KLARNA_API_KEY || !process.env.KLARNA_API_SECRET) {
      return NextResponse.json(
        { error: 'Klarna not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { authorizationToken, planSlug, amountCents, items, description } = body;

    if (!authorizationToken || typeof authorizationToken !== 'string') {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 400 }
      );
    }

    // Determine amount
    let totalCents = amountCents;
    if (planSlug) {
      const plan = PLANS.find((p) => p.slug === planSlug);
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
      }
      totalCents = plan.price * 100;
    }

    if (!totalCents || totalCents <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const order = await createKlarnaOrder(authorizationToken, {
      amountCents: totalCents,
      items,
      description: description || (planSlug ? `CULTR Health Membership` : undefined),
    });

    console.log('Klarna order created:', {
      order_id: order.order_id,
      fraud_status: order.fraud_status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      order_id: order.order_id,
      fraud_status: order.fraud_status,
      redirect_url: order.redirect_url,
    });
  } catch (error) {
    console.error('Klarna order error:', error);
    return NextResponse.json(
      { error: 'Failed to create Klarna order' },
      { status: 500 }
    );
  }
}
