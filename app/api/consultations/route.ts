import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getConsultationsForMember, getMonthlyConsultationCount } from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS } from '@/lib/config/consultations'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const consultations = await getConsultationsForMember(auth.email, { status })
    const monthlyCount = await getMonthlyConsultationCount(auth.email)

    const latestTier = consultations[0]?.plan_tier || 'club'
    const limit = TIER_CONSULTATION_LIMITS[latestTier] ?? 0

    return NextResponse.json({
      success: true,
      consultations,
      usage: {
        used: monthlyCount,
        limit: limit === Infinity ? 'unlimited' : limit,
        remaining: limit === Infinity ? 'unlimited' : Math.max(0, limit - monthlyCount),
      },
    })
  } catch (error) {
    console.error('Failed to list consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
