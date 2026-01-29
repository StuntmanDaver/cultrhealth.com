import { NextRequest, NextResponse } from 'next/server';

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
        console.log('Affirm charge captured:', data?.id);
        break;

      case 'charge.voided':
        console.log('Affirm charge voided:', data?.id);
        break;

      case 'charge.refunded':
        console.log('Affirm charge refunded:', data?.id);
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
