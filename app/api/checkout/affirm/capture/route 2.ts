import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { authorizeAffirmCharge, captureAffirmCharge } from '@/lib/payments/affirm-api';
import { AFFIRM_ENABLED } from '@/lib/config/payments';
import { createOrder } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import { withRetry, isTransientDbError, logCheckoutEvent } from '@/lib/resilience';

interface AffirmItem {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`affirm-capture:${clientIp}`);
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
    const { checkoutToken, orderId, items, customerEmail } = body as {
      checkoutToken: string;
      orderId?: string;
      items?: AffirmItem[];
      customerEmail?: string;
    };

    if (!checkoutToken || typeof checkoutToken !== 'string') {
      return NextResponse.json(
        { error: 'Checkout token is required' },
        { status: 400 }
      );
    }

    // Step 1: Authorize the charge
    const charge = await authorizeAffirmCharge(checkoutToken);
    console.log('Affirm charge authorized:', {
      charge_id: charge.id,
      order_id: charge.order_id,
      amount: charge.amount,
      timestamp: new Date().toISOString(),
    });

    // Step 2: Immediately capture
    const capture = await captureAffirmCharge(charge.id, orderId);
    console.log('Affirm charge captured:', {
      capture_id: capture.id,
      amount: capture.amount,
      fee: capture.fee,
      timestamp: new Date().toISOString(),
    });

    // Step 3: Create order in database
    const orderNumber = charge.order_id || `AFFIRM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const totalAmount = capture.amount / 100; // Convert from cents
    const email = customerEmail || '';

    // Create order items from passed items or generate placeholder
    const orderItems = items?.map(item => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPriceCents / 100,
      category: 'affirm-purchase',
    })) || [{
      sku: 'AFFIRM-ORDER',
      name: 'Affirm Purchase',
      quantity: 1,
      unit_price: totalAmount,
      category: 'affirm-purchase',
    }];

    if (process.env.POSTGRES_URL && email) {
      try {
        const result = await withRetry(
          () => createOrder({
            order_number: orderNumber,
            customer_email: email,
            stripe_payment_intent_id: `affirm_${charge.id}`, // Prefix to identify as Affirm
            payment_provider: 'affirm',
            status: 'paid',
            total_amount: totalAmount,
            currency: 'USD',
            items: orderItems,
            notes: `Affirm charge: ${charge.id}, capture: ${capture.id}`,
          }),
          { maxAttempts: 3, delayMs: 500, shouldRetry: isTransientDbError }
        );

        logCheckoutEvent({
          type: 'checkout_completed',
          provider: 'affirm',
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
            paymentMethod: 'Affirm Financing',
          });
        }
      } catch (dbError) {
        logCheckoutEvent({
          type: 'checkout_failed',
          provider: 'affirm',
          orderNumber,
          error: dbError instanceof Error ? dbError.message : 'DB write failed',
          metadata: { stage: 'order_creation', chargeId: charge.id },
        });
        // Don't fail - payment was successful
      }
    }

    return NextResponse.json({
      charge_id: charge.id,
      capture_id: capture.id,
      order_id: orderNumber,
      amount: capture.amount,
      status: 'captured',
    });
  } catch (error) {
    console.error('Affirm capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture Affirm payment' },
      { status: 500 }
    );
  }
}
