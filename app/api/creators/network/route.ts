import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import {
  getCreatorById,
  getRecruitsByCreatorId,
  getCommissionsByCreator,
  getPortfolioByCreator,
} from '@/lib/creators/db'
import { getNextTierRequirement, getTierName } from '@/lib/config/affiliate'
import { redactEmail } from '@/lib/creators/attribution'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const creator = await getCreatorById(auth.creatorId)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const [recruits, portfolio] = await Promise.all([
      getRecruitsByCreatorId(auth.creatorId),
      getPortfolioByCreator(auth.creatorId),
    ])

    // Get override commissions (use large limit to get all for summing)
    const overrideCommissions = await getCommissionsByCreator(auth.creatorId, undefined, 10000)
    const overrideEarnings = overrideCommissions
      .filter((c) => c.commission_type === 'override' && c.status !== 'reversed')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0)

    const activeRecruits = recruits.filter((r) => r.status === 'active')

    return NextResponse.json({
      network: {
        totalRecruits: recruits.length,
        activeRecruits: activeRecruits.length,
        overrideEarnings: Math.round(overrideEarnings * 100) / 100,
        tier: creator.tier,
        tierName: getTierName(creator.tier),
        overrideRate: Number(creator.override_rate),
        recruitCount: creator.recruit_count,
        nextTierAt: getNextTierRequirement(creator.tier),
      },
      recruits: recruits.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        status: r.status,
        created_at: r.created_at,
      })),
      portfolio: portfolio.map((p) => ({
        id: p.id,
        customer_email: p.customer_email ? redactEmail(p.customer_email) : null,
        subscription_status: p.subscription_status,
        payment_count: p.payment_count,
        first_payment_at: p.first_payment_at,
        attribution_active: p.attribution_active,
      })),
    })
  } catch (error) {
    console.error('Network fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch network' }, { status: 500 })
  }
}
