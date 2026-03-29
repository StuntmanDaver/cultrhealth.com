import { NextRequest, NextResponse } from 'next/server';
import { verifyNowPaymentsSignature } from '@/lib/payments/nowpayments-api';
import { updateOrderByOrderNumber, getOrderByOrderNumber } from '@/lib/db';
import type { NowPaymentsIPNPayload } from '@/lib/payments/payment-types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as NowPaymentsIPNPayload;

    // Verify IPN signature
    const signature = request.headers.get('x-nowpayments-sig') || '';
    if (!verifyNowPaymentsSignature(body as unknown as Record<string, unknown>, signature)) {
      console.error('NOWPayments IPN: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { payment_status, order_id, payment_id, price_amount, actually_paid } = body;

    console.log('NOWPayments IPN received:', {
      payment_id,
      payment_status,
      order_id,
      price_amount,
      actually_paid,
      timestamp: new Date().toISOString(),
    });

    switch (payment_status) {
      case 'finished': {
        await updateOrderByOrderNumber(order_id, { status: 'paid' });
        // Email is best-effort — look up order for customer email and items
        try {
          const order = await getOrderByOrderNumber(order_id);
          if (order?.customer_email) {
            const { sendOrderConfirmationEmail } = await import('@/lib/resend');
            const emailItems = Array.isArray(order.items)
              ? order.items.map((i: { name: string; quantity: number; unit_price: number }) => ({
                  name: i.name,
                  quantity: i.quantity,
                  price: Number(i.unit_price),
                }))
              : [];
            await sendOrderConfirmationEmail({
              email: order.customer_email,
              orderNumber: order_id,
              items: emailItems,
              totalAmount: Number(order.total_amount),
              paymentMethod: 'Bitcoin (NOWPayments)',
            });
          }
        } catch (emailError) {
          console.error('NOWPayments IPN: email send failed:', emailError);
        }
        break;
      }
      case 'partially_paid':
        await updateOrderByOrderNumber(order_id, {
          notes: `Partial BTC payment received: ${actually_paid} (expected for $${price_amount})`,
        });
        break;
      case 'failed':
      case 'expired':
        await updateOrderByOrderNumber(order_id, { status: 'cancelled' });
        break;
      default:
        // confirming, confirmed, sending, refunded — log only
        break;
    }

    // Always return 200 to prevent NOWPayments retries
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('NOWPayments IPN error:', error);
    // Still return 200 to prevent retry loops on app-level errors
    return NextResponse.json({ received: true });
  }
}
