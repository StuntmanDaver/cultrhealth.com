import { NextRequest, NextResponse } from 'next/server'
import { startCronRun } from '@/lib/cron-logger'
import { getActiveKitOrders, updateKitOrderStatus } from '@/lib/siphox/db'
import { getOrder, isSiphoxConfigured } from '@/lib/siphox/client'

export const dynamic = 'force-dynamic'

function mapSiphoxStatus(apiStatus: string): string | null {
  const lower = apiStatus.toLowerCase().replace(/[_-]/g, ' ').trim()
  const statusMap: Record<string, string> = {
    ordered: 'ordered',
    shipped: 'shipped',
    registered: 'registered',
    'sample received': 'sample_mailed',
    'sample mailed': 'sample_mailed',
    processing: 'processing',
    completed: 'results_ready',
    'results ready': 'results_ready',
  }

  return statusMap[lower] ?? null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const run = await startCronRun('siphox-status-sync')

  try {
    if (!isSiphoxConfigured()) {
      const result = { skipped: true, reason: 'SiPhox not configured' }
      await run.success(result)
      return NextResponse.json({ success: true, ...result })
    }

    let activeOrders
    try {
      activeOrders = await getActiveKitOrders(50)
    } catch {
      const result = { skipped: true, reason: 'siphox_kit_orders table not available' }
      await run.success(result)
      return NextResponse.json({ success: true, ...result })
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    for (const order of activeOrders) {
      try {
        let siphoxOrder
        try {
          siphoxOrder = await getOrder(order.siphox_order_id)
        } catch {
          unchanged++
          continue
        }

        const newStatus = mapSiphoxStatus(siphoxOrder.status)
        if (!newStatus) {
          unchanged++
          continue
        }

        const trackingNumber = siphoxOrder.tracking_number
        const statusChanged = newStatus !== order.status
        const trackingChanged = Boolean(
          trackingNumber && trackingNumber !== order.tracking_number
        )

        if (statusChanged || trackingChanged) {
          await updateKitOrderStatus(
            order.siphox_order_id,
            statusChanged ? newStatus : order.status,
            trackingNumber || undefined
          )
          updated++
        } else {
          unchanged++
        }
      } catch {
        errors++
      }
    }

    const result = {
      total: activeOrders.length,
      updated,
      unchanged,
      errors,
    }

    console.log(
      `Cron siphox-status-sync: ${activeOrders.length} checked, ${updated} updated, ${unchanged} unchanged, ${errors} errors`
    )

    await run.success(result)
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron siphox-status-sync error:', error)
    await run.error(error)
    return NextResponse.json(
      { error: 'Failed to sync SiPhox statuses' },
      { status: 500 }
    )
  }
}
