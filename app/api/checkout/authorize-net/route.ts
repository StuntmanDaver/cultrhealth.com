import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/config/plans';
import { AUTHORIZE_NET_ENABLED } from '@/lib/config/payments';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createSubscription } from '@/lib/payments/authorize-net-api';
import type { AuthorizeNetOpaqueData } from '@/lib/payments/payment-types';
import { createMembership } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check if Authorize.net is enabled
    if (!AUTHORIZE_NET_ENABLED) {
      return NextResponse.json(
        { error: 'Authorize.net payments are not enabled' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`authnet-checkout:${clientIp}`);
    
    if (!rateLimitResult.success) {
      console.log('Authorize.net checkout rate limit exceeded:', { ip: clientIp });
      return rateLimitResponse(rateLimitResult);
    }

    // Validate credentials are configured
    if (!process.env.AUTHORIZE_NET_TRANSACTION_KEY || 
        !process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID) {
      return NextResponse.json(
        { error: 'Authorize.net not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      planSlug, 
      email, 
      opaqueData, 
      billing,
      metadata 
    } = body as {
      planSlug: string;
      email: string;
      opaqueData: AuthorizeNetOpaqueData;
      billing?: {
        firstName: string;
        lastName: string;
      };
      metadata?: Record<string, string>;
    };

    // Validate required fields
    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json(
        { error: 'Payment token (opaqueData) is required' },
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

    // Generate a unique order ID
    const orderId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create subscription via Authorize.net ARB
    const response = await createSubscription({
      opaqueData,
      amountCents: plan.price * 100, // Convert to cents
      subscriptionName: `CULTR Health - ${plan.name}`,
      customerEmail: email,
      billing,
      orderId,
      description: `${plan.name} Monthly Membership`,
    });

    // Check if subscription was created successfully
    if (response.messages.resultCode !== 'Ok' || !response.subscriptionId) {
      const errorMessage = response.messages.message?.[0]?.text || 'Subscription creation failed';
      console.error('Authorize.net subscription error:', {
        orderId,
        error: errorMessage,
        resultCode: response.messages.resultCode,
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Create membership record in database
    try {
      await createMembership({
        stripe_customer_id: `authnet_${response.profile?.customerProfileId || orderId}`, // Use customer profile or order ID
        stripe_subscription_id: `authnet_${response.subscriptionId}`, // Prefix to identify as Authorize.net
        plan_tier: plan.slug,
        subscription_status: 'active',
      });
    } catch (dbError) {
      console.error('Failed to create membership record:', dbError);
      // Don't fail the request - subscription is created, log for manual review
    }

    // Log success (no PHI)
    console.log('Authorize.net subscription checkout completed:', {
      orderId,
      subscriptionId: response.subscriptionId,
      plan: plan.slug,
      timestamp: new Date().toISOString(),
    });

    // Return success with subscription details
    return NextResponse.json({
      success: true,
      subscriptionId: response.subscriptionId,
      orderId,
      plan: plan.slug,
      // Redirect URL for client
      redirectUrl: `/success?provider=authorize_net&subscription_id=${response.subscriptionId}&type=subscription`,
    });
  } catch (error) {
    console.error('Authorize.net subscription checkout error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process subscription';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
