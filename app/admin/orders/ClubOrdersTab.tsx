'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Loader2, RefreshCw, ChevronDown, ChevronUp, Package, Truck, CheckCircle2, Clock, FileText, DollarSign, CreditCard } from 'lucide-react'
import ClubOrderStageControls from '@/components/admin/ClubOrderStageControls'
import ClubOrderBulkActions from '@/components/admin/ClubOrderBulkActions'
import { ORDER_STATUS_STYLES } from '@/lib/admin-utils'

interface OrderItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  quantity: number
}

interface ClubOrder {
  id: string
  order_number: string
  member_name: string
  member_email: string
  member_phone: string | null
  items: OrderItem[]
  subtotal_usd: number | null
  notes: string | null
  status: string
  created_at: string
  approved_at: string | null
  paid_at: string | null
  shipped_at: string | null
  fulfilled_at: string | null
  qb_invoice_id: string | null
  qb_invoice_url: string | null
  coupon_code: string | null
  discount_percent: number | null
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  attributed_creator_id: string | null
  attribution_method: string | null
  creator_name: string | null
}

// Pipeline stages in order
const PIPELINE_STAGES = [
  { key: 'pending_approval', label: 'Pending', icon: Clock, color: 'yellow' },
  { key: 'approved', label: 'Approved', icon: Check, color: 'blue' },
  { key: 'invoice_sent', label: 'Invoiced', icon: FileText, color: 'indigo' },
  { key: 'needs_payment', label: 'Needs Payment', icon: CreditCard, color: 'orange' },
  { key: 'paid', label: 'Paid', icon: DollarSign, color: 'green' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'blue' },
  { key: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2, color: 'emerald' },
] as const

interface ClubOrdersTabProps {
  onPendingCountChange?: (count: number) => void
}

