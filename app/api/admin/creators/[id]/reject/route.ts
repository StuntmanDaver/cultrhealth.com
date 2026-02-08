import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getCreatorById, updateCreatorStatus, createAdminAction } from '@/lib/creators/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const creator = await getCreatorById(id)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    await updateCreatorStatus(id, 'rejected')

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'reject_creator',
      entity_type: 'creator',
      entity_id: id,
      reason,
    })

    return NextResponse.json({ success: true, message: 'Creator rejected' })
  } catch (error) {
    console.error('Admin reject creator error:', error)
    return NextResponse.json({ error: 'Failed to reject creator' }, { status: 500 })
  }
}
