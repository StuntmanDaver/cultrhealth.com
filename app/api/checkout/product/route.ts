import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getProductBySku } from '@/lib/config/product-catalog';
import { 
  createInvoice, 
  chargePatient, 
  getPatientByEmail, 
  createPatient,
  storePaymentMethod,
} from '@/lib/healthie-api';
import { v4 as uuidv4 } from 'uuid';

/**
 * HIPAA-Compliant Product Checkout via Healthie
 * 
 * This endpoint processes product purchases through Healthie's internal
 * payment system (Stripe Connect), which is covered under Healthie's BAA.
 * 
 * Flow:
 * 1. Frontend tokenizes card using Stripe.js with Healthie's publishable key
 * 2. Token is sent here along with customer info and cart items
 * 3. We find or create the patient in Healthie
 * 4. Store the payment method and charge the patient
 * 5. Return success with order details
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`product-checkout:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!process.env.HEALTHIE_API_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { items, email, stripeToken, firstName, lastName } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!stripeToken) {
      return NextResponse.json(
        { error: 'Payment token is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate all items and calculate total
    let totalCents = 0;
    const productDescriptions: string[] = [];

    for (const item of items) {
      const { sku, quantity } = item;
      if (!sku || !quantity || quantity < 1) {
        return NextResponse.json(
          { error: `Invalid item: ${sku}` },
          { status: 400 }
        );
      }

      const product = getProductBySku(sku);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${sku}` },
          { status: 400 }
        );
      }

      if (!product.priceUsd) {
        return NextResponse.json(
          { error: `Product ${sku} requires a quote` },
          { status: 400 }
        );
      }

      totalCents += Math.round(product.priceUsd * 100) * quantity;
      productDescriptions.push(`${product.name} x${quantity}`);
    }

    const totalDollars = (totalCents / 100).toFixed(2);

    // Find or create patient in Healthie
    let patient = await getPatientByEmail(email);
    let isNewPatient = false;

    if (!patient) {
      patient = await createPatient({
        email,
        firstName,
        lastName,
      });
      isNewPatient = true;
    }

    // Store the payment method
    const paymentMethod = await storePaymentMethod({
      token: stripeToken,
      userId: patient.id,
      isDefault: true,
    });

    // Create an invoice for tracking
    const invoice = await createInvoice({
      recipientId: patient.id,
      invoiceType: 'other',
      price: totalDollars,
      servicesProvided: productDescriptions.join(', '),
      notes: `Product order - ${items.length} item(s)`,
    });

    // Charge the patient
    const billingItem = await chargePatient({
      senderId: patient.id,
      amountPaid: totalDollars,
      stripeCustomerDetailId: paymentMethod.id,
      requestedPaymentId: invoice.id,
      stripeIdempotencyKey: uuidv4(),
    });

    // Log checkout completion (no PHI)
    console.log('Healthie product checkout completed:', {
      item_count: items.length,
      billing_item_id: billingItem.id,
      invoice_id: invoice.id,
      is_new_patient: isNewPatient,
      timestamp: new Date().toISOString(),
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    return NextResponse.json({
      success: true,
      orderId: billingItem.id,
      invoiceId: invoice.id,
      patientId: patient.id,
      isNewPatient,
      redirectUrl: `${baseUrl}/success?provider=healthie&type=product&order_id=${billingItem.id}`,
    });
  } catch (error) {
    console.error('Healthie product checkout error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
