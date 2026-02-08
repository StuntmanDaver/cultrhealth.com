import { COMMISSION_CONFIG, getTierForRecruitCount } from '@/lib/config/affiliate'
import {
  createOrderAttribution,
  createCommissionEntry,
  getCreatorById,
  incrementCodeUsage,
  incrementLinkConversionCount,
  markClickConverted,
  getOrderAttributionByOrderId,
  reverseCommissionsForAttribution,
  updateOrderAttributionStatus,
  updateCreatorRecruitCount,
  updateCreatorTier,
  getAllActiveCreators,
} from '@/lib/creators/db'
import type { ResolvedAttribution } from '@/lib/creators/attribution'

// ===========================================
// COMMISSION CALCULATION
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
}): Promise<CommissionResult | null> {
  const { orderId, netRevenue, customerEmail, attribution } = params

  if (netRevenue <= 0) return null

  // 1. Calculate direct commission
  const directRate = COMMISSION_CONFIG.directRate
  const directAmount = Math.round((netRevenue * directRate) / 100 * 100) / 100

  // 2. Create order attribution record
  const orderAttribution = await createOrderAttribution({
    order_id: orderId,
    creator_id: attribution.creatorId,
    attribution_method: attribution.method,
    link_id: attribution.linkId,
    code_id: attribution.codeId,
    click_event_id: attribution.clickEventId,
    customer_email: customerEmail,
    net_revenue: netRevenue,
    direct_commission_rate: directRate,
    direct_commission_amount: directAmount,
    is_self_referral: attribution.isSelfReferral,
  })

  if (!orderAttribution) return null

  // 3. Create direct commission ledger entry
  await createCommissionEntry({
    order_attribution_id: orderAttribution.id,
    beneficiary_creator_id: attribution.creatorId,
    commission_type: 'direct',
    base_amount: netRevenue,
    commission_rate: directRate,
    commission_amount: directAmount,
  })

  // 4. Update code/link stats
  if (attribution.codeId) {
    await incrementCodeUsage(attribution.codeId, netRevenue)
  }
  if (attribution.linkId) {
    await incrementLinkConversionCount(attribution.linkId)
  }
  if (attribution.clickEventId) {
    await markClickConverted(attribution.clickEventId, orderId)
  }

  // 5. Calculate override commission (if creator has a recruiter)
  let overrideAmount = 0
  let recruiterId: string | undefined
  const creator = await getCreatorById(attribution.creatorId)

  if (creator?.recruiter_id) {
    const recruiter = await getCreatorById(creator.recruiter_id)
    if (recruiter && recruiter.status === 'active' && recruiter.override_rate > 0) {
      recruiterId = recruiter.id
      const overrideRate = recruiter.override_rate

      // Calculate override, respecting the 20% total cap
      const maxTotal = (netRevenue * COMMISSION_CONFIG.totalCapRate) / 100
      const remainingCap = maxTotal - directAmount
      overrideAmount = Math.min(
        Math.round((netRevenue * overrideRate) / 100 * 100) / 100,
        Math.max(0, Math.round(remainingCap * 100) / 100)
      )

      if (overrideAmount > 0) {
        await createCommissionEntry({
          order_attribution_id: orderAttribution.id,
          beneficiary_creator_id: recruiter.id,
          commission_type: 'override',
          source_creator_id: attribution.creatorId,
          base_amount: netRevenue,
          commission_rate: overrideRate,
          commission_amount: overrideAmount,
          tier_level: recruiter.tier,
        })
      }
    }
  }

  return {
    attributionId: orderAttribution.id,
    directCommission: directAmount,
    overrideCommission: overrideAmount,
    totalCommission: directAmount + overrideAmount,
    isSelfReferral: attribution.isSelfReferral,
    creatorId: attribution.creatorId,
    recruiterId,
  }
}

// ===========================================
// REFUND REVERSAL
// ===========================================

export async function handleRefundReversal(orderId: string): Promise<number> {
  // Find the order attribution
  const attribution = await getOrderAttributionByOrderId(orderId)
  if (!attribution) return 0

  // Reverse all commission entries
  const reversedCount = await reverseCommissionsForAttribution(attribution.id)

  // Update attribution status
  await updateOrderAttributionStatus(attribution.id, 'refunded')

  console.log(`Reversed ${reversedCount} commissions for order ${orderId}`)
  return reversedCount
}

// ===========================================
// TIER RECALCULATION (Cron Job)
// ===========================================

export async function recalculateAllTiers(): Promise<{
  updated: number
  total: number
}> {
  const creators = await getAllActiveCreators()
  let updated = 0

  for (const creator of creators) {
    // Update recruit count from DB
    const newCount = await updateCreatorRecruitCount(creator.id)

    // Calculate tier
    const tierConfig = getTierForRecruitCount(newCount)

    // Update if changed
    if (tierConfig.tier !== creator.tier || tierConfig.overrideRate !== Number(creator.override_rate)) {
      await updateCreatorTier(creator.id, tierConfig.tier, tierConfig.overrideRate)
      updated++
      console.log(
        `Creator ${creator.id}: tier ${creator.tier}→${tierConfig.tier}, ` +
        `override ${creator.override_rate}%→${tierConfig.overrideRate}%`
      )
    }
  }

  return { updated, total: creators.length }
}
