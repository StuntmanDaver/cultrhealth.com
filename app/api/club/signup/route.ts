import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'
import { formLimiter, rateLimitResponse } from '@/lib/rate-limit'
import { createClubVisitorToken } from '@/lib/auth'
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } from '@/lib/resend'
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
    const { firstName, lastName, email, phone, socialHandle, address, signupType, age, gender, visitorContext } = body
    const name = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim()

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

    // Create or update club member in DB
    let memberId: string | null = null
    try {
      if (process.env.POSTGRES_URL) {
        const addressStreet = address?.street?.trim() || null
        const addressCity = address?.city?.trim() || null
        const addressState = address?.state?.trim() || null
        const addressZip = address?.zip?.trim() || null
        const validSignupType = ['creator', 'membership', 'products'].includes(signupType) ? signupType : 'products'
        const memberAge = age && Number(age) >= 18 && Number(age) <= 120 ? Number(age) : null
        const memberGender = gender === 'male' || gender === 'female' ? gender : null
        const result = await sql`
          INSERT INTO club_members (
            name, email, phone, social_handle,
            address_street, address_city, address_state, address_zip,
            source, signup_type, age, gender,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            referrer_url, landing_page, user_agent, ip_hash,
            device_type, browser, os, screen_resolution, first_visit_at
          )
          VALUES (
            ${name.trim()}, ${normalizedEmail}, ${phone?.trim() || null}, ${socialHandle?.trim() || null},
            ${addressStreet}, ${addressCity}, ${addressState}, ${addressZip},
            'join_landing', ${validSignupType}, ${memberAge}, ${memberGender},
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

    // Send welcome email (fire-and-forget)
    sendClubWelcomeEmail(firstName.trim(), normalizedEmail).catch((err) =>
      console.error('[club/signup] welcome send failed:', describeError(err))
    )

    return response
  } catch (error) {
    console.error('[club/signup] Error:', describeError(error))
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
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
        <a href="https://join.cultrhealth.com" style="display: inline-block; background-color: #2A4542; color: #FFFFFF; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">Browse Therapies</a>
      </div>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}
