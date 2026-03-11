export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getOrders } from '@/lib/asher-med-api'
import { sql } from '@vercel/postgres'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * GET /api/portal/orders
 *
 * Returns the authenticated member's orders with live status from Asher Med,
 * merged with local medication names from the asher_orders table.
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
    // 3. Fetch orders from Asher Med
    const result = await getOrders({ patientId: auth.asherPatientId })

    // 4. Best-effort local DB enrichment for medication names
    let medMap: Record<number, string> = {}
    try {
      const localOrders = await sql`
        SELECT asher_order_id, medication_packages
        FROM asher_orders
        WHERE asher_patient_id = ${auth.asherPatientId}
      `
      for (const row of localOrders.rows) {
        if (row.asher_order_id && row.medication_packages) {
          try {
            const packages = typeof row.medication_packages === 'string'
              ? JSON.parse(row.medication_packages)
              : row.medication_packages
            if (Array.isArray(packages) && packages.length > 0 && packages[0].name) {
              medMap[row.asher_order_id] = packages[0].name
            }
          } catch {
            // Skip malformed medication_packages
          }
        }
      }
    } catch {
      // Local DB enrichment is best-effort — continue without it
    }

    // 5. Map to PortalOrder shape with merged medication names
    const orders: PortalOrder[] = result.data.map((order) => ({
      id: order.id,
      status: order.status,
      orderType: order.orderType || null,
      doctorId: order.doctorId || null,
      partnerNote: order.partnerNote || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      medicationName: medMap[order.id] || order.orderType || 'Medication',
    }))

    // 6. Sort by createdAt descending (most recent first)
    orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ success: true, orders })
  } catch {
    // 7. Asher Med API error — return graceful 502
    return NextResponse.json(
      { success: false, error: 'Unable to load orders', orders: [] },
      { status: 502 }
    )
  }
}
