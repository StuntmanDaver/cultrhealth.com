import { NextRequest, NextResponse } from 'next/server';
import { updateOrderByOrderNumber, getOrderByOrderNumber } from '@/lib/db';
import { getAffirmCharge } from '@/lib/payments/affirm-api';

/**
 * Affirm Webhook Handler
 *
 * Verification strategy: Affirm doesn't provide webhook signatures.
 * Instead, we verify each webhook by calling back to the Affirm API
 * to confirm the charge exists and its status matches the claimed event.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log('Affirm webhook received:', {
      type,
      charge_id: data?.id,
      order_id: data?.order_id,
      timestamp: new Date().toISOString(),
    });

    // Verify the charge exists and matches the claimed state via Affirm API
    if (data?.id) {
      try {
        const charge = await getAffirmCharge(data.id);
        const expectedStatus = getExpectedStatus(type);
        if (expectedStatus && charge.status !== expectedStatus) {
          console.error('Affirm webhook verification failed: status mismatch', {
            claimed_event: type,
            expected_status: expectedStatus,
            actual_status: charge.status,
            charge_id: data.id,
          });
          return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
        }
        console.log('Affirm webhook verified via API callback:', data.id);
      } catch (verifyError) {
        console.error('Affirm webhook verification error:', verifyError);
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
      }
    }

    // Handle different event types
    switch (type) {
      case 'charge.authorized':
        console.log('Affirm charge authorized:', data?.id);
        break;

      case 'charge.captured':
        // Charge captured - order should already be created in capture route
        // This is a confirmation event
        console.log('Affirm charge captured confirmed:', data?.id);
        if (data?.order_id && process.env.POSTGRES_URL) {
          try {
            const order = await getOrderByOrderNumber(data.order_id);
            if (order && order.status !== 'paid') {
              await updateOrderByOrderNumber(data.order_id, {
                status: 'paid',
                notes: `Affirm capture confirmed via webhook`,
              });
              console.log('Order status confirmed as paid:', data.order_id);
            }
          } catch (error) {
            console.error('Failed to update order from Affirm webhook:', error);
          }
        }
        break;

      case 'charge.voided':
        console.log('Affirm charge voided:', data?.id);
        if (data?.order_id && process.env.POSTGRES_URL) {
          try {
            await updateOrderByOrderNumber(data.order_id, {
              status: 'cancelled',
              notes: `Voided via Affirm - charge ${data.id}`,
            });
            console.log('Order marked as cancelled:', data.order_id);
          } catch (error) {
            console.error('Failed to void order:', error);
          }
        }
        break;

      case 'charge.refunded':
        console.log('Affirm charge refunded:', data?.id);
        if (data?.order_id && process.env.POSTGRES_URL) {
          try {
            await updateOrderByOrderNumber(data.order_id, {
              status: 'refunded',
              notes: `Refunded via Affirm - charge ${data.id}`,
            });
            console.log('Order marked as refunded:', data.order_id);
          } catch (error) {
            console.error('Failed to refund order:', error);
          }
        }
        break;

      default:
        console.log('Unhandled Affirm event type:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Affirm webhook error:', error);
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/** Map webhook event types to expected charge statuses */
function getExpectedStatus(eventType: string): string | null {
  switch (eventType) {
    case 'charge.authorized': return 'authorized';
    case 'charge.captured': return 'captured';
    case 'charge.voided': return 'voided';
    case 'charge.refunded': return 'refunded';
    default: return null;
  }
}
