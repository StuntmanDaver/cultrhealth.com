import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, getCreatorDashboardStats } from '@/lib/creators/db'
import { getNextTierRequirement } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Dev mode: return mock dashboard data when DB is unavailable
  if (process.env.NODE_ENV === 'development') {
    try {
      const creator = await getCreatorById(auth.creatorId)
      if (creator) {
        const stats = await getCreatorDashboardStats(auth.creatorId)
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
          },
          creator: {
            id: creator.id,
            full_name: creator.full_name,
            status: creator.status,
            tier: creator.tier,
            override_rate: Number(creator.override_rate),
            recruit_count: creator.recruit_count,
          },
        })
      }
    } catch {
      // DB unavailable in dev — fall through to mock data
    }

    return NextResponse.json({
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
        overrideRate: 4,
        recruitCount: 12,
        nextTierRequirement: getNextTierRequirement(2),
      },
      creator: {
        id: 'dev_creator',
        full_name: 'Dev Creator',
        status: 'active',
        tier: 2,
        override_rate: 4,
        recruit_count: 12,
      },
    })
  }

  try {
    const creator = await getCreatorById(auth.creatorId)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const stats = await getCreatorDashboardStats(auth.creatorId)

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
      },
      creator: {
        id: creator.id,
        full_name: creator.full_name,
        status: creator.status,
        tier: creator.tier,
        override_rate: Number(creator.override_rate),
        recruit_count: creator.recruit_count,
      },
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
