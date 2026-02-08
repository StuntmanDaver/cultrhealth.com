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
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        ledger: [
          { id: '1', commission_type: 'direct', commission_amount: '39.90', commission_rate: '0.10', base_amount: '399.00', status: 'approved', created_at: '2026-02-05T14:30:00Z' },
          { id: '2', commission_type: 'direct', commission_amount: '29.90', commission_rate: '0.10', base_amount: '299.00', status: 'pending', created_at: '2026-02-03T09:15:00Z' },
          { id: '3', commission_type: 'override', commission_amount: '23.96', commission_rate: '0.04', base_amount: '599.00', status: 'approved', created_at: '2026-02-01T12:00:00Z' },
          { id: '4', commission_type: 'direct', commission_amount: '59.90', commission_rate: '0.10', base_amount: '599.00', status: 'paid', created_at: '2026-01-28T16:45:00Z' },
          { id: '5', commission_type: 'direct', commission_amount: '39.90', commission_rate: '0.10', base_amount: '399.00', status: 'paid', created_at: '2026-01-22T11:00:00Z' },
        ],
      })
    }
    console.error('Commission ledger error:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}
