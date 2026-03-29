import { NextRequest, NextResponse } from 'next/server'
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

    const consultations = await getConsultationsForProvider(auth.email, { upcoming })

    return NextResponse.json({ success: true, consultations })
  } catch (error) {
    console.error('Failed to list provider consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
