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
    const response = NextResponse.rewrite(url)

    // Capture visitor context on first visit (UTM params + referrer)
    // Only set once — don't overwrite if already exists (preserves first-touch attribution)
    if (!request.cookies.get('cultr_visitor_ctx')) {
      const utmSource = (request.nextUrl.searchParams.get('utm_source') || '').slice(0, 255)
      const utmMedium = (request.nextUrl.searchParams.get('utm_medium') || '').slice(0, 255)
      const utmCampaign = (request.nextUrl.searchParams.get('utm_campaign') || '').slice(0, 255)
      const utmTerm = (request.nextUrl.searchParams.get('utm_term') || '').slice(0, 255)
      const utmContent = (request.nextUrl.searchParams.get('utm_content') || '').slice(0, 255)
      const referrer = (request.headers.get('referer') || '').slice(0, 2048)

      const visitorCtx = JSON.stringify({
        s: utmSource,
        m: utmMedium,
        c: utmCampaign,
        t: utmTerm,
        n: utmContent,
        r: referrer,
        l: request.nextUrl.pathname + request.nextUrl.search,
        ts: Date.now(),
      })

      const domain = hostname.includes('cultrhealth.com') ? '.cultrhealth.com' : undefined
      response.cookies.set('cultr_visitor_ctx', encodeURIComponent(visitorCtx), {
        httpOnly: false, // Client-side readable so JS can send with signup
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        ...(domain ? { domain } : {}),
      })
    }

    return response
  }

  // Block /join on non-join hostnames — redirect to join.cultrhealth.com
  if (request.nextUrl.pathname.startsWith('/join')) {
    const joinUrl = new URL(request.nextUrl.pathname.replace(/^\/join\/?/, '/'), 'https://join.cultrhealth.com')
    joinUrl.search = request.nextUrl.search
    return NextResponse.redirect(joinUrl, 301)
  }

  // Session idle timeout for HIPAA compliance (30 min inactivity)
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  const authenticatedPrefixes = ['/members', '/intake', '/dashboard', '/admin', '/provider', '/creators/portal']
  const isAuthRoute = authenticatedPrefixes.some(p => request.nextUrl.pathname.startsWith(p))

  if (isAuthRoute) {
    const sessionCookie = request.cookies.get('cultr_session')
    const lastActivity = request.cookies.get('cultr_last_activity')?.value
    const domain = request.headers.get('host')?.includes('cultrhealth.com')
      ? '.cultrhealth.com'
      : undefined

    if (sessionCookie && lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > IDLE_TIMEOUT_MS) {
        // Session idle too long -- clear and redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'session_timeout')
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        const response = NextResponse.redirect(loginUrl)
        // Must specify domain to match how cookies were set, otherwise delete is a no-op
        const cookieOpts = { path: '/', ...(domain ? { domain } : {}) }
        response.cookies.set('cultr_session', '', { ...cookieOpts, maxAge: 0 })
        response.cookies.set('cultr_last_activity', '', { ...cookieOpts, maxAge: 0 })
        return response
      }
    }

    // Update last activity timestamp
    if (sessionCookie) {
      const response = NextResponse.next()
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
