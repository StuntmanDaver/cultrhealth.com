'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface PerformanceDataPoint {
  label: string
  clicks: number
  orders: number
  revenue: number
  commission: number
}

// Generate demo data based on current metrics for visualization
function generateChartData(
  totalClicks: number,
  totalOrders: number,
  totalRevenue: number,
  thisMonthClicks: number,
  thisMonthOrders: number,
  thisMonthRevenue: number,
): PerformanceDataPoint[] {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
  const remainingClicks = Math.max(0, totalClicks - thisMonthClicks)
  const remainingOrders = Math.max(0, totalOrders - thisMonthOrders)
  const remainingRevenue = Math.max(0, totalRevenue - thisMonthRevenue)

  // Distribute remaining totals across previous months with growth curve
  const weights = [0.08, 0.12, 0.18, 0.25, 0.37]
  return months.map((label, i) => {
    if (i === months.length - 1) {
      return {
        label,
        clicks: thisMonthClicks,
        orders: thisMonthOrders,
        revenue: Math.round(thisMonthRevenue),
        commission: Math.round(thisMonthRevenue * 0.1),
      }
    }
    const w = weights[i]
    return {
      label,
      clicks: Math.round(remainingClicks * w),
      orders: Math.round(remainingOrders * w),
      revenue: Math.round(remainingRevenue * w),
      commission: Math.round(remainingRevenue * w * 0.1),
    }
  })
}

const TABS = [
  { key: 'clicks', label: 'Clicks', color: '#2A4542' },
  { key: 'orders', label: 'Orders', color: '#C87941' },
  { key: 'revenue', label: 'Revenue', color: '#3A5956' },
] as const

type TabKey = typeof TABS[number]['key']

export function AnalyticsCharts({
  totalClicks,
  totalOrders,
  totalRevenue,
  thisMonthClicks,
  thisMonthOrders,
  thisMonthRevenue,
  conversionRate,
}: {
  totalClicks: number
  totalOrders: number
  totalRevenue: number
  thisMonthClicks: number
  thisMonthOrders: number
  thisMonthRevenue: number
  conversionRate: number
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('clicks')
  const data = generateChartData(totalClicks, totalOrders, totalRevenue, thisMonthClicks, thisMonthOrders, thisMonthRevenue)
  const activeColor = TABS.find(t => t.key === activeTab)?.color ?? '#2A4542'

  const formatValue = (val: number) => {
    if (activeTab === 'revenue') return `$${val.toLocaleString()}`
    return val.toLocaleString()
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-cultr-forest">Performance Trends</h3>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-cultr-forest shadow-sm'
                  : 'text-cultr-textMuted hover:text-cultr-forest'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={activeTab === 'revenue' ? (v) => `$${v}` : undefined} />
            <Tooltip
              formatter={(value: number) => [formatValue(value), TABS.find(t => t.key === activeTab)?.label]}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey={activeTab}
              stroke={activeColor}
              strokeWidth={2}
              fill={`url(#gradient-${activeTab})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Rate Bar */}
      <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-cultr-textMuted">Conversion Rate</span>
            <span className="text-xs font-bold text-cultr-forest">{conversionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="bg-cultr-forest rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(100, conversionRate * 10)}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-cultr-textMuted">Top performing links</p>
          <p className="text-xs font-medium text-cultr-forest">
            {totalOrders > 0 ? `${totalOrders} total conversions` : 'No conversions yet'}
          </p>
        </div>
      </div>
    </div>
  )
}
