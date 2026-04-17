import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@vercel/postgres'
import { Resend } from 'resend'
import { createMagicLinkToken, verifyAdminAuth } from '@/lib/auth'
import {
  getCreatorById,
  createAdminAction,
  updateAffiliateCodeStripeIds,
  updateCreatorRecruitCount,
  updateCreatorTier,
} from '@/lib/creators/db'
import { generateCreatorCodes, getTierForRecruitCount } from '@/lib/config/affiliate'
import { baseEmailTemplate, escapeHtml } from '@/lib/resend'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

async function sendCreatorApprovalEmail(
  request: NextRequest,
  creator: { email: string; full_name: string },
  assets: { defaultSlug: string; membershipCode: string; productCode: string }
) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Creator approval email failed: RESEND_API_KEY not configured')
    return
  }

  const baseUrl = getBaseUrl(request)
  const token = await createMagicLinkToken(creator.email)
  const magicLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}`
  const trackingLink = `https://cultrclub.com/${assets.defaultSlug}`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'
  const safeName = escapeHtml(creator.full_name)

  const content = `
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hi ${safeName},</p>
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your creator account has been approved. Your default tracking link and launch codes are ready below.</p>
    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(183,228,199,0.2); border-radius: 14px; padding: 18px; margin-bottom: 24px;">
      <p style="color: #FDFBF7; font-size: 14px; margin: 0 0 10px;"><strong>Tracking link:</strong> ${trackingLink}</p>
      <p style="color: #FDFBF7; font-size: 14px; margin: 0 0 10px;"><strong>Membership code:</strong> ${assets.membershipCode}</p>
      <p style="color: #FDFBF7; font-size: 14px; margin: 0;"><strong>Product code:</strong> ${assets.productCode}</p>
    </div>
    <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">Open Creator Portal</a>
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 32px;">This link expires in 15 minutes. You can always request a new one at <a href="${baseUrl}/creators/login" style="color: #B7E4C7;">cultrhealth.com/creators/login</a>.</p>
  `

  const result = await resend.emails.send({
    from: fromEmail,
    to: creator.email,
    subject: 'You’re Approved for the CULTR Creator Program',
    html: baseEmailTemplate(content),
  })

  if (result.error) {
    throw new Error(result.error.message || 'Unknown Resend error')
  }
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

    if (creator.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending creators can be approved' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    // Generate default slug from name
    let defaultSlug = creator.full_name
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

        // Create default tracking link
        await client.query(
          `INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
           VALUES ($1, $2, '/', TRUE)`,
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

        // Retry on slug collision
        const isSlugCollision = error instanceof Error &&
          error.message.includes('idx_tracking_links_slug')
        if (isSlugCollision && attempt < maxRetries - 1) {
          defaultSlug = creator.full_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20) + Math.floor(Math.random() * 10000)
          continue
        }

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

    try {
      await sendCreatorApprovalEmail(request, creator, {
        defaultSlug,
        membershipCode,
        productCode,
      })
    } catch (emailError) {
      console.error('Creator approval email failed:', emailError)
    }

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
