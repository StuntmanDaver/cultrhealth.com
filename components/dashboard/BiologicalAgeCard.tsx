'use client'

import { useMemo } from 'react'
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface AgeDataPoint {
  date: string
  biologicalAge: number
  chronologicalAge: number
}

interface BiologicalAgeCardProps {
  chronologicalAge: number
  biologicalAge: number
  ageGap: number // biological - chronological (negative = younger)
  historicalData?: AgeDataPoint[]
  lastUpdated?: string
  provider?: string // e.g., "TruDiagnostic", "GrimAge", etc.
  onViewDetails?: () => void
}

// =============================================================================
// AGE VISUALIZATION GAUGE
// =============================================================================

function AgeGauge({ 
  biologicalAge, 
  chronologicalAge, 
  ageGap 
}: { 
  biologicalAge: number
  chronologicalAge: number
  ageGap: number
}) {
  // Calculate gauge position (-15 to +15 years range)
  const maxGap = 15
  const clampedGap = Math.max(-maxGap, Math.min(maxGap, ageGap))
  const percentage = ((clampedGap + maxGap) / (maxGap * 2)) * 100

  // Determine color based on gap
  const getGapColor = (gap: number) => {
    if (gap <= -5) return { gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-600' }
    if (gap <= 0) return { gradient: 'from-green-400 to-teal-500', text: 'text-green-600' }
    if (gap <= 5) return { gradient: 'from-amber-400 to-orange-500', text: 'text-amber-600' }
    return { gradient: 'from-red-400 to-rose-500', text: 'text-red-600' }
  }

  const colors = getGapColor(ageGap)

  return (
    <div className="relative">
      {/* Main display */}
      <div className="flex items-center justify-center gap-8 py-6">
        {/* Chronological Age */}
        <div className="text-center">
          <div className="text-3xl font-light text-gray-400">{chronologicalAge}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Chronological</div>
        </div>

        {/* Biological Age - Hero */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{biologicalAge.toFixed(1)}</div>
              <div className="text-xs text-white/80 uppercase tracking-wide">Bio Age</div>
            </div>
          </div>
          
          {/* Age gap badge */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white shadow-md border ${ageGap <= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <span className={`text-sm font-semibold ${colors.text}`}>
              {ageGap > 0 ? '+' : ''}{ageGap.toFixed(1)} years
            </span>
          </div>
        </div>

        {/* Target indicator */}
        <div className="text-center">
          <div className="text-3xl font-light text-emerald-500">{Math.max(0, chronologicalAge - 10)}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Target</div>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="mt-6 px-4">
        <div className="relative h-2 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full">
          {/* Marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-md transition-all duration-500"
            style={{ left: `${percentage}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>-15 yrs</span>
          <span className="font-medium text-gray-500">Same</span>
          <span>+15 yrs</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// TREND SPARKLINE
// =============================================================================

function AgeTrendSparkline({ data }: { data: AgeDataPoint[] }) {
  if (data.length < 2) return null

  const width = 120
  const height = 40
  
  const ageGaps = data.map(d => d.biologicalAge - d.chronologicalAge)
  const min = Math.min(...ageGaps)
  const max = Math.max(...ageGaps)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const gap = d.biologicalAge - d.chronologicalAge
    const x = (i / (data.length - 1)) * width
    const y = height - ((gap - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  // Determine trend
  const firstGap = ageGaps[0]
  const lastGap = ageGaps[ageGaps.length - 1]
  const isImproving = lastGap < firstGap

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Zero line (chronological age) */}
        <line 
          x1="0" 
          y1={height - ((0 - min) / range) * height} 
          x2={width} 
          y2={height - ((0 - min) / range) * height}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        <polyline
          fill="none"
          stroke={isImproving ? '#10B981' : '#EF4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle
          cx={width}
          cy={height - ((lastGap - min) / range) * height}
          r="4"
          fill={isImproving ? '#10B981' : '#EF4444'}
        />
      </svg>
      <div className={`flex items-center gap-1 ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
        {isImproving ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        <span className="text-xs font-medium">
          {Math.abs(lastGap - firstGap).toFixed(1)} yrs
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BiologicalAgeCard({
  chronologicalAge,
  biologicalAge,
  ageGap,
  historicalData = [],
  lastUpdated,
  provider,
  onViewDetails
}: BiologicalAgeCardProps) {
  // Determine status message
  const status = useMemo(() => {
    if (ageGap <= -10) return { 
      message: 'Exceptional cellular resilience', 
      icon: Sparkles, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
    if (ageGap <= -5) return { 
      message: 'Strong rejuvenation markers', 
      icon: TrendingDown, 
      color: 'text-green-600',
      bg: 'bg-green-50'
    }
    if (ageGap <= 0) return { 
      message: 'Aging at healthy pace', 
      icon: Minus, 
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    }
    if (ageGap <= 5) return { 
      message: 'Room for optimization', 
      icon: Clock, 
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
    return { 
      message: 'Accelerated aging detected', 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  }, [ageGap])

  const StatusIcon = status.icon

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Biological Age</h2>
          <p className="text-sm text-gray-500">
            {provider || 'Epigenetic Clock'} 
            {lastUpdated && ` • Updated ${lastUpdated}`}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg}`}>
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-sm font-medium ${status.color}`}>{status.message}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AgeGauge 
          biologicalAge={biologicalAge}
          chronologicalAge={chronologicalAge}
          ageGap={ageGap}
        />
      </div>

      {/* Historical Trend */}
      {historicalData.length >= 2 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Age Gap Trend</h3>
              <p className="text-xs text-gray-500">
                Last {historicalData.length} measurements
              </p>
            </div>
            <AgeTrendSparkline data={historicalData} />
          </div>
        </div>
      )}

      {/* Insights / Actions */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Years Younger</div>
            <div className={`text-xl font-semibold ${ageGap <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ageGap <= 0 ? Math.abs(ageGap).toFixed(1) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Percentile</div>
            <div className="text-xl font-semibold text-gray-900">
              {ageGap <= -5 ? 'Top 10%' : ageGap <= 0 ? 'Top 30%' : 'Below Avg'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Goal</div>
            <div className="text-xl font-semibold text-emerald-600">
              {Math.max(0, chronologicalAge - 10)}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          View Full Aging Analysis
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default BiologicalAgeCard
