import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth, isProviderEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 200)

    let result

    if (status) {
      result = await sql`
        SELECT
          pi.id,
          pi.customer_email,
          pi.plan_tier,
          pi.intake_status,
          pi.intake_data,
          pi.created_at,
          pi.completed_at,
          ao.asher_order_id,
          ao.asher_patient_id,
          ao.order_status AS asher_status,
          ao.partner_note,
          ao.medication_packages
        FROM pending_intakes pi
        LEFT JOIN LATERAL (
          SELECT * FROM asher_orders
          WHERE lower(customer_email) = lower(pi.customer_email)
          ORDER BY created_at DESC
          LIMIT 1
        ) ao ON true
        WHERE pi.intake_status = ${status}
        ORDER BY pi.created_at DESC
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT
          pi.id,
          pi.customer_email,
          pi.plan_tier,
          pi.intake_status,
          pi.intake_data,
          pi.created_at,
          pi.completed_at,
          ao.asher_order_id,
          ao.asher_patient_id,
          ao.order_status AS asher_status,
          ao.partner_note,
          ao.medication_packages
        FROM pending_intakes pi
        LEFT JOIN LATERAL (
          SELECT * FROM asher_orders
          WHERE lower(customer_email) = lower(pi.customer_email)
          ORDER BY created_at DESC
          LIMIT 1
        ) ao ON true
        ORDER BY
          CASE WHEN pi.intake_status = 'pending' THEN 0
               WHEN pi.intake_status = 'completed' THEN 1
               ELSE 2 END,
          pi.created_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ success: true, intakes: result.rows })
  } catch (error) {
    console.error('[provider/intakes] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
