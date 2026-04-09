import { sql } from '@vercel/postgres'
import { DatabaseError } from '@/lib/db'
import type {
  Creator,
  CreatorStatus,
  AffiliateCode,
  CodeType,
  TrackingLink,
  ClickEvent,
  OrderAttribution,
  CommissionLedgerEntry,
  CommissionType,
  CommissionStatus,
  AttributionMethod,
  PortfolioEntry,
  Payout,
  PayoutMethod,
} from '@/lib/config/affiliate'

// ===========================================
// CREATOR CRUD
// ===========================================

export interface CreateCreatorInput {
  email: string
  full_name: string
  phone?: string
  social_handle?: string
  bio?: string
  recruiter_id?: string
  age?: number
  gender?: string
}

export async function createCreator(input: CreateCreatorInput): Promise<Creator> {
  try {
    const result = await sql`
      INSERT INTO creators (email, full_name, phone, social_handle, bio, recruiter_id, age, gender, status, created_at, updated_at)
      VALUES (
        ${input.email.toLowerCase()},
        ${input.full_name},
        ${input.phone || null},
        ${input.social_handle || null},
        ${input.bio || null},
        ${input.recruiter_id || null},
        ${input.age || null},
        ${input.gender || null},
        'pending',
        NOW(), NOW()
      )
      ON CONFLICT ((lower(email)))
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, creators.phone),
        social_handle = COALESCE(EXCLUDED.social_handle, creators.social_handle),
        bio = COALESCE(EXCLUDED.bio, creators.bio),
        age = COALESCE(EXCLUDED.age, creators.age),
        gender = COALESCE(EXCLUDED.gender, creators.gender),
        updated_at = NOW()
      RETURNING *
    `
    return result.rows[0] as Creator
  } catch (error) {
    console.error('Database error creating creator:', error)
    throw new DatabaseError('Failed to create creator', error)
  }
}

export async function getCreatorByEmail(email: string): Promise<Creator | null> {
  try {
    const result = await sql`
      SELECT * FROM creators WHERE lower(email) = ${email.toLowerCase()}
    `
    return (result.rows[0] as Creator) || null
  } catch (error) {
    console.error('Database error fetching creator:', error)
    throw new DatabaseError('Failed to fetch creator', error)
  }
}

export async function getCreatorById(id: string): Promise<Creator | null> {
  try {
    const result = await sql`
      SELECT * FROM creators WHERE id = ${id}
    `
    return (result.rows[0] as Creator) || null
  } catch (error) {
    console.error('Database error fetching creator:', error)
    throw new DatabaseError('Failed to fetch creator', error)
  }
}

export async function getCreatorPhone(creatorId: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT phone FROM creators WHERE id = ${creatorId}
    `
    return result.rows[0]?.phone || null
  } catch (error) {
    console.error('Database error fetching creator phone:', error)
    throw new DatabaseError('Failed to fetch creator phone', error)
  }
}

export async function updateCreatorStatus(
  id: string,
  status: CreatorStatus,
  approvedBy?: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const result = await sql`
      UPDATE creators
      SET
        status = ${status},
        approved_at = ${status === 'active' ? now : null},
        creator_start_date = CASE
          WHEN ${status} = 'active' AND creator_start_date IS NULL THEN ${now}::timestamptz
          ELSE creator_start_date
        END,
        approved_by = ${approvedBy || null},
        updated_at = NOW()
      WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating creator status:', error)
    throw new DatabaseError('Failed to update creator status', error)
  }
}

export async function updateCreatorEmailVerified(id: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creators SET email_verified = TRUE, updated_at = NOW() WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error verifying creator account:', error instanceof Error ? error.message : 'unknown')
    throw new DatabaseError('Failed to verify creator email', error)
  }
}

export async function updateCreatorProfile(
  id: string,
  updates: {
    full_name?: string
    phone?: string
    social_handle?: string
    bio?: string
    payout_method?: PayoutMethod
    payout_destination_id?: string
  }
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creators
      SET
        full_name = COALESCE(${updates.full_name || null}, full_name),
        phone = COALESCE(${updates.phone || null}, phone),
        social_handle = COALESCE(${updates.social_handle || null}, social_handle),
        bio = COALESCE(${updates.bio || null}, bio),
        payout_method = COALESCE(${updates.payout_method || null}, payout_method),
        payout_destination_id = COALESCE(${updates.payout_destination_id || null}, payout_destination_id),
        updated_at = NOW()
      WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating creator profile:', error)
    throw new DatabaseError('Failed to update creator profile', error)
  }
}

export async function updateCreatorTier(
  id: string,
  tier: number,
  overrideRate: number
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creators
      SET tier = ${tier}, override_rate = ${overrideRate}, updated_at = NOW()
      WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating creator tier:', error)
    throw new DatabaseError('Failed to update creator tier', error)
  }
}

export async function updateCreatorRecruitCount(id: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE creators
      SET
        recruit_count = (
          SELECT COUNT(*) FROM creators WHERE recruiter_id = ${id} AND status = 'active'
        ),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING recruit_count
    `
    return result.rows[0]?.recruit_count ?? 0
  } catch (error) {
    console.error('Database error updating recruit count:', error)
    throw new DatabaseError('Failed to update recruit count', error)
  }
}

export async function getCreatorsByStatus(status: CreatorStatus, limit = 50): Promise<Creator[]> {
  try {
    const result = await sql`
      SELECT * FROM creators WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.rows as Creator[]
  } catch (error) {
    console.error('Database error fetching creators by status:', error)
    throw new DatabaseError('Failed to fetch creators', error)
  }
}

export async function getRecruitsByCreatorId(creatorId: string): Promise<Creator[]> {
  try {
    const result = await sql`
      SELECT * FROM creators WHERE recruiter_id = ${creatorId}
      ORDER BY created_at DESC
    `
    return result.rows as Creator[]
  } catch (error) {
    console.error('Database error fetching recruits:', error)
    throw new DatabaseError('Failed to fetch recruits', error)
  }
}

