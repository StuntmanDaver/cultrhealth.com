import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderNumber, markOrderShipped, markOrderFulfilled } from '@/lib/db';
import { sendShippingNotificationEmail } from '@/lib/resend';
import { getSession, isProviderEmail } from '@/lib/auth';

/**
 * Admin Order Fulfillment API
 *
 * POST /api/admin/orders/[orderNumber]/fulfill
 *
 * Body:
 * - action: 'ship' | 'fulfill' (required)
 * - carrier: string (required for ship action)
 * - trackingNumber: string (required for ship action)
 * - trackingUrl: string (optional, for ship action)
 * - estimatedDelivery: string ISO date (optional, for ship action)
 * - sendEmail: boolean (default: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // Check session-based admin auth (used by dashboard), or legacy x-admin-secret header
    const session = await getSession();
    const adminSecret = request.headers.get('x-admin-secret');
    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || '';
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isSessionAdmin = session && (allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email));
    const isSecretAdmin = adminSecret === process.env.ADMIN_SECRET;

    if (!isSessionAdmin && !isSecretAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    // Get the order first
    const order = await getOrderByOrderNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, carrier, trackingNumber, trackingUrl, estimatedDelivery, sendEmail = true } = body;

    if (!action || !['ship', 'fulfill'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "ship" or "fulfill"' },
        { status: 400 }
      );
    }

    // Handle shipping
    if (action === 'ship') {
      if (!carrier || !trackingNumber) {
        return NextResponse.json(
          { error: 'Carrier and tracking number are required for shipping' },
          { status: 400 }
        );
      }

      // Validate order can be shipped
      if (!['paid'].includes(order.status)) {
        return NextResponse.json(
          { error: `Order cannot be shipped in status: ${order.status}` },
          { status: 400 }
        );
      }

      // Mark order as shipped
      await markOrderShipped(orderNumber, {
        carrier,
        trackingNumber,
        trackingUrl,
      });

      console.log('Order marked as shipped:', {
        orderNumber,
        carrier,
        trackingNumber,
        timestamp: new Date().toISOString(),
      });

      // Send shipping notification email
      if (sendEmail && order.customer_email) {
        try {
          // Build items list from order
          const itemsList = order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
          }));

          await sendShippingNotificationEmail({
            email: order.customer_email,
            orderNumber,
            carrier,
            trackingNumber,
            trackingUrl,
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
            items: itemsList,
          });
          console.log('Shipping notification sent:', { orderNumber });
        } catch (emailError) {
          console.error('Failed to send shipping notification:', emailError);
          // Don't fail the request - shipping was successful
        }
      }

      return NextResponse.json({
        success: true,
        action: 'shipped',
        orderNumber,
        carrier,
        trackingNumber,
        emailSent: sendEmail && !!order.customer_email,
      });
    }

    // Handle fulfillment (delivered/completed)
    if (action === 'fulfill') {
      // Validate order can be fulfilled
      if (!['paid', 'shipped'].includes(order.status)) {
        return NextResponse.json(
          { error: `Order cannot be fulfilled in status: ${order.status}` },
          { status: 400 }
        );
      }

      // Mark order as fulfilled
      await markOrderFulfilled(orderNumber, carrier && trackingNumber ? {
        carrier,
        trackingNumber,
        trackingUrl,
      } : undefined);

      console.log('Order marked as fulfilled:', {
        orderNumber,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        action: 'fulfilled',
        orderNumber,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Order fulfillment error:', error);
    return NextResponse.json(
      { error: 'Failed to process fulfillment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[orderNumber]/fulfill
 * 
 * Returns order details for fulfillment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // Check session-based admin auth or legacy x-admin-secret header
    const session = await getSession();
    const adminSecret = request.headers.get('x-admin-secret');
    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || '';
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isSessionAdmin = session && (allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email));
    const isSecretAdmin = adminSecret === process.env.ADMIN_SECRET;

    if (!isSessionAdmin && !isSecretAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    const order = await getOrderByOrderNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        status: order.status,
        totalAmount: order.total_amount,
        currency: order.currency,
        items: order.items,
        createdAt: order.created_at,
        fulfilledAt: order.fulfilled_at,
        notes: order.notes,
      },
      canShip: order.status === 'paid',
      canFulfill: ['paid', 'shipped'].includes(order.status),
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
