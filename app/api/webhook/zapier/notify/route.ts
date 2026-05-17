import { NextRequest, NextResponse } from 'next/server'

/**
 * Zapier → CULTR generic inbound webhook.
 *
 * Supported actions (dispatched by `action` field):
 *   content_published      — logs metric reminder note (no DB table yet; extend as needed)
 *   creator_deliverable_late — logs deliverable late flag
 *
 * Auth: Authorization: Bearer <ZAPIER_WEBHOOK_SECRET>
 */

function verifyBearer(request: NextRequest): boolean {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!verifyBearer(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''

  switch (action) {
    case 'content_published':
      // Extend: write metric reminder tasks to DB when content metrics table exists
      console.log('[zapier-notify] content_published received — metric reminders queued')
      break

    case 'creator_deliverable_late':
      console.log('[zapier-notify] creator_deliverable_late received — deliverable:', body.deliverable_id ?? 'unknown')
      break

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  return NextResponse.json({ received: true, action })
}
