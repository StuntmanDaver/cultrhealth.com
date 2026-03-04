import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { getCreatorsByStatus } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pending = await getCreatorsByStatus('pending')
    return NextResponse.json({ creators: pending })
  } catch (error) {
    console.error('Admin pending creators error:', error)
    return NextResponse.json({ error: 'Failed to fetch pending creators' }, { status: 500 })
  }
}
