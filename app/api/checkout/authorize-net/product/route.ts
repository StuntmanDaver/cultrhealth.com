import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZE_NET_ENABLED } from '@/lib/config/payments';
import { apiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getProductBySku } from '@/lib/config/product-catalog';
import {
  createTransaction,
  isTransactionSuccessful,
  getTransactionError,
} from '@/lib/payments/authorize-net-api';
import type { AuthorizeNetOpaqueData, CheckoutItem } from '@/lib/payments/payment-types';
import { createOrder } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check if Authorize.net is enabled
    if (!AUTHORIZE_NET_ENABLED) {
      return NextResponse.json(
        { error: 'Authorize.net payments are not enabled' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitResult = await apiLimiter.check(`authnet-product:${clientIp}`);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate credentials are configured
    if (!process.env.AUTHORIZE_NET_TRANSACTION_KEY || 
        !process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID) {
      return NextResponse.json(
        { error: 'Authorize.net not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      items, 
      email, 
      opaqueData,
      billing,
    } = body as {
      items: Array<{ sku: string; quantity: number }>;
      email: string;
      opaqueData: AuthorizeNetOpaqueData;
      billing?: {
        firstName: string;
        lastName: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };
    };

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json(
        { error: 'Payment token (opaqueData) is required' },
        { status: 400 }
      );
    }

    // Validate all items and calculate total
    const checkoutItems: CheckoutItem[] = [];
    let totalCents = 0;

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

      const unitPriceCents = Math.round(product.priceUsd * 100);
      totalCents += unitPriceCents * quantity;

      checkoutItems.push({
        sku: product.sku,
        name: product.name,
        quantity,
        unitPriceCents,
      });
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create transaction via Authorize.net
    const response = await createTransaction({
      opaqueData,
      amountCents: totalCents,
      orderId,
      description: `CULTR Health Order - ${checkoutItems.length} item(s)`,
      customerEmail: email,
      items: checkoutItems,
      billing,
    });

    // Check if transaction was successful
    if (!isTransactionSuccessful(response)) {
      const errorMessage = getTransactionError(response);
      console.error('Authorize.net transaction failed:', {
        orderId,
        error: errorMessage,
        responseCode: response.transactionResponse?.responseCode,
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const transactionId = response.transactionResponse?.transId;

    // Create order record in database
    try {
      await createOrder({
        order_number: orderId,
        customer_email: email,
        stripe_payment_intent_id: `authnet_${transactionId}`, // Prefix to identify as Authorize.net
        status: 'paid',
        total_amount: totalCents / 100,
        currency: 'USD',
        items: checkoutItems.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPriceCents / 100,
          category: '', // We don't have category in CheckoutItem
        })),
      });
    } catch (dbError) {
      console.error('Failed to create order record:', dbError);
      // Don't fail the request - payment is complete, log for manual review
    }

    // Log success (no PHI)
    console.log('Authorize.net product checkout completed:', {
      orderId,
      transactionId,
      itemCount: checkoutItems.length,
      totalCents,
      timestamp: new Date().toISOString(),
    });

    // Return success with transaction details
    return NextResponse.json({
      success: true,
      transactionId,
      orderId,
      total: totalCents / 100,
      // Redirect URL for client
      redirectUrl: `/success?provider=authorize_net&transaction_id=${transactionId}&order_id=${orderId}&type=product`,
    });
  } catch (error) {
    console.error('Authorize.net product checkout error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
