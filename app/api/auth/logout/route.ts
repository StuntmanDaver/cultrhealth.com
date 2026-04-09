import { NextResponse } from 'next/server'
import { getCookieDomain } from '@/lib/utils'

/** Clear both session and idle-timeout cookies on a response */
function clearAuthCookies(response: NextResponse) {
  const domain = getCookieDomain()
  const expires = new Date(0).toUTCString()
  const isProd = process.env.NODE_ENV === 'production'
  
  const clearCookie = (name: string, d?: string) => {
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Expires=${expires}; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}${d ? `; Domain=${d}` : ''}`
    )
  }
  
  clearCookie('cultr_session', domain)
  clearCookie('cultr_last_activity', domain)
  if (domain) {
    clearCookie('cultr_session')
    clearCookie('cultr_last_activity')
  }
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
