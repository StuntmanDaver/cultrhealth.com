import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth, isProviderEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const providerEmail = auth.email.toLowerCase()

    const [todayResult, intakesResult, monthResult, activeResult] = await Promise.all([
      // Today's consultations for this provider
      sql`
        SELECT COUNT(*)::integer AS count
        FROM consult_requests
        WHERE lower(provider_email) = ${providerEmail}
          AND status IN ('scheduled', 'in_progress')
          AND scheduled_at >= CURRENT_DATE
          AND scheduled_at < CURRENT_DATE + interval '1 day'
      `,
      // Pending intakes (all providers see all)
      sql`
        SELECT COUNT(*)::integer AS count
        FROM pending_intakes
        WHERE intake_status = 'pending'
      `,
      // Distinct patients seen this month by this provider
      sql`
        SELECT COUNT(DISTINCT customer_email)::integer AS count
        FROM consult_requests
        WHERE lower(provider_email) = ${providerEmail}
          AND status = 'completed'
          AND scheduled_at >= date_trunc('month', NOW())
          AND scheduled_at < date_trunc('month', NOW()) + interval '1 month'
      `,
      // Total active memberships
      sql`
        SELECT COUNT(*)::integer AS count
        FROM memberships
        WHERE subscription_status = 'active'
      `,
    ])

    return NextResponse.json({
      success: true,
      metrics: {
        todayConsultations: todayResult.rows[0]?.count ?? 0,
        pendingIntakes: intakesResult.rows[0]?.count ?? 0,
        patientsThisMonth: monthResult.rows[0]?.count ?? 0,
        activePatients: activeResult.rows[0]?.count ?? 0,
      },
    })
  } catch (error) {
    console.error('[provider/dashboard] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
