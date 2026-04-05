export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { sql } from '@vercel/postgres'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * GET /api/portal/orders
 *
 * Returns the authenticated member's orders from the local asher_orders table.
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

  // 2. No patient ID means never-seen phone (Case C) — valid empty state
  if (!auth.asherPatientId) {
    return NextResponse.json({ success: true, orders: [] })
  }

  try {
    // 3. Fetch orders from local DB
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
      WHERE asher_patient_id = ${auth.asherPatientId}
      ORDER BY created_at DESC
    `

    // 4. Map to PortalOrder shape
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
    // 5. Unexpected error — return graceful empty state
    return NextResponse.json({ success: true, orders: [] })
  }
}
