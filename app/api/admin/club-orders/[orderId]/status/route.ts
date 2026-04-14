import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import crypto from 'crypto'
import { getSession, isProviderEmail } from '@/lib/auth'
import {
  PIPELINE_ORDER,
  ALLOWED_TRANSITIONS,
  NEXT_ACTIONS
} from '@/lib/admin-club-orders'
import {
  getOrderAttributionByOrderId,
  reverseCommissionsForAttribution,
  restoreCommissionsForAttribution,
  updateOrderAttributionStatus,
} from '@/lib/creators/db'
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } from '@/lib/resend'

// Timestamp columns for each pipeline stage (used when skipping stages)
const STAGE_TIMESTAMPS: Record<string, string> = {
  approved: 'approved_at',
  paid: 'paid_at',
  shipped: 'shipped_at',
  fulfilled: 'fulfilled_at',
}

// Status labels for emails
const STATUS_LABELS: Record<string, string> = {
  needs_payment: 'Awaiting Payment',
  paid: 'Payment Confirmed',
  waiting_to_ship: 'Processing — Waiting to Ship',
  shipped: 'Order Shipped',
  fulfilled: 'Order Complete',
}

function generateStatusToken(orderId: string, newStatus: string): { token: string; expiresAt: number } {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  const expiresAt = Date.now() + 48 * 60 * 60 * 1000 // 48h
  const token = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:status:${newStatus}:${expiresAt}`)
    .digest('hex')
  return { token, expiresAt }
}

function verifyStatusToken(orderId: string, newStatus: string, token: string, expiresAt: number): boolean {
  const secret = process.env.JWT_SECRET
  if (!secret) return false
  if (Date.now() > expiresAt) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:status:${newStatus}:${expiresAt}`)
    .digest('hex')
  const tokenBuf = Buffer.from(token)
  const expectedBuf = Buffer.from(expected)
  if (tokenBuf.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(tokenBuf, expectedBuf)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const url = new URL(request.url)
    const tokenFromUrl = url.searchParams.get('token')
    const expiresFromUrl = url.searchParams.get('expires')
    const statusFromUrl = url.searchParams.get('status')

    let isAuthorized = false
    let authMethod = 'session'

    // Check admin session
    const session = await getSession()
    if (session) {
      const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
      const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
      isAuthorized = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
    }

    // Check HMAC token from email link
    if (!isAuthorized && tokenFromUrl && expiresFromUrl && statusFromUrl) {
      if (verifyStatusToken(orderId, statusFromUrl, tokenFromUrl, parseInt(expiresFromUrl, 10))) {
        isAuthorized = true
        authMethod = 'email_link'
      } else {
        return NextResponse.json({ error: 'Invalid or expired action link' }, { status: 410 })
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Parse body (from dashboard) or use URL params (from email link)
    let newStatus: string
    let carrier: string | undefined
    let trackingNumber: string | undefined
    let trackingUrl: string | undefined
    let suppressEmails = false
    let manualProcessed = false

    if (authMethod === 'email_link') {
      newStatus = statusFromUrl!
    } else {
      const body = await request.json()
      newStatus = body.status
      carrier = body.carrier
      trackingNumber = body.trackingNumber
      trackingUrl = body.trackingUrl
      suppressEmails = body.suppressEmails === true
      manualProcessed = body.manualProcessed === true
    }

    if (!newStatus) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Shipped transitions always require tracking info (inline form enforces this client-side;
    // this guard protects the API from direct calls that skip the form)
    if (newStatus === 'shipped' && authMethod !== 'email_link' && (!carrier || !trackingNumber)) {
      return NextResponse.json(
        { error: 'carrier and trackingNumber are required when marking an order as shipped' },
        { status: 400 }
      )
    }

    // Fetch current order
    const current = await sql`
      SELECT id, order_number, member_name, member_email, status, items, subtotal_usd,
             tracking_carrier, tracking_number, tracking_url
      FROM club_orders WHERE id = ${orderId}::uuid
    `
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const order = current.rows[0] as {
      id: string; order_number: string; member_name: string; member_email: string;
      status: string; items: unknown; subtotal_usd: number | null;
      tracking_carrier: string | null; tracking_number: string | null; tracking_url: string | null;
    }
    const currentStatus = order.status

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(newStatus)) {
      // If from email link, redirect with error
      if (authMethod === 'email_link') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&error=already_${order.status}`)
      }
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${newStatus}'` },
        { status: 400 }
      )
    }

    // Determine direction: forward (set timestamps) or backward (clear timestamps)
    const fromIdx = PIPELINE_ORDER.indexOf(currentStatus as typeof PIPELINE_ORDER[number])
    const toIdx = PIPELINE_ORDER.indexOf(newStatus as typeof PIPELINE_ORDER[number])
    const isForward = toIdx >= 0 && toIdx > fromIdx
    const isBackward = fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx
    const isSkip = isForward && (fromIdx < 0 ? toIdx > 0 : toIdx - fromIdx > 1)

    const actorEmail = session?.email || 'email_link'
    const now = new Date().toISOString()

    // Forward: set timestamps for all stages between current and target (inclusive)
    // Backward: CLEAR timestamps for all stages after the target (rolling back)
    let approvedAtVal: string | null = null
    let approvedByVal: string | null = null
    let paidAtVal: string | null = null
    let shippedAtVal: string | null = null
    let fulfilledAtVal: string | null = null
    // Sentinel: use 'CLEAR' to null out a timestamp on rollback
    const CLEAR = '__CLEAR__'

    if (isForward) {
      // Set timestamps for skipped + target stages
      for (let i = Math.max(0, fromIdx + 1); i <= toIdx; i++) {
        const stage = PIPELINE_ORDER[i]
        if (stage === 'approved') { approvedAtVal = now; approvedByVal = actorEmail }
        if (stage === 'paid') paidAtVal = now
        if (stage === 'shipped') shippedAtVal = now
        if (stage === 'fulfilled') fulfilledAtVal = now
      }
    } else if (isBackward) {
      // Clear timestamps for all stages AFTER the target (they're being undone)
      for (let i = toIdx + 1; i < PIPELINE_ORDER.length; i++) {
        const stage = PIPELINE_ORDER[i]
        if (stage === 'approved') { approvedAtVal = CLEAR; approvedByVal = CLEAR }
        if (stage === 'paid') paidAtVal = CLEAR
        if (stage === 'shipped') shippedAtVal = CLEAR
        if (stage === 'fulfilled') fulfilledAtVal = CLEAR
      }
    }

    // Build the SQL — forward sets via COALESCE(existing, new), backward nulls out
    let result
    result = await sql`
      UPDATE club_orders
      SET status = ${newStatus}, updated_at = NOW(),
          approved_at = CASE
            WHEN ${approvedAtVal === CLEAR}::boolean THEN NULL
            ELSE COALESCE(approved_at, ${approvedAtVal !== CLEAR ? approvedAtVal : null}::timestamptz)
          END,
          approved_by = CASE
            WHEN ${approvedByVal === CLEAR}::boolean THEN NULL
            ELSE COALESCE(approved_by, ${approvedByVal !== CLEAR ? approvedByVal : null})
          END,
          paid_at = CASE
            WHEN ${paidAtVal === CLEAR}::boolean THEN NULL
            ELSE COALESCE(paid_at, ${paidAtVal !== CLEAR ? paidAtVal : null}::timestamptz)
          END,
          shipped_at = CASE
            WHEN ${shippedAtVal === CLEAR}::boolean THEN NULL
            ELSE COALESCE(shipped_at, ${shippedAtVal !== CLEAR ? shippedAtVal : null}::timestamptz)
          END,
          fulfilled_at = CASE
            WHEN ${fulfilledAtVal === CLEAR}::boolean THEN NULL
            ELSE COALESCE(fulfilled_at, ${fulfilledAtVal !== CLEAR ? fulfilledAtVal : null}::timestamptz)
          END,
          tracking_carrier = COALESCE(${carrier || null}, tracking_carrier),
          tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
          tracking_url = COALESCE(${trackingUrl || null}, tracking_url)
      WHERE id = ${orderId}::uuid AND status = ${currentStatus}
        RETURNING id, status, order_number
      `

    if (result.rowCount === 0) {
      if (authMethod === 'email_link') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&error=concurrent`)
      }
      return NextResponse.json({ error: 'Order status changed concurrently, please refresh' }, { status: 409 })
    }

    // Keep creator attribution and admin order state aligned when orders are voided or reopened.
    // Each step is in its own non-fatal try/catch so a commission failure never rolls back
    // an already-committed status update. When sync fails, we log to admin_actions so ops
    // can query for 'commission_sync_failed' rows and reconcile manually.
    try {
      const linkedAttribution = await getOrderAttributionByOrderId(order.id)
      if (newStatus === 'cancelled' && linkedAttribution) {
        let commissionSyncFailed = false
        try {
          await reverseCommissionsForAttribution(linkedAttribution.id)
        } catch (err) {
          console.error(`[club-orders/status] Failed to reverse commissions for order ${order.id}:`, err)
          commissionSyncFailed = true
        }
        try {
          await updateOrderAttributionStatus(linkedAttribution.id, 'refunded')
        } catch (err) {
          console.error(`[club-orders/status] Failed to update attribution status to refunded for order ${order.id}:`, err)
          commissionSyncFailed = true
        }
        if (commissionSyncFailed) {
          try {
            await sql`
              INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
              VALUES (
                ${actorEmail},
                ${'commission_sync_failed'},
                ${'club_order'},
                ${orderId},
                ${'Commission reversal failed on order cancellation — manual reconciliation required'},
                ${JSON.stringify({ attributionId: linkedAttribution.id, newStatus, currentStatus })}
              )
            `
          } catch { /* audit log failure should never block */ }
        }
      } else if (currentStatus === 'cancelled' && newStatus !== 'cancelled' && linkedAttribution?.status === 'refunded') {
        let commissionSyncFailed = false
        try {
          await restoreCommissionsForAttribution(linkedAttribution.id)
        } catch (err) {
          console.error(`[club-orders/status] Failed to restore commissions for order ${order.id}:`, err)
          commissionSyncFailed = true
        }
        try {
          await updateOrderAttributionStatus(linkedAttribution.id, 'pending')
        } catch (err) {
          console.error(`[club-orders/status] Failed to update attribution status to pending for order ${order.id}:`, err)
          commissionSyncFailed = true
        }
        if (commissionSyncFailed) {
          try {
            await sql`
              INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
              VALUES (
                ${actorEmail},
                ${'commission_sync_failed'},
                ${'club_order'},
                ${orderId},
                ${'Commission restore failed on order revival — manual reconciliation required'},
                ${JSON.stringify({ attributionId: linkedAttribution.id, newStatus, currentStatus })}
              )
            `
          } catch { /* audit log failure should never block */ }
        }
      }
    } catch (err) {
      console.error(`[club-orders/status] Failed to fetch attribution for order ${order.id}:`, err)
    }

    // Log to admin_actions audit trail (non-fatal)
    try {
      await sql`
        INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
        VALUES (
          ${actorEmail},
          ${'status_change'},
          ${'club_order'},
          ${orderId},
          ${`${currentStatus} → ${newStatus}${isSkip ? ' (skip)' : ''}${isBackward ? ' (rollback)' : ''}`},
          ${JSON.stringify({ from: currentStatus, to: newStatus, method: authMethod, skip: isSkip, rollback: isBackward, suppressEmails, manualProcessed, carrier, trackingNumber })}
        )
      `
    } catch {
      // Audit logging should never break flows
    }

    // Send emails (non-fatal — status already committed)
    if (!suppressEmails) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.cultrhealth.com'
        const emailResults = await Promise.allSettled([
          sendAdminStatusEmail(order, newStatus, siteUrl, orderId),
          sendCustomerStatusEmail(order, newStatus, carrier, trackingNumber, trackingUrl),
        ])
        const adminResult = emailResults[0]
        const notifyResult = emailResults[1]
        if (adminResult.status === 'rejected') console.warn('[club-orders/status] admin notification send failed')
        if (notifyResult.status === 'rejected') console.warn('[club-orders/status] status notification send failed')
      } catch {
        // Email failures are non-fatal
      }
    }

    // If from email link, redirect to success
    if (authMethod === 'email_link') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
      return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&updated=${order.order_number}&status=${newStatus}`)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[club-orders/status] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also handle GET for email link clicks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return POST(request, { params })
}

