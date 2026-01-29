import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createKlarnaSession } from '@/lib/payments/klarna-api';
import { KLARNA_ENABLED, isAmountEligible } from '@/lib/config/payments';
import { PLANS } from '@/lib/config/plans';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`klarna-session:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Feature flag check
    if (!KLARNA_ENABLED) {
      return NextResponse.json(
        { error: 'Klarna payments are not currently available' },
        { status: 403 }
      );
    }

    // Validate Klarna credentials
    if (!process.env.KLARNA_API_KEY || !process.env.KLARNA_API_SECRET) {
      return NextResponse.json(
        { error: 'Klarna not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planSlug, amountCents, items, description } = body;

    // Determine amount
    let totalCents = amountCents;
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
    }

    if (!totalCents || totalCents <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Check BNPL eligibility
    if (!isAmountEligible('klarna', totalCents)) {
      return NextResponse.json(
        { error: 'Amount not eligible for Klarna' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await createKlarnaSession({
      amountCents: totalCents,
      items,
      description: description || (planSlug ? `CULTR Health Membership` : undefined),
      confirmationUrl: `${baseUrl}/success?provider=klarna`,
      pushUrl: `${baseUrl}/api/webhook/klarna`,
    });

    console.log('Klarna session created:', {
      session_id: session.session_id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      session_id: session.session_id,
      client_token: session.client_token,
      payment_method_categories: session.payment_method_categories,
    });
  } catch (error) {
    console.error('Klarna session error:', error);
    return NextResponse.json(
      { error: 'Failed to create Klarna session' },
      { status: 500 }
    );
  }
}
