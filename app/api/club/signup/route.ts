import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, socialHandle } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Create or update club member in DB
    let memberId: string | null = null
    try {
      if (process.env.POSTGRES_URL) {
        const result = await sql`
          INSERT INTO club_members (name, email, phone, social_handle, source)
          VALUES (${name.trim()}, ${normalizedEmail}, ${phone?.trim() || null}, ${socialHandle?.trim() || null}, 'join_landing')
          ON CONFLICT (LOWER(email))
          DO UPDATE SET
            name = ${name.trim()},
            phone = COALESCE(${phone?.trim() || null}, club_members.phone),
            social_handle = COALESCE(${socialHandle?.trim() || null}, club_members.social_handle),
            updated_at = NOW()
          RETURNING id
        `
        memberId = result.rows[0]?.id
      }
    } catch (dbError) {
      // DB write is non-blocking — continue without it
      console.error('[club/signup] DB error (non-fatal):', dbError)
    }

    // Set visitor cookie (7 days)
    const cookieData = JSON.stringify({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      socialHandle: socialHandle?.trim() || '',
    })

    const response = NextResponse.json({
      success: true,
      memberId,
    })

    response.cookies.set('cultr_club_visitor', encodeURIComponent(cookieData), {
      httpOnly: false, // Client-side readable for personalization
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Send welcome email (fire-and-forget)
    sendClubWelcomeEmail(name.trim(), normalizedEmail).catch((err) =>
      console.error('[club/signup] Email error (non-fatal):', err)
    )

    return response
  } catch (error) {
    console.error('[club/signup] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

async function sendClubWelcomeEmail(name: string, email: string) {
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
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: 0.3em; color: #2A4542;">CULTR</span>
    </div>
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; text-align: center; margin-bottom: 16px;">Welcome to CULTR Club, ${name.split(' ')[0]}!</h1>
    <p style="text-align: center; color: #2A4542; opacity: 0.7; margin-bottom: 32px;">
      You now have access to browse our physician-supervised therapies and build your personalized wellness order.
    </p>
    <div style="background: #D8F3DC; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; font-weight: 600;">Browse & Order Therapies</p>
      <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.7;">Visit join.cultrhealth.com to start shopping</p>
    </div>
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A454215;">
      <p style="color: #2A454260; font-size: 12px; text-align: center; margin: 0;">
        CULTR Health — Personalized Longevity Medicine
      </p>
      <p style="color: #2A454240; font-size: 11px; text-align: center; margin-top: 12px;">
        Questions? Contact support@cultrhealth.com
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}
