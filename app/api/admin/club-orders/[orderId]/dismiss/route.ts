import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

export async function POST(
  request: Request,
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
      UPDATE club_orders
      SET status = 'dismissed'
      WHERE id = ${orderId} AND status IS DISTINCT FROM 'dismissed' AND status IS DISTINCT FROM 'paid'
      RETURNING id, order_number
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, order: result.rows[0] })
  } catch (error) {
    console.error('Error dismissing order:', error)
    return NextResponse.json({ error: 'Failed to dismiss order' }, { status: 500 })
  }
}
