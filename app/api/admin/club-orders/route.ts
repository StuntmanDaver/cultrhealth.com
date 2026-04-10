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
      return NextResponse.json({ orders: [] })
    }

    const result = await sql`
      SELECT
        co.id, co.order_number, co.member_name, co.member_email, co.member_phone,
        co.items, co.subtotal_usd, co.notes, co.status,
        co.created_at, co.approved_at, co.invoice_sent_at, co.paid_at, co.shipped_at, co.fulfilled_at,
        co.qb_invoice_id, co.qb_invoice_url,
        co.coupon_code, co.discount_percent,
        co.tracking_carrier, co.tracking_number, co.tracking_url,
        co.attributed_creator_id, co.attribution_method,
        c.full_name as creator_name
      FROM club_orders co
      LEFT JOIN creators c ON co.attributed_creator_id = c.id
      ORDER BY
        CASE
          WHEN co.status = 'pending_approval' THEN 0
          WHEN co.status IN ('approved', 'invoice_sent') THEN 1
          WHEN co.status = 'paid' THEN 2
          WHEN co.status = 'shipped' THEN 3
          ELSE 4
        END,
        co.created_at DESC
      LIMIT 200
    `

    return NextResponse.json({ orders: result.rows })
  } catch (error) {
    console.error('[admin/club-orders] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
