// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSql = vi.fn()
const mockCookies = vi.fn()
const mockSyncContactToMailchimp = vi.fn().mockResolvedValue(undefined)

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

vi.mock('@/lib/mailchimp', () => ({
  syncContactToMailchimp: mockSyncContactToMailchimp,
}))

describe('club session cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.POSTGRES_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://join.cultrhealth.com'
    delete process.env.RESEND_API_KEY
  })

  it('signup sets a single-encoded cultr_club_visitor cookie', async () => {
    const { POST } = await import('@/app/api/club/signup/route')

    const request = new Request('http://localhost:3000/api/club/signup', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-111-2222',
        signupType: 'products',
      }),
    })

    const response = await POST(request)
    const setCookie = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(200)
    expect(setCookie).toContain('cultr_club_visitor=%7B%22firstName%22%3A%22Test%22')
    expect(setCookie).not.toContain('%257B')
  })

  it('recognizes existing double-encoded cultr_club_visitor cookies', async () => {
    process.env.POSTGRES_URL = 'postgres://test'
    mockCookies.mockReturnValue({
      get: vi.fn((name: string) => {
        if (name !== 'cultr_club_visitor') return undefined
        return {
          value:
            '%257B%2522email%2522%253A%2522test%2540example.com%2522%252C%2522firstName%2522%253A%2522Test%2522%257D',
        }
      }),
    })
    mockSql.mockResolvedValue({
      rows: [
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: '555-111-2222',
          social_handle: '',
          signup_type: 'products',
          age: null,
          gender: null,
          address_street: null,
          address_city: null,
          address_state: null,
          address_zip: null,
        },
      ],
    })

    const { GET } = await import('@/app/api/club/check-member/route')
    const response = await GET(new Request('http://localhost:3000/api/club/check-member'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.member).toMatchObject({
      email: 'test@example.com',
      firstName: 'Test',
      phone: '555-111-2222',
      signupType: 'products',
    })
  })
})
