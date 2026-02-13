import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getAffiliateCodesByCreator } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isStagingCreator = auth.creatorId === 'staging_creator' || auth.creatorId === 'dev_creator'
  const mockCodes = () => NextResponse.json({
    codes: [
      { id: '1', creator_id: auth.creatorId, code: 'STAGING10', is_primary: true, discount_type: 'percentage', discount_value: '10.00', use_count: 38, total_revenue: '14820.00', active: true, created_at: '2025-11-15T00:00:00Z' },
    ],
  })

  if (isStagingCreator) return mockCodes()

  try {
    const codes = await getAffiliateCodesByCreator(auth.creatorId)
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Codes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}
