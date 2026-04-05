export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { sql } from '@vercel/postgres'
import { getAppointment, mapAppointmentToPortalOrder, isHealthieConfigured } from '@/lib/healthie'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * GET /api/portal/orders/[id]
 *
 * Returns full order detail for a single order/appointment with ownership verification.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  if (!auth.ehrPatientId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Try Healthie first for appointment detail
    if (isHealthieConfigured()) {
      try {
        const appt = await getAppointment(id)
        // Ownership check: appointment's user ID should match ehrPatientId
        if (appt.user?.id === auth.ehrPatientId) {
          const order = mapAppointmentToPortalOrder(appt)
          return NextResponse.json({ success: true, order })
        }
      } catch {
        // Not found in Healthie or API error — fall through to legacy DB
      }
    }

    // Fallback: legacy asher_orders query
    const result = await sql`
      SELECT
        id,
        asher_order_id,
        asher_patient_id,
        order_type,
        order_status,
        partner_note,
        medication_packages,
        created_at,
        updated_at
      FROM asher_orders
      WHERE (asher_order_id = ${id} OR id::text = ${id})
      LIMIT 1
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const row = result.rows[0]

    // Ownership check
    if (String(row.asher_patient_id) !== String(auth.ehrPatientId)) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    let medicationName = row.order_type || 'Medication'
    try {
      const packages = typeof row.medication_packages === 'string'
        ? JSON.parse(row.medication_packages)
        : row.medication_packages
      if (Array.isArray(packages) && packages.length > 0 && packages[0].name) {
        medicationName = packages[0].name
      }
    } catch {
      // Skip malformed medication_packages
    }

    const portalOrder: PortalOrder = {
      id: row.asher_order_id || row.id,
      status: row.order_status || 'pending',
      sourceType: 'legacy_order',
      orderType: row.order_type || null,
      doctorId: null,
      partnerNote: row.partner_note || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      medicationName,
    }

    return NextResponse.json({ success: true, order: portalOrder })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load order details' },
      { status: 502 }
    )
  }
}
