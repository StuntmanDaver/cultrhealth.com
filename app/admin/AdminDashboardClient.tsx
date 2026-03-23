'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PrelaunchCodesSection from '@/components/admin/PrelaunchCodesSection'
import { getTierName } from '@/lib/config/affiliate'

interface SalesStats {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: Record<string, number>
  topProducts: { sku: string; name: string; quantity: number; revenue: number }[]
  recentOrders: {
    id: string
    order_number: string
    customer_email: string
    status: string
    total_amount: number
    created_at: string
    items: { sku: string; name: string; quantity: number; unit_price: number }[]
  }[]
}

interface WaitlistStats {
  total: number
  bySource: Record<string, number>
  recent: {
    id: string
    name: string
    email: string
    created_at: string
    source?: string
  }[]
}

interface MembershipStats {
  total: number
  byTier: Record<string, number>
  byStatus: Record<string, number>
}

interface CouponStatRow {
  coupon_code: string
  discount_percent: number
  usage_count: number
  total_revenue: number
  total_discount: number
  avg_order_value: number
  creator_name: string | null
  attributed_creator_id: string | null
  program_type: string | null
}

interface PrelaunchStats {
  totalCodes: number
  activeCodes: number
  expiredCodes: number
  totalRedemptions: number
  totalRevenue: number
  totalDiscountGiven: number
}

interface CouponStats {
  coupons: CouponStatRow[]
  totalCouponOrders: number
  totalCouponRevenue: number
  totalDiscountGiven: number
}

interface CreatorStats {
  activeCreatorsWithCommissions: number
  totalPending: number
  totalApproved: number
  totalPaid: number
  totalLifetime: number
  creatorsByStatus: Record<string, number>
}

interface QrScanStats {
  totalScans: number
  uniqueVisitors: number
  byDestination: Record<string, number>
  bySource: Record<string, number>
  byDevice: Record<string, number>
  byOs: Record<string, number>
  byBrowser: Record<string, number>
  byCity: { city: string; region: string; country: string; count: number }[]
  scansByDay: { date: string; count: number }[]
  recentScans: {
    scan_id: string
    source: string
    destination: string
    device_type: string
    os: string
    browser: string
    city: string | null
    region: string | null
    country: string | null
    created_at: string
  }[]
}

interface CreatorAdminRow {
  id: string
  email: string
  full_name: string
  status: string
  tier: number
  commission_rate: number
  override_rate: number
  recruit_count: number
  payout_method: string | null
  created_at: string
  code_count: number
  total_code_revenue: number
}

interface TrackingLinkAdminRow {
  id: string
  slug: string
  destination_path: string
  click_count: number
  conversion_count: number
  active: boolean
  created_at: string
  creator_name: string | null
  creator_status: string | null
}

interface AffiliateCodeAdminRow {
  id: string
  creator_id: string | null
  code: string
  code_type: string
  discount_type: string
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  expires_at: string | null
  program_type: string
  stripe_promotion_code_id: string | null
  created_at: string
  creator_name: string | null
}

interface CustomerAdminRow {
  id: string
  name: string
  email: string
  phone: string | null
  address_city: string | null
  address_state: string | null
  signup_type: string | null
  source: string | null
  created_at: string
  order_count: number
  total_spent: number
}

interface DashboardCounts {
  totalCustomers: number
  pendingInvoices: number
}

interface InvoiceAgingRow {
  id: string
  order_number: string
  member_name: string
  member_email: string
  subtotal_usd: number | null
  created_at: string
  days_pending: number
}

interface RefundStats {
  refunded: number
  total: number
  refundedAmount: number
  totalAmount: number
  refundRate: number
}

interface RevenueByTierRow {
  tier: string
  orders: number
  revenue: number
}

interface CreatorROIRow {
  id: string
  fullName: string
  totalDiscountGiven: number
  totalCommissionEarned: number
}

interface IntakeFunnel {
  totalStarted: number
  completed: number
  pending: number
  completionRate: number
}

