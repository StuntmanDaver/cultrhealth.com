'use client'

import { useState, useEffect } from 'react'
import { Wallet, Clock, CheckCircle, CreditCard } from 'lucide-react'
import { COMMISSION_CONFIG } from '@/lib/config/affiliate'
import type { Payout, PayoutMethod } from '@/lib/config/affiliate'

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | null>(null)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [holdBalance, setHoldBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod>('bank_transfer')

  useEffect(() => {
    async function fetchPayouts() {
      try {
        const res = await fetch('/api/creators/payouts')
        if (res.ok) {
          const data = await res.json()
          setPayouts(data.payouts || [])
          setPayoutMethod(data.payoutMethod)
          setPendingBalance(data.pendingBalance || 0)
          setHoldBalance(data.holdBalance || 0)
          if (data.payoutMethod) setSelectedMethod(data.payoutMethod)
        }
      } catch (err) {
        console.error('Failed to fetch payouts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPayouts()
  }, [])

  const handleSaveMethod = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/creators/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_method: selectedMethod }),
      })
      if (res.ok) {
        setPayoutMethod(selectedMethod)
      }
    } catch (err) {
      console.error('Failed to save payout method:', err)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-32 bg-stone-100 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-stone-100 rounded-xl" />
          <div className="h-24 bg-stone-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">Payouts</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Manage your payout method and view payout history.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-[18px] h-[18px] text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-cultr-textMuted">Available for Payout</p>
              <p className="text-xl font-bold text-cultr-forest">{fmt(pendingBalance)}</p>
            </div>
          </div>
          <p className="text-xs text-cultr-textMuted">
            Minimum payout: {fmt(COMMISSION_CONFIG.minPayoutAmount)}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-cultr-textMuted">On Hold (30-Day Period)</p>
              <p className="text-xl font-bold text-cultr-forest">{fmt(holdBalance)}</p>
            </div>
          </div>
          <p className="text-xs text-cultr-textMuted">
            Clears after the 30-day refund window.
          </p>
        </div>
      </div>

      {/* Payout Method */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="font-display font-bold text-cultr-forest flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5" /> Payout Method
        </h2>

        <div className="space-y-3 mb-4">
          {[
            { value: 'bank_transfer' as PayoutMethod, label: 'Bank Transfer (ACH)', desc: 'Direct deposit to your bank account' },
            { value: 'paypal' as PayoutMethod, label: 'PayPal', desc: 'Sent to your PayPal email' },
            { value: 'stripe_connect' as PayoutMethod, label: 'Stripe Connect', desc: 'Instant payouts via Stripe' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                selectedMethod === option.value
                  ? 'border-cultr-forest bg-cultr-mint'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="payout_method"
                value={option.value}
                checked={selectedMethod === option.value}
                onChange={() => setSelectedMethod(option.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-sm text-cultr-forest">{option.label}</p>
                <p className="text-xs text-cultr-textMuted">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleSaveMethod}
          disabled={saving || selectedMethod === payoutMethod}
          className="px-5 py-2.5 bg-cultr-forest text-white rounded-lg text-sm font-medium hover:bg-cultr-forestDark transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Method'}
        </button>
      </div>

      {/* Payout History */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-cultr-forest flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Payout History
          </h3>
        </div>

        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Period</th>
                  <th className="text-right py-3 px-4 font-medium text-cultr-textMuted">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-cultr-textMuted">Method</th>
                  <th className="text-center py-3 px-4 font-medium text-cultr-textMuted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-cultr-textMuted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 text-cultr-forest text-xs">
                      {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{fmt(Number(p.amount))}</td>
                    <td className="py-3 px-4 text-center text-xs">{p.payout_method?.replace('_', ' ') || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                        : p.status === 'processing' ? 'bg-blue-100 text-blue-700'
                        : p.status === 'failed' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cultr-textMuted text-xs">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Wallet className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-cultr-textMuted text-sm">No payouts yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
