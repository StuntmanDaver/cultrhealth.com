// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockVerifyAdminAuth = vi.fn()
const mockSql = vi.fn()

vi.mock('@/lib/auth', () => ({
  verifyAdminAuth: mockVerifyAdminAuth,
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

describe('GET /api/admin/creators/commission-audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAdminAuth.mockResolvedValue({
      authenticated: true,
      email: 'ops@example.com',
    })
    mockSql.mockResolvedValue({ rows: [] })
  })

  it('requires admin auth', async () => {
    mockVerifyAdminAuth.mockResolvedValue({ authenticated: false, email: null })

    const { GET } = await import('@/app/api/admin/creators/commission-audit/route')
    const response = await GET(new NextRequest('https://cultrhealth.com/api/admin/creators/commission-audit'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('runs read-only audit checks and summarizes issue counts', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ order_id: 'SUB-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ order_id: 'SELF-1' }, { order_id: 'SELF-2' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ order_number: 'CLB-1' }] })
      .mockResolvedValueOnce({ rows: [] })

    const { GET } = await import('@/app/api/admin/creators/commission-audit/route')
    const response = await GET(new NextRequest('https://cultrhealth.com/api/admin/creators/commission-audit?since=2026-05-01'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.readOnly).toBe(true)
    expect(body.since).toBe('2026-05-01')
    expect(body.totalIssues).toBe(4)
    expect(body.checks.directRateMismatches.count).toBe(1)
    expect(body.checks.selfReferralLedgerRows.count).toBe(2)
    expect(body.checks.shippedClubOrdersMissingLedger.count).toBe(1)
    expect(mockSql).toHaveBeenCalledTimes(7)
  })

  it('ignores malformed since values', async () => {
    const { GET } = await import('@/app/api/admin/creators/commission-audit/route')
    const response = await GET(new NextRequest('https://cultrhealth.com/api/admin/creators/commission-audit?since=yesterday'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.since).toBeNull()
  })
})
