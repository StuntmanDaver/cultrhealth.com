import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

interface SupplementOrderItem {
  sku: string
  name: string
  quantity: number
  category: string
}

interface SupplementOrderBody {
  email: string
  tier: string | null
  items: SupplementOrderItem[]
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SupplementOrderBody = await request.json()
    const { email, tier, items, notes } = body

    // Validate required fields
    if (!email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Email and items are required.' },
        { status: 400 }
      )
    }

    // Verify the email matches the session
    if (email !== session.email) {
      return NextResponse.json(
        { error: 'Email mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.sku || !item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data. Each item must have sku, name, and quantity > 0.' },
          { status: 400 }
        )
      }
    }

    // Generate order reference
    const orderRef = `SO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const timestamp = new Date()

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    // Log the supplement order
    console.log('Supplement order submitted:', {
      orderRef,
      email,
      tier,
      totalItems,
      uniqueProducts: items.length,
      items: items.map(i => ({ sku: i.sku, name: i.name, qty: i.quantity })),
      notes: notes ? notes.substring(0, 200) : null,
      timestamp: timestamp.toISOString(),
    })

    // Send staff notification email (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        const founderEmail = process.env.FOUNDER_EMAIL
        const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

        if (founderEmail) {
          const itemRows = items.map(item =>
            `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1a3c34;">${item.name}</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1a3c34; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">${item.sku}</td>
            </tr>`
          ).join('')

          await resend.emails.send({
            from: fromEmail,
            to: founderEmail,
            subject: `New Supplement Order Request — ${email}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0fdf4; color: #1a3c34; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #fff;">New Supplement Order Request</h1>
    </div>
    <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; margin-bottom: 20px; border: 1px solid #d1fae5;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 140px;">Order Reference</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${orderRef}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Member Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <a href="mailto:${email}" style="color: #059669; text-decoration: none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Membership Tier</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${tier || 'None'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Total Items</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${totalItems} item${totalItems !== 1 ? 's' : ''} (${items.length} unique)</td>
        </tr>
      </table>
    </div>
    <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; margin-bottom: 20px; border: 1px solid #d1fae5;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669;">Items Requested</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #d1fae5; color: #6b7280; font-size: 12px;">Product</th>
            <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #d1fae5; color: #6b7280; font-size: 12px;">Qty</th>
            <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #d1fae5; color: #6b7280; font-size: 12px;">SKU</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    ${notes ? `
    <div style="background-color: #ffffff; border-radius: 8px; padding: 24px; margin-bottom: 20px; border: 1px solid #d1fae5;">
      <h2 style="font-size: 14px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669;">Patient Notes</h2>
      <p style="margin: 0; color: #374151; white-space: pre-wrap;">${notes}</p>
    </div>
    ` : ''}
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>Action Required:</strong> Order these supplements from getvitaminlab.com for the patient.
      </p>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
      Submitted ${timestamp.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
    </p>
  </div>
</body>
</html>`,
          })
        }
      } catch (emailError) {
        console.error('Failed to send supplement order notification:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      orderRef,
      message: 'Supplement order submitted. Our staff will review and contact you with details.',
    })
  } catch (error) {
    console.error('Supplement order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
