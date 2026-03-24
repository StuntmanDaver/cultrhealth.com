import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getMemberDetails, updateMembershipBySubscriptionId, logAdminAction } from '@/lib/db'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

/**
 * POST /api/admin/members/[customerId]/cancel
 * Cancel a member's subscription via Stripe and update the local DB.
 * Requires admin authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Auth check
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { customerId } = await params
    const body = await request.json()
    const reason = body.reason || ''

    // Look up membership
    const membership = await getMemberDetails(customerId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found for this customer' }, { status: 404 })
    }

    if (membership.subscription_status === 'cancelled' || membership.subscription_status === 'canceled') {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 })
    }

    // Cancel in Stripe
    const stripe = getStripe()
    try {
      await stripe.subscriptions.cancel(membership.stripe_subscription_id)
    } catch (stripeError) {
      const msg = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
      console.error('Stripe cancellation failed:', msg)
      return NextResponse.json(
        { error: `Stripe cancellation failed: ${msg}` },
        { status: 502 }
      )
    }

    // Update local DB
    await updateMembershipBySubscriptionId(membership.stripe_subscription_id, {
      subscription_status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: reason || 'Admin cancelled',
    })

    // Log admin action
    await logAdminAction('cancel_subscription', customerId, {
      reason,
      stripe_subscription_id: membership.stripe_subscription_id,
      previous_status: membership.subscription_status,
      plan_tier: membership.plan_tier,
    }, session.email)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      customerId,
      subscriptionId: membership.stripe_subscription_id,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
