import { sql } from '@vercel/postgres'
import { DatabaseError } from '@/lib/db'
import type {
  Creator,
  CreatorStatus,
  AffiliateCode,
  TrackingLink,
  ClickEvent,
  OrderAttribution,
  CommissionLedgerEntry,
  CommissionType,
  CommissionStatus,
  AttributionMethod,
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
}

export async function createCreator(input: CreateCreatorInput): Promise<Creator> {
  try {
    const result = await sql`
      INSERT INTO creators (email, full_name, phone, social_handle, bio, recruiter_id, status, created_at, updated_at)
      VALUES (
        ${input.email.toLowerCase()},
        ${input.full_name},
        ${input.phone || null},
        ${input.social_handle || null},
        ${input.bio || null},
        ${input.recruiter_id || null},
        'pending',
        NOW(), NOW()
      )
      ON CONFLICT ((lower(email)))
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, creators.phone),
        social_handle = COALESCE(EXCLUDED.social_handle, creators.social_handle),
        bio = COALESCE(EXCLUDED.bio, creators.bio),
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

export async function updateCreatorStatus(
  id: string,
  status: CreatorStatus,
  approvedBy?: string
): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE creators
      SET
        status = ${status},
        approved_at = ${status === 'active' ? new Date().toISOString() : null},
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
    console.error('Database error verifying creator email:', error)
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

export async function createAffiliateCode(
  creatorId: string,
  code: string,
  isPrimary = false,
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue = 10.00
): Promise<AffiliateCode> {
  try {
    const result = await sql`
      INSERT INTO affiliate_codes (creator_id, code, is_primary, discount_type, discount_value)
      VALUES (${creatorId}, ${code.toUpperCase()}, ${isPrimary}, ${discountType}, ${discountValue})
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
      SELECT * FROM affiliate_codes WHERE lower(code) = ${code.toLowerCase()} AND active = TRUE
    `
    return (result.rows[0] as AffiliateCode) || null
  } catch (error) {
    console.error('Database error fetching affiliate code:', error)
    throw new DatabaseError('Failed to fetch affiliate code', error)
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

export async function deactivateAffiliateCode(codeId: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE affiliate_codes SET active = FALSE, updated_at = NOW() WHERE id = ${codeId}
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Database error deactivating affiliate code:', error)
    throw new DatabaseError('Failed to deactivate code', error)
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
      SELECT * FROM tracking_links WHERE creator_id = ${creatorId}
      ORDER BY is_default DESC, created_at ASC
    `
    return result.rows as TrackingLink[]
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
}): Promise<OrderAttribution> {
  try {
    const result = await sql`
      INSERT INTO order_attributions (
        order_id, creator_id, attribution_method, link_id, code_id, click_event_id,
        customer_email, net_revenue, direct_commission_rate, direct_commission_amount, is_self_referral
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
        ${input.is_self_referral || false}
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
          WHERE creator_id = ${creatorId} AND created_at >= ${since.toISOString()}
        `
      : await sql`
          SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(net_revenue), 0) as total_revenue,
            COALESCE(SUM(direct_commission_amount), 0) as total_commission
          FROM order_attributions
          WHERE creator_id = ${creatorId}
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
      WHERE order_attribution_id = ${attributionId} AND status IN ('pending', 'approved')
    `
    return result.rowCount ?? 0
  } catch (error) {
    console.error('Database error reversing commissions:', error)
    throw new DatabaseError('Failed to reverse commissions', error)
  }
}

export async function getApprovedCommissionsForPayout(
  creatorId: string
): Promise<CommissionLedgerEntry[]> {
  try {
    const result = await sql`
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

export async function approveEligibleCommissions(): Promise<number> {
  try {
    const result = await sql`
      UPDATE commission_ledger cl
      SET status = 'approved', updated_at = NOW()
      FROM order_attributions oa
      WHERE cl.order_attribution_id = oa.id
        AND cl.status = 'pending'
        AND oa.is_self_referral = FALSE
        AND oa.created_at < NOW() - INTERVAL '30 days'
    `
    return result.rowCount ?? 0
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
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthStartStr = monthStart.toISOString()

    const result = await sql`
      SELECT
        (SELECT COUNT(*) FROM click_events WHERE creator_id = ${creatorId}) as total_clicks,
        (SELECT COUNT(*) FROM click_events WHERE creator_id = ${creatorId} AND clicked_at >= ${monthStartStr}) as month_clicks,
        (SELECT COUNT(*) FROM order_attributions WHERE creator_id = ${creatorId}) as total_orders,
        (SELECT COUNT(*) FROM order_attributions WHERE creator_id = ${creatorId} AND created_at >= ${monthStartStr}) as month_orders,
        (SELECT COALESCE(SUM(net_revenue), 0) FROM order_attributions WHERE creator_id = ${creatorId}) as total_revenue,
        (SELECT COALESCE(SUM(net_revenue), 0) FROM order_attributions WHERE creator_id = ${creatorId} AND created_at >= ${monthStartStr}) as month_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status != 'reversed') as total_commission,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status = 'pending') as pending_commission,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_ledger WHERE beneficiary_creator_id = ${creatorId} AND status != 'reversed' AND created_at >= ${monthStartStr}) as month_commission
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