export default function ClubOrdersTab({ onPendingCountChange }: ClubOrdersTabProps) {
  const [orders, setOrders] = useState<ClubOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/club-orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')
      const fetched: ClubOrder[] = data.orders || []
      setOrders(fetched)
      onPendingCountChange?.(fetched.filter(o => o.status === 'pending_approval').length)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [onPendingCountChange])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // ── Approve action (existing) ──
  async function handleApprove(orderId: string) {
    if (!confirm('Approve this order? This will create a QuickBooks invoice and email the customer.')) return
    setApprovingId(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/approve`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve order')
      await fetchOrders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setApprovingId(null)
    }
  }

  // ── Status update action ──
  async function handleStatusUpdate(orderId: string, newStatus: string, extra?: { suppressEmails?: boolean; manualProcessed?: boolean }) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      await fetchOrders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Bulk Status update action ──
  async function handleBulkStatusUpdate(newStatus: string) {
    if (selectedOrders.size === 0) return
    const ids = Array.from(selectedOrders)
    setBulkUpdating(true)
    const results = await Promise.allSettled(
      ids.map(orderId =>
        fetch(`/api/admin/club-orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, suppressEmails: true }),
        }).then(res => {
          if (!res.ok) throw new Error('failed')
          return res
        })
      )
    )
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length
    setSelectedOrders(new Set())
    setBulkUpdating(false)
    if (failCount > 0) {
      alert(`${successCount} updated, ${failCount} failed`)
    }
    if (successCount > 0) {
      await fetchOrders()
    }
  }

  // ── Pipeline counts ──
  const counts: Record<string, number> = {}
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })

  // ── Filtered orders ──
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => {
        if (statusFilter === 'active') return !['fulfilled', 'rejected', 'cancelled', 'dismissed'].includes(o.status)
        return o.status === statusFilter
      })

  return (
    <div className="space-y-4">
      {/* ═══ Pipeline Visualization ═══ */}
      <div className="bg-white rounded-xl border border-brand-primary/10 p-5">
        <h3 className="text-sm font-medium text-brand-primary/60 uppercase tracking-wide mb-3">Fulfillment Pipeline</h3>
        <div className="flex items-center gap-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = counts[stage.key] || 0
            const Icon = stage.icon
            const colorMap: Record<string, string> = {
              yellow: count > 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
              indigo: count > 0 ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
              green: count > 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
              orange: count > 0 ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
              blue: count > 0 ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
              emerald: count > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-brand-primary/5 text-brand-primary/30 border-brand-primary/10',
            }
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => setStatusFilter(statusFilter === stage.key ? 'all' : stage.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium w-full transition-all ${colorMap[stage.color]} ${statusFilter === stage.key ? 'ring-2 ring-brand-primary/30 shadow-sm' : 'hover:shadow-sm'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate hidden sm:inline">{stage.label}</span>
                  <span className="font-bold ml-auto">{count}</span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="text-brand-primary/20 mx-0.5 shrink-0">&rarr;</div>
                )}
              </div>
            )
          })}
        </div>
        {/* Quick filters */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-primary/5">
          <span className="text-xs text-brand-primary/40">Filter:</span>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'cancelled', label: 'Cancelled' },
            { key: 'fulfilled', label: 'Completed' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-primary/5 text-brand-primary/50 hover:bg-brand-primary/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Sub-header ═══ */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-primary/60">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && <span className="ml-1 text-brand-primary/40">({statusFilter})</span>}
        </p>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-brand-primary/20 rounded-lg hover:bg-brand-cream transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && orders.length === 0 && (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary/30 mx-auto" />
        </div>
      )}

      {/* Empty */}
      {!loading && filteredOrders.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-xl border border-brand-primary/10">
          <Package className="w-10 h-10 text-brand-primary/20 mx-auto mb-3" />
          <p className="text-brand-primary/40">
            {statusFilter === 'all' ? 'No club orders yet.' : `No orders with status "${statusFilter}".`}
          </p>
        </div>
      )}

      {/* Bulk action bar */}
      <ClubOrderBulkActions
        selectedCount={selectedOrders.size}
        isBulkUpdating={bulkUpdating}
        onBulkMove={handleBulkStatusUpdate}
        onClearSelection={() => setSelectedOrders(new Set())}
      />

      {/* ═══ Orders List ═══ */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 overflow-hidden">
          {/* Select all header */}
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

          {filteredOrders.map((order) => {
            const statusStyle = ORDER_STATUS_STYLES[order.status] || { label: order.status, bg: 'bg-gray-100', text: 'text-gray-600' }
            const isExpanded = expandedId === order.id
            const isApproving = approvingId === order.id
            const isUpdating = updatingId === order.id
            const isSelected = selectedOrders.has(order.id)

            return (
              <div key={order.id} className={`border-b border-brand-primary/10 last:border-b-0 ${isSelected ? 'bg-amber-50/50' : ''}`}>
                {/* Row */}
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-brand-cream/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      const next = new Set(selectedOrders)
                      if (e.target.checked) next.add(order.id)
                      else next.delete(order.id)
                      setSelectedOrders(next)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary/20 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-brand-primary/50">{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      {order.coupon_code && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          {order.coupon_code}
                        </span>
                      )}
                      {order.tracking_number && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {order.tracking_carrier} {order.tracking_number}
                        </span>
                      )}
                      {(() => {
                        if (['fulfilled', 'rejected', 'cancelled', 'dismissed'].includes(order.status)) return null
                        const latestTs = order.shipped_at || order.paid_at || order.approved_at || order.created_at
                        const hoursStale = (Date.now() - new Date(latestTs).getTime()) / (1000 * 60 * 60)
                        if (hoursStale < 48) return null
                        const days = Math.floor(hoursStale / 24)
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${hoursStale > 96 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {days}d stale
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-sm font-medium text-brand-primary mt-1">{order.member_name}</p>
                    <p className="text-xs text-brand-primary/50">{order.member_email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-brand-primary">
                      {order.subtotal_usd ? `$${Number(order.subtotal_usd).toFixed(2)}` : 'TBD'}
                    </p>
                    <p className="text-xs text-brand-primary/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-brand-primary/30" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-brand-primary/30" />
                    )}
                  </div>
                </div>

                {/* ═══ Expanded Detail ═══ */}
                {isExpanded && (
                  <div className="px-6 pb-5 pt-0 bg-brand-cream/20">
                    {/* Items */}
                    <div className="bg-white rounded-lg border border-brand-primary/10 p-4 mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-brand-primary/10 text-brand-primary/50">
                            <th className="text-left pb-2 font-medium">Therapy</th>
                            <th className="text-center pb-2 font-medium">Qty</th>
                            <th className="text-right pb-2 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(order.items as OrderItem[]).map((item, idx) => (
                            <tr key={idx} className="border-b border-brand-primary/5 last:border-b-0">
                              <td className="py-2 text-brand-primary">{item.name}</td>
                              <td className="py-2 text-center text-brand-primary/60">{item.quantity}</td>
                              <td className="py-2 text-right text-brand-primary/60">
                                {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Customer Info */}
                    {order.member_phone && (
                      <p className="text-sm text-brand-primary/70 mb-2">
                        <strong className="text-brand-primary">Phone:</strong> {order.member_phone}
                      </p>
                    )}
                    {order.coupon_code && (
                      <p className="text-sm text-brand-primary/70 mb-2">
                        <strong className="text-brand-primary">Coupon:</strong>{' '}
                        <span className="font-mono bg-brand-cream px-2 py-0.5 rounded text-xs">{order.coupon_code}</span>
                        {order.discount_percent ? ` (${order.discount_percent}% off)` : ''}
                        {order.attributed_creator_id && (
                          <span className="ml-2 text-purple-600 text-xs font-medium">
                            Creator referral{order.creator_name ? ` (${order.creator_name})` : ''}
                          </span>
                        )}
                      </p>
                    )}
                    {order.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-sm">
                        <strong>Customer Notes:</strong> {order.notes}
                      </div>
                    )}

                    {/* QB Info */}
                    {order.qb_invoice_id && (
                      <p className="text-sm text-brand-primary/70 mb-4">
                        <strong className="text-brand-primary">QuickBooks Invoice:</strong> {order.qb_invoice_id}
                        {order.qb_invoice_url && (
                          <a href={order.qb_invoice_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                            View Invoice
                          </a>
                        )}
                      </p>
                    )}

                    {/* Tracking Info */}
                    {order.tracking_number && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                        <strong className="text-brand-primary">Shipping:</strong>{' '}
                        {order.tracking_carrier} — {order.tracking_number}
                        {order.tracking_url && (
                          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                            Track Package
                          </a>
                        )}
                      </div>
                    )}

                    {/* ═══ Timeline + Activity Log ═══ */}
                    <div className="bg-white rounded-lg border border-brand-primary/10 p-4 mb-4">
                      <h4 className="text-xs font-medium text-brand-primary/50 uppercase tracking-wide mb-3">Timeline</h4>
                      <div className="space-y-2">
                        <TimelineStep label="Order Placed" timestamp={order.created_at} active />
                        <TimelineStep label="Approved" timestamp={order.approved_at} active={!!order.approved_at} />
                        <TimelineStep
                          label="Invoice Sent"
                          timestamp={order.status === 'invoice_sent' || order.paid_at || order.shipped_at || order.fulfilled_at ? order.approved_at : null}
                          active={['invoice_sent', 'needs_payment', 'paid', 'shipped', 'fulfilled'].includes(order.status)}
                        />
                        <TimelineStep
                          label="Needs Payment"
                          timestamp={null}
                          active={['needs_payment', 'paid', 'shipped', 'fulfilled'].includes(order.status)}
                        />
                        <TimelineStep label="Paid" timestamp={order.paid_at} active={!!order.paid_at} />
                        <TimelineStep label="Shipped" timestamp={order.shipped_at} active={!!order.shipped_at} />
                        <TimelineStep label="Fulfilled" timestamp={order.fulfilled_at} active={!!order.fulfilled_at} />
                      </div>
                      {/* Activity log (audit trail) */}
                      <ActivityLog orderId={order.id} refreshKey={order.status} />
                    </div>

                    {/* ═══ Context-Aware Actions ═══ */}
                    <div className="mt-4 pt-4 border-t border-brand-primary/10">
                      <ClubOrderStageControls
                        orderId={order.id}
                        currentStatus={order.status}
                        isApproving={isApproving}
                        isUpdating={isUpdating}
                        onApprove={handleApprove}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Timeline Step Component ──
function TimelineStep({ label, timestamp, active }: { label: string; timestamp: string | null; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-green-500' : 'bg-brand-primary/15'}`} />
      <span className={`text-sm ${active ? 'text-brand-primary font-medium' : 'text-brand-primary/30'}`}>
        {label}
      </span>
      {timestamp && (
        <span className="text-xs text-brand-primary/40 ml-auto">
          {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}

// ── Activity Log Component (audit trail, loads on demand) ──
interface ActivityEntry {
  id: string
  admin_email: string
  action_type: string
  reason: string | null
  metadata: { from?: string; to?: string; method?: string; carrier?: string; trackingNumber?: string } | null
  created_at: string
}

function ActivityLog({ orderId, refreshKey }: { orderId: string; refreshKey?: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/activity`)
      const data = await res.json()
      if (res.ok) setEntries(data.entries || [])
    } catch {
      // non-critical
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  useEffect(() => { load() }, [orderId, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p className="text-xs text-brand-primary/30 mt-3 pt-3 border-t border-brand-primary/5">Loading activity...</p>
  if (loaded && entries.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-brand-primary/5">
      <h5 className="text-xs font-medium text-brand-primary/40 uppercase tracking-wide mb-2">Activity Log</h5>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-2 text-xs">
            <span className="text-brand-primary/30 shrink-0 w-28">
              {new Date(e.created_at).toLocaleDateString()} {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-brand-primary/60">
              {e.reason || e.action_type}
              <span className="text-brand-primary/30"> — {e.admin_email === 'email_link' ? 'via email' : e.admin_email}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
