import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from '@/middleware'

function makeAuthenticatedRequest(url: string, host: string, lastActivity: number) {
  const request = new NextRequest(url, {
    headers: { host },
  })

  request.cookies.set('cultr_session_v2', 'session-token')
  request.cookies.set('cultr_last_activity_v2', String(lastActivity))

  return request
}

describe('Middleware session timeout', () => {
  it('clears shared-domain cookies when a cultrhealth session times out', () => {
    const request = makeAuthenticatedRequest(
      'https://www.cultrhealth.com/members',
      'www.cultrhealth.com',
      Date.now() - (31 * 60 * 1000)
    )

    const response = middleware(request)
    const setCookie = response.headers.get('set-cookie') || ''
    const cultrSessionClears = setCookie.match(/cultr_session_v2=/g) || []
    const lastActivityClears = setCookie.match(/cultr_last_activity_v2=/g) || []

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?error=session_timeout')
    expect(response.headers.get('location')).toContain('redirect=%2Fmembers')
    expect(cultrSessionClears).toHaveLength(1)
    expect(lastActivityClears).toHaveLength(1)
    expect(setCookie).toContain('Domain=.cultrhealth.com')
  })

  it('rewrites bare cultrclub creator slugs to click tracking', () => {
    const request = new NextRequest('https://cultrclub.com/joncollins441', {
      headers: { host: 'cultrclub.com' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://cultrclub.com/r/joncollins441')
  })

  it('does not hijack reserved cultrclub paths', () => {
    const request = new NextRequest('https://cultrclub.com/join', {
      headers: { host: 'cultrclub.com' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://cultrclub.com/not-found')
  })

  it('does not rewrite nested cultrclub paths as creator slugs', () => {
    const request = new NextRequest('https://cultrclub.com/creators/login', {
      headers: { host: 'cultrclub.com' },
    })

    const response = middleware(request)

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })
})
