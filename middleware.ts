import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Rewrite join.cultrhealth.com to /join route
  if (
    hostname === 'join.cultrhealth.com' ||
    hostname === 'join.staging.cultrhealth.com'
  ) {
    const url = request.nextUrl.clone()

    // Pass through API calls, static assets, tracking links, creator pages, and /join paths unchanged
    if (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/join') ||
      url.pathname.startsWith('/r/') ||
      url.pathname.startsWith('/creators/') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/images') ||
      url.pathname.startsWith('/favicon') ||
      url.pathname.startsWith('/cultr-') ||
      url.pathname === '/robots.txt' ||
      url.pathname === '/sitemap.xml'
    ) {
      return NextResponse.next()
    }

    // Rewrite root and all other paths to /join
    url.pathname = url.pathname === '/' ? '/join' : `/join${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Session idle timeout for HIPAA compliance (30 min inactivity)
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  const authenticatedPrefixes = ['/members', '/intake', '/dashboard', '/admin', '/provider', '/creators/portal']
  const isAuthRoute = authenticatedPrefixes.some(p => request.nextUrl.pathname.startsWith(p))

  if (isAuthRoute) {
    const sessionCookie = request.cookies.get('cultr_session')
    const lastActivity = request.cookies.get('cultr_last_activity')?.value

    if (sessionCookie && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > IDLE_TIMEOUT_MS) {
        // Session idle too long -- clear and redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('reason', 'session_timeout')
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('cultr_session')
        response.cookies.delete('cultr_last_activity')
        return response
      }
    }

    // Update last activity timestamp
    if (sessionCookie) {
      const response = NextResponse.next()
      const domain = request.headers.get('host')?.includes('cultrhealth.com')
        ? '.cultrhealth.com'
        : undefined
      response.cookies.set('cultr_last_activity', Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24h
        path: '/',
        ...(domain ? { domain } : {}),
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
