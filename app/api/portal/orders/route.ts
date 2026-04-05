export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { sql } from '@vercel/postgres'
import { getAppointments, mapAppointmentToPortalOrder, isHealthieConfigured } from '@/lib/healthie'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * GET /api/portal/orders
 *
 * Returns the authenticated member's appointments from Healthie,
 * with fallback to legacy asher_orders table.
 */
export async function GET(request: NextRequest) {
  // 1. Verify portal authentication
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // 2. No patient ID means never-seen phone — valid empty state
  if (!auth.ehrPatientId) {
    return NextResponse.json({ success: true, orders: [] })
  }

  // 3. Try Healthie API first
  if (isHealthieConfigured()) {
    try {
      const appointments = await getAppointments(auth.ehrPatientId)
      const orders: PortalOrder[] = appointments.map(mapAppointmentToPortalOrder)
      return NextResponse.json({ success: true, orders })
    } catch (error) {
      console.error('Healthie API error, falling back to local DB:', error)
    }
  }

  // 4. Fallback: legacy asher_orders query
  try {
    const result = await sql`
      SELECT
        id,
        asher_order_id,
        order_type,
        order_status,
        partner_note,
        medication_packages,
        created_at,
        updated_at
      FROM asher_orders
      WHERE asher_patient_id::text = ${auth.ehrPatientId}
      ORDER BY created_at DESC
    `

    const orders: PortalOrder[] = result.rows.map((row) => {
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

      return {
        id: row.asher_order_id || row.id,
        status: row.order_status || 'pending',
        sourceType: 'legacy_order' as const,
        orderType: row.order_type || null,
        doctorId: null,
        partnerNote: row.partner_note || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        medicationName,
      }
    })

    return NextResponse.json({ success: true, orders })
  } catch {
    return NextResponse.json({ success: true, orders: [] })
  }
}
