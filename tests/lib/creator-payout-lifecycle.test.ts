// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

vi.mock('@/lib/db', () => ({
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'DatabaseError'
    }
  },
}))

import {
  getApprovedCommissionsForPayout,
  reverseCommissionsForAttribution,
} from '@/lib/creators/db'

describe('creator payout lifecycle queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockResolvedValue({ rows: [], rowCount: 0 })
  })

  it('filters approved commissions by the requested payout period', async () => {
    await (getApprovedCommissionsForPayout as unknown as (
      creatorId: string,
      options: { periodStart: string; periodEnd: string }
    ) => Promise<unknown>)('creator_123', {
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
    })

    const [queryParts, creatorId, periodStart, periodEnd] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(creatorId).toBe('creator_123')
    expect(periodStart).toBe('2026-03-01')
    expect(periodEnd).toBe('2026-03-31')
    expect(query).toContain('created_at >= ')
    expect(query).toContain("created_at < ")
  })

  it('reverses paid commissions instead of leaving them untouched', async () => {
    await reverseCommissionsForAttribution('attr_123')

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain("'pending'")
    expect(query).toContain("'approved'")
    expect(query).toContain("'paid'")
  })
})
