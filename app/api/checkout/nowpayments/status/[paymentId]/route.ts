import { NextRequest, NextResponse } from 'next/server';
import { NOWPAYMENTS_ENABLED } from '@/lib/config/payments';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getNowPaymentStatus } from '@/lib/payments/nowpayments-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    if (!NOWPAYMENTS_ENABLED) {
      return NextResponse.json({ error: 'Not enabled' }, { status: 400 });
    }

    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`nowpayments-status:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await getNowPaymentStatus(paymentId);

    return NextResponse.json({ status: payment.payment_status });
  } catch (error) {
    console.error('NOWPayments status check error:', error);
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
}
