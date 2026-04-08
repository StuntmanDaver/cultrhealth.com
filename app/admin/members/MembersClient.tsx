'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate, getStatusColor } from '@/lib/admin-utils'
import type { AnalyticsData, MembershipAdminRow } from '@/lib/admin-types'

export default function MembersClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)

  // Member lifecycle management
  const [memberSearch, setMemberSearch] = useState('')
  const [memberStatusFilter, setMemberStatusFilter] = useState('')
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null)
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(null)
  const [memberActionError, setMemberActionError] = useState<string | null>(null)

  // Pause modal
  const [pauseTarget, setPauseTarget] = useState<{ customerId: string; email: string; name: string } | null>(null)
  const [pauseResumeDate, setPauseResumeDate] = useState('')

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<{ customerId: string; email: string; name: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Upgrade modal
  const [upgradeTarget, setUpgradeTarget] = useState<{ customerId: string; email: string; name: string; currentTier: string } | null>(null)
  const [upgradeTier, setUpgradeTier] = useState('')

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

  // --------------- Member Lifecycle Actions ---------------
  function clearMemberActionMessages() {
    setMemberActionSuccess(null)
    setMemberActionError(null)
  }

  async function handlePauseMember() {
    if (!pauseTarget || !pauseResumeDate) return
    clearMemberActionMessages()
    setMemberActionLoading(pauseTarget.customerId)
    try {
      const res = await fetch(`/api/admin/members/${pauseTarget.customerId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeDate: pauseResumeDate }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Pause failed')
      setMemberActionSuccess(`Subscription paused for ${pauseTarget.email}. Resumes ${new Date(pauseResumeDate).toLocaleDateString()}.`)
      setPauseTarget(null)
      setPauseResumeDate('')
      fetchAnalytics()
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Failed to pause subscription')
    } finally {
      setMemberActionLoading(null)
    }
  }

  async function handleCancelMember() {
    if (!cancelTarget) return
    clearMemberActionMessages()
    setMemberActionLoading(cancelTarget.customerId)
    try {
      const res = await fetch(`/api/admin/members/${cancelTarget.customerId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Cancel failed')
      setMemberActionSuccess(`Subscription cancelled for ${cancelTarget.email}.`)
      setCancelTarget(null)
      setCancelReason('')
      fetchAnalytics()
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setMemberActionLoading(null)
    }
  }

  async function handleUpgradeMember() {
    if (!upgradeTarget || !upgradeTier) return
    clearMemberActionMessages()
    setMemberActionLoading(upgradeTarget.customerId)
    try {
      const res = await fetch(`/api/admin/members/${upgradeTarget.customerId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTier: upgradeTier }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upgrade failed')
      setMemberActionSuccess(`Subscription changed to ${upgradeTier} for ${upgradeTarget.email}.`)
      setUpgradeTarget(null)
      setUpgradeTier('')
      fetchAnalytics()
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : 'Failed to upgrade subscription')
    } finally {
      setMemberActionLoading(null)
    }
  }

  // --------------- Filtering ---------------
  function getFilteredMemberships(): MembershipAdminRow[] {
    if (!data?.allMemberships) return []
    return data.allMemberships.filter(m => {
      if (memberStatusFilter && m.subscription_status !== memberStatusFilter) return false
      if (memberSearch && !m.email.toLowerCase().includes(memberSearch.toLowerCase()) && !m.stripe_customer_id.toLowerCase().includes(memberSearch.toLowerCase())) return false
      return true
    })
  }

  // --------------- Render ---------------
  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Members</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-brand-primary">Members</h1>
        <p className="text-brand-primary/60">Failed to load data.</p>
      </div>
    )
  }

  const filteredMemberships = getFilteredMemberships()
  const totalMembers = Object.values(data.memberships.byTier).reduce((sum, c) => sum + c, 0)

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-primary">Members</h1>
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

      {/* ========== Membership Breakdown ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Tier */}
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">Members by Tier</h2>
          {Object.keys(data.memberships.byTier).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.memberships.byTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-brand-primary capitalize">{tier}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-primary">{count}</span>
                    {totalMembers > 0 && (
                      <span className="text-xs text-brand-primary/40">
                        ({Math.round((count / totalMembers) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-primary/60">No membership data yet</p>
          )}
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
          <h2 className="font-display text-xl text-brand-primary mb-4">Members by Status</h2>
          {Object.keys(data.memberships.byStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.memberships.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <span className="font-medium text-brand-primary">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-primary/60">No membership data yet</p>
          )}
        </div>
      </div>

      {/* ========== Member Lifecycle Management ========== */}
      <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl text-brand-primary">Member Management</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value)}
              className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
            </select>
            <input
              type="text"
              placeholder="Search by email or customer ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
            />
          </div>
        </div>

        {/* Action success/error messages */}
        {memberActionSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
            <span>{memberActionSuccess}</span>
            <button onClick={() => setMemberActionSuccess(null)} className="text-green-500 hover:text-green-700 ml-2">&times;</button>
          </div>
        )}
        {memberActionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
            <span>{memberActionError}</span>
            <button onClick={() => setMemberActionError(null)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
          </div>
        )}

        {data.allMemberships && data.allMemberships.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-primary/10">
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Plan Tier</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Joined</th>
                  <th className="text-left py-3 px-4 text-brand-primary/60 font-medium text-sm">Updated</th>
                  <th className="text-right py-3 px-4 text-brand-primary/60 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map((m, i) => {
                  const isActive = m.subscription_status === 'active' || m.subscription_status === 'trialing'
                  const isPaused = m.subscription_status === 'paused'
                  const isCancelled = m.subscription_status === 'cancelled' || m.subscription_status === 'canceled'
                  const isActionLoading = memberActionLoading === m.stripe_customer_id
                  return (
                    <tr key={m.id} className={i % 2 === 0 ? 'bg-brand-cream/30' : ''}>
                      <td className="py-3 px-4 text-sm text-brand-primary">
                        {m.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-primary capitalize font-medium">{m.plan_tier}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(m.subscription_status)}`}>
                          {m.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(m.created_at)}</td>
                      <td className="py-3 px-4 text-sm text-brand-primary/60">{formatDate(m.updated_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isActive && (
                            <>
                              <button
                                onClick={() => {
                                  clearMemberActionMessages()
                                  setPauseTarget({ customerId: m.stripe_customer_id, email: m.email, name: m.plan_tier })
                                  const d = new Date()
                                  d.setDate(d.getDate() + 30)
                                  setPauseResumeDate(d.toISOString().split('T')[0])
                                }}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                                title="Pause subscription"
                              >
                                {isActionLoading ? '...' : 'Pause'}
                              </button>
                              <button
                                onClick={() => {
                                  clearMemberActionMessages()
                                  setUpgradeTarget({ customerId: m.stripe_customer_id, email: m.email, name: m.plan_tier, currentTier: m.plan_tier })
                                  setUpgradeTier('')
                                }}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Change plan tier"
                              >
                                {isActionLoading ? '...' : 'Change'}
                              </button>
                              <button
                                onClick={() => {
                                  clearMemberActionMessages()
                                  setCancelTarget({ customerId: m.stripe_customer_id, email: m.email, name: m.plan_tier })
                                  setCancelReason('')
                                }}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Cancel subscription"
                              >
                                {isActionLoading ? '...' : 'Cancel'}
                              </button>
                            </>
                          )}
                          {isPaused && (
                            <span className="text-xs text-brand-primary/40 italic">Paused</span>
                          )}
                          {isCancelled && (
                            <span className="text-xs text-brand-primary/40 italic">
                              {m.cancellation_reason ? `Cancelled: ${m.cancellation_reason}` : 'Cancelled'}
                            </span>
                          )}
                          {!isActive && !isPaused && !isCancelled && (
                            <span className="text-xs text-brand-primary/40 italic">{m.subscription_status}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-brand-primary/60 text-sm">No membership records found. Members will appear here once they subscribe via Stripe.</p>
        )}
      </div>

      {/* ========== PAUSE MEMBER MODAL ========== */}
      {pauseTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPauseTarget(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">Pause Subscription</h3>
              <button onClick={() => setPauseTarget(null)} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
            </div>
            <p className="text-sm text-brand-primary/60 mb-4">
              Pausing subscription for <span className="font-medium text-brand-primary">{pauseTarget.email}</span>.
              No invoices will be generated while paused.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Resume Date</label>
                <input
                  type="date"
                  value={pauseResumeDate}
                  onChange={(e) => setPauseResumeDate(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePauseMember}
                disabled={!pauseResumeDate || memberActionLoading === pauseTarget.customerId}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {memberActionLoading === pauseTarget.customerId ? 'Pausing...' : 'Pause Subscription'}
              </button>
              <button onClick={() => setPauseTarget(null)} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CANCEL MEMBER MODAL ========== */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelTarget(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-red-600">Cancel Subscription</h3>
              <button onClick={() => setCancelTarget(null)} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">Are you sure?</p>
              <p className="text-xs text-red-600 mt-1">
                This will immediately cancel the Stripe subscription for <span className="font-medium">{cancelTarget.email}</span>. This action cannot be undone.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">Cancellation Reason (optional)</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested, Non-payment..."
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelMember}
                disabled={memberActionLoading === cancelTarget.customerId}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {memberActionLoading === cancelTarget.customerId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button onClick={() => setCancelTarget(null)} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== UPGRADE/CHANGE TIER MODAL ========== */}
      {upgradeTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setUpgradeTarget(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-brand-primary">Change Plan Tier</h3>
              <button onClick={() => setUpgradeTarget(null)} className="text-brand-primary/40 hover:text-brand-primary text-xl">&times;</button>
            </div>
            <p className="text-sm text-brand-primary/60 mb-4">
              Current tier: <span className="font-medium text-brand-primary capitalize">{upgradeTarget.currentTier}</span> for <span className="text-brand-primary">{upgradeTarget.email}</span>.
              Stripe will prorate the change.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-primary/60 mb-1">New Tier</label>
                <select
                  value={upgradeTier}
                  onChange={(e) => setUpgradeTier(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Select tier...</option>
                  {['core', 'catalyst', 'concierge'].filter(t => t !== upgradeTarget.currentTier).map(t => (
                    <option key={t} value={t}>
                      {t === 'core' ? 'Core ($149/mo)' : t === 'catalyst' ? 'Catalyst+ ($499/mo)' : 'Concierge ($1,049/mo)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpgradeMember}
                disabled={!upgradeTier || memberActionLoading === upgradeTarget.customerId}
                className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primaryHover transition-colors disabled:opacity-50"
              >
                {memberActionLoading === upgradeTarget.customerId ? 'Changing...' : 'Change Tier'}
              </button>
              <button onClick={() => setUpgradeTarget(null)} className="px-4 py-2.5 text-brand-primary/60 text-sm hover:text-brand-primary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
