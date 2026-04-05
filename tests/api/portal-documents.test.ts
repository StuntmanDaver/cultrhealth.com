// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

// Mock next/server
vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown
    status: number
    headers: Map<string, string>

    constructor(body: string | null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body ? JSON.parse(body) : null
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return this.body
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), init)
    }
  }

  return { NextResponse: MockNextResponse }
})

// Mock portal-auth
const mockVerifyPortalAuth = vi.fn()

vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: mockVerifyPortalAuth,
  PORTAL_ACCESS_COOKIE: 'cultr_portal_access',
}))

// Mock @vercel/postgres
const mockSql = vi.fn()
mockSql.mockResolvedValue({ rows: [] })

vi.mock('@vercel/postgres', () => ({
  sql: new Proxy(mockSql, {
    apply: (target, _thisArg, args) => target(...args),
    get: (target, prop) => {
      if (prop === 'then') return undefined
      return target[prop]
    },
  }),
}))

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function makeRequest(body?: unknown): {
  cookies: { get: (name: string) => { value: string } | undefined }
  json: () => Promise<unknown>
} {
  return {
    cookies: {
      get: (name: string) => {
        if (name === 'cultr_portal_access') return { value: 'test-token' }
        return undefined
      },
    },
    json: () => Promise.resolve(body),
  }
}

function makeUnauthenticatedRequest(body?: unknown): {
  cookies: { get: () => undefined }
  json: () => Promise<unknown>
} {
  return {
    cookies: {
      get: () => undefined,
    },
    json: () => Promise.resolve(body),
  }
}

// --------------------------------------------------
// TESTS: GET /api/portal/documents
// --------------------------------------------------

describe('GET /api/portal/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/documents/route')
    const response = await GET(makeUnauthenticatedRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns 401 when asherPatientId is null', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: null,
    })

    const { GET } = await import('@/app/api/portal/documents/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns empty array when no documents exist', async () => {
    mockSql.mockResolvedValue({ rows: [] })

    const { GET } = await import('@/app/api/portal/documents/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.documents).toEqual([])
  })

  it('returns documents with null preview URLs (migration in progress)', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          id: 1,
          s3_key: 'uploads/abc123.jpg',
          content_type: 'image/jpeg',
          file_purpose: 'portal_id',
          uploaded_at: '2026-03-10T10:00:00Z',
        },
        {
          id: 2,
          s3_key: 'uploads/def456.pdf',
          content_type: 'application/pdf',
          file_purpose: 'portal_prescription',
          uploaded_at: '2026-03-09T10:00:00Z',
        },
      ],
    })

    const { GET } = await import('@/app/api/portal/documents/route')
    const response = await GET(makeRequest() as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.documents).toHaveLength(2)
    expect(data.documents[0]).toMatchObject({
      id: 1,
      purpose: 'portal_id',
      contentType: 'image/jpeg',
      previewUrl: null,
    })
    expect(data.documents[1]).toMatchObject({
      id: 2,
      purpose: 'portal_prescription',
      contentType: 'application/pdf',
      previewUrl: null,
    })
  })
})

// --------------------------------------------------
// TESTS: POST /api/portal/documents
// --------------------------------------------------

describe('POST /api/portal/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: true,
      phone: '+15551234567',
      asherPatientId: 42,
    })
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockVerifyPortalAuth.mockResolvedValue({
      authenticated: false,
      phone: null,
      asherPatientId: null,
    })

    const { POST } = await import('@/app/api/portal/documents/route')
    const response = await POST(
      makeUnauthenticatedRequest({ contentType: 'image/jpeg', purpose: 'portal_id' }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('returns 400 for invalid content type', async () => {
    const { POST } = await import('@/app/api/portal/documents/route')
    const response = await POST(
      makeRequest({ contentType: 'text/html', purpose: 'portal_id' }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid content type')
  })

  it('returns 400 for invalid purpose', async () => {
    const { POST } = await import('@/app/api/portal/documents/route')
    const response = await POST(
      makeRequest({ contentType: 'image/jpeg', purpose: 'invalid_purpose' }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid purpose')
  })

  it('records document locally and returns success', async () => {
    const { POST } = await import('@/app/api/portal/documents/route')
    const response = await POST(
      makeRequest({ contentType: 'image/jpeg', purpose: 'portal_id' }) as any
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.key).toBeTruthy()
    // Verify DB insert was called
    expect(mockSql).toHaveBeenCalled()
  })
})
