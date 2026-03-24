import { NextRequest, NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getSalesStats, getWaitlistStats, getMembershipStats, getCouponStats, getCreatorCommissionStats, getQrScanStats, getPrelaunchStats, getAllCreatorsForAdmin, getAllTrackingLinksForAdmin, getAllAffiliateCodesForAdmin, getAllCustomersForAdmin, getAdminDashboardCounts, getInvoiceAging, getRefundStats, getRevenueByTier, getBnplAdoption, getCreatorROI, getIntakeFunnel, getRevenueTimeSeries } from '@/lib/db'

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
    const [salesStats, waitlistStats, membershipStats, couponStats, creatorStats, qrScanStats, prelaunchStats, allCreators, allTrackingLinks, allCouponCodes, allCustomers, dashboardCounts, invoiceAging, refundStats, revenueByTier, bnplAdoption, creatorROI, intakeFunnel, revenueTimeSeries] = await Promise.all([
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
      getCouponStats(days).catch(() => ({
        coupons: [],
        totalCouponOrders: 0,
        totalCouponRevenue: 0,
        totalDiscountGiven: 0,
      })),
      getCreatorCommissionStats(days).catch(() => ({
        activeCreatorsWithCommissions: 0,
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalLifetime: 0,
        creatorsByStatus: {},
      })),
      getQrScanStats(days).catch(() => ({
        totalScans: 0,
        uniqueVisitors: 0,
        byDestination: {},
        bySource: {},
        byDevice: {},
        byOs: {},
        byBrowser: {},
        byCity: [],
        scansByDay: [],
        recentScans: [],
      })),
      getPrelaunchStats().catch(() => ({
        totalCodes: 0,
        activeCodes: 0,
        expiredCodes: 0,
        totalRedemptions: 0,
        totalRevenue: 0,
        totalDiscountGiven: 0,
      })),
      getAllCreatorsForAdmin().catch(() => []),
      getAllTrackingLinksForAdmin().catch(() => []),
      getAllAffiliateCodesForAdmin().catch(() => []),
      getAllCustomersForAdmin().catch(() => []),
      getAdminDashboardCounts().catch(() => ({ totalCustomers: 0, pendingInvoices: 0 })),
      getInvoiceAging().catch(() => []),
      getRefundStats(days).catch(() => ({ refunded: 0, total: 0, refundedAmount: 0, totalAmount: 0, refundRate: 0 })),
      getRevenueByTier(days).catch(() => []),
      getBnplAdoption(days).catch(() => ({})),
      getCreatorROI().catch(() => []),
      getIntakeFunnel(days).catch(() => ({ totalStarted: 0, completed: 0, pending: 0, completionRate: 0 })),
      getRevenueTimeSeries(days).catch(() => []),
    ])

    return NextResponse.json({
      success: true,
      data: {
        sales: salesStats,
        waitlist: waitlistStats,
        memberships: membershipStats,
        coupons: couponStats,
        creators: creatorStats,
        qrScans: qrScanStats,
        prelaunch: prelaunchStats,
        allCreators,
        allTrackingLinks,
        allCouponCodes,
        allCustomers,
        dashboardCounts,
        invoiceAging,
        refundStats,
        revenueByTier,
        bnplAdoption,
        creatorROI,
        intakeFunnel,
        revenueTimeSeries,
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
