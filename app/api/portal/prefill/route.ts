import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getPatientById, getOrders } from '@/lib/asher-med-api'
import { mapPatientToIntakeData, mapPatientToRenewalData, estimateSupplyDays } from '@/lib/portal-prefill'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

/**
 * GET /api/portal/prefill
 * Returns pre-fill data for intake and renewal forms based on the authenticated
 * member's Asher Med patient record and order history.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await verifyPortalAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Case C: no patient record linked
    if (!auth.asherPatientId) {
      return NextResponse.json({ success: true, prefill: null })
    }

    // 3. Fetch patient from Asher Med
    const patient = await getPatientById(auth.asherPatientId)

    // 4. Fetch orders from Asher Med
    const ordersResponse = await getOrders({ patientId: auth.asherPatientId })
    const orders = ordersResponse.data || []

    // 5. Find last completed order
    const completedOrders = orders
      .filter((o) => o.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const lastCompletedOrder = completedOrders[0] || null

    // 6. Query local DB for medication info
    let medicationName: string | null = null
    let duration = 28 // default

    const dbResult = await sql`
      SELECT medication_packages FROM asher_orders
      WHERE asher_patient_id = ${auth.asherPatientId}
      ORDER BY created_at DESC LIMIT 1
    `

    if (dbResult.rows.length > 0 && dbResult.rows[0].medication_packages) {
      try {
        const packages = typeof dbResult.rows[0].medication_packages === 'string'
          ? JSON.parse(dbResult.rows[0].medication_packages)
          : dbResult.rows[0].medication_packages
        if (Array.isArray(packages) && packages.length > 0) {
          medicationName = packages[0].name || null
          duration = packages[0].duration || 28
        }
      } catch {
        // JSON parse failed, use defaults
      }
    }

    // 7. Build prefill data
    const intake = mapPatientToIntakeData(patient)
    const renewal = mapPatientToRenewalData(patient, medicationName)
    const supply = lastCompletedOrder
      ? estimateSupplyDays(lastCompletedOrder.createdAt, duration)
      : null

    return NextResponse.json({
      success: true,
      prefill: {
        intake,
        renewal,
        supply,
        renewalEligible: patient.status === 'ACTIVE',
        patientId: auth.asherPatientId,
      },
    })
  } catch (error) {
    console.error('Portal prefill error:', error)
    return NextResponse.json(
      { error: 'Failed to load prefill data' },
      { status: 500 }
    )
  }
}
