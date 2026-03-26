'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Clock, Trophy, ChevronRight } from 'lucide-react'
import { getTierName } from '@/lib/config/affiliate'
import { downloadCSV, formatCurrency, formatDate, getStatusColor, filterByDateRange } from '@/lib/admin-utils'
import type { AnalyticsData, CreatorAdminRow } from '@/lib/admin-types'

export default function CreatorsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)
  // Creator search
  const [creatorSearch, setCreatorSearch] = useState('')
  // Date range filters
  const [tableStartDate, setTableStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [tableEndDate, setTableEndDate] = useState(() => new Date().toISOString().split('T')[0])
  // Creator edit modal
  const [editingCreator, setEditingCreator] = useState<CreatorAdminRow | null>(null)
  const [creatorEditForm, setCreatorEditForm] = useState({ commission_rate: '', override_rate: '', status: '' })
  const [savingCreator, setSavingCreator] = useState(false)
  const [creatorEditError, setCreatorEditError] = useState<string | null>(null)

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

  const exportCreators = useCallback(() => {
    if (!data) return
    downloadCSV('cultr-creators',
      ['Name', 'Email', 'Status', 'Tier', 'Commission %', 'Override %', 'Recruits', 'Codes', 'Revenue', 'Joined'],
      data.allCreators.map(c => [c.full_name, c.email, c.status, getTierName(c.tier), c.commission_rate, c.override_rate, c.recruit_count, c.code_count, c.total_code_revenue, c.created_at])
    )
  }, [data])

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

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Creator Network</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Creator Network</h1>
        <p className="text-brand-primary/60">Failed to load data.</p>
      </div>
    )
  }

  const filteredCreators = filterByDateRange(data.allCreators, tableStartDate, tableEndDate)
    .filter(c => c.full_name.toLowerCase().includes(creatorSearch.toLowerCase()) || c.email.toLowerCase().includes(creatorSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Creator Network</h1>
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

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/admin/creators/approvals"
          className="bg-white border border-brand-primary/10 rounded-xl p-5 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6 text-amber-600" />
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </div>
          <p className="font-medium text-brand-primary text-sm">Pending Approvals</p>
          <p className="text-xs text-brand-primary/60 mt-1">Review and approve creator applications</p>
        </Link>

        <Link
          href="/admin/creators/payouts"
          className="bg-white border border-brand-primary/10 rounded-xl p-5 hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </div>
          <p className="font-medium text-brand-primary text-sm">Payout Runs</p>
          <p className="text-xs text-brand-primary/60 mt-1">Create and manage payout batches</p>
        </Link>

        <Link
          href="/admin/creators/coupons"
          className="bg-white border border-brand-primary/10 rounded-xl p-5 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">🏷️</span>
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </div>
          <p className="font-medium text-brand-primary text-sm">Coupons & Links</p>
          <p className="text-xs text-brand-primary/60 mt-1">Manage coupon codes and tracking links</p>
        </Link>
      </div>

      {/* Creator Program Summary */}
      {data.creators && (data.creators.totalLifetime > 0 || Object.keys(data.creators.creatorsByStatus).length > 0) && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">Creator Program</h2>
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

      {/* Creator Network Table */}
      {data.allCreators.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-xl text-brand-primary">Creator Network</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={exportCreators} className="text-xs text-brand-primary/60 hover:text-brand-primary underline">Export CSV</button>
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
                {filteredCreators.map((c, i) => (
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

      {/* Creator ROI */}
      {data.creatorROI.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
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
  )
}
