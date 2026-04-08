import { NextRequest, NextResponse } from 'next/server'
import { recalculateAllTiers } from '@/lib/creators/commission'
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

  const run = await startCronRun('update-tiers')

  try {
    const result = await recalculateAllTiers()

    console.log(
      `Cron: Updated ${result.updated}/${result.total} creator tiers, ` +
      `${result.portfolioUpdated} portfolio counts changed`
    )

    await run.success(result)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron update tiers error:', error)
    await run.error(error)
    return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 })
  }
}
