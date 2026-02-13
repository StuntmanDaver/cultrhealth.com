'use client'

import { Trophy, Zap, TrendingUp, Star, Crown, Target, Award, Flame } from 'lucide-react'
import type { CreatorDashboardMetrics, Creator } from '@/lib/config/affiliate'

interface Milestone {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  check: (metrics: CreatorDashboardMetrics, creator: Creator) => boolean
}

const MILESTONES: Milestone[] = [
  {
    id: 'first-click',
    label: 'First Click',
    description: 'Got your first tracking link click',
    icon: Zap,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    check: (m) => m.totalClicks >= 1,
  },
  {
    id: 'first-sale',
    label: 'First Sale',
    description: 'Earned your first commission',
    icon: Trophy,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    check: (m) => m.totalOrders >= 1,
  },
  {
    id: '10-clicks',
    label: '10 Clicks',
    description: 'Reached 10 tracking link clicks',
    icon: Target,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    check: (m) => m.totalClicks >= 10,
  },
  {
    id: '10-orders',
    label: '10 Orders',
    description: 'Attributed 10 orders',
    icon: Star,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    check: (m) => m.totalOrders >= 10,
  },
  {
    id: '100-clicks',
    label: '100 Clicks',
    description: 'Reached 100 tracking link clicks',
    icon: Flame,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    check: (m) => m.totalClicks >= 100,
  },
  {
    id: '1k-revenue',
    label: '$1K Revenue',
    description: 'Generated $1,000 in attributed revenue',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600 border-green-200',
    check: (m) => m.totalRevenue >= 1000,
  },
  {
    id: '50-orders',
    label: '50 Orders',
    description: 'Attributed 50 orders',
    icon: Award,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    check: (m) => m.totalOrders >= 50,
  },
  {
    id: '5k-revenue',
    label: '$5K Revenue',
    description: 'Generated $5,000 in attributed revenue',
    icon: Crown,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    check: (m) => m.totalRevenue >= 5000,
  },
  {
    id: 'tier-up',
    label: 'Tier Up!',
    description: 'Advanced beyond Starter tier',
    icon: Crown,
    color: 'bg-cultr-mint text-cultr-forest border-cultr-sage',
    check: (_m, c) => c.tier >= 1,
  },
  {
    id: '1k-clicks',
    label: '1K Clicks',
    description: 'Reached 1,000 tracking link clicks',
    icon: Flame,
    color: 'bg-red-50 text-red-600 border-red-200',
    check: (m) => m.totalClicks >= 1000,
  },
  {
    id: '10k-revenue',
    label: '$10K Revenue',
    description: 'Generated $10,000 in attributed revenue',
    icon: Crown,
    color: 'bg-amber-50 text-amber-700 border-amber-300',
    check: (m) => m.totalRevenue >= 10000,
  },
]

export function MilestoneBadges({
  metrics,
  creator,
}: {
  metrics: CreatorDashboardMetrics
  creator: Creator
}) {
  const earned = MILESTONES.filter((m) => m.check(metrics, creator))
  const nextUp = MILESTONES.find((m) => !m.check(metrics, creator))

  if (earned.length === 0 && !nextUp) return null

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-cultr-forest">
          Milestones
        </h3>
        <span className="text-xs text-cultr-textMuted">
          {earned.length} / {MILESTONES.length} earned
        </span>
      </div>

      {/* Earned badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {earned.map((m) => (
          <div
            key={m.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${m.color}`}
            title={m.description}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </div>
        ))}
      </div>

      {/* Unearned badges (faded) */}
      {MILESTONES.filter((m) => !m.check(metrics, creator)).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {MILESTONES.filter((m) => !m.check(metrics, creator)).map((m) => (
            <div
              key={m.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-100 text-xs font-medium text-stone-300 bg-stone-50"
              title={m.description}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </div>
          ))}
        </div>
      )}

      {/* Next milestone */}
      {nextUp && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-xs text-cultr-textMuted">
            <span className="font-medium text-cultr-forest">Next up:</span>{' '}
            {nextUp.label} — {nextUp.description}
          </p>
        </div>
      )}
    </div>
  )
}
