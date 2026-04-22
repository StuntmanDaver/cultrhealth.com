import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'
import { TAX_RATE_LABEL } from '@/lib/config/tax'
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } from '@/lib/resend'
import { getAccessToken, findOrCreateCustomer, createInvoice, sendInvoice, getInvoiceLink } from '@/lib/quickbooks'

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
      // Validate HMAC token against stored approval_token AND enforce expiry at DB level.
      // token_expires_at is NULL for legacy rows — treated as always-valid to avoid breaking
      // in-flight approvals during the migration window.
      if (process.env.POSTGRES_URL) {
        const tokenCheck = await sql`
          SELECT id FROM club_orders
          WHERE id = ${orderId}::uuid
            AND approval_token = ${tokenFromUrl}
            AND (token_expires_at IS NULL OR token_expires_at > NOW())
        `
        if (tokenCheck.rows.length > 0) {
          isAuthorized = true
        } else {
          // Distinguish expired vs wrong token to give admins a useful error message
          const tokenExists = await sql`
            SELECT id FROM club_orders WHERE id = ${orderId}::uuid AND approval_token = ${tokenFromUrl}
          `
          if (tokenExists.rows.length > 0) {
            return NextResponse.json({ error: 'Approval link has expired. Please re-submit the order to generate a new link.' }, { status: 410 })
          }
        }
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
      SELECT id, order_number, member_name, member_email, member_phone, items, subtotal_usd, status, coupon_code, discount_percent, tax_rate, tax_amount_usd, attributed_creator_id, attribution_method
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
        return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&approved=${order.order_number}&already=true`)
      }
      return NextResponse.json({
        error: `Order is already ${order.status}`,
        status: order.status,
      }, { status: 400 })
    }

    // Send approval emails to customer and admin
    const taxAmountUsd = order.tax_amount_usd ? Number(order.tax_amount_usd) : 0
    const subtotal = order.subtotal_usd ? Number(order.subtotal_usd) : 0
    const discountPercent = order.discount_percent ? Number(order.discount_percent) : 0
    const couponCode = order.coupon_code || undefined

    // Back-calculate pre-discount subtotal so confirmation email shows the discount breakdown
    let subtotalBeforeDiscount = subtotal
    let couponDiscountAmount = 0
    if (discountPercent > 0 && subtotal > 0) {
      subtotalBeforeDiscount = Math.round((subtotal / (1 - discountPercent / 100)) * 100) / 100
      couponDiscountAmount = Math.round((subtotalBeforeDiscount - subtotal) * 100) / 100
    }

    // H-3: Validate order.items before proceeding
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return NextResponse.json({ error: 'Order has no valid items.' }, { status: 422 })
    }

    const emailData = {
      name: order.member_name,
      email: order.member_email,
      orderNumber: order.order_number,
      items: order.items as OrderItem[],
      subtotal,
      subtotalBeforeDiscount,
      couponDiscountAmount,
      couponCode,
      discountPercent,
      taxAmount: taxAmountUsd,
      total: subtotal + taxAmountUsd,
    }

    // Attempt QuickBooks invoice creation → sets status to invoice_sent when successful
    let finalStatus = 'approved'
    let qbInvoiceId: string | null = null
    let qbInvoiceUrl: string | null = null
    let invoicedTotal: number | null = null

    try {
      const accessToken = await getAccessToken()
      if (accessToken) {
        const customerId = await findOrCreateCustomer(accessToken, order.member_name, order.member_email)
        if (customerId) {
          const invoiceResult = await createInvoice(
            accessToken,
            customerId,
            order.items as OrderItem[],
            order.order_number,
            discountPercent,
            couponCode,
          )
          if (invoiceResult) {
            qbInvoiceId = invoiceResult.invoiceId
            invoicedTotal = invoiceResult.total

            const sendResult = await sendInvoice(accessToken, invoiceResult.invoiceId, order.member_email)
            qbInvoiceUrl = sendResult?.payNowLink || invoiceResult.invoiceLink || null

            if (!qbInvoiceUrl) {
              const linkResult = await getInvoiceLink(accessToken, invoiceResult.invoiceId)
              if (linkResult) qbInvoiceUrl = linkResult
            }

            finalStatus = 'invoice_sent'
            console.log('[club-orders/approve] QB invoice created and sent:', qbInvoiceId, '| total:', invoicedTotal)
          }
        }
      }
    } catch (qbError) {
      console.error('[club-orders/approve] QB invoice creation failed (non-fatal), falling back to approved:', qbError)
    }

    // If QB invoice provided a total and the order had no subtotal, use it
    // so commission calculation can use the actual invoiced amount.
    const effectiveSubtotal = subtotal > 0 ? subtotal : (invoicedTotal && invoicedTotal > 0 ? invoicedTotal : 0)
    const subtotalUpdated = effectiveSubtotal > 0 && subtotal === 0

    // HIGH-1: Atomic status transition — include AND status = 'pending_approval' so a
    // concurrent request that already approved the order results in 0 rows updated.
    const updateResult = await sql`
      UPDATE club_orders
      SET
        status = ${finalStatus},
        approved_at = NOW(),
        approved_by = ${session?.email || 'email_link'},
        invoice_sent_at = CASE WHEN ${finalStatus === 'invoice_sent'}::boolean THEN NOW() ELSE NULL END,
        qb_invoice_id = ${qbInvoiceId},
        qb_invoice_url = ${qbInvoiceUrl},
        subtotal_usd = COALESCE(subtotal_usd, ${subtotalUpdated ? effectiveSubtotal : null}),
        updated_at = NOW()
      WHERE id = ${orderId}::uuid AND status = 'pending_approval'
    `

    if (updateResult.rowCount === 0) {
      // Another concurrent request already approved this order — treat as already-approved
      if (tokenFromUrl) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
        return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&approved=${order.order_number}&already=true`)
      }
      return NextResponse.json({
        error: `Order is already ${order.status}`,
        status: order.status,
      }, { status: 400 })
    }

    // Retroactively map coupon to creator if the code was reassigned after the order was placed
    // (e.g. an internal promo code was transferred to an active affiliate)
    let finalAttributedCreatorId = order.attributed_creator_id
    let finalAttributionMethod = order.attribution_method

    if (!finalAttributedCreatorId && order.coupon_code) {
      try {
        const { validateCouponUnified } = await import('@/lib/config/coupons')
        const couponResult = await validateCouponUnified(order.coupon_code)
        
        if (couponResult?.isCreatorCode && couponResult.creatorId) {
          finalAttributedCreatorId = couponResult.creatorId
          finalAttributionMethod = 'coupon_code'
          
          // Update the order row so the attribution is persisted
          await sql`
            UPDATE club_orders 
            SET attributed_creator_id = ${finalAttributedCreatorId}, attribution_method = ${finalAttributionMethod} 
            WHERE id = ${orderId}::uuid
          `
          
          // Ensure an order_attributions row exists with zero-revenue placeholder so the subsequent block handles it properly
          const { recordZeroRevenueAttribution } = await import('@/lib/creators/commission')
          await recordZeroRevenueAttribution({
            orderId: order.id,
            customerEmail: order.member_email,
            attribution: {
              creatorId: finalAttributedCreatorId,
              method: 'coupon_code',
              codeId: couponResult.codeId,
              codeType: couponResult.codeType,
              isSelfReferral: false
            }
          })
          console.log(`[club-orders/approve] Retroactively mapped coupon ${order.coupon_code} to creator ${finalAttributedCreatorId}`)
        }
      } catch (attrError) {
        console.error('[club-orders/approve] Failed to retroactively map creator attribution (non-fatal):', attrError)
      }
    }

    // Record commission on approval for attributed orders where subtotal is known.
    // This updates the zero-revenue placeholder created at order time and inserts
    // commission_ledger entries (direct + override) with the actual invoiced amount.
    if (finalAttributedCreatorId && effectiveSubtotal > 0) {
      try {
        const { getCreatorById } = await import('@/lib/creators/db')
        const { COMMISSION_CONFIG } = await import('@/lib/config/affiliate')
        const { calculateOverrideCommission, insertCommissionLedgerEntries } = await import('@/lib/creators/commission')
        const { db: pgDb } = await import('@vercel/postgres')

        const creator = await getCreatorById(finalAttributedCreatorId)
        const directRate = creator?.commission_rate != null ? Number(creator.commission_rate) : COMMISSION_CONFIG.directRate
        const directAmount = Math.round((effectiveSubtotal * directRate) / 100 * 100) / 100

        // Calculate override commission for the recruiter (if any)
        const override = await calculateOverrideCommission(finalAttributedCreatorId, effectiveSubtotal, directAmount)

        const pgClient = await pgDb.connect()
        try {
          await pgClient.query('BEGIN')

          // Only update attribution entries that are still at zero-revenue (placeholder state).
          // Priced orders already have a full attribution + commission entry from order time.
          const attrUpdate = await pgClient.query(
            `UPDATE order_attributions
             SET net_revenue = $1, direct_commission_rate = $2, direct_commission_amount = $3, customer_email = $4, updated_at = NOW()
             WHERE order_id = $5 AND net_revenue = 0
             RETURNING id`,
            [effectiveSubtotal, directRate, directAmount, order.member_email, order.id]
          )

          if (attrUpdate.rows[0]) {
            const attributionId = attrUpdate.rows[0].id as string

            // Insert direct + override commissions using shared helper
            const result = await insertCommissionLedgerEntries(
              pgClient, attributionId, finalAttributedCreatorId,
              effectiveSubtotal, directRate, directAmount, override
            )

            if (order.coupon_code && finalAttributionMethod === 'coupon_code') {
              await pgClient.query(
                `UPDATE affiliate_codes SET total_revenue = total_revenue + $1, updated_at = NOW()
                 WHERE UPPER(code) = UPPER($2)`,
                [effectiveSubtotal, order.coupon_code]
              )
            }
            console.log(`[club-orders/approve] Commission recorded: creator=${finalAttributedCreatorId} direct=$${result.directCommission} override=$${result.overrideCommission} for order ${order.order_number}`)
          } else {
            // No placeholder row found — either recordZeroRevenueAttribution failed silently
            // during the retroactive attribution path, or no attribution was recorded at order time.
            // Check if an attribution row already exists with real revenue (meaning commission
            // was already recorded at order time and no duplicate should be inserted).
            const existingAttr = await pgClient.query(
              `SELECT id FROM order_attributions WHERE order_id = $1`,
              [order.id]
            )

            if (!existingAttr.rows[0]) {
              // No row at all — insert one now and record commission (fallback path)
              let codeId: string | null = null
              let discountRateSnapshot: number | null = null
              if (order.coupon_code && finalAttributionMethod === 'coupon_code') {
                const codeRow = await pgClient.query(
                  `SELECT id, discount_value FROM affiliate_codes WHERE UPPER(code) = UPPER($1) AND creator_id = $2 LIMIT 1`,
                  [order.coupon_code, finalAttributedCreatorId]
                )
                codeId = (codeRow.rows[0]?.id as string) || null
                const rawDisc = codeRow.rows[0]?.discount_value
                if (rawDisc != null) discountRateSnapshot = Number(rawDisc)
              }

              const insertAttr = await pgClient.query(
                `INSERT INTO order_attributions (
                  order_id, creator_id, attribution_method, code_id, customer_email,
                  net_revenue, direct_commission_rate, direct_commission_amount, is_self_referral, is_subscription, discount_rate
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false,$9)
                ON CONFLICT (order_id) DO NOTHING
                RETURNING id`,
                [order.id, finalAttributedCreatorId, finalAttributionMethod || 'coupon_code', codeId, order.member_email, effectiveSubtotal, directRate, directAmount, discountRateSnapshot]
              )

              if (insertAttr.rows[0]) {
                const attributionId = insertAttr.rows[0].id as string
                const result = await insertCommissionLedgerEntries(
                  pgClient, attributionId, finalAttributedCreatorId,
                  effectiveSubtotal, directRate, directAmount, override
                )
                if (order.coupon_code && finalAttributionMethod === 'coupon_code') {
                  await pgClient.query(
                    `UPDATE affiliate_codes SET total_revenue = total_revenue + $1, updated_at = NOW()
                     WHERE UPPER(code) = UPPER($2)`,
                    [effectiveSubtotal, order.coupon_code]
                  )
                }
                console.log(`[club-orders/approve] Commission recorded (fallback path): creator=${finalAttributedCreatorId} direct=$${result.directCommission} override=$${result.overrideCommission} for order ${order.order_number}`)
              }
            }
            // else: attribution row exists with net_revenue > 0 — commission already recorded at order time, skip
          }

          await pgClient.query('COMMIT')
        } catch (err) {
          await pgClient.query('ROLLBACK')
          throw err
        } finally {
          pgClient.release()
        }
      } catch (commErr) {
        console.error('[club-orders/approve] Commission recording failed (non-fatal):', commErr)
      }
    }

    // H-1: Send emails AFTER DB update is committed so email failures cannot leave
    // the order in an approved state without the customer being notified — the approval
    // is already persisted; email errors are non-fatal.
    try {
      await Promise.all([
        sendApprovalEmailToCustomer(emailData),
        sendApprovalConfirmationToAdmin(emailData),
      ])
      console.log('[club-orders/approve] Approval emails sent for', order.order_number)
    } catch {
      // non-fatal — approval already committed
    }

    // If called from email link, redirect
    if (tokenFromUrl) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
      return NextResponse.redirect(`${siteUrl}/admin/orders?tab=club-orders&approved=${order.order_number}`)
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
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

