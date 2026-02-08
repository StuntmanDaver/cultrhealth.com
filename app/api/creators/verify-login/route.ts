import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, createSessionToken, setSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=invalid_link`)
    }

    const verified = await verifyMagicLinkToken(token)
    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=expired_link`)
    }

    const { email } = verified

    // Look up creator
    let creatorId: string | undefined
    let creatorStatus: string | undefined
    try {
      const { getCreatorByEmail } = await import('@/lib/creators/db')
      const creator = await getCreatorByEmail(email)
      if (creator) {
        creatorId = creator.id
        creatorStatus = creator.status
      }
    } catch {
      // DB lookup failed
    }

    if (!creatorId) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=no_account`)
    }

    // Pending creators go to pending page
    if (creatorStatus === 'pending') {
      // Still create session so they can check status
      const sessionToken = await createSessionToken(email, 'creator_pending', creatorId, 'creator')
      await setSessionCookie(sessionToken)
      return NextResponse.redirect(`${baseUrl}/creators/pending`)
    }

    if (creatorStatus !== 'active') {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=inactive_account`)
    }

    // Create session with creator role
    const sessionToken = await createSessionToken(email, 'creator_customer', creatorId, 'creator')
    await setSessionCookie(sessionToken)

    console.log('Creator session created:', {
      email,
      creatorId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.redirect(`${baseUrl}/creators/portal/dashboard`)
  } catch (error) {
    console.error('Creator verify error:', error)
    return NextResponse.redirect(`${baseUrl}/creators/login?error=verification_failed`)
  }
}
