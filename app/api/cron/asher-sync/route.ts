import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { startCronRun } from '@/lib/cron-logger'
import {
  getPatients,
  getOrders,
  isAsherMedConfigured,
} from '@/lib/asher-med-api'
import type { AsherPatient, AsherOrder } from '@/lib/asher-med-api'

export const dynamic = 'force-dynamic'

/** The 8 pipeline statuses shown on the Asher Med partner dashboard */
const PIPELINE_STATUSES = [
  'Incomplete',
  'Approval Needed',
  'Submitted',
  'RX Submitted',
  'RX Approved',
  'Shipped',
  'Delivered',
  'Payment Pending',
] as const

type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

function normaliseToPipelineStatus(status: string): PipelineStatus | null {
  const lower = status.toLowerCase().replace(/[_-]/g, ' ').trim()
  const map: Record<string, PipelineStatus> = {
    incomplete: 'Incomplete',
    pending: 'Approval Needed',
    'approval needed': 'Approval Needed',
    waitingroom: 'Approval Needed',
    submitted: 'Submitted',
    approved: 'Submitted',
    'rx submitted': 'RX Submitted',
    'rx approved': 'RX Approved',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Delivered',
    'payment pending': 'Payment Pending',
  }
  return map[lower] ?? null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const run = await startCronRun('asher-sync')

  try {
    if (!isAsherMedConfigured()) {
      const result = { skipped: true, reason: 'Asher Med not configured' }
      await run.success(result)
      return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() })
    }

    // Fetch patients and orders from Asher Med
    const [patientsRes, ordersRes] = await Promise.all([
      getPatients({ limit: 1000 }),
      getOrders({ limit: 1000 }),
    ])

    const patients: AsherPatient[] = patientsRes.data || []
    const orders: AsherOrder[] = ordersRes.data || []

    // Compute patient metrics
    const active = patients.filter((p) => p.status === 'ACTIVE').length
    const inactive = patients.filter((p) => p.status === 'INACTIVE').length
    const total = patients.length

    // Compute order pipeline counts
    const orderStatusCounts: Record<string, number> = Object.fromEntries(
      PIPELINE_STATUSES.map((s) => [s, 0])
    )
    for (const order of orders) {
      const bucket = normaliseToPipelineStatus(order.status)
      if (bucket) {
        orderStatusCounts[bucket]++
      } else {
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1
      }
    }

    // Quick approval orders
    const quickApproval = orders
      .filter((o) => {
        const lower = o.status.toLowerCase().replace(/[_-]/g, ' ').trim()
        return lower === 'pending' || lower === 'approval needed' || lower === 'waitingroom'
      })
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        patientName: o.patient
          ? `${o.patient.firstName || ''} ${o.patient.lastName || ''}`.trim()
          : 'Unknown',
        email: o.patient?.email || '',
        createdAt: o.createdAt,
        status: o.status,
      }))

    // Cache the dashboard data
    const dashboardData = {
      patients: {
        total,
        active,
        inactive,
        activePercent: total > 0 ? Math.round((active / total) * 100) : 0,
        inactivePercent: total > 0 ? Math.round((inactive / total) * 100) : 0,
      },
      orderStatusCounts,
      pipelineStatuses: PIPELINE_STATUSES,
      quickApproval,
      lastSynced: new Date().toISOString(),
    }

    // Upsert into cache table
    await sql`
      INSERT INTO asher_sync_cache (sync_type, data, synced_at)
      VALUES ('dashboard', ${JSON.stringify(dashboardData)}, NOW())
      ON CONFLICT (sync_type)
      DO UPDATE SET data = ${JSON.stringify(dashboardData)}, synced_at = NOW()
    `

    const result = {
      patientsTotal: total,
      patientsActive: active,
      ordersTotal: orders.length,
      approvalNeeded: quickApproval.length,
    }

    console.log(
      `Cron: Asher Med sync — ${total} patients (${active} active), ` +
      `${orders.length} orders, ${quickApproval.length} needing approval`
    )

    await run.success(result)
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron asher-sync error:', error)
    await run.error(error)
    return NextResponse.json({ error: 'Failed to sync Asher Med data' }, { status: 500 })
  }
}
