// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockVerifyAdminAuth = vi.fn()
const mockCreateMagicLinkToken = vi.fn()
const mockGetCreatorById = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
  createMagicLinkToken: mockCreateMagicLinkToken,
}))

vi.mock('@/lib/creators/db', () => ({
  getCreatorById: mockGetCreatorById,
}))

describe('admin creator impersonation route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.cultrhealth.com'

    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: true,
      email: 'ops@example.com',
    })
    mockCreateMagicLinkToken.mockResolvedValue('impersonation-token')
  })

  it('rejects requests from non-admin users', async () => {
    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: false,
      email: null,
    })

    const { GET } = await import('@/app/api/admin/creators/[id]/impersonate/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/creator_1/impersonate')

    const response = await GET(request, { params: Promise.resolve({ id: 'creator_1' }) })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(mockGetCreatorById).not.toHaveBeenCalled()
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled()
  })

  it('returns not found when the target creator does not exist', async () => {
    mockGetCreatorById.mockResolvedValue(null)

    const { GET } = await import('@/app/api/admin/creators/[id]/impersonate/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/creator_1/impersonate')

    const response = await GET(request, { params: Promise.resolve({ id: 'creator_1' }) })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: 'Creator not found' })
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled()
  })

  it('redirects admins into the existing creator verify-login flow', async () => {
    mockGetCreatorById.mockResolvedValue({
      id: 'creator_1',
      email: 'creator@example.com',
      status: 'active',
    })

    const { GET } = await import('@/app/api/admin/creators/[id]/impersonate/route')
    const request = new NextRequest('https://www.cultrhealth.com/api/admin/creators/creator_1/impersonate')

    const response = await GET(request, { params: Promise.resolve({ id: 'creator_1' }) })

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://www.cultrhealth.com/api/creators/verify-login?token=impersonation-token'
    )
    expect(mockGetCreatorById).toHaveBeenCalledWith('creator_1')
    expect(mockCreateMagicLinkToken).toHaveBeenCalledWith('creator@example.com')
  })
})