interface AnalyticsData {
  sales: SalesStats
  waitlist: WaitlistStats
  memberships: MembershipStats
  coupons: CouponStats
  creators: CreatorStats
  qrScans: QrScanStats
  prelaunch: PrelaunchStats
  allCreators: CreatorAdminRow[]
  allTrackingLinks: TrackingLinkAdminRow[]
  allCouponCodes: AffiliateCodeAdminRow[]
  allCustomers: CustomerAdminRow[]
  dashboardCounts: DashboardCounts
  invoiceAging: InvoiceAgingRow[]
  refundStats: RefundStats
  revenueByTier: RevenueByTierRow[]
  bnplAdoption: Record<string, number>
  creatorROI: CreatorROIRow[]
  intakeFunnel: IntakeFunnel
  periodDays: number
  generatedAt: string
}

const INTERNAL_COUPON_LABELS: Record<string, string> = {
  'OWNER': 'Owner',
  'CULTRSTAFF': 'Staff',
  'CULTRFAM': 'Family',
  'CULTR10': 'Promo',
  'SUMMER20': 'Promo',
  'MARY20': 'Promo',
}

export default function AdminDashboardClient({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodDays, setPeriodDays] = useState(30)
  const [creatorSearch, setCreatorSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [periodDays])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/analytics?days=${periodDays}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }
      
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'fulfilled':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'trialing':
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'canceled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen grad-page p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-brand-primary/10 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-brand-primary/10 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-brand-primary/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grad-page p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-brand-primary mb-2">
              Admin Dashboard
            </h1>
            <p className="text-brand-primary/60">
              Logged in as {userEmail}
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
              className="px-4 py-2 border border-brand-primary/20 rounded-lg grad-white text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(data.sales.totalRevenue)}
                subtitle={`${data.sales.totalOrders} orders`}
                icon="💰"
              />
              <MetricCard
                title="Active Members"
                value={data.memberships.total.toString()}
                subtitle={Object.entries(data.memberships.byTier).map(([tier, count]) => `${tier}: ${count}`).join(', ') || 'No members yet'}
                icon="👥"
              />
              <MetricCard
                title="Waitlist"
                value={data.waitlist.total.toString()}
                subtitle="Total signups"
                icon="📋"
              />
              <MetricCard
                title="Period"
                value={`${periodDays} days`}
                subtitle={`Updated ${formatDate(data.generatedAt)}`}
                icon="📅"
              />
              <MetricCard
                title="Total Customers"
                value={data.dashboardCounts.totalCustomers.toString()}
                subtitle="Club members"
                icon="🧑‍🤝‍🧑"
              />
              <MetricCard
                title="Pending Invoices"
                value={data.dashboardCounts.pendingInvoices.toString()}
                subtitle="Awaiting approval"
                icon="📄"
              />
              <MetricCard
                title="Active Creators"
                value={(data.creators.creatorsByStatus['active'] || 0).toString()}
                subtitle={`${Object.values(data.creators.creatorsByStatus).reduce((a, b) => a + b, 0)} total`}
                icon="🎯"
              />
            </div>

            {/* Operational Health */}
            {(data.intakeFunnel.totalStarted > 0 || data.refundStats.total > 0 || Object.keys(data.bnplAdoption).length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {data.intakeFunnel.totalStarted > 0 && (
                  <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                    <h3 className="font-display text-sm text-brand-primary/60 mb-2">Intake Completion</h3>
                    <p className={`text-3xl font-bold ${data.intakeFunnel.completionRate >= 70 ? 'text-green-600' : data.intakeFunnel.completionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {data.intakeFunnel.completionRate}%
                    </p>
                    <p className="text-sm text-brand-primary/60 mt-1">{data.intakeFunnel.completed} of {data.intakeFunnel.totalStarted} completed</p>
                  </div>
                )}
                {data.refundStats.total > 0 && (
                  <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                    <h3 className="font-display text-sm text-brand-primary/60 mb-2">Refund Rate</h3>
                    <p className={`text-3xl font-bold ${data.refundStats.refundRate <= 2 ? 'text-green-600' : data.refundStats.refundRate <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {data.refundStats.refundRate}%
                    </p>
                    <p className="text-sm text-brand-primary/60 mt-1">{data.refundStats.refunded} of {data.refundStats.total} orders ({formatCurrency(data.refundStats.refundedAmount)})</p>
                  </div>
                )}
                {Object.keys(data.bnplAdoption).length > 0 && (
                  <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                    <h3 className="font-display text-sm text-brand-primary/60 mb-2">Payment Methods</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(data.bnplAdoption).map(([provider, count]) => {
                        const total = Object.values(data.bnplAdoption).reduce((s, c) => s + c, 0)
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <span key={provider} className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">
                            {provider}: {pct}% ({count})
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Aging */}
            {data.invoiceAging.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-2">Invoice Aging</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-yellow-50 rounded-full text-sm text-yellow-700">{data.invoiceAging.length} pending</span>
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Oldest: {Math.max(...data.invoiceAging.map(i => i.days_pending))} days</span>
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Avg: {Math.round(data.invoiceAging.reduce((s, i) => s + i.days_pending, 0) / data.invoiceAging.length)} days</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Order #</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Customer</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Amount</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Days Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoiceAging.map((inv, i) => (
                        <tr key={inv.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-sm font-mono text-brand-primary">{inv.order_number}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary">{inv.member_name} <span className="text-brand-primary/40">{inv.member_email}</span></td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{inv.subtotal_usd ? formatCurrency(Number(inv.subtotal_usd)) : 'TBD'}</td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.days_pending <= 3 ? 'bg-green-100 text-green-800' : inv.days_pending <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {inv.days_pending}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="p-6 bg-brand-primary/5 rounded-xl mb-8">
              <h2 className="font-display text-xl text-brand-primary mb-4">Quick Links</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin/intakes"
                  className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Intake Submissions
                </Link>
                <Link
                  href="/admin/club-orders"
                  className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Club Orders
                </Link>
                <Link
                  href="/provider/protocol-builder"
                  className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Protocol Builder
                </Link>
                <a
                  href="https://prod-api.asherweightloss.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 grad-white text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  Asher Med Portal →
                </a>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 grad-white text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  Stripe Dashboard →
                </a>
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 grad-white text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  Google Analytics →
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 grad-white text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  Search Console →
                </a>
              </div>
            </div>

            {/* Sales by Status */}
            {Object.keys(data.sales.ordersByStatus).length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Orders by Status</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.sales.ordersByStatus).map(([status, count]) => (
                    <span
                      key={status}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                    >
                      {status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            {data.sales.topProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Top Products</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Product</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">SKU</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Qty Sold</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.topProducts.map((product, index) => (
                        <tr key={product.sku} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-brand-primary">{product.name}</td>
                          <td className="py-3 px-4 text-brand-primary/60 font-mono text-sm">{product.sku}</td>
                          <td className="py-3 px-4 text-brand-primary text-right">{product.quantity}</td>
                          <td className="py-3 px-4 text-brand-primary text-right font-medium">
                            {formatCurrency(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Membership Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* By Tier */}
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <h2 className="font-display text-xl text-brand-primary mb-4">Members by Tier</h2>
                {Object.keys(data.memberships.byTier).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.memberships.byTier).map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between">
                        <span className="text-brand-primary capitalize">{tier}</span>
                        <span className="font-medium text-brand-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-brand-primary/60">No membership data yet</p>
                )}
              </div>

              {/* By Status */}
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <h2 className="font-display text-xl text-brand-primary mb-4">Members by Status</h2>
                {Object.keys(data.memberships.byStatus).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.memberships.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="font-medium text-brand-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-brand-primary/60">No membership data yet</p>
                )}
              </div>
            </div>

            {/* Coupon Performance */}
            {data.coupons && data.coupons.coupons.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Coupon Performance</h2>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary">
                    Orders with coupons: {data.coupons.totalCouponOrders}
                  </span>
                  <span className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary">
                    Revenue: {formatCurrency(data.coupons.totalCouponRevenue)}
                  </span>
                  <span className="px-4 py-2 bg-red-50 rounded-full text-sm font-medium text-red-700">
                    Discounts given: {formatCurrency(data.coupons.totalDiscountGiven)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Code</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Type</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Discount</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Uses</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Revenue</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Discount Given</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.coupons.coupons.map((coupon, index) => {
                        const internalLabel = INTERNAL_COUPON_LABELS[coupon.coupon_code]
                        const isCreator = !!coupon.attributed_creator_id
                        const isPrelaunch = coupon.program_type === 'prelaunch'
                        const typeLabel = isPrelaunch
                          ? 'Prelaunch'
                          : isCreator
                            ? `Creator (${coupon.creator_name || 'Unknown'})`
                            : internalLabel || 'Promo'
                        const typeBg = isPrelaunch
                          ? 'bg-blue-100 text-blue-800'
                          : isCreator
                            ? 'bg-purple-100 text-purple-800'
                            : internalLabel === 'Owner' || internalLabel === 'Staff' || internalLabel === 'Family'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        return (
                          <tr key={`${coupon.coupon_code}-${index}`} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                            <td className="py-3 px-4 text-brand-primary font-mono text-sm font-medium">
                              {coupon.coupon_code}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeBg}`}>
                                {typeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-brand-primary text-right">{coupon.discount_percent}%</td>
                            <td className="py-3 px-4 text-brand-primary text-right font-medium">{coupon.usage_count}</td>
                            <td className="py-3 px-4 text-brand-primary text-right">{formatCurrency(coupon.total_revenue)}</td>
                            <td className="py-3 px-4 text-red-600 text-right">{formatCurrency(coupon.total_discount)}</td>
                            <td className="py-3 px-4 text-brand-primary/60 text-right">{formatCurrency(coupon.avg_order_value)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prelaunch Codes */}
            <PrelaunchCodesSection
              stats={data.prelaunch || { totalCodes: 0, activeCodes: 0, expiredCodes: 0, totalRedemptions: 0, totalRevenue: 0, totalDiscountGiven: 0 }}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />

            {/* Revenue by Tier */}
            {data.revenueByTier.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Revenue by Tier</h2>
                <div className="flex flex-wrap gap-4">
                  {data.revenueByTier.map(t => (
                    <div key={t.tier} className="flex-1 min-w-[140px] bg-brand-cream/50 rounded-lg p-4 text-center">
                      <p className="text-xs text-brand-primary/60 uppercase tracking-wide mb-1">{t.tier}</p>
                      <p className="text-xl font-bold text-brand-primary">{formatCurrency(t.revenue)}</p>
                      <p className="text-xs text-brand-primary/40">{t.orders} orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator ROI */}
            {data.creatorROI.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Creator ROI</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Creator</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Discount Given</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Commission Earned</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.creatorROI.map((c, i) => {
                        const net = c.totalCommissionEarned - c.totalDiscountGiven
                        return (
                          <tr key={c.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                            <td className="py-3 px-4 text-sm font-medium text-brand-primary">{c.fullName}</td>
                            <td className="py-3 px-4 text-sm text-right text-red-600">{formatCurrency(c.totalDiscountGiven)}</td>
                            <td className="py-3 px-4 text-sm text-right text-green-600">{formatCurrency(c.totalCommissionEarned)}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>{net >= 0 ? '+' : ''}{formatCurrency(net)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Creator Program */}
            {data.creators && (data.creators.totalLifetime > 0 || Object.keys(data.creators.creatorsByStatus).length > 0) && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">Creator Program</h2>
                  <Link
                    href="/admin/creators"
                    className="text-sm text-brand-primary/60 hover:text-brand-primary underline transition-colors"
                  >
                    Manage Creators
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-700 mb-1">Pending</div>
                    <div className="text-2xl font-display text-yellow-800">{formatCurrency(data.creators.totalPending)}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-700 mb-1">Approved</div>
                    <div className="text-2xl font-display text-green-800">{formatCurrency(data.creators.totalApproved)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-700 mb-1">Paid</div>
                    <div className="text-2xl font-display text-blue-800">{formatCurrency(data.creators.totalPaid)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-700 mb-1">Active Creators</div>
                    <div className="text-2xl font-display text-purple-800">{data.creators.activeCreatorsWithCommissions}</div>
                  </div>
                </div>
                {Object.keys(data.creators.creatorsByStatus).length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(data.creators.creatorsByStatus).map(([status, count]) => (
                      <span
                        key={status}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                      >
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Creator Network */}
            {data.allCreators.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">Creator Network</h2>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={creatorSearch}
                    onChange={(e) => setCreatorSearch(e.target.value)}
                    className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Name</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Status</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Tier</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Commission</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Override</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Recruits</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Codes</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Revenue</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allCreators
                        .filter(c => c.full_name.toLowerCase().includes(creatorSearch.toLowerCase()) || c.email.toLowerCase().includes(creatorSearch.toLowerCase()))
                        .map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-sm font-medium text-brand-primary">{c.full_name}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{c.email}</td>
                          <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span></td>
                          <td className="py-3 px-4 text-sm text-brand-primary">{getTierName(c.tier)}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{Number(c.commission_rate)}%</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary/60">{Number(c.override_rate)}%</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.recruit_count}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.code_count}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(Number(c.total_code_revenue))}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Tracking Links */}
            {data.allTrackingLinks.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">All Tracking Links</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Total: {data.allTrackingLinks.length}</span>
                  <span className="px-3 py-1 bg-green-50 rounded-full text-sm text-green-700">Active: {data.allTrackingLinks.filter(l => l.active).length}</span>
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Clicks: {data.allTrackingLinks.reduce((s, l) => s + l.click_count, 0)}</span>
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Conversions: {data.allTrackingLinks.reduce((s, l) => s + l.conversion_count, 0)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Slug</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Creator</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Destination</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Clicks</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Conversions</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Conv. Rate</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allTrackingLinks.map((l, i) => (
                        <tr key={l.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-sm font-mono text-brand-primary">/r/{l.slug}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary">{l.creator_name || '—'}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{l.destination_path}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{l.click_count}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{l.conversion_count}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{l.click_count > 0 ? ((l.conversion_count / l.click_count) * 100).toFixed(1) : '0.0'}%</td>
                          <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${l.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{l.active ? 'Yes' : 'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Coupon Codes */}
            {data.allCouponCodes.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">All Coupon Codes</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Total: {data.allCouponCodes.length}</span>
                  <span className="px-3 py-1 bg-green-50 rounded-full text-sm text-green-700">Active: {data.allCouponCodes.filter(c => c.active).length}</span>
                  <span className="px-3 py-1 bg-purple-50 rounded-full text-sm text-purple-700">Creator: {data.allCouponCodes.filter(c => c.program_type === 'creator').length}</span>
                  <span className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">Prelaunch: {data.allCouponCodes.filter(c => c.program_type === 'prelaunch').length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Code</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Creator</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Type</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Discount</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Uses</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Revenue</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Stripe</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Active</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allCouponCodes.map((c, i) => {
                        const typeBadge = c.program_type === 'prelaunch'
                          ? 'bg-blue-100 text-blue-800'
                          : c.code_type === 'membership' ? 'bg-purple-100 text-purple-800'
                          : c.code_type === 'product' ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                        return (
                          <tr key={c.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                            <td className="py-3 px-4 text-sm font-mono font-medium text-brand-primary">{c.code}</td>
                            <td className="py-3 px-4 text-sm text-brand-primary">{c.creator_name || 'Company'}</td>
                            <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge}`}>{c.code_type}</span></td>
                            <td className="py-3 px-4 text-sm text-right text-brand-primary">{Number(c.discount_value)}%</td>
                            <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.use_count}</td>
                            <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(Number(c.total_revenue))}</td>
                            <td className="py-3 px-4 text-sm text-brand-primary">{c.stripe_promotion_code_id ? '✓' : '—'}</td>
                            <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{c.active ? 'Yes' : 'No'}</span></td>
                            <td className="py-3 px-4 text-sm text-brand-primary/60">{c.expires_at ? formatDate(c.expires_at) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Customer Master List */}
            {data.allCustomers.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">Customer Master List</h2>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Name</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Phone</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Location</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Source</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Orders</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Total Spent</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allCustomers
                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-sm font-medium text-brand-primary">{c.name}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{c.email}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{c.phone || '—'}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{c.address_city && c.address_state ? `${c.address_city}, ${c.address_state}` : '—'}</td>
                          <td className="py-3 px-4">
                            {c.signup_type && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.signup_type === 'membership' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {c.signup_type === 'membership' ? 'Membership' : 'Products'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{c.source || '—'}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.order_count}</td>
                          <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(Number(c.total_spent))}</td>
                          <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Waitlist Sources */}
            {Object.keys(data.waitlist.bySource).length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Waitlist by Source</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.waitlist.bySource).map(([source, count]) => (
                    <span
                      key={source}
                      className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary"
                    >
                      {source}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code Scan Analytics */}
            {data.qrScans && data.qrScans.totalScans > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">QR Code Scans</h2>

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary">{data.qrScans.totalScans}</div>
                    <div className="text-xs text-brand-primary/60 mt-1">Total Scans</div>
                  </div>
                  <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary">{data.qrScans.uniqueVisitors}</div>
                    <div className="text-xs text-brand-primary/60 mt-1">Unique Visitors</div>
                  </div>
                  <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary">
                      {data.qrScans.totalScans > 0 ? Math.round((data.qrScans.uniqueVisitors / data.qrScans.totalScans) * 100) : 0}%
                    </div>
                    <div className="text-xs text-brand-primary/60 mt-1">Unique Rate</div>
                  </div>
                  <div className="bg-brand-cream/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary">
                      {Object.keys(data.qrScans.byDevice).length > 0
                        ? Object.entries(data.qrScans.byDevice).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
                        : '—'}
                    </div>
                    <div className="text-xs text-brand-primary/60 mt-1">Top Device</div>
                  </div>
                </div>

                {/* Breakdowns row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* By Destination */}
                  {Object.keys(data.qrScans.byDestination).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By Destination</h3>
                      <div className="space-y-1">
                        {Object.entries(data.qrScans.byDestination).map(([dest, count]) => (
                          <div key={dest} className="flex justify-between text-sm">
                            <span className="text-brand-primary capitalize">{dest}</span>
                            <span className="text-brand-primary/60 font-mono">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* By OS */}
                  {Object.keys(data.qrScans.byOs).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By OS</h3>
                      <div className="space-y-1">
                        {Object.entries(data.qrScans.byOs).map(([os, count]) => (
                          <div key={os} className="flex justify-between text-sm">
                            <span className="text-brand-primary">{os}</span>
                            <span className="text-brand-primary/60 font-mono">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* By Browser */}
                  {Object.keys(data.qrScans.byBrowser).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">By Browser</h3>
                      <div className="space-y-1">
                        {Object.entries(data.qrScans.byBrowser).map(([browser, count]) => (
                          <div key={browser} className="flex justify-between text-sm">
                            <span className="text-brand-primary">{browser}</span>
                            <span className="text-brand-primary/60 font-mono">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Cities */}
                {data.qrScans.byCity.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">Top Locations</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.qrScans.byCity.map((loc) => (
                        <span
                          key={`${loc.city}-${loc.region}`}
                          className="px-3 py-1.5 bg-brand-cream rounded-full text-xs font-medium text-brand-primary"
                        >
                          {loc.city}{loc.region ? `, ${loc.region}` : ''} ({loc.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Scans Table */}
                {data.qrScans.recentScans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-primary/70 mb-2">Recent Scans</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-brand-primary/10">
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Destination</th>
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Source</th>
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Device</th>
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">OS / Browser</th>
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Location</th>
                            <th className="text-left py-2 px-3 text-brand-primary/60 font-medium text-xs">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.qrScans.recentScans.slice(0, 10).map((scan, index) => (
                            <tr key={scan.scan_id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                              <td className="py-2 px-3 text-brand-primary text-sm capitalize">{scan.destination}</td>
                              <td className="py-2 px-3 text-brand-primary/60 text-sm">{scan.source.replace(/_/g, ' ')}</td>
                              <td className="py-2 px-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  scan.device_type === 'mobile' ? 'bg-blue-100 text-blue-800' :
                                  scan.device_type === 'tablet' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {scan.device_type}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-brand-primary/60 text-xs">{scan.os} / {scan.browser}</td>
                              <td className="py-2 px-3 text-brand-primary/60 text-xs">
                                {scan.city ? `${scan.city}${scan.region ? `, ${scan.region}` : ''}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-brand-primary/60 text-xs">{formatDate(scan.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            {data.sales.recentOrders.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <h2 className="font-display text-xl text-brand-primary mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Order #</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.recentOrders.map((order, index) => (
                        <tr key={order.id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-brand-primary font-mono text-sm">
                            {order.order_number}
                          </td>
                          <td className="py-3 px-4 text-brand-primary">{order.customer_email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-brand-primary text-right font-medium">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-brand-primary/60 text-sm">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Waitlist Signups */}
            {data.waitlist.recent.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <h2 className="font-display text-xl text-brand-primary mb-4">Recent Waitlist Signups</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Source</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.waitlist.recent.map((entry, index) => (
                        <tr key={entry.id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                          <td className="py-3 px-4 text-brand-primary">{entry.name}</td>
                          <td className="py-3 px-4 text-brand-primary">{entry.email}</td>
                          <td className="py-3 px-4 text-brand-primary/60">{entry.source || 'direct'}</td>
                          <td className="py-3 px-4 text-brand-primary/60 text-sm">
                            {formatDate(entry.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
      <div className="flex items-start justify-between mb-2">
        <span className="text-brand-primary/60 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-display text-brand-primary mb-1">{value}</div>
      <div className="text-sm text-brand-primary/60">{subtitle}</div>
    </div>
  )
}
