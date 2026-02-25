import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import {
  getTrackingLinksByCreator,
  createTrackingLink,
  getTrackingLinkBySlug,
} from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const links = await getTrackingLinksByCreator(auth.creatorId)
    return NextResponse.json({ links })
  } catch (error) {
    console.error('Links fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { slug, destination_path, utm_campaign } = body

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Validate slug format (alphanumeric + hyphens)
    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if slug is taken
    const existing = await getTrackingLinkBySlug(slug)
    if (existing) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 409 }
      )
    }

    const link = await createTrackingLink(
      auth.creatorId,
      slug,
      destination_path || '/',
      false,
      utm_campaign
    )

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    console.error('Link creation error:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}