export async function getAllActiveCreators(limit = 200): Promise<Creator[]> {
  try {
    const result = await sql`
      SELECT * FROM creators WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.rows as Creator[]
  } catch (error) {
    console.error('Database error fetching active creators:', error)
    throw new DatabaseError('Failed to fetch active creators', error)
  }
}

// ===========================================
// AFFILIATE CODE CRUD
// ===========================================

// Reserved code names that cannot be used as affiliate codes (hardcoded in CLUB_COUPONS)
const RESERVED_CODES = new Set(['OWNER', 'CULTRSTAFF', 'CULTRFAM', 'CULTR10', 'SUMMER20', 'LOYALTY15', 'CULTR30'])

export async function createAffiliateCode(
  creatorId: string,
  code: string,
  isPrimary = false,
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue = 10.00,
  codeType: CodeType = 'general'
): Promise<AffiliateCode> {
  const normalized = code.toUpperCase()
  if (RESERVED_CODES.has(normalized)) {
    throw new DatabaseError(`Code "${normalized}" is reserved and cannot be used as an affiliate code`)
  }
  try {
    const result = await sql`
      INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value, code_type)
      VALUES (${creatorId}, ${normalized}, ${isPrimary}, ${discountType}, ${discountValue}, ${codeType})
      RETURNING *
    `
    return result.rows[0] as AffiliateCode
  } catch (error) {
    console.error('Database error creating affiliate code:', error)
    throw new DatabaseError('Failed to create affiliate code', error)
  }
}

export async function getAffiliateCodesByCreator(creatorId: string): Promise<AffiliateCode[]> {
  try {
    const result = await sql`
      SELECT * FROM affiliate_codes WHERE creator_id = ${creatorId} ORDER BY is_primary DESC, created_at ASC
    `
    return result.rows as AffiliateCode[]
  } catch (error) {
    console.error('Database error fetching affiliate codes:', error)
    throw new DatabaseError('Failed to fetch affiliate codes', error)
  }
}

export async function getAffiliateCodeByCode(code: string): Promise<AffiliateCode | null> {
  try {
    const result = await sql`
      SELECT * FROM affiliate_codes
      WHERE lower(code) = ${code.toLowerCase()}
        AND active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR use_count < max_uses)
    `
    return (result.rows[0] as AffiliateCode) || null
  } catch (error) {
    console.error('Database error fetching affiliate code:', error)
    throw new DatabaseError('Failed to fetch affiliate code', error)
  }
}

export async function getAffiliateCodeByStripeIds(params: {
  stripePromotionCodeId?: string
  stripeCouponId?: string
}): Promise<AffiliateCode | null> {
  const { stripePromotionCodeId, stripeCouponId } = params

  if (stripePromotionCodeId) {
    try {
      const result = await sql`
        SELECT * FROM affiliate_codes
        WHERE stripe_promotion_code_id = ${stripePromotionCodeId}
          AND active = TRUE
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_uses IS NULL OR use_count < max_uses)
        LIMIT 1
      `

      if (result.rows[0]) {
        return result.rows[0] as AffiliateCode
      }
    } catch (error) {
      console.error('Database error fetching affiliate code by Stripe promotion code ID:', error)
      throw new DatabaseError('Failed to fetch affiliate code by Stripe promotion code ID', error)
    }
  }

  if (!stripeCouponId) {
    return null
  }

  try {
    const result = await sql`
      SELECT * FROM affiliate_codes
      WHERE stripe_coupon_id = ${stripeCouponId}
        AND active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR use_count < max_uses)
      LIMIT 1
    `
    return (result.rows[0] as AffiliateCode) || null
  } catch (error) {
    console.error('Database error fetching affiliate code by Stripe coupon ID:', error)
    throw new DatabaseError('Failed to fetch affiliate code by Stripe coupon ID', error)
  }
}

export async function incrementCodeUsage(codeId: string, revenue: number): Promise<void> {
  try {
    await sql`
      UPDATE affiliate_codes
      SET use_count = use_count + 1, total_revenue = total_revenue + ${revenue}, updated_at = NOW()
      WHERE id = ${codeId}
    `
  } catch (error) {
    console.error('Database error incrementing code usage:', error)
    throw new DatabaseError('Failed to increment code usage', error)
  }
}

export async function getAffiliateCodeById(codeId: string): Promise<AffiliateCode | null> {
  try {
    const result = await sql`SELECT * FROM affiliate_codes WHERE id = ${codeId}`
    return (result.rows[0] as AffiliateCode) || null
  } catch (error) {
    console.error('Database error fetching affiliate code by ID:', error)
    throw new DatabaseError('Failed to fetch affiliate code', error)
  }
}

export async function deactivateAffiliateCode(codeId: string): Promise<boolean> {
  try {
    // Deactivate in DB
    const result = await sql`
      UPDATE affiliate_codes SET active = FALSE, updated_at = NOW() WHERE id = ${codeId}
      RETURNING stripe_promotion_code_id
    `
    if ((result.rowCount ?? 0) === 0) return false

    // Deactivate Stripe promotion code if it exists (non-blocking)
    const stripePromoId = result.rows[0]?.stripe_promotion_code_id
    if (stripePromoId && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.promotionCodes.update(stripePromoId, { active: false })
      } catch (stripeErr) {
        console.error(`Failed to deactivate Stripe promotion code ${stripePromoId} (non-fatal):`, stripeErr)
      }
    }

    return true
  } catch (error) {
    console.error('Database error deactivating affiliate code:', error)
    throw new DatabaseError('Failed to deactivate code', error)
  }
}

// ===========================================
// PRELAUNCH CODE FUNCTIONS
// ===========================================

export async function createPrelaunchCode(
  code: string,
  creatorId?: string | null,
  discountValue = 20.00,
  expiryDays = 14
): Promise<AffiliateCode> {
  const normalized = code.toUpperCase()
  if (RESERVED_CODES.has(normalized)) {
    throw new DatabaseError(`Code "${normalized}" is reserved and cannot be used`)
  }
  try {
    const result = await sql`
      INSERT INTO affiliate_codes (
        creator_id, code, is_primary, discount_type, discount_value,
        code_type, program_type, created_by_admin, expires_at
      )
      VALUES (
        ${creatorId || null},
        ${code.toUpperCase()},
        FALSE,
        'percentage',
        ${discountValue},
        'general',
        'prelaunch',
        TRUE,
        NOW() + make_interval(days => ${expiryDays})
      )
      RETURNING *
    `
    return result.rows[0] as AffiliateCode
  } catch (error) {
    console.error('Database error creating prelaunch code:', error)
    throw new DatabaseError('Failed to create prelaunch code', error)
  }
}

export interface PrelaunchCodeWithStats {
  id: string
  code: string
  creator_id: string | null
  creator_name: string | null
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  expires_at: string | null
  program_type: string
  created_at: string
  actual_usage_count: number
  actual_total_revenue: number
  actual_total_discount: number
  actual_avg_order_value: number
}

export async function getPrelaunchCodes(): Promise<PrelaunchCodeWithStats[]> {
  try {
    const result = await sql`
      SELECT
        ac.id, ac.code, ac.creator_id, ac.discount_value, ac.use_count,
        ac.total_revenue, ac.active, ac.expires_at, ac.program_type, ac.created_at,
        c.full_name as creator_name,
        COALESCE(stats.usage_count, 0)::int as actual_usage_count,
        COALESCE(stats.total_revenue, 0) as actual_total_revenue,
        COALESCE(stats.total_discount, 0) as actual_total_discount,
        COALESCE(stats.avg_order_value, 0) as actual_avg_order_value
      FROM affiliate_codes ac
      LEFT JOIN creators c ON ac.creator_id = c.id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int as usage_count,
          COALESCE(SUM(co.subtotal_usd), 0) as total_revenue,
          COALESCE(SUM(
            CASE WHEN co.discount_percent > 0 AND co.discount_percent < 100
            THEN co.subtotal_usd * co.discount_percent / (100.0 - co.discount_percent)
            ELSE 0 END
          ), 0) as total_discount,
          COALESCE(AVG(co.subtotal_usd), 0) as avg_order_value
        FROM club_orders co
        WHERE UPPER(co.coupon_code) = UPPER(ac.code)
      ) stats ON TRUE
      WHERE ac.program_type = 'prelaunch'
      ORDER BY ac.created_at DESC
    `
    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      creator_id: row.creator_id,
      creator_name: row.creator_name || null,
      discount_value: parseFloat(row.discount_value || '0'),
      use_count: parseInt(row.use_count, 10) || 0,
      total_revenue: parseFloat(row.total_revenue || '0'),
      active: row.active,
      expires_at: row.expires_at || null,
      program_type: row.program_type,
      created_at: row.created_at,
      actual_usage_count: parseInt(row.actual_usage_count, 10) || 0,
      actual_total_revenue: parseFloat(row.actual_total_revenue || '0'),
      actual_total_discount: parseFloat(row.actual_total_discount || '0'),
      actual_avg_order_value: parseFloat(row.actual_avg_order_value || '0'),
    })) as PrelaunchCodeWithStats[]
  } catch (error) {
    console.error('Database error fetching prelaunch codes:', error)
    throw new DatabaseError('Failed to fetch prelaunch codes', error)
  }
}

export interface PrelaunchRedemption {
  member_name: string
  member_email: string
  member_phone: string | null
  order_number: string
  subtotal_usd: number
  discount_percent: number
  status: string
  created_at: string
}

export async function getPrelaunchCodeRedemptions(codeString: string): Promise<PrelaunchRedemption[]> {
  try {
    const result = await sql`
      SELECT
        member_name, member_email, member_phone,
        order_number, subtotal_usd, discount_percent,
        status, created_at
      FROM club_orders
      WHERE UPPER(coupon_code) = ${codeString.toUpperCase()}
      ORDER BY created_at DESC
    `
    return result.rows.map(row => ({
      member_name: row.member_name,
      member_email: row.member_email,
      member_phone: row.member_phone || null,
      order_number: row.order_number,
      subtotal_usd: parseFloat(row.subtotal_usd || '0'),
      discount_percent: parseFloat(row.discount_percent || '0'),
      status: row.status,
      created_at: row.created_at,
    })) as PrelaunchRedemption[]
  } catch (error) {
    console.error('Database error fetching prelaunch redemptions:', error)
    throw new DatabaseError('Failed to fetch prelaunch redemptions', error)
  }
}

// ===========================================
// TRACKING LINK CRUD
// ===========================================

export async function createTrackingLink(
  creatorId: string,
  slug: string,
  destinationPath = '/',
  isDefault = false,
  utmCampaign?: string
): Promise<TrackingLink> {
  try {
    const result = await sql`
      INSERT INTO tracking_links (creator_id, slug, destination_path, is_default, utm_campaign)
      VALUES (${creatorId}, ${slug.toLowerCase()}, ${destinationPath}, ${isDefault}, ${utmCampaign || null})
      RETURNING *
    `
    return result.rows[0] as TrackingLink
  } catch (error) {
    console.error('Database error creating tracking link:', error)
    throw new DatabaseError('Failed to create tracking link', error)
  }
}

export async function getTrackingLinksByCreator(creatorId: string): Promise<TrackingLink[]> {
  try {
    const result = await sql`
      SELECT
        tl.*,
        COALESCE(ce_stats.real_conversions, 0)::int as real_conversion_count
      FROM tracking_links tl
      LEFT JOIN (
        SELECT link_id, COUNT(*) FILTER (WHERE converted = TRUE) as real_conversions
        FROM click_events
        WHERE link_id IS NOT NULL AND creator_id = ${creatorId}
        GROUP BY link_id
      ) ce_stats ON ce_stats.link_id = tl.id
      WHERE tl.creator_id = ${creatorId}
      ORDER BY is_default DESC, created_at ASC
    `
    return result.rows.map(r => ({
      ...r,
      conversion_count: Math.max(
        Number(r.conversion_count) || 0,
        Number(r.real_conversion_count) || 0
      ),
    })) as TrackingLink[]
  } catch (error) {
    console.error('Database error fetching tracking links:', error)
    throw new DatabaseError('Failed to fetch tracking links', error)
  }
}

export async function getTrackingLinkBySlug(slug: string): Promise<TrackingLink | null> {
  try {
    const result = await sql`
      SELECT * FROM tracking_links WHERE lower(slug) = ${slug.toLowerCase()} AND active = TRUE
    `
    return (result.rows[0] as TrackingLink) || null
  } catch (error) {
    console.error('Database error fetching tracking link:', error)
    throw new DatabaseError('Failed to fetch tracking link', error)
  }
}

export async function incrementLinkClickCount(linkId: string): Promise<void> {
  try {
    await sql`
      UPDATE tracking_links SET click_count = click_count + 1, updated_at = NOW() WHERE id = ${linkId}
    `
  } catch (error) {
    console.error('Database error incrementing link clicks:', error)
    throw new DatabaseError('Failed to increment link clicks', error)
  }
}

export async function incrementLinkConversionCount(linkId: string): Promise<void> {
  try {
    await sql`
      UPDATE tracking_links SET conversion_count = conversion_count + 1, updated_at = NOW() WHERE id = ${linkId}
    `
  } catch (error) {
    console.error('Database error incrementing link conversions:', error)
    throw new DatabaseError('Failed to increment link conversions', error)
  }
}

// ===========================================
// CLICK EVENT CRUD
// ===========================================

export async function createClickEvent(input: {
  creator_id: string
  link_id?: string
  session_id: string
  attribution_token: string
  ip_hash?: string
  user_agent?: string
  referer?: string
}): Promise<ClickEvent> {
  try {
    const result = await sql`
      INSERT INTO click_events (creator_id, link_id, session_id, attribution_token, ip_hash, user_agent, referer)
      VALUES (
        ${input.creator_id},
        ${input.link_id || null},
        ${input.session_id},
        ${input.attribution_token},
        ${input.ip_hash || null},
        ${input.user_agent || null},
        ${input.referer || null}
      )
      RETURNING *
    `
    return result.rows[0] as ClickEvent
  } catch (error) {
    console.error('Database error creating click event:', error)
    throw new DatabaseError('Failed to create click event', error)
  }
}

export async function getClickEventByToken(token: string): Promise<ClickEvent | null> {
  try {
    const result = await sql`
      SELECT * FROM click_events
      WHERE attribution_token = ${token}
        AND expires_at > NOW()
        AND converted = FALSE
      ORDER BY clicked_at DESC
      LIMIT 1
    `
    return (result.rows[0] as ClickEvent) || null
  } catch (error) {
    console.error('Database error fetching click event:', error)
    throw new DatabaseError('Failed to fetch click event', error)
  }
}

export async function markClickConverted(clickId: string, orderId: string): Promise<void> {
  try {
    await sql`
      UPDATE click_events SET converted = TRUE, order_id = ${orderId} WHERE id = ${clickId}
    `
  } catch (error) {
    console.error('Database error marking click converted:', error)
    throw new DatabaseError('Failed to mark click converted', error)
  }
}

export async function getClickCountByCreator(
  creatorId: string,
  since?: Date
): Promise<number> {
  try {
    const result = since
      ? await sql`
          SELECT COUNT(*) as count FROM click_events
          WHERE creator_id = ${creatorId} AND clicked_at >= ${since.toISOString()}
        `
      : await sql`
          SELECT COUNT(*) as count FROM click_events WHERE creator_id = ${creatorId}
        `
    return parseInt(result.rows[0]?.count || '0', 10)
  } catch (error) {
    console.error('Database error counting clicks:', error)
    throw new DatabaseError('Failed to count clicks', error)
  }
}

// ===========================================
// ORDER ATTRIBUTION CRUD
// ===========================================

export async function createOrderAttribution(input: {
  order_id: string
  creator_id: string
  attribution_method: AttributionMethod
  link_id?: string
  code_id?: string
  click_event_id?: string
  customer_email?: string
  net_revenue: number
  direct_commission_rate?: number
  direct_commission_amount: number
  is_self_referral?: boolean
  is_subscription?: boolean
  subscription_payment_number?: number
}): Promise<OrderAttribution> {
  try {
    const result = await sql`
      INSERT INTO order_attributions (
        order_id, creator_id, attribution_method, link_id, code_id, click_event_id,
        customer_email, net_revenue, direct_commission_rate, direct_commission_amount,
        is_self_referral, is_subscription, subscription_payment_number
      )
      VALUES (
        ${input.order_id},
        ${input.creator_id},
        ${input.attribution_method},
        ${input.link_id || null},
        ${input.code_id || null},
        ${input.click_event_id || null},
        ${input.customer_email || null},
        ${input.net_revenue},
        ${input.direct_commission_rate ?? 10.00},
        ${input.direct_commission_amount},
        ${input.is_self_referral || false},
        ${input.is_subscription || false},
        ${input.subscription_payment_number ?? null}
      )
      ON CONFLICT (order_id) DO NOTHING
      RETURNING *
    `
    return result.rows[0] as OrderAttribution
  } catch (error) {
    console.error('Database error creating order attribution:', error)
    throw new DatabaseError('Failed to create order attribution', error)
  }
}

export async function getOrderAttributionsByCreator(
  creatorId: string,
  limit = 50,
  offset = 0
): Promise<OrderAttribution[]> {
  try {
    const result = await sql`
      SELECT * FROM order_attributions
      WHERE creator_id = ${creatorId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result.rows as OrderAttribution[]
  } catch (error) {
    console.error('Database error fetching order attributions:', error)
    throw new DatabaseError('Failed to fetch order attributions', error)
  }
}

