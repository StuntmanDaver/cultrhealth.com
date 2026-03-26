'use client'

import { useState, useEffect, useCallback } from 'react'
import PrelaunchCodesSection from '@/components/admin/PrelaunchCodesSection'
import { downloadCSV, formatCurrency, formatDate, filterByDateRange, INTERNAL_COUPON_LABELS } from '@/lib/admin-utils'
import type { AnalyticsData } from '@/lib/admin-types'

export default function CouponsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)
  // Date range filters
  const [tableStartDate, setTableStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [tableEndDate, setTableEndDate] = useState(() => new Date().toISOString().split('T')[0])
  // Search
  const [linkSearch, setLinkSearch] = useState('')
  const [couponSearch, setCouponSearch] = useState('')
  // Coupon create
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: '', discount_value: '10', code_type: 'membership' })
  const [creatingCoupon, setCreatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Sync date range when periodDays changes
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - periodDays)
    setTableStartDate(start.toISOString().split('T')[0])
    setTableEndDate(end.toISOString().split('T')[0])
  }, [periodDays])

  const fetchAnalytics = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?days=${periodDays}`)
      .then(r => r.json())
      .then(result => { if (result.data) setData(result.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [periodDays])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

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

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Coupons & Links</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Coupons & Links</h1>
        <p className="text-brand-primary/60">Failed to load data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Coupons & Links</h1>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
      </div>

      {/* Coupon Performance */}
      {data.coupons && data.coupons.coupons.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
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
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
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

      {/* All Tracking Links */}
      {data.allTrackingLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-xl text-brand-primary">All Tracking Links</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={exportTrackingLinks} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-brand-primary/50">From</label>
                <input type="date" value={tableStartDate} onChange={(e) => setTableStartDate(e.target.value)} className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-brand-primary/50">To</label>
                <input type="date" value={tableEndDate} onChange={(e) => setTableEndDate(e.target.value)} className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
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
                {filterByDateRange(data.allTrackingLinks, tableStartDate, tableEndDate)
                  .filter(l => !linkSearch || l.slug.toLowerCase().includes(linkSearch.toLowerCase()) || (l.creator_name || '').toLowerCase().includes(linkSearch.toLowerCase()))
                  .map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                    <td className="py-3 px-4 text-sm font-mono text-brand-primary">/r/{l.slug}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary">{l.creator_name || '\u2014'}</td>
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
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-xl text-brand-primary">All Coupon Codes</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={exportCoupons} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
              <button
                onClick={() => { setShowCouponForm(!showCouponForm); setCouponError(null) }}
                className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primaryHover transition-colors"
              >
                {showCouponForm ? 'Cancel' : '+ Create Coupon'}
              </button>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-brand-primary/50">From</label>
                <input type="date" value={tableStartDate} onChange={(e) => setTableStartDate(e.target.value)} className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-brand-primary/50">To</label>
                <input type="date" value={tableEndDate} onChange={(e) => setTableEndDate(e.target.value)} className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
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
            <span className="px-3 py-1 bg-yellow-50 rounded-full text-sm text-yellow-700">Club: {data.allCouponCodes.filter(c => c.code_type === 'club' || c.program_type === 'club').length}</span>
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
                {filterByDateRange(data.allCouponCodes, tableStartDate, tableEndDate)
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
                      <td className="py-3 px-4 text-sm text-brand-primary">{c.stripe_promotion_code_id ? '\u2713' : '\u2014'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCoupon(c.id, c.active)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${c.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-primary/60">{c.expires_at ? formatDate(c.expires_at) : '\u2014'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
