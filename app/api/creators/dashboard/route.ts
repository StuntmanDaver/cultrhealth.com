import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, getCreatorDashboardStats, getCommissionBreakdownByCreator } from '@/lib/creators/db'
import { getNextTierRequirement, isInBonusWindow, getBonusWindowDaysLeft } from '@/lib/config/affiliate'

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

    const [stats, breakdown] = await Promise.all([
      getCreatorDashboardStats(auth.creatorId),
      getCommissionBreakdownByCreator(auth.creatorId),
    ])

    const conversionRate =
      stats.totalClicks > 0
        ? Math.round((stats.totalOrders / stats.totalClicks) * 10000) / 100
        : 0

    return NextResponse.json({
      metrics: {
        ...stats,
        conversionRate,
        tier: creator.tier,
        overrideRate: Number(creator.override_rate),
        recruitCount: creator.recruit_count,
        nextTierRequirement: getNextTierRequirement(creator.tier),
        activeMemberCount: creator.active_member_count ?? 0,
        commissionRate: Number(creator.commission_rate ?? 10),
        creatorStartDate: creator.creator_start_date,
        isInBonusWindow: isInBonusWindow(creator.creator_start_date),
        bonusWindowDaysLeft: getBonusWindowDaysLeft(creator.creator_start_date),
        directMembershipEarnings: breakdown.directMembership,
        directProductEarnings: breakdown.directProduct,
        overrideEarnings: breakdown.override,
      },
      creator: {
        id: creator.id,
        full_name: creator.full_name,
        status: creator.status,
        tier: creator.tier,
        override_rate: Number(creator.override_rate),
        recruit_count: creator.recruit_count,
        active_member_count: creator.active_member_count ?? 0,
        commission_rate: Number(creator.commission_rate ?? 10),
        creator_start_date: creator.creator_start_date,
      },
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