export async function getOrderAttributionByOrderId(orderId: string): Promise<OrderAttribution | null> {
  try {
    const result = await sql`
      SELECT * FROM order_attributions WHERE order_id = ${orderId}
    `
    return (result.rows[0] as OrderAttribution) || null
  } catch (error) {
    console.error('Database error fetching order attribution:', error)
    throw new DatabaseError('Failed to fetch order attribution', error)
  }
}

export async function updateOrderAttributionStatus(
  id: string,
  status: 'pending' | 'approved' | 'paid' | 'refunded'
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE order_attributions SET status = ${status}, updated_at = NOW() WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating attribution status:', error)
    throw new DatabaseError('Failed to update attribution status', error)
  }
}

export async function getCreatorOrderStats(
  creatorId: string,
  since?: Date
): Promise<{ totalOrders: number; totalRevenue: number; totalCommission: number }> {
  try {
    const result = since
      ? await sql`
          SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(net_revenue), 0) as total_revenue,
            COALESCE(SUM(direct_commission_amount), 0) as total_commission
          FROM order_attributions
          WHERE creator_id = ${creatorId}
            AND status != 'refunded'
            AND created_at >= ${since.toISOString()}
        `
      : await sql`
          SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(net_revenue), 0) as total_revenue,
            COALESCE(SUM(direct_commission_amount), 0) as total_commission
          FROM order_attributions
          WHERE creator_id = ${creatorId}
            AND status != 'refunded'
        `
    const row = result.rows[0]
    return {
      totalOrders: parseInt(row?.total_orders || '0', 10),
      totalRevenue: parseFloat(row?.total_revenue || '0'),
      totalCommission: parseFloat(row?.total_commission || '0'),
    }
  } catch (error) {
    console.error('Database error fetching creator order stats:', error)
    throw new DatabaseError('Failed to fetch creator order stats', error)
  }
}

