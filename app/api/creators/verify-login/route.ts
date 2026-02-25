import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, createSessionToken } from '@/lib/auth'

function isStagingEmail(email: string): boolean {
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

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

    // No DB record — check staging bypass
    if (!creatorId) {
      if (isStagingEmail(email)) {
        const sessionToken = await createSessionToken(email, 'staging_customer', 'staging_creator', 'creator')
        const response = NextResponse.redirect(`${baseUrl}/creators/portal/dashboard`)
        response.cookies.set('cultr_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
        return response
      }
      return NextResponse.redirect(`${baseUrl}/creators/login?error=no_account`)
    }

    // Pending creators go to pending page
    if (creatorStatus === 'pending') {
      const sessionToken = await createSessionToken(email, 'creator_pending', creatorId, 'creator')
      const response = NextResponse.redirect(`${baseUrl}/creators/pending`)
      response.cookies.set('cultr_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    }

    if (creatorStatus !== 'active') {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=inactive_account`)
    }

    // Create session with creator role — set cookie directly on the redirect response
    const sessionToken = await createSessionToken(email, 'creator_customer', creatorId, 'creator')
    const response = NextResponse.redirect(`${baseUrl}/creators/portal/dashboard`)
    response.cookies.set('cultr_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    console.log('Creator session created:', {
      email,
      creatorId,
      timestamp: new Date().toISOString(),
    })

    return response
  } catch (error) {
    console.error('Creator verify error:', error)
    return NextResponse.redirect(`${baseUrl}/creators/login?error=verification_failed`)
  }
}
