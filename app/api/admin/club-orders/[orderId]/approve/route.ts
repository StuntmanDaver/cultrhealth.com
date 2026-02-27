import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
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
      SELECT id, order_number, member_name, member_email, member_phone, items, subtotal_usd, status
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
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        return NextResponse.redirect(`${siteUrl}/admin/club-orders?approved=${order.order_number}&already=true`)
      }
      return NextResponse.json({
        error: `Order is already ${order.status}`,
        status: order.status,
      }, { status: 400 })
    }

    // Try to create QuickBooks invoice
    let qbInvoiceId: string | null = null
    let qbInvoiceUrl: string | null = null

    try {
      const qb = await import('@/lib/quickbooks')
      const accessToken = await qb.getAccessToken()
      if (accessToken) {
        const customerId = await qb.findOrCreateCustomer(
          accessToken,
          order.member_name,
          order.member_email
        )
        const items = order.items as OrderItem[]
        const invoice = await qb.createInvoice(accessToken, customerId, items, order.order_number)
        if (invoice) {
          qbInvoiceId = invoice.invoiceId
          const sent = await qb.sendInvoice(accessToken, invoice.invoiceId)
          qbInvoiceUrl = sent?.payNowLink || invoice.invoiceLink || null
        }
      }
    } catch (qbError) {
      console.error('[club-orders/approve] QuickBooks error (non-fatal):', qbError)
      // Continue without QB — order still gets approved
    }

    // Update order status
    const newStatus = qbInvoiceId ? 'invoice_sent' : 'approved'
    await sql`
      UPDATE club_orders
      SET
        status = ${newStatus},
        approved_at = NOW(),
        approved_by = ${session?.email || 'email_link'},
        qb_invoice_id = ${qbInvoiceId},
        qb_invoice_url = ${qbInvoiceUrl},
        updated_at = NOW()
      WHERE id = ${orderId}::uuid
    `

    // Send email to customer
    sendApprovalEmailToCustomer({
      name: order.member_name,
      email: order.member_email,
      orderNumber: order.order_number,
      invoiceUrl: qbInvoiceUrl,
      items: order.items as OrderItem[],
      subtotal: order.subtotal_usd ? Number(order.subtotal_usd) : 0,
    }).catch((err) => console.error('[club-orders/approve] Email error:', err))

    // If called from email link, redirect
    if (tokenFromUrl) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
      return NextResponse.redirect(`${siteUrl}/admin/club-orders?approved=${order.order_number}`)
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      qbInvoiceId,
      qbInvoiceUrl,
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

async function sendApprovalEmailToCustomer(data: {
  name: string
  email: string
  orderNumber: string
  invoiceUrl: string | null
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
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210;">${item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #2A454210; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  const paymentSection = data.invoiceUrl
    ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.invoiceUrl}" style="display: inline-block; background: #2A4542; color: white; padding: 14px 48px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Pay Now
      </a>
    </div>
    <p style="text-align: center; color: #2A454260; font-size: 13px;">
      Click above to view your invoice and complete payment securely via QuickBooks.
    </p>
    `
    : `
    <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; font-size: 14px;">Order Approved</p>
      <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.7;">Our team will send you payment details shortly.</p>
    </div>
    `

  await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject: `Your Order is Approved — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: 0; color: #2A4542;">CULTR</span>
    </div>
    <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; text-align: center; margin-bottom: 8px;">Order Approved!</h1>
    <p style="text-align: center; color: #2A454280; font-size: 14px; margin-bottom: 32px;">Order #${data.orderNumber}</p>
    <p style="margin-bottom: 24px;">Hi ${data.name.split(' ')[0]},</p>
    <p style="margin-bottom: 24px; color: #2A4542CC;">
      Great news — your order has been reviewed and approved by our medical team.
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
    </div>
    ${paymentSection}
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A454215;">
      <p style="color: #2A454260; font-size: 12px; text-align: center; margin: 0;">CULTR Health — Personalized Longevity Medicine</p>
      <p style="color: #2A454240; font-size: 11px; text-align: center; margin-top: 12px;">Questions? Contact support@cultrhealth.com</p>
    </div>
  </div>
</body>
</html>`,
  })
}
