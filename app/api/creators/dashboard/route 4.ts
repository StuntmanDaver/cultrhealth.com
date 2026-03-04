import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, getCreatorDashboardStats } from '@/lib/creators/db'
import { getNextTierRequirement } from '@/lib/config/affiliate'

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
