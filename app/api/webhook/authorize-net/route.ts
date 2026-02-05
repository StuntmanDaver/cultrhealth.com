import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/authorize-net-api';
import type { AuthorizeNetWebhookEvent } from '@/lib/payments/payment-types';
import { updateOrderByOrderNumber, updateMembershipBySubscriptionId } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature if configured
    const signature = request.headers.get('x-anet-signature') || '';
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.error('Authorize.net webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: AuthorizeNetWebhookEvent = JSON.parse(rawBody);
    const { eventType, payload, notificationId } = event;

    console.log('Authorize.net webhook received:', {
      eventType,
      notificationId,
      entityName: payload?.entityName,
      id: payload?.id,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    // See: https://developer.authorize.net/api/reference/features/webhooks.html
    switch (eventType) {
      // Transaction events
      case 'net.authorize.payment.authcapture.created':
      case 'net.authorize.payment.capture.created':
        await handlePaymentCapture(payload);
        break;

      case 'net.authorize.payment.void.created':
        await handlePaymentVoid(payload);
        break;

      case 'net.authorize.payment.refund.created':
        await handlePaymentRefund(payload);
        break;

      case 'net.authorize.payment.fraud.held':
        await handleFraudHeld(payload);
        break;

      case 'net.authorize.payment.fraud.approved':
        await handleFraudApproved(payload);
        break;

      case 'net.authorize.payment.fraud.declined':
        await handleFraudDeclined(payload);
        break;

      // Subscription (ARB) events
      case 'net.authorize.customer.subscription.created':
        await handleSubscriptionCreated(payload);
        break;

      case 'net.authorize.customer.subscription.updated':
        await handleSubscriptionUpdated(payload);
        break;

      case 'net.authorize.customer.subscription.suspended':
        await handleSubscriptionSuspended(payload);
        break;

      case 'net.authorize.customer.subscription.terminated':
        await handleSubscriptionTerminated(payload);
        break;

      case 'net.authorize.customer.subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'net.authorize.customer.subscription.expiring':
        await handleSubscriptionExpiring(payload);
        break;

      default:
        console.log('Unhandled Authorize.net event type:', eventType);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, notificationId });
  } catch (error) {
    console.error('Authorize.net webhook error:', error);
    // Still return 200 to prevent retries for malformed events
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// ---------------------
// Payment Event Handlers
// ---------------------

async function handlePaymentCapture(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Payment captured:', {
    transactionId: payload.id,
    authCode: payload.authCode,
    amount: payload.authAmount,
    merchantRefId: payload.merchantReferenceId,
  });

  // Update order status if we can match it
  if (payload.merchantReferenceId) {
    try {
      await updateOrderByOrderNumber(payload.merchantReferenceId, {
        status: 'paid',
      });
    } catch (error) {
      console.error('Failed to update order on payment capture:', error);
    }
  }
}

async function handlePaymentVoid(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Payment voided:', {
    transactionId: payload.id,
    merchantRefId: payload.merchantReferenceId,
  });

  if (payload.merchantReferenceId) {
    try {
      await updateOrderByOrderNumber(payload.merchantReferenceId, {
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Failed to update order on void:', error);
    }
  }
}

async function handlePaymentRefund(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Payment refunded:', {
    transactionId: payload.id,
    merchantRefId: payload.merchantReferenceId,
  });

  if (payload.merchantReferenceId) {
    try {
      await updateOrderByOrderNumber(payload.merchantReferenceId, {
        status: 'refunded',
      });
    } catch (error) {
      console.error('Failed to update order on refund:', error);
    }
  }
}

async function handleFraudHeld(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Payment held for fraud review:', {
    transactionId: payload.id,
    merchantRefId: payload.merchantReferenceId,
  });
  // TODO: Send notification to admin for manual review
}

async function handleFraudApproved(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Fraud review approved:', {
    transactionId: payload.id,
    merchantRefId: payload.merchantReferenceId,
  });

  if (payload.merchantReferenceId) {
    try {
      await updateOrderByOrderNumber(payload.merchantReferenceId, {
        status: 'paid',
      });
    } catch (error) {
      console.error('Failed to update order after fraud approval:', error);
    }
  }
}

async function handleFraudDeclined(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Fraud review declined:', {
    transactionId: payload.id,
    merchantRefId: payload.merchantReferenceId,
  });

  if (payload.merchantReferenceId) {
    try {
      await updateOrderByOrderNumber(payload.merchantReferenceId, {
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Failed to update order after fraud decline:', error);
    }
  }
}

// ---------------------
// Subscription Event Handlers
// ---------------------

async function handleSubscriptionCreated(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription created:', {
    subscriptionId: payload.id,
  });
  // Subscription is already created in checkout flow, this is just confirmation
}

async function handleSubscriptionUpdated(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription updated:', {
    subscriptionId: payload.id,
  });
}

async function handleSubscriptionSuspended(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription suspended:', {
    subscriptionId: payload.id,
  });

  try {
    await updateMembershipBySubscriptionId(`authnet_${payload.id}`, {
      subscription_status: 'past_due',
    });
  } catch (error) {
    console.error('Failed to update membership on suspension:', error);
  }
}

async function handleSubscriptionTerminated(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription terminated:', {
    subscriptionId: payload.id,
  });

  try {
    await updateMembershipBySubscriptionId(`authnet_${payload.id}`, {
      subscription_status: 'canceled',
      cancelled_at: new Date(),
      cancellation_reason: 'subscription_terminated',
    });
  } catch (error) {
    console.error('Failed to update membership on termination:', error);
  }
}

async function handleSubscriptionCancelled(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription cancelled:', {
    subscriptionId: payload.id,
  });

  try {
    await updateMembershipBySubscriptionId(`authnet_${payload.id}`, {
      subscription_status: 'canceled',
      cancelled_at: new Date(),
      cancellation_reason: 'user_cancelled',
    });
  } catch (error) {
    console.error('Failed to update membership on cancellation:', error);
  }
}

async function handleSubscriptionExpiring(payload: AuthorizeNetWebhookEvent['payload']) {
  console.log('Subscription expiring soon:', {
    subscriptionId: payload.id,
  });
  // TODO: Send notification to customer about expiring subscription
}
