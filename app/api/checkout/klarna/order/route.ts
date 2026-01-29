import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createKlarnaOrder } from '@/lib/payments/klarna-api';
import { KLARNA_ENABLED } from '@/lib/config/payments';
import { PLANS } from '@/lib/config/plans';
import { createOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { withRetry, isTransientDbError, logCheckoutEvent } from '@/lib/resilience';

interface KlarnaItem {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

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
    const { authorizationToken, planSlug, amountCents, items, description, customerEmail } = body as {
      authorizationToken: string;
      planSlug?: string;
      amountCents?: number;
      items?: KlarnaItem[];
      description?: string;
      customerEmail?: string;
    };

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

    const klarnaOrder = await createKlarnaOrder(authorizationToken, {
      amountCents: totalCents,
      items,
      description: description || (planSlug ? `CULTR Health Membership` : undefined),
    });

    console.log('Klarna order created:', {
      order_id: klarnaOrder.order_id,
      fraud_status: klarnaOrder.fraud_status,
      timestamp: new Date().toISOString(),
    });

    // Create order in database if fraud check passed
    const orderNumber = `KLARNA-${klarnaOrder.order_id}`;
    const totalAmount = totalCents / 100;
    const email = customerEmail || '';

    // Create order items from passed items or generate placeholder
    const orderItems = items?.map(item => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPriceCents / 100,
      category: 'klarna-purchase',
    })) || [{
      sku: 'KLARNA-ORDER',
      name: 'Klarna Purchase',
      quantity: 1,
      unit_price: totalAmount,
      category: 'klarna-purchase',
    }];

    if (process.env.POSTGRES_URL && email && klarnaOrder.fraud_status === 'ACCEPTED') {
      try {
        const result = await withRetry(
          () => createOrder({
            order_number: orderNumber,
            customer_email: email,
            stripe_payment_intent_id: `klarna_${klarnaOrder.order_id}`, // Prefix to identify as Klarna
            payment_provider: 'klarna',
            status: 'paid',
            total_amount: totalAmount,
            currency: 'USD',
            items: orderItems,
            notes: `Klarna order: ${klarnaOrder.order_id}, fraud_status: ${klarnaOrder.fraud_status}`,
          }),
          { maxAttempts: 3, delayMs: 500, shouldRetry: isTransientDbError }
        );

        logCheckoutEvent({
          type: 'checkout_completed',
          provider: 'klarna',
          orderId: result.id,
          orderNumber,
          amount: totalAmount,
        });

        // Send order confirmation email
        if (email) {
          await sendOrderConfirmationEmail({
            email,
            orderNumber,
            items: orderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.unit_price * item.quantity,
            })),
            totalAmount,
            currency: 'USD',
            paymentMethod: 'Klarna - Pay in 4',
          });
        }
      } catch (dbError) {
        logCheckoutEvent({
          type: 'checkout_failed',
          provider: 'klarna',
          orderNumber,
          error: dbError instanceof Error ? dbError.message : 'DB write failed',
          metadata: { stage: 'order_creation', klarnaOrderId: klarnaOrder.order_id },
        });
        // Don't fail - payment was successful
      }
    } else if (klarnaOrder.fraud_status === 'PENDING') {
      // Create pending order for fraud review
      if (process.env.POSTGRES_URL && email) {
        try {
          await withRetry(
            () => createOrder({
              order_number: orderNumber,
              customer_email: email,
              stripe_payment_intent_id: `klarna_${klarnaOrder.order_id}`,
              payment_provider: 'klarna',
              status: 'pending',
              total_amount: totalAmount,
              currency: 'USD',
              items: orderItems,
              notes: `Klarna order pending fraud review`,
            }),
            { maxAttempts: 3, delayMs: 500, shouldRetry: isTransientDbError }
          );
          logCheckoutEvent({
            type: 'checkout_started',
            provider: 'klarna',
            orderNumber,
            amount: totalAmount,
            metadata: { fraudStatus: 'PENDING' },
          });
        } catch (dbError) {
          logCheckoutEvent({
            type: 'checkout_failed',
            provider: 'klarna',
            orderNumber,
            error: dbError instanceof Error ? dbError.message : 'DB write failed',
            metadata: { stage: 'pending_order_creation' },
          });
        }
      }
    }

    return NextResponse.json({
      order_id: klarnaOrder.order_id,
      local_order_number: orderNumber,
      fraud_status: klarnaOrder.fraud_status,
      redirect_url: klarnaOrder.redirect_url,
    });
  } catch (error) {
    console.error('Klarna order error:', error);
    return NextResponse.json(
      { error: 'Failed to create Klarna order' },
      { status: 500 }
    );
  }
}
