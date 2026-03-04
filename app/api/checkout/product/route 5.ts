import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getProductBySku } from '@/lib/config/product-catalog';
import { createOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { withRetry, isTransientDbError, logCheckoutEvent } from '@/lib/resilience';

/**
 * Product Checkout via Stripe PaymentIntent
 *
 * This endpoint processes product purchases directly through Stripe.
 *
 * Flow:
 * 1. Frontend tokenizes card using Stripe.js with the publishable key
 * 2. Token is sent here along with customer info and cart items
 * 3. We create a PaymentIntent with confirm: true using the token
 * 4. On success, create a local order record and send confirmation email
 * 5. Return success with order details
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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const body = await request.json();
    const { items, email, stripeToken, firstName, lastName } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
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

    // Validate all items and calculate total
    let totalCents = 0;
    const productDescriptions: string[] = [];

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

      totalCents += Math.round(product.priceUsd * 100) * quantity;
      productDescriptions.push(`${product.name} x${quantity}`);
    }

    // Create a PaymentIntent with the token and confirm immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      payment_method_data: {
        type: 'card',
        card: {
          token: stripeToken,
        },
      },
      confirm: true,
      description: `CULTR Health Product Order - ${productDescriptions.join(', ')}`,
      receipt_email: email,
      metadata: {
        customer_email: email,
        customer_name: [firstName, lastName].filter(Boolean).join(' '),
        item_count: String(items.length),
        items: productDescriptions.join('; '),
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment was not completed. Please try again.' },
        { status: 400 }
      );
    }

    // Log checkout completion (no PHI)
    console.log('Stripe product checkout completed:', {
      item_count: items.length,
      payment_intent_id: paymentIntent.id,
      timestamp: new Date().toISOString(),
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Build order items with full product details
    const orderItems = items.map((item: { sku: string; quantity: number }) => {
      const product = getProductBySku(item.sku);
      return {
        sku: item.sku,
        name: product?.name || item.sku,
        quantity: item.quantity,
        unit_price: product?.priceUsd || 0,
        category: product?.category || 'unknown',
      };
    });

    // Create local order record with retry logic
    if (process.env.POSTGRES_URL) {
      try {
        const result = await withRetry(
          () => createOrder({
            order_number: orderNumber,
            customer_email: email,
            stripe_payment_intent_id: paymentIntent.id,
            payment_provider: 'stripe',
            status: 'paid',
            total_amount: totalCents / 100,
            currency: 'USD',
            items: orderItems,
            notes: `Stripe PaymentIntent: ${paymentIntent.id}`,
          }),
          { maxAttempts: 3, delayMs: 500, shouldRetry: isTransientDbError }
        );

        logCheckoutEvent({
          type: 'checkout_completed',
          provider: 'stripe',
          orderId: result.id,
          orderNumber,
          amount: totalCents / 100,
          metadata: { paymentIntentId: paymentIntent.id },
        });

        // Send order confirmation email
        await sendOrderConfirmationEmail({
          email,
          name: firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined,
          orderNumber,
          items: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.unit_price * item.quantity,
          })),
          totalAmount: totalCents / 100,
          currency: 'USD',
          paymentMethod: 'Credit Card (Stripe)',
        });
      } catch (dbError) {
        logCheckoutEvent({
          type: 'checkout_failed',
          provider: 'stripe',
          orderNumber,
          error: dbError instanceof Error ? dbError.message : 'DB write failed',
          metadata: { stage: 'order_creation', paymentIntentId: paymentIntent.id },
        });
        // Don't fail - Stripe payment was successful
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    return NextResponse.json({
      success: true,
      orderId: paymentIntent.id,
      orderNumber,
      redirectUrl: `${baseUrl}/success?provider=stripe&type=product&order_id=${orderNumber}`,
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
