import { NextResponse } from 'next/server'
import { getCookieDomain } from '@/lib/utils'

/** Clear session cookies on a response */
function clearAuthCookies(response: NextResponse) {
  const domain = getCookieDomain()
  const clearCookie = (name: string, d?: string) => {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      ...(d ? { domain: d } : {})
    })
  }
  
  clearCookie('cultr_session_v2', domain)
  clearCookie('cultr_last_activity_v2', domain)
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
