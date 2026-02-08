'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, Copy, Check } from 'lucide-react'
import { getTierName, TIER_CONFIGS, getNextTierRequirement } from '@/lib/config/affiliate'
import type { NetworkSummary, Creator } from '@/lib/config/affiliate'

export default function NetworkPage() {
  const [network, setNetwork] = useState<NetworkSummary | null>(null)
  const [recruits, setRecruits] = useState<Partial<Creator>[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchNetwork() {
      try {
        const res = await fetch('/api/creators/network')
        if (res.ok) {
          const data = await res.json()
          setNetwork(data.network)
          setRecruits(data.recruits || [])
        }
      } catch (err) {
        console.error('Failed to fetch network:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetwork()
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cultrhealth.com'
  const recruitLink = `${baseUrl}/creators/apply`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recruitLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-40 bg-stone-100 rounded" />
        <div className="h-40 bg-stone-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">My Network</h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Recruit other creators and earn override commissions on their sales.
        </p>
      </div>

      {/* Tier Progress Card */}
      <div className="bg-gradient-to-br from-cultr-forest to-forest-dark rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-cultr-sage" />
          <h2 className="text-xl font-display font-bold">
            {getTierName(network?.tier ?? 0)}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-white/60">Recruits</p>
            <p className="text-2xl font-bold">{network?.recruitCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Override Rate</p>
            <p className="text-2xl font-bold">{network?.overrideRate ?? 0}%</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Override Earnings</p>
            <p className="text-2xl font-bold">{fmt(network?.overrideEarnings ?? 0)}</p>
          </div>
        </div>

        {/* Tier milestones */}
        <div className="space-y-2">
          {TIER_CONFIGS.filter(t => t.tier > 0).map((t) => {
            const achieved = (network?.recruitCount ?? 0) >= t.minRecruits
            return (
              <div
                key={t.tier}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  achieved ? 'bg-white/20' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    achieved ? 'bg-cultr-sage text-cultr-forest' : 'bg-white/10 text-white/40'
                  }`}>
                    {achieved ? '\u2713' : t.tier}
                  </div>
                  <span className={`text-sm ${achieved ? 'text-white' : 'text-white/50'}`}>
                    {t.name} ({t.minRecruits} recruits)
                  </span>
                </div>
                <span className={`text-sm font-bold ${achieved ? 'text-cultr-sage' : 'text-white/40'}`}>
                  +{t.overrideRate}%
                </span>
              </div>
            )
          })}
        </div>

        {(network?.tier ?? 0) < 4 && (
          <p className="text-sm text-white/60 mt-4">
            {getNextTierRequirement(network?.tier ?? 0) - (network?.recruitCount ?? 0)} more recruits to unlock the next tier.
          </p>
        )}
      </div>

      {/* Invite Creator */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h3 className="font-display font-bold text-cultr-forest mb-2">Invite a Creator</h3>
        <p className="text-sm text-cultr-textMuted mb-4">
          Share this link with creators you want to recruit. They&apos;ll be linked to your network when they apply.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-cultr-forest bg-stone-50 px-3 py-2.5 rounded-lg truncate font-mono">
            {recruitLink}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2.5 rounded-lg bg-cultr-forest text-white hover:bg-cultr-forestDark transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Recruits List */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-cultr-forest flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Recruits ({recruits.length})
          </h3>
        </div>

        {recruits.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recruits.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-cultr-forest text-sm">{r.full_name}</p>
                  <p className="text-xs text-cultr-textMuted">
                    Joined {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  r.status === 'active' ? 'bg-emerald-100 text-emerald-700'
                  : r.status === 'pending' ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-600'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-cultr-textMuted text-sm">
              No recruits yet. Share your invite link to start building your network.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
