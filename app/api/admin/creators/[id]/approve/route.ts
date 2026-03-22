import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@vercel/postgres'
import { verifyAdminAuth } from '@/lib/auth'
import {
  getCreatorById,
  createAdminAction,
  updateAffiliateCodeStripeIds,
  updateCreatorRecruitCount,
  updateCreatorTier,
} from '@/lib/creators/db'
import { generateCreatorCodes, getTierForRecruitCount } from '@/lib/config/affiliate'

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
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: 'once',
      name: code,
      metadata: { source: 'cultr_affiliate', code },
    })

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

    // Generate default slug from name
    const defaultSlug = creator.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + Math.floor(Math.random() * 1000)

    // Generate dual coupon codes from last name
    const baseName = generateCreatorCodes(creator.full_name).membershipCode

    // Atomic transaction: status + tracking link + both affiliate codes
    // Collision handling is inside the transaction to prevent race conditions
    const client = await db.connect()
    let membershipCode = baseName
    let productCode = `${baseName}10`
    let membershipCodeId: string
    let productCodeId: string
    const maxRetries = 10

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await client.query('BEGIN')

        // Activate creator
        const now = new Date().toISOString()
        await client.query(
          `UPDATE creators SET
            status = 'active',
            approved_at = $1,
            creator_start_date = CASE WHEN creator_start_date IS NULL THEN $1::timestamptz ELSE creator_start_date END,
            approved_by = $2,
            updated_at = NOW()
          WHERE id = $3`,
          [now, auth.email, id]
        )

        // Create default tracking link (ON CONFLICT ignore if slug already exists)
        await client.query(
          `INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
           VALUES ($1, $2, '/', TRUE)
           ON CONFLICT (slug) DO NOTHING`,
          [id, defaultSlug.toLowerCase()]
        )

        // Create membership code
        const memberResult = await client.query(
          `INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
           VALUES ($1, $2, TRUE, 'percentage', 10.00, 'membership') RETURNING id`,
          [id, membershipCode.toUpperCase()]
        )
        membershipCodeId = memberResult.rows[0].id

        // Create product code
        const productResult = await client.query(
          `INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
           VALUES ($1, $2, FALSE, 'percentage', 10.00, 'product') RETURNING id`,
          [id, productCode.toUpperCase()]
        )
        productCodeId = productResult.rows[0].id

        await client.query('COMMIT')
        break // Success — exit retry loop
      } catch (error) {
        await client.query('ROLLBACK')

        // Check if this is a unique constraint violation on affiliate_codes
        const isCodeCollision = error instanceof Error &&
          error.message.includes('idx_affiliate_codes_code')
        if (isCodeCollision && attempt < maxRetries - 1) {
          // Retry with incremented suffix
          const suffix = attempt + 1
          membershipCode = `${baseName}${suffix}`
          productCode = `${baseName}${suffix}10`
          continue
        }

        console.error('Creator approval transaction failed:', error)
        client.release()
        return NextResponse.json({ error: 'Failed to approve creator — rolled back' }, { status: 500 })
      }
    }
    client.release()

    // Update recruiter's tier if this creator has one (non-blocking)
    if (creator.recruiter_id) {
      try {
        const newCount = await updateCreatorRecruitCount(creator.recruiter_id)
        const tierConfig = getTierForRecruitCount(newCount)
        await updateCreatorTier(creator.recruiter_id, tierConfig.tier, tierConfig.overrideRate)
      } catch (err) {
        console.error('Failed to update recruiter tier (non-fatal):', err)
      }
    }

    // Stripe sync (non-blocking — approval already committed)
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe()

      const [membershipStripe, productStripe] = await Promise.all([
        createStripePromotionCode(stripe, membershipCode, 10),
        createStripePromotionCode(stripe, productCode, 10),
      ])

      if (membershipStripe) {
        await updateAffiliateCodeStripeIds(
          membershipCodeId,
          membershipStripe.couponId,
          membershipStripe.promotionCodeId
        ).catch((err) => console.error('Failed to store membership Stripe IDs:', err))
      }

      if (productStripe) {
        await updateAffiliateCodeStripeIds(
          productCodeId,
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
