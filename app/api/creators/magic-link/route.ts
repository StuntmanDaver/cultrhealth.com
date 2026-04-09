import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkToken, checkRateLimit, normalizeAuthEmailInput } from '@/lib/auth'

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

function isStagingEmail(email: string): boolean {
  const lower = normalizeAuthEmailInput(email)
  if (TEAM_EMAILS.includes(lower)) return true
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)
}

function getBaseUrl(request: NextRequest): string {
  return (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirect: redirectPath } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = normalizeAuthEmailInput(email)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const isStagingAccess = isStaging() || isStagingEmail(normalizedEmail)

    if (!isStagingAccess && !checkRateLimit(normalizedEmail)) {
      return NextResponse.json({ error: 'Please wait before requesting another link' }, { status: 429 })
    }

    // Check if creator exists in DB OR is a staging bypass email
    let creatorExists = isStagingAccess

    if (!creatorExists) {
      try {
        const { getCreatorByEmail } = await import('@/lib/creators/db')
        const creator = await getCreatorByEmail(normalizedEmail)
        if (creator && (creator.status === 'active' || creator.status === 'pending')) {
          creatorExists = true
        }
      } catch {
        // DB lookup failed
      }
    }

    // Silently return success to prevent email enumeration
    if (!creatorExists) {
      return NextResponse.json({
        success: true,
        message: 'If you have an active creator account, you will receive an email shortly.',
      })
    }

    // Generate magic link
    const token = await createMagicLinkToken(normalizedEmail)
    const baseUrl = getBaseUrl(request)

    // Validate redirect is a safe relative path
    const safeRedirect = typeof redirectPath === 'string' && redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : null
    const redirectParam = safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''
    const magicLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}${redirectParam}`

    const isTestEmail = normalizedEmail === 'david@cultrhealth.com'

    // Staging bypass emails or dev mode: return magic link directly (no email needed), unless it's the test email
    if ((process.env.NODE_ENV === 'development' || isStaging() || isStagingEmail(normalizedEmail)) && !isTestEmail) {
      console.log('Creator magic link (direct):', magicLink)
      return NextResponse.json({
        success: true,
        message: 'If you have an active creator account, you will receive an email shortly.',
        redirectUrl: magicLink,
      })
    }

    // Send email via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { baseEmailTemplate, getFromEmail } = await import('@/lib/resend')
      const fromEmail = getFromEmail()

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: normalizedEmail,
        subject: 'Access Your CULTR Creator Portal',
        html: baseEmailTemplate(`
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
      Creator Portal
    </h1>
    
    <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Click the button below to access your Creator Portal. This link expires in 15 minutes.
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Open Creator Portal
      </a>
    </div>
    
    <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
      If you didn't request this link, you can safely ignore this email.
    </p>
        `),
      })

      if (emailError) {
        console.error('Failed to send creator magic link email:', emailError)
        return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
      }
    } catch (emailError) {
      console.error('Failed to send creator magic link email:', emailError)
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'If you have an active creator account, you will receive an email shortly.',
    })
  } catch (error) {
    console.error('Creator magic link error:', error)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
