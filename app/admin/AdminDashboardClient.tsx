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
import { PIPELINE_LABELS } from '@/lib/admin-club-orders'
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
  const [exportingVisitors, setExportingVisitors] = useState(false)
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

  const handleVisitorExport = useCallback(async () => {
    setExportingVisitors(true)
    try {
      const response = await fetch(`/api/admin/qr-scans/export?days=${periodDays}`)
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Failed to export visitor CSV')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition')
      const filenameMatch = disposition?.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] || `cultr-visitor-events-${periodDays}d.csv`

      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export visitor CSV')
    } finally {
      setExportingVisitors(false)
    }
  }, [periodDays])

  useEffect(() => {
    fetchAnalytics()
    fetchCronStatuses()
  }, [fetchAnalytics, fetchCronStatuses])

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
            onClick={handleVisitorExport}
            disabled={exportingVisitors}
            className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors disabled:opacity-50 text-sm"
          >
            {exportingVisitors ? 'Exporting...' : 'Export Visitor CSV'}
          </button>
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

          {/* Inventory Alerts */}
          {data.inventoryAlerts && data.inventoryAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <h2 className="font-display text-lg text-amber-900">Inventory Alerts</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-800">
                    {data.inventoryAlerts.length}
                  </span>
                </div>
                <Link href="/admin/inventory" className="text-sm text-amber-700 hover:text-amber-900 underline">
                  Manage inventory →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.inventoryAlerts.map((item) => {
                  const isOut = item.stockStatus === 'out_of_stock'
                  const isSoon = item.stockStatus === 'restocking_soon'
                  return (
                    <div
                      key={item.therapyId}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                        isSoon
                          ? 'bg-blue-100 border border-blue-200'
                          : isOut
                            ? 'bg-red-100 border border-red-200'
                            : 'bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSoon ? 'text-blue-800' : isOut ? 'text-red-800' : 'text-amber-800'}`}>
                          {item.therapyName}
                        </p>
                        <p className={`text-xs ${isSoon ? 'text-blue-600' : isOut ? 'text-red-600' : 'text-amber-600'}`}>
                          {isSoon
                            ? 'Restocking Soon'
                            : isOut
                              ? 'Out of Stock'
                              : item.stockQuantity != null
                                ? `Only ${item.stockQuantity} left`
                                : 'Low Stock'}
                        </p>
                      </div>
                      <span className={`shrink-0 ml-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSoon
                          ? 'bg-blue-200 text-blue-800'
                          : isOut
                            ? 'bg-red-200 text-red-800'
                            : 'bg-amber-200 text-amber-800'
                      }`}>
                        {isSoon ? 'SOON' : isOut ? 'OUT' : 'LOW'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
          {(data.refundStats.total > 0 || Object.keys(data.bnplAdoption).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              { key: 'pending_approval', label: PIPELINE_LABELS.pending_approval || 'Pending Approval', color: 'yellow' },
              { key: 'approved', label: PIPELINE_LABELS.approved || 'Approved', color: 'blue' },
              { key: 'invoice_sent', label: PIPELINE_LABELS.invoice_sent || 'Invoiced', color: 'indigo' },
              { key: 'paid', label: PIPELINE_LABELS.paid || 'Paid', color: 'green' },
              { key: 'shipped', label: PIPELINE_LABELS.shipped || 'Shipped', color: 'blue' },
              { key: 'fulfilled', label: PIPELINE_LABELS.fulfilled || 'Fulfilled', color: 'emerald' },
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
                  <Link href="/admin/orders?type=club" className="text-sm text-brand-primary/60 hover:text-brand-primary underline">
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
              <a href="https://app.gethealthie.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg hover:bg-brand-primary/10 transition-colors text-sm">
                Healthie Dashboard →
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
                    'approve-commissions': 'Commission Approval',
                    'update-tiers': 'Tier Recalculation',
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
