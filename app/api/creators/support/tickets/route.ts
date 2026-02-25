import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyCreatorAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subject, message, category } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Support ticket received but RESEND_API_KEY is not configured:', {
        creatorId: auth.creatorId,
        email: auth.email,
        subject,
        category: category || 'general',
      })
      return NextResponse.json(
        { error: 'Email service not configured. Please contact creators@cultrhealth.com directly.' },
        { status: 503 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

    await resend.emails.send({
      from: fromEmail,
      to: 'creators@cultrhealth.com',
      replyTo: auth.email || undefined,
      subject: `[Creator Support] ${subject}`,
      html: `
        <h2>Creator Support Ticket</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #eee;">Creator ID</td><td style="padding:8px;border:1px solid #eee;">${auth.creatorId}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #eee;">Email</td><td style="padding:8px;border:1px solid #eee;">${auth.email || 'N/A'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #eee;">Category</td><td style="padding:8px;border:1px solid #eee;">${category || 'general'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #eee;">Subject</td><td style="padding:8px;border:1px solid #eee;">${subject}</td></tr>
        </table>
        <h3>Message</h3>
        <p style="white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:8px;">${message}</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted. We\'ll respond within 24 hours.',
    })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 })
  }
}
