import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { createAdminAction } from '@/lib/creators/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creatorId = params.id
  if (!creatorId) {
    return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 })
  }

  try {
    // Verify creator exists
    const existing = await sql`SELECT id, full_name, email FROM creators WHERE id = ${creatorId}`
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const creator = existing.rows[0]

    // Delete in dependency order to avoid FK constraint violations
    await sql`DELETE FROM commission_ledger WHERE creator_id = ${creatorId}`
    await sql`DELETE FROM order_attributions WHERE creator_id = ${creatorId}`
    await sql`DELETE FROM payouts WHERE creator_id = ${creatorId}`

    // Delete click_events for this creator's tracking links, then the links
    await sql`
      DELETE FROM click_events
      WHERE tracking_link_id IN (SELECT id FROM tracking_links WHERE creator_id = ${creatorId})
    `
    await sql`DELETE FROM tracking_links WHERE creator_id = ${creatorId}`
    await sql`DELETE FROM affiliate_codes WHERE creator_id = ${creatorId}`
    await sql`DELETE FROM creators WHERE id = ${creatorId}`

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'delete_creator',
      entity_type: 'creator',
      entity_id: creatorId,
      metadata: { creator_name: creator.full_name, creator_email: creator.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin creator delete error:', error)
    return NextResponse.json({ error: 'Failed to delete creator' }, { status: 500 })
  }
}
