import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import {
  getAllActiveCreators,
  getApprovedCommissionsForPayout,
  createPayout,
  updateCommissionStatus,
  createAdminAction,
} from '@/lib/creators/db'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { period_start, period_end } = body as {
      period_start?: string
      period_end?: string
    }

    const now = new Date()
    const start = period_start || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const end = period_end || new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    const creators = await getAllActiveCreators()
    const payoutResults: Array<{ creatorId: string; name: string; amount: number; commissionCount: number }> = []
    const skipped: Array<{ creatorId: string; name: string; amount: number; reason: string }> = []

    for (const creator of creators) {
      const commissions = await getApprovedCommissionsForPayout(creator.id)

      if (commissions.length === 0) continue

      const totalAmount = commissions.reduce(
        (sum, c) => sum + Number(c.commission_amount),
        0
      )

      if (totalAmount < COMMISSION_CONFIG.minPayoutAmount) {
        skipped.push({
          creatorId: creator.id,
          name: creator.full_name,
          amount: Math.round(totalAmount * 100) / 100,
          reason: `Below $${COMMISSION_CONFIG.minPayoutAmount} minimum`,
        })
        continue
      }

      if (!creator.payout_method) {
        skipped.push({
          creatorId: creator.id,
          name: creator.full_name,
          amount: Math.round(totalAmount * 100) / 100,
          reason: 'No payout method configured',
        })
        continue
      }

      // Create payout record
      const payout = await createPayout({
        creator_id: creator.id,
        amount: Math.round(totalAmount * 100) / 100,
        period_start: start,
        period_end: end,
        payout_method: creator.payout_method,
        commission_count: commissions.length,
      })

      // Mark commissions as paid
      for (const commission of commissions) {
        await updateCommissionStatus(commission.id, 'paid', payout.id)
      }

      payoutResults.push({
        creatorId: creator.id,
        name: creator.full_name,
        amount: Math.round(totalAmount * 100) / 100,
        commissionCount: commissions.length,
      })
    }

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'create_payout_batch',
      entity_type: 'payout',
      metadata: {
        period_start: start,
        period_end: end,
        payouts_created: payoutResults.length,
        total_amount: payoutResults.reduce((s, p) => s + p.amount, 0),
        skipped: skipped.length,
      },
    })

    return NextResponse.json({
      success: true,
      period: { start, end },
      payouts: payoutResults,
      skipped,
      summary: {
        totalPayouts: payoutResults.length,
        totalAmount: Math.round(payoutResults.reduce((s, p) => s + p.amount, 0) * 100) / 100,
        totalSkipped: skipped.length,
      },
    })
  } catch (error) {
    console.error('Admin payout batch error:', error)
    return NextResponse.json({ error: 'Failed to create payout batch' }, { status: 500 })
  }
}
