'use client'

import type { ProcessedBiomarker } from '@/lib/siphox/reports'

// Color mapping for biomarker status
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  optimal: { bg: 'bg-green-100', text: 'text-green-700', label: 'Optimal' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Normal' },
  low: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Low' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'High' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
  na: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'N/A' },
}

/**
 * Visual reference range bar showing where a biomarker value falls
 * relative to low/normal/optimal/high zones.
 */
export function ReferenceRangeBar({
  biomarker,
  size = 'sm',
}: {
  biomarker: ProcessedBiomarker
  size?: 'sm' | 'lg'
}) {
  const { value, referenceRange, status, lowerIsBetter } = biomarker

  // N/A — no value to plot
  if (value === null || status === 'na') {
    return (
      <div className="flex items-center gap-2">
        <div className={`${size === 'lg' ? 'h-3' : 'h-2'} flex-1 rounded-full bg-gray-100`} />
        <span className="text-xs text-gray-400">N/A</span>
      </div>
    )
  }

  // No reference range — just show the value with status color
  if (!referenceRange) {
    const sc = statusColors[status] || statusColors.normal
    return (
      <div className="flex items-center gap-2">
        <div className={`${size === 'lg' ? 'h-3' : 'h-2'} flex-1 rounded-full bg-gray-100 relative overflow-hidden`}>
          <div className={`absolute inset-0 ${sc.bg} opacity-50`} style={{ width: '100%' }} />
        </div>
      </div>
    )
  }

  // Calculate range boundaries for the bar
  const { low, high, optimalLow, optimalHigh } = referenceRange
  const hasOptimal = optimalLow !== undefined && optimalHigh !== undefined
  const hasRange = low !== undefined || high !== undefined

  if (!hasRange && !hasOptimal) {
    return (
      <div className={`${size === 'lg' ? 'h-3' : 'h-2'} rounded-full bg-gray-100`} />
    )
  }

  // Determine full display range (extend 20% beyond reference bounds)
  const rangeLow = low ?? (optimalLow ?? value * 0.5)
  const rangeHigh = high ?? (optimalHigh ?? value * 1.5)
  const span = rangeHigh - rangeLow

  // Guard against zero-span ranges (e.g., value=0 with no reference bounds)
  if (span === 0) {
    return (
      <div className={`${size === 'lg' ? 'h-3' : 'h-2'} rounded-full bg-gray-100`} />
    )
  }

  const padding = span * 0.2
  const displayMin = rangeLow - padding
  const displayMax = rangeHigh + padding
  const displaySpan = displayMax - displayMin

  // Clamp value position to 2%-98% so marker is always visible
  const rawPct = ((value - displayMin) / displaySpan) * 100
  const valuePct = Math.max(2, Math.min(98, rawPct))

  // Zone percentages for the gradient bar
  const lowPct = low !== undefined ? ((low - displayMin) / displaySpan) * 100 : 0
  const highPct = high !== undefined ? ((high - displayMin) / displaySpan) * 100 : 100
  const optLowPct = optimalLow !== undefined ? ((optimalLow - displayMin) / displaySpan) * 100 : lowPct
  const optHighPct = optimalHigh !== undefined ? ((optimalHigh - displayMin) / displaySpan) * 100 : highPct

  const barHeight = size === 'lg' ? 'h-3' : 'h-2'
  const markerSize = size === 'lg' ? 'w-3.5 h-3.5 -top-0.5' : 'w-2.5 h-2.5 -top-0.5'

  // Marker color based on status
  const markerColor =
    status === 'optimal' ? 'bg-green-500 border-green-600' :
    status === 'normal' ? 'bg-blue-500 border-blue-600' :
    status === 'low' || status === 'high' ? 'bg-amber-500 border-amber-600' :
    'bg-red-500 border-red-600'

  return (
    <div>
      <div className={`relative ${barHeight} rounded-full overflow-hidden bg-gray-100`}>
        {/* Low zone (amber) */}
        {low !== undefined && lowPct > 0 && (
          <div
            className="absolute inset-y-0 bg-amber-200/60"
            style={{ left: 0, width: `${lowPct}%` }}
          />
        )}

        {/* Normal zone (blue) — between low and optimal_low */}
        {hasOptimal && (
          <>
            <div
              className="absolute inset-y-0 bg-blue-200/50"
              style={{ left: `${lowPct}%`, width: `${Math.max(0, optLowPct - lowPct)}%` }}
            />
            {/* Optimal zone (green) */}
            <div
              className="absolute inset-y-0 bg-green-200/60"
              style={{ left: `${optLowPct}%`, width: `${Math.max(0, optHighPct - optLowPct)}%` }}
            />
            {/* Normal zone after optimal (blue) */}
            <div
              className="absolute inset-y-0 bg-blue-200/50"
              style={{ left: `${optHighPct}%`, width: `${Math.max(0, highPct - optHighPct)}%` }}
            />
          </>
        )}

        {/* If no optimal, the whole low-high range is normal (blue) */}
        {!hasOptimal && (
          <div
            className="absolute inset-y-0 bg-blue-200/50"
            style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
          />
        )}

        {/* High zone (amber) */}
        {high !== undefined && highPct < 100 && (
          <div
            className="absolute inset-y-0 bg-amber-200/60"
            style={{ left: `${highPct}%`, right: 0 }}
          />
        )}

        {/* Value marker */}
        <div
          className={`absolute ${markerSize} rounded-full border-2 ${markerColor} shadow-sm`}
          style={{ left: `${valuePct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Range labels for large size */}
      {size === 'lg' && (
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          {low !== undefined && <span>{lowerIsBetter ? '' : 'Low'} {low}</span>}
          {hasOptimal && (
            <span className="text-green-600">
              Optimal {optimalLow}–{optimalHigh}
            </span>
          )}
          {high !== undefined && <span>{lowerIsBetter ? '' : 'High'} {high}</span>}
        </div>
      )}
    </div>
  )
}
