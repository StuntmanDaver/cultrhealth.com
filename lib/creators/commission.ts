import { db } from '@vercel/postgres'
import { COMMISSION_CONFIG, isInBonusWindow } from '@/lib/config/affiliate'
import {
  getCreatorById,
  getOrderAttributionByOrderId,
  reverseCommissionsForAttribution,
  updateOrderAttributionStatus,
  updateCreatorRecruitCount,
  updateCreatorTier,
  getAllActiveCreators,
  getPortfolioEntry,
  updateCreatorActiveMemberCount,
} from '@/lib/creators/db'
import { getTierForRecruitCount } from '@/lib/config/affiliate'
import type { ResolvedAttribution } from '@/lib/creators/attribution'

// ===========================================
// SHARED COMMISSION HELPERS
// ===========================================

/**
 * Calculate override commission for a recruiter.
 * Returns the override details, or null if no override applies.
 */
export async function calculateOverrideCommission(
  creatorId: string,
  netRevenue: number,
  directAmount: number
): Promise<{
  recruiterId: string
  overrideRate: number
  overrideAmount: number
  recruiterTier: number
} | null> {
  const creator = await getCreatorById(creatorId)
  if (!creator?.recruiter_id) return null

  const recruiter = await getCreatorById(creator.recruiter_id)
  if (!recruiter || recruiter.status !== 'active') return null

  let overrideRate: number
  if (isInBonusWindow(recruiter.creator_start_date)) {
    overrideRate = Number(recruiter.override_rate)
  } else {
    overrideRate = COMMISSION_CONFIG.postBonusRate
  }

  const capRate = isInBonusWindow(recruiter.creator_start_date)
    ? COMMISSION_CONFIG.totalCapRate
    : COMMISSION_CONFIG.postBonusRate
  const maxTotal = (netRevenue * capRate) / 100
  const remainingCap = maxTotal - directAmount
  const overrideAmount = Math.min(
    Math.round((netRevenue * overrideRate) / 100 * 100) / 100,
    Math.max(0, Math.round(remainingCap * 100) / 100)
  )

  if (overrideAmount <= 0) return null

  return {
    recruiterId: recruiter.id,
    overrideRate,
    overrideAmount,
    recruiterTier: recruiter.tier,
  }
}

/**
 * Insert direct + override commission ledger entries within an existing transaction.
 * Caller must manage BEGIN/COMMIT/ROLLBACK.
 */
