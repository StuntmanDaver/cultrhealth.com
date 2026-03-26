import { NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import {
  getPatients,
  getOrders,
  isAsherMedConfigured,
} from '@/lib/asher-med-api'
import type { AsherPatient, AsherOrder } from '@/lib/asher-med-api'
import { sql } from '@vercel/postgres'

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

export interface AsherDashboardData {
  patients: {
    total: number
    active: number
    inactive: number
    activePercent: number
    inactivePercent: number
  }
  orderStatusCounts: Record<string, number>
  pipelineStatuses: typeof PIPELINE_STATUSES
  quickApproval: Array<{
    id: string | number
    patientName: string
    email: string
    createdAt: string
    status: string
  }>
  incompleteIntakes: Array<{
    id: string
    email: string
    planTier: string | null
    createdAt: string
  }>
  lastSynced: string
}

/** Normalise whatever status string the API returns into a known pipeline bucket */
function normaliseToPipelineStatus(status: string): PipelineStatus | null {
  const lower = status.toLowerCase().replace(/[_-]/g, ' ').trim()

  const map: Record<string, PipelineStatus> = {
    incomplete: 'Incomplete',
    pending: 'Approval Needed',
    'approval needed': 'Approval Needed',
    'waitingroom': 'Approval Needed',
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

export async function GET() {
  try {
    // Verify admin access (same pattern as /api/admin/intakes)
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails =
      process.env.ADMIN_ALLOWED_EMAILS ||
      process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS ||
      ''
    const allowedEmails = adminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin =
      allowedEmails.includes(session.email.toLowerCase()) ||
      isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if Asher Med is configured
    if (!isAsherMedConfigured()) {
      return NextResponse.json({
        data: {
          patients: { total: 0, active: 0, inactive: 0, activePercent: 0, inactivePercent: 0 },
          orderStatusCounts: Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])),
          pipelineStatuses: PIPELINE_STATUSES,
          quickApproval: [],
          incompleteIntakes: [],
          lastSynced: new Date().toISOString(),
        } satisfies AsherDashboardData,
      })
    }

    // Fetch patients and orders in parallel from Asher Med
    const [patientsRes, ordersRes] = await Promise.all([
      getPatients({ limit: 1000 }),
      getOrders({ limit: 1000 }),
    ])

    const patients: AsherPatient[] = patientsRes.data || []
    const orders: AsherOrder[] = ordersRes.data || []

    // --- Patient metrics ---
    const active = patients.filter((p) => p.status === 'ACTIVE').length
    const inactive = patients.filter((p) => p.status === 'INACTIVE').length
    const total = patients.length

    // --- Order pipeline counts ---
    const orderStatusCounts: Record<string, number> = Object.fromEntries(
      PIPELINE_STATUSES.map((s) => [s, 0])
    )

    for (const order of orders) {
      const bucket = normaliseToPipelineStatus(order.status)
      if (bucket) {
        orderStatusCounts[bucket]++
      } else {
        // Unknown status — still count it under its raw name
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1
      }
    }

    // --- Quick Approval (orders needing partner approval) ---
    const approvalOrders = orders
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

    // --- Incomplete intakes from our DB ---
    let incompleteIntakes: AsherDashboardData['incompleteIntakes'] = []
    if (process.env.POSTGRES_URL) {
      const result = await sql`
        SELECT id, customer_email, plan_tier, created_at
        FROM pending_intakes
        WHERE intake_status = 'pending'
        ORDER BY created_at DESC
        LIMIT 10
      `
      incompleteIntakes = result.rows.map((r) => ({
        id: r.id,
        email: r.customer_email,
        planTier: r.plan_tier,
        createdAt: r.created_at,
      }))
    }

    const data: AsherDashboardData = {
      patients: {
        total,
        active,
        inactive,
        activePercent: total > 0 ? Math.round((active / total) * 100) : 0,
        inactivePercent: total > 0 ? Math.round((inactive / total) * 100) : 0,
      },
      orderStatusCounts,
      pipelineStatuses: PIPELINE_STATUSES,
      quickApproval: approvalOrders,
      incompleteIntakes,
      lastSynced: new Date().toISOString(),
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[admin/asher-dashboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Asher Med dashboard data' },
      { status: 500 }
    )
  }
}
