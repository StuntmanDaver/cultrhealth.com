import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeKlarnaOrder } from '@/lib/payments/klarna-api';

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

    // Handle different event types
    switch (event_type) {
      case 'checkout_complete':
        // Order has been completed by the customer
        console.log('Klarna checkout complete:', order_id);
        break;

      case 'order_approved':
        // Order has been approved by Klarna
        console.log('Klarna order approved:', order_id);
        break;

      case 'order_captured':
        // Payment has been captured
        console.log('Klarna order captured:', order_id);
        break;

      case 'order_refunded':
        // Order has been refunded
        console.log('Klarna order refunded:', order_id);
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
