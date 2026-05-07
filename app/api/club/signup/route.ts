import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'
import { formLimiter, rateLimitResponse } from '@/lib/rate-limit'
import { createClubVisitorToken, createMagicLinkToken } from '@/lib/auth'
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT, baseEmailTemplate } from '@/lib/resend'
import { createCreator, getCreatorByEmail, updateCreatorStatus, getCreatorById, setCreatorRecruiterIfMissing } from '@/lib/creators/db'
import { parseAttributionCookie } from '@/lib/creators/attribution'
import { CREATOR_NOTIFICATION_EMAILS } from '@/lib/config/creator-notification-emails'
import { getCookieDomain } from '@/lib/utils'
import { syncContactToMailchimp } from '@/lib/contacts'

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown'
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimitResult = await formLimiter.check(`club-signup:${clientIp}`)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, socialHandle, address, signupType, age, gender, visitorContext, couponCode } = body
    const name = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim()
    const normalizedCouponCode = typeof couponCode === 'string' && couponCode.trim() ? couponCode.trim().toUpperCase() : null

    // Extract visitor tracking data
    const vc = visitorContext || {}
    const utmSource = typeof vc.utmSource === 'string' ? vc.utmSource.slice(0, 255) || null : null
    const utmMedium = typeof vc.utmMedium === 'string' ? vc.utmMedium.slice(0, 255) || null : null
    const utmCampaign = typeof vc.utmCampaign === 'string' ? vc.utmCampaign.slice(0, 255) || null : null
    const utmTerm = typeof vc.utmTerm === 'string' ? vc.utmTerm.slice(0, 255) || null : null
    const utmContent = typeof vc.utmContent === 'string' ? vc.utmContent.slice(0, 255) || null : null
    const referrerUrl = typeof vc.referrerUrl === 'string' ? vc.referrerUrl.slice(0, 2048) || null : null
    const landingPage = typeof vc.landingPage === 'string' ? vc.landingPage.slice(0, 2048) || null : null
    const userAgent = typeof vc.userAgent === 'string' ? vc.userAgent.slice(0, 512) || null : null
    const screenResolution = typeof vc.screenResolution === 'string' ? vc.screenResolution.slice(0, 20) || null : null
    const deviceType = typeof vc.deviceType === 'string' ? vc.deviceType.slice(0, 20) || null : null
    const browser = typeof vc.browser === 'string' ? vc.browser.slice(0, 50) || null : null
    const os = typeof vc.os === 'string' ? vc.os.slice(0, 50) || null : null
    // Validate ISO timestamp — reject anything that doesn't parse to a real date
    let firstVisitAt: string | null = null
    if (typeof vc.firstVisitAt === 'string') {
      const d = new Date(vc.firstVisitAt)
      if (!isNaN(d.getTime())) firstVisitAt = d.toISOString()
    }
    const ipHash = hashIp(getClientIp(request))

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'First name, last name, email, and phone are required.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const validSignupType = ['creator', 'membership', 'products'].includes(signupType) ? signupType : 'products'
    const memberAge = age && Number(age) >= 18 && Number(age) <= 120 ? Number(age) : null
    const memberGender = gender === 'male' || gender === 'female' ? gender : null

    // Create or update club member in DB
    let memberId: string | null = null
    try {
      if (process.env.POSTGRES_URL) {
        const addressStreet = address?.street?.trim() || null
        const addressCity = address?.city?.trim() || null
        const addressState = address?.state?.trim() || null
        const addressZip = address?.zip?.trim() || null
        const result = await sql`
          INSERT INTO club_members (
            name, email, phone, social_handle,
            address_street, address_city, address_state, address_zip,
            source, signup_type, age, gender, coupon_code,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            referrer_url, landing_page, user_agent, ip_hash,
            device_type, browser, os, screen_resolution, first_visit_at
          )
          VALUES (
            ${name.trim()}, ${normalizedEmail}, ${phone?.trim() || null}, ${socialHandle?.trim() || null},
            ${addressStreet}, ${addressCity}, ${addressState}, ${addressZip},
            'join_landing', ${validSignupType}, ${memberAge}, ${memberGender}, ${normalizedCouponCode},
            ${utmSource}, ${utmMedium}, ${utmCampaign}, ${utmTerm}, ${utmContent},
            ${referrerUrl}, ${landingPage}, ${userAgent}, ${ipHash},
            ${deviceType}, ${browser}, ${os}, ${screenResolution},
            ${firstVisitAt ? firstVisitAt : null}::timestamptz
          )
          ON CONFLICT (LOWER(email))
          DO UPDATE SET
            name = ${name.trim()},
            phone = COALESCE(${phone?.trim() || null}, club_members.phone),
            social_handle = COALESCE(${socialHandle?.trim() || null}, club_members.social_handle),
            address_street = COALESCE(${addressStreet}, club_members.address_street),
            address_city = COALESCE(${addressCity}, club_members.address_city),
            address_state = COALESCE(${addressState}, club_members.address_state),
            address_zip = COALESCE(${addressZip}, club_members.address_zip),
            signup_type = ${validSignupType},
            age = COALESCE(${memberAge}, club_members.age),
            gender = COALESCE(${memberGender}, club_members.gender),
            coupon_code = COALESCE(EXCLUDED.coupon_code, club_members.coupon_code),
            utm_source = COALESCE(club_members.utm_source, ${utmSource}),
            utm_medium = COALESCE(club_members.utm_medium, ${utmMedium}),
            utm_campaign = COALESCE(club_members.utm_campaign, ${utmCampaign}),
            utm_term = COALESCE(club_members.utm_term, ${utmTerm}),
            utm_content = COALESCE(club_members.utm_content, ${utmContent}),
            referrer_url = COALESCE(club_members.referrer_url, ${referrerUrl}),
            landing_page = COALESCE(club_members.landing_page, ${landingPage}),
            user_agent = ${userAgent},
            ip_hash = ${ipHash},
            device_type = COALESCE(${deviceType}, club_members.device_type),
            browser = COALESCE(${browser}, club_members.browser),
            os = COALESCE(${os}, club_members.os),
            screen_resolution = COALESCE(${screenResolution}, club_members.screen_resolution),
            first_visit_at = COALESCE(club_members.first_visit_at, ${firstVisitAt ? firstVisitAt : null}::timestamptz),
            updated_at = NOW()
          RETURNING id
        `
        memberId = result.rows[0]?.id
      }
    } catch (dbError) {
      // DB write is non-blocking — continue without it
      console.error('[club/signup] DB error (non-fatal):', describeError(dbError))
    }

    // Sync to Mailchimp (non-blocking)
    syncContactToMailchimp({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || undefined,
      socialHandle: socialHandle?.trim() || undefined,
      tags: ['cultr-club-signup', 'club-member'],
    }).catch((err) =>
      console.error('[club/signup] Mailchimp sync error (non-fatal):', describeError(err))
    )

    const clubVisitorToken = await createClubVisitorToken(normalizedEmail)

    const response = NextResponse.json({
      success: true,
      memberId,
    })

    const domain = getCookieDomain()
    response.cookies.set('cultr_club_visitor', clubVisitorToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: '/',
      ...(domain ? { domain } : {}),
    })

    if (validSignupType === 'creator') {
      // Resolve recruiter from cultr_attribution cookie BEFORE returning so the
      // creator row gets the right recruiter_id on insert. Self-referrals and
      // inactive recruiters are filtered out.
      const recruiterId = await resolveRecruiterIdForSignup(normalizedEmail)

      // Creator path: create official creator account + send verification email + notify owners
      handleCreatorFlow({
        email: normalizedEmail,
        full_name: name.trim(),
        phone: phone?.trim() || null,
        social_handle: socialHandle?.trim() || null,
        firstName: firstName.trim(),
        age: memberAge ?? undefined,
        gender: memberGender ?? undefined,
        deviceType: deviceType || null,
        landingPage: landingPage || null,
        referrerUrl: referrerUrl || null,
        recruiterId,
      }).catch((err) =>
        console.error('[club/signup] creator flow error:', describeError(err))
      )
    } else {
      // Non-creator path: standard welcome email + team notification
      sendClubWelcomeEmail(firstName.trim(), normalizedEmail).catch((err) =>
        console.error('[club/signup] welcome send failed:', describeError(err))
      )
      sendTeamSignupNotification({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        signupType: signupType || 'products',
        deviceType: deviceType || null,
        landingPage: landingPage || null,
        referrerUrl: referrerUrl || null,
      }).catch((err) =>
        console.error('[club/signup] team notification failed:', describeError(err))
      )
    }

    return response
  } catch (error) {
    console.error('[club/signup] Error:', describeError(error))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

// Resolve the recruiter from the cultr_attribution cookie (set by /r/[slug]
// click tracking). Returns undefined if no valid attribution, the recruiter
// is inactive, or this would be a self-referral.
async function resolveRecruiterIdForSignup(signupEmail: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('cultr_attribution')?.value
    if (!raw) return undefined
    const parsed = parseAttributionCookie(raw)
    if (!parsed?.creatorId) return undefined
    const recruiter = await getCreatorById(parsed.creatorId)
    if (!recruiter || recruiter.status !== 'active') return undefined
    if (recruiter.email.toLowerCase() === signupEmail) return undefined
    return recruiter.id
  } catch (err) {
    console.error('[club/signup] recruiter resolution failed (non-fatal):', describeError(err))
    return undefined
  }
}