// ===========================================
// COMMISSION LEDGER CRUD
// ===========================================

export async function createCommissionEntry(input: {
  order_attribution_id: string
  beneficiary_creator_id: string
  commission_type: CommissionType
  source_creator_id?: string
  base_amount: number
  commission_rate: number
  commission_amount: number
  tier_level?: number
}): Promise<CommissionLedgerEntry> {
  try {
    const result = await sql`
      INSERT INTO commission_ledger (
        order_attribution_id, beneficiary_creator_id, commission_type,
        source_creator_id, base_amount, commission_rate, commission_amount, tier_level
      )
      VALUES (
        ${input.order_attribution_id},
        ${input.beneficiary_creator_id},
        ${input.commission_type},
        ${input.source_creator_id || null},
        ${input.base_amount},
        ${input.commission_rate},
        ${input.commission_amount},
        ${input.tier_level ?? 0}
      )
      RETURNING *
    `
    return result.rows[0] as CommissionLedgerEntry
  } catch (error) {
    console.error('Database error creating commission entry:', error)
    throw new DatabaseError('Failed to create commission entry', error)
  }
}

export async function getCommissionsByCreator(
  creatorId: string,
  status?: CommissionStatus,
  limit = 50,
  offset = 0
): Promise<CommissionLedgerEntry[]> {
  try {
    const result = status
      ? await sql`
          SELECT * FROM commission_ledger
          WHERE beneficiary_creator_id = ${creatorId} AND status = ${status}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT * FROM commission_ledger
          WHERE beneficiary_creator_id = ${creatorId}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    return result.rows as CommissionLedgerEntry[]
  } catch (error) {
    console.error('Database error fetching commissions:', error)
    throw new DatabaseError('Failed to fetch commissions', error)
  }
}

export async function getCommissionSummaryByCreator(
  creatorId: string
): Promise<{ pending: number; approved: number; paid: number; total: number }> {
  try {
    const result = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN status != 'reversed' THEN commission_amount ELSE 0 END), 0) as total
      FROM commission_ledger
      WHERE beneficiary_creator_id = ${creatorId}
    `
    const row = result.rows[0]
    return {
      pending: parseFloat(row?.pending || '0'),
      approved: parseFloat(row?.approved || '0'),
      paid: parseFloat(row?.paid || '0'),
      total: parseFloat(row?.total || '0'),
    }
  } catch (error) {
    console.error('Database error fetching commission summary:', error)
    throw new DatabaseError('Failed to fetch commission summary', error)
  }
}

