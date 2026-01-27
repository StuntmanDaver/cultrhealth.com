import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS } from '@/lib/config/plans';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`checkout:${clientIp}`);
    
    if (!rateLimitResult.success) {
      console.log('Checkout rate limit exceeded:', { ip: clientIp });
      return rateLimitResponse(rateLimitResult);
    }

    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planSlug, email, metadata } = body;

    // Validate plan slug
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

    // Determine base URL
    const baseUrl = 
      process.env.NEXT_PUBLIC_SITE_URL || 
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000';

    // Build session metadata (PHI-free)
    const sessionMetadata: Record<string, string> = {
      plan_tier: plan.slug,
      plan_name: plan.name,
    };

    // Add any additional metadata (ensure PHI-free)
    if (metadata && typeof metadata === 'object') {
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length < 500) {
          sessionMetadata[key] = value;
        }
      });
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      customer_email: email || undefined,
      billing_address_collection: 'required',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?cancelled=true`,
      metadata: sessionMetadata,
      subscription_data: {
        metadata: sessionMetadata,
      },
    });

    // Log checkout session creation (no PHI)
    console.log('Checkout session created:', {
      session_id: session.id,
      plan: plan.slug,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    
    // Return appropriate error message
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
