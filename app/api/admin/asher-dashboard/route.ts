import { NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { isAsherMedConfigured } from '@/lib/asher-med-api'
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
  source: 'cache' | 'not_configured'
}

export async function GET() {
  try {
    // Verify admin access
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

    const emptyData: AsherDashboardData = {
      patients: { total: 0, active: 0, inactive: 0, activePercent: 0, inactivePercent: 0 },
      orderStatusCounts: Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0])),
      pipelineStatuses: PIPELINE_STATUSES,
      quickApproval: [],
      incompleteIntakes: [],
      lastSynced: new Date().toISOString(),
      source: 'not_configured',
    }

    if (!isAsherMedConfigured()) {
      return NextResponse.json({ data: emptyData })
    }

    // Read from cron-populated cache (asher-sync cron runs every 30 min)
    let cachedData: Partial<AsherDashboardData> | null = null
    try {
      const { rows } = await sql`
        SELECT data, synced_at FROM asher_sync_cache
        WHERE sync_type = 'dashboard'
        LIMIT 1
      `
      if (rows[0]) {
        cachedData = rows[0].data as Partial<AsherDashboardData>
        cachedData.lastSynced = rows[0].synced_at
      }
    } catch {
      // Cache table may not exist yet — fall through to empty
    }

    // Incomplete intakes are always live from our DB
    let incompleteIntakes: AsherDashboardData['incompleteIntakes'] = []
    if (process.env.POSTGRES_URL) {
      try {
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
      } catch {
        // Table may not exist
      }
    }

    if (cachedData) {
      const data: AsherDashboardData = {
        patients: cachedData.patients || emptyData.patients,
        orderStatusCounts: cachedData.orderStatusCounts || emptyData.orderStatusCounts,
        pipelineStatuses: PIPELINE_STATUSES,
        quickApproval: cachedData.quickApproval || [],
        incompleteIntakes,
        lastSynced: cachedData.lastSynced || new Date().toISOString(),
        source: 'cache',
      }
      return NextResponse.json({ data })
    }

    // No cache yet — return empty with intakes
    return NextResponse.json({
      data: { ...emptyData, incompleteIntakes, source: 'not_configured' as const },
    })
  } catch (error) {
    console.error('[admin/asher-dashboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Asher Med dashboard data' },
      { status: 500 }
    )
  }
}
