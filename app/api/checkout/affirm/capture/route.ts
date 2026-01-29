import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { authorizeAffirmCharge, captureAffirmCharge } from '@/lib/payments/affirm-api';
import { AFFIRM_ENABLED } from '@/lib/config/payments';

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
    const { checkoutToken, orderId } = body;

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

    return NextResponse.json({
      charge_id: charge.id,
      capture_id: capture.id,
      order_id: charge.order_id,
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
