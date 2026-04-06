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

import { getTrackingLinksByCreator } from '@/lib/creators/db'

describe('getTrackingLinksByCreator sync behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reconciles stale conversion_count using click_events totals', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          id: 'link_1',
          creator_id: 'creator_1',
          slug: 'joncollins441',
          destination_path: '/',
          utm_source: 'creator',
          utm_medium: 'referral',
          utm_campaign: null,
          click_count: 25,
          conversion_count: 2,
          real_conversion_count: 4,
          active: true,
          is_default: true,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ],
    })

    const links = await getTrackingLinksByCreator('creator_1')

    expect(links).toHaveLength(1)
    expect(links[0].conversion_count).toBe(4)

    const [queryParts, creatorIdForSubquery, creatorIdForWhere] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain('FROM tracking_links tl')
    expect(query).toContain('FROM click_events')
    expect(query).toContain('COUNT(*) FILTER (WHERE converted = TRUE)')
    expect(creatorIdForSubquery).toBe('creator_1')
    expect(creatorIdForWhere).toBe('creator_1')
  })

  it('keeps stored conversion_count when it is already higher', async () => {
    mockSql.mockResolvedValue({
      rows: [
        {
          id: 'link_2',
          creator_id: 'creator_2',
          slug: 'creator2-default',
          destination_path: '/',
          utm_source: 'creator',
          utm_medium: 'referral',
          utm_campaign: null,
          click_count: 10,
          conversion_count: 5,
          real_conversion_count: 3,
          active: true,
          is_default: false,
          created_at: '2026-04-02T00:00:00Z',
          updated_at: '2026-04-02T00:00:00Z',
        },
      ],
    })

    const links = await getTrackingLinksByCreator('creator_2')

    expect(links).toHaveLength(1)
    expect(links[0].conversion_count).toBe(5)
  })
})