export async function getCommissionTotalSince(
  creatorId: string,
  since: Date,
  until?: Date
): Promise<number> {
  try {
    const untilDate = until || new Date()
    const result = await sql`
      SELECT COALESCE(SUM(commission_amount), 0) as total
      FROM commission_ledger
      WHERE beneficiary_creator_id = ${creatorId}
        AND status != 'reversed'
        AND created_at >= ${since.toISOString()}
        AND created_at < ${untilDate.toISOString()}
    `
    return parseFloat(result.rows[0]?.total || '0')
  } catch (error) {
    console.error('Database error fetching commission total since:', error)
    throw new DatabaseError('Failed to fetch commission total', error)
  }
}

export async function updateCommissionStatus(
  id: string,
  status: CommissionStatus,
  payoutId?: string
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE commission_ledger
      SET status = ${status}, payout_id = COALESCE(${payoutId || null}, payout_id), updated_at = NOW()
      WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating commission status:', error)
    throw new DatabaseError('Failed to update commission status', error)
  }
}

export async function reverseCommissionsForAttribution(attributionId: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE commission_ledger SET status = 'reversed', updated_at = NOW()
      WHERE order_attribution_id = ${attributionId} AND status IN ('pending', 'approved', 'paid')
    `
    return result.rowCount ?? 0
  } catch (error) {
    console.error('Database error reversing commissions:', error)
    throw new DatabaseError('Failed to reverse commissions', error)
  }
}

export async function restoreCommissionsForAttribution(attributionId: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE commission_ledger
      SET
        status = CASE
          WHEN payout_id IS NOT NULL THEN 'paid'
          ELSE 'pending'
        END,
        updated_at = NOW()
      WHERE order_attribution_id = ${attributionId} AND status = 'reversed'
    `
    return result.rowCount ?? 0
  } catch (error) {
    console.error('Database error restoring commissions:', error)
    throw new DatabaseError('Failed to restore commissions', error)
  }
}