// ═══ Admin Status Email — includes next action button ═══

async function sendAdminStatusEmail(
  order: { id: string; order_number: string; member_name: string; member_email: string; items: unknown; subtotal_usd: number | null },
  newStatus: string,
  siteUrl: string,
  orderId: string,
) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

  const statusLabel = STATUS_LABELS[newStatus] || newStatus
  const nextAction = NEXT_ACTIONS[newStatus]

  // Generate HMAC link for next action button
  let actionButtonHtml = ''
  if (nextAction) {
    const { token, expiresAt } = generateStatusToken(orderId, nextAction.status)
    const actionUrl = `${siteUrl}/api/admin/club-orders/${orderId}/status?token=${token}&amp;expires=${expiresAt}&amp;status=${nextAction.status}`
    actionButtonHtml = `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${actionUrl}" style="display: inline-block; background: ${nextAction.color}; color: white; padding: 14px 40px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px;">
          ${nextAction.label}
        </a>
      </div>`
  }

  const statusColors: Record<string, string> = {
    paid: '#e8f5e9',
    waiting_to_ship: '#f3e8ff',
    shipped: '#e3f2fd',
    fulfilled: '#e8f5e9',
    cancelled: '#fce4ec',
  }

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[${statusLabel.toUpperCase()}] ${escapeHtml(order.order_number)} — ${escapeHtml(order.member_name)}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">

    <div style="background: ${statusColors[newStatus] || '#f5f5f5'}; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #2A4542;">
      <strong>${escapeHtml(statusLabel)}</strong> — Order <strong>#${escapeHtml(order.order_number)}</strong>
    </div>

    <p style="font-size: 14px; color: #3A5956; margin-bottom: 8px;">
      <strong>Customer:</strong> ${escapeHtml(order.member_name)} &lt;${escapeHtml(order.member_email)}&gt;
    </p>
    ${order.subtotal_usd ? `<p style="font-size: 14px; color: #3A5956; margin-bottom: 24px;"><strong>Amount:</strong> $${Number(order.subtotal_usd).toFixed(2)}</p>` : ''}

    ${actionButtonHtml}

    <p style="color: #999; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;">
      <a href="${siteUrl}/admin/orders?tab=club-orders" style="color: #2A4542; text-decoration: underline;">View all orders in dashboard</a>
      ${nextAction ? ` · Action link expires in 48 hours` : ''}
    </p>

  </div>
