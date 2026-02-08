import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getOrderAttributionsByCreator } from '@/lib/creators/db'
import { redactEmail } from '@/lib/creators/attribution'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const attributions = await getOrderAttributionsByCreator(auth.creatorId, limit, offset)

    // Redact customer emails for privacy
    const redacted = attributions.map((a) => ({
      ...a,
      customer_email: a.customer_email ? redactEmail(a.customer_email) : null,
    }))

    return NextResponse.json({ orders: redacted })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        orders: [
          { id: '1', order_id: 'ord_dev_001', customer_email: 'j***@gmail.com', attribution_method: 'link_click', net_revenue: '399.00', direct_commission_amount: '39.90', status: 'approved', created_at: '2026-02-05T14:30:00Z' },
          { id: '2', order_id: 'ord_dev_002', customer_email: 's***@yahoo.com', attribution_method: 'coupon_code', net_revenue: '299.00', direct_commission_amount: '29.90', status: 'pending', created_at: '2026-02-03T09:15:00Z' },
          { id: '3', order_id: 'ord_dev_003', customer_email: 'm***@outlook.com', attribution_method: 'link_click', net_revenue: '599.00', direct_commission_amount: '59.90', status: 'paid', created_at: '2026-01-28T16:45:00Z' },
          { id: '4', order_id: 'ord_dev_004', customer_email: 'a***@gmail.com', attribution_method: 'link_click', net_revenue: '399.00', direct_commission_amount: '39.90', status: 'paid', created_at: '2026-01-22T11:00:00Z' },
          { id: '5', order_id: 'ord_dev_005', customer_email: 'r***@icloud.com', attribution_method: 'coupon_code', net_revenue: '199.00', direct_commission_amount: '19.90', status: 'paid', created_at: '2026-01-15T08:30:00Z' },
        ],
      })
    }
    console.error('Earnings orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
