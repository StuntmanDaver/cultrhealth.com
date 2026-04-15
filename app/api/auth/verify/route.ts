import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyMagicLinkToken, createSessionToken, normalizeAuthEmailInput, isAdminEmail } from '@/lib/auth'
import { getCookieDomain } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
}

const TEAM_EMAILS = [
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'stewart@cultrhealth.com',
  'erik@cultrhealth.com',
  'david@cultrhealth.com',
  'erik@threepointshospitality.com',
  'carlos@threepointshospitality.com',
  'legitscript@cultrhealth.com',
]

function isStaging(): boolean {
  // STAGING_MODE is a server-side-only env var set explicitly in the Vercel
  // staging environment. It cannot be accidentally promoted to production because
  // it is not embedded at build time like NEXT_PUBLIC_ variables.
  if (process.env.STAGING_MODE === 'true') return true
  // Legacy fallback: keep working for deployments that haven't set STAGING_MODE yet.
  // TODO: remove this once STAGING_MODE=true is confirmed set on staging in Vercel.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return siteUrl.includes('staging')
}

// Check if email is allowed for staging bypass
function isStagingBypassEmail(email: string): boolean {
  const lower = normalizeAuthEmailInput(email)
  if (TEAM_EMAILS.includes(lower)) return true
  if (isStaging()) return true
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)
}

function getStagingCustomerId(email: string): string {
  const localPart = email.split('@')[0] || 'user'
  const normalizedLocalPart = localPart.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)
  return `staging_customer_${normalizedLocalPart || 'user'}`
}

function getCookieDomainForHostname(hostname: string): string | undefined {
  const normalizedHostname = hostname.trim().toLowerCase()
  if (
    normalizedHostname === 'cultrhealth.com' ||
    normalizedHostname === 'www.cultrhealth.com' ||
    normalizedHostname.endsWith('.cultrhealth.com')
  ) {
    return '.cultrhealth.com'
  }
  return undefined
}

function setSessionOnResponse(response: NextResponse, token: string, hostname: string) {
  const domain = getCookieDomainForHostname(hostname)
  response.cookies.set('cultr_session_v2', token, {
    maxAge: 60 * 60 * 24, // 24 hours (HIPAA)
    domain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
  // Reset idle-timeout cookie so middleware doesn't immediately expire fresh sessions
  response.cookies.set('cultr_last_activity_v2', Date.now().toString(), {
    maxAge: 60 * 60 * 24,
    domain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const redirectParam = searchParams.get('redirect')

    // Build base URL for redirects — use request origin so local dev on any
    // port produces working redirects instead of 404ing on hardcoded :3000.
    const requestOrigin = new URL(request.url).origin
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      requestOrigin)

    const cookieHostname = request.nextUrl.hostname

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/members?error=invalid_link`)
    }

    // Verify the magic link token
    const verified = await verifyMagicLinkToken(token)

    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/members?error=expired_link`)
    }

    const email = normalizeAuthEmailInput(verified.email)

    const OWNERS = [
      'alex@cultrhealth.com',
      'erik@cultrhealth.com',
      'david@cultrhealth.com',
      'tony@cultrhealth.com',
      'stewart@cultrhealth.com',
    ]

    // Owners who hold both an admin role AND a creator role — they get a destination
    // picker instead of being dropped straight into admin.
    const DUAL_ROLE_EMAILS = [
      'stewart@cultrhealth.com',
    ]

    // Validate redirect is a safe relative path (prevent open redirect)
    let postLoginPath = typeof redirectParam === 'string' && redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/members'

    // Push owners straight to admin on production (and staging) if no specific redirect was passed.
    // Dual-role owners skip the straight-to-admin shortcut so they can choose their destination.
    if (OWNERS.includes(email) && !DUAL_ROLE_EMAILS.includes(email) && (!redirectParam || redirectParam === '/members')) {
      postLoginPath = '/admin'
    }

    // Dual-role owners land on a destination picker when no explicit redirect was given.
    if (DUAL_ROLE_EMAILS.includes(email) && (!redirectParam || redirectParam === '/members')) {
      postLoginPath = '/login/choose-area'
    }

    // Check for staging bypass
    const isStagingAccess = isStagingBypassEmail(email)
    const isAdminAccess = isAdminEmail(email)
    let customerId: string

    if (isStagingAccess) {
      // Use per-email staging IDs so owner sessions remain isolated.
      customerId = getStagingCustomerId(email)
      // Only grant admin role to actual admin emails — not every staging user
      const role = isAdminAccess ? 'admin' : 'member'
      const sessionToken = await createSessionToken(email, customerId, undefined, role)
      const response = NextResponse.redirect(`${baseUrl}${postLoginPath}`)
      setSessionOnResponse(response, sessionToken, cookieHostname)
      console.log('Staging access granted:', { role, timestamp: new Date().toISOString() })
      return response
    } else if (isAdminAccess) {
      customerId = getStagingCustomerId(email)
      const sessionToken = await createSessionToken(email, customerId, undefined, 'admin')
      const response = NextResponse.redirect(`${baseUrl}${postLoginPath}`)
      setSessionOnResponse(response, sessionToken, cookieHostname)
      console.log('Admin access granted:', { timestamp: new Date().toISOString() })
      return response
    } else {
      // Double-check customer still has active subscription
      const stripe = getStripe()
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      })

      let isAllowed = false;
      let stripeCustomerId: string | null = null;

      if (customers.data.length > 0) {
        const customer = customers.data[0]

        // Check for active or trialing subscription
        const activeSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        })

        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'trialing',
          limit: 1,
        })

        if (activeSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0) {
          isAllowed = true;
          stripeCustomerId = customer.id;
        }
      }

      if (!isAllowed) {
        // Check if they are a club member
        if (process.env.POSTGRES_URL) {
          const { sql } = await import('@vercel/postgres')
          const clubMember = await sql`SELECT id FROM club_members WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
          
          if (clubMember.rows.length > 0) {
            isAllowed = true;
            customerId = `club_${clubMember.rows[0].id}`
          }
        }
      }

      if (!isAllowed) {
        return NextResponse.redirect(`${baseUrl}/members?error=no_subscription`)
      }

      if (stripeCustomerId) {
        customerId = stripeCustomerId;
      }
    }

    // Create session token and set cookie directly on the redirect response
    const sessionToken = await createSessionToken(email, customerId)
    const response = NextResponse.redirect(`${baseUrl}${postLoginPath}`)
    setSessionOnResponse(response, sessionToken, cookieHostname)

    console.log('Session created:', {
      customerId,
      timestamp: new Date().toISOString(),
    })

    return response

  } catch (error) {
    console.error('Verify error:', error)

    const requestOrigin = new URL(request.url).origin
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      requestOrigin)

    return NextResponse.redirect(`${baseUrl}/members?error=verification_failed`)
  }
}
