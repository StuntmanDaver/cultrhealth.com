import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkToken, verifyAdminAuth } from '@/lib/auth'
import { getCreatorById } from '@/lib/creators/db'

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const creator = await getCreatorById(id)
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const token = await createMagicLinkToken(creator.email)
    const redirectUrl = `${getBaseUrl(request)}/api/creators/verify-login?token=${encodeURIComponent(token)}`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error(
      'Admin creator impersonation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json({ error: 'Failed to access creator account' }, { status: 500 })
  }
}
