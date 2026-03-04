import { NextRequest, NextResponse } from 'next/server';
import { updateOrderByOrderNumber, getOrderByOrderNumber } from '@/lib/db';

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
