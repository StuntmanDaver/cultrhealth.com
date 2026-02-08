import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import {
  getCreatorById,
  updateCreatorStatus,
  createTrackingLink,
  createAffiliateCode,
  createAdminAction,
} from '@/lib/creators/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const creator = await getCreatorById(id)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.status === 'active') {
      return NextResponse.json({ error: 'Creator is already active' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { coupon_code, reason } = body as { coupon_code?: string; reason?: string }

    // Approve the creator
    await updateCreatorStatus(id, 'active', auth.email)

    // Generate default slug from name
    const defaultSlug = creator.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + Math.floor(Math.random() * 1000)

    // Create default tracking link
    await createTrackingLink(id, defaultSlug, '/', true)

    // Create affiliate code if provided, otherwise auto-generate
    const code = coupon_code || creator.full_name
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 6) + '10'

    await createAffiliateCode(id, code, true)

    // Log admin action
    await createAdminAction({
      admin_email: auth.email,
      action_type: 'approve_creator',
      entity_type: 'creator',
      entity_id: id,
      reason,
      metadata: { coupon_code: code, default_slug: defaultSlug },
    })

    return NextResponse.json({
      success: true,
      message: 'Creator approved',
      trackingSlug: defaultSlug,
      couponCode: code,
    })
  } catch (error) {
    console.error('Admin approve creator error:', error)
    return NextResponse.json({ error: 'Failed to approve creator' }, { status: 500 })
  }
}
