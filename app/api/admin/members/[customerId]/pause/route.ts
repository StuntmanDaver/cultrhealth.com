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
 * POST /api/admin/members/[customerId]/pause
 * Pause a member's subscription via Stripe pause_collection.
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
    const { resumeDate } = body

    if (!resumeDate) {
      return NextResponse.json({ error: 'resumeDate is required (ISO date string)' }, { status: 400 })
    }

    const resumeTimestamp = Math.floor(new Date(resumeDate).getTime() / 1000)
    if (isNaN(resumeTimestamp) || resumeTimestamp <= Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'resumeDate must be a valid future date' }, { status: 400 })
    }

    // Look up membership
    const membership = await getMemberDetails(customerId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found for this customer' }, { status: 404 })
    }

    if (membership.subscription_status === 'cancelled' || membership.subscription_status === 'canceled') {
      return NextResponse.json({ error: 'Cannot pause a cancelled subscription' }, { status: 400 })
    }

    if (membership.subscription_status === 'paused') {
      return NextResponse.json({ error: 'Subscription is already paused' }, { status: 400 })
    }

    // Pause in Stripe
    const stripe = getStripe()
    try {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        pause_collection: {
          behavior: 'void',
          resumes_at: resumeTimestamp,
        },
      })
    } catch (stripeError) {
      const msg = stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
      console.error('Stripe pause failed:', msg)
      return NextResponse.json(
        { error: `Stripe pause failed: ${msg}` },
        { status: 502 }
      )
    }

    // Update local DB
    await updateMembershipBySubscriptionId(membership.stripe_subscription_id, {
      subscription_status: 'paused',
    })

    // Log admin action
    await logAdminAction('pause_subscription', customerId, {
      resumeDate,
      stripe_subscription_id: membership.stripe_subscription_id,
      previous_status: membership.subscription_status,
      plan_tier: membership.plan_tier,
    }, session.email)

    return NextResponse.json({
      success: true,
      message: 'Subscription paused successfully',
      customerId,
      subscriptionId: membership.stripe_subscription_id,
      resumeDate,
    })
  } catch (error) {
    console.error('Pause subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to pause subscription' },
      { status: 500 }
    )
  }
}
