import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getOrderAttributionsByCreator } from '@/lib/creators/db'
import { redactEmail } from '@/lib/creators/attribution'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const attributions = await getOrderAttributionsByCreator(auth.creatorId, limit, offset)

    // Redact customer emails for privacy
    const redacted = attributions.map((a) => ({
      ...a,
      customer_email: a.customer_email ? redactEmail(a.customer_email) : null,
    }))

    return NextResponse.json({ orders: redacted })
  } catch (error) {
    console.error('Earnings orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
