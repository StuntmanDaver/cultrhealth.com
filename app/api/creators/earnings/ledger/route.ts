import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCommissionsByCreator } from '@/lib/creators/db'
import type { CommissionStatus } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as CommissionStatus | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const entries = await getCommissionsByCreator(
      auth.creatorId,
      status || undefined,
      limit,
      offset
    )

    return NextResponse.json({ ledger: entries })
  } catch (error) {
    console.error('Commission ledger error:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
