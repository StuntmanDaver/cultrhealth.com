import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getMemberDetails, updateMembershipBySubscriptionId, logAdminAction } from '@/lib/db'
import { PLANS } from '@/lib/config/plans'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

/** Map tier slug to Stripe price ID from plan config */
function getPriceIdForTier(tier: string): string | null {
  const plan = PLANS.find(p => p.slug === tier)
  return plan?.stripePriceId || null
}

/**
 * POST /api/admin/members/[customerId]/upgrade
 * Change a member's subscription plan tier via Stripe and update the local DB.
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
    const { newTier } = body

    // Validate tier
    const validTiers = ['core', 'catalyst', 'concierge']
    if (!newTier || !validTiers.includes(newTier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      )
    }

    const newPriceId = getPriceIdForTier(newTier)
    if (!newPriceId) {
      return NextResponse.json(
        { error: `No Stripe price ID configured for tier: ${newTier}` },
        { status: 400 }
      )
    }

    // Look up membership
    const membership = await getMemberDetails(customerId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found for this customer' }, { status: 404 })
    }

    if (membership.subscription_status === 'cancelled' || membership.subscription_status === 'canceled') {
      return NextResponse.json({ error: 'Cannot upgrade a cancelled subscription' }, { status: 400 })
    }

    if (membership.plan_tier === newTier) {
      return NextResponse.json({ error: `Member is already on the ${newTier} tier` }, { status: 400 })
    }

    // Retrieve current subscription to get item ID
    const stripe = getStripe()
    let currentSubscription: Stripe.Subscription
    try {
      currentSubscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
    } catch (stripeError) {
      const msg = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
      console.error('Stripe subscription retrieve failed:', msg)
      return NextResponse.json(
        { error: `Failed to retrieve subscription from Stripe: ${msg}` },
        { status: 502 }
      )
    }

    const currentItem = currentSubscription.items.data[0]
    if (!currentItem) {
      return NextResponse.json(
        { error: 'No subscription items found on this subscription' },
        { status: 400 }
      )
    }

    // Update the subscription item to the new price
    try {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      })
    } catch (stripeError) {
      const msg = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
      console.error('Stripe upgrade failed:', msg)
      return NextResponse.json(
        { error: `Stripe plan change failed: ${msg}` },
        { status: 502 }
      )
    }

    // Update local DB
    await updateMembershipBySubscriptionId(membership.stripe_subscription_id, {
      plan_tier: newTier,
    })

    // Log admin action
    await logAdminAction('upgrade_subscription', customerId, {
      previous_tier: membership.plan_tier,
      new_tier: newTier,
      stripe_subscription_id: membership.stripe_subscription_id,
      new_price_id: newPriceId,
    }, session.email)

    return NextResponse.json({
      success: true,
      message: `Subscription changed to ${newTier} successfully`,
      customerId,
      subscriptionId: membership.stripe_subscription_id,
      previousTier: membership.plan_tier,
      newTier,
    })
  } catch (error) {
    console.error('Upgrade subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}
