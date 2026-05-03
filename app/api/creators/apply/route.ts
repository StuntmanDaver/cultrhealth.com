import { NextRequest, NextResponse } from 'next/server'
import { formLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createCreator, getCreatorByEmail, updateCreatorStatus, updateCreatorEmailVerified, createTrackingLink, createAffiliateCode, checkAffiliateCodeExists, setCreatorRecruiterIfMissing } from '@/lib/creators/db'
import { generateCreatorCodes } from '@/lib/config/affiliate'
import { createMagicLinkToken } from '@/lib/auth'
import { Resend } from 'resend'
import { escapeHtml, baseEmailTemplate } from '@/lib/resend'
import { CREATOR_NOTIFICATION_EMAILS } from '@/lib/config/creator-notification-emails'

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

async function sendOwnerCreatorApplicationNotification({
  name, email, phone, social_handle, bio, autoApproved, resubmission,
}: {
  name: string
  email: string
  phone?: string
  social_handle?: string
  bio?: string
  autoApproved: boolean
  resubmission: boolean
}) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { getFromEmail, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } = await import('@/lib/resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })
    const baseUrl = getBaseUrl()
    const subject = autoApproved
      ? `✅ Creator auto-approved — ${escapeHtml(name)}`
      : resubmission
      ? `🔁 Creator re-applied — ${escapeHtml(name)}`
      : `🧑‍🎤 New creator application — ${escapeHtml(name)}`

    await resend.emails.send({
      from: getFromEmail(),
      to: [...CREATOR_NOTIFICATION_EMAILS],
      subject,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 28px 24px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; margin: 0 0 6px; color: #2A4542;">${autoApproved ? 'Creator Auto-Approved' : 'New Creator Application'}</h2>
      <p style="margin: 0 0 24px; color: #546E6B; font-size: 14px;">${now} ET</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B; width: 40%;">Name</td>
          <td style="padding: 10px 0; color: #2A4542; font-weight: 600;">${escapeHtml(name)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Email</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(email)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Phone</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(phone || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Social handle</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(social_handle || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Bio / audience</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(bio || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Status</td>
          <td style="padding: 10px 0; color: #2A4542;">${autoApproved ? '✅ Auto-approved' : '⏳ Pending review'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #546E6B;">Review</td>
          <td style="padding: 10px 0;"><a href="${baseUrl}/admin/creators/approvals" style="color: #2A4542; font-weight: 600;">Admin → Creator Approvals</a></td>
        </tr>
      </table>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('Failed to send owner creator notification:', err)
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

    // Backfill recruiter for an existing creator who was previously created
    // without attribution. createCreator's ON CONFLICT clause never touches
    // recruiter_id, so an existing-with-NULL row would otherwise miss this
    // re-submission's recruiter_code. The WHERE recruiter_id IS NULL guard
    // preserves first-touch attribution.
    // Non-fatal: a backfill failure must not 500 the user's resubmission.
    if (existing && !existing.recruiter_id && recruiterId) {
      try {
        await setCreatorRecruiterIfMissing(creator.id, recruiterId)
      } catch (err) {
        console.error('[creators/apply] recruiter backfill failed (non-fatal):', err)
      }
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

      sendOwnerCreatorApplicationNotification({ name: full_name, email, phone, social_handle, bio, autoApproved: true, resubmission: shouldResubmitForReview }).catch(
        (err) => console.error('Failed to send owner auto-approve notification:', err)
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

    sendOwnerCreatorApplicationNotification({ name: full_name, email, phone, social_handle, bio, autoApproved: false, resubmission: shouldResubmitForReview }).catch(
      (err) => console.error('Failed to send owner application notification:', err)
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
