'use client'

import { useState, useEffect } from 'react'

interface PrelaunchCode {
  id: string
  code: string
  creator_id: string | null
  creator_name: string | null
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  expires_at: string | null
  program_type: string
  created_at: string
  actual_usage_count: number
  actual_total_revenue: number
  actual_total_discount: number
  actual_avg_order_value: number
}

interface PrelaunchRedemption {
  member_name: string
  member_email: string
  member_phone: string | null
  order_number: string
  subtotal_usd: number
  discount_percent: number
  status: string
  created_at: string
}

interface ActiveCreator {
  id: string
  full_name: string
}

interface PrelaunchStats {
  totalCodes: number
  activeCodes: number
  expiredCodes: number
  totalRedemptions: number
  totalRevenue: number
  totalDiscountGiven: number
}

interface PrelaunchCodesSectionProps {
  stats: PrelaunchStats
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
}

function getCodeStatus(code: PrelaunchCode): { label: string; bg: string } {
  if (!code.active) {
    return { label: 'Deactivated', bg: 'bg-red-100 text-red-800' }
  }
  if (code.expires_at && new Date(code.expires_at) <= new Date()) {
    return { label: 'Expired', bg: 'bg-amber-100 text-amber-800' }
  }
  return { label: 'Active', bg: 'bg-green-100 text-green-800' }
}

function getDaysRemaining(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `${days}d left`
}

