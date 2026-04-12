import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, isProviderEmail } from '@/lib/auth'

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

function isAdminSession(email: string, role?: string): boolean {
  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowedEmails.includes(email.toLowerCase()) || isProviderEmail(email) || role === 'admin'
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)
  const returnToken = request.cookies.get('cultr_admin_return_v2')?.value
  const redirectParam = request.nextUrl.searchParams.get('redirect') || '/admin'
  const safeRedirect = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/admin'
  const domain = request.nextUrl.hostname.includes('cultrhealth.com') ? '.cultrhealth.com' : undefined

  const clearReturnCookie = (res: NextResponse) => {
    res.cookies.set('cultr_admin_return_v2', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      ...(domain ? { domain } : {}),
    })
  }

  if (!returnToken) {
    return NextResponse.redirect(`${baseUrl}/login?redirect=${encodeURIComponent(safeRedirect)}`)
  }

  const adminSession = await verifySessionToken(returnToken)
  if (!adminSession || !isAdminSession(adminSession.email, adminSession.role)) {
    const res = NextResponse.redirect(`${baseUrl}/login?redirect=${encodeURIComponent(safeRedirect)}&error=access_denied`)
    clearReturnCookie(res)
    return res
  }

  // Restore admin session and clear the return token
  const res = NextResponse.redirect(`${baseUrl}${safeRedirect}`)
  res.cookies.set('cultr_session_v2', returnToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
    ...(domain ? { domain } : {}),
  })
  res.cookies.set('cultr_last_activity_v2', Date.now().toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
    ...(domain ? { domain } : {}),
  })
  clearReturnCookie(res)
  return res
}
