import { NextResponse } from 'next/server'
import { getCookieDomain } from '@/lib/utils'

/** Clear both session and idle-timeout cookies on a response */
function clearAuthCookies(response: NextResponse) {
  const domain = getCookieDomain()
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
    ...(domain ? { domain } : {}),
  }
  response.cookies.set('cultr_session', '', opts)
  response.cookies.set('cultr_last_activity', '', opts)
}

export async function POST() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    const response = NextResponse.json({ success: true, redirect: `${baseUrl}/members` })
    clearAuthCookies(response)
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    const response = NextResponse.redirect(`${baseUrl}/members`)
    clearAuthCookies(response)
    return response
  } catch (error) {
    console.error('Logout error:', error)

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    const response = NextResponse.redirect(`${baseUrl}/members`)
    clearAuthCookies(response)
    return response
  }
}
