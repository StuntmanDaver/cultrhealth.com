import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TEMPORARY DEBUG ENDPOINT — DELETE AFTER FIXING EMAIL
// Hit: GET /api/debug-email
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL

  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'RESEND_API_KEY is not set in this environment',
      from: fromEmail || 'FROM_EMAIL also not set',
    })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from: fromEmail || 'CULTR <hello@cultrhealth.com>',
      to: 'david@cultrhealth.com',
      subject: '[DEBUG] Email test from staging',
      html: '<p>This is a test email sent from the debug endpoint. If you see this, Resend is working.</p>',
    })

    return NextResponse.json({
      status: 'sent',
      result,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      from: fromEmail,
    })
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      from: fromEmail,
    })
  }
}
