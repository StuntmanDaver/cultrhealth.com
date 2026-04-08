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

import { getCreatorOrderStats } from '@/lib/creators/db'

describe('creator order stats sync filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockResolvedValue({
      rows: [{ total_orders: '0', total_revenue: '0', total_commission: '0' }],
      rowCount: 1,
    })
  })

  it('filters refunded attributions in all-time creator stats', async () => {
    await getCreatorOrderStats('creator_1')

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain("status != 'refunded'")
  })

  it('filters refunded attributions in date-bounded creator stats', async () => {
    await getCreatorOrderStats('creator_1', new Date('2026-01-01T00:00:00Z'))

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain("status != 'refunded'")
    expect(query).toContain('created_at >=')
  })
})
