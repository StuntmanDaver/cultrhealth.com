import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/rate-limit'
import {
  handleClickTracking,
  serializeAttributionCookie,
  getAttributionCookieOptions,
} from '@/lib/creators/attribution'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const ip = await getClientIp()
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || undefined
    const existingSessionId = request.cookies.get('cultr_session_id')?.value

    const result = await handleClickTracking({
      slug,
      ip,
      userAgent,
      referer,
      existingSessionId,
    })

    if (!result.success) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const response = NextResponse.redirect(
      new URL(result.destinationPath, request.url)
    )

    // Set attribution cookie
    if (result.cookieData) {
      response.cookies.set(
        COMMISSION_CONFIG.attributionCookieName,
        serializeAttributionCookie(result.cookieData),
        getAttributionCookieOptions()
      )
    }

    // Set/refresh session ID cookie
    response.cookies.set('cultr_session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
