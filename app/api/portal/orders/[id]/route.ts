export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getOrderDetail } from '@/lib/asher-med-api'
import { sql } from '@vercel/postgres'
import type { PortalOrder } from '@/lib/portal-orders'

/**
 * GET /api/portal/orders/[id]
 *
 * Returns full order detail for a single order with ownership verification.
 * The authenticated member can only view their own orders.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Verify portal authentication
  const auth = await verifyPortalAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // 2. No patient ID — cannot look up orders
  if (!auth.asherPatientId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  try {
    // 3. Extract order ID from params
    const { id } = await params
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // 4. Fetch order detail from Asher Med
    const order = await getOrderDetail(orderId)

    // 5. Ownership check — verify order belongs to authenticated patient
    if (order.patientId !== auth.asherPatientId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // 6. Best-effort local DB enrichment for medication name
    let medicationName = order.orderType || 'Medication'
    try {
      const localOrder = await sql`
        SELECT medication_packages
        FROM asher_orders
        WHERE asher_order_id = ${orderId}
        LIMIT 1
      `
      if (localOrder.rows.length > 0 && localOrder.rows[0].medication_packages) {
        try {
          const packages = typeof localOrder.rows[0].medication_packages === 'string'
            ? JSON.parse(localOrder.rows[0].medication_packages)
            : localOrder.rows[0].medication_packages
          if (Array.isArray(packages) && packages.length > 0 && packages[0].name) {
            medicationName = packages[0].name
          }
        } catch {
          // Skip malformed medication_packages
        }
      }
    } catch {
      // Local DB enrichment is best-effort
    }

    // 7. Return full order detail as PortalOrder shape
    const portalOrder: PortalOrder = {
      id: order.id,
      status: order.status,
      orderType: order.orderType || null,
      doctorId: order.doctorId || null,
      partnerNote: order.partnerNote || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      medicationName,
    }

    return NextResponse.json({ success: true, order: portalOrder })
  } catch {
    // 8. Asher Med API error — return graceful 502
    return NextResponse.json(
      { success: false, error: 'Unable to load order details' },
      { status: 502 }
    )
  }
}
