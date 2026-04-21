import { NextRequest, NextResponse } from 'next/server'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createCreator, getCreatorByEmail, updateCreatorStatus, updateCreatorEmailVerified, createTrackingLink, createAffiliateCode, checkAffiliateCodeExists } from '@/lib/creators/db'
import { generateCreatorCodes } from '@/lib/config/affiliate'
import { createMagicLinkToken } from '@/lib/auth'
import { Resend } from 'resend'
import { escapeHtml, baseEmailTemplate } from '@/lib/resend'

const AUTO_APPROVE_EMAILS = [
  'alex@cultrhealth.com',
  'tony@cultrhealth.com',
  'stewart@cultrhealth.com',
  'erik@cultrhealth.com',
  'david@cultrhealth.com',
  'legitscript@cultrhealth.com',
]

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

async function sendCreatorEmail(to: string, subject: string, html: string) {
  try {
    const { getFromEmail } = await import('@/lib/resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: getFromEmail(), to, subject, html })
  } catch (err) {
    console.error('Failed to send creator email:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = await getClientIp()
    const rateLimitResult = await formLimiter.check(`creator-apply:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { email, full_name, phone, social_handle, bio, recruiter_code, age, gender } = body

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
    const shouldResubmitForReview = existing?.status === 'rejected' || existing?.status === 'paused'
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
      age: age && Number(age) >= 18 ? Number(age) : undefined,
      gender: gender === 'male' || gender === 'female' ? gender : undefined,
      recruiter_id: recruiterId,
    })

    if (shouldResubmitForReview) {
      await updateCreatorStatus(creator.id, 'pending')
    }

    const baseUrl = getBaseUrl()

    // Auto-approve whitelisted emails
    if (AUTO_APPROVE_EMAILS.includes(email.toLowerCase())) {
      await updateCreatorStatus(creator.id, 'active', 'system-auto-approve')
      await updateCreatorEmailVerified(creator.id)

      let defaultSlug = full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) + Math.floor(Math.random() * 1000)

      let slugCreated = false
      let slugAttempts = 0
      while (!slugCreated && slugAttempts < 10) {
        try {
          await createTrackingLink(creator.id, defaultSlug, '/', true)
          slugCreated = true
        } catch (err) {
          slugAttempts++
          defaultSlug = full_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20) + Math.floor(Math.random() * 10000)
        }
      }

      if (!slugCreated) {
        throw new Error('Failed to generate tracking link slug')
      }

      let { membershipCode, productCode } = generateCreatorCodes(full_name)
      const baseName = membershipCode
      let suffix = 1
      while (
        suffix <= 10 && (
          await checkAffiliateCodeExists(membershipCode) ||
          await checkAffiliateCodeExists(productCode)
        )
      ) {
        membershipCode = `${baseName}${suffix}`
        productCode = `${baseName}${suffix}10`
        suffix++
      }

      await createAffiliateCode(creator.id, membershipCode, true, 'percentage', 10.00, 'membership')
      await createAffiliateCode(creator.id, productCode, false, 'percentage', 10.00, 'product')

      // Send login magic link email
      const token = await createMagicLinkToken(email)
      const magicLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}`

      await sendCreatorEmail(
        email,
        'Welcome to CULTR Creator Program — You\'re Approved!',
        baseEmailTemplate(`
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
      CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span>
    </h1>
          <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Hi ${escapeHtml(full_name)},</p>
          <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">Your creator account has been approved! Click below to access your Creator Portal where you can find your tracking link, coupon code, and start earning commissions.</p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${magicLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
              Open Creator Portal
            </a>
          </div>
          <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 0; text-align: center;">This link expires in 15 minutes. You can always request a new one at <a href="${baseUrl}/creators/login" style="color: #B7E4C7; text-decoration: none;">cultrhealth.com/creators/login</a>.</p>
        `)
      )

      console.log('Creator auto-approved:', creator.id)

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message: 'You have been approved! Check your email to log in.',
        creatorId: creator.id,
        trackingSlug: defaultSlug,
        couponCode: membershipCode,
      })
    }

    // Regular application — send verification email
    const token = await createMagicLinkToken(email)
    const verifyLink = `${baseUrl}/api/creators/verify-email?token=${encodeURIComponent(token)}`

    await sendCreatorEmail(
      email,
      'Verify Your CULTR Creator Application',
      baseEmailTemplate(`
    <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
      CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span>
    </h1>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Hi ${escapeHtml(full_name)},</p>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">Thanks for applying to the CULTR Creator Program! Please verify your email address by clicking the button below.</p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">Once verified, our team will review your application within 48 hours. You'll receive an email when approved with your tracking link and coupon code.</p>
        <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 32px; text-align: center; margin-bottom: 0;">If you didn't apply, you can safely ignore this email.</p>
      `)
    )

    console.log('Creator application submitted:', creator.id)

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
