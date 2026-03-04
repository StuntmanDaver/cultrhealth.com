import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'

/**
 * QuickBooks Webhook Handler
 *
 * Listens for QB events (Invoice.Payment) and updates order status.
 * QB sends webhooks for: Invoice.Payment, Invoice.Change, etc.
 *
 * Webhook setup: admin.intuit.com → Settings → Webhooks
 */

interface QBWebhookPayload {
  eventNotifications: Array<{
    realmId: string
    dataChangeEvent?: {
      entities: Array<{
        name: string
        id: string
        operation: string
        lastUpdatedTime: number
      }>
    }
  }>
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('intuit-content-signature') || ''
    const webhookToken = process.env.QUICKBOOKS_WEBHOOK_TOKEN

    // Verify webhook signature (security)
    if (webhookToken) {
      const hash = crypto
        .createHmac('sha256', webhookToken)
        .update(body)
        .digest('base64')

      if (hash !== signature) {
        console.warn('[qb-webhook] Invalid signature — rejecting webhook')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body) as QBWebhookPayload

    if (!payload.eventNotifications || payload.eventNotifications.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Process each QB event
    for (const notification of payload.eventNotifications) {
      const { realmId, dataChangeEvent } = notification

      if (!dataChangeEvent?.entities) continue

      for (const entity of dataChangeEvent.entities) {
        // We're interested in Invoice changes (Invoice.Payment would be a note, but Invoice entity covers payment updates)
        if (entity.name === 'Invoice' && entity.operation === 'Update') {
          console.log('[qb-webhook] Invoice updated:', entity.id)

          // Fetch the invoice from QB to check if it's paid
          try {
            const accessToken = await getQBAccessToken()
            if (!accessToken) {
              console.warn('[qb-webhook] Cannot fetch invoice — QB not configured')
              continue
            }

            const invoiceData = await getInvoiceFromQB(accessToken, entity.id, realmId)
            if (!invoiceData) continue

            // Check if invoice is fully paid
            const balance = Number(invoiceData.Balance || 0)
            const total = Number(invoiceData.TotalAmt || 0)
            const isPaid = balance === 0 && total > 0

            if (isPaid) {
              console.log('[qb-webhook] Invoice paid:', entity.id, '— updating order status')
              await markOrderAsPaymentReceived(entity.id, invoiceData)
            }
          } catch (err) {
            console.error('[qb-webhook] Error processing invoice:', entity.id, err)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[qb-webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Get QB access token from DB or env
 */
async function getQBAccessToken(): Promise<string | null> {
  try {
    const qb = await import('@/lib/quickbooks')
    return await qb.getAccessToken()
  } catch {
    return null
  }
}

/**
 * Fetch invoice details from QB API
 */
async function getInvoiceFromQB(
  accessToken: string,
  invoiceId: string,
  realmId: string
): Promise<Record<string, unknown> | null> {
  try {
    const isSandbox = process.env.QUICKBOOKS_SANDBOX === 'true'
    const baseUrl = isSandbox
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com'

    const url = `${baseUrl}/v3/company/${realmId}/invoice/${invoiceId}`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.error('[qb-webhook] Failed to fetch invoice:', res.status)
      return null
    }

    const data = await res.json() as { Invoice?: Record<string, unknown> }
    return data.Invoice || null
  } catch (error) {
    console.error('[qb-webhook] Error fetching invoice:', error)
    return null
  }
}

/**
 * Update order status to 'paid' and send admin notification
 */
async function markOrderAsPaymentReceived(
  qbInvoiceId: string,
  invoiceData: Record<string, unknown>
) {
  if (!process.env.POSTGRES_URL) {
    console.warn('[qb-webhook] Database not configured')
    return
  }

  try {
    // Find order by QB invoice ID
    const orderResult = await sql`
      SELECT id, order_number, member_name, member_email, member_phone, items, subtotal_usd, status
      FROM club_orders
      WHERE qb_invoice_id = ${qbInvoiceId}
    `

    if (orderResult.rows.length === 0) {
      console.warn('[qb-webhook] No order found with QB invoice ID:', qbInvoiceId)
      return
    }

    const order = orderResult.rows[0]

    // Only update if currently invoice_sent (not already paid)
    if (order.status === 'paid') {
      console.log('[qb-webhook] Order already marked as paid:', order.order_number)
      return
    }

    // Update status to paid
    await sql`
      UPDATE club_orders
      SET status = 'paid', updated_at = NOW()
      WHERE id = ${order.id}
    `

    console.log('[qb-webhook] Order marked as paid:', order.order_number)

    // Send admin notification
    await sendPaymentReceivedNotification({
      orderNumber: order.order_number,
      customerName: order.member_name,
      customerEmail: order.member_email,
      amount: Number(invoiceData.TotalAmt || 0),
      qbInvoiceId,
    })
  } catch (err) {
    console.error('[qb-webhook] Error updating order status:', err)
  }
}

/**
 * Email admin when payment is received
 */
async function sendPaymentReceivedNotification(data: {
  orderNumber: string
  customerName: string
  customerEmail: string
  amount: number
  qbInvoiceId: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[qb-webhook] RESEND_API_KEY not set — payment notification not sent')
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
    const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `✅ Payment Received — ${data.orderNumber}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9; color: #333; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
    <div style="background: #e8f5e9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #2A4542;">
      <strong>✅ Payment Confirmed</strong> — Invoice fully paid in QuickBooks
    </div>

    <h2 style="font-size: 18px; margin-bottom: 4px;">Order #${data.orderNumber}</h2>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
      <strong>Customer:</strong> ${data.customerName} &lt;${data.customerEmail}&gt;
    </p>

    <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px;"><strong>Amount Paid:</strong></p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #2A4542;">$${data.amount.toFixed(2)}</p>
    </div>

    <div style="background: #f5f5f5; border-radius: 8px; padding: 12px 16px; font-size: 12px; margin-bottom: 24px; word-break: break-all;">
      <strong>QB Invoice ID:</strong><br/>${data.qbInvoiceId}
    </div>

    <p style="color: #666; font-size: 13px;">
      Order status has been automatically updated to <strong>paid</strong> in the database.
    </p>

  </div>
</body>
</html>`,
    })

    console.log('[qb-webhook] Payment notification sent to admin for order:', data.orderNumber)
  } catch (err) {
    console.error('[qb-webhook] Error sending admin notification:', err)
  }
}
