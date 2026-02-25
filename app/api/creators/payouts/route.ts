import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import {
  getPayoutsByCreator,
  getCreatorById,
  updateCreatorProfile,
  getCommissionSummaryByCreator,
} from '@/lib/creators/db'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payouts = await getPayoutsByCreator(auth.creatorId)
    const creator = await getCreatorById(auth.creatorId)
    const summary = await getCommissionSummaryByCreator(auth.creatorId)

    return NextResponse.json({
      payouts,
      payoutMethod: creator?.payout_method || null,
      pendingBalance: summary.approved,
      holdBalance: summary.pending,
      minPayout: COMMISSION_CONFIG.minPayoutAmount,
    })
  } catch (error) {
    console.error('Payouts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { payout_method, payout_destination_id } = body

    if (!payout_method) {
      return NextResponse.json({ error: 'Payout method is required' }, { status: 400 })
    }

    await updateCreatorProfile(auth.creatorId, {
      payout_method,
      payout_destination_id,
    })

    return NextResponse.json({ success: true, message: 'Payout method updated' })
  } catch (error) {
    console.error('Payout method update error:', error)
    return NextResponse.json({ error: 'Failed to update payout method' }, { status: 500 })
  }
}
