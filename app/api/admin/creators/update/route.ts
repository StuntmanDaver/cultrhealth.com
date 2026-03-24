import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { createAdminAction } from '@/lib/creators/db'

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { creator_id, commission_rate, override_rate, status } = body

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 })
    }

    // Validate inputs
    const validStatuses = ['active', 'paused', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    if (commission_rate !== undefined && (commission_rate < 0 || commission_rate > 50)) {
      return NextResponse.json({ error: 'Commission rate must be between 0 and 50' }, { status: 400 })
    }

    if (override_rate !== undefined && (override_rate < 0 || override_rate > 25)) {
      return NextResponse.json({ error: 'Override rate must be between 0 and 25' }, { status: 400 })
    }

    // Verify creator exists
    const existing = await sql`SELECT id, full_name, commission_rate, override_rate, status FROM creators WHERE id = ${creator_id}`
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const prev = existing.rows[0]

    // Build update
    const updates: string[] = []
    const changes: Record<string, unknown> = {}

    if (commission_rate !== undefined && commission_rate !== parseFloat(prev.commission_rate)) {
      changes.commission_rate = { from: parseFloat(prev.commission_rate), to: commission_rate }
    }
    if (override_rate !== undefined && override_rate !== parseFloat(prev.override_rate)) {
      changes.override_rate = { from: parseFloat(prev.override_rate), to: override_rate }
    }
    if (status && status !== prev.status) {
      changes.status = { from: prev.status, to: status }
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes' })
    }

    // Apply updates
    await sql`
      UPDATE creators SET
        commission_rate = COALESCE(${commission_rate ?? null}::numeric, commission_rate),
        override_rate = COALESCE(${override_rate ?? null}::numeric, override_rate),
        status = COALESCE(${status ?? null}::text, status),
        updated_at = NOW()
      WHERE id = ${creator_id}
    `

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'update_creator',
      entity_type: 'creator',
      entity_id: creator_id,
      metadata: { creator_name: prev.full_name, changes },
    })

    return NextResponse.json({ success: true, changes })
  } catch (error) {
    console.error('Admin creator update error:', error)
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