async function handleCreatorFlow({
  email, full_name, phone, social_handle, firstName, age, gender, deviceType, landingPage, referrerUrl, recruiterId,
}: {
  email: string
  full_name: string
  phone: string | null
  social_handle: string | null
  firstName: string
  age?: number
  gender?: string
  deviceType: string | null
  landingPage: string | null
  referrerUrl: string | null
  recruiterId?: string
}) {
  // Detect prior status BEFORE upsert so we can branch correctly on re-submissions.
  // Note: createCreator's ON CONFLICT clause does NOT touch recruiter_id, so any
  // existing recruiter attribution is preserved on re-submissions (first-touch wins).
  const existing = await getCreatorByEmail(email)
  const wasResubmittedForReview = existing?.status === 'rejected' || existing?.status === 'paused'

  // Upsert the creator record (createCreator never updates status on conflict)
  const creator = await createCreator({ email, full_name, phone: phone || undefined, social_handle: social_handle || undefined, age, gender, recruiter_id: recruiterId })

  // Backfill recruiter for an existing creator who was previously created
  // without attribution. The helper's WHERE recruiter_id IS NULL guard
  // preserves first-touch attribution if one already exists.
  // Non-fatal: a backfill failure must not block the verify email or owner notification.
  if (existing && !existing.recruiter_id && recruiterId) {
    try {
      await setCreatorRecruiterIfMissing(creator.id, recruiterId)
    } catch (err) {
      console.error('[club/signup] recruiter backfill failed (non-fatal):', describeError(err))
    }
  }

  // For paused/rejected re-submissions, reset status to pending so the resubmission re-enters the review queue
  if (wasResubmittedForReview) {
    await updateCreatorStatus(creator.id, 'pending')
  }

  if (!process.env.RESEND_API_KEY) return

  const token = await createMagicLinkToken(email)
  const baseUrl = getBaseUrl()
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Effective status after any reset above
  const effectiveStatus = wasResubmittedForReview ? 'pending' : creator.status

  if (effectiveStatus === 'active') {
    // Already an approved creator — send a portal login link, not a "pending review" email. No owner notification.
    const loginLink = `${baseUrl}/api/creators/verify-login?token=${encodeURIComponent(token)}`
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Access Your CULTR Creator Portal',
      html: baseEmailTemplate(`
        <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
          CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span>
        </h1>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Hi ${escapeHtml(firstName)},</p>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">You're already a CULTR Creator! Click below to access your portal.</p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${loginLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
            Open Creator Portal
          </a>
        </div>
        <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 0; text-align: center;">This link expires in 15 minutes. You can always request a new one at <a href="${baseUrl}/creators/login" style="color: #B7E4C7; text-decoration: none;">cultrhealth.com/creators/login</a>.</p>
      `),
    })
    return
  }

  // Pending creator who already verified their email — don't ask them to verify again. Skip owner notification (they were already notified at first signup).
  if (existing && !wasResubmittedForReview && existing.email_verified && effectiveStatus === 'pending') {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your CULTR Creator Application Is Under Review',
      html: baseEmailTemplate(`
        <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
          CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span>
        </h1>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Hi ${escapeHtml(firstName)},</p>
        <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">Thanks for the additional info! Your CULTR Creator application is already under review. Our team will be in touch within 48 hours with next steps.</p>
        <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 0; text-align: center;">Questions? Reach us at <a href="mailto:support@cultrhealth.com" style="color: #B7E4C7; text-decoration: none;">support@cultrhealth.com</a>.</p>
      `),
    })
    return
  }

  // New, unverified pending, or freshly-resubmitted creator → verify email link
  const verifyLink = `${baseUrl}/api/creators/verify-email?token=${encodeURIComponent(token)}`
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Verify Your CULTR Creator Application',
    html: baseEmailTemplate(`
      <h1 style="font-size: 28px; font-weight: 300; color: #2A4542; margin-bottom: 24px; text-align: center; font-family: 'Playfair Display', Georgia, serif;">
        CULTR <span style="font-size: 14px; opacity: 0.7;">Creator</span>
      </h1>
      <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Hi ${escapeHtml(firstName)},</p>
      <p style="color: #5A6B68; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">Thanks for applying to the CULTR Creator Program! Please verify your email address by clicking the button below.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyLink}" style="display: inline-block; background-color: #B7E4C7; color: #2A4542; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Verify Email
        </a>
      </div>
      <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">Once verified, our team will review your application within 48 hours. You'll receive an email when approved with your tracking link and coupon code.</p>
      <p style="color: #5A6B68; font-size: 14px; line-height: 1.6; margin-top: 32px; text-align: center; margin-bottom: 0;">If you didn't apply, you can safely ignore this email.</p>
    `),
  })

  // Notify owners only for genuinely new applications: brand-new creators OR resubmissions from rejected/paused.
  // Skip owners on duplicate pending submissions to avoid inbox spam.
  const isNewToOwners = !existing || wasResubmittedForReview
  if (isNewToOwners) {
    await sendCreatorOwnerNotification({ name: full_name, email, phone, socialHandle: social_handle, deviceType, landingPage, referrerUrl, resubmission: wasResubmittedForReview })
  }
}

