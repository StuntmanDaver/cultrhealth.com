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

    const response = NextResponse.redirect(redirectUrl)

    // Preserve the admin's session so they can return to admin without re-authenticating.
    // The creator verify-login will overwrite cultr_session_v2; we store the original
    // admin token in cultr_admin_return_v2 so the admin layout can restore it on next visit.
    const adminToken = request.cookies.get('cultr_session_v2')?.value
    if (adminToken) {
      const domain = request.nextUrl.hostname.includes('cultrhealth.com') ? '.cultrhealth.com' : undefined
      response.cookies.set('cultr_admin_return_v2', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
        ...(domain ? { domain } : {}),
      })
    }

    return response
  } catch (error) {
    console.error(
      'Admin creator impersonation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json({ error: 'Failed to access creator account' }, { status: 500 })
  }
}
