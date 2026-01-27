import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook Handler (MVP+)
 * 
 * Handles Stripe webhook events for subscription lifecycle.
 * All data stored is PHI-free (billing metadata only).
 * 
 * Key events:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.payment_failed: Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret is configured
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await request.text();
    
    // Get the signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event (no PHI)
    console.log('Webhook received:', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString(),
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', {
    session_id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    metadata: session.metadata,
  });

  // If database is configured, store membership record
  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');
      
      const planTier = session.metadata?.plan_tier || 'unknown';
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      await sql`
        INSERT INTO memberships (
          stripe_customer_id,
          stripe_subscription_id,
          plan_tier,
          subscription_status,
          created_at,
          updated_at
        ) VALUES (
          ${customerId},
          ${subscriptionId},
          ${planTier},
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (stripe_subscription_id) 
        DO UPDATE SET
          subscription_status = 'active',
          updated_at = NOW()
      `;

      console.log('Membership record created/updated');
    } catch (dbError) {
      console.error('Failed to update membership database:', dbError);
      // Don't fail the webhook - Stripe considers it processed
    }
  }

  // TODO: Send welcome email with next steps
  // TODO: Trigger onboarding workflow
}

/**
 * Handle subscription status updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', {
    subscription_id: subscription.id,
    status: subscription.status,
    customer: subscription.customer,
  });

  // Update database if configured
  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');
      
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

      await sql`
        UPDATE memberships
        SET 
          subscription_status = ${subscription.status},
          updated_at = NOW()
        WHERE stripe_subscription_id = ${subscription.id}
      `;

      console.log('Membership status updated');
    } catch (dbError) {
      console.error('Failed to update membership status:', dbError);
    }
  }

  // Handle specific status changes
  if (subscription.status === 'past_due') {
    // TODO: Send payment failed notification
    console.log('Subscription past due - notification needed');
  } else if (subscription.status === 'canceled') {
    // TODO: Send cancellation confirmation
    console.log('Subscription cancelled - confirmation needed');
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', {
    subscription_id: subscription.id,
    customer: subscription.customer,
  });

  // Update database if configured
  if (process.env.POSTGRES_URL) {
    try {
      const { sql } = await import('@vercel/postgres');

      await sql`
        UPDATE memberships
        SET 
          subscription_status = 'cancelled',
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE stripe_subscription_id = ${subscription.id}
      `;

      console.log('Membership marked as cancelled');
    } catch (dbError) {
      console.error('Failed to mark membership as cancelled:', dbError);
    }
  }

  // TODO: Send cancellation confirmation email
  // TODO: Update Healthie patient status (optional)
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', {
    invoice_id: invoice.id,
    customer: invoice.customer,
    subscription: (invoice as { subscription?: string | Stripe.Subscription | null }).subscription,
    amount: invoice.amount_paid,
  });

  // TODO: Send payment receipt (optional - Stripe already sends one)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', {
    invoice_id: invoice.id,
    customer: invoice.customer,
    subscription: (invoice as { subscription?: string | Stripe.Subscription | null }).subscription,
    attempt_count: invoice.attempt_count,
  });

  // TODO: Send payment failed notification
  // TODO: Provide payment update link
}