async function sendCreatorOwnerNotification({
  name, email, phone, socialHandle, deviceType, landingPage, referrerUrl, resubmission,
}: {
  name: string
  email: string
  phone: string | null
  socialHandle: string | null
  deviceType: string | null
  landingPage: string | null
  referrerUrl: string | null
  resubmission: boolean
}) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })
  const baseUrl = getBaseUrl()

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>',
    to: [...CREATOR_NOTIFICATION_EMAILS],
    subject: resubmission
      ? `🔁 Creator re-applied — ${escapeHtml(name)}`
      : `🧑‍🎤 New creator signup — ${escapeHtml(name)}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 28px 24px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; margin: 0 0 6px; color: #2A4542;">${resubmission ? 'Creator Re-Applied' : 'New Creator Signup'}</h2>
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
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(socialHandle || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Device</td>
          <td style="padding: 10px 0; color: #2A4542; text-transform: capitalize;">${escapeHtml(deviceType || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Landing page</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(landingPage || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Referrer</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(referrerUrl || 'Direct')}</td>
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
}

const TEAM_EMAILS = [
  'david@cultrhealth.com',
]

async function sendTeamSignupNotification({
  name,
  email,
  phone,
  signupType,
  deviceType,
  landingPage,
  referrerUrl,
}: {
  name: string
  email: string
  phone: string | null
  signupType: string
  deviceType: string | null
  landingPage: string | null
  referrerUrl: string | null
}) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>',
    to: TEAM_EMAILS,
    subject: `🎉 New CULTR Club signup — ${escapeHtml(name)}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 28px 24px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; margin: 0 0 6px; color: #2A4542;">New Club Signup</h2>
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
          <td style="padding: 10px 0; color: #546E6B;">Signup type</td>
          <td style="padding: 10px 0; color: #2A4542; text-transform: capitalize;">${escapeHtml(signupType)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Device</td>
          <td style="padding: 10px 0; color: #2A4542; text-transform: capitalize;">${escapeHtml(deviceType || '—')}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Landing page</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(landingPage || '—')}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #546E6B;">Referrer</td>
          <td style="padding: 10px 0; color: #2A4542;">${escapeHtml(referrerUrl || 'Direct')}</td>
        </tr>
      </table>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}

async function sendClubWelcomeEmail(firstName: string, email: string) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Welcome to CULTR Club!',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 12px; color: #2A4542;">Welcome to CULTR Club, ${escapeHtml(firstName)}!</h1>
      <p style="text-align: center; color: #546E6B; margin: 0 0 28px; font-size: 14px; line-height: 1.6;">
        You now have access to browse our physician-supervised therapies and build your personalized wellness order.
      </p>
      <div style="background: #D8F3DC; border-radius: 12px; padding: 28px 20px; text-align: center; margin-bottom: 8px;">
        <p style="margin: 0 0 16px; font-weight: 600; color: #2A4542;">Browse &amp; Order Therapies</p>
        <a href="https://cultrhealth.com/pricing" style="display: inline-block; background-color: #2A4542; color: #FFFFFF; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">Browse Therapies</a>
      </div>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}
