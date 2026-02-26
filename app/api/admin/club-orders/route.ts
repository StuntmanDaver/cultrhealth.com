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
        id, order_number, member_name, member_email, member_phone,
        items, subtotal_usd, notes, status,
        created_at, approved_at,
        qb_invoice_id, qb_invoice_url
      FROM club_orders
      ORDER BY
        CASE WHEN status = 'pending_approval' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ orders: result.rows })
  } catch (error) {
    console.error('[admin/club-orders] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
