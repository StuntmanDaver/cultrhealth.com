'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  ChevronRight,
  Trophy,
} from 'lucide-react'
import type { Creator } from '@/lib/config/affiliate'
import { getTierName } from '@/lib/config/affiliate'

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [pending, setPending] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [pendingRes] = await Promise.all([
          fetch('/api/admin/creators/pending'),
        ])

        if (pendingRes.ok) {
          const data = await pendingRes.json()
          setPending(data.creators || [])
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />
      case 'paused': return <Pause className="w-4 h-4 text-blue-600" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-stone-100 rounded" />
          <div className="h-40 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-cultr-forest">
              Creator Management
            </h1>
            <p className="text-sm text-cultr-textMuted mt-1">
              Manage creator approvals, codes, and payouts.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-cultr-textMuted hover:text-cultr-forest"
          >
            Back to site
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/admin/creators/approvals"
            className="bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
              <span className="text-2xl font-bold text-cultr-forest">{pending.length}</span>
            </div>
            <p className="font-medium text-cultr-forest text-sm">Pending Approvals</p>
            <p className="text-xs text-cultr-textMuted mt-1">Review and approve creator applications</p>
          </Link>

          <Link
            href="/admin/creators/payouts"
            className="bg-white border border-stone-200 rounded-xl p-5 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-6 h-6 text-emerald-600" />
              <ChevronRight className="w-5 h-5 text-stone-300" />
            </div>
            <p className="font-medium text-cultr-forest text-sm">Payout Runs</p>
            <p className="text-xs text-cultr-textMuted mt-1">Create and manage payout batches</p>
          </Link>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-cultr-forest text-sm">All Creators</p>
            <p className="text-xs text-cultr-textMuted mt-1">Creator directory coming soon</p>
          </div>
        </div>

        {/* Pending Queue Preview */}
        {pending.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-cultr-forest">
                Pending Applications ({pending.length})
              </h2>
              <Link
                href="/admin/creators/approvals"
                className="text-sm text-cultr-forest font-medium hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {pending.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {statusIcon(c.status)}
                    <div>
                      <p className="font-medium text-cultr-forest text-sm">{c.full_name}</p>
                      <p className="text-xs text-cultr-textMuted">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cultr-textMuted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                    {c.social_handle && (
                      <p className="text-xs text-cultr-forest">{c.social_handle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
