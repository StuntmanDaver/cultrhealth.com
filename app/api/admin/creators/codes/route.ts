import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { RESERVED_COUPON_CODES } from '@/lib/config/coupons'
import {
  createAffiliateCode,
  deactivateAffiliateCode,
  getAffiliateCodesByCreator,
  getAllActiveCreators,
  updateAffiliateCodeStripeIds,
  createAdminAction,
} from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // Support listing active creators for dropdowns
    if (searchParams.get('list_active') === 'true') {
      const creators = await getAllActiveCreators()
      return NextResponse.json({
        creators: creators.map(c => ({ id: c.id, full_name: c.full_name })),
      })
    }

    const creatorId = searchParams.get('creator_id')

    if (!creatorId) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 })
    }

    const codes = await getAffiliateCodesByCreator(creatorId)
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Admin codes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { creator_id, code, discount_type, discount_value, is_primary, code_type } = body

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    if (RESERVED_COUPON_CODES.has(normalizedCode)) {
      return NextResponse.json(
        { error: 'Code is reserved for built-in coupon handling and cannot be created in admin.' },
        { status: 409 }
      )
    }

    // Validate discount value range
    if (discount_value !== undefined && (discount_value < 1 || discount_value > 100)) {
      return NextResponse.json({ error: 'Discount value must be between 1 and 100' }, { status: 400 })
    }

    // Validate code_type if provided
    const validCodeTypes = ['membership', 'product', 'general']
    if (code_type && !validCodeTypes.includes(code_type)) {
      return NextResponse.json({ error: `Invalid code_type. Must be one of: ${validCodeTypes.join(', ')}` }, { status: 400 })
    }

    // For company-owned codes without a creator_id, create directly in DB
    if (!creator_id) {
      const { sql } = await import('@vercel/postgres')
      const effectiveType = discount_type || 'percentage'
      const effectiveValue = discount_value || 10
      const effectiveCodeType = code_type || 'membership'

      // Check for duplicate
      const existing = await sql`SELECT id FROM affiliate_codes WHERE UPPER(code) = ${normalizedCode}`
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
      }

      const result = await sql`
        INSERT INTO affiliate_codes (code, creator_id, is_primary, discount_type, discount_value, code_type, program_type, active)
        VALUES (${normalizedCode}, NULL, FALSE, ${effectiveType}, ${effectiveValue}, ${effectiveCodeType}, 'company', TRUE)
        RETURNING id, code
      `

      await createAdminAction({
        admin_email: auth.email,
        action_type: 'create_company_code',
        entity_type: 'affiliate_code',
        entity_id: result.rows[0].id,
        metadata: { code: normalizedCode, discount_value: effectiveValue, code_type: effectiveCodeType },
      })

      return NextResponse.json({ code: result.rows[0] }, { status: 201 })
    }

    const newCode = await createAffiliateCode(
      creator_id,
      normalizedCode,
      is_primary || false,
      discount_type || 'percentage',
      discount_value || 10.00,
      code_type || 'general'
    )

    // Sync to Stripe (non-blocking)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        const effectiveType = discount_type || 'percentage'
        const effectiveValue = discount_value || 10

        const couponParams: Record<string, unknown> = {
          duration: 'once',
          name: normalizedCode,
          metadata: { source: 'cultr_affiliate_manual', code: normalizedCode },
        }
        if (effectiveType === 'percentage') {
          couponParams.percent_off = effectiveValue
        } else {
          couponParams.amount_off = Math.round(effectiveValue * 100) // Stripe uses cents
          couponParams.currency = 'usd'
        }

        const coupon = await stripe.coupons.create(couponParams)
        const promo = await stripe.promotionCodes.create({
          promotion: { type: 'coupon', coupon: coupon.id },
          code: normalizedCode,
          metadata: { source: 'cultr_affiliate_manual' },
        })
        await updateAffiliateCodeStripeIds(newCode.id, coupon.id, promo.id)
      } catch (stripeErr) {
        console.error('Stripe sync for manual code failed (non-fatal):', stripeErr)
      }
    }

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'create_affiliate_code',
      entity_type: 'affiliate_code',
      entity_id: newCode.id,
      metadata: { creator_id, code: normalizedCode },
    })

    return NextResponse.json({ code: newCode }, { status: 201 })
  } catch (error) {
    console.error('Admin code creation error:', error)
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code_id, active } = body

    if (!code_id || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'code_id and active (boolean) are required' }, { status: 400 })
    }

    const { sql } = await import('@vercel/postgres')
    const result = await sql`UPDATE affiliate_codes SET active = ${active}, updated_at = NOW() WHERE id = ${code_id} RETURNING stripe_promotion_code_id`

    // Sync active status to Stripe (non-blocking)
    const stripePromoId = result.rows[0]?.stripe_promotion_code_id
    if (stripePromoId && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.promotionCodes.update(stripePromoId, { active })
      } catch (stripeErr) {
        console.error(`Failed to sync Stripe promotion code ${stripePromoId} active=${active} (non-fatal):`, stripeErr)
      }
    }

    await createAdminAction({
      admin_email: auth.email,
      action_type: active ? 'activate_affiliate_code' : 'deactivate_affiliate_code',
      entity_type: 'affiliate_code',
      entity_id: code_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin code toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle code' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const codeId = searchParams.get('code_id')

    if (!codeId) {
      return NextResponse.json({ error: 'code_id is required' }, { status: 400 })
    }

    const { sql } = await import('@vercel/postgres')
    const existingCode = await sql`
      SELECT code, use_count, stripe_promotion_code_id
      FROM affiliate_codes
      WHERE id = ${codeId}
      LIMIT 1
    `

    if (existingCode.rows.length === 0) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    const codeRow = existingCode.rows[0]
    const usageResult = await sql`
      SELECT
        EXISTS(SELECT 1 FROM order_attributions WHERE code_id = ${codeId}) AS has_attributions,
        EXISTS(SELECT 1 FROM club_orders WHERE UPPER(coupon_code) = UPPER(${codeRow.code})) AS has_orders
    `

    const hasHistoricalUsage =
      Number(codeRow.use_count || 0) > 0 ||
      Boolean(usageResult.rows[0]?.has_attributions) ||
      Boolean(usageResult.rows[0]?.has_orders)

    let removal: 'deleted' | 'deactivated'

    if (hasHistoricalUsage) {
      const deactivated = await deactivateAffiliateCode(codeId)
      if (!deactivated) {
        return NextResponse.json({ error: 'Code not found' }, { status: 404 })
      }
      removal = 'deactivated'
    } else {
      const stripePromoId = codeRow.stripe_promotion_code_id
      if (stripePromoId && process.env.STRIPE_SECRET_KEY) {
        try {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
          await stripe.promotionCodes.update(stripePromoId, { active: false })
        } catch (stripeErr) {
          console.error(`Failed to deactivate Stripe promotion code ${stripePromoId} before delete (non-fatal):`, stripeErr)
        }
      }

      await sql`DELETE FROM affiliate_codes WHERE id = ${codeId}`
      removal = 'deleted'
    }

    await createAdminAction({
      admin_email: auth.email,
      action_type: removal === 'deleted' ? 'delete_affiliate_code' : 'deactivate_affiliate_code',
      entity_type: 'affiliate_code',
      entity_id: codeId,
    })

    return NextResponse.json({ success: true, removal })
  } catch (error) {
    console.error('Admin code removal error:', error)
    return NextResponse.json({ error: 'Failed to remove code' }, { status: 500 })
  }
}
