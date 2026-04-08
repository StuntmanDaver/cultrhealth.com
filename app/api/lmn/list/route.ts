import { NextRequest, NextResponse } from 'next/server'
import { getLmnsByCustomerEmail } from '@/lib/lmn'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lmn/list
 * List all LMNs for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get LMNs for this user
    const records = await getLmnsByCustomerEmail(auth.email)

    // Transform to safe response format
    const lmns = records.map(record => ({
      lmnNumber: record.lmn_number,
      orderNumber: record.order_number,
      issueDate: new Date(record.issue_date).toISOString(),
      eligibleTotal: Number(record.eligible_total),
      currency: record.currency,
      itemCount: Array.isArray(record.items) ? record.items.length : 0,
    }))

    return NextResponse.json({
      success: true,
      lmns,
      count: lmns.length,
    })
  } catch (error) {
    console.error('LMN list error:', error)
    return NextResponse.json(
      { error: 'Failed to list LMNs' },
      { status: 500 }
    )
  }
}
