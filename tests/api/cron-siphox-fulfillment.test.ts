import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// MOCKS
// ============================================================

const mockProcessDeferredOrders = vi.fn()
const mockRetryFailedOrders = vi.fn()

vi.mock('@/lib/siphox/fulfillment', () => ({
  processDeferredOrders: (...args: unknown[]) => mockProcessDeferredOrders(...args),
  retryFailedOrders: (...args: unknown[]) => mockRetryFailedOrders(...args),
}))

import { GET } from '@/app/api/cron/siphox-fulfillment/route'
import { NextRequest } from 'next/server'

// ============================================================
// HELPERS
// ============================================================

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  }
  return new NextRequest('http://localhost:3000/api/cron/siphox-fulfillment', {
    method: 'GET',
    headers,
  })
}

// ============================================================
// TESTS
// ============================================================

describe('GET /api/cron/siphox-fulfillment', () => {
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  afterAll(() => {
    if (originalCronSecret) {
      process.env.CRON_SECRET = originalCronSecret
    } else {
      delete process.env.CRON_SECRET
    }
  })

  it('should return 401 when authorization header is missing', async () => {
    const request = createRequest()
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('should return 401 when authorization header has wrong token', async () => {
    const request = createRequest('Bearer wrong-secret')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('should return 401 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET
    const request = createRequest('Bearer test-cron-secret')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return 200 with results on successful execution', async () => {
    mockProcessDeferredOrders.mockResolvedValueOnce({
      processed: 3,
      fulfilled: 2,
      stillPending: 1,
    })
    mockRetryFailedOrders.mockResolvedValueOnce({
      retried: 2,
      fulfilled: 1,
      permanentlyFailed: 1,
    })

    const request = createRequest('Bearer test-cron-secret')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.deferred).toEqual({
      processed: 3,
      fulfilled: 2,
      stillPending: 1,
    })
    expect(body.retry).toEqual({
      retried: 2,
      fulfilled: 1,
      permanentlyFailed: 1,
    })
    expect(body.timestamp).toBeDefined()
  })

  it('should return 500 on processing error', async () => {
    mockProcessDeferredOrders.mockRejectedValueOnce(new Error('Database error'))
    mockRetryFailedOrders.mockResolvedValueOnce({
      retried: 0,
      fulfilled: 0,
      permanentlyFailed: 0,
    })

    const request = createRequest('Bearer test-cron-secret')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to process SiPhox fulfillment')
  })
})
