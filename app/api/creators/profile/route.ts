import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, updateCreatorProfile } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Staging fallback — return mock profile if DB record doesn't exist
    if (auth.creatorId === 'staging_creator') {
      return NextResponse.json({
        creator: {
          id: 'staging_creator',
          email: auth.email,
          full_name: auth.email?.split('@')[0] || 'Staging User',
          status: 'active',
          tier: 'starter',
          override_rate: '0',
          payout_method: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
    }

    const creator = await getCreatorById(auth.creatorId)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    return NextResponse.json({ creator })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { full_name, phone, social_handle, bio, payout_method, payout_destination_id } = body

    await updateCreatorProfile(auth.creatorId, {
      full_name,
      phone,
      social_handle,
      bio,
      payout_method,
      payout_destination_id,
    })

    const updated = await getCreatorById(auth.creatorId)
    return NextResponse.json({ creator: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
