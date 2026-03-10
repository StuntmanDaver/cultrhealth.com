import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, getCreatorDashboardStats, getCommissionBreakdownByCreator } from '@/lib/creators/db'
import { getNextTierRequirement, isInBonusWindow, getBonusWindowDaysLeft } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isStagingCreator = auth.creatorId === 'staging_creator' || auth.creatorId === 'dev_creator'

  const mockDashboard = () => NextResponse.json({
    metrics: {
      totalClicks: 1247,
      totalOrders: 38,
      totalRevenue: 14820,
      totalCommission: 1482,
      pendingCommission: 396,
      thisMonthClicks: 312,
      thisMonthOrders: 11,
      thisMonthRevenue: 4290,
      thisMonthCommission: 429,
      conversionRate: 3.05,
      tier: 2,
      overrideRate: 15,
      recruitCount: 12,
      nextTierRequirement: getNextTierRequirement(2),
      activeMemberCount: 24,
      commissionRate: 10,
      creatorStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isInBonusWindow: true,
      bonusWindowDaysLeft: 120,
      directMembershipEarnings: 890,
      directProductEarnings: 340,
      overrideEarnings: 252,
    },
    creator: {
      id: auth.creatorId || 'staging_creator',
      full_name: 'Staging Creator',
      status: 'active',
      tier: 2,
      override_rate: 15,
      recruit_count: 12,
      active_member_count: 24,
      commission_rate: 10,
      creator_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  if (isStagingCreator) {
    return mockDashboard()
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
