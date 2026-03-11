import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'
import { TAX_RATE_LABEL } from '@/lib/config/tax'

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  note?: string
  quantity: number
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const url = new URL(request.url)
    const tokenFromUrl = url.searchParams.get('token')

    // Auth: either admin session OR valid approval token from email
    let isAuthorized = false

    // Check admin session
    const session = await getSession()
    if (session) {
      const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
      const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
      isAuthorized = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
    }

    // Check token from email link
    if (!isAuthorized && tokenFromUrl) {
      // Validate token against stored approval_token
      if (process.env.POSTGRES_URL) {
        const tokenCheck = await sql`
          SELECT id FROM club_orders WHERE id = ${orderId}::uuid AND approval_token = ${tokenFromUrl}
        `
        isAuthorized = tokenCheck.rows.length > 0
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Fetch the order
    const orderResult = await sql`
      SELECT id, order_number, member_name, member_email, member_phone, items, subtotal_usd, status, coupon_code, discount_percent, tax_rate, tax_amount_usd
      FROM club_orders
      WHERE id = ${orderId}::uuid
    `

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.rows[0]

    if (order.status !== 'pending_approval') {
      // If called from email link, redirect to a success page
      if (tokenFromUrl) {
        const hostHeader = request.headers.get('host') || ''
        const siteUrl = (hostHeader.includes('join.cultrhealth.com') || hostHeader.includes('staging.cultrhealth.com'))
          ? `https://${hostHeader}`
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        return NextResponse.redirect(`${siteUrl}/admin/club-orders?approved=${order.order_number}&already=true`)
      }
      return NextResponse.json({
        error: `Order is already ${order.status}`,
        status: order.status,
      }, { status: 400 })
    }

    // Send approval emails to customer and admin
    const taxAmountUsd = order.tax_amount_usd ? Number(order.tax_amount_usd) : 0
    const subtotal = order.subtotal_usd ? Number(order.subtotal_usd) : 0
    const emailData = {
      name: order.member_name,
      email: order.member_email,
      orderNumber: order.order_number,
      items: order.items as OrderItem[],
      subtotal,
      taxAmount: taxAmountUsd,
      total: subtotal + taxAmountUsd,
    }

    try {
      await Promise.all([
        sendApprovalEmailToCustomer(emailData),
        sendApprovalConfirmationToAdmin(emailData),
      ])
      console.log('[club-orders/approve] Approval emails sent for', order.order_number)
    } catch (err) {
      console.error('[club-orders/approve] Email send failed:', err)
      return NextResponse.json(
        { error: 'Email send failed. Please retry approval.' },
        { status: 500 }
      )
    }

    // Update order status to approved
    await sql`
      UPDATE club_orders
      SET
        status = 'approved',
        approved_at = NOW(),
        approved_by = ${session?.email || 'email_link'},
        updated_at = NOW()
      WHERE id = ${orderId}::uuid
    `

    // If called from email link, redirect
    if (tokenFromUrl) {
      const hostHeader = request.headers.get('host') || ''
      const siteUrl = (hostHeader.includes('join.cultrhealth.com') || hostHeader.includes('staging.cultrhealth.com'))
        ? `https://${hostHeader}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
      return NextResponse.redirect(`${siteUrl}/admin/club-orders?approved=${order.order_number}`)
    }

    return NextResponse.json({
      success: true,
      status: 'approved',
    })
  } catch (error) {
    console.error('[club-orders/approve] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// Also handle GET for email link clicks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return POST(request, { params })
}

async function sendApprovalConfirmationToAdmin(data: {
  name: string
  email: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  total: number
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[club-orders/approve] CRITICAL: RESEND_API_KEY not set — email not sent')
    throw new Error('RESEND_API_KEY not configured')
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.note ? `${item.name} — ${item.note}` : item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com',
    subject: `[PROCESSED] Order Approved — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9; color: #333; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">

    <div style="background: #e8f5e9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #2A4542;">
      <strong>Order approved.</strong> Confirmation email has been sent to <strong>${data.email}</strong>.
    </div>

    <h2 style="font-size: 18px; margin-bottom: 4px;">Order #${data.orderNumber}</h2>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
      <strong>Customer:</strong> ${data.name} &lt;${data.email}&gt;
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
      <thead>
        <tr style="border-bottom: 2px solid #eee;">
          <th style="text-align: left; padding: 8px 0;">Therapy / Dosage</th>
          <th style="text-align: center; padding: 8px 0;">Qty</th>
          <th style="text-align: right; padding: 8px 0;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${data.subtotal > 0 ? `
    <div style="margin-bottom: 24px; border-top: 2px solid #eee; padding-top: 12px;">
      ${data.taxAmount > 0 ? `
      <p style="text-align: right; color: #666; font-size: 14px; margin: 0 0 4px;">Subtotal: $${data.subtotal.toFixed(2)}</p>
      <p style="text-align: right; color: #666; font-size: 14px; margin: 0 0 4px;">${TAX_RATE_LABEL}: $${data.taxAmount.toFixed(2)}</p>
      ` : ''}
      <p style="text-align: right; font-weight: 700; font-size: 15px; margin: 0;">
        Total: $${data.total.toFixed(2)}
      </p>
    </div>
    ` : ''}

    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      The order is now marked as approved. Next steps: contact the customer to finalize payment and shipping details.
    </p>

  </div>
</body>
</html>`,
  })
}

