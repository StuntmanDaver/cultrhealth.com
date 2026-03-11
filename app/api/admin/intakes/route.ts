import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

export async function GET() {
  try {
    // Verify admin access
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
    const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ intakes: [] })
    }

    const result = await sql`
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
      LIMIT 200
    `

    return NextResponse.json({ intakes: result.rows })
  } catch (error) {
    console.error('[admin/intakes] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
