import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeKlarnaOrder } from '@/lib/payments/klarna-api';
import { updateOrderByOrderNumber, getOrderByOrderNumber } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, order_id } = body;

    console.log('Klarna webhook received:', {
      event_type,
      order_id,
      timestamp: new Date().toISOString(),
    });

    // Acknowledge the order to Klarna
    if (order_id) {
      try {
        await acknowledgeKlarnaOrder(order_id);
        console.log('Klarna order acknowledged:', order_id);
      } catch (ackError) {
        console.error('Failed to acknowledge Klarna order:', ackError);
      }
    }

    // Local order number format
    const localOrderNumber = `KLARNA-${order_id}`;

    // Handle different event types
    switch (event_type) {
      case 'checkout_complete':
        // Order has been completed by the customer
        console.log('Klarna checkout complete:', order_id);
        break;

      case 'order_approved':
        // Order has been approved by Klarna (fraud check passed)
        console.log('Klarna order approved:', order_id);
        if (process.env.POSTGRES_URL) {
          try {
            const order = await getOrderByOrderNumber(localOrderNumber);
            if (order && order.status === 'pending') {
              await updateOrderByOrderNumber(localOrderNumber, {
                status: 'paid',
                notes: 'Approved by Klarna fraud review',
              });
              console.log('Order approved and marked as paid:', localOrderNumber);
            }
          } catch (error) {
            console.error('Failed to update order on approval:', error);
          }
        }
        break;

      case 'order_captured':
        // Payment has been captured
        console.log('Klarna order captured:', order_id);
        if (process.env.POSTGRES_URL) {
          try {
            const order = await getOrderByOrderNumber(localOrderNumber);
            if (order && order.status !== 'paid') {
              await updateOrderByOrderNumber(localOrderNumber, {
                status: 'paid',
                notes: 'Payment captured by Klarna',
              });
              console.log('Order marked as paid (captured):', localOrderNumber);
            }
          } catch (error) {
            console.error('Failed to update order on capture:', error);
          }
        }
        break;

      case 'order_refunded':
        // Order has been refunded
        console.log('Klarna order refunded:', order_id);
        if (process.env.POSTGRES_URL) {
          try {
            await updateOrderByOrderNumber(localOrderNumber, {
              status: 'refunded',
              notes: 'Refunded via Klarna',
            });
            console.log('Order marked as refunded:', localOrderNumber);
          } catch (error) {
            console.error('Failed to mark order as refunded:', error);
          }
        }
        break;

      case 'order_rejected':
        // Order has been rejected by Klarna fraud check
        console.log('Klarna order rejected:', order_id);
        if (process.env.POSTGRES_URL) {
          try {
            await updateOrderByOrderNumber(localOrderNumber, {
              status: 'cancelled',
              notes: 'Rejected by Klarna fraud review',
            });
            console.log('Order marked as cancelled (rejected):', localOrderNumber);
          } catch (error) {
            console.error('Failed to mark order as cancelled:', error);
          }
        }
        break;

      default:
        console.log('Unhandled Klarna event type:', event_type);
    }

    // Klarna expects a 200 response to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Klarna webhook error:', error);
    // Return 200 anyway to prevent Klarna from retrying indefinitely
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}
