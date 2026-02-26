import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyMagicLinkToken, createSessionToken } from '@/lib/auth'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

const TEAM_EMAILS = [
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'stewart@cultrhealth.com',
  'erik@cultrhealth.com',
  'david@cultrhealth.com',
]

function isStaging(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return siteUrl.includes('staging')
}

// Check if email is allowed for staging bypass
function isStagingBypassEmail(email: string): boolean {
  const lower = email.toLowerCase()
  if (TEAM_EMAILS.includes(lower)) return true
  if (isStaging()) return true
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)
}

function setSessionOnResponse(response: NextResponse, token: string) {
  response.cookies.set('cultr_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Build base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000')

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/library?error=invalid_link`)
    }

    // Verify the magic link token
    const verified = await verifyMagicLinkToken(token)

    if (!verified) {
      return NextResponse.redirect(`${baseUrl}/library?error=expired_link`)
    }

    const { email } = verified

    // Check for staging bypass
    const isStagingAccess = isStagingBypassEmail(email)
    let customerId: string

    if (isStagingAccess) {
      // Use staging IDs with full admin access for bypass emails
      customerId = 'staging_customer'
      const sessionToken = await createSessionToken(email, customerId, 'staging_creator', 'admin')
      const response = NextResponse.redirect(`${baseUrl}/library`)
      setSessionOnResponse(response, sessionToken)
      console.log('Staging admin access granted:', { email, timestamp: new Date().toISOString() })
      return response
    } else {
      // Double-check customer still has active subscription
      const stripe = getStripe()
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      })

      if (customers.data.length === 0) {
        return NextResponse.redirect(`${baseUrl}/library?error=no_subscription`)
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
        return NextResponse.redirect(`${baseUrl}/library?error=no_subscription`)
      }

      customerId = customer.id
    }

    // Create session token and set cookie directly on the redirect response
    const sessionToken = await createSessionToken(email, customerId)
    const response = NextResponse.redirect(`${baseUrl}/library`)
    setSessionOnResponse(response, sessionToken)

    console.log('Session created:', {
      email,
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

    return NextResponse.redirect(`${baseUrl}/library?error=verification_failed`)
  }
}
