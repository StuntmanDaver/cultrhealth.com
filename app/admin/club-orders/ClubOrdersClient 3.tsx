'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

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
  qb_invoice_id: string | null
  qb_invoice_url: string | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending_approval: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { label: 'Approved', bg: 'bg-blue-100', text: 'text-blue-800' },
  invoice_sent: { label: 'Invoice Sent', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  paid: { label: 'Paid', bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
}

export default function ClubOrdersClient() {
  const [orders, setOrders] = useState<ClubOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/club-orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')
      setOrders(data.orders || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function handleApprove(orderId: string) {
    if (!confirm('Approve this order? This will create a QuickBooks invoice and email the customer.')) return

    setApprovingId(orderId)
    try {
      const res = await fetch(`/api/admin/club-orders/${orderId}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve order')

      // Refresh orders
      await fetchOrders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Club Orders</h1>
              <p className="text-sm text-gray-500">
                {orders.length} order{orders.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && orders.length === 0 && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && !error && (
          <div className="text-center py-20 bg-white rounded-xl border">
            <p className="text-gray-500">No club orders yet.</p>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden">
            {orders.map((order) => {
              const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pending_approval
              const isExpanded = expandedId === order.id
              const isApproving = approvingId === order.id

              return (
                <div key={order.id} className="border-b last:border-b-0">
                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-500">{order.order_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{order.member_name}</p>
                      <p className="text-xs text-gray-500">{order.member_email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">
                        {order.subtotal_usd ? `$${Number(order.subtotal_usd).toFixed(2)}` : 'TBD'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-0 bg-gray-50/50">
                      {/* Items */}
                      <div className="bg-white rounded-lg border p-4 mb-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="text-left pb-2 font-medium">Therapy</th>
                              <th className="text-center pb-2 font-medium">Qty</th>
                              <th className="text-right pb-2 font-medium">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items as OrderItem[]).map((item, idx) => (
                              <tr key={idx} className="border-b last:border-b-0">
                                <td className="py-2">{item.name}</td>
                                <td className="py-2 text-center">{item.quantity}</td>
                                <td className="py-2 text-right">
                                  {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : (item.pricingNote || 'TBD')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Customer Info */}
                      {order.member_phone && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Phone:</strong> {order.member_phone}
                        </p>
                      )}
                      {order.notes && (
                        <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-sm">
                          <strong>Customer Notes:</strong> {order.notes}
                        </div>
                      )}

                      {/* QB Info */}
                      {order.qb_invoice_id && (
                        <p className="text-sm text-gray-600 mb-4">
                          <strong>QuickBooks Invoice:</strong> {order.qb_invoice_id}
                          {order.qb_invoice_url && (
                            <a href={order.qb_invoice_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                              View Invoice
                            </a>
                          )}
                        </p>
                      )}

                      {/* Actions */}
                      {order.status === 'pending_approval' && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(order.id)
                            }}
                            disabled={isApproving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                          >
                            {isApproving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            {isApproving ? 'Approving...' : 'Approve & Send Invoice'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
