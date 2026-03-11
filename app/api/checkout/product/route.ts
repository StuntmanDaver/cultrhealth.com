import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getProductBySku } from '@/lib/config/product-catalog';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  });
}

/**
 * Product Checkout via Stripe
 *
 * Creates a Stripe checkout session for one-time product purchases.
 * The Stripe webhook handler (handleProductCheckoutCompleted) handles
 * order creation, LMN generation, and confirmation emails.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`product-checkout:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { items, email, firstName, lastName } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate all items and build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const { sku, quantity } = item;
      if (!sku || !quantity || quantity < 1) {
        return NextResponse.json(
          { error: `Invalid item: ${sku}` },
          { status: 400 }
        );
      }

      const product = getProductBySku(sku);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${sku}` },
          { status: 400 }
        );
      }

      if (!product.priceUsd) {
        return NextResponse.json(
          { error: `Product ${sku} requires a quote` },
          { status: 400 }
        );
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            metadata: {
              sku: product.sku,
              category: product.category || 'unknown',
            },
          },
          unit_amount: Math.round(product.priceUsd * 100),
        },
        quantity,
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const stripe = getStripe();

    // Read attribution cookie and pass as client_reference_id
    const attributionCookie = request.cookies.get('cultr_attribution')?.value;
    const clientReferenceId = attributionCookie ? `attr_${attributionCookie}` : undefined;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      ...(clientReferenceId && { client_reference_id: clientReferenceId }),
      metadata: {
        customer_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || '',
        customer_email: email,
      },
      success_url: `${baseUrl}/success?provider=stripe&type=product&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/library/cart`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Product checkout error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
