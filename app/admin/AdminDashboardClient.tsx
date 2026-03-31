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
import { MetricCard } from '@/components/admin/MetricCard'
import { parseOrderItems, ORDER_STATUS_STYLES } from '@/lib/admin-utils'
import type { AnalyticsData } from '@/lib/admin-types'

interface CronStatus {
  name: string
  schedule: string
  health: 'healthy' | 'stale' | 'error' | 'never_run'
  lastRun: {
    status: string
    startedAt: string
    completedAt: string | null
    durationMs: number | null
    result: Record<string, unknown> | null
    error: string | null
  } | null
}

export default function AdminDashboardClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodDays, setPeriodDays] = useState(30)
  // Club orders (invoice aging)
  const [dismissingInvoice, setDismissingInvoice] = useState<string | null>(null)
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null)
  // Bulk selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  // Cron status
  const [cronStatuses, setCronStatuses] = useState<CronStatus[]>([])
  const [cronLoading, setCronLoading] = useState(false)

  const fetchAnalytics = useCallback(async () => {
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
  }, [periodDays])

  const fetchCronStatuses = useCallback(async () => {
    setCronLoading(true)
    try {
      const res = await fetch('/api/admin/cron-status')
      const json = await res.json()
      if (res.ok && json.data) {
        setCronStatuses(json.data)
      }
    } catch {
      // Non-critical — silent
    } finally {
      setCronLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchCronStatuses()
  }, [fetchAnalytics, fetchCronStatuses])

  async function handleDismissInvoice(orderId: string) {
    if (!confirm('Dismiss this order? It will be hidden from the dashboard.')) return
    setDismissingInvoice(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/dismiss`, { method: 'POST' })
      if (res.ok && data) {
        const updatedInvoices = data.invoiceAging.filter(inv => inv.id !== orderId)
        setData({ ...data, invoiceAging: updatedInvoices })
        if (expandedInvoiceId === orderId) setExpandedInvoiceId(null)
        fetch(`/api/admin/analytics?days=${periodDays}`)
          .then(r => r.json())
          .then(result => {
            if (result.data?.revenueTimeSeries) {
              setData(prev => prev ? { ...prev, revenueTimeSeries: result.data.revenueTimeSeries } : prev)
            }
          })
          .catch(() => {})
      }
    } catch {
      // silent
    } finally {
      setDismissingInvoice(null)
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setUpdatingStatus(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok && data) {
        const updatedInvoices = data.invoiceAging.map(inv =>
          inv.id === orderId ? { ...inv, status: newStatus } : inv
        )
        setData({ ...data, invoiceAging: updatedInvoices })
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to update status')
      }
    } catch {
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function handleApproveOrder(orderId: string) {
    if (!confirm('Approve this order? This will create a QuickBooks invoice and email the customer.')) return
    setApprovingOrder(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/approve`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && data) {
        const newStatus = json.status || 'approved'
        const updatedInvoices = data.invoiceAging.map(inv =>
          inv.id === orderId ? { ...inv, status: newStatus } : inv
        )
        setData({ ...data, invoiceAging: updatedInvoices })
      } else {
        alert(json.error || 'Failed to approve order')
      }
    } catch {
      alert('Failed to approve order')
    } finally {
      setApprovingOrder(null)
    }
  }

  async function handleBulkStatusUpdate(newStatus: string) {
    if (selectedOrders.size === 0) return
    const ids = Array.from(selectedOrders)
    setBulkUpdating(true)
    let successCount = 0
    let failCount = 0
    for (const orderId of ids) {
      try {
        const res = await fetch(`/api/admin/club-orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    // Refresh data to show updated statuses
    if (successCount > 0 && data) {
      const updatedInvoices = data.invoiceAging.map(inv =>
        selectedOrders.has(inv.id) ? { ...inv, status: newStatus } : inv
      )
      setData({ ...data, invoiceAging: updatedInvoices })
    }
    setSelectedOrders(new Set())
    setBulkUpdating(false)
    if (failCount > 0) {
      alert(`${successCount} updated, ${failCount} failed`)
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

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-brand-primary/10 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-brand-primary/10 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-brand-primary/10 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Overview</h1>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* Revenue Trend Chart */}
          {data.revenueTimeSeries && data.revenueTimeSeries.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Creator Link Performance */}
          {data.creatorLinkPerformance.length > 0 && (() => {
            const totalClicks = data.creatorLinkPerformance.reduce((s, r) => s + r.total_clicks, 0)
            const totalConverted = data.creatorLinkPerformance.reduce((s, r) => s + r.converted_clicks, 0)
            const totalNonConverted = totalClicks - totalConverted
            const overallRate = totalClicks > 0 ? Math.round((totalConverted / totalClicks) * 1000) / 10 : 0

            return (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <h2 className="font-display text-xl text-brand-primary mb-4">Creator Link Performance</h2>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-brand-primary/5 rounded-xl p-4">
                    <p className="text-xs text-brand-primary/60 mb-1">Total Clicks</p>
                    <p className="text-2xl font-bold text-brand-primary">{totalClicks}</p>
                  </div>
                  <div className="bg-brand-primary/5 rounded-xl p-4">
                    <p className="text-xs text-brand-primary/60 mb-1">Converted</p>
                    <p className="text-2xl font-bold text-green-600">{totalConverted}</p>
                  </div>
                  <div className="bg-brand-primary/5 rounded-xl p-4">
                    <p className="text-xs text-brand-primary/60 mb-1">Non-Converted</p>
                    <p className="text-2xl font-bold text-brand-primary">{totalNonConverted}</p>
                  </div>
                  <div className="bg-brand-primary/5 rounded-xl p-4">
                    <p className="text-xs text-brand-primary/60 mb-1">Conv. Rate</p>
                    <p className={`text-2xl font-bold ${overallRate >= 15 ? 'text-green-600' : overallRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {overallRate}%
                    </p>
                  </div>
                </div>

                {/* Per-creator table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-2 pr-4 font-medium text-brand-primary/60">Creator</th>
                        <th className="text-right py-2 pr-4 font-medium text-brand-primary/60">Clicks</th>
                        <th className="text-right py-2 pr-4 font-medium text-brand-primary/60">Converted</th>
                        <th className="text-right py-2 pr-4 font-medium text-brand-primary/60">Non-Converted</th>
                        <th className="text-right py-2 font-medium text-brand-primary/60">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.creatorLinkPerformance.map((row) => (
                        <tr key={row.creator_id} className="border-b border-brand-primary/5 last:border-0">
                          <td className="py-2 pr-4 text-brand-primary font-medium">{row.creator_name}</td>
                          <td className="py-2 pr-4 text-right text-brand-primary">{row.total_clicks}</td>
                          <td className="py-2 pr-4 text-right text-green-600">{row.converted_clicks}</td>
                          <td className="py-2 pr-4 text-right text-brand-primary/70">{row.non_converted_clicks}</td>
                          <td className={`py-2 text-right font-medium ${Number(row.conversion_rate) >= 15 ? 'text-green-600' : Number(row.conversion_rate) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {row.conversion_rate}%
                          </td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      {data.creatorLinkPerformance.length > 1 && (
                        <tr className="border-t border-brand-primary/20 bg-brand-primary/5">
                          <td className="py-2 pr-4 font-bold text-brand-primary">Total</td>
                          <td className="py-2 pr-4 text-right font-bold text-brand-primary">{totalClicks}</td>
                          <td className="py-2 pr-4 text-right font-bold text-green-600">{totalConverted}</td>
                          <td className="py-2 pr-4 text-right font-bold text-brand-primary/70">{totalNonConverted}</td>
                          <td className={`py-2 text-right font-bold ${overallRate >= 15 ? 'text-green-600' : overallRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {overallRate}%
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* Fulfillment Pipeline Summary */}
          {data.clubOrderFulfillment && Object.values(data.clubOrderFulfillment).some(c => c > 0) && (() => {
            const OVERVIEW_PIPELINE = [
              { key: 'pending_approval', label: 'Pending', color: 'yellow' },
              { key: 'approved', label: 'Approved', color: 'blue' },
              { key: 'invoice_sent', label: 'Invoiced', color: 'indigo' },
              { key: 'paid', label: 'Paid', color: 'green' },
              { key: 'shipped', label: 'Waiting to Ship', color: 'blue' },
              { key: 'fulfilled', label: 'Fulfilled', color: 'emerald' },
            ]
            const colorMap: Record<string, { bg: string; text: string; activeBg: string }> = {
              yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  activeBg: 'bg-yellow-100' },
              blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    activeBg: 'bg-blue-100' },
              indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  activeBg: 'bg-indigo-100' },
              green:   { bg: 'bg-green-50',   text: 'text-green-700',   activeBg: 'bg-green-100' },
              emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', activeBg: 'bg-emerald-100' },
            }
            const totalActive = OVERVIEW_PIPELINE.reduce((s, stage) => s + (data.clubOrderFulfillment[stage.key] || 0), 0)

            return (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl text-brand-primary">Fulfillment Pipeline</h2>
                    <p className="text-sm text-brand-primary/60 mt-1">{totalActive} active orders across all stages</p>
                  </div>
                  <Link href="/admin/orders?tab=pending" className="text-sm text-brand-primary/60 hover:text-brand-primary underline">
                    View details →
                  </Link>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {OVERVIEW_PIPELINE.map((stage, idx) => {
                    const count = data.clubOrderFulfillment[stage.key] || 0
                    const colors = colorMap[stage.color] || colorMap.blue
                    const isActive = count > 0
                    return (
                      <div key={stage.key} className="flex items-center">
                        <div className={`flex flex-col items-center justify-center rounded-lg px-4 py-3 min-w-[90px] transition-colors ${isActive ? colors.activeBg : 'bg-gray-50'}`}>
                          <span className={`text-2xl font-bold ${isActive ? colors.text : 'text-gray-300'}`}>
                            {count}
                          </span>
                          <span className={`text-xs font-medium mt-0.5 ${isActive ? colors.text : 'text-gray-400'}`}>
                            {stage.label}
                          </span>
                        </div>
                        {idx < OVERVIEW_PIPELINE.length - 1 && (
                          <span className="text-brand-primary/20 mx-1 text-lg shrink-0">→</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* External Tools */}
          <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
            <h2 className="font-display text-lg text-brand-primary mb-3">External Tools</h2>
            <div className="flex flex-wrap gap-3">
              <a href="https://partners.joinasher.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors text-sm">
                Asher Med Portal →
              </a>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors text-sm">
                Stripe Dashboard →
              </a>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors text-sm">
                Google Analytics →
              </a>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors text-sm">
                Search Console →
              </a>
            </div>
          </div>

          {/* Club Orders Summary */}
          {data.invoiceAging.length > 0 && (() => {
            const filteredOrders = invoiceStatusFilter
              ? data.invoiceAging.filter(inv => inv.status === invoiceStatusFilter)
              : data.invoiceAging
            const pendingCount = data.invoiceAging.filter(inv => inv.status === 'pending_approval').length
            const totalRevenue = data.invoiceAging.reduce((s, inv) => s + (Number(inv.subtotal_usd) || 0), 0)
            const statusCounts = data.invoiceAging.reduce((acc, inv) => {
              acc[inv.status] = (acc[inv.status] || 0) + 1
              return acc
            }, {} as Record<string, number>)

            return (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-xl text-brand-primary">Club Orders</h2>
                  <Link href="/admin/orders?tab=pending" className="text-sm text-brand-primary/60 hover:text-brand-primary underline">
                    View all →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">{data.invoiceAging.length} total</span>
                  {pendingCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-50 rounded-full text-sm text-yellow-700">{pendingCount} pending</span>
                  )}
                  <span className="px-3 py-1 bg-brand-primary/5 rounded-full text-sm text-brand-primary">Order Value: {formatCurrency(totalRevenue)}</span>
                </div>

                {/* Status filter pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setInvoiceStatusFilter('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!invoiceStatusFilter ? 'bg-brand-primary text-white' : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'}`}
                  >
                    All ({data.invoiceAging.length})
                  </button>
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const style = ORDER_STATUS_STYLES[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' }
                    return (
                      <button
                        key={status}
                        onClick={() => setInvoiceStatusFilter(invoiceStatusFilter === status ? '' : status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${invoiceStatusFilter === status ? 'bg-brand-primary text-white' : `${style.bg} ${style.text} hover:opacity-80`}`}
                      >
                        {style.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Bulk action bar */}
                {selectedOrders.size > 0 && (
                  <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm font-medium text-amber-800">{selectedOrders.size} selected</span>
                    <select
                      disabled={bulkUpdating}
                      value=""
                      onChange={(e) => {
                        const target = e.target.value
                        if (!target) return
                        const LABELS: Record<string, string> = { approved: 'Approved', invoice_sent: 'Invoiced', paid: 'Paid', shipped: 'Waiting to Ship', fulfilled: 'Fulfilled', cancelled: 'Cancelled' }
                        if (confirm(`Move ${selectedOrders.size} order(s) to "${LABELS[target] || target}"?\n\nAll intermediate timestamps will be set automatically.`)) {
                          handleBulkStatusUpdate(target)
                        }
                        e.target.value = ''
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg border border-amber-300 bg-white text-amber-900 cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Move to…</option>
                      <option value="approved">Approved</option>
                      <option value="invoice_sent">Invoiced</option>
                      <option value="paid">Paid</option>
                      <option value="shipped">Waiting to Ship</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setSelectedOrders(new Set())}
                      className="text-sm text-amber-600 hover:text-amber-800 ml-auto"
                    >
                      Clear
                    </button>
                    {bulkUpdating && <span className="text-xs text-amber-600 animate-pulse">Updating...</span>}
                  </div>
                )}

                {/* Orders list */}
                <div className="border border-brand-primary/10 rounded-lg overflow-hidden">
                  {/* Select all header */}
                  {filteredOrders.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand-primary/[0.03] border-b border-brand-primary/10">
                      <input
                        type="checkbox"
                        checked={filteredOrders.length > 0 && filteredOrders.every(inv => selectedOrders.has(inv.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(new Set([...Array.from(selectedOrders), ...filteredOrders.map(inv => inv.id)]))
                          } else {
                            const remaining = new Set(selectedOrders)
                            filteredOrders.forEach(inv => remaining.delete(inv.id))
                            setSelectedOrders(remaining)
                          }
                        }}
                        className="w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                      />
                      <span className="text-xs text-brand-primary/50 uppercase tracking-wide font-medium">Select all ({filteredOrders.length})</span>
                    </div>
                  )}
                  {filteredOrders.map((inv) => {
                    const isExpanded = expandedInvoiceId === inv.id
                    const statusStyle = ORDER_STATUS_STYLES[inv.status] || { label: inv.status, bg: 'bg-gray-100', text: 'text-gray-600' }
                    const items = parseOrderItems(inv.items)
                    const isPaid = ['paid', 'shipped', 'fulfilled'].includes(inv.status)
                    const isSelected = selectedOrders.has(inv.id)

                    return (
                      <div key={inv.id} className={`border-b border-brand-primary/10 last:border-b-0 ${isSelected ? 'bg-amber-50/50' : ''}`}>
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-brand-cream/30 transition-colors"
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              const next = new Set(selectedOrders)
                              if (e.target.checked) next.add(inv.id)
                              else next.delete(inv.id)
                              setSelectedOrders(next)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/20 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm text-brand-primary">{inv.order_number}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                {statusStyle.label}
                              </span>
                              {inv.coupon_code && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  {inv.coupon_code} ({inv.discount_percent}% off)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-brand-primary mt-0.5">{inv.member_name} <span className="text-brand-primary/40">{inv.member_email}</span></p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-brand-primary">
                              {inv.subtotal_usd ? formatCurrency(Number(inv.subtotal_usd)) : 'TBD'}
                            </p>
                            <p className="text-xs text-brand-primary/40">
                              {new Date(inv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isPaid && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDismissInvoice(inv.id) }}
                                disabled={dismissingInvoice === inv.id}
                                className="text-brand-primary/30 hover:text-red-600 transition-colors disabled:opacity-50 p-1"
                                title="Dismiss order"
                              >
                                {dismissingInvoice === inv.id ? '...' : '✕'}
                              </button>
                            )}
                            <span className="text-brand-primary/30">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 bg-brand-cream/20">
                            {items.length > 0 && (
                              <div className="bg-white rounded-lg border border-brand-primary/10 p-4 mt-1 mb-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-brand-primary/10 text-brand-primary/60">
                                      <th className="text-left pb-2 font-medium">Product</th>
                                      <th className="text-center pb-2 font-medium">Qty</th>
                                      <th className="text-right pb-2 font-medium">Price</th>
                                      <th className="text-right pb-2 font-medium">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item, idx) => (
                                      <tr key={idx} className={idx % 2 === 0 ? 'bg-brand-cream/20' : ''}>
                                        <td className="py-2 text-brand-primary">
                                          {item.name}
                                          {item.note && <span className="text-brand-primary/40 ml-1 text-xs">({item.note})</span>}
                                        </td>
                                        <td className="py-2 text-center text-brand-primary">{item.quantity}</td>
                                        <td className="py-2 text-right text-brand-primary">
                                          {item.price != null ? formatCurrency(item.price) : 'TBD'}
                                        </td>
                                        <td className="py-2 text-right text-brand-primary font-medium">
                                          {item.price != null ? formatCurrency(item.price * item.quantity) : 'TBD'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-brand-primary/70">
                              {inv.coupon_code && inv.discount_percent && (
                                <span>Coupon: <strong className="text-green-700">{inv.coupon_code}</strong> ({inv.discount_percent}% off)</span>
                              )}
                              {inv.tax_amount_usd != null && Number(inv.tax_amount_usd) > 0 && (
                                <span>Tax: {formatCurrency(Number(inv.tax_amount_usd))}</span>
                              )}
                              <span>Subtotal: <strong className="text-brand-primary">{inv.subtotal_usd ? formatCurrency(Number(inv.subtotal_usd)) : 'TBD'}</strong></span>
                              {inv.tax_amount_usd != null && inv.subtotal_usd != null && (
                                <span>Total: <strong className="text-brand-primary">{formatCurrency(Number(inv.subtotal_usd) + Number(inv.tax_amount_usd))}</strong></span>
                              )}
                              <span className="text-brand-primary/40">{inv.days_pending}d ago</span>
                            </div>

                            {/* Actions row */}
                            {(() => {
                              const PIPELINE = ['pending_approval', 'approved', 'invoice_sent', 'paid', 'shipped', 'fulfilled']
                              const LABELS: Record<string, string> = {
                                pending_approval: 'Pending', approved: 'Approved', invoice_sent: 'Invoiced', paid: 'Paid', shipped: 'Waiting to Ship', fulfilled: 'Fulfilled', cancelled: 'Cancelled',
                              }
                              const currentIdx = PIPELINE.indexOf(inv.status)
                              const nextStatus = currentIdx >= 0 && currentIdx < PIPELINE.length - 1 ? PIPELINE[currentIdx + 1] : null
                              // All other pipeline stages (forward + backward) excluding current
                              const moveTargets = currentIdx >= 0
                                ? PIPELINE.filter((_, i) => i !== currentIdx)
                                : inv.status === 'cancelled' ? PIPELINE : [] // cancelled can reopen to any stage
                              const isTerminal = ['cancelled', 'fulfilled', 'rejected', 'dismissed'].includes(inv.status)

                              return (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-primary/10">
                                  {/* Primary action: Approve for pending, next step for others */}
                                  {inv.status === 'pending_approval' && (
                                    <button
                                      onClick={() => handleApproveOrder(inv.id)}
                                      disabled={approvingOrder === inv.id}
                                      className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                      {approvingOrder === inv.id ? 'Approving...' : 'Approve & Send Invoice'}
                                    </button>
                                  )}
                                  {nextStatus && inv.status !== 'pending_approval' && (
                                    <button
                                      onClick={() => handleStatusUpdate(inv.id, nextStatus)}
                                      disabled={updatingStatus === inv.id}
                                      className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 transition-colors ${
                                        nextStatus === 'paid' ? 'bg-green-600 hover:bg-green-700'
                                        : nextStatus === 'shipped' ? 'bg-blue-600 hover:bg-blue-700'
                                        : nextStatus === 'fulfilled' ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-brand-primary hover:bg-brand-primaryHover'
                                      }`}
                                    >
                                      {updatingStatus === inv.id ? '...' : `Mark ${LABELS[nextStatus] || nextStatus}`}
                                    </button>
                                  )}
                                  {/* Move to — forward skip OR backward rollback */}
                                  {moveTargets.length > 0 && (
                                    <select
                                      disabled={updatingStatus === inv.id || approvingOrder === inv.id}
                                      value=""
                                      onChange={(e) => {
                                        const target = e.target.value
                                        if (!target) return
                                        const targetIdx = PIPELINE.indexOf(target)
                                        const goingBack = currentIdx >= 0 && targetIdx >= 0 && targetIdx < currentIdx
                                        const note = goingBack
                                          ? `Rolling back to "${LABELS[target]}". Timestamps for later stages will be cleared.`
                                          : inv.status === 'pending_approval'
                                            ? `This will NOT create a QuickBooks invoice or send approval emails.\nUse this when the order was already handled manually.`
                                            : `All skipped stage timestamps will be set automatically.`
                                        if (confirm(`Move to "${LABELS[target]}"?\n\n${note}`)) {
                                          handleStatusUpdate(inv.id, target)
                                        }
                                        e.target.value = ''
                                      }}
                                      className="px-3 py-2 text-sm rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary cursor-pointer disabled:opacity-50 transition-colors hover:bg-brand-primary/10"
                                    >
                                      <option value="">Move to…</option>
                                      {moveTargets.map(s => {
                                        const targetIdx = PIPELINE.indexOf(s)
                                        const isBack = currentIdx >= 0 && targetIdx >= 0 && targetIdx < currentIdx
                                        return <option key={s} value={s}>{isBack ? '← ' : ''}{LABELS[s] || s}</option>
                                      })}
                                      {!isTerminal && <option value="cancelled">Cancel</option>}
                                    </select>
                                  )}
                                  {!isTerminal && (
                                    <button
                                      onClick={() => { if (confirm('Cancel this order?')) handleStatusUpdate(inv.id, 'cancelled') }}
                                      disabled={updatingStatus === inv.id}
                                      className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                      Cancel Order
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {filteredOrders.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-brand-primary/40">No orders match this filter.</div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Cron Jobs Health */}
          <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg text-brand-primary">System Cron Jobs</h2>
                <p className="text-xs text-brand-primary/50 mt-0.5">Automated background tasks</p>
              </div>
              <button
                onClick={fetchCronStatuses}
                disabled={cronLoading}
                className="text-xs text-brand-primary/60 hover:text-brand-primary disabled:opacity-50"
              >
                {cronLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {cronStatuses.length === 0 ? (
              <p className="text-sm text-brand-primary/40 py-4">
                {cronLoading ? 'Loading cron status...' : 'No cron data yet — runs will appear after the first execution.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cronStatuses.map((cron) => {
                  const healthColors = {
                    healthy: 'bg-green-50 border-green-200',
                    stale: 'bg-yellow-50 border-yellow-200',
                    error: 'bg-red-50 border-red-200',
                    never_run: 'bg-gray-50 border-gray-200',
                  }
                  const dotColors = {
                    healthy: 'bg-green-500',
                    stale: 'bg-yellow-500',
                    error: 'bg-red-500',
                    never_run: 'bg-gray-400',
                  }
                  const labelMap: Record<string, string> = {
                    'siphox-fulfillment': 'SiPhox Fulfillment',
                    'siphox-results': 'SiPhox Results',
                    'approve-commissions': 'Commission Approval',
                    'update-tiers': 'Tier Recalculation',
                    'asher-sync': 'Asher Med Sync',
                    'siphox-status-sync': 'SiPhox Status Sync',
                    'stale-orders': 'Stale Order Alerts',
                  }

                  return (
                    <div
                      key={cron.name}
                      className={`rounded-lg border p-3 ${healthColors[cron.health]}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${dotColors[cron.health]}`} />
                        <span className="text-sm font-medium text-brand-primary">
                          {labelMap[cron.name] || cron.name}
                        </span>
                      </div>
                      <p className="text-xs text-brand-primary/50">{cron.schedule}</p>
                      {cron.lastRun ? (
                        <div className="mt-2 text-xs text-brand-primary/60">
                          <p>
                            Last: {new Date(cron.lastRun.startedAt).toLocaleString()}
                          </p>
                          {cron.lastRun.durationMs != null && (
                            <p>{cron.lastRun.durationMs < 1000 ? `${cron.lastRun.durationMs}ms` : `${(cron.lastRun.durationMs / 1000).toFixed(1)}s`}</p>
                          )}
                          {cron.lastRun.error && (
                            <p className="text-red-600 mt-1 truncate" title={cron.lastRun.error}>
                              {cron.lastRun.error}
                            </p>
                          )}
                          {cron.lastRun.result && !cron.lastRun.error && (
                            <p className="text-green-700 mt-1 truncate" title={JSON.stringify(cron.lastRun.result)}>
                              {Object.entries(cron.lastRun.result).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-brand-primary/40">Never run</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </>
      )}
    </div>
  )
}
