import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    // _clsk is the Clarity session cookie — use it as session_id so we can
    // JOIN visitor_events.session_id back to Clarity's session recordings.
    const claritySession = request.cookies.get('_clsk')?.value ?? null
    const sessionId = claritySession || `anon_${Date.now()}`
    const referer = request.headers.get('referer') ?? null

    await sql`
      INSERT INTO visitor_events (session_id, event_type, event_data, page_url)
      VALUES (
        ${sessionId},
        'user_identified',
        ${JSON.stringify({ email })}::jsonb,
        ${referer}
      )
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track/identify]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
