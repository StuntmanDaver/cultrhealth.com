import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, createSessionToken } from '@/lib/auth'

function isStagingEmail(email: string): boolean {
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

function setCookieOnResponse(response: NextResponse, token: string) {
  response.cookies.set('cultr_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
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

    // Look up creator in DB
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

    // No DB record — auto-create for staging bypass emails
    if (!creatorId && isStagingEmail(email)) {
      try {
        const { createCreator, updateCreatorStatus, createTrackingLink, createAffiliateCode } = await import('@/lib/creators/db')

        // Derive a name from the email (e.g. "erik" from "erik@threepointshospitality.com")
        const namePart = email.split('@')[0]
        const fullName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

        const creator = await createCreator({
          email,
          full_name: fullName,
        })

        await updateCreatorStatus(creator.id, 'active', 'staging-auto-create')

        const slug = namePart.replace(/[^a-z0-9]/g, '').slice(0, 20) + Math.floor(Math.random() * 1000)
        await createTrackingLink(creator.id, slug, '/', true)

        const code = namePart.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) + '10'
        await createAffiliateCode(creator.id, code, true)

        creatorId = creator.id
        creatorStatus = 'active'

        console.log('Auto-created staging creator:', { email, creatorId })
      } catch (err) {
        console.error('Failed to auto-create staging creator:', err)
        return NextResponse.redirect(`${baseUrl}/creators/login?error=no_account`)
      }
    }

    if (!creatorId) {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=no_account`)
    }

    // Pending creators go to pending page
    if (creatorStatus === 'pending') {
      const sessionToken = await createSessionToken(email, 'creator_pending', creatorId, 'creator')
      const response = NextResponse.redirect(`${baseUrl}/creators/pending`)
      setCookieOnResponse(response, sessionToken)
      return response
    }

    if (creatorStatus !== 'active') {
      return NextResponse.redirect(`${baseUrl}/creators/login?error=inactive_account`)
    }

    // Create session with creator role
    const sessionToken = await createSessionToken(email, 'creator_customer', creatorId, 'creator')
    const response = NextResponse.redirect(`${baseUrl}/creators/portal/dashboard`)
    setCookieOnResponse(response, sessionToken)

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
