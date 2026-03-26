import { NextRequest, NextResponse } from 'next/server'
import { approveEligibleCommissions } from '@/lib/creators/db'
import { startCronRun } from '@/lib/cron-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const run = await startCronRun('approve-commissions')

  try {
    const { approved, selfReferralsReverted } = await approveEligibleCommissions()

    console.log(`Cron: Approved ${approved} commissions, reverted ${selfReferralsReverted} self-referrals`)

    const result = { approved, selfReferralsReverted }
    await run.success(result)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron approve commissions error:', error)
    await run.error(error)
    return NextResponse.json({ error: 'Failed to approve commissions' }, { status: 500 })
  }
}
