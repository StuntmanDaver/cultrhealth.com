import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getAllConsultations } from '@/lib/consultations-db'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const providerEmail = searchParams.get('provider') || undefined
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const { consultations, total } = await getAllConsultations({
      status,
      providerEmail,
      limit,
      offset,
    })

    return NextResponse.json({ success: true, consultations, total })
  } catch (error) {
    console.error('Failed to list admin consultations:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
