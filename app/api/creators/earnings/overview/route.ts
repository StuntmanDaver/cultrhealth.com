import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCommissionSummaryByCreator, getCreatorOrderStats, getCommissionTotalSince } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const commissionSummary = await getCommissionSummaryByCreator(auth.creatorId)

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Use commission_ledger for monthly earnings (all streams: direct + override)
    const [thisMonthEarnings, lastMonthEarnings] = await Promise.all([
      getCommissionTotalSince(auth.creatorId, thisMonthStart),
      getCommissionTotalSince(auth.creatorId, lastMonthStart, thisMonthStart),
    ])

    const allTimeStats = await getCreatorOrderStats(auth.creatorId)

    const avgOrderValue =
      allTimeStats.totalOrders > 0
        ? Math.round((allTimeStats.totalRevenue / allTimeStats.totalOrders) * 100) / 100
        : 0

    return NextResponse.json({
      earnings: {
        lifetimeEarnings: commissionSummary.total,
        pendingEarnings: commissionSummary.pending + commissionSummary.approved,
        paidEarnings: commissionSummary.paid,
        thisMonthEarnings,
        lastMonthEarnings,
        avgOrderValue,
      },
    })
  } catch (error) {
    console.error('Earnings overview error:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}
