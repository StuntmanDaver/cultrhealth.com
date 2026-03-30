import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

// Allowed transitions: fromStatus → toStatus[]
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_approval: ['needs_invoice', 'cancelled'],
  approved:         ['paid', 'cancelled'],
  invoice_sent:     ['paid', 'cancelled'],
  needs_invoice:    ['paid', 'cancelled'],
  paid:             ['needs_shipment', 'cancelled'],
  needs_shipment:   ['shipped_complete', 'cancelled'],
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Admin session auth only (no email token)
    const session = await getSession()
    let isAuthorized = false
    if (session) {
      const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
      const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
      isAuthorized = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
    }
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const newStatus: string = body.status

    if (!newStatus) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Fetch current status
    const current = await sql`
      SELECT status FROM club_orders WHERE id = ${orderId}::uuid
    `
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const currentStatus = current.rows[0].status

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${newStatus}'` },
        { status: 400 }
      )
    }

    // Apply transition atomically
    // For shipped_complete, also set shipped_at
    let result
    if (newStatus === 'shipped_complete') {
      result = await sql`
        UPDATE club_orders
        SET status = ${newStatus}, shipped_at = NOW()
        WHERE id = ${orderId}::uuid AND status = ${currentStatus}
        RETURNING id, status
      `
    } else {
      result = await sql`
        UPDATE club_orders
        SET status = ${newStatus}
        WHERE id = ${orderId}::uuid AND status = ${currentStatus}
        RETURNING id, status
      `
    }

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Order status changed concurrently, please refresh' }, { status: 409 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[status route] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
