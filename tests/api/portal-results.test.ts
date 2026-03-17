import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/portal/results/route'

// Mock dependencies
vi.mock('@/lib/portal-auth', () => ({
  verifyPortalAuth: vi.fn(),
}))

vi.mock('@/lib/siphox/db', () => ({
  getSiphoxCustomerByPhone: vi.fn(),
  SiphoxDatabaseError: class SiphoxDatabaseError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SiphoxDatabaseError'
    }
  },
}))

vi.mock('@/lib/siphox/reports', () => ({
  getLatestProcessedReport: vi.fn(),
}))

vi.mock('@/lib/siphox/errors', () => ({
  SiphoxApiError: class SiphoxApiError extends Error {
    statusCode?: number
    constructor(message: string, statusCode?: number) {
      super(message)
      this.name = 'SiphoxApiError'
      this.statusCode = statusCode
    }
  },
}))

import { verifyPortalAuth } from '@/lib/portal-auth'
import { getSiphoxCustomerByPhone, SiphoxDatabaseError } from '@/lib/siphox/db'
import { getLatestProcessedReport } from '@/lib/siphox/reports'

const mockVerify = vi.mocked(verifyPortalAuth)
const mockGetCustomer = vi.mocked(getSiphoxCustomerByPhone)
const mockGetReport = vi.mocked(getLatestProcessedReport)

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/portal/results', { method: 'GET' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/portal/results', () => {
  it('returns 401 when not authenticated', async () => {
    mockVerify.mockResolvedValue({ authenticated: false })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })

  it('returns empty state when no SiPhox customer', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+15551234567' })
    mockGetCustomer.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.report).toBeNull()
  })

  it('returns empty state when DB is unavailable', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+15551234567' })
    mockGetCustomer.mockRejectedValue(new SiphoxDatabaseError('DB unavailable'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.report).toBeNull()
  })

  it('returns empty state when no reports exist', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+15551234567' })
    mockGetCustomer.mockResolvedValue({
      id: '1',
      phone_e164: '+15551234567',
      siphox_customer_id: 'siphox-123',
      external_id: '+15551234567',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockGetReport.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.report).toBeNull()
  })

  it('returns processed report when data exists', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+15551234567' })
    mockGetCustomer.mockResolvedValue({
      id: '1',
      phone_e164: '+15551234567',
      siphox_customer_id: 'siphox-123',
      external_id: '+15551234567',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockGetReport.mockResolvedValue({
      reportId: 'report-1',
      createdAt: '2026-03-17',
      categories: [
        {
          key: 'heart',
          label: 'Heart & Cardiovascular',
          description: 'Lipids and cardiovascular risk',
          biomarkers: [],
          measuredCount: 0,
          optimalCount: 0,
        },
      ],
      suggestions: [],
      summary: {
        totalBiomarkers: 5,
        measuredCount: 5,
        optimalCount: 3,
        needsAttentionCount: 1,
        naCount: 1,
      },
    })

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.report).toBeDefined()
    expect(data.report.reportId).toBe('report-1')
    expect(data.report.summary.totalBiomarkers).toBe(5)
  })

  it('handles non-DB non-API errors with 500', async () => {
    mockVerify.mockResolvedValue({ authenticated: true, phone: '+15551234567' })
    mockGetCustomer.mockRejectedValue(new Error('Unexpected error'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.success).toBe(false)
  })
})
