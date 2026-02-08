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
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        links: [
          { id: '1', creator_id: 'dev_creator', slug: 'dev-creator', destination_path: '/', click_count: 847, conversion_count: 26, active: true, is_default: true, created_at: '2025-11-15T00:00:00Z' },
          { id: '2', creator_id: 'dev_creator', slug: 'dev-pricing', destination_path: '/pricing', click_count: 312, conversion_count: 9, active: true, is_default: false, created_at: '2025-12-01T00:00:00Z' },
          { id: '3', creator_id: 'dev_creator', slug: 'dev-glp1', destination_path: '/products', click_count: 88, conversion_count: 3, active: true, is_default: false, created_at: '2026-01-10T00:00:00Z' },
        ],
      })
    }
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
