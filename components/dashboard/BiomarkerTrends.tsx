'use client'

import { useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { BIOMARKER_DEFINITIONS, type BiomarkerCategory } from '@/lib/resilience'

// =============================================================================
// TYPES
// =============================================================================

interface BiomarkerDataPoint {
  date: string
  value: number
  score?: number
  status?: 'optimal' | 'acceptable' | 'suboptimal' | 'critical'
}

interface BiomarkerTrendData {
  biomarkerId: string
  name: string
  category: BiomarkerCategory
  unit: string
  dataPoints: BiomarkerDataPoint[]
  currentValue?: number
  currentScore?: number
  currentStatus?: 'optimal' | 'acceptable' | 'suboptimal' | 'critical'
  trend?: 'improving' | 'stable' | 'declining'
  percentChange?: number
}

interface BiomarkerTrendsProps {
  data: BiomarkerTrendData[]
  onBiomarkerClick?: (biomarkerId: string) => void
  showSparklines?: boolean
  compactMode?: boolean
}

// =============================================================================
// CATEGORY COLORS & STYLING
// =============================================================================

const categoryColors: Record<BiomarkerCategory, { bg: string; text: string; border: string }> = {
  inflammation: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  metabolic: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  hormonal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  longevity: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  oxidative: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  mitochondrial: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
}

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  optimal: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  acceptable: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Info },
  suboptimal: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle },
  critical: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
}

// =============================================================================
// SPARKLINE COMPONENT
// =============================================================================

function Sparkline({ 
  dataPoints, 
  width = 80, 
  height = 24,
  trend 
}: { 
  dataPoints: BiomarkerDataPoint[]
  width?: number
  height?: number
  trend?: 'improving' | 'stable' | 'declining'
}) {
  if (dataPoints.length < 2) {
    return <div className="w-20 h-6 bg-gray-100 rounded animate-pulse" />
  }

  const values = dataPoints.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = dataPoints.map((d, i) => {
    const x = (i / (dataPoints.length - 1)) * width
    const y = height - ((d.value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const strokeColor = trend === 'improving' 
    ? '#10B981' 
    : trend === 'declining' 
      ? '#EF4444' 
      : '#6B7280'

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Latest point dot */}
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * height}
        r="3"
        fill={strokeColor}
      />
    </svg>
  )
}

// =============================================================================
// TREND INDICATOR
// =============================================================================

function TrendIndicator({ 
  trend, 
  percentChange 
}: { 
  trend?: 'improving' | 'stable' | 'declining'
  percentChange?: number
}) {
  if (!trend) return null

  const config = {
    improving: { icon: TrendingUp, color: 'text-green-600', label: 'Improving' },
    stable: { icon: Minus, color: 'text-gray-500', label: 'Stable' },
    declining: { icon: TrendingDown, color: 'text-red-600', label: 'Declining' },
  }

  const { icon: Icon, color, label } = config[trend]

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">
        {percentChange !== undefined && percentChange !== 0 
          ? `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`
          : label
        }
      </span>
    </div>
  )
}

// =============================================================================
// SINGLE BIOMARKER CARD
// =============================================================================

