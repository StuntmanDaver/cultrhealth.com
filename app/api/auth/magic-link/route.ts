import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createMagicLinkToken, checkRateLimit, normalizeAuthEmailInput, isAdminEmail } from '@/lib/auth'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
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

export async function POST(request: NextRequest) {
  try {
    const { email, redirect: redirectPath } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = normalizeAuthEmailInput(email)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const isStagingAccess = isStagingBypassEmail(normalizedEmail)
    
    // Check rate limit (skip for staging bypass to allow concurrent E2E tests)
    if (!isStagingAccess && !checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please wait before requesting another link' },
        { status: 429 }
      )
    }

    if (!isStagingAccess && !isAdminEmail(normalizedEmail)) {
      // Find customer in Stripe by email
      const stripe = getStripe()
      const customers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 1,
      })

      let isAllowed = false;

      if (customers.data.length > 0) {
        const customer = customers.data[0]

        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          isAllowed = true;
        } else {
          // Also check for trialing subscriptions
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'trialing',
            limit: 1,
          })

          if (trialingSubscriptions.data.length > 0) {
            isAllowed = true;
          }
        }
      }

      if (!isAllowed) {
        // Check if they are a club member
        if (process.env.POSTGRES_URL) {
          const { sql } = await import('@vercel/postgres')
          const clubMember = await sql`SELECT id FROM club_members WHERE LOWER(email) = LOWER(${normalizedEmail}) LIMIT 1`
          
          if (clubMember.rows.length > 0) {
            isAllowed = true;
          }
        }
      }

      if (!isAllowed) {
        // Don't reveal if email exists - always show same message
        return NextResponse.json({
          success: true,
          message: 'If you have an active membership, you will receive an email shortly.',
        })
      }
    }

    // Customer has active subscription (or staging bypass) - generate magic link
    const token = await createMagicLinkToken(normalizedEmail)
    
    // Build magic link URL — use the actual request origin so local dev on any
    // port (3001, 3002, …) produces a working verify link instead of 404ing on
    // the hardcoded :3000 fallback.
    const requestOrigin = new URL(request.url).origin
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      requestOrigin)
    
    // Validate redirect is a safe relative path (prevent open redirect)
    const safeRedirect = typeof redirectPath === 'string' && redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : null
    const redirectParam = safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''
    const magicLink = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}${redirectParam}`

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

    // Determine email wording based on redirect path
    const isOnboarding = safeRedirect && (safeRedirect.includes('/onboarding') || safeRedirect.includes('/intake'))
    const subjectTitle = isOnboarding ? 'Continue Your CULTR Onboarding' : 'Access Your CULTR Library'
    const buttonText = isOnboarding ? 'Continue Onboarding' : 'Access Library'
    const bodyText = isOnboarding 
      ? 'Click the button below to continue your CULTR onboarding and medical intake. This link will expire in 15 minutes.'
      : 'Click the button below to access your CULTR Library. This link will expire in 15 minutes.'

    // Send email via Resend for regular users
    const { baseEmailTemplate, getFromEmail } = await import('@/lib/resend')
    const fromEmail = getFromEmail()
    const resend = getResend()

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: subjectTitle,
      html: baseEmailTemplate(`
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
      ${subjectTitle}
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      ${bodyText}
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        ${buttonText}
      </a>
    </div>
    
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
      If you didn't request this link, you can safely ignore this email.
    </p>
      `),
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
