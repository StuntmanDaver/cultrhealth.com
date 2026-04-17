import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@vercel/postgres'
import { Resend } from 'resend'
import { createMagicLinkToken, verifyAdminAuth } from '@/lib/auth'
import {
  createAdminAction,
  updateAffiliateCodeStripeIds,
} from '@/lib/creators/db'
import { generateCreatorCodes } from '@/lib/config/affiliate'
import { baseEmailTemplate, escapeHtml } from '@/lib/resend'

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

async function sendCreatorWelcomeEmail(
  request: NextRequest,
  creator: { email: string; full_name: string },
  assets: { defaultSlug: string; membershipCode: string; productCode: string }
) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Creator welcome notification skipped: RESEND_API_KEY not configured')
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
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your CULTR Creator account is live. Your default tracking link and launch codes are ready below.</p>
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
    subject: 'Welcome to the CULTR Creator Program',
    html: baseEmailTemplate(content),
  })

  if (result.error) {
    throw new Error(result.error.message || 'Unknown Resend error')
  }
}

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

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { full_name, email, phone, social_handle, commission_rate, custom_code, discount_percent } = body as {
      full_name: string
      email: string
      phone?: string
      social_handle?: string
      commission_rate?: number
      custom_code?: string
      discount_percent?: number
    }

    if (!full_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const commRate = commission_rate ?? 10
    const discountPct = discount_percent ?? 10

    if (commRate < 0 || commRate > 50) {
      return NextResponse.json({ error: 'Commission rate must be 0-50%' }, { status: 400 })
    }
    if (discountPct < 0 || discountPct > 60) {
      return NextResponse.json({ error: 'Discount must be 0-60%' }, { status: 400 })
    }

    // Generate codes — use custom code or auto-generate from name
    const generated = generateCreatorCodes(full_name)
    let membershipCode = custom_code?.trim().toUpperCase() || generated.membershipCode
    let productCode = custom_code
      ? `${custom_code.trim().toUpperCase()}10`
      : generated.productCode

    // Generate slug from name
    let defaultSlug = full_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + Math.floor(Math.random() * 1000)

    // Atomic transaction: create creator + activate + codes + tracking link
    const client = await db.connect()
    let creatorId: string
    let membershipCodeId: string
    let productCodeId: string
    const maxRetries = 10
    const now = new Date().toISOString()

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await client.query('BEGIN')

        // Check if creator already exists
        const existing = await client.query(
          `SELECT id, status FROM creators WHERE lower(email) = $1`,
          [email.trim().toLowerCase()]
        )

        if (existing.rows.length > 0) {
          await client.query('ROLLBACK')
          client.release()
          return NextResponse.json(
            { error: `Creator with email ${email} already exists (status: ${existing.rows[0].status})` },
            { status: 409 }
          )
        }

        // Insert creator as active
        const creatorResult = await client.query(
          `INSERT INTO creators (email, full_name, phone, social_handle, status, commission_rate, approved_at, approved_by, creator_start_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $6::timestamptz, NOW(), NOW())
           RETURNING id`,
          [email.trim().toLowerCase(), full_name.trim(), phone?.trim() || null, social_handle?.trim() || null, commRate, now, auth.email]
        )
        creatorId = creatorResult.rows[0].id

        // Create default tracking link
        await client.query(
          `INSERT INTO tracking_links (creator_id, slug, destination_path, is_default)
           VALUES ($1, $2, '/', TRUE)`,
          [creatorId, defaultSlug.toLowerCase()]
        )

        // Create membership code
        const memberResult = await client.query(
          `INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
           VALUES ($1, $2, TRUE, 'percentage', $3, 'membership') RETURNING id`,
          [creatorId, membershipCode, discountPct]
        )
        membershipCodeId = memberResult.rows[0]?.id

        // Create product code
        const productResult = await client.query(
          `INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
           VALUES ($1, $2, FALSE, 'percentage', $3, 'product') RETURNING id`,
          [creatorId, productCode, discountPct]
        )
        productCodeId = productResult.rows[0]?.id

        await client.query('COMMIT')
        break // Success
      } catch (error) {
        await client.query('ROLLBACK')

        // Retry on slug collision
        const isSlugCollision = error instanceof Error &&
          error.message.includes('idx_tracking_links_slug')
        if (isSlugCollision && attempt < maxRetries - 1) {
          defaultSlug = full_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20) + Math.floor(Math.random() * 10000)
          continue
        }

        // Retry on code collision
        const isCodeCollision = error instanceof Error &&
          error.message.includes('idx_affiliate_codes_code')
        if (isCodeCollision && attempt < maxRetries - 1) {
          const suffix = attempt + 1
          const base = custom_code?.trim().toUpperCase() || generated.membershipCode
          membershipCode = `${base}${suffix}`
          productCode = `${base}${suffix}10`
          continue
        }

        console.error('Add creator transaction failed:', error)
        client.release()
        return NextResponse.json({ error: 'Failed to add creator — rolled back' }, { status: 500 })
      }
    }
    client.release()

    // Stripe sync (non-blocking)
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe()

      const [membershipStripe, productStripe] = await Promise.all([
        createStripePromotionCode(stripe, membershipCode, discountPct),
        createStripePromotionCode(stripe, productCode, discountPct),
      ])

      if (membershipStripe) {
        await updateAffiliateCodeStripeIds(
          membershipCodeId!,
          membershipStripe.couponId,
          membershipStripe.promotionCodeId
        ).catch((err) => console.error('Failed to store membership Stripe IDs:', err))
      }

      if (productStripe) {
        await updateAffiliateCodeStripeIds(
          productCodeId!,
          productStripe.couponId,
          productStripe.promotionCodeId
        ).catch((err) => console.error('Failed to store product Stripe IDs:', err))
      }
    }

    // Log admin action
    await createAdminAction({
      admin_email: auth.email,
      action_type: 'add_creator',
      entity_type: 'creator',
      entity_id: creatorId!,
      metadata: {
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        commission_rate: commRate,
        discount_percent: discountPct,
        membership_code: membershipCode,
        product_code: productCode,
        default_slug: defaultSlug,
      },
    })

    // Welcome email (non-blocking — creator is already created)
    try {
      await sendCreatorWelcomeEmail(
        request,
        { email: email.trim().toLowerCase(), full_name: full_name.trim() },
        { defaultSlug, membershipCode, productCode }
      )
    } catch (emailError) {
      console.error('Creator welcome email failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Creator ${full_name} added and activated`,
      creatorId: creatorId!,
      membershipCode,
      productCode,
      trackingSlug: defaultSlug,
    })
  } catch (error) {
    console.error('Admin add creator error:', error)
    return NextResponse.json({ error: 'Failed to add creator' }, { status: 500 })
  }
}