export async function getApprovedCommissionsForPayout(
  creatorId: string,
  filters?: {
    periodStart?: string
    periodEnd?: string
  }
): Promise<CommissionLedgerEntry[]> {
  try {
    const periodStart = filters?.periodStart
    const periodEnd = filters?.periodEnd

    const result = periodStart && periodEnd
      ? await sql`
          SELECT * FROM commission_ledger
          WHERE beneficiary_creator_id = ${creatorId}
            AND status = 'approved'
            AND payout_id IS NULL
            AND created_at >= ${periodStart}::date
            AND created_at < (${periodEnd}::date + INTERVAL '1 day')
          ORDER BY created_at ASC
        `
      : periodStart
        ? await sql`
            SELECT * FROM commission_ledger
            WHERE beneficiary_creator_id = ${creatorId}
              AND status = 'approved'
              AND payout_id IS NULL
              AND created_at >= ${periodStart}::date
            ORDER BY created_at ASC
          `
        : periodEnd
          ? await sql`
              SELECT * FROM commission_ledger
              WHERE beneficiary_creator_id = ${creatorId}
                AND status = 'approved'
                AND payout_id IS NULL
                AND created_at < (${periodEnd}::date + INTERVAL '1 day')
              ORDER BY created_at ASC
            `
          : await sql`
              SELECT * FROM commission_ledger
              WHERE beneficiary_creator_id = ${creatorId}
                AND status = 'approved'
                AND payout_id IS NULL
              ORDER BY created_at ASC
            `
    return result.rows as CommissionLedgerEntry[]
  } catch (error) {
    console.error('Database error fetching approved commissions:', error)
    throw new DatabaseError('Failed to fetch approved commissions', error)
  }
}

export async function markCommissionsPaidForPayout(
  commissionIds: string[],
  payoutId: string
): Promise<number> {
  if (commissionIds.length === 0) return 0

  try {
    let updated = 0

    for (const commissionId of commissionIds) {
      const result = await sql`
        UPDATE commission_ledger
        SET
          status = 'paid',
          payout_id = ${payoutId},
          updated_at = NOW()
        WHERE id = ${commissionId}
      `
      updated += result.rowCount ?? 0
    }

    return updated
  } catch (error) {
    console.error('Database error marking commissions paid for payout:', error)
    throw new DatabaseError('Failed to mark commissions paid for payout', error)
  }
}

export async function approveEligibleCommissions(): Promise<{ approved: number; selfReferralsReverted: number }> {
  try {
    // Approve eligible non-self-referral commissions past 30-day window
    const approvedResult = await sql`
      UPDATE commission_ledger cl
      SET status = 'approved', updated_at = NOW()
      FROM order_attributions oa
      WHERE cl.order_attribution_id = oa.id
        AND cl.status = 'pending'
        AND oa.is_self_referral = FALSE
        AND oa.created_at < NOW() - INTERVAL '30 days'
    `

    // Revert self-referral commissions that have been pending past the 30-day window
    // instead of leaving them pending forever
    const selfRefResult = await sql`
      UPDATE commission_ledger cl
      SET status = 'reversed', updated_at = NOW()
      FROM order_attributions oa
      WHERE cl.order_attribution_id = oa.id
        AND cl.status = 'pending'
        AND oa.is_self_referral = TRUE
        AND oa.created_at < NOW() - INTERVAL '30 days'
    `

    return {
      approved: approvedResult.rowCount ?? 0,
      selfReferralsReverted: selfRefResult.rowCount ?? 0,
    }
  } catch (error) {
    console.error('Database error approving commissions:', error)
    throw new DatabaseError('Failed to approve commissions', error)
  }
}

// ===========================================
// PAYOUT CRUD
// ===========================================

export async function createPayout(input: {
  creator_id: string
  amount: number
  period_start: string
  period_end: string
  payout_method?: PayoutMethod
  commission_count: number
}): Promise<Payout> {
  try {
    const result = await sql`
      INSERT INTO payouts (creator_id, amount, period_start, period_end, payout_method, commission_count)
      VALUES (
        ${input.creator_id},
        ${input.amount},
        ${input.period_start},
        ${input.period_end},
        ${input.payout_method || null},
        ${input.commission_count}
      )
      RETURNING *
    `
    return result.rows[0] as Payout
  } catch (error) {
    console.error('Database error creating payout:', error)
    throw new DatabaseError('Failed to create payout', error)
  }
}

export async function getPayoutsByCreator(creatorId: string, limit = 20): Promise<Payout[]> {
  try {
    const result = await sql`
      SELECT * FROM payouts WHERE creator_id = ${creatorId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.rows as Payout[]
  } catch (error) {
    console.error('Database error fetching payouts:', error)
    throw new DatabaseError('Failed to fetch payouts', error)
  }
}

export async function updatePayoutStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  providerPayoutId?: string
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE payouts
      SET
        status = ${status},
        provider_payout_id = COALESCE(${providerPayoutId || null}, provider_payout_id),
        paid_at = ${status === 'completed' ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${id}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating payout status:', error)
    throw new DatabaseError('Failed to update payout status', error)
  }
}

// ===========================================
// ADMIN ACTIONS
// ===========================================

export async function createAdminAction(input: {
  admin_email: string
  action_type: string
  entity_type: string
  entity_id?: string
  reason?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
      VALUES (
        ${input.admin_email},
        ${input.action_type},
        ${input.entity_type},
        ${input.entity_id || null},
        ${input.reason || null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}
      )
    `
  } catch (error) {
    console.error('Database error creating admin action:', error)
    // Don't throw - audit logging shouldn't break flows
  }
}

