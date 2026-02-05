import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/config/plans';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { completeCheckout, getOfferingById } from '@/lib/healthie-api';

/**
 * HIPAA-Compliant Subscription Checkout via Healthie
 * 
 * This endpoint processes membership subscriptions through Healthie's internal
 * payment system (Stripe Connect), which is covered under Healthie's BAA.
 * 
 * Flow:
 * 1. Frontend tokenizes card using Stripe.js with Healthie's publishable key
 * 2. Token is sent here along with customer info
 * 3. We call Healthie's completeCheckout mutation
 * 4. Healthie creates the subscription and patient record
 * 5. We return success with the subscription details
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

    // Validate Healthie is configured
    if (!process.env.HEALTHIE_API_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      planSlug, 
      stripeToken,
      email, 
      firstName,
      lastName,
      phone,
      couponCode,
    } = body;

    // Validate required fields
    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      );
    }

    if (!stripeToken) {
      return NextResponse.json(
        { error: 'Payment token is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Validate Healthie Offering ID is configured
    if (!plan.healthieOfferingId) {
      console.error('Healthie Offering ID not configured for plan:', plan.slug);
      return NextResponse.json(
        { error: 'Subscription plan not properly configured' },
        { status: 500 }
      );
    }

    // Verify the offering exists in Healthie
    const offering = await getOfferingById(plan.healthieOfferingId);
    if (!offering) {
      console.error('Healthie Offering not found:', plan.healthieOfferingId);
      return NextResponse.json(
        { error: 'Subscription plan not found in payment system' },
        { status: 500 }
      );
    }

    // Process checkout through Healthie
    const result = await completeCheckout({
      stripeToken,
      offeringId: plan.healthieOfferingId,
      email,
      firstName,
      lastName,
      phone,
      couponCode,
    });

    // Log checkout completion (no PHI)
    console.log('Healthie checkout completed:', {
      plan: plan.slug,
      subscription_id: result.userPackageSelection?.id,
      is_new_patient: result.reassignClientProvider,
      timestamp: new Date().toISOString(),
    });

    // Determine success URL
    const baseUrl = 
      process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    return NextResponse.json({ 
      success: true,
      subscriptionId: result.userPackageSelection?.id,
      patientEmail: result.patientEmail,
      isNewPatient: result.reassignClientProvider,
      redirectUrl: `${baseUrl}/success?provider=healthie&plan=${plan.slug}&subscription_id=${result.userPackageSelection?.id || ''}`,
    });
  } catch (error) {
    console.error('Healthie checkout error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
