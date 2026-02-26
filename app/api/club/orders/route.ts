import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  quantity: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, phone, items, notes } = body as {
      email: string
      name: string
      phone?: string
      items: OrderItem[]
      notes?: string
    }

    // Validation
    if (!email?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Calculate subtotal (only items with prices)
    const subtotal = items.reduce((sum, item) => {
      return item.price ? sum + item.price * item.quantity : sum
    }, 0)

    // Generate order number
    const orderNumber = `CLB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`

    // Generate HMAC-signed approval token
    const approvalSecret = process.env.CLUB_ORDER_APPROVAL_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    const approvalToken = crypto
      .createHmac('sha256', approvalSecret)
      .update(`${orderNumber}:${normalizedEmail}:${Date.now()}`)
      .digest('hex')

    // Look up or create member
    let memberId: string | null = null
    let orderId: string | null = null

    try {
      if (process.env.POSTGRES_URL) {
        // Get or create member
        const memberResult = await sql`
          INSERT INTO club_members (name, email, phone, source)
          VALUES (${name.trim()}, ${normalizedEmail}, ${phone?.trim() || null}, 'join_landing')
          ON CONFLICT (LOWER(email))
          DO UPDATE SET updated_at = NOW()
          RETURNING id
        `
        memberId = memberResult.rows[0]?.id

        if (memberId) {
          const orderResult = await sql`
            INSERT INTO club_orders (order_number, member_id, member_name, member_email, member_phone, items, subtotal_usd, notes, status, approval_token)
            VALUES (
              ${orderNumber},
              ${memberId},
              ${name.trim()},
              ${normalizedEmail},
              ${phone?.trim() || null},
              ${JSON.stringify(items)},
              ${subtotal > 0 ? subtotal : null},
              ${notes || null},
              'pending_approval',
              ${approvalToken}
            )
            RETURNING id
          `
          orderId = orderResult.rows[0]?.id
        }
      }
    } catch (dbError) {
      console.error('[club/orders] DB error (non-fatal):', dbError)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'

    // Send emails (fire-and-forget)
    const emailPromises = [
      sendOrderConfirmationToCustomer({
        name: name.trim(),
        email: normalizedEmail,
        orderNumber,
        items,
        subtotal,
      }),
      sendOrderApprovalRequestToAdmin({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || '',
        orderNumber,
        orderId: orderId || orderNumber,
        items,
        subtotal,
        notes: notes || '',
        approvalToken,
        siteUrl,
      }),
    ]

    Promise.all(emailPromises).catch((err) =>
      console.error('[club/orders] Email error (non-fatal):', err)
    )

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
    })
  } catch (error) {
    console.error('[club/orders] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// =============================================
// EMAIL: Customer Order Confirmation
// =============================================

async function sendOrderConfirmationToCustomer(data: {
  name: string
  email: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
}) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #2A454210;">${item.name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #2A454210; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #2A454210; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject: `Order Received — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: 0.3em; color: #2A4542;">CULTR</span>
    </div>
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; text-align: center; margin-bottom: 8px;">Order Received</h1>
    <p style="text-align: center; color: #2A454280; font-size: 14px; margin-bottom: 32px;">Order #${data.orderNumber}</p>
    <p style="margin-bottom: 24px;">Hi ${data.name.split(' ')[0]},</p>
    <p style="margin-bottom: 24px; color: #2A4542CC;">
      We've received your order request. Our medical team will review it and send you an invoice once approved.
    </p>
    <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #2A454210; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid #2A454215;">
            <th style="text-align: left; padding: 8px 0; font-weight: 600;">Therapy</th>
            <th style="text-align: center; padding: 8px 0; font-weight: 600;">Qty</th>
            <th style="text-align: right; padding: 8px 0; font-weight: 600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${data.subtotal > 0 ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #2A454215; text-align: right;">
        <span style="font-weight: 700; font-size: 16px;">Subtotal: $${data.subtotal.toFixed(2)}</span>
      </div>
      ` : ''}
    </div>
    <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; font-weight: 600; font-size: 14px;">Status: Awaiting Review</p>
      <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.7;">You'll receive an email with payment details once approved.</p>
    </div>
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A454215;">
      <p style="color: #2A454260; font-size: 12px; text-align: center; margin: 0;">CULTR Health — Personalized Longevity Medicine</p>
      <p style="color: #2A454240; font-size: 11px; text-align: center; margin-top: 12px;">Questions? Contact support@cultrhealth.com</p>
    </div>
  </div>
</body>
</html>`,
  })
}

// =============================================
// EMAIL: Admin Approval Request
// =============================================

async function sendOrderApprovalRequestToAdmin(data: {
  name: string
  email: string
  phone: string
  orderNumber: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  notes: string
  approvalToken: string
  siteUrl: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const adminEmail = 'support@cultrhealth.com'

  const approveUrl = `${data.siteUrl}/api/admin/club-orders/${data.orderId}/approve?token=${data.approvalToken}`

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[ACTION REQUIRED] New Club Order — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9; color: #333; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
    <h1 style="font-size: 20px; margin-bottom: 4px;">New Club Order</h1>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Order #${data.orderNumber}</p>

    <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-weight: 600;">Customer Info</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${data.name}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #eee;">
          <th style="text-align: left; padding: 8px 0;">Therapy</th>
          <th style="text-align: center; padding: 8px 0;">Qty</th>
          <th style="text-align: right; padding: 8px 0;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${data.subtotal > 0 ? `
    <p style="text-align: right; font-weight: 700; font-size: 16px; margin-bottom: 24px;">
      Subtotal: $${data.subtotal.toFixed(2)}
    </p>
    ` : ''}

    ${data.notes ? `
    <div style="background: #fffbe6; border-radius: 8px; padding: 12px; margin-bottom: 24px; font-size: 14px;">
      <strong>Customer Notes:</strong><br/>${data.notes}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${approveUrl}" style="display: inline-block; background: #2A4542; color: white; padding: 14px 40px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">
        APPROVE ORDER
      </a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 16px;">
      Clicking approve will create a QuickBooks invoice and send the payment link to the customer.
    </p>
  </div>
</body>
</html>`,
  })
}