// ===========================================
// CREATOR CUSTOMER PORTFOLIO CRUD
// ===========================================

export async function upsertPortfolioEntry(input: {
  creator_id: string
  customer_email: string
  stripe_subscription_id?: string
  subscription_status?: string
}): Promise<PortfolioEntry> {
  try {
    const result = await sql`
      INSERT INTO creator_customer_portfolio (
        creator_id, customer_email, stripe_subscription_id, subscription_status
      )
      VALUES (
        ${input.creator_id},
        ${input.customer_email.toLowerCase()},
        ${input.stripe_subscription_id || null},
        ${input.subscription_status || 'active'}
      )
      ON CONFLICT (creator_id, customer_email)
      DO UPDATE SET
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, creator_customer_portfolio.stripe_subscription_id),
        subscription_status = COALESCE(EXCLUDED.subscription_status, creator_customer_portfolio.subscription_status),
        last_payment_at = NOW(),
        payment_count = creator_customer_portfolio.payment_count + 1,
        updated_at = NOW()
      RETURNING *
    `
    return result.rows[0] as PortfolioEntry
  } catch (error) {
    console.error('Database error upserting portfolio entry:', error)
    throw new DatabaseError('Failed to upsert portfolio entry', error)
  }
}

export async function getPortfolioEntry(
  creatorId: string,
  customerEmail: string
): Promise<PortfolioEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM creator_customer_portfolio
      WHERE creator_id = ${creatorId} AND customer_email = ${customerEmail.toLowerCase()}
    `
    return (result.rows[0] as PortfolioEntry) || null
  } catch (error) {
    console.error('Database error fetching portfolio entry:', error)
    throw new DatabaseError('Failed to fetch portfolio entry', error)
  }
}

export async function updatePortfolioStatus(
  subscriptionId: string,
  status: string
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creator_customer_portfolio
      SET subscription_status = ${status}, updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error updating portfolio status:', error)
    throw new DatabaseError('Failed to update portfolio status', error)
  }
}

export async function breakPortfolioAttribution(
  subscriptionId: string
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creator_customer_portfolio
      SET attribution_active = FALSE, subscription_status = 'cancelled', updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error breaking portfolio attribution:', error)
    throw new DatabaseError('Failed to break portfolio attribution', error)
  }
}

export async function getPortfolioByCreator(
  creatorId: string,
  activeOnly = false
): Promise<PortfolioEntry[]> {
  try {
    const result = activeOnly
      ? await sql`
          SELECT * FROM creator_customer_portfolio
          WHERE creator_id = ${creatorId} AND attribution_active = TRUE AND subscription_status = 'active'
          ORDER BY first_payment_at DESC
        `
      : await sql`
          SELECT * FROM creator_customer_portfolio
          WHERE creator_id = ${creatorId}
          ORDER BY first_payment_at DESC
        `
    return result.rows as PortfolioEntry[]
  } catch (error) {
    console.error('Database error fetching portfolio:', error)
    throw new DatabaseError('Failed to fetch portfolio', error)
  }
}

export async function updateCreatorActiveMemberCount(creatorId: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE creators
      SET
        active_member_count = (
          SELECT COUNT(*) FROM creator_customer_portfolio
          WHERE creator_id = ${creatorId}
            AND attribution_active = TRUE
            AND subscription_status = 'active'
        ),
        updated_at = NOW()
      WHERE id = ${creatorId}
      RETURNING active_member_count
    `
    return result.rows[0]?.active_member_count ?? 0
  } catch (error) {
    console.error('Database error updating active member count:', error)
    throw new DatabaseError('Failed to update active member count', error)
  }
}

export async function getPortfolioEntryBySubscription(
  subscriptionId: string
): Promise<PortfolioEntry | null> {
  try {
    const result = await sql`
      SELECT * FROM creator_customer_portfolio
      WHERE stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `
    return (result.rows[0] as PortfolioEntry) || null
  } catch (error) {
    console.error('Database error fetching portfolio by subscription:', error)
    throw new DatabaseError('Failed to fetch portfolio by subscription', error)
  }
}

export async function incrementPortfolioPayment(subscriptionId: string): Promise<void> {
  try {
    await sql`
      UPDATE creator_customer_portfolio
      SET payment_count = payment_count + 1, last_payment_at = NOW(), updated_at = NOW()
      WHERE stripe_subscription_id = ${subscriptionId}
    `
  } catch (error) {
    console.error('Database error incrementing portfolio payment:', error)
    throw new DatabaseError('Failed to increment portfolio payment', error)
  }
}

// ===========================================
// COMMISSION BREAKDOWN QUERIES
// ===========================================

export async function getCommissionBreakdownByCreator(
  creatorId: string
): Promise<{ directMembership: number; directProduct: number; override: number }> {
  try {
    const result = await sql`
      SELECT
        COALESCE(SUM(CASE
          WHEN cl.commission_type = 'direct' AND oa.is_subscription = TRUE
          THEN cl.commission_amount ELSE 0
        END), 0) as direct_membership,
        COALESCE(SUM(CASE
          WHEN cl.commission_type = 'direct' AND (oa.is_subscription = FALSE OR oa.is_subscription IS NULL)
          THEN cl.commission_amount ELSE 0
        END), 0) as direct_product,
        COALESCE(SUM(CASE
          WHEN cl.commission_type = 'override'
          THEN cl.commission_amount ELSE 0
        END), 0) as override_total
      FROM commission_ledger cl
      LEFT JOIN order_attributions oa ON cl.order_attribution_id = oa.id
      WHERE cl.beneficiary_creator_id = ${creatorId} AND cl.status != 'reversed'
    `
    const row = result.rows[0]
    return {
      directMembership: parseFloat(row?.direct_membership || '0'),
      directProduct: parseFloat(row?.direct_product || '0'),
      override: parseFloat(row?.override_total || '0'),
    }
  } catch (error) {
    console.error('Database error fetching commission breakdown:', error)
    throw new DatabaseError('Failed to fetch commission breakdown', error)
  }
}

