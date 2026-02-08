'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Clock, CheckCircle, ArrowDown } from 'lucide-react'
import type { EarningsOverview, OrderAttribution, CommissionLedgerEntry } from '@/lib/config/affiliate'

function EarningsStat({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div>
          <p className="text-xs text-cultr-textMuted">{label}</p>
          <p className="text-lg font-bold text-cultr-forest">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsOverview | null>(null)
  const [orders, setOrders] = useState<OrderAttribution[]>([])
  const [ledger, setLedger] = useState<CommissionLedgerEntry[]>([])
  const [tab, setTab] = useState<'orders' | 'ledger'>('orders')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [earningsRes, ordersRes, ledgerRes] = await Promise.all([
          fetch('/api/creators/earnings/overview'),
          fetch('/api/creators/earnings/orders'),
          fetch('/api/creators/earnings/ledger'),
        ])

        if (earningsRes.ok) {
          const data = await earningsRes.json()
          setEarnings(data.earnings)
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || [])
        }
        if (ledgerRes.ok) {
          const data = await ledgerRes.json()
          setLedger(data.ledger || [])
        }
      } catch (err) {
        console.error('Failed to fetch earnings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-8 w-32 bg-stone-100 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Earnings</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Track your commissions and order attributions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EarningsStat
          label="Lifetime Earnings"
          value={fmt(earnings?.lifetimeEarnings ?? 0)}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-600"
        />
        <EarningsStat
          label="Pending"
          value={fmt(earnings?.pendingEarnings ?? 0)}
          icon={Clock}
          color="bg-amber-100 text-amber-600"
        />
        <EarningsStat
          label="Paid Out"
          value={fmt(earnings?.paidEarnings ?? 0)}
          icon={CheckCircle}
          color="bg-blue-100 text-blue-600"
        />
        <EarningsStat
          label="This Month"
          value={fmt(earnings?.thisMonthEarnings ?? 0)}
          icon={ArrowDown}
          color="bg-cultr-mint text-cultr-forest"
        />
      </div>

      {/* 30-day hold explainer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
        <p className="font-medium text-amber-800">30-Day Hold Period</p>
        <p className="text-amber-700 mt-1">
          Commissions are held for 30 days after the order date to account for refunds. After the hold period, they move to &quot;approved&quot; status and become eligible for payout.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('orders')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'orders'
                ? 'border-cultr-forest text-cultr-forest'
                : 'border-transparent text-cultr-textMuted hover:text-cultr-forest'
            }`}
          >
            Attributed Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'ledger'
                ? 'border-cultr-forest text-cultr-forest'
                : 'border-transparent text-cultr-textMuted hover:text-cultr-forest'
            }`}
          >
            Commission Ledger ({ledger.length})
          </button>
        </div>
      </div>

      {/* Table */}
      {tab === 'orders' ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Method</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Commission</th>
                  <th className="text-center py-3 px-4 font-medium text-cultr-textMuted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.length > 0 ? orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono text-xs">{o.order_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-xs">
                        {o.attribution_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{fmt(Number(o.net_revenue))}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {fmt(Number(o.direct_commission_amount))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        o.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : o.status === 'paid' ? 'bg-blue-100 text-blue-700'
                        : o.status === 'refunded' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cultr-textMuted text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-cultr-textMuted">
                      No attributed orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Base</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-cultr-textMuted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ledger.length > 0 ? ledger.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        e.commission_type === 'direct' ? 'bg-emerald-100 text-emerald-700'
                        : e.commission_type === 'override' ? 'bg-purple-100 text-purple-700'
                        : 'bg-stone-100 text-stone-700'
                      }`}>
                        {e.commission_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{fmt(Number(e.base_amount))}</td>
                    <td className="py-3 px-4 text-right">{Number(e.commission_rate)}%</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {fmt(Number(e.commission_amount))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : e.status === 'paid' ? 'bg-blue-100 text-blue-700'
                        : e.status === 'reversed' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cultr-textMuted text-xs">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-cultr-textMuted">
                      No commission entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
