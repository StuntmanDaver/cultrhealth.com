import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/config/plans';
import { COREPAY_ENABLED, COREPAY_CONFIG } from '@/lib/config/payments';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createSubscription } from '@/lib/payments/authorize-net-api';
import type { AuthorizeNetOpaqueData } from '@/lib/payments/payment-types';
import { createMembership } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    if (!COREPAY_ENABLED) {
      return NextResponse.json(
        { error: 'CorePay payments are not enabled' },
        { status: 400 }
      );
    }

    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`corepay-checkout:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const apiLoginId = process.env.NEXT_PUBLIC_COREPAY_API_LOGIN_ID;
    const transactionKey = process.env.COREPAY_TRANSACTION_KEY;
    if (!apiLoginId || !transactionKey) {
      return NextResponse.json(
        { error: 'CorePay not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planSlug, email, opaqueData, billing } = body as {
      planSlug: string;
      email: string;
      opaqueData: AuthorizeNetOpaqueData;
      billing?: { firstName: string; lastName: string };
    };

    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json({ error: 'Plan slug is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json({ error: 'Payment token (opaqueData) is required' }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.slug === planSlug);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }
    if (plan.price <= 0) {
      return NextResponse.json({ error: 'This plan does not require payment' }, { status: 400 });
    }

    const orderId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Use Authorize.Net gateway with CorePay credentials
    const response = await createSubscription({
      opaqueData,
      amountCents: plan.price * 100,
      subscriptionName: `CULTR Health - ${plan.name}`,
      customerEmail: email,
      billing,
      orderId,
      description: `${plan.name} Monthly Membership`,
      credentials: {
        apiLoginId,
        transactionKey,
        apiUrl: COREPAY_CONFIG.apiUrl,
      },
    });

    if (response.messages.resultCode !== 'Ok' || !response.subscriptionId) {
      const errorMessage = response.messages.message?.[0]?.text || 'Subscription creation failed';
      console.error('CorePay subscription error:', {
        orderId,
        error: errorMessage,
        resultCode: response.messages.resultCode,
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    try {
      await createMembership({
        stripe_customer_id: `corepay_${response.profile?.customerProfileId || orderId}`,
        stripe_subscription_id: `corepay_${response.subscriptionId}`,
        plan_tier: plan.slug,
        subscription_status: 'active',
      });
    } catch (dbError) {
      console.error('Failed to create membership record:', dbError);
    }

    console.log('CorePay subscription checkout completed:', {
      orderId,
      subscriptionId: response.subscriptionId,
      plan: plan.slug,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      subscriptionId: response.subscriptionId,
      orderId,
      plan: plan.slug,
      redirectUrl: `/success?provider=corepay&subscription_id=${response.subscriptionId}&type=subscription`,
    });
  } catch (error) {
    console.error('CorePay subscription checkout error:', error);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
