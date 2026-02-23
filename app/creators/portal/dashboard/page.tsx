'use client'

import { useCreator } from '@/lib/contexts/CreatorContext'
import {
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { getTierName, getNextTierRequirement, TIER_CONFIGS } from '@/lib/config/affiliate'
import { MilestoneBadges } from '@/components/creators/Milestones'
import { AnalyticsCharts } from '@/components/creators/AnalyticsCharts'
import { Leaderboard } from '@/components/creators/Leaderboard'

function MetricCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string
  value: string
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-cultr-textMuted font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-cultr-forest mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-cultr-textMuted mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl grad-mint flex items-center justify-center">
          <Icon className="w-5 h-5 text-cultr-forest" />
        </div>
      </div>
    </div>
  )
}

function TierProgressBar({ tier, recruitCount }: { tier: number; recruitCount: number }) {
  const nextTierReq = getNextTierRequirement(tier)
  const currentTierReq = TIER_CONFIGS[tier]?.minRecruits || 0
  const progress = tier >= 4
    ? 100
    : ((recruitCount - currentTierReq) / (nextTierReq - currentTierReq)) * 100

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-cultr-forest">
            {getTierName(tier)}
          </h3>
          <p className="text-sm text-cultr-textMuted">
            {tier >= 4 ? 'Max tier reached' : `${nextTierReq - recruitCount} more recruits to ${getTierName(tier + 1)}`}
          </p>
        </div>
        <span className="text-sm font-bold text-cultr-forest">
          {recruitCount} recruits
        </span>
      </div>

      <div className="w-full bg-stone-100 rounded-full h-3">
        <div
          className="grad-dark rounded-full h-3 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {TIER_CONFIGS.filter(t => t.tier > 0).map((t) => (
          <div
            key={t.tier}
            className={`text-xs ${
              recruitCount >= t.minRecruits
                ? 'text-cultr-forest font-bold'
                : 'text-cultr-textMuted'
            }`}
          >
            {t.minRecruits}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CreatorDashboardPage() {
  const { metrics, creator, loading } = useCreator()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse">
              <div className="h-3 w-16 bg-stone-100 rounded mb-3" />
              <div className="h-7 w-24 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-cultr-forest">
          Welcome back{creator?.full_name ? `, ${creator.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-cultr-textMuted mt-1">
          Here&apos;s how you&apos;re doing this month.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Clicks"
          value={(metrics?.thisMonthClicks ?? 0).toLocaleString()}
          icon={MousePointerClick}
          subtitle={`${(metrics?.totalClicks ?? 0).toLocaleString()} total`}
        />
        <MetricCard
          label="Orders"
          value={(metrics?.thisMonthOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          subtitle={`${(metrics?.conversionRate ?? 0).toFixed(1)}% conversion`}
        />
        <MetricCard
          label="Revenue"
          value={fmt(metrics?.thisMonthRevenue ?? 0)}
          icon={TrendingUp}
          subtitle={`${fmt(metrics?.totalRevenue ?? 0)} lifetime`}
        />
        <MetricCard
          label="Commission"
          value={fmt(metrics?.thisMonthCommission ?? 0)}
          icon={DollarSign}
          subtitle={`${fmt(metrics?.pendingCommission ?? 0)} pending`}
        />
      </div>

      {/* Milestones */}
      {metrics && creator && (
        <MilestoneBadges metrics={metrics} creator={creator} />
      )}

      {/* Analytics Charts + Leaderboard */}
      {metrics && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <AnalyticsCharts
              totalClicks={metrics.totalClicks}
              totalOrders={metrics.totalOrders}
              totalRevenue={metrics.totalRevenue}
              thisMonthClicks={metrics.thisMonthClicks}
              thisMonthOrders={metrics.thisMonthOrders}
              thisMonthRevenue={metrics.thisMonthRevenue}
              conversionRate={metrics.conversionRate}
            />
          </div>
          <div className="lg:col-span-2">
            <Leaderboard
              myClicks={metrics.thisMonthClicks}
              myOrders={metrics.thisMonthOrders}
              myRevenue={metrics.thisMonthRevenue}
              myName={creator?.full_name ?? ''}
            />
          </div>
        </div>
      )}

      {/* Tier Progress */}
      <TierProgressBar
        tier={creator?.tier ?? 0}
        recruitCount={creator?.recruit_count ?? 0}
      />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/creators/portal/share"
          className="grad-dark text-white rounded-2xl p-5 hover:bg-cultr-forestDark transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold">Share Your Link</p>
              <p className="text-sm text-white/70 mt-1">
                Get your tracking link and start earning
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link
          href="/creators/portal/network"
          className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-cultr-forest transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-cultr-forest">Grow Your Network</p>
              <p className="text-sm text-cultr-textMuted mt-1">
                Recruit creators for override commissions
              </p>
            </div>
            <Users className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
          </div>
        </Link>

        <Link
          href="/creators/portal/earnings"
          className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-cultr-forest transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-cultr-forest">View Earnings</p>
              <p className="text-sm text-cultr-textMuted mt-1">
                Track your commissions and payouts
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-cultr-textMuted group-hover:text-cultr-forest transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
