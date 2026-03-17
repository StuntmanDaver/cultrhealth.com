import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * SiPhox Kit Fulfillment Cron Job
 * Runs every 15 minutes via Vercel Cron.
 *
 * 1. Processes deferred orders (pending_intake) where intake data is now available
 * 2. Retries failed orders (pending_fulfillment) up to 3 times
 *
 * Protected by CRON_SECRET Bearer token.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { processDeferredOrders, retryFailedOrders } = await import('@/lib/siphox/fulfillment')

    const [deferred, retry] = await Promise.all([
      processDeferredOrders(),
      retryFailedOrders(),
    ])

    console.log(
      `Cron siphox-fulfillment: ${deferred.processed} deferred (${deferred.fulfilled} fulfilled, ${deferred.stillPending} still pending), ${retry.retried} retried (${retry.fulfilled} fulfilled, ${retry.permanentlyFailed} failed)`
    )

    return NextResponse.json({
      success: true,
      deferred,
      retry,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron siphox-fulfillment error:', error)
    return NextResponse.json(
      { error: 'Failed to process SiPhox fulfillment' },
      { status: 500 }
    )
  }
}
