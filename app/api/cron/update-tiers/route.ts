import { NextRequest, NextResponse } from 'next/server'
import { recalculateAllTiers } from '@/lib/creators/commission'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await recalculateAllTiers()

    console.log(`Cron: Updated ${result.updated}/${result.total} creator tiers`)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron update tiers error:', error)
    return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 })
  }
}