export default function PrelaunchCodesSection({ stats, formatCurrency, formatDate }: PrelaunchCodesSectionProps) {
  const [codes, setCodes] = useState<PrelaunchCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [selectedCreatorId, setSelectedCreatorId] = useState('')
  const [activeCreators, setActiveCreators] = useState<ActiveCreator[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [redemptionModal, setRedemptionModal] = useState<{ codeId: string; code: string } | null>(null)
  const [redemptions, setRedemptions] = useState<PrelaunchRedemption[]>([])
  const [loadingRedemptions, setLoadingRedemptions] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [])

  useEffect(() => {
    if (showCreateForm && activeCreators.length === 0) {
      fetchActiveCreators()
    }
  }, [showCreateForm])

  async function fetchCodes() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/prelaunch-codes')
      const data = await res.json()
      if (res.ok) setCodes(data.codes || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function fetchActiveCreators() {
    try {
      const res = await fetch('/api/admin/creators/codes?list_active=true')
      if (res.ok) {
        const data = await res.json()
        setActiveCreators(data.creators || [])
      }
    } catch {
      // silently fail — dropdown stays empty
    }
  }

  async function handleCreate() {
    if (!newCode.trim()) return
    setCreating(true)
    setCreateError(null)

    try {
      const res = await fetch('/api/admin/prelaunch-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          creator_id: selectedCreatorId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create code')
        return
      }
      setNewCode('')
      setSelectedCreatorId('')
      setShowCreateForm(false)
      fetchCodes()
    } catch {
      setCreateError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeactivate(codeId: string) {
    try {
      const res = await fetch(`/api/admin/prelaunch-codes?code_id=${codeId}`, { method: 'DELETE' })
      if (res.ok) fetchCodes()
    } catch {
      // silently fail
    }
  }

  async function handleViewRedemptions(codeId: string, code: string) {
    setRedemptionModal({ codeId, code })
    setLoadingRedemptions(true)
    try {
      const res = await fetch(`/api/admin/prelaunch-codes/${codeId}/redemptions`)
      const data = await res.json()
      if (res.ok) setRedemptions(data.redemptions || [])
    } catch {
      setRedemptions([])
    } finally {
      setLoadingRedemptions(false)
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'paid': return 'bg-green-100 text-green-800'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-brand-primary/10 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-brand-primary">Prelaunch Codes</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primaryHover transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create Code'}
        </button>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-4 py-2 bg-green-50 rounded-full text-sm font-medium text-green-700">
          Active: {stats.activeCodes}
        </span>
        <span className="px-4 py-2 bg-amber-50 rounded-full text-sm font-medium text-amber-700">
          Expired: {stats.expiredCodes}
        </span>
        <span className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary">
          Redemptions: {stats.totalRedemptions}
        </span>
        <span className="px-4 py-2 bg-brand-cream rounded-full text-sm font-medium text-brand-primary">
          Revenue: {formatCurrency(stats.totalRevenue)}
        </span>
        <span className="px-4 py-2 bg-red-50 rounded-full text-sm font-medium text-red-700">
          Discounts: {formatCurrency(stats.totalDiscountGiven)}
        </span>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-brand-cream/50 rounded-lg p-4 mb-6 border border-brand-primary/10">
          <h3 className="text-sm font-medium text-brand-primary mb-3">New Prelaunch Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-brand-primary/60 mb-1">Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. SPRING20"
                className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-primary/60 mb-1">Assign to Creator (optional)</label>
              <select
                value={selectedCreatorId}
                onChange={(e) => setSelectedCreatorId(e.target.value)}
                className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">Company-owned</option>
                {activeCreators.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-primary/60 mb-1">Details</label>
              <div className="px-3 py-2 bg-white border border-brand-primary/10 rounded-lg text-sm text-brand-primary/60">
                20% off &middot; Expires in 14 days
              </div>
            </div>
            <div>
              <button
                onClick={handleCreate}
                disabled={creating || !newCode.trim()}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
          {createError && (
            <p className="mt-2 text-sm text-red-600">{createError}</p>
          )}
        </div>
      )}

      {/* Codes Table */}
      {loading ? (
        <p className="text-brand-primary/60 text-sm">Loading prelaunch codes...</p>
      ) : codes.length === 0 ? (
        <p className="text-brand-primary/60 text-sm">No prelaunch codes created yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-primary/10">
                <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Code</th>
                <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Assigned To</th>
                <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Discount</th>
                <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Uses</th>
                <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Revenue</th>
                <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Discount Given</th>
                <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Avg Order</th>
                <th className="text-center py-3 px-4 text-brand-primary/60 font-medium text-sm">Status</th>
                <th className="text-center py-3 px-4 text-brand-primary/60 font-medium text-sm">Expires</th>
                <th className="text-center py-3 px-4 text-brand-primary/60 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code, index) => {
                const status = getCodeStatus(code)
                return (
                  <tr key={code.id} className={index % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                    <td className="py-3 px-4 text-brand-primary font-mono text-sm font-medium">
                      {code.code}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {code.creator_name ? (
                        <span className="text-purple-700">{code.creator_name}</span>
                      ) : (
                        <span className="text-brand-primary/40">Company</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-brand-primary text-right text-sm">{code.discount_value}%</td>
                    <td className="py-3 px-4 text-brand-primary text-right text-sm font-medium">
                      {code.actual_usage_count}
                    </td>
                    <td className="py-3 px-4 text-brand-primary text-right text-sm">
                      {formatCurrency(code.actual_total_revenue)}
                    </td>
                    <td className="py-3 px-4 text-red-600 text-right text-sm">
                      {formatCurrency(code.actual_total_discount)}
                    </td>
                    <td className="py-3 px-4 text-brand-primary/60 text-right text-sm">
                      {formatCurrency(code.actual_avg_order_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-brand-primary/60">
                      {getDaysRemaining(code.expires_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewRedemptions(code.id, code.code)}
                          className="text-xs text-brand-primary underline hover:text-brand-primaryHover"
                        >
                          Redemptions
                        </button>
                        {code.active && (
                          <button
                            onClick={() => handleDeactivate(code.id)}
                            className="text-xs text-red-600 underline hover:text-red-800"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Redemption Modal */}
      {redemptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRedemptionModal(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">
                Redemptions for <span className="font-mono">{redemptionModal.code}</span>
              </h3>
              <button
                onClick={() => setRedemptionModal(null)}
                className="text-brand-primary/40 hover:text-brand-primary text-xl"
              >
                &times;
              </button>
            </div>

            {loadingRedemptions ? (
              <p className="text-brand-primary/60 text-sm">Loading...</p>
            ) : redemptions.length === 0 ? (
              <p className="text-brand-primary/60 text-sm">No redemptions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-primary/10">
                      <th className="text-left py-3 px-3 text-brand-primary/60 font-medium text-sm">Customer</th>
                      <th className="text-left py-3 px-3 text-brand-primary/60 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-3 text-brand-primary/60 font-medium text-sm">Phone</th>
                      <th className="text-left py-3 px-3 text-brand-primary/60 font-medium text-sm">Order #</th>
                      <th className="text-right py-3 px-3 text-brand-primary/60 font-medium text-sm">Amount</th>
                      <th className="text-center py-3 px-3 text-brand-primary/60 font-medium text-sm">Status</th>
                      <th className="text-right py-3 px-3 text-brand-primary/60 font-medium text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((r, i) => (
                      <tr key={r.order_number} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                        <td className="py-3 px-3 text-sm text-brand-primary font-medium">{r.member_name}</td>
                        <td className="py-3 px-3 text-sm text-brand-primary/80">{r.member_email}</td>
                        <td className="py-3 px-3 text-sm text-brand-primary/60">{r.member_phone || '—'}</td>
                        <td className="py-3 px-3 text-sm font-mono text-brand-primary/80">{r.order_number}</td>
                        <td className="py-3 px-3 text-sm text-brand-primary text-right">
                          {formatCurrency(r.subtotal_usd)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(r.status)}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-brand-primary/60 text-right">
                          {formatDate(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
