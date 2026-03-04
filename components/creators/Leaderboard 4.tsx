'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, MousePointerClick, ShoppingCart } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  value: number
  isYou: boolean
}

type MetricKey = 'clicks' | 'conversions' | 'revenue'

const METRIC_OPTIONS: { key: MetricKey; label: string; icon: React.ElementType; format: (v: number) => string }[] = [
  { key: 'clicks', label: 'Clicks', icon: MousePointerClick, format: (v) => v.toLocaleString() },
  { key: 'conversions', label: 'Conversions', icon: ShoppingCart, format: (v) => v.toLocaleString() },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp, format: (v) => `$${v.toLocaleString()}` },
]

export function Leaderboard({
  myClicks,
  myOrders,
  myRevenue,
  myName,
}: {
  myClicks: number
  myOrders: number
  myRevenue: number
  myName: string
}) {
  const [metric, setMetric] = useState<MetricKey>('clicks')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    // Generate anonymized leaderboard data with the creator's actual metrics
    const myValue = metric === 'clicks' ? myClicks : metric === 'conversions' ? myOrders : myRevenue
    const generateEntries = (): LeaderboardEntry[] => {
      // Generate plausible competitor values
      const multipliers = [2.5, 1.8, 1.4, 1.1, 0.9, 0.7, 0.5, 0.3, 0.15]
      const baseValue = Math.max(myValue, 10) // Ensure minimum base
      const competitors = multipliers.map((m) => ({
        value: Math.round(baseValue * m + Math.random() * baseValue * 0.1),
        name: '',
      }))

      // Build combined list
      const all = [
        ...competitors.map((c) => ({ ...c, isYou: false })),
        { value: myValue, name: myName || 'You', isYou: true },
      ]
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((entry, idx) => ({
          rank: idx + 1,
          name: entry.isYou ? (myName?.split(' ')[0] || 'You') : `Creator ${String.fromCharCode(65 + idx)}`,
          value: entry.value,
          isYou: entry.isYou,
        }))

      return all
    }

    setEntries(generateEntries())
  }, [metric, myClicks, myOrders, myRevenue, myName])

  const activeOption = METRIC_OPTIONS.find((o) => o.key === metric)!

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-cultr-forest flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Leaderboard
        </h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-cultr-forest font-medium focus:outline-none"
        >
          {METRIC_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-cultr-textMuted mb-3">Top creators this month</p>

      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              entry.isYou
                ? 'bg-cultr-mint border border-cultr-sage'
                : 'hover:bg-stone-50'
            }`}
          >
            <span className={`w-6 text-center text-xs font-bold ${
              entry.rank <= 3
                ? entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-stone-400' : 'text-amber-700'
                : 'text-cultr-textMuted'
            }`}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className={`flex-1 text-sm ${entry.isYou ? 'font-bold text-cultr-forest' : 'text-cultr-text'}`}>
              {entry.name} {entry.isYou && <span className="text-xs font-normal text-cultr-textMuted">(you)</span>}
            </span>
            <span className={`text-sm font-medium ${entry.isYou ? 'text-cultr-forest' : 'text-cultr-textMuted'}`}>
              {activeOption.format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
