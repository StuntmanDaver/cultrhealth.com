import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyMagicLinkToken, createSessionToken, setSessionCookie } from '@/lib/auth'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

// Check if email is allowed for staging bypass
function isStagingBypassEmail(email: string): boolean {
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  const allowedEmails = stagingEmails.split(',').map(e => e.trim().toLowerCase())
  return allowedEmails.includes(email.toLowerCase())
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
      // Use a staging customer ID for bypass emails
      customerId = 'staging_customer'
      console.log('Staging access granted:', { email, timestamp: new Date().toISOString() })
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

    // Create session token
    const sessionToken = await createSessionToken(email, customerId)
    
    // Set session cookie
    await setSessionCookie(sessionToken)

    console.log('Session created:', {
      email,
      customerId,
      timestamp: new Date().toISOString(),
    })

    // Redirect to library
    return NextResponse.redirect(`${baseUrl}/library`)

  } catch (error) {
    console.error('Verify error:', error)
    
    const baseUrl = 
      process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000')
    
    return NextResponse.redirect(`${baseUrl}/library?error=verification_failed`)
  }
}
