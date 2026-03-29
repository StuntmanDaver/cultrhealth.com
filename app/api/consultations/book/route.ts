import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getMonthlyConsultationCount } from '@/lib/consultations-db'
import { TIER_CONSULTATION_LIMITS } from '@/lib/config/consultations'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { planTier, consultationType } = body

    if (!planTier || !consultationType) {
      return NextResponse.json(
        { success: false, error: 'Missing planTier or consultationType' },
        { status: 400 }
      )
    }

    const tierLimit = TIER_CONSULTATION_LIMITS[planTier] ?? 0
    if (tierLimit === 0) {
      return NextResponse.json(
        { success: false, error: 'Your plan does not include consultations. Please upgrade.' },
        { status: 403 }
      )
    }

    if (tierLimit !== Infinity) {
      const monthlyCount = await getMonthlyConsultationCount(auth.email)
      if (monthlyCount >= tierLimit) {
        return NextResponse.json(
          {
            success: false,
            error: `You have used all ${tierLimit} consultation(s) this month.`,
            used: monthlyCount,
            limit: tierLimit,
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      calcomOrgSlug: process.env.NEXT_PUBLIC_CALCOM_ORG_SLUG || 'cultrhealth',
    })
  } catch (error) {
    console.error('Failed to validate booking eligibility:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