</body>
</html>`,
  })
}

// ═══ Customer Status Email — branded notifications ═══

async function sendCustomerStatusEmail(
  order: { order_number: string; member_name: string; member_email: string },
  newStatus: string,
  carrier?: string,
  trackingNumber?: string,
  trackingUrl?: string,
) {
  // Only send customer emails for these statuses
  if (!['paid', 'shipped', 'fulfilled', 'cancelled'].includes(newStatus)) return
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const firstName = escapeHtml(order.member_name.split(' ')[0])
  const orderNum = escapeHtml(order.order_number)

  const templates: Record<string, { subject: string; heading: string; statusBg: string; statusText: string; body: string }> = {
    paid: {
      subject: `Payment Confirmed — ${order.order_number}`,
      heading: 'Payment Confirmed!',
      statusBg: '#D8F3DC',
      statusText: 'Your payment has been received and verified.',
      body: `<p style="margin: 0 0 16px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        Thank you for your payment! Our team is now preparing your order for shipment. We'll send you tracking details once your order ships.
      </p>`,
    },
    shipped: {
      subject: `Your Order Has Shipped — ${order.order_number}`,
      heading: 'Your Order Has Shipped!',
      statusBg: '#DBEAFE',
      statusText: 'Your order is on its way to you.',
      body: `<p style="margin: 0 0 16px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        Great news — your order has been shipped! You will receive tracking information directly from our fulfillment partner once your package is in transit.
      </p>`,
    },
    fulfilled: {
      subject: `Order Complete — ${order.order_number}`,
      heading: 'Order Complete!',
      statusBg: '#D8F3DC',
      statusText: 'Your order has been delivered and fulfilled.',
      body: `<p style="margin: 0 0 16px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        Your order has been completed! If you have any questions about your therapies, our team is always here to help.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="mailto:support@cultrhealth.com" style="display: inline-block; background: #2A4542; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">Contact Support</a>
      </div>`,
    },
    cancelled: {
      subject: `Order Cancelled — ${order.order_number}`,
      heading: 'Order Cancelled',
      statusBg: '#FCE4EC',
      statusText: 'Your order has been cancelled.',
      body: `<p style="margin: 0 0 16px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        Your order has been cancelled. If you believe this was a mistake or have questions, please reach out to our support team and we&rsquo;ll be happy to help.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="mailto:support@cultrhealth.com" style="display: inline-block; background: #2A4542; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">Contact Support</a>
      </div>`,
    },
  }

  const tpl = templates[newStatus]
  if (!tpl) return

  await resend.emails.send({
    from: fromEmail,
    to: order.member_email,
    subject: tpl.subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 4px; color: #2A4542;">${tpl.heading}</h1>
      <p style="text-align: center; color: #7E8D8A; font-size: 13px; margin: 0 0 28px;">Order #${orderNum}</p>

      <p style="margin: 0 0 16px; font-size: 15px;">Hi ${firstName},</p>
      ${tpl.body}

      <div style="background: ${tpl.statusBg}; border-radius: 12px; padding: 16px; text-align: center; margin-top: 24px;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #2A4542;">Status: ${tpl.heading}</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #3A5956;">${tpl.statusText}</p>
      </div>

      <p style="margin: 24px 0 0; font-size: 13px; color: #7E8D8A; text-align: center;">
        Your Order Number: <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: 600; color: #2A4542;">${orderNum}</code>
      </p>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}