async function sendApprovalConfirmationToAdmin(data: {
  name: string
  email: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  subtotalBeforeDiscount: number
  couponDiscountAmount: number
  couponCode?: string
  discountPercent: number
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
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.note ? `${escapeHtml(item.name)} &mdash; ${escapeHtml(item.note)}` : escapeHtml(item.name)}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : escapeHtml(item.pricingNote || 'TBD')}
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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">

    <div style="background: #e8f5e9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #2A4542;">
      <strong>Order approved.</strong> Confirmation email has been sent to <strong>${escapeHtml(data.email)}</strong>.
    </div>

    <h2 style="font-size: 18px; margin-bottom: 4px;">Order #${escapeHtml(data.orderNumber)}</h2>
    <p style="color: #3A5956; font-size: 14px; margin-bottom: 24px;">
      <strong>Customer:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;
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
      ${data.couponDiscountAmount > 0 ? `
      <p style="text-align: right; color: #3A5956; font-size: 14px; margin: 0 0 4px;">Subtotal: $${data.subtotalBeforeDiscount.toFixed(2)}</p>
      <p style="text-align: right; color: #16a34a; font-size: 14px; margin: 0 0 4px;">Coupon ${escapeHtml(data.couponCode)} (${data.discountPercent}% off): &minus;$${data.couponDiscountAmount.toFixed(2)}</p>
      ` : ''}
      ${data.taxAmount > 0 ? `
      ${data.couponDiscountAmount === 0 ? `<p style="text-align: right; color: #3A5956; font-size: 14px; margin: 0 0 4px;">Subtotal: $${data.subtotal.toFixed(2)}</p>` : ''}
      <p style="text-align: right; color: #3A5956; font-size: 14px; margin: 0 0 4px;">${TAX_RATE_LABEL}: $${data.taxAmount.toFixed(2)}</p>
      ` : ''}
      <p style="text-align: right; font-weight: 700; font-size: 15px; margin: 0;">
        Total: $${data.total.toFixed(2)}
      </p>
    </div>
    ` : ''}

    <p style="color: #3A5956; font-size: 14px; margin-top: 24px;">
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
  subtotalBeforeDiscount: number
  couponDiscountAmount: number
  couponCode?: string
  discountPercent: number
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
          <td style="padding: 8px 0; border-bottom: 1px solid #D4DBD9;">${item.note ? `${escapeHtml(item.name)} &mdash; ${escapeHtml(item.note)}` : escapeHtml(item.name)}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #D4DBD9; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #D4DBD9; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : escapeHtml(item.pricingNote || 'TBD')}
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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}
    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 4px; color: #2A4542;">Order Confirmed!</h1>
      <p style="text-align: center; color: #7E8D8A; font-size: 13px; margin: 0 0 28px;">Order #${escapeHtml(data.orderNumber)}</p>

      <p style="margin: 0 0 16px; font-size: 15px;">Hi ${escapeHtml(data.name.split(' ')[0])},</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        Great news — your order has been reviewed and confirmed by our medical team.
      </p>

      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; border: 1px solid #D4DBD9; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #B7E4C7;">
              <th style="text-align: left; padding: 8px 0; font-weight: 600; color: #2A4542;">Therapy / Dosage</th>
              <th style="text-align: center; padding: 8px 0; font-weight: 600; color: #2A4542;">Qty</th>
              <th style="text-align: right; padding: 8px 0; font-weight: 600; color: #2A4542;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${data.subtotal > 0 ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #B7E4C7;">
          ${data.couponDiscountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #7E8D8A; margin-bottom: 4px;">
            <span>Subtotal</span><span>$${data.subtotalBeforeDiscount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #2A4542; margin-bottom: 4px;">
            <span>Coupon (${escapeHtml(data.couponCode)} ${data.discountPercent}% off)</span><span style="color: #16a34a;">&minus;$${data.couponDiscountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${data.taxAmount > 0 ? `
          ${data.couponDiscountAmount === 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #7E8D8A; margin-bottom: 4px;">
            <span>Subtotal</span><span>$${data.subtotal.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #7E8D8A; margin-bottom: 4px;">
            <span>${TAX_RATE_LABEL}</span><span>$${data.taxAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="text-align: right; margin-top: 8px;">
            <span style="font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 18px; color: #2A4542;">Total: $${data.total.toFixed(2)}</span>
          </div>
        </div>
        ` : ''}
      </div>

      <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #2A4542;">Status: Confirmed by Medical Team</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #3A5956;">Your order is approved and ready for payment processing.</p>
      </div>

      <div style="background: #F5F0E8; border-radius: 12px; padding: 20px; margin-bottom: 8px; border-left: 4px solid #B7E4C7;">
        <p style="margin: 0 0 12px; font-weight: 600; font-size: 14px; color: #2A4542;">Next Step: Payment</p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #546E6B; line-height: 1.5;">
          Our team will send you a payment link within 1-2 business days. You can reference your order number below when following up.
        </p>
        <p style="margin: 0; font-size: 13px; color: #7E8D8A;">
          <strong>Your Order Number:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: 600; color: #2A4542;">${escapeHtml(data.orderNumber)}</code>
        </p>
      </div>
    </div>
    ${brandedEmailFooter()}
  </div>
</body>
</html>`,
  })
}
