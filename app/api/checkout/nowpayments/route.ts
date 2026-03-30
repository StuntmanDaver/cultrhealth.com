import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/config/plans';
import { NOWPAYMENTS_ENABLED } from '@/lib/config/payments';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { createNowPayment } from '@/lib/payments/nowpayments-api';
import { createOrder } from '@/lib/db';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    if (!NOWPAYMENTS_ENABLED) {
      return NextResponse.json(
        { error: 'Bitcoin payments are not enabled' },
        { status: 400 }
      );
    }

    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'NOWPayments not configured' },
        { status: 500 }
      );
    }

    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`nowpayments-checkout:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { planSlug, amountCents, email } = body as {
      planSlug: string;
      amountCents: number;
      email: string;
    };

    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json({ error: 'Plan slug is required' }, { status: 400 });
    }
    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.slug === planSlug);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.cultrhealth.com';
    const orderNumber = `NP-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

    const payment = await createNowPayment({
      price_amount: amountCents / 100,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: orderNumber,
      order_description: `CULTR ${plan.name}`,
      ipn_callback_url: `${siteUrl}/api/webhook/nowpayments`,
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/join/${plan.slug}`,
    });

    // Generate QR code with bitcoin: URI
    const bitcoinUri = `bitcoin:${payment.pay_address}?amount=${payment.pay_amount}`;
    const qrCodeDataUrl = await QRCode.toDataURL(bitcoinUri, { width: 200, margin: 1 });

    // Create pending order record
    try {
      await createOrder({
        order_number: orderNumber,
        customer_email: email,
        payment_provider: 'nowpayments',
        status: 'pending',
        total_amount: amountCents / 100,
        currency: 'USD',
        stripe_payment_intent_id: `np_${payment.payment_id}`,
        items: [{ sku: plan.slug, name: plan.name, quantity: 1, unit_price: amountCents / 100, category: 'membership' }],
        notes: JSON.stringify({
          plan_slug: planSlug,
          nowpayments_id: payment.payment_id,
          next_billing_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        }),
      });
    } catch (dbError) {
      console.error('Failed to create order record:', dbError);
    }

    console.log('NOWPayments checkout created:', {
      orderNumber,
      paymentId: payment.payment_id,
      plan: plan.slug,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      paymentId: payment.payment_id,
      address: payment.pay_address,
      amountBtc: payment.pay_amount,
      amountUsd: amountCents / 100,
      expiresAt: payment.expiration_estimate_date,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error('NOWPayments checkout error:', error);
    return NextResponse.json({ error: 'Unable to create payment. Please try again.' }, { status: 500 });
  }
}
