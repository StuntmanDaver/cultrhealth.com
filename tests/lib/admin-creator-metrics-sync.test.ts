// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}))

vi.mock('@vercel/postgres', () => ({
  sql: mockSql,
}))

import {
  getAllCreatorsForAdmin,
  getAllCustomersForAdmin,
  getCreatorROI,
} from '@/lib/db'

describe('admin creator/customer metric query sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockResolvedValue({ rows: [], rowCount: 0 })
  })

  it('uses non-refunded attributed revenue for creator table totals', async () => {
    await getAllCreatorsForAdmin()

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain('FROM order_attributions oa')
    expect(query).toContain("oa.status != 'refunded'")
    expect(query).not.toContain('SUM(ac.total_revenue)')
  })

  it('excludes refunded attributions from creator ROI discount totals', async () => {
    await getCreatorROI()

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain("oa.status != 'refunded'")
  })

  it('treats dismissed club orders as non-converted in customer aggregates', async () => {
    await getAllCustomersForAdmin()

    const [queryParts] = mockSql.mock.calls[0]
    const query = queryParts.join(' ')

    expect(query).toContain("status NOT IN ('cancelled', 'rejected', 'dismissed')")
  })
})
