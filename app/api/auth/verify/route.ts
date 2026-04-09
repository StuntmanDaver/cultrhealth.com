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

function appendCookieHeader(
  response: NextResponse,
  name: string,
  value: string,
  options: { maxAge: number; domain?: string }
) {
  const expires =
    options.maxAge === 0 ? new Date(0).toUTCString() : new Date(Date.now() + options.maxAge * 1000).toUTCString()
  const parts = [
    `${name}=${value}`,
    'Path=/',
    `Expires=${expires}`,
    `Max-Age=${options.maxAge}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : null,
    'HttpOnly',
    'SameSite=Lax',
    options.domain ? `Domain=${options.domain}` : null,
  ].filter(Boolean)

  response.headers.append('Set-Cookie', parts.join('; '))
}

function clearHostOnlyCookiesOnResponse(response: NextResponse) {
  appendCookieHeader(response, 'cultr_session', '', { maxAge: 0 })
  appendCookieHeader(response, 'cultr_last_activity', '', { maxAge: 0 })
}

function setSessionOnResponse(response: NextResponse, token: string, hostname: string) {
  const domain = getCookieDomainForHostname(hostname)
  clearHostOnlyCookiesOnResponse(response)
  appendCookieHeader(response, 'cultr_session', token, {
    maxAge: 60 * 60 * 24, // 24 hours (HIPAA)
    domain,
  })
  // Reset idle-timeout cookie so middleware doesn't immediately expire fresh sessions
  appendCookieHeader(response, 'cultr_last_activity', Date.now().toString(), {
    maxAge: 60 * 60 * 24,
    domain,
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const redirectParam = searchParams.get('redirect')

    // Build base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    const cookieHostname = request.nextUrl.hostname

    // Validate redirect is a safe relative path (prevent open redirect)
    const postLoginPath = typeof redirectParam === 'string' && redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/members'

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/members?error=invalid_link`)
    }

    // Verify the magic link token
    const verified = await verifyMagicLinkToken(token)

    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/members?error=expired_link`)
    }

    const email = normalizeAuthEmailInput(verified.email)

    // Check for staging bypass
    const isStagingAccess = isStagingBypassEmail(email)
    const isAdminAccess = isAdminEmail(email)
    let customerId: string

    if (isStagingAccess) {
      // Use per-email staging IDs so owner sessions remain isolated.
      customerId = getStagingCustomerId(email)
      const sessionToken = await createSessionToken(email, customerId, 'staging_creator', 'admin')
      const response = NextResponse.redirect(`${baseUrl}${postLoginPath}`)
      setSessionOnResponse(response, sessionToken, cookieHostname)
      console.log('Staging admin access granted:', { timestamp: new Date().toISOString() })
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

      if (customers.data.length === 0) {
        return NextResponse.redirect(`${baseUrl}/members?error=no_subscription`)
      }

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

      if (activeSubscriptions.data.length === 0 && trialingSubscriptions.data.length === 0) {
        return NextResponse.redirect(`${baseUrl}/members?error=no_subscription`)
      }

      customerId = customer.id
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

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    return NextResponse.redirect(`${baseUrl}/members?error=verification_failed`)
  }
}
