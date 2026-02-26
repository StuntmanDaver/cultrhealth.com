import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Rewrite join.cultrhealth.com to /join-club route
  if (
    hostname === 'join.cultrhealth.com' ||
    hostname === 'join.staging.cultrhealth.com'
  ) {
    const url = request.nextUrl.clone()

    // Pass through API calls, static assets, and /join-club paths unchanged
    if (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/join-club') ||
      url.pathname.startsWith('/_next')
    ) {
      return NextResponse.next()
    }

    // Rewrite root and all other paths to /join-club
    url.pathname = url.pathname === '/' ? '/join-club' : `/join-club${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
