import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, updateCreatorProfile } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const creator = await getCreatorById(auth.creatorId)
    if (!creator) {
      // Dev mode: return mock creator so portal is browsable without DB
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          creator: {
            id: 'dev_creator',
            email: auth.email || 'creator@cultrhealth.com',
            full_name: 'Dev Creator',
            status: 'active',
            tier: 2,
            override_rate: '4.00',
            recruit_count: 12,
            payout_method: 'bank_transfer',
            created_at: new Date().toISOString(),
          },
        })
      }
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    return NextResponse.json({ creator })
  } catch (error) {
    // Dev mode: return mock data even if DB connection fails
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        creator: {
          id: 'dev_creator',
          email: auth.email || 'creator@cultrhealth.com',
          full_name: 'Dev Creator',
          status: 'active',
          tier: 2,
          override_rate: '4.00',
          recruit_count: 12,
          payout_method: 'bank_transfer',
          created_at: new Date().toISOString(),
        },
      })
    }
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
