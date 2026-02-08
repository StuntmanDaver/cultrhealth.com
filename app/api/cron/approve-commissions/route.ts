import { NextRequest, NextResponse } from 'next/server'
import { approveEligibleCommissions } from '@/lib/creators/db'

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
    const approvedCount = await approveEligibleCommissions()

    console.log(`Cron: Approved ${approvedCount} commissions`)

    return NextResponse.json({
      success: true,
      approved: approvedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron approve commissions error:', error)
    return NextResponse.json({ error: 'Failed to approve commissions' }, { status: 500 })
  }
}
