import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { middleware } from '@/middleware'

function makeRequest(url: string, host: string) {
  return new NextRequest(url, {
    headers: {
      host,
    },
  })
}

describe('Join domain routing', () => {
  it('join landing page exports a valid page component', async () => {
    const mod = await import('@/app/join/page')

    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('rewrites the join host root to /join', () => {
    const response = middleware(
      makeRequest('https://join.cultrhealth.com/', 'join.cultrhealth.com')
    )

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://join.cultrhealth.com/join'
    )
  })

  it('does not rewrite non-checkout join host paths', () => {
    const response = middleware(
      makeRequest('https://join.cultrhealth.com/pricing', 'join.cultrhealth.com')
    )

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('blocks /join on non-join hostnames', () => {
    const response = middleware(
      makeRequest('https://staging.cultrhealth.com/join', 'staging.cultrhealth.com')
    )

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://staging.cultrhealth.com/not-found'
    )
  })
})
