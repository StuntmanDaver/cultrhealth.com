import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createMagicLinkToken, checkRateLimit } from '@/lib/auth'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
  })
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please wait before requesting another link' },
        { status: 429 }
      )
    }

    // Staging bypass: skip Stripe check for allowed emails
    const isStagingAccess = isStagingBypassEmail(normalizedEmail)
    
    if (!isStagingAccess) {
      // Find customer in Stripe by email
      const stripe = getStripe()
      const customers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 1,
      })

      if (customers.data.length === 0) {
        // Don't reveal if email exists - always show same message
        return NextResponse.json({
          success: true,
          message: 'If you have an active membership, you will receive an email shortly.',
        })
      }

      const customer = customers.data[0]

      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length === 0) {
        // Also check for trialing subscriptions
        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'trialing',
          limit: 1,
        })

        if (trialingSubscriptions.data.length === 0) {
          // Don't reveal subscription status - always show same message
          return NextResponse.json({
            success: true,
            message: 'If you have an active membership, you will receive an email shortly.',
          })
        }
      }
    }

    // Customer has active subscription (or staging bypass) - generate magic link
    const token = await createMagicLinkToken(normalizedEmail)
    
    // Build magic link URL
    const baseUrl = 
      process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000')
    
    const magicLink = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`

    // For staging access emails, return the link directly (no email needed)
    if (isStagingAccess) {
      console.log('Staging access granted:', {
        email: normalizedEmail,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({
        success: true,
        stagingAccess: true,
        redirectUrl: magicLink,
        message: 'Staging access granted. Redirecting...',
      })
    }

    // Send email via Resend for regular users
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'
    const resend = getResend()

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'Access Your CULTR Library',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.15em; margin-bottom: 30px; color: #fff;">
      CULTR
    </h1>
    
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Click the button below to access your CULTR Library. This link will expire in 15 minutes.
    </p>
    
    <a href="${magicLink}" style="display: inline-block; background-color: #B87333; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: 500; font-size: 16px; margin-bottom: 24px;">
      Access Library
    </a>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 32px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
    
    <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #222; padding-top: 20px;">
      CULTR Health<br>
      This is an automated message. Please do not reply.
    </p>
  </div>
</body>
</html>
      `,
    })

    if (emailError) {
      console.error('Failed to send magic link email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Magic link sent:', {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'If you have an active membership, you will receive an email shortly.',
    })

  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
