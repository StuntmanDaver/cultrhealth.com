import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorById, getCreatorByEmail, updateCreatorProfile } from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // If creatorId is the staging placeholder, try email lookup instead
    let creator = null
    if (auth.creatorId === 'staging_creator' && auth.email) {
      creator = await getCreatorByEmail(auth.email)
    } else {
      creator = await getCreatorById(auth.creatorId)
    }

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
    const {
      full_name, phone, social_handle, bio, payout_method, payout_destination_id,
      address_line1, address_line2, address_city, address_state, address_zip,
    } = body

    // Resolve real creatorId if using staging placeholder
    let realCreatorId = auth.creatorId
    if (auth.creatorId === 'staging_creator' && auth.email) {
      const creator = await getCreatorByEmail(auth.email)
      if (creator) realCreatorId = creator.id
    }

    await updateCreatorProfile(realCreatorId, {
      full_name,
      phone,
      social_handle,
      bio,
      payout_method,
      payout_destination_id,
      address_line1,
      address_line2,
      address_city,
      address_state,
      address_zip,
    })

    const updated = auth.creatorId === 'staging_creator' && auth.email
      ? await getCreatorByEmail(auth.email)
      : await getCreatorById(auth.creatorId)
    return NextResponse.json({ creator: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
