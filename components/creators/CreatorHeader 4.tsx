'use client'

import { Menu } from 'lucide-react'
import { useCreator } from '@/lib/contexts/CreatorContext'
import { getTierName } from '@/lib/config/affiliate'
import { NotificationBell } from '@/components/creators/NotificationBell'

interface CreatorHeaderProps {
  onMenuToggle: () => void
}

export function CreatorHeader({ onMenuToggle }: CreatorHeaderProps) {
  const { metrics, creator, loading } = useCreator()

  const stats = [
    {
      label: 'Clicks',
      value: metrics?.thisMonthClicks ?? 0,
      format: 'number',
    },
    {
      label: 'Orders',
      value: metrics?.thisMonthOrders ?? 0,
      format: 'number',
    },
    {
      label: 'Revenue',
      value: metrics?.thisMonthRevenue ?? 0,
      format: 'currency',
    },
    {
      label: 'Commission',
      value: metrics?.thisMonthCommission ?? 0,
      format: 'currency',
    },
  ]

  function formatValue(value: number, format: string) {
    if (format === 'currency') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return value.toLocaleString()
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-cultr-textMuted hover:text-cultr-forest rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Metrics bar */}
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto">
          {loading ? (
            <div className="flex gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 w-12 bg-stone-100 rounded mb-1" />
                  <div className="h-5 w-16 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="text-center min-w-[60px]">
                <p className="text-[10px] uppercase tracking-wider text-cultr-textMuted font-medium">
                  {stat.label}
                </p>
                <p className="text-sm font-bold text-cultr-forest">
                  {formatValue(stat.value, stat.format)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right side — notifications + tier */}
        <div className="flex items-center gap-2">
          {metrics && (
            <NotificationBell
              thisMonthClicks={metrics.thisMonthClicks}
              thisMonthOrders={metrics.thisMonthOrders}
              thisMonthCommission={metrics.thisMonthCommission}
            />
          )}
          {creator && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 grad-mint rounded-full">
              <span className="text-xs font-medium text-cultr-forest">
                {getTierName(creator.tier)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: This month label */}
      <div className="md:hidden px-4 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-cultr-textMuted">This Month</p>
      </div>
    </header>
  )
}
