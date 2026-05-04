import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml, getFromEmail, EMAIL_FONT_IMPORT, brandedEmailHeader, brandedEmailFooter } from '@/lib/resend'
import { formLimiter } from '@/lib/rate-limit'

const TEAM_EMAILS = [
  'david@cultrhealth.com',
  'tony@cultrhealth.com',
  'erik@cultrhealth.com',
  'alex@cultrhealth.com',
]

const COOKIE_NAME = 'cultr_first_visit'
const NTFY_TOPIC = 'cultr-owner-alerts'

async function sendOwnerNotification(title: string, body: string) {
  await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: { 'Title': title, 'Priority': 'default', 'Content-Type': 'text/plain' },
    body,
  })
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  if (request.cookies.get(COOKIE_NAME)) {
    return NextResponse.json({ ok: true })
  }

  const body = await request.json().catch(() => ({}))
  const { referrer, userAgent, site, landingPage } = body

  // Always set the cookie to silence future hits, even if rate-limited
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  // Only send the email if not rate-limited (prevents bot spam)
  const ip = getClientIp(request)
  const rateLimit = await formLimiter.check(`visitor-new:${ip}`)
  if (rateLimit.success) {
    sendVisitorNotification({ referrer, userAgent, site, landingPage }).catch((err) =>
      console.error('[visitor/new] notification failed:', err instanceof Error ? err.message : 'unknown')
    )
  }

  return response
}

async function sendVisitorNotification({
  referrer,
  userAgent,
  site,
  landingPage,
}: {
  referrer?: string
  userAgent?: string
  site?: string
  landingPage?: string
}) {
  const siteName = escapeHtml(site || 'cultrhealth.com')
  const safeLandingPage = escapeHtml(landingPage || '/')
  const safeReferrer = escapeHtml(referrer || 'Direct')
  const safeUserAgent = escapeHtml(userAgent || 'Unknown')

  // ntfy fires regardless of email config
  sendOwnerNotification(
    `New visitor - ${siteName}`,
    `${safeLandingPage}\nFrom: ${safeReferrer}`
  ).catch(() => {})

  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  await resend.emails.send({
    from: getFromEmail(),
    to: TEAM_EMAILS,
    subject: `👀 New visitor on ${siteName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 28px 24px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; margin: 0 0 6px; color: #2A4542;">New First-Time Visitor</h2>
      <p style="margin: 0 0 24px; color: #546E6B; font-size: 14px;">${now} ET &mdash; ${siteName}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B; width: 40%;">Landing page</td>
          <td style="padding: 10px 0; color: #2A4542; font-weight: 500;">${safeLandingPage}</td>
        </tr>
        <tr style="border-bottom: 1px solid #E8E3DB;">
          <td style="padding: 10px 0; color: #546E6B;">Referrer</td>
          <td style="padding: 10px 0; color: #2A4542; font-weight: 500;">${safeReferrer}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #546E6B;">Browser / OS</td>
          <td style="padding: 10px 0; color: #2A4542; font-size: 12px; word-break: break-all;">${safeUserAgent}</td>
        </tr>
      </table>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}
