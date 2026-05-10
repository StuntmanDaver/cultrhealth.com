import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAdminAuth } from '@/lib/auth'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'

export const dynamic = 'force-dynamic'

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function rowsWithCount(rows: Array<Record<string, unknown>>) {
  return {
    count: rows.length,
    rows,
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sinceParam = request.nextUrl.searchParams.get('since')
    const since = sinceParam && /^\d{4}-\d{2}-\d{2}$/.test(sinceParam) ? sinceParam : null

    const [
      directRateMismatches,
      duplicateLedgerRows,
      selfReferralLedgerRows,
      overrideCapViolations,
      missingRefundReversals,
      shippedClubOrdersMissingLedger,
      attributionWithoutLedger,
    ] = await Promise.all([
      sql`
        SELECT
          oa.id,
          oa.order_id,
          oa.creator_id,
          oa.net_revenue,
          oa.direct_commission_rate,
          oa.direct_commission_amount,
          COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate}) AS expected_rate,
          ROUND((oa.net_revenue * COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate}) / 100)::numeric, 2) AS expected_amount
        FROM order_attributions oa
        JOIN creators c ON c.id = oa.creator_id
        WHERE oa.is_self_referral = FALSE
          AND oa.status != 'refunded'
          AND (${since}::date IS NULL OR oa.created_at >= ${since}::date)
          AND (
            ROUND(oa.direct_commission_rate::numeric, 2) != ROUND(COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate})::numeric, 2)
            OR ROUND(oa.direct_commission_amount::numeric, 2) != ROUND((oa.net_revenue * COALESCE(c.commission_rate, ${COMMISSION_CONFIG.directRate}) / 100)::numeric, 2)
          )
        ORDER BY oa.created_at DESC
        LIMIT 100
      `,
      sql`
        SELECT
          order_attribution_id,
          beneficiary_creator_id,
          commission_type,
          COUNT(*)::integer AS duplicate_count,
          ARRAY_AGG(id ORDER BY created_at) AS ledger_ids
        FROM commission_ledger
        WHERE status != 'reversed'
          AND (${since}::date IS NULL OR created_at >= ${since}::date)
        GROUP BY order_attribution_id, beneficiary_creator_id, commission_type
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
        LIMIT 100
      `,
      sql`
        SELECT
          oa.id,
          oa.order_id,
          oa.creator_id,
          cl.id AS ledger_id,
          cl.commission_type,
          cl.commission_amount,
          cl.status
        FROM order_attributions oa
        JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
        WHERE oa.is_self_referral = TRUE
          AND cl.status != 'reversed'
          AND (${since}::date IS NULL OR oa.created_at >= ${since}::date)
        ORDER BY oa.created_at DESC
        LIMIT 100
      `,
      sql`
        SELECT
          oa.id,
          oa.order_id,
          oa.net_revenue,
          SUM(cl.commission_amount)::numeric AS total_commission,
          ROUND((oa.net_revenue * ${COMMISSION_CONFIG.totalCapRate} / 100)::numeric, 2) AS max_bonus_window_commission
        FROM order_attributions oa
        JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
        WHERE cl.status != 'reversed'
          AND oa.is_self_referral = FALSE
          AND (${since}::date IS NULL OR oa.created_at >= ${since}::date)
        GROUP BY oa.id, oa.order_id, oa.net_revenue
        HAVING SUM(cl.commission_amount) > ROUND((oa.net_revenue * ${COMMISSION_CONFIG.totalCapRate} / 100)::numeric, 2)
        ORDER BY total_commission DESC
        LIMIT 100
      `,
      sql`
        SELECT
          oa.id,
          oa.order_id,
          oa.status AS attribution_status,
          COUNT(cl.id)::integer AS non_reversed_ledger_count
        FROM order_attributions oa
        JOIN commission_ledger cl ON cl.order_attribution_id = oa.id
        WHERE oa.status = 'refunded'
          AND cl.status != 'reversed'
          AND (${since}::date IS NULL OR oa.updated_at >= ${since}::date)
        GROUP BY oa.id, oa.order_id, oa.status
        ORDER BY oa.updated_at DESC
        LIMIT 100
      `,
      sql`
        SELECT
          co.id,
          co.order_number,
          co.member_email,
          co.status,
          oa.id AS attribution_id,
          oa.net_revenue
        FROM club_orders co
        JOIN order_attributions oa ON oa.order_id = co.id::text
        LEFT JOIN commission_ledger cl ON cl.order_attribution_id = oa.id AND cl.status != 'reversed'
        WHERE co.status IN ('shipped', 'fulfilled')
          AND oa.is_self_referral = FALSE
          AND oa.net_revenue > 0
          AND cl.id IS NULL
          AND (${since}::date IS NULL OR co.updated_at >= ${since}::date)
        ORDER BY co.updated_at DESC
        LIMIT 100
      `,
      sql`
        SELECT
          oa.id,
          oa.order_id,
          oa.creator_id,
          oa.net_revenue,
          oa.is_subscription,
          oa.subscription_payment_number
        FROM order_attributions oa
        LEFT JOIN commission_ledger cl ON cl.order_attribution_id = oa.id AND cl.status != 'reversed'
        LEFT JOIN club_orders co ON co.id::text = oa.order_id
        WHERE oa.is_self_referral = FALSE
          AND oa.status != 'refunded'
          AND oa.net_revenue > 0
          AND cl.id IS NULL
          AND (co.id IS NULL OR co.status IN ('shipped', 'fulfilled'))
          AND (${since}::date IS NULL OR oa.created_at >= ${since}::date)
        ORDER BY oa.created_at DESC
        LIMIT 100
      `,
    ])

    const checks = {
      directRateMismatches: rowsWithCount(directRateMismatches.rows),
      duplicateLedgerRows: rowsWithCount(duplicateLedgerRows.rows),
      selfReferralLedgerRows: rowsWithCount(selfReferralLedgerRows.rows),
      overrideCapViolations: rowsWithCount(overrideCapViolations.rows),
      missingRefundReversals: rowsWithCount(missingRefundReversals.rows),
      shippedClubOrdersMissingLedger: rowsWithCount(shippedClubOrdersMissingLedger.rows),
      attributionWithoutLedger: rowsWithCount(attributionWithoutLedger.rows),
    }

    const totalIssues = Object.values(checks).reduce(
      (sum, check) => sum + toNumber(check.count),
      0
    )

    return NextResponse.json({
      success: true,
      readOnly: true,
      since,
      checkedAt: new Date().toISOString(),
      totalIssues,
      checks,
    })
  } catch (error) {
    console.error('[commission-audit] Failed to run creator commission audit:', error)
    return NextResponse.json({ error: 'Failed to run commission audit' }, { status: 500 })
  }
}
