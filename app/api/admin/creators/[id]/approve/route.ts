import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAdminAuth } from '@/lib/auth'
import {
  getCreatorById,
  updateCreatorStatus,
  createTrackingLink,
  createAffiliateCode,
  createAdminAction,
  checkAffiliateCodeExists,
  updateAffiliateCodeStripeIds,
} from '@/lib/creators/db'
import { generateCreatorCodes } from '@/lib/config/affiliate'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

async function createStripePromotionCode(
  stripe: Stripe,
  code: string,
  percentOff: number
): Promise<{ couponId: string; promotionCodeId: string } | null> {
  try {
    // Create a Stripe coupon named after the code
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: 'once',
      name: code,
      metadata: { source: 'cultr_affiliate', code },
    })

    // Create a promotion code customers can enter at checkout
    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code: code,
      metadata: { source: 'cultr_affiliate', code },
    })

    return { couponId: coupon.id, promotionCodeId: promotionCode.id }
  } catch (error) {
    console.error(`Failed to create Stripe promotion code for ${code}:`, error)
    return null
  }
}

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
    const { reason } = body as { reason?: string }

    // Approve the creator
    await updateCreatorStatus(id, 'active', auth.email)

    // Generate default slug from name
    const defaultSlug = creator.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + Math.floor(Math.random() * 1000)

    // Create default tracking link
    await createTrackingLink(id, defaultSlug, '/', true)

    // Generate dual coupon codes from last name
    let { membershipCode, productCode } = generateCreatorCodes(creator.full_name)

    // Handle naming collisions — append number suffix if either code already exists
    let suffix = 1
    const baseName = generateCreatorCodes(creator.full_name).membershipCode
    while (
      await checkAffiliateCodeExists(membershipCode) ||
      await checkAffiliateCodeExists(productCode)
    ) {
      membershipCode = `${baseName}${suffix}`
      productCode = `${baseName}${suffix}10`
      suffix++
    }

    // Create membership code (e.g., SMITH)
    const membershipAffCode = await createAffiliateCode(id, membershipCode, true, 'percentage', 10.00, 'membership')

    // Create product code (e.g., SMITH10)
    const productAffCode = await createAffiliateCode(id, productCode, false, 'percentage', 10.00, 'product')

    // Sync codes to Stripe as promotion codes (non-blocking — approval succeeds even if Stripe sync fails)
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe()

      const [membershipStripe, productStripe] = await Promise.all([
        createStripePromotionCode(stripe, membershipCode, 10),
        createStripePromotionCode(stripe, productCode, 10),
      ])

      // Store Stripe IDs for future management (deactivation, etc.)
      if (membershipStripe) {
        await updateAffiliateCodeStripeIds(
          membershipAffCode.id,
          membershipStripe.couponId,
          membershipStripe.promotionCodeId
        ).catch((err) => console.error('Failed to store membership Stripe IDs:', err))
      }

      if (productStripe) {
        await updateAffiliateCodeStripeIds(
          productAffCode.id,
          productStripe.couponId,
          productStripe.promotionCodeId
        ).catch((err) => console.error('Failed to store product Stripe IDs:', err))
      }
    }

    // Log admin action
    await createAdminAction({
      admin_email: auth.email,
      action_type: 'approve_creator',
      entity_type: 'creator',
      entity_id: id,
      reason,
      metadata: {
        membership_code: membershipCode,
        product_code: productCode,
        default_slug: defaultSlug,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Creator approved',
      trackingSlug: defaultSlug,
      membershipCode,
      productCode,
    })
  } catch (error) {
    console.error('Admin approve creator error:', error)
    return NextResponse.json({ error: 'Failed to approve creator' }, { status: 500 })
  }
}