export async function checkAffiliateCodeExists(code: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM affiliate_codes WHERE lower(code) = ${code.toLowerCase()} LIMIT 1
    `
    return result.rows.length > 0
  } catch (error) {
    console.error('Database error checking code exists:', error)
    throw new DatabaseError('Failed to check code exists', error)
  }
}

export async function updateAffiliateCodeStripeIds(
  codeId: string,
  stripeCouponId: string,
  stripePromotionCodeId: string
): Promise<void> {
  try {
    await sql`
      UPDATE affiliate_codes
      SET stripe_coupon_id = ${stripeCouponId},
          stripe_promotion_code_id = ${stripePromotionCodeId},
          updated_at = NOW()
      WHERE id = ${codeId}
    `
  } catch (error) {
    console.error('Database error updating Stripe IDs:', error)
    throw new DatabaseError('Failed to update Stripe IDs', error)
  }
}

// ===========================================
// CREATOR LINK STATS & EARNINGS TREND
// ===========================================

export async function getCreatorLinkStats(creatorId: string) {
  try {
    const result = await sql`
      SELECT tl.id, tl.slug, tl.destination_path, tl.click_count, tl.conversion_count,
        COALESCE(ce_stats.real_conversions, 0)::int as real_conversion_count
      FROM tracking_links tl
      LEFT JOIN (
        SELECT link_id, COUNT(*) FILTER (WHERE converted = TRUE) as real_conversions
        FROM click_events
        WHERE link_id IS NOT NULL AND creator_id = ${creatorId}
        GROUP BY link_id
      ) ce_stats ON ce_stats.link_id = tl.id
      WHERE tl.creator_id = ${creatorId} AND tl.active = TRUE
      ORDER BY tl.click_count DESC
    `
    return result.rows.map(r => {
      const conversions = Math.max(Number(r.conversion_count) || 0, Number(r.real_conversion_count) || 0)
      const clicks = parseInt(r.click_count || '0', 10)
      return {
        id: r.id,
        slug: r.slug,
        destinationPath: r.destination_path,
        clickCount: clicks,
        conversionCount: conversions,
        conversionRate: clicks > 0 ? Math.round(conversions / clicks * 1000) / 10 : 0,
      }
    })
  } catch (error) {
    console.error('Database error fetching creator link stats:', error)
    throw new DatabaseError('Failed to fetch creator link stats', error)
  }
}

export async function getCreatorEarningsTrend(creatorId: string) {
  try {
    const result = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN commission_amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND created_at < date_trunc('month', NOW()) THEN commission_amount ELSE 0 END), 0) as last_month
      FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status != 'reversed'
    `
    const row = result.rows[0]
    return {
      thisMonth: parseFloat(row?.this_month || '0'),
      lastMonth: parseFloat(row?.last_month || '0'),
    }
  } catch (error) {
    console.error('Database error fetching creator earnings trend:', error)
    throw new DatabaseError('Failed to fetch creator earnings trend', error)
  }
}

// ===========================================
// DASHBOARD METRICS
// ===========================================

export async function getCreatorDashboardStats(creatorId: string): Promise<{
  totalClicks: number
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  thisMonthClicks: number
  thisMonthOrders: number
  thisMonthRevenue: number
  thisMonthCommission: number
}> {
  try {
    // Use SQL date_trunc for month boundary — matches getCreatorEarningsTrend()
    // and avoids JS/SQL timezone mismatches on Vercel edge
    const result = await sql`
      SELECT
        (SELECT COUNT(*) FROM click_events WHERE creator_id = ${creatorId}) as total_clicks,
        (SELECT COUNT(*) FROM click_events WHERE creator_id = ${creatorId} AND clicked_at >= date_trunc('month', NOW())) as month_clicks,
        (SELECT COUNT(*) FROM order_attributions WHERE creator_id = ${creatorId} AND status != 'refunded') as total_orders,
        (SELECT COUNT(*) FROM order_attributions WHERE creator_id = ${creatorId} AND status != 'refunded' AND created_at >= date_trunc('month', NOW())) as month_orders,
        (SELECT COALESCE(SUM(net_revenue), 0) FROM order_attributions WHERE creator_id = ${creatorId} AND status != 'refunded') as total_revenue,
        (SELECT COALESCE(SUM(net_revenue), 0) FROM order_attributions WHERE creator_id = ${creatorId} AND status != 'refunded' AND created_at >= date_trunc('month', NOW())) as month_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status != 'reversed') as total_commission,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status = 'pending') as pending_commission,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status != 'reversed' AND created_at >= date_trunc('month', NOW())) as month_commission
    `

    const row = result.rows[0]
    return {
      totalClicks: parseInt(row?.total_clicks || '0', 10),
      totalOrders: parseInt(row?.total_orders || '0', 10),
      totalRevenue: parseFloat(row?.total_revenue || '0'),
      totalCommission: parseFloat(row?.total_commission || '0'),
      pendingCommission: parseFloat(row?.pending_commission || '0'),
      thisMonthClicks: parseInt(row?.month_clicks || '0', 10),
      thisMonthOrders: parseInt(row?.month_orders || '0', 10),
      thisMonthRevenue: parseFloat(row?.month_revenue || '0'),
      thisMonthCommission: parseFloat(row?.month_commission || '0'),
    }
  } catch (error) {
    console.error('Database error fetching dashboard stats:', error)
    throw new DatabaseError('Failed to fetch dashboard stats', error)
  }
}
