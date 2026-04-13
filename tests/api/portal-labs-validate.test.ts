import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: vi.fn(),
}))
vi.mock('@/lib/siphox/client', () => ({
  validateKit: vi.fn(),
}))

import { POST } from '@/app/api/portal/labs/validate/route'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { validateKit } from '@/lib/siphox/client'

const mockVerify = verifyPortalAuth as ReturnType<typeof vi.fn>
const mockValidate = validateKit as ReturnType<typeof vi.fn>

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/portal/labs/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/portal/labs/validate', () => {
  it('returns 401 when not authenticated', async () => {
    mockVerify.mockResolvedValue({ authenticated: false, phone: null, asherPatientId: null })

    const res = await POST(makeRequest({ kitId: 'KIT-123' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing kitId', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Kit ID is required')
  })

  it('returns validation result from SiPhox API', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })
    mockValidate.mockResolvedValue({ valid: true, kitId: 'KIT-123', status: 'available' })

    const res = await POST(makeRequest({ kitId: 'KIT-123' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.validation.valid).toBe(true)
  })

  it('returns error for invalid kit', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+13525551234', asherPatientId: null })
    const { SiphoxApiError } = await import('@/lib/siphox/errors')
    mockValidate.mockRejectedValue(new SiphoxApiError('Not found', 404))

    const res = await POST(makeRequest({ kitId: 'INVALID' }))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Kit not found')
  })
})
