import { NextRequest, NextResponse } from 'next/server'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createCreator, getCreatorByEmail, updateCreatorStatus, createTrackingLink, createAffiliateCode } from '@/lib/creators/db'
import { createMagicLinkToken } from '@/lib/auth'
import { Resend } from 'resend'

const AUTO_APPROVE_EMAILS = [
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'stewart@cultrhealth.com',
  'erik@cultrhealth.com',
  'david@cultrhealth.com',
]

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

async function sendCreatorEmail(to: string, subject: string, html: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <noreply@cultrhealth.com>'
    await resend.emails.send({ from: fromEmail, to, subject, html })
  } catch (err) {
    console.error('Failed to send creator email:', err)
  }
}

function creatorEmailTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #2A4542; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.08em; margin-bottom: 30px; color: #fff;">CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span></h1>
    ${content}
    <p style="color: #444; font-size: 12px; margin-top: 40px; border-top: 1px solid #3a5a57; padding-top: 20px;">CULTR Health Creator Program<br>This is an automated message.</p>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await formLimiter.check(`creator-apply:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { email, full_name, phone, social_handle, bio, recruiter_code } = body

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if creator already exists
    const existing = await getCreatorByEmail(email)
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already registered as a creator' },
          { status: 409 }
        )
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Your application is already pending review' },
          { status: 409 }
        )
      }
    }

    // Resolve recruiter code to recruiter ID (try slug first, fall back to affiliate code)
    let recruiterId: string | undefined
    if (recruiter_code) {
      const { getTrackingLinkBySlug, getAffiliateCodeByCode, getCreatorById } = await import('@/lib/creators/db')
      let resolvedCreatorId: string | undefined
      const link = await getTrackingLinkBySlug(recruiter_code)
      if (link) {
        resolvedCreatorId = link.creator_id
      } else {
        const code = await getAffiliateCodeByCode(recruiter_code)
        if (code) resolvedCreatorId = code.creator_id
      }
      if (resolvedCreatorId) {
        const recruiter = await getCreatorById(resolvedCreatorId)
        if (recruiter?.status === 'active') recruiterId = resolvedCreatorId
      }
    }

    // Create the creator
    const creator = await createCreator({
      email,
      full_name,
      phone,
      social_handle,
      bio,
      recruiter_id: recruiterId,
    })

    const baseUrl = getBaseUrl()

    // Auto-approve whitelisted emails
    if (AUTO_APPROVE_EMAILS.includes(email.toLowerCase())) {
      await updateCreatorStatus(creator.id, 'active', 'system-auto-approve')

      const defaultSlug = full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) + Math.floor(Math.random() * 1000)

      await createTrackingLink(creator.id, defaultSlug, '/', true)

      const code = full_name
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 6) + '10'

      await createAffiliateCode(creator.id, code, true)

      // Send login magic link email
      const token = await createMagicLinkToken(email)
      const magicLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}`

      await sendCreatorEmail(
        email,
        'Welcome to CULTR Creator Program — You\'re Approved!',
        creatorEmailTemplate(`
          <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hi ${full_name},</p>
          <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your creator account has been approved! Click below to access your Creator Portal where you can find your tracking link, coupon code, and start earning commissions.</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">Open Creator Portal</a>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 32px;">This link expires in 15 minutes. You can always request a new one at <a href="${baseUrl}/creators/login" style="color: #B7E4C7;">cultrhealth.com/creators/login</a>.</p>
        `)
      )

      console.log(`Creator auto-approved: ${email}`)

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message: 'You have been approved! Check your email to log in.',
        creatorId: creator.id,
        trackingSlug: defaultSlug,
        couponCode: code,
      })
    }

    // Regular application — send verification email
    const token = await createMagicLinkToken(email)
    const verifyLink = `${baseUrl}/api/creators/verify-email?token=${encodeURIComponent(token)}`

    await sendCreatorEmail(
      email,
      'Verify Your CULTR Creator Application',
      creatorEmailTemplate(`
        <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hi ${full_name},</p>
        <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Thanks for applying to the CULTR Creator Program! Please verify your email address by clicking the button below.</p>
        <a href="${verifyLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">Verify Email</a>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin-top: 24px;">Once verified, our team will review your application within 48 hours. You'll receive an email when approved with your tracking link and coupon code.</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 32px;">If you didn't apply, you can safely ignore this email.</p>
      `)
    )

    console.log(`Creator application submitted: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Application submitted. Please check your email to verify your address.',
      creatorId: creator.id,
    })
  } catch (error) {
    console.error('Creator application error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
