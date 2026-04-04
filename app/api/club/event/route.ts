import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'

const ALLOWED_EVENT_TYPES = [
  'page_view', 'signup', 'add_to_cart', 'remove_from_cart',
  'begin_checkout', 'order_submitted', 'login',
  'apply_coupon', 'remove_coupon',
]

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, eventType, eventData, memberId, pageUrl } = body

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }
    if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ ok: true }) // silently skip if no DB
    }

    const ipHash = hashIp(getClientIp(request))
    const userAgent = request.headers.get('user-agent')?.slice(0, 512) || null
    const referrer = request.headers.get('referer')?.slice(0, 2048) || null
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validMemberId = typeof memberId === 'string' && UUID_RE.test(memberId) ? memberId : null
    const validPageUrl = typeof pageUrl === 'string' ? pageUrl.slice(0, 2048) : null
    const safeEventData = eventData && typeof eventData === 'object' ? JSON.stringify(eventData) : null

    await sql`
      INSERT INTO visitor_events (session_id, member_id, event_type, event_data, page_url, referrer_url, user_agent, ip_hash)
      VALUES (
        ${sessionId.slice(0, 64)},
        ${validMemberId}::uuid,
        ${eventType},
        ${safeEventData}::jsonb,
        ${validPageUrl},
        ${referrer},
        ${userAgent},
        ${ipHash}
      )
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[club/event] Error:', error instanceof Error ? error.message : 'unknown')
    // Never fail the client — event tracking is non-critical
    return NextResponse.json({ ok: true })
  }
}
