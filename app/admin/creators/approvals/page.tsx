'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  User,
  AtSign,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { Creator } from '@/lib/config/affiliate'

export default function AdminApprovalsPage() {
  const [pending, setPending] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [modalCreator, setModalCreator] = useState<Creator | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending() {
    try {
      const res = await fetch('/api/admin/creators/pending')
      if (res.ok) {
        const data = await res.json()
        setPending(data.creators || [])
      }
    } catch (err) {
      console.error('Failed to fetch pending:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(creator: Creator) {
    setProcessingId(creator.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/creators/${creator.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        setPending((prev) => prev.filter((c) => c.id !== creator.id))
        setModalCreator(null)
        setReason('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Approval failed (${res.status})`)
      }
    } catch (err) {
      console.error('Approve failed:', err)
      setError('Network error — please try again')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(creator: Creator) {
    setProcessingId(creator.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/creators/${creator.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        setPending((prev) => prev.filter((c) => c.id !== creator.id))
        setModalCreator(null)
        setReason('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Rejection failed (${res.status})`)
      }
    } catch (err) {
      console.error('Reject failed:', err)
      setError('Network error — please try again')
    } finally {
      setProcessingId(null)
    }
  }

  function closeModal() {
    setModalCreator(null)
    setReason('')
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-stone-100 rounded" />
          <div className="h-40 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/creators"
            className="p-2 text-cultr-textMuted hover:text-cultr-forest rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-cultr-forest">
              Approval Queue
            </h1>
            <p className="text-sm text-cultr-textMuted mt-1">
              {pending.length} application{pending.length !== 1 ? 's' : ''} pending review
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
            <p className="text-lg font-display font-bold text-cultr-forest mb-2">
              All caught up
            </p>
            <p className="text-cultr-textMuted text-sm">
              No pending applications to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((creator) => (
              <div
                key={creator.id}
                className="bg-white border border-stone-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-cultr-textMuted" />
                      <p className="font-medium text-cultr-forest">{creator.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cultr-textMuted" />
                      <p className="text-sm text-cultr-textMuted">{creator.email}</p>
                      {creator.email_verified && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          verified
                        </span>
                      )}
                    </div>
                    {creator.social_handle && (
                      <div className="flex items-center gap-2">
                        <AtSign className="w-4 h-4 text-cultr-textMuted" />
                        <p className="text-sm text-cultr-textMuted">{creator.social_handle}</p>
                      </div>
                    )}
                    {creator.bio && (
                      <p className="text-sm text-cultr-textMuted mt-2 max-w-md">{creator.bio}</p>
                    )}
                    <p className="text-xs text-cultr-textMuted flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Applied {new Date(creator.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalCreator(creator)}
                      disabled={processingId === creator.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(creator)}
                      disabled={processingId === creator.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approve Modal */}
        {modalCreator && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-cultr-forest text-lg mb-4">
                Approve {modalCreator.full_name}
              </h3>

              <p className="text-sm text-cultr-textMuted mb-4">
                Dual coupon codes will be auto-generated from their name (e.g., SMITH + SMITH10).
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-cultr-forest/70 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-brand-primary/20 rounded-lg px-4 py-3 text-sm text-cultr-forest focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleApprove(modalCreator)}
                  disabled={processingId === modalCreator.id}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {processingId === modalCreator.id ? 'Approving...' : 'Approve & Create Codes'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 text-cultr-textMuted text-sm hover:text-cultr-forest"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
