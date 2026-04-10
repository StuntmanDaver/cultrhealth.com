import { NextResponse } from 'next/server'
import { createSessionToken } from '@/lib/auth'

/**
 * DEV-ONLY: Sets a session cookie directly without magic link.
 * Visit http://localhost:3000/api/auth/dev-login to get admin access.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const email = process.env.ADMIN_ALLOWED_EMAILS?.split(',')[0]?.trim() || 'admin@cultrhealth.com'
  const token = await createSessionToken(email, 'dev_customer', undefined, 'admin')

  const response = NextResponse.redirect(new URL('/admin', 'http://localhost:3000'))
  response.cookies.set('cultr_session_v2', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  response.cookies.set('cultr_last_activity_v2', Date.now().toString(), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}
