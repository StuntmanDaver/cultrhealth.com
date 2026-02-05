import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getSalesStats, getWaitlistStats, getMembershipStats } from '@/lib/db'

// Admin-only endpoint for analytics data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is an admin (using provider allowlist)
    const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
    const allowedEmails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    
    // Also check against provider list
    const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Fetch all analytics data
    const [salesStats, waitlistStats, membershipStats] = await Promise.all([
      getSalesStats(days).catch(() => ({
        totalOrders: 0,
        totalRevenue: 0,
        ordersByStatus: {},
        topProducts: [],
        recentOrders: [],
      })),
      getWaitlistStats().catch(() => ({
        total: 0,
        bySource: {},
        recent: [],
      })),
      getMembershipStats().catch(() => ({
        total: 0,
        byTier: {},
        byStatus: {},
      })),
    ])

    return NextResponse.json({
      success: true,
      data: {
        sales: salesStats,
        waitlist: waitlistStats,
        memberships: membershipStats,
        periodDays: days,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
