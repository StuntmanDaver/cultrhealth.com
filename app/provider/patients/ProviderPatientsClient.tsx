'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'

interface PatientRow {
  id: number
  email: string
  plan_tier: string
  subscription_status: string
  member_since: string
  latest_order_status: string | null
  last_consultation_date: string | null
  last_consultation_status: string | null
  first_name: string | null
  last_name: string | null
}

const TIER_BADGE: Record<string, string> = {
  core: 'bg-blue-50 text-blue-700',
  catalyst: 'bg-purple-50 text-purple-700',
  concierge: 'bg-amber-50 text-amber-700',
  club: 'bg-stone-100 text-stone-600',
}

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  completed: 'bg-brand-primary/5 text-brand-primary',
  cancelled: 'bg-red-50 text-red-700',
}

const PAGE_SIZE = 50

export function ProviderPatientsClient() {
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tier, setTier] = useState('')
  const [loading, setLoading] = useState(true)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setOffset(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (tier) params.set('tier', tier)

      const res = await fetch(`/api/provider/patients?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
        setTotal(data.total || 0)
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, tier, offset])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  function formatRelativeDate(dateStr: string | null) {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cultr-textMuted" />
          <h1 className="font-display text-2xl font-bold text-brand-primary">Patients</h1>
          {!loading && (
            <span className="text-sm text-brand-primary/40 ml-2">({total})</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cultr-textMuted" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest/40"
            />
          </div>
          <select
            value={tier}
            onChange={(e) => { setTier(e.target.value); setOffset(0) }}
            className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-cultr-forest/20 focus:border-cultr-forest/40"
          >
            <option value="">All Tiers</option>
            <option value="core">Core</option>
            <option value="catalyst">Catalyst</option>
            <option value="concierge">Concierge</option>
            <option value="club">Club</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden md:table-cell">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden lg:table-cell">
                    Order Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden sm:table-cell">
                    Last Consult
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted hidden lg:table-cell">
                    Member Since
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cultr-textMuted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-stone-50/50' : ''}>
                      <td className="px-4 py-3"><div className="h-4 w-40 bg-stone-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-stone-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-stone-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-16 bg-stone-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-10 bg-stone-100 rounded animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-primary/40">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient, i) => (
                    <tr key={patient.id} className={i % 2 === 0 ? 'bg-stone-50/50' : ''}>
                      <td className="px-4 py-3">
                        <div>
                          {patient.first_name && (
                            <p className="text-sm font-medium text-brand-primary">
                              {patient.first_name} {patient.last_name}
                            </p>
                          )}
                          <p className="text-xs text-brand-primary/50 truncate max-w-[200px]">
                            {patient.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE[patient.plan_tier] || 'bg-stone-100 text-stone-600'}`}>
                          {patient.plan_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {patient.latest_order_status ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_BADGE[patient.latest_order_status] || 'bg-stone-100 text-stone-600'}`}>
                            {patient.latest_order_status}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-primary/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-primary/50 hidden sm:table-cell">
                        {formatRelativeDate(patient.last_consultation_date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-primary/50 hidden lg:table-cell">
                        {new Date(patient.member_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/provider/patients/${patient.id}`}
                          className="text-xs font-medium text-cultr-forest hover:text-forest-light transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
              <p className="text-xs text-brand-primary/40">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={offset + PAGE_SIZE >= total}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
