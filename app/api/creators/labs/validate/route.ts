import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { validateKit } from '@/lib/siphox/client'
import { SiphoxApiError } from '@/lib/siphox/errors'

/**
 * POST /api/creators/labs/validate
 * Validate a kit ID via SiPhox API (creator auth)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyCreatorAuth(request)
    if (!auth.authenticated || !auth.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const kitId = typeof body.kitId === 'string' ? body.kitId.trim() : ''

    if (!kitId) {
      return NextResponse.json(
        { success: false, error: 'Kit ID is required' },
        { status: 400 }
      )
    }

    const validation = await validateKit(kitId)

    return NextResponse.json({ success: true, validation })
  } catch (error) {
    if (error instanceof SiphoxApiError) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { success: false, error: 'Kit not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to validate kit' },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
