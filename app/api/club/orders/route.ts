import { NextResponse } from 'next/server'
import { sql, db } from '@vercel/postgres'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { validateCouponUnified, type UnifiedCouponResult } from '@/lib/config/coupons'
import { FL_TAX_RATE, calculateTaxDollars, TAX_RATE_LABEL } from '@/lib/config/tax'
import { calculateBundleDiscount, BUNDLE_DISCOUNT_RATE } from '@/lib/config/join-therapies'
import { escapeHtml, brandedEmailHeader, brandedEmailFooter, EMAIL_FONT_IMPORT } from '@/lib/resend'
import { resolveAttribution } from '@/lib/creators/attribution'

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  note?: string
  quantity: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, phone, items, notes, couponCode, address } = body as {
      email: string
      name: string
      phone?: string
      items: OrderItem[]
      notes?: string
      couponCode?: string
      address?: { street: string; city: string; state: string; zip: string }
    }
    const requestHost = request.headers.get('host') || ''

    // Validate coupon server-side (checks both staff coupons and creator affiliate codes)
    const couponResult: UnifiedCouponResult | null = couponCode ? await validateCouponUnified(couponCode) : null
    const discountPercent = couponResult ? Math.floor(Number(couponResult.discount)) : 0

    // Validation
    if (!email?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Calculate subtotal (only items with prices)
    const rawSubtotal = items.reduce((sum, item) => {
      return item.price ? sum + item.price * item.quantity : sum
    }, 0)
    // Bundle discount: 10% off items whose bundleWith partner is in the cart
    // OWNER coupon overrides bundle discount (they don't stack)
    const bundleDiscountAmount = couponCode?.trim().toUpperCase() === 'OWNER' ? 0 : calculateBundleDiscount(items)
    const subtotalAfterBundle = rawSubtotal - bundleDiscountAmount
    // Coupon discount applied after bundle discount
    const couponDiscountAmount = discountPercent > 0 ? Math.round(subtotalAfterBundle * discountPercent) / 100 : 0
    const subtotal = subtotalAfterBundle - couponDiscountAmount
    const taxAmount = subtotal > 0 ? calculateTaxDollars(subtotal) : 0
    const total = subtotal + taxAmount

    // Generate order number
    const orderNumber = `CLB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`

    // Generate HMAC-signed approval token
    const approvalSecret = process.env.JWT_SECRET
    if (!approvalSecret) {
      console.error('[club/orders] CRITICAL: JWT_SECRET is not set')
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000 // 48 hours from now
    const approvalToken = crypto
      .createHmac('sha256', approvalSecret)
      .update(`${orderNumber}:${normalizedEmail}:${expiresAt}`)
      .digest('hex')

    // Look up or create member
    let memberId: string | null = null
    let orderId: string | null = null
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Order system temporarily unavailable. Please try again shortly.' }, { status: 503 })
    }

    // Resolve attribution before the transaction (non-DB, non-fatal)
    const appliedCouponCode = couponResult ? couponCode!.trim().toUpperCase() : null
    let attributedCreatorId: string | null = couponResult?.isCreatorCode ? couponResult.creatorId! : null
    let attributionMethod: string | null = couponResult?.isCreatorCode ? 'coupon_code' : null
    let cookieLinkId: string | undefined
    let cookieClickEventId: string | undefined
    let attributionCodeId: string | undefined = couponResult?.isCreatorCode ? couponResult.codeId : undefined
    let attributionCodeType: 'membership' | 'product' | 'general' | undefined =
      couponResult?.isCreatorCode ? couponResult.codeType : undefined
    let isSelfReferral = false

    try {
      const cookieStore = await cookies()
      const attrCookieValue = cookieStore.get('cultr_attribution')?.value
      const resolvedAttribution = await resolveAttribution({
        customerEmail: normalizedEmail,
        couponCode: couponCode?.trim(),
        attributionCookie: attrCookieValue,
      })
      if (resolvedAttribution) {
        attributedCreatorId = resolvedAttribution.creatorId
        attributionMethod = resolvedAttribution.method
        cookieLinkId = resolvedAttribution.linkId
        cookieClickEventId = resolvedAttribution.clickEventId
        attributionCodeId = resolvedAttribution.codeId
        attributionCodeType = resolvedAttribution.codeType
        isSelfReferral = resolvedAttribution.isSelfReferral
      }
    } catch {
      // Attribution resolution is non-fatal
    }

    // Wrap member upsert + order insert in a transaction to prevent partial writes
    try {
      const client = await db.connect()
      try {
        await client.query('BEGIN')

        // Get or create member
        const memberResult = await client.query(
          `INSERT INTO club_members (name, email, phone, source)
           VALUES ($1, $2, $3, 'join_landing')
           ON CONFLICT (LOWER(email))
           DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [name.trim(), normalizedEmail, phone?.trim() || null]
        )
        memberId = memberResult.rows[0]?.id
        if (!memberId) {
          throw new Error('member_upsert_missing_id')
        }

        const orderResult = await client.query(
          `INSERT INTO club_orders (order_number, member_id, member_name, member_email, member_phone, items, subtotal_usd, notes, status, approval_token, token_expires_at, coupon_code, discount_percent, tax_rate, tax_amount_usd, attributed_creator_id, attribution_method)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval', $9, to_timestamp($10::double precision / 1000), $11, $12, $13, $14, $15, $16)
           RETURNING id`,
          [
            orderNumber,
            memberId,
            name.trim(),
            normalizedEmail,
            phone?.trim() || null,
            JSON.stringify(items),
            subtotal > 0 ? subtotal : null,
            notes || null,
            approvalToken,
            expiresAt,
            appliedCouponCode,
            discountPercent > 0 ? discountPercent : null,
            FL_TAX_RATE,
            taxAmount > 0 ? taxAmount : 0,
            attributedCreatorId || null,
            attributionMethod,
          ]
        )
        orderId = orderResult.rows[0]?.id
        if (!orderId) {
          throw new Error('club_order_insert_missing_id')
        }

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    } catch (dbError) {
      console.error('[club/orders] DB error (fatal):', dbError)
      return NextResponse.json({ error: 'We could not save your order. Please retry in a moment.' }, { status: 500 })
    }

    // Process creator attribution for commission tracking (coupon OR tracking cookie)
    // This runs OUTSIDE the transaction — attribution failure must not roll back the order
    if (attributedCreatorId) {
      const attrPayload = attributionMethod === 'coupon_code'
        ? {
            creatorId: attributedCreatorId,
            method: 'coupon_code' as const,
            codeId: attributionCodeId,
            codeType: attributionCodeType,
            linkId: cookieLinkId,
            clickEventId: cookieClickEventId,
            isSelfReferral,
          }
        : {
            creatorId: attributedCreatorId,
            method: 'link_click' as const,
            linkId: cookieLinkId,
            clickEventId: cookieClickEventId,
            isSelfReferral,
          }

      if (subtotal > 0) {
        try {
          const { processOrderAttribution } = await import('@/lib/creators/commission')
          await processOrderAttribution({
            orderId,
            netRevenue: subtotal,
            customerEmail: normalizedEmail,
            attribution: attrPayload,
            isSubscription: false,
          })
        } catch (attrError) {
          console.error('[club/orders] Attribution processing failed (non-fatal):', {
            orderId,
            creatorId: attributedCreatorId,
            method: attributionMethod,
            error: attrError instanceof Error ? attrError.message : attrError,
          })
        }
      } else {
        // Quote-only cart (all items have null prices): record a zero-revenue attribution
        // placeholder so the referral is tracked. Commission is recorded on order approval
        // when the actual invoiced amount is known.
        try {
          const { recordZeroRevenueAttribution } = await import('@/lib/creators/commission')
          await recordZeroRevenueAttribution({
            orderId,
            customerEmail: normalizedEmail,
            attribution: attrPayload,
          })
        } catch (attrError) {
          console.error('[club/orders] Zero-revenue attribution failed (non-fatal):', {
            orderId,
            creatorId: attributedCreatorId,
            method: attributionMethod,
            error: attrError instanceof Error ? attrError.message : attrError,
          })
        }
      }
    }

    // Increment usage for company-owned DB codes (prelaunch codes without a creator)
    // Creator-owned codes are already incremented inside processOrderAttribution
    if (couponResult?.codeId && !couponResult.isCreatorCode) {
      try {
        const { incrementCodeUsage } = await import('@/lib/creators/db')
        await incrementCodeUsage(couponResult.codeId, subtotal > 0 ? subtotal : 0)
      } catch (err) {
        console.error('[club/orders] Code usage increment failed (non-fatal):', err)
      }
    }

    // Determine the correct site URL based on request hostname
    // This ensures approval links point to the correct domain (staging vs production)
    let siteUrl: string
    if (requestHost.includes('join.cultrhealth.com') || requestHost.includes('staging.cultrhealth.com')) {
      siteUrl = `https://${requestHost}`
    } else {
      siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cultrhealth.com'
    }
    console.log('[club/orders] Using siteUrl:', siteUrl, 'from host:', requestHost)

    // Send emails independently (not with Promise.all, so one failure doesn't block the other)
    let customerEmailSent = false
    let adminEmailSent = false

    try {
      await sendOrderConfirmationToCustomer({
        name: name.trim(),
        email: normalizedEmail,
        orderNumber,
        items,
        subtotalBeforeDiscount: rawSubtotal,
        bundleDiscountAmount,
        discountAmount: couponDiscountAmount,
        subtotal,
        taxAmount,
        total,
        couponCode: couponResult ? couponCode!.trim().toUpperCase() : undefined,
        discountPercent,
      })
      customerEmailSent = true
    } catch (err) {
      console.error('[club/orders] Customer confirmation email failed:', err)
    }

    try {
      await sendOrderApprovalRequestToAdmin({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || '',
        address,
        orderNumber,
        orderId: orderId || orderNumber,
        items,
        subtotalBeforeDiscount: rawSubtotal,
        bundleDiscountAmount,
        discountAmount: couponDiscountAmount,
        subtotal,
        taxAmount,
        total,
        couponCode: couponResult ? couponCode!.trim().toUpperCase() : undefined,
        discountPercent,
        notes: notes || '',
        approvalToken,
        expiresAt,
        siteUrl,
        referredBy: couponResult?.isCreatorCode ? couponResult.creatorName : undefined,
      })
      adminEmailSent = true
    } catch (err) {
      console.error('[club/orders] Admin approval request email failed:', err)
    }

    if (customerEmailSent && adminEmailSent) {
      console.log('[club/orders] Both emails sent successfully for', orderNumber)
    } else if (customerEmailSent || adminEmailSent) {
      console.warn('[club/orders] Partial email failure for', orderNumber, { customerEmailSent, adminEmailSent })
    } else {
      console.error('[club/orders] Both emails failed for', orderNumber)
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      customerEmailSent,
      adminEmailSent,
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
  subtotalBeforeDiscount: number
  bundleDiscountAmount: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  total: number
  couponCode?: string
  discountPercent: number
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured — customer confirmation email not sent')
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #D4DBD9;">${escapeHtml(item.name)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D4DBD9; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #D4DBD9; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : escapeHtml(item.pricingNote || 'TBD')}
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
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">${EMAIL_FONT_IMPORT}</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F0E8; color: #2A4542; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FDFBF7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(42,69,66,0.08);">
    ${brandedEmailHeader('dark')}

    <div style="padding: 32px 24px;">
      <h1 style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 22px; text-align: center; margin: 0 0 4px; color: #2A4542;">Order Received</h1>
      <p style="text-align: center; color: #7E8D8A; font-size: 13px; margin: 0 0 28px;">Order #${escapeHtml(data.orderNumber)}</p>

      <p style="margin: 0 0 16px; font-size: 15px; color: #2A4542;">Hi ${escapeHtml(data.name.split(' ')[0])},</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #546E6B; line-height: 1.6;">
        We've received your order request. Our medical team will review it and send you an invoice once approved.
      </p>

      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; border: 1px solid #D4DBD9; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #B7E4C7;">
              <th style="text-align: left; padding: 8px 0; font-weight: 600; color: #2A4542;">Therapy</th>
              <th style="text-align: center; padding: 8px 0; font-weight: 600; color: #2A4542;">Qty</th>
              <th style="text-align: right; padding: 8px 0; font-weight: 600; color: #2A4542;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${data.subtotalBeforeDiscount > 0 ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #B7E4C7;">
          ${(data.bundleDiscountAmount > 0 || data.discountAmount > 0) ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #7E8D8A; margin-bottom: 4px;">
            <span>Subtotal</span><span>$${data.subtotalBeforeDiscount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${data.bundleDiscountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #2A4542; margin-bottom: 4px;">
            <span>Bundle Discount (${Math.round(BUNDLE_DISCOUNT_RATE * 100)}%)</span><span style="color: #16a34a;">−$${data.bundleDiscountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${data.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #2A4542; margin-bottom: 4px;">
            <span>Coupon (${escapeHtml(data.couponCode)} ${data.discountPercent}% off)</span><span style="color: #16a34a;">−$${data.discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #7E8D8A; margin-bottom: 4px;">
            <span>${TAX_RATE_LABEL}</span><span>$${data.taxAmount.toFixed(2)}</span>
          </div>
          <div style="text-align: right; margin-top: 8px;">
            <span style="font-family: 'Playfair Display', Georgia, serif; font-weight: 700; font-size: 18px; color: #2A4542;">Total: $${data.total.toFixed(2)}</span>
          </div>
        </div>
        ` : ''}
      </div>

      <div style="background: #D8F3DC; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 8px;">
        <p style="margin: 0; font-weight: 600; font-size: 14px; color: #2A4542;">Status: Awaiting Review</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #3A5956;">You'll receive an email with payment details once approved.</p>
      </div>
    </div>

    ${brandedEmailFooter()}
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
  address?: { street: string; city: string; state: string; zip: string }
  orderNumber: string
  orderId: string
  items: OrderItem[]
  subtotalBeforeDiscount: number
  bundleDiscountAmount: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  total: number
  couponCode?: string
  discountPercent: number
  notes: string
  approvalToken: string
  expiresAt: number
  siteUrl: string
  referredBy?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured — admin approval request email not sent')
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.FROM_EMAIL || 'CULTR <onboarding@resend.dev>'
  const adminEmail = process.env.ADMIN_APPROVAL_EMAIL || 'admin@cultrhealth.com'

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            ${item.note ? `${escapeHtml(item.name)} &mdash; ${escapeHtml(item.note)}` : escapeHtml(item.name)}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${item.price ? `$${(item.price * item.quantity).toFixed(2)}` : escapeHtml(item.pricingNote || 'TBD')}
          </td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New Club Order — ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f9f9; color: #333; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
    <h1 style="font-size: 20px; margin-bottom: 4px;">New Club Order</h1>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Order #${escapeHtml(data.orderNumber)}</p>

    <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-weight: 600;">Customer Info</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      ${data.phone ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ''}
      ${data.address?.street ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${escapeHtml(data.address.street)}, ${escapeHtml(data.address.city)}, ${escapeHtml(data.address.state)} ${escapeHtml(data.address.zip)}</p>` : ''}
      ${data.referredBy ? `<p style="margin: 4px 0; font-size: 14px; color: #16a34a;"><strong>Referred by:</strong> ${escapeHtml(data.referredBy)} (code: ${escapeHtml(data.couponCode)})</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #eee;">
          <th style="text-align: left; padding: 8px 0;">Therapy / Dosage</th>
          <th style="text-align: center; padding: 8px 0;">Qty</th>
          <th style="text-align: right; padding: 8px 0;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${data.subtotalBeforeDiscount > 0 ? `
    <div style="margin-bottom: 24px;">
      ${(data.bundleDiscountAmount > 0 || data.discountAmount > 0) ? `
      <p style="text-align: right; color: #666; font-size: 14px; margin: 0 0 4px;">Subtotal: $${data.subtotalBeforeDiscount.toFixed(2)}</p>
      ` : ''}
      ${data.bundleDiscountAmount > 0 ? `
      <p style="text-align: right; color: #16a34a; font-size: 14px; margin: 0 0 4px;">Bundle Discount (${Math.round(BUNDLE_DISCOUNT_RATE * 100)}%): &minus;$${data.bundleDiscountAmount.toFixed(2)}</p>
      ` : ''}
      ${data.discountAmount > 0 ? `
      <p style="text-align: right; color: #16a34a; font-size: 14px; margin: 0 0 4px;">Coupon ${escapeHtml(data.couponCode)} (${data.discountPercent}% off): &minus;$${data.discountAmount.toFixed(2)}</p>
      ` : ''}
      <p style="text-align: right; color: #666; font-size: 14px; margin: 0 0 4px;">${TAX_RATE_LABEL}: $${data.taxAmount.toFixed(2)}</p>
      <p style="text-align: right; font-weight: 700; font-size: 16px; margin: 0;">Total: $${data.total.toFixed(2)}</p>
    </div>
    ` : ''}

    ${data.notes ? `
    <div style="background: #fffbe6; border-radius: 8px; padding: 12px; margin-bottom: 24px; font-size: 14px;">
      <strong>Customer Notes:</strong><br/>${escapeHtml(data.notes)}
    </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.siteUrl}/api/admin/club-orders/${data.orderId}/approve?token=${data.approvalToken}&expires=${data.expiresAt}" style="display: inline-block; background: #2A4542; color: white; padding: 14px 40px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Approve This Order
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee;">
      If you prefer, you can also <a href="${data.siteUrl}/admin/club-orders" style="color: #2A4542; text-decoration: underline;">view all orders in the admin panel</a> to process manually.
    </p>
  </div>
</body>
</html>`,
  })
}
