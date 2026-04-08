import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

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

    const result = await sql`
      SELECT id, admin_email, action_type, reason, metadata, created_at
      FROM admin_actions
      WHERE entity_id = ${orderId} AND entity_type = 'club_order'
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ entries: result.rows })
  } catch (error) {
    console.error('[club-orders/activity] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
