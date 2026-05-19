'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Clock, Trophy, ChevronRight, UserPlus } from 'lucide-react'
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
  const [deletingCreator, setDeletingCreator] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Add creator modal
  const [showAddCreator, setShowAddCreator] = useState(false)
  const [addCreatorForm, setAddCreatorForm] = useState({ full_name: '', email: '', phone: '', social_handle: '', commission_rate: '10', custom_code: '', discount_percent: '10' })
  const [addingCreator, setAddingCreator] = useState(false)
  const [addCreatorError, setAddCreatorError] = useState<string | null>(null)
  const [addCreatorSuccess, setAddCreatorSuccess] = useState<string | null>(null)

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
      ['Name', 'Email', 'Phone', 'Social', 'Age', 'Gender', 'Status', 'Tier', 'Commission %', 'Override %', 'Recruits', 'Codes', 'Revenue', 'Joined'],
      data.allCreators.map(c => [c.full_name, c.email, c.phone || '', c.social_handle || '', c.age ?? '', c.gender || '', c.status, getTierName(c.tier), c.commission_rate, c.override_rate, c.recruit_count, c.code_count, c.total_code_revenue, c.created_at])
    )
  }, [data])

  async function handleDeleteCreator() {
    if (!editingCreator) return
    setDeletingCreator(true)
    setCreatorEditError(null)
    try {
      const res = await fetch(`/api/admin/creators/${editingCreator.id}/delete`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Delete failed')
      setEditingCreator(null)
      setConfirmDelete(false)
      fetchAnalytics()
    } catch (err) {
      setCreatorEditError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setDeletingCreator(false)
    }
  }

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

  async function handleAddCreator() {
    setAddingCreator(true)
    setAddCreatorError(null)
    setAddCreatorSuccess(null)
    try {
      const res = await fetch('/api/admin/creators/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: addCreatorForm.full_name,
          email: addCreatorForm.email,
          phone: addCreatorForm.phone || undefined,
          social_handle: addCreatorForm.social_handle || undefined,
          commission_rate: parseFloat(addCreatorForm.commission_rate),
          custom_code: addCreatorForm.custom_code || undefined,
          discount_percent: parseFloat(addCreatorForm.discount_percent),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to add creator')
      setAddCreatorSuccess(
        result.warning
          ? `Added ${result.message}. Codes: ${result.membershipCode}, ${result.productCode}. ${result.warning}`
          : `Added ${result.message}. Codes: ${result.membershipCode}, ${result.productCode}`
      )
      setAddCreatorForm({ full_name: '', email: '', phone: '', social_handle: '', commission_rate: '10', custom_code: '', discount_percent: '10' })
      fetchAnalytics()
    } catch (err) {
      setAddCreatorError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAddingCreator(false)
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
    .filter(c => {
      const q = creatorSearch.toLowerCase()
      return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.social_handle && c.social_handle.toLowerCase().includes(q))
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Creator Network</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAddCreator(true); setAddCreatorError(null); setAddCreatorSuccess(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Creator
          </button>
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
                placeholder="Search name, email, phone, social..."
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
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Contact</th>
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
                    <td className="py-3 px-4 text-sm">
                      <div className="text-brand-primary/60">{c.email}</div>
                      {c.phone && <div className="text-brand-primary/50 text-xs mt-0.5">{c.phone}</div>}
                      {c.social_handle && <div className="text-brand-primary/50 text-xs mt-0.5">{c.social_handle}</div>}
                    </td>
                    <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className="py-3 px-4 text-sm text-brand-primary">{getTierName(c.tier)}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{Number(c.commission_rate)}%</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary/60">{Number(c.override_rate)}%</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.recruit_count}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{c.code_count}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(Number(c.total_code_revenue))}</td>
                    <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(c.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => { window.location.href = `/api/admin/creators/${c.id}/impersonate` }}
                          className="text-xs text-brand-primary underline hover:text-brand-primaryHover"
                        >
                          Login As
                        </button>
                        <button
                          onClick={() => { setEditingCreator(c); setCreatorEditForm({ commission_rate: String(Number(c.commission_rate)), override_rate: String(Number(c.override_rate)), status: c.status }); setCreatorEditError(null); setConfirmDelete(false) }}
                          className="text-xs text-brand-primary underline hover:text-brand-primaryHover"
                        >
                          Edit
                        </button>
                      </div>
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
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-xl text-brand-primary">Creator ROI</h2>
            <span className="text-xs text-brand-primary/50">Last {periodDays} days</span>
          </div>
          <p className="text-xs text-brand-primary/50 mb-4">
            Gross = pre-discount revenue · Net Revenue = what customers paid · Business Net = Net Revenue − Commission paid
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-primary/10">
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Creator</th>
                  <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm" title="What customers would have paid without a coupon">Gross</th>
                  <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm" title="Customer discount dollars given">Discount</th>
                  <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm" title="Commission earned by the creator (excludes reversed)">Commission</th>
                  <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm" title="Net Revenue − Commission paid. Money that actually lands with the business.">Business Net</th>
                </tr>
              </thead>
              <tbody>
                {data.creatorROI.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                    <td className="py-3 px-4 text-sm font-medium text-brand-primary">{c.fullName}</td>
                    <td className="py-3 px-4 text-sm text-right text-brand-primary">{formatCurrency(c.grossRevenue)}</td>
                    <td className="py-3 px-4 text-sm text-right text-red-600">&minus;{formatCurrency(c.totalDiscountGiven)}</td>
                    <td className="py-3 px-4 text-sm text-right text-red-600">&minus;{formatCurrency(c.totalCommissionEarned)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={c.netBusinessImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {c.netBusinessImpact >= 0 ? '+' : ''}{formatCurrency(c.netBusinessImpact)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== ADD CREATOR MODAL ========== */}
      {showAddCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCreator(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">Add Creator</h3>
              <button onClick={() => setShowAddCreator(false)} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addCreatorForm.full_name}
                  onChange={(e) => setAddCreatorForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Hannah Goldy"
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Email *</label>
                <input
                  type="email"
                  value={addCreatorForm.email}
                  onChange={(e) => setAddCreatorForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="creator@example.com"
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addCreatorForm.phone}
                  onChange={(e) => setAddCreatorForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Social Handle</label>
                <input
                  type="text"
                  value={addCreatorForm.social_handle}
                  onChange={(e) => setAddCreatorForm(f => ({ ...f, social_handle: e.target.value }))}
                  placeholder="@handle"
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-primary/60 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={addCreatorForm.commission_rate}
                    onChange={(e) => setAddCreatorForm(f => ({ ...f, commission_rate: e.target.value }))}
                    min="0" max="50" step="0.5"
                    className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-primary/60 mb-1">Coupon Discount (%)</label>
                  <input
                    type="number"
                    value={addCreatorForm.discount_percent}
                    onChange={(e) => setAddCreatorForm(f => ({ ...f, discount_percent: e.target.value }))}
                    min="0" max="60" step="1"
                    className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Custom Coupon Code</label>
                <input
                  type="text"
                  value={addCreatorForm.custom_code}
                  onChange={(e) => setAddCreatorForm(f => ({ ...f, custom_code: e.target.value.toUpperCase() }))}
                  placeholder="Auto-generated from last name if blank"
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm uppercase"
                />
                <p className="text-xs text-brand-primary/40 mt-1">Two codes created: CODE (membership) + CODE10 (product)</p>
              </div>
            </div>

            {addCreatorError && <p className="mt-3 text-sm text-red-600">{addCreatorError}</p>}
            {addCreatorSuccess && <p className="mt-3 text-sm text-green-600">{addCreatorSuccess}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddCreator}
                disabled={addingCreator || !addCreatorForm.full_name.trim() || !addCreatorForm.email.trim()}
                className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
              >
                {addingCreator ? 'Adding...' : 'Add & Activate Creator'}
              </button>
              <button onClick={() => setShowAddCreator(false)} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CREATOR EDIT MODAL ========== */}
      {editingCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEditingCreator(null); setConfirmDelete(false) }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">
                Edit {editingCreator.full_name}
              </h3>
              <button onClick={() => { setEditingCreator(null); setConfirmDelete(false) }} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
            </div>

            {/* Contact & Profile Info */}
            <div className="bg-brand-cream/50 rounded-lg p-4 mb-4 space-y-2">
              <h4 className="text-xs font-semibold text-brand-primary/70 uppercase tracking-wide mb-2">Contact Info</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div>
                  <span className="text-brand-primary/50 text-xs">Email</span>
                  <p className="text-brand-primary truncate">{editingCreator.email}</p>
                </div>
                <div>
                  <span className="text-brand-primary/50 text-xs">Phone</span>
                  <p className="text-brand-primary">{editingCreator.phone || <span className="text-brand-primary/30 italic">Not provided</span>}</p>
                </div>
                <div>
                  <span className="text-brand-primary/50 text-xs">Social</span>
                  <p className="text-brand-primary">{editingCreator.social_handle || <span className="text-brand-primary/30 italic">Not provided</span>}</p>
                </div>
                <div>
                  <span className="text-brand-primary/50 text-xs">Payout Method</span>
                  <p className="text-brand-primary">{editingCreator.payout_method?.replace('_', ' ') || <span className="text-brand-primary/30 italic">Not set</span>}</p>
                </div>
                {(editingCreator.age || editingCreator.gender) && (
                  <>
                    {editingCreator.age && (
                      <div>
                        <span className="text-brand-primary/50 text-xs">Age</span>
                        <p className="text-brand-primary">{editingCreator.age}</p>
                      </div>
                    )}
                    {editingCreator.gender && (
                      <div>
                        <span className="text-brand-primary/50 text-xs">Gender</span>
                        <p className="text-brand-primary capitalize">{editingCreator.gender}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {editingCreator.bio && (
                <div className="mt-2 pt-2 border-t border-brand-primary/10">
                  <span className="text-brand-primary/50 text-xs">Bio</span>
                  <p className="text-sm text-brand-primary/80 line-clamp-3">{editingCreator.bio}</p>
                </div>
              )}
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
                disabled={savingCreator || deletingCreator}
                className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
              >
                {savingCreator ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditingCreator(null); setConfirmDelete(false) }} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                Cancel
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-primary/10">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full px-4 py-2.5 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50 transition-colors"
                >
                  Delete Creator
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 text-center">
                    Permanently delete <strong>{editingCreator.full_name}</strong> and all their data?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteCreator}
                      disabled={deletingCreator}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deletingCreator ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-4 py-2.5 text-brand-primary/60 border border-brand-primary/20 rounded-lg text-sm hover:text-brand-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
