import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { startCronRun } from '@/lib/cron-logger'
import { escapeHtml } from '@/lib/resend'

export const dynamic = 'force-dynamic'

const STALE_HOURS = 48

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved (no invoice)',
  invoice_sent: 'Invoice Sent (awaiting payment)',
  paid: 'Paid (awaiting shipment)',
  shipped: 'Shipped (awaiting fulfillment)',
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const run = await startCronRun('stale-orders')

  try {
    // Find orders stuck in any active status for more than 48 hours
    // Use the most recent timestamp for each status to determine staleness
    const result = await sql`
      SELECT
        id, order_number, member_name, member_email, status,
        subtotal_usd, created_at, approved_at, paid_at, shipped_at,
        EXTRACT(EPOCH FROM (NOW() - GREATEST(
          COALESCE(shipped_at, '1970-01-01'),
          COALESCE(paid_at, '1970-01-01'),
          COALESCE(approved_at, '1970-01-01'),
          created_at
        ))) / 3600 AS hours_in_status
      FROM club_orders
      WHERE status IN ('pending_approval', 'approved', 'invoice_sent', 'paid', 'shipped')
      ORDER BY created_at ASC
    `

    interface StaleOrder {
      id: string; order_number: string; member_name: string; member_email: string;
      status: string; subtotal_usd: number | null; hours_in_status: number;
    }

    const staleOrders: StaleOrder[] = result.rows
      .filter(r => Number(r.hours_in_status) >= STALE_HOURS)
      .map(r => ({
        id: r.id as string,
        order_number: r.order_number as string,
        member_name: r.member_name as string,
        member_email: r.member_email as string,
        status: r.status as string,
        hours_in_status: Math.round(Number(r.hours_in_status)),
        subtotal_usd: r.subtotal_usd ? Number(r.subtotal_usd) : null,
      }))

    if (staleOrders.length === 0) {
      const res = { staleCount: 0, emailSent: false }
      await run.success(res)
      return NextResponse.json({ success: true, ...res })
    }

    // Group by status for the digest
    const byStatus: Record<string, typeof staleOrders> = {}
    staleOrders.forEach(o => {
      if (!byStatus[o.status]) byStatus[o.status] = []
      byStatus[o.status].push(o)
    })

    // Send digest email
    await sendStaleOrderDigest(byStatus, staleOrders.length)

    const res = {
      staleCount: staleOrders.length,
      byStatus: Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [k, v.length])),
      emailSent: true,
    }
    await run.success(res)

    return NextResponse.json({ success: true, ...res })
  } catch (error) {
    await run.error(error)
    console.error('[cron/stale-orders] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendStaleOrderDigest(
  byStatus: Record<string, { order_number: string; member_name: string; member_email: string; status: string; subtotal_usd: number | null; hours_in_status: number }[]>,
  totalCount: number,
) {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.cultrhealth.com'

  const sections = Object.entries(byStatus).map(([status, orders]) => {
    const label = STATUS_LABELS[status] || status
    const rows = orders.map(o => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px;">${escapeHtml(o.order_number)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(o.member_name)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${o.subtotal_usd ? `$${o.subtotal_usd.toFixed(2)}` : 'TBD'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; color: ${o.hours_in_status > 96 ? '#dc2626' : '#d97706'}; font-weight: 600;">${Math.round(o.hours_in_status / 24)}d ${o.hours_in_status % 24}h</td>
      </tr>
    `).join('')

    return `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #2A4542; margin: 0 0 8px; padding: 8px 12px; background: #f5f5f5; border-radius: 6px;">
          ${escapeHtml(label)} <span style="color: #999; font-weight: normal;">(${orders.length})</span>
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee;">
              <th style="text-align: left; padding: 6px 12px; color: #999; font-weight: 500;">Order #</th>
              <th style="text-align: left; padding: 6px 12px; color: #999; font-weight: 500;">Customer</th>
              <th style="text-align: right; padding: 6px 12px; color: #999; font-weight: 500;">Amount</th>
              <th style="text-align: right; padding: 6px 12px; color: #999; font-weight: 500;">Stale</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }).join('')

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[ACTION NEEDED] ${totalCount} stale order${totalCount !== 1 ? 's' : ''} — stuck >48h`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9; color: #333; padding: 40px 20px; margin: 0;">
  <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">

    <div style="background: #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 14px; color: #92400e;">
      <strong>${totalCount} order${totalCount !== 1 ? 's need' : ' needs'} attention</strong> — stuck in the same status for more than 48 hours.
    </div>

    ${sections}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${siteUrl}/admin/orders?tab=pending" style="display: inline-block; background: #2A4542; color: white; padding: 14px 40px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px;">
        View All Orders
      </a>
    </div>

    <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
      This digest runs daily. Orders older than 96h are highlighted in red.
    </p>
  </div>
</body>
</html>`,
  })
}