// TODO (Version 2): Implement Option A — Automated Payment Link
// - Generate Stripe checkout link or QuickBooks invoice URL on approval
// - Include "Pay Now" button in this email with one-click payment
// - Customer completes payment automatically without manual admin follow-up
// Currently using Option C (manual workaround): admin sends payment details separately

async function sendApprovalEmailToCustomer(data: {
  name: string
  email: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  total: number
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[club-orders/approve] CRITICAL: RESEND_API_KEY not set — email not sent')
    throw new Error('RESEND_API_KEY not configured')
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210;">${item.note ? `${item.name} — ${item.note}` : item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject: `Your Order is Confirmed — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: 0; color: #2A4542;">CULTR</span>
    </div>
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; text-align: center; margin-bottom: 8px;">Order Confirmed!</h1>
    <p style="text-align: center; color: #2A454280; font-size: 14px; margin-bottom: 32px;">Order #${data.orderNumber}</p>
    <p style="margin-bottom: 24px;">Hi ${data.name.split(' ')[0]},</p>
    <p style="margin-bottom: 24px; color: #2A4542CC;">
      Great news — your order has been reviewed and confirmed by our medical team.
    </p>
    <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #2A454210; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid #2A454215;">
            <th style="text-align: left; padding: 8px 0; font-weight: 600;">Therapy / Dosage</th>
            <th style="text-align: center; padding: 8px 0; font-weight: 600;">Qty</th>
            <th style="text-align: right; padding: 8px 0; font-weight: 600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${data.subtotal > 0 ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #2A454215;">
        ${data.taxAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #2A454280; margin-bottom: 4px;">
          <span>Subtotal</span><span>$${data.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #2A454280; margin-bottom: 4px;">
          <span>${TAX_RATE_LABEL}</span><span>$${data.taxAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div style="text-align: right;">
          <span style="font-weight: 700; font-size: 16px;">Total: $${data.total.toFixed(2)}</span>
        </div>
      </div>
      ` : ''}
    </div>
    <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; font-weight: 600; font-size: 14px;">Status: Confirmed by Medical Team</p>
      <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.7;">Your order is approved and ready for payment processing.</p>
    </div>

    <div style="background: #f5f0e8; border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid #2A4542;">
      <p style="margin: 0 0 12px; font-weight: 600; font-size: 14px; color: #2A4542;">Next Step: Payment</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #2A4542CC;">
        Our team will send you a payment link within 1-2 business days. You can reference your order number below when following up.
      </p>
      <p style="margin: 0; font-size: 13px; color: #2A454280;">
        <strong>Your Order Number:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: 600;">${data.orderNumber}</code>
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A454215;">
      <p style="color: #2A454260; font-size: 12px; text-align: center; margin: 0;">CULTR Health — Personalized Longevity Medicine</p>
      <p style="color: #2A454240; font-size: 11px; text-align: center; margin-top: 12px;">Questions? Contact support@cultrhealth.com or reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
  })
}
