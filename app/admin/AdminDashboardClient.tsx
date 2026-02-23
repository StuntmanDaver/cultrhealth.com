'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

interface AnalyticsData {
  sales: SalesStats
  waitlist: WaitlistStats
  memberships: MembershipStats
  periodDays: number
  generatedAt: string
}

export default function AdminDashboardClient({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodDays, setPeriodDays] = useState(30)

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
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'canceled':
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

            {/* Quick Links */}
            <div className="mt-8 p-6 bg-brand-primary/5 rounded-xl">
              <h2 className="font-display text-xl text-brand-primary mb-4">Quick Links</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/provider/protocol-builder"
                  className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Protocol Builder
                </Link>
                <a
                  href="https://app.gethealthie.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 grad-white text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  Open Healthie →
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
