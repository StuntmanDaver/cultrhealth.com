'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AnalyticsData, OrderSearchData, SearchOrderRow } from '@/lib/admin-types'
import { downloadCSV, formatDate, formatCurrency, getStatusColor, ORDER_STATUS_STYLES } from '@/lib/admin-utils'
import ClubOrdersTab from './ClubOrdersTab'

function getStatusLabel(status: string) {
  return ORDER_STATUS_STYLES[status]?.label || status
}

export default function OrdersClient() {
  // --------------- Type Filter (replaces activeTab) ---------------
  const searchParams = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'club'>(() => {
    const tab = searchParams.get('tab')
    const type = searchParams.get('type')
    if (tab === 'club-orders' || type === 'club') return 'club'
    if (type === 'product') return 'product'
    return 'all'
  })
  const [pendingCount, setPendingCount] = useState(0)

  // --------------- Analytics Data (product orders) ---------------
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)

  // --------------- Product Order Search State ---------------
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [orderDateFrom, setOrderDateFrom] = useState('')
  const [orderDateTo, setOrderDateTo] = useState('')
  const [orderPage, setOrderPage] = useState(1)
  const [orderData, setOrderData] = useState<OrderSearchData | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)

  // --------------- Product Order Fulfill Modal ---------------
  const [selectedOrder, setSelectedOrder] = useState<SearchOrderRow | null>(null)
  const [fulfillAction, setFulfillAction] = useState<'ship' | 'fulfill' | null>(null)
  const [fulfillForm, setFulfillForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' })
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfillError, setFulfillError] = useState<string | null>(null)

  // --------------- URL Sync (typeFilter → URL) ---------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.delete('tab') // migrate legacy ?tab=club-orders param
    if (typeFilter === 'club') {
      url.searchParams.set('type', 'club')
    } else if (typeFilter === 'product') {
      url.searchParams.set('type', 'product')
    } else {
      url.searchParams.delete('type')
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [typeFilter])

  // --------------- URL Sync (URL → typeFilter, e.g. browser back/forward) ---------------
  useEffect(() => {
    const tab = searchParams.get('tab')
    const type = searchParams.get('type')
    let requested: 'all' | 'product' | 'club' = 'all'
    if (tab === 'club-orders' || type === 'club') requested = 'club'
    else if (type === 'product') requested = 'product'
    setTypeFilter(current => current === requested ? current : requested)
  }, [searchParams])

  // --------------- Pending Count (for Club pill badge) ---------------
  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/club-orders')
      const result = await res.json()
      const orders = result.orders || []
      setPendingCount(orders.filter((o: { status: string }) => o.status === 'pending_approval').length)
    } catch {
      // non-critical
    }
  }, [])

  // --------------- Fetch Analytics ---------------
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
    refreshPendingCount()
  }, [fetchAnalytics, refreshPendingCount])

  // --------------- Fetch Product Orders ---------------
  const fetchOrders = useCallback(async (searchQ?: string, statusF?: string, dateF?: string, dateT?: string, pg?: number) => {
    setOrderLoading(true)
    try {
      const params = new URLSearchParams()
      const q = searchQ ?? orderSearch
      const s = statusF ?? orderStatusFilter
      const df = dateF ?? orderDateFrom
      const dt = dateT ?? orderDateTo
      const p = pg ?? orderPage
      if (q) params.set('q', q)
      if (s) params.set('status', s)
      if (df) params.set('dateFrom', df)
      if (dt) params.set('dateTo', dt)
      params.set('page', String(p))
      params.set('limit', '20')
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const result = await res.json()
      if (res.ok && result.data) {
        setOrderData(result.data)
      }
    } catch {
      // silent — order search is non-critical
    } finally {
      setOrderLoading(false)
    }
  }, [orderSearch, orderStatusFilter, orderDateFrom, orderDateTo, orderPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderPage(1)
      fetchOrders(orderSearch, orderStatusFilter, orderDateFrom, orderDateTo, 1)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSearch, orderStatusFilter, orderDateFrom, orderDateTo])

  useEffect(() => {
    if (orderPage > 1) {
      fetchOrders(orderSearch, orderStatusFilter, orderDateFrom, orderDateTo, orderPage)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderPage])

  // --------------- CSV Export ---------------
  const exportOrders = useCallback(() => {
    const rows = (orderData?.orders ?? data?.sales.recentOrders ?? []).filter(
      o => !('source' in o) || (o as SearchOrderRow).source !== 'club_orders'
    )
    if (rows.length > 0) {
      downloadCSV('cultr-product-orders',
        ['Order #', 'Customer', 'Status', 'Amount', 'Date'],
        rows.map(o => [o.order_number, o.customer_email, o.status, o.total_amount, o.created_at])
      )
    }
  }, [data, orderData])

  // --------------- Product Order Fulfillment ---------------
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
      fetchOrders()
    } catch (err) {
      setFulfillError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setFulfilling(false)
    }
  }

  // Product orders only — exclude club orders from this section (club orders are managed above)
  const productOrders = (orderData?.orders ?? data?.sales.recentOrders ?? []).filter(
    o => !('source' in o) || (o as SearchOrderRow).source !== 'club_orders'
  )

  const showClub = typeFilter !== 'product'
  const showProduct = typeFilter !== 'club'

  return (
    <div className="space-y-6">
      {/* ── Header + Type Filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-brand-primary">Orders</h1>
        <div className="flex items-center gap-4">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-brand-cream/60 rounded-lg p-1">
            {([
              { key: 'all',     label: 'All Orders' },
              { key: 'club',    label: 'Club Orders' },
              { key: 'product', label: 'Product Orders' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  typeFilter === key
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-primary/60 hover:text-brand-primary hover:bg-white/50'
                }`}
              >
                {label}
                {key === 'club' && pendingCount > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                    typeFilter === 'club' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Period selector — only for product analytics */}
          {showProduct && (
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
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CLUB ORDERS SECTION
          Self-contained: pipeline, list, bulk actions, QB, timeline, activity
      ══════════════════════════════════════ */}
      {showClub && (
        <ClubOrdersTab onPendingCountChange={setPendingCount} />
      )}

      {/* ══════════════════════════════════════
          PRODUCT ORDERS SECTION
          Analytics + search table + fulfill modal
      ══════════════════════════════════════ */}
      {showProduct && (
        <>
          {loading && (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
            </div>
          )}

          {!loading && !data && (
            <p className="text-brand-primary/60">Failed to load analytics.</p>
          )}

          {!loading && data && <>

            {/* ── Orders by Status ── */}
            {Object.keys(data.sales.ordersByStatus).length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
                <h2 className="font-display text-xl text-brand-primary mb-4">
                  {typeFilter === 'all' ? 'Product ' : ''}Orders by Status
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(data.sales.ordersByStatus).map(([status, count]) => (
                    <span
                      key={status}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                    >
                      {getStatusLabel(status)}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top Products ── */}
            {data.sales.topProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
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

            {/* ── Product Order Search ── */}
            <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl text-brand-primary">
                  {typeFilter === 'all' ? 'Product ' : ''}Order Search
                </h2>
                <button onClick={exportOrders} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">
                  Export CSV
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search by order # or email..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-brand-primary/50">From</label>
                  <input
                    type="date"
                    value={orderDateFrom}
                    onChange={(e) => setOrderDateFrom(e.target.value)}
                    className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-brand-primary/50">To</label>
                  <input
                    type="date"
                    value={orderDateTo}
                    onChange={(e) => setOrderDateTo(e.target.value)}
                    className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Results summary */}
              {orderData && (
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-brand-primary/60">
                  <span>{productOrders.length} order{productOrders.length !== 1 ? 's' : ''} found</span>
                  {orderData.totalPages > 1 && (
                    <span>Page {orderData.page} of {orderData.totalPages}</span>
                  )}
                </div>
              )}

              {/* Table */}
              {orderLoading && !orderData ? (
                <div className="py-12 text-center text-brand-primary/40">Loading orders...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-primary/10">
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Order #</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Customer</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Status</th>
                        <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Amount</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Date</th>
                        <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productOrders.map((order, index) => (
                        <tr
                          key={`${order.id}-${index}`}
                          className={`${index % 2 === 0 ? 'bg-brand-cream/30' : ''} cursor-pointer hover:bg-brand-primary/5 transition-colors`}
                          onClick={() => setSelectedOrder(order as SearchOrderRow)}
                        >
                          <td className="py-3 px-4 text-brand-primary font-mono text-sm">{order.order_number}</td>
                          <td className="py-3 px-4 text-sm">
                            {'customer_name' in order && (order as SearchOrderRow).customer_name && (
                              <div className="text-brand-primary font-medium">{(order as SearchOrderRow).customer_name}</div>
                            )}
                            <div className="text-brand-primary/60">{order.customer_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-brand-primary text-right font-medium text-sm">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-brand-primary/60 text-sm">{formatDate(order.created_at)}</td>
                          <td className="py-3 px-4">
                            {order.status === 'paid' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrder(order as SearchOrderRow)
                                  setFulfillAction('ship')
                                }}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                              >
                                Ship
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {productOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-brand-primary/40 text-sm">
                            No orders found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {orderData && orderData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-primary/10">
                  <span className="text-sm text-brand-primary/60">
                    Showing {((orderData.page - 1) * 20) + 1}–{Math.min(orderData.page * 20, orderData.total)} of {orderData.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                      disabled={orderData.page <= 1}
                      className="px-3 py-1.5 text-sm border border-brand-primary/20 rounded-lg hover:bg-brand-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-brand-primary/60 px-2">
                      {orderData.page} / {orderData.totalPages}
                    </span>
                    <button
                      onClick={() => setOrderPage(p => Math.min(orderData.totalPages, p + 1))}
                      disabled={orderData.page >= orderData.totalPages}
                      className="px-3 py-1.5 text-sm border border-brand-primary/20 rounded-lg hover:bg-brand-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>}
        </>
      )}

      {/* ══════════════════════════════════════
          PRODUCT ORDER DETAIL MODAL
          Simple ship/fulfill for Stripe product orders
      ══════════════════════════════════════ */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedOrder(null); setFulfillAction(null); setFulfillError(null) }}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">
                Order <span className="font-mono">{selectedOrder.order_number}</span>
              </h3>
              <button
                onClick={() => { setSelectedOrder(null); setFulfillAction(null) }}
                className="text-brand-primary/40 hover:text-brand-primary text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/60">Customer</span>
                <span className="text-brand-primary">{selectedOrder.customer_email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/60">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
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
    </div>
  )
}
