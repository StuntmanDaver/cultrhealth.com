import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const isProductionDeployment = process.env.VERCEL_ENV === 'production'
  const isVercelHost = hostname.endsWith('.vercel.app')
  const isLocalDevHost =
    hostname === 'localhost' ||
    hostname.startsWith('localhost:') ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('127.0.0.1:') ||
    hostname === '[::1]' ||
    hostname.startsWith('[::1]:')

  // Canonicalize production deployment hosts to the primary public domain.
  if (isProductionDeployment && isVercelHost && (request.method === 'GET' || request.method === 'HEAD')) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = 'https:'
    canonicalUrl.host = 'cultrhealth.com'
    return NextResponse.redirect(canonicalUrl, 308)
  }

  // Block /join on public production hosts (join.cultrhealth.com removed Apr 2026).
  if (request.nextUrl.pathname.startsWith('/join') && !isLocalDevHost) {
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Session idle timeout for HIPAA compliance (30 min inactivity)
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  const authenticatedPrefixes = [
    '/members', '/intake', '/dashboard', '/admin', '/provider', '/creators/portal',
    '/api/member', '/api/intake', '/api/admin', '/api/provider', '/api/creators'
  ]
  const isAuthRoute = authenticatedPrefixes.some(p => request.nextUrl.pathname.startsWith(p)) &&
    !request.nextUrl.pathname.startsWith('/api/creators/apply') &&
    !request.nextUrl.pathname.startsWith('/api/creators/magic-link') &&
    !request.nextUrl.pathname.startsWith('/api/creators/verify-login') &&
    !request.nextUrl.pathname.startsWith('/api/creators/verify-email')

  if (isAuthRoute) {
    const sessionCookie = request.cookies.get('cultr_session_v2')
    const lastActivity = request.cookies.get('cultr_last_activity_v2')?.value
    const domain = request.headers.get('host')?.includes('cultrhealth.com')
      ? '.cultrhealth.com'
      : undefined

    if (sessionCookie && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > IDLE_TIMEOUT_MS) {
        // Session idle too long -- clear and redirect to login
        const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
        let response: NextResponse

        if (isApiRoute) {
          response = NextResponse.json({ error: 'Session timeout' }, { status: 401 })
        } else {
          const loginPath = request.nextUrl.pathname.startsWith('/creators/portal') ? '/creators/login' : '/login'
          const loginUrl = new URL(loginPath, request.url)
          loginUrl.searchParams.set('error', 'session_timeout')
          loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
          response = NextResponse.redirect(loginUrl)
        }
        
        // Clear domain cookies to prevent ghost sessions
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
        return response
      }
    }

    // Update last activity timestamp
    if (sessionCookie) {
      const response = NextResponse.next()
      response.cookies.set('cultr_last_activity_v2', Date.now().toString(), {
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
