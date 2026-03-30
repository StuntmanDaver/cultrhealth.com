import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth, isProviderEmail } from '@/lib/auth'
import { getConsultationsForProvider } from '@/lib/consultations-db'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'
    const days = Number(searchParams.get('days'))

    // Date-range query for day/week views
    if (days > 0) {
      const providerEmail = auth.email.toLowerCase()
      const result = await sql`
        SELECT * FROM consult_requests
        WHERE lower(provider_email) = ${providerEmail}
          AND scheduled_at >= CURRENT_DATE
          AND scheduled_at < CURRENT_DATE + make_interval(days => ${days})
        ORDER BY scheduled_at ASC
        LIMIT 100
      `
      return NextResponse.json({ success: true, consultations: result.rows })
    }

    const consultations = await getConsultationsForProvider(auth.email, { upcoming })

    return NextResponse.json({ success: true, consultations })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
