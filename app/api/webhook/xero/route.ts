import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { USE_XERO } from '@/lib/config/feature-flags'
import { getInvoice } from '@/lib/xero'
import { fireZapierWebhook } from '@/lib/zapier'
import { sql } from '@vercel/postgres'
import { escapeHtml } from '@/lib/resend'

/**
 * Xero Webhook Handler
 *
 * Receives invoice events from Xero Accounting API.
 * Signature: HMAC-SHA256 of raw body using XERO_WEBHOOK_KEY → base64 → x-xero-signature header.
 *
 * Xero "intent to receive" handshake: Xero sends a validation request with an
 * empty/minimal body during webhook setup. We must return 200 immediately.
 *
 * Docs: https://developer.xero.com/documentation/guides/webhooks/overview/
 */

interface XeroEvent {
  resourceId: string
  tenantId: string
  eventCategory: string  // "INVOICE"
  eventType: string      // "UPDATE" | "CREATE"
  resourceUrl?: string
}

interface XeroWebhookPayload {
  events: XeroEvent[]
  lastEventSequence?: number
  firstEventSequence?: number
  entropy?: string
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-xero-signature') ?? ''
  const webhookKey = process.env.XERO_WEBHOOK_KEY

  if (!webhookKey) {
    console.error('[xero-webhook] XERO_WEBHOOK_KEY not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Verify HMAC-SHA256 signature (always — including intent-to-receive)
  const expectedSig = crypto
    .createHmac('sha256', webhookKey)
    .update(rawBody)
    .digest('base64')
  const expectedBuf = Buffer.from(expectedSig)
  const sigBuf = Buffer.from(signature)

  if (
    expectedBuf.length !== sigBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, sigBuf)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Xero intent-to-receive: empty or whitespace-only body
  if (!rawBody.trim()) {
    return NextResponse.json({ received: true })
  }

  if (!USE_XERO) {
    return NextResponse.json({ received: true, ignored: true })
  }

  let payload: XeroWebhookPayload
  try {
    payload = JSON.parse(rawBody) as XeroWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  for (const event of payload.events ?? []) {
    if (event.eventCategory === 'INVOICE' && event.eventType === 'UPDATE') {
      await safeHandler('invoice_update', () => handleInvoiceUpdate(event))
    }
  }

  return NextResponse.json({ received: true })
}

async function safeHandler(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    console.error(`[xero-webhook] ${label} handler error:`, err instanceof Error ? err.message : 'unknown')
  }
}

async function handleInvoiceUpdate(event: XeroEvent) {
  const invoice = await getInvoice(event.resourceId, event.tenantId)
  if (!invoice) return

  // Only act on ACCREC (accounts receivable) invoices
  if (invoice.Type !== 'ACCREC') return

  const orderResult = await sql`
    SELECT id, order_number, member_name, member_email, subtotal_usd, status
    FROM club_orders
    WHERE xero_invoice_id = ${invoice.InvoiceID}
  `
  const order = orderResult.rows[0]

  if (invoice.Status === 'PAID') {
    if (order) {
      if (order.status !== 'paid') {
        await sql`
          UPDATE club_orders SET status = 'paid', updated_at = NOW()
          WHERE id = ${order.id}
        `
        await sendXeroPaymentNotification({
          orderNumber: order.order_number,
          customerName: order.member_name,
          amount: invoice.AmountPaid,
        })
      }
    }

    const zapierUrl = process.env.ZAPIER_XERO_EVENT_URL
    if (zapierUrl) {
      await fireZapierWebhook(zapierUrl, 'invoice_paid', {
        invoiceStatus: 'PAID',
        source: 'xero',
      })
    }
    return
  }

  if (invoice.Status === 'VOIDED') {
    if (order && order.status !== 'cancelled') {
      await sql`
        UPDATE club_orders SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${order.id}
      `
    }
    return
  }

  // Check overdue: AUTHORISED + AmountDue > 0 + DueDate in the past
  if (invoice.Status === 'AUTHORISED' && invoice.AmountDue > 0 && invoice.DueDate) {
    const dueDate = new Date(invoice.DueDate)
    if (dueDate < new Date()) {
      const zapierUrl = process.env.ZAPIER_XERO_EVENT_URL
      if (zapierUrl) {
        await fireZapierWebhook(zapierUrl, 'invoice_overdue', {
          invoiceStatus: 'OVERDUE',
          source: 'xero',
          daysPastDue: Math.floor((Date.now() - dueDate.getTime()) / 86_400_000),
        })
      }
    }
  }
}

async function sendXeroPaymentNotification(data: {
  orderNumber: string
  customerName: string
  amount: number
}) {
  if (!process.env.RESEND_API_KEY) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `✅ Xero Payment Received — ${data.orderNumber}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #FDFBF7; color: #2A4542; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
    <div style="background: #e8f5e9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px;">
      <strong>✅ Xero Invoice Paid</strong>
    </div>
    <h2 style="font-size: 18px; margin-bottom: 8px;">Order #${escapeHtml(data.orderNumber)}</h2>
    <p style="font-size: 14px; margin-bottom: 16px;"><strong>Customer:</strong> ${escapeHtml(data.customerName)}</p>
    <p style="font-size: 20px; font-weight: 700;">$${data.amount.toFixed(2)}</p>
    <p style="font-size: 13px; color: #546E6B;">Order status updated to <strong>paid</strong> automatically.</p>
  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[xero-webhook] Failed to send payment notification:', err instanceof Error ? err.message : 'unknown')
  }
}
