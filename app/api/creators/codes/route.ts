import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getAffiliateCodesByCreator } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const codes = await getAffiliateCodesByCreator(auth.creatorId)
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Codes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}
