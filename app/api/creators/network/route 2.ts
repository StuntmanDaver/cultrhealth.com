import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import {
  getCreatorById,
  getRecruitsByCreatorId,
  getCommissionsByCreator,
} from '@/lib/creators/db'
import { getNextTierRequirement, getTierName } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isStagingCreator = auth.creatorId === 'staging_creator' || auth.creatorId === 'dev_creator'
  const mockNetwork = () => NextResponse.json({
    network: {
      totalRecruits: 12,
      activeRecruits: 10,
      overrideEarnings: 287.64,
      tier: 2,
      tierName: 'Silver',
      overrideRate: 4,
      recruitCount: 12,
      nextTierAt: 15,
    },
    recruits: [
      { id: 'r1', full_name: 'Alex Johnson', status: 'active', created_at: '2025-12-01T00:00:00Z' },
      { id: 'r2', full_name: 'Maria Garcia', status: 'active', created_at: '2025-12-15T00:00:00Z' },
      { id: 'r3', full_name: 'Chris Lee', status: 'active', created_at: '2026-01-03T00:00:00Z' },
      { id: 'r4', full_name: 'Priya Patel', status: 'active', created_at: '2026-01-10T00:00:00Z' },
      { id: 'r5', full_name: 'Jordan Kim', status: 'active', created_at: '2026-01-18T00:00:00Z' },
      { id: 'r6', full_name: 'Taylor Swift', status: 'active', created_at: '2026-01-22T00:00:00Z' },
      { id: 'r7', full_name: 'Sam Rivera', status: 'active', created_at: '2026-01-25T00:00:00Z' },
      { id: 'r8', full_name: 'Dana White', status: 'active', created_at: '2026-01-28T00:00:00Z' },
      { id: 'r9', full_name: 'Morgan Chen', status: 'active', created_at: '2026-02-01T00:00:00Z' },
      { id: 'r10', full_name: 'Riley Thompson', status: 'active', created_at: '2026-02-04T00:00:00Z' },
      { id: 'r11', full_name: 'Avery Brooks', status: 'pending', created_at: '2026-02-06T00:00:00Z' },
      { id: 'r12', full_name: 'Quinn Davis', status: 'pending', created_at: '2026-02-07T00:00:00Z' },
    ],
  })

  if (isStagingCreator) return mockNetwork()

  try {
    const creator = await getCreatorById(auth.creatorId)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const recruits = await getRecruitsByCreatorId(auth.creatorId)

    // Get override commissions (use large limit to get all for summing)
    const overrideCommissions = await getCommissionsByCreator(auth.creatorId, undefined, 10000)
    const overrideEarnings = overrideCommissions
      .filter((c) => c.commission_type === 'override' && c.status !== 'reversed')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0)

    const activeRecruits = recruits.filter((r) => r.status === 'active')

    return NextResponse.json({
      network: {
        totalRecruits: recruits.length,
        activeRecruits: activeRecruits.length,
        overrideEarnings: Math.round(overrideEarnings * 100) / 100,
        tier: creator.tier,
        tierName: getTierName(creator.tier),
        overrideRate: Number(creator.override_rate),
        recruitCount: creator.recruit_count,
        nextTierAt: getNextTierRequirement(creator.tier),
      },
      recruits: recruits.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        status: r.status,
        created_at: r.created_at,
      })),
    })
  } catch (error) {
    console.error('Network fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch network' }, { status: 500 })
  }
}
