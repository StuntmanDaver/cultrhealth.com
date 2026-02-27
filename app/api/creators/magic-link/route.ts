import { NextRequest, NextResponse } from 'next/server'
import { createMagicLinkToken, checkRateLimit } from '@/lib/auth'

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

function isStagingEmail(email: string): boolean {
  const lower = email.toLowerCase()
  if (TEAM_EMAILS.includes(lower)) return true
  const stagingEmails = process.env.STAGING_ACCESS_EMAILS
  if (!stagingEmails) return false
  return stagingEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json({ error: 'Please wait before requesting another link' }, { status: 429 })
    }

    // Check if creator exists in DB OR is a staging bypass email
    let creatorExists = isStaging() || isStagingEmail(normalizedEmail)

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

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const magicLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}`

    // Staging bypass emails or dev mode: return magic link directly (no email needed)
    if (process.env.NODE_ENV === 'development' || isStaging() || isStagingEmail(normalizedEmail)) {
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
      const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'

      await resend.emails.send({
        from: fromEmail,
        to: normalizedEmail,
        subject: 'Access Your CULTR Creator Portal',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #2A4542; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.08em; margin-bottom: 30px; color: #fff;">CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span></h1>
    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Click the button below to access your Creator Portal. This link expires in 15 minutes.</p>
    <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">Open Creator Portal</a>
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 32px;">If you didn't request this link, you can safely ignore this email.</p>
    <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #3a5a57; padding-top: 20px;">CULTR Health Creator Program<br>This is an automated message.</p>
  </div>
</body>
</html>`,
      })
    } catch (emailError) {
      console.error('Failed to send creator magic link email:', emailError)
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
