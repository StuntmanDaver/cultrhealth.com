import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from '@/middleware'

function makeAuthenticatedRequest(url: string, host: string, lastActivity: number) {
  const request = new NextRequest(url, {
    headers: { host },
  })

  request.cookies.set('cultr_session', 'session-token')
  request.cookies.set('cultr_last_activity', String(lastActivity))

  return request
}

describe('Middleware session timeout', () => {
  it('clears both shared-domain and host-only cookies when a cultrhealth session times out', () => {
    const request = makeAuthenticatedRequest(
      'https://www.cultrhealth.com/members',
      'www.cultrhealth.com',
      Date.now() - (31 * 60 * 1000)
    )

    const response = middleware(request)
    const setCookie = response.headers.get('set-cookie') || ''
    const cultrSessionClears = setCookie.match(/cultr_session=;/g) || []
    const lastActivityClears = setCookie.match(/cultr_last_activity=;/g) || []

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?error=session_timeout')
    expect(response.headers.get('location')).toContain('redirect=%2Fmembers')
    expect(cultrSessionClears).toHaveLength(2)
    expect(lastActivityClears).toHaveLength(2)
    expect(setCookie).toContain('Domain=.cultrhealth.com')
  })
})
