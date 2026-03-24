'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import PrelaunchCodesSection from '@/components/admin/PrelaunchCodesSection'
import { getTierName } from '@/lib/config/affiliate'

// --------------- CSV Export Utility ---------------
function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

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

interface RevenueTimeSeriesPoint {
  date: string
  revenue: number
  orders: number
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
  revenueTimeSeries: RevenueTimeSeriesPoint[]
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
  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<SalesStats['recentOrders'][0] | null>(null)
  const [fulfillAction, setFulfillAction] = useState<'ship' | 'fulfill' | null>(null)
  const [fulfillForm, setFulfillForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' })
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfillError, setFulfillError] = useState<string | null>(null)
  // Creator edit modal
  const [editingCreator, setEditingCreator] = useState<CreatorAdminRow | null>(null)
  const [creatorEditForm, setCreatorEditForm] = useState({ commission_rate: '', override_rate: '', status: '' })
  const [savingCreator, setSavingCreator] = useState(false)
  const [creatorEditError, setCreatorEditError] = useState<string | null>(null)
  // Coupon create
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', discount_value: '10', code_type: 'membership' })
  const [creatingCoupon, setCreatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  // Coupon search
  const [couponSearch, setCouponSearch] = useState('')
  // Tracking link search
  const [linkSearch, setLinkSearch] = useState('')

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

  // --------------- Export Handlers ---------------
  const exportCustomers = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-customers',
      ['Name', 'Email', 'Phone', 'City', 'State', 'Type', 'Source', 'Orders', 'Total Spent', 'Joined'],
      data.allCustomers.map(c => [c.name, c.email, c.phone, c.address_city, c.address_state, c.signup_type, c.source, c.order_count, c.total_spent, c.created_at])
    )
  }, [data])

  const exportCreators = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-creators',
      ['Name', 'Email', 'Status', 'Tier', 'Commission %', 'Override %', 'Recruits', 'Codes', 'Revenue', 'Joined'],
      data.allCreators.map(c => [c.full_name, c.email, c.status, getTierName(c.tier), c.commission_rate, c.override_rate, c.recruit_count, c.code_count, c.total_code_revenue, c.created_at])
    )
  }, [data])

  const exportOrders = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-orders',
      ['Order #', 'Customer', 'Status', 'Amount', 'Date'],
      data.sales.recentOrders.map(o => [o.order_number, o.customer_email, o.status, o.total_amount, o.created_at])
    )
  }, [data])

  const exportCoupons = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-coupons',
      ['Code', 'Creator', 'Type', 'Discount %', 'Uses', 'Revenue', 'Active', 'Expires'],
      data.allCouponCodes.map(c => [c.code, c.creator_name || 'Company', c.code_type, c.discount_value, c.use_count, c.total_revenue, c.active ? 'Yes' : 'No', c.expires_at])
    )
  }, [data])

  const exportTrackingLinks = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-tracking-links',
      ['Slug', 'Creator', 'Destination', 'Clicks', 'Conversions', 'Conv Rate', 'Active'],
      data.allTrackingLinks.map(l => [`/r/${l.slug}`, l.creator_name, l.destination_path, l.click_count, l.conversion_count, l.click_count > 0 ? `${((l.conversion_count / l.click_count) * 100).toFixed(1)}%` : '0%', l.active ? 'Yes' : 'No'])
    )
  }, [data])

  // --------------- Order Fulfillment ---------------
  async function handleFulfill() {
    if (!selectedOrder || !fulfillAction) return
    setFulfilling(true)
    setFulfillError(null)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.order_number}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: fulfillAction,
          carrier: fulfillForm.carrier || undefined,
          trackingNumber: fulfillForm.trackingNumber || undefined,
          trackingUrl: fulfillForm.trackingUrl || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Fulfillment failed')
      setSelectedOrder(null)
      setFulfillAction(null)
      setFulfillForm({ carrier: '', trackingNumber: '', trackingUrl: '' })
      fetchAnalytics()
    } catch (err) {
      setFulfillError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setFulfilling(false)
    }
  }

  // --------------- Creator Edit ---------------
  async function handleSaveCreator() {
    if (!editingCreator) return
    setSavingCreator(true)
    setCreatorEditError(null)
    try {
      const res = await fetch('/api/admin/creators/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: editingCreator.id,
          commission_rate: parseFloat(creatorEditForm.commission_rate),
          override_rate: parseFloat(creatorEditForm.override_rate),
          status: creatorEditForm.status,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Update failed')
      setEditingCreator(null)
      fetchAnalytics()
    } catch (err) {
      setCreatorEditError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSavingCreator(false)
    }
  }

  // --------------- Coupon Create ---------------
  async function handleCreateCoupon() {
    if (!couponForm.code.trim()) return
    setCreatingCoupon(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/admin/creators/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code.trim().toUpperCase(),
          discount_value: parseFloat(couponForm.discount_value),
          code_type: couponForm.code_type,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Create failed')
      setCouponForm({ code: '', discount_value: '10', code_type: 'membership' })
      setShowCouponForm(false)
      fetchAnalytics()
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setCreatingCoupon(false)
    }
  }

  // --------------- Coupon Toggle ---------------
  async function handleToggleCoupon(codeId: string, currentlyActive: boolean) {
    try {
      const res = await fetch('/api/admin/creators/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_id: codeId, active: !currentlyActive }),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Toggle failed')
      }
      fetchAnalytics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle coupon')
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

            {/* Revenue Trend Chart */}
            {data.revenueTimeSeries && data.revenueTimeSeries.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl text-brand-primary">Revenue Trend</h2>
                    <p className="text-sm text-brand-primary/60 mt-1">
                      {formatCurrency(data.revenueTimeSeries.reduce((sum, d) => sum + d.revenue, 0))} total
                      {' / '}
                      {data.revenueTimeSeries.reduce((sum, d) => sum + d.orders, 0)} orders in period
                    </p>
                  </div>
                  <span className="text-sm text-brand-primary/40">
                    {periodDays <= 30 ? 'Daily' : periodDays <= 90 ? 'Weekly' : 'Monthly'}
                  </span>
                </div>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.revenueTimeSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2A4542" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2A4542" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={(val: string) => {
                          const d = new Date(val)
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                      />
                      <YAxis
                        yAxisId="revenue"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <YAxis
                        yAxisId="orders"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [formatCurrency(value), 'Revenue']
                          return [value, 'Orders']
                        }}
                        labelFormatter={(label: string) => {
                          const d = new Date(label)
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        }}
                      />
                      <Area
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2A4542"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="orders"
                        stroke="#B7E4C7"
                        strokeWidth={2}
                        dot={{ fill: '#B7E4C7', r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-3 text-xs text-brand-primary/60">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-brand-primary rounded" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-sage rounded" /> Orders
                  </span>
                </div>
              </div>
            )}

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
                  href="https://partners.joinasher.com"
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
                  <div className="flex items-center gap-3">
                    <button onClick={exportCreators} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                      className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                    />
                  </div>
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
                        <th className="text-center py-3 px-4 text-brand-primary/60 font-medium text-sm">Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allCreators
                        .filter(c => c.full_name.toLowerCase().includes(creatorSearch.toLowerCase()) || c.email.toLowerCase().includes(creatorSearch.toLowerCase()))
                        .map((c, i) => (
                        <tr key={c.id} className={`${i % 2 === 0 ? 'bg-brand-cream/30' : ''} hover:bg-brand-primary/5 transition-colors`}>
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
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => { setEditingCreator(c); setCreatorEditForm({ commission_rate: String(Number(c.commission_rate)), override_rate: String(Number(c.override_rate)), status: c.status }); setCreatorEditError(null) }}
                              className="text-xs text-brand-primary underline hover:text-brand-primaryHover"
                            >
                              Edit
                            </button>
                          </td>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">All Tracking Links</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={exportTrackingLinks} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
                    <input
                      type="text"
                      placeholder="Search slugs or creators..."
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-48"
                    />
                  </div>
                </div>
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
                      {data.allTrackingLinks
                        .filter(l => !linkSearch || l.slug.toLowerCase().includes(linkSearch.toLowerCase()) || (l.creator_name || '').toLowerCase().includes(linkSearch.toLowerCase()))
                        .map((l, i) => (
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
            {(data.allCouponCodes.length > 0 || showCouponForm) && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">All Coupon Codes</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={exportCoupons} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
                    <button
                      onClick={() => { setShowCouponForm(!showCouponForm); setCouponError(null) }}
                      className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primaryHover transition-colors"
                    >
                      {showCouponForm ? 'Cancel' : '+ Create Coupon'}
                    </button>
                    <input
                      type="text"
                      placeholder="Search codes..."
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                      className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-40"
                    />
                  </div>
                </div>

                {/* Create Coupon Form */}
                {showCouponForm && (
                  <div className="bg-brand-cream/50 rounded-lg p-4 mb-6 border border-brand-primary/10">
                    <h3 className="text-sm font-medium text-brand-primary mb-3">New Coupon Code</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs text-brand-primary/60 mb-1">Code</label>
                        <input
                          type="text"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SUMMER25"
                          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-primary/60 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={couponForm.discount_value}
                          onChange={(e) => setCouponForm(f => ({ ...f, discount_value: e.target.value }))}
                          min="1" max="100"
                          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-primary/60 mb-1">Type</label>
                        <select
                          value={couponForm.code_type}
                          onChange={(e) => setCouponForm(f => ({ ...f, code_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        >
                          <option value="membership">Membership</option>
                          <option value="product">Product</option>
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={handleCreateCoupon}
                          disabled={creatingCoupon || !couponForm.code.trim()}
                          className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
                        >
                          {creatingCoupon ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </div>
                    {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
                  </div>
                )}

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
                      {data.allCouponCodes
                        .filter(c => !couponSearch || c.code.toLowerCase().includes(couponSearch.toLowerCase()) || (c.creator_name || '').toLowerCase().includes(couponSearch.toLowerCase()))
                        .map((c, i) => {
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
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleCoupon(c.id, c.active)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${c.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {c.active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
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
                  <div className="flex items-center gap-3">
                    <button onClick={exportCustomers} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                    />
                  </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-brand-primary">Recent Orders</h2>
                  <button onClick={exportOrders} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Order #</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.recentOrders.map((order, index) => (
                        <tr key={order.id} className={`${index % 2 === 0 ? 'bg-brand-cream/30' : ''} cursor-pointer hover:bg-brand-primary/5 transition-colors`} onClick={() => setSelectedOrder(order)}>
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
                          <td className="py-3 px-4">
                            {order.status === 'paid' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setFulfillAction('ship'); }}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                              >
                                Ship
                              </button>
                            )}
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

        {/* ========== ORDER DETAIL MODAL ========== */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedOrder(null); setFulfillAction(null); setFulfillError(null) }}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-brand-primary">
                  Order <span className="font-mono">{selectedOrder.order_number}</span>
                </h3>
                <button onClick={() => { setSelectedOrder(null); setFulfillAction(null) }} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/60">Customer</span>
                  <span className="text-brand-primary">{selectedOrder.customer_email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/60">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/60">Amount</span>
                  <span className="font-medium text-brand-primary">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/60">Date</span>
                  <span className="text-brand-primary">{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="bg-brand-cream/30 rounded-lg p-3 mb-4">
                  <h4 className="text-xs font-medium text-brand-primary/60 mb-2 uppercase tracking-wide">Items</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-brand-primary">{item.name} x{item.quantity}</span>
                      <span className="text-brand-primary/60">{formatCurrency(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fulfillment Actions */}
              {(selectedOrder.status === 'paid' || selectedOrder.status === 'shipped') && (
                <div className="border-t border-brand-primary/10 pt-4">
                  <div className="flex gap-2 mb-3">
                    {selectedOrder.status === 'paid' && (
                      <button
                        onClick={() => setFulfillAction('ship')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fulfillAction === 'ship' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                      >
                        Mark Shipped
                      </button>
                    )}
                    <button
                      onClick={() => setFulfillAction('fulfill')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fulfillAction === 'fulfill' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                      Mark Fulfilled
                    </button>
                  </div>

                  {fulfillAction === 'ship' && (
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        placeholder="Carrier (e.g., USPS, UPS, FedEx)"
                        value={fulfillForm.carrier}
                        onChange={(e) => setFulfillForm(f => ({ ...f, carrier: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        value={fulfillForm.trackingNumber}
                        onChange={(e) => setFulfillForm(f => ({ ...f, trackingNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Tracking URL (optional)"
                        value={fulfillForm.trackingUrl}
                        onChange={(e) => setFulfillForm(f => ({ ...f, trackingUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {fulfillError && <p className="text-sm text-red-600 mb-2">{fulfillError}</p>}

                  {fulfillAction && (
                    <button
                      onClick={handleFulfill}
                      disabled={fulfilling || (fulfillAction === 'ship' && (!fulfillForm.carrier || !fulfillForm.trackingNumber))}
                      className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
                    >
                      {fulfilling ? 'Processing...' : fulfillAction === 'ship' ? 'Ship Order' : 'Mark as Fulfilled'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== CREATOR EDIT MODAL ========== */}
        {editingCreator && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingCreator(null)}>
            <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-brand-primary">
                  Edit {editingCreator.full_name}
                </h3>
                <button onClick={() => setEditingCreator(null)} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-brand-primary/60 mb-1">Status</label>
                  <select
                    value={creatorEditForm.status}
                    onChange={(e) => setCreatorEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-primary/60 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={creatorEditForm.commission_rate}
                    onChange={(e) => setCreatorEditForm(f => ({ ...f, commission_rate: e.target.value }))}
                    min="0" max="50" step="0.5"
                    className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-primary/60 mb-1">Override Rate (%)</label>
                  <input
                    type="number"
                    value={creatorEditForm.override_rate}
                    onChange={(e) => setCreatorEditForm(f => ({ ...f, override_rate: e.target.value }))}
                    min="0" max="25" step="0.5"
                    className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                  />
                </div>
              </div>

              {creatorEditError && <p className="mt-3 text-sm text-red-600">{creatorEditError}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveCreator}
                  disabled={savingCreator}
                  className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
                >
                  {savingCreator ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingCreator(null)} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
