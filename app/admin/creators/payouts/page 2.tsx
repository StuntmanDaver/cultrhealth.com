'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Play, CheckCircle, AlertTriangle } from 'lucide-react'

interface PayoutResult {
  creatorId: string
  name: string
  amount: number
  commissionCount: number
}

interface SkippedResult {
  creatorId: string
  name: string
  amount: number
  reason: string
}

export default function AdminPayoutsPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{
    payouts: PayoutResult[]
    skipped: SkippedResult[]
    summary: { totalPayouts: number; totalAmount: number; totalSkipped: number }
  } | null>(null)

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleRunBatch = async () => {
    setRunning(true)
    setResults(null)

    try {
      const res = await fetch('/api/admin/creators/payouts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (err) {
      console.error('Payout batch failed:', err)
    } finally {
      setRunning(false)
    }
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
              Payout Runs
            </h1>
            <p className="text-sm text-cultr-textMuted mt-1">
              Process approved commissions into payouts.
            </p>
          </div>
        </div>

        {/* Run Payout */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-display font-bold text-cultr-forest flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5" /> Create Payout Batch
          </h2>
          <p className="text-sm text-cultr-textMuted mb-4">
            This will find all creators with approved commissions above the $50 minimum threshold
            and create payout records. Commissions will be marked as &quot;paid&quot;.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-amber-800">
                <p className="font-medium">Before running:</p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>Ensure the approve-commissions cron has run (moves pending to approved after 30 days)</li>
                  <li>Verify creators have set their payout methods</li>
                  <li>This action marks commissions as paid and cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 grad-dark text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {running ? 'Processing...' : 'Run Payout Batch'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 text-center">
                <p className="text-2xl font-bold text-cultr-forest">{results.summary.totalPayouts}</p>
                <p className="text-xs text-cultr-textMuted">Payouts Created</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-5 text-center">
                <p className="text-2xl font-bold text-emerald-600">{fmt(results.summary.totalAmount)}</p>
                <p className="text-xs text-cultr-textMuted">Total Amount</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-5 text-center">
                <p className="text-2xl font-bold text-amber-600">{results.summary.totalSkipped}</p>
                <p className="text-xs text-cultr-textMuted">Skipped</p>
              </div>
            </div>

            {/* Payouts */}
            {results.payouts.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-stone-100">
                  <h3 className="font-display font-bold text-cultr-forest flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Payouts Created
                  </h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {results.payouts.map((p) => (
                    <div key={p.creatorId} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-cultr-forest text-sm">{p.name}</p>
                        <p className="text-xs text-cultr-textMuted">{p.commissionCount} commissions</p>
                      </div>
                      <p className="font-bold text-emerald-600">{fmt(p.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped */}
            {results.skipped.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-stone-100">
                  <h3 className="font-display font-bold text-cultr-forest flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Skipped
                  </h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {results.skipped.map((s) => (
                    <div key={s.creatorId} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-cultr-forest text-sm">{s.name}</p>
                        <p className="text-xs text-cultr-textMuted">{s.reason}</p>
                      </div>
                      <p className="text-sm text-cultr-textMuted">{fmt(s.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