function BiomarkerCard({ 
  biomarker, 
  onClick, 
  showSparkline,
  compact
}: { 
  biomarker: BiomarkerTrendData
  onClick?: () => void
  showSparkline?: boolean
  compact?: boolean
}) {
  const definition = BIOMARKER_DEFINITIONS.find(d => d.id === biomarker.biomarkerId)
  const categoryStyle = categoryColors[biomarker.category] || categoryColors.longevity
  const statusStyle = biomarker.currentStatus 
    ? statusColors[biomarker.currentStatus] 
    : statusColors.acceptable

  const StatusIcon = statusStyle.icon

  if (compact) {
    return (
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border ${categoryStyle.border} ${categoryStyle.bg} cursor-pointer hover:shadow-md transition-shadow`}
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 truncate">
              {biomarker.name}
            </span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
              <StatusIcon className="w-3 h-3 mr-0.5" />
              {biomarker.currentStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {biomarker.currentValue?.toFixed(1)} <span className="text-xs text-gray-500">{biomarker.unit}</span>
            </div>
          </div>
          <TrendIndicator trend={biomarker.trend} percentChange={biomarker.percentChange} />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`p-4 rounded-xl border ${categoryStyle.border} ${categoryStyle.bg} cursor-pointer hover:shadow-lg transition-all`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{biomarker.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{biomarker.category}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          <StatusIcon className="w-3.5 h-3.5 mr-1" />
          {biomarker.currentStatus}
        </span>
      </div>

      {/* Value & Score */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {biomarker.currentValue?.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">{biomarker.unit}</div>
        </div>
        {biomarker.currentScore !== undefined && (
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-700">
              {biomarker.currentScore}
            </div>
            <div className="text-xs text-gray-500">score</div>
          </div>
        )}
      </div>

      {/* Sparkline & Trend */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
        {showSparkline && biomarker.dataPoints.length >= 2 && (
          <Sparkline 
            dataPoints={biomarker.dataPoints} 
            trend={biomarker.trend}
          />
        )}
        <TrendIndicator trend={biomarker.trend} percentChange={biomarker.percentChange} />
      </div>

      {/* Optimal Range */}
      {definition && (
        <div className="mt-2 text-xs text-gray-500">
          Optimal: {definition.optimalRange.min}–{definition.optimalRange.max} {biomarker.unit}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CATEGORY GROUP
// =============================================================================

function CategoryGroup({ 
  category, 
  biomarkers, 
  onBiomarkerClick, 
  showSparklines,
  compact
}: { 
  category: BiomarkerCategory
  biomarkers: BiomarkerTrendData[]
  onBiomarkerClick?: (biomarkerId: string) => void
  showSparklines?: boolean
  compact?: boolean
}) {
  const categoryStyle = categoryColors[category] || categoryColors.longevity
  
  // Calculate category average score
  const avgScore = biomarkers.reduce((sum, b) => sum + (b.currentScore || 0), 0) / biomarkers.length

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-lg font-semibold capitalize ${categoryStyle.text}`}>
          {category}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Avg Score:</span>
          <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
            {avgScore.toFixed(0)}
          </span>
        </div>
      </div>
      
      {compact ? (
        <div className="space-y-2">
          {biomarkers.map((biomarker) => (
            <BiomarkerCard
              key={biomarker.biomarkerId}
              biomarker={biomarker}
              onClick={() => onBiomarkerClick?.(biomarker.biomarkerId)}
              showSparkline={showSparklines}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {biomarkers.map((biomarker) => (
            <BiomarkerCard
              key={biomarker.biomarkerId}
              biomarker={biomarker}
              onClick={() => onBiomarkerClick?.(biomarker.biomarkerId)}
              showSparkline={showSparklines}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BiomarkerTrends({ 
  data, 
  onBiomarkerClick, 
  showSparklines = true,
  compactMode = false
}: BiomarkerTrendsProps) {
  // Group biomarkers by category
  const groupedData = useMemo(() => {
    const groups: Record<BiomarkerCategory, BiomarkerTrendData[]> = {
      inflammation: [],
      metabolic: [],
      hormonal: [],
      longevity: [],
      oxidative: [],
      mitochondrial: [],
    }
    
    data.forEach(biomarker => {
      if (groups[biomarker.category]) {
        groups[biomarker.category].push(biomarker)
      }
    })
    
    return groups
  }, [data])

  // Calculate overall stats
  const stats = useMemo(() => {
    const optimal = data.filter(d => d.currentStatus === 'optimal').length
    const improving = data.filter(d => d.trend === 'improving').length
    const declining = data.filter(d => d.trend === 'declining').length
    const avgScore = data.reduce((sum, d) => sum + (d.currentScore || 0), 0) / data.length

    return { optimal, improving, declining, avgScore, total: data.length }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Biomarker Data</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Upload your lab results or connect with Healthie to start tracking your biomarkers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.avgScore.toFixed(0)}</div>
          <div className="text-xs text-gray-500">Average Score</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{stats.optimal}</div>
          <div className="text-xs text-green-600">Optimal</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-700">{stats.improving}</span>
          </div>
          <div className="text-xs text-emerald-600">Improving</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-700">{stats.declining}</span>
          </div>
          <div className="text-xs text-red-600">Needs Attention</div>
        </div>
      </div>

      {/* Category Groups */}
      {(Object.entries(groupedData) as [BiomarkerCategory, BiomarkerTrendData[]][])
        .filter(([_, biomarkers]) => biomarkers.length > 0)
        .map(([category, biomarkers]) => (
          <CategoryGroup
            key={category}
            category={category}
            biomarkers={biomarkers}
            onBiomarkerClick={onBiomarkerClick}
            showSparklines={showSparklines}
            compact={compactMode}
          />
        ))}
    </div>
  )
}

export default BiomarkerTrends
export type { BiomarkerTrendData, BiomarkerDataPoint }
