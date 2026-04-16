import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getMemberDetails, deleteMembershipByCustomerId, logAdminAction } from '@/lib/db'

/**
 * DELETE /api/admin/members/[customerId]
 * Delete a local membership record by stripe_customer_id.
 * Does NOT cancel any active Stripe subscription -- the admin should use the
 * Cancel action first if the subscription is still active.
 * Requires admin authentication. Every successful delete is audited.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Auth check (same pattern as cancel/pause/upgrade routes)
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

    // Verify membership exists
    const membership = await getMemberDetails(customerId)
    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found for this customer' },
        { status: 404 }
      )
    }

    // Delete the local membership record
    const deleted = await deleteMembershipByCustomerId(customerId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete membership record' },
        { status: 500 }
      )
    }

    // Audit log
    await logAdminAction(
      'delete_membership',
      customerId,
      {
        email: membership.stripe_subscription_id,
        plan_tier: membership.plan_tier,
        subscription_status: membership.subscription_status,
        stripe_subscription_id: membership.stripe_subscription_id,
      },
      session.email
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin membership delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete membership' },
      { status: 500 }
    )
  }
}