export async function insertCommissionLedgerEntries(
  client: { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  attributionId: string,
  creatorId: string,
  netRevenue: number,
  directRate: number,
  directAmount: number,
  override: { recruiterId: string; overrideRate: number; overrideAmount: number; recruiterTier: number } | null
): Promise<{ directCommission: number; overrideCommission: number }> {
  // Insert direct commission
  await client.query(
    `INSERT INTO commission_ledger (
      order_attribution_id, beneficiary_creator_id, commission_type,
      base_amount, commission_rate, commission_amount, tier_level
    ) VALUES ($1,$2,'direct',$3,$4,$5,0)`,
    [attributionId, creatorId, netRevenue, directRate, directAmount]
  )

  // Insert override commission if applicable
  if (override) {
    await client.query(
      `INSERT INTO commission_ledger (
        order_attribution_id, beneficiary_creator_id, commission_type,
        source_creator_id, base_amount, commission_rate, commission_amount, tier_level
      ) VALUES ($1,$2,'override',$3,$4,$5,$6,$7)`,
      [attributionId, override.recruiterId, creatorId, netRevenue, override.overrideRate, override.overrideAmount, override.recruiterTier]
    )
  }

  return {
    directCommission: directAmount,
    overrideCommission: override?.overrideAmount ?? 0,
  }
}

// ===========================================
// COMMISSION CALCULATION (Transactional)
// ===========================================

export interface CommissionResult {
  attributionId: string
  directCommission: number
  overrideCommission: number
  totalCommission: number
  isSelfReferral: boolean
  creatorId: string
  recruiterId?: string
}

export async function processOrderAttribution(params: {
  orderId: string
  netRevenue: number
  customerEmail: string
  attribution: ResolvedAttribution
  isSubscription?: boolean
  subscriptionPaymentNumber?: number
}): Promise<CommissionResult | null> {
  const { orderId, netRevenue, customerEmail, attribution, isSubscription, subscriptionPaymentNumber } = params

  if (netRevenue <= 0) return null

  // Check attribution_active flag for re-signup rule
  if (isSubscription) {
    const portfolio = await getPortfolioEntry(attribution.creatorId, customerEmail)
    if (portfolio && !portfolio.attribution_active) {
      console.log(`Attribution blocked: re-signup (creator ${attribution.creatorId})`)
      return null
    }
  }

  // 1. Calculate direct commission — use creator's custom rate if set, otherwise default
  const creator = await getCreatorById(attribution.creatorId)
  const directRate = creator?.commission_rate != null ? Number(creator.commission_rate) : COMMISSION_CONFIG.directRate
  const directAmount = Math.round((netRevenue * directRate) / 100 * 100) / 100

  // 2. Pre-calculate override commission (needs creator lookups before transaction)
  const override = await calculateOverrideCommission(attribution.creatorId, netRevenue, directAmount)

  // 3. Execute all writes in a single transaction
  const client = await db.connect()
  let attributionId: string

  try {
    await client.query('BEGIN')

    // Insert order attribution
    const attrResult = await client.query(
      `INSERT INTO order_attributions (
        order_id, creator_id, attribution_method, link_id, code_id, click_event_id,
        customer_email, net_revenue, direct_commission_rate, direct_commission_amount,
        is_self_referral, is_subscription, subscription_payment_number
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (order_id) DO NOTHING
      RETURNING id`,
      [
        orderId, attribution.creatorId, attribution.method,
        attribution.linkId || null, attribution.codeId || null, attribution.clickEventId || null,
        customerEmail, netRevenue, directRate, directAmount,
        attribution.isSelfReferral || false, isSubscription || false,
        subscriptionPaymentNumber ?? null,
      ]
    )

    if (!attrResult.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    attributionId = attrResult.rows[0].id

    // Self-referrals: record attribution for tracking but skip commissions
    if (!attribution.isSelfReferral) {
      await insertCommissionLedgerEntries(
        client, attributionId, attribution.creatorId,
        netRevenue, directRate, directAmount, override
      )
    }

    // Update code usage stats
    if (attribution.codeId) {
      await client.query(
        `UPDATE affiliate_codes SET use_count = use_count + 1, total_revenue = total_revenue + $1, updated_at = NOW() WHERE id = $2`,
        [netRevenue, attribution.codeId]
      )
    }

    // Update link conversion count
    if (attribution.linkId) {
      await client.query(
        `UPDATE tracking_links SET conversion_count = conversion_count + 1, updated_at = NOW() WHERE id = $1`,
        [attribution.linkId]
      )
    }

    // Mark click converted
    if (attribution.clickEventId) {
      await client.query(
        `UPDATE click_events SET converted = TRUE, order_id = $1 WHERE id = $2`,
        [orderId, attribution.clickEventId]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction failed in processOrderAttribution:', error)
    throw error
  } finally {
    client.release()
  }

  const earnedDirect = attribution.isSelfReferral ? 0 : directAmount
  const earnedOverride = attribution.isSelfReferral ? 0 : (override?.overrideAmount ?? 0)
  return {
    attributionId,
    directCommission: earnedDirect,
    overrideCommission: earnedOverride,
    totalCommission: earnedDirect + earnedOverride,
    isSelfReferral: attribution.isSelfReferral,
    creatorId: attribution.creatorId,
    recruiterId: override?.recruiterId,
  }
}

// ===========================================
// ZERO-REVENUE ATTRIBUTION (Quote-Only Orders)
// ===========================================

// Records an attribution placeholder when all cart items have null prices.
// net_revenue and commission_amount are 0 — will be updated on order approval
// when the actual invoiced amount is known.
export async function recordZeroRevenueAttribution(params: {
  orderId: string
  customerEmail: string
  attribution: ResolvedAttribution
}): Promise<string | null> {
  const { orderId, customerEmail, attribution } = params
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO order_attributions (
        order_id, creator_id, attribution_method, link_id, code_id, click_event_id,
        customer_email, net_revenue, direct_commission_rate, direct_commission_amount,
        is_self_referral, is_subscription
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,0,$8,false)
      ON CONFLICT (order_id) DO NOTHING
      RETURNING id`,
      [
        orderId, attribution.creatorId, attribution.method,
        attribution.linkId || null, attribution.codeId || null, attribution.clickEventId || null,
        customerEmail, attribution.isSelfReferral || false,
      ]
    )

    if (result.rows[0]) {
      if (attribution.codeId) {
        await client.query(
          `UPDATE affiliate_codes SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1`,
          [attribution.codeId]
        )
      }
      if (attribution.linkId) {
        await client.query(
          `UPDATE tracking_links SET conversion_count = conversion_count + 1, updated_at = NOW() WHERE id = $1`,
          [attribution.linkId]
        )
      }
      if (attribution.clickEventId) {
        await client.query(
          `UPDATE click_events SET converted = TRUE, order_id = $1 WHERE id = $2`,
          [orderId, attribution.clickEventId]
        )
      }
    }

    await client.query('COMMIT')
    return result.rows[0]?.id || null
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction failed in recordZeroRevenueAttribution:', error)
    throw error
  } finally {
    client.release()
  }
}

// ===========================================
// REFUND REVERSAL
// ===========================================

export async function handleRefundReversal(orderId: string): Promise<number> {
  const attribution = await getOrderAttributionByOrderId(orderId)
  if (!attribution) return 0

  const reversedCount = await reverseCommissionsForAttribution(attribution.id)
  await updateOrderAttributionStatus(attribution.id, 'refunded')

  console.log(`Reversed ${reversedCount} commissions for order ${orderId}`)
  return reversedCount
}

// ===========================================
// TIER + PORTFOLIO RECALCULATION (Cron Job)
// ===========================================

export async function recalculateAllTiers(): Promise<{
  updated: number
  total: number
  portfolioUpdated: number
}> {
  const creators = await getAllActiveCreators()
  let updated = 0
  let portfolioUpdated = 0

  for (const creator of creators) {
    const newCount = await updateCreatorRecruitCount(creator.id)
    const tierConfig = getTierForRecruitCount(newCount)

    if (tierConfig.tier !== creator.tier || tierConfig.overrideRate !== Number(creator.override_rate)) {
      await updateCreatorTier(creator.id, tierConfig.tier, tierConfig.overrideRate)
      updated++
      console.log(
        `Creator ${creator.id}: tier ${creator.tier}→${tierConfig.tier}, ` +
        `override ${creator.override_rate}%→${tierConfig.overrideRate}%`
      )
    }

    const newMemberCount = await updateCreatorActiveMemberCount(creator.id)
    if (newMemberCount !== creator.active_member_count) {
      portfolioUpdated++
    }
  }

  return { updated, total: creators.length, portfolioUpdated }
}
