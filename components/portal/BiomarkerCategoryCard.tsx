'use client'

import { useState } from 'react'
import {
  Heart,
  Flame,
  Zap,
  AlertCircle,
  Activity,
  Apple,
  Beaker,
  ChevronDown,
  CheckCircle,
  MinusCircle,
} from 'lucide-react'
import { ReferenceRangeBar } from './ReferenceRangeBar'
import type { ProcessedCategory, ProcessedBiomarker } from '@/lib/siphox/reports'
import type { BiomarkerCategory } from '@/lib/siphox/biomarkers'

// Category visual config
const categoryConfig: Record<BiomarkerCategory, {
  icon: typeof Heart
  gradient: string
  iconBg: string
  iconColor: string
  border: string
}> = {
  heart: {
    icon: Heart,
    gradient: 'from-rose-50 to-red-50',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    border: 'border-rose-100',
  },
  metabolic: {
    icon: Flame,
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
  },
  hormonal: {
    icon: Zap,
    gradient: 'from-purple-50 to-violet-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-100',
  },
  inflammation: {
    icon: AlertCircle,
    gradient: 'from-red-50 to-rose-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-100',
  },
  thyroid: {
    icon: Activity,
    gradient: 'from-indigo-50 to-blue-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-100',
  },
  nutritional: {
    icon: Apple,
    gradient: 'from-emerald-50 to-green-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  extended: {
    icon: Beaker,
    gradient: 'from-slate-50 to-gray-50',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    border: 'border-slate-100',
  },
}

// Status badge for individual biomarkers
const statusBadge: Record<string, { bg: string; text: string }> = {
  optimal: { bg: 'bg-green-100', text: 'text-green-700' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-700' },
  low: { bg: 'bg-amber-100', text: 'text-amber-700' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700' },
  critical: { bg: 'bg-red-100', text: 'text-red-700' },
  na: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

function BiomarkerRow({
  biomarker,
  onClick,
}: {
  biomarker: ProcessedBiomarker
  onClick: () => void
}) {
  const badge = statusBadge[biomarker.status] || statusBadge.normal

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-white/60 transition-colors rounded-lg group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {biomarker.displayName}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text} flex-shrink-0`}>
            {biomarker.status === 'na' ? 'N/A' : biomarker.status}
          </span>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          {biomarker.value !== null ? (
            <span className="text-sm font-semibold text-gray-900">
              {biomarker.value}
              <span className="text-xs font-normal text-gray-500 ml-1">
                {biomarker.unit}
              </span>
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
      </div>
      <ReferenceRangeBar biomarker={biomarker} size="sm" />
    </button>
  )
}

/**
 * Expandable card for a body system category showing all its biomarkers
 * with reference range bars and status badges.
 */
export function BiomarkerCategoryCard({
  category,
  onBiomarkerClick,
  defaultExpanded = false,
}: {
  category: ProcessedCategory
  onBiomarkerClick: (biomarker: ProcessedBiomarker) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const config = categoryConfig[category.key] || categoryConfig.extended
  const Icon = config.icon

  // Count status distribution
  const optimalCount = category.biomarkers.filter(b => b.status === 'optimal').length
  const attentionCount = category.biomarkers.filter(
    b => b.status === 'low' || b.status === 'high' || b.status === 'critical'
  ).length
  const naCount = category.biomarkers.filter(b => b.status === 'na').length

  return (
    <div className={`rounded-2xl border ${config.border} overflow-hidden bg-gradient-to-br ${config.gradient}`}>
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">{category.label}</h3>
            <p className="text-xs text-gray-500">{category.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status summary pills */}
          <div className="hidden md:flex items-center gap-1.5">
            {optimalCount > 0 && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                {optimalCount}
              </span>
            )}
            {attentionCount > 0 && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                {attentionCount}
              </span>
            )}
            {naCount > 0 && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                <MinusCircle className="w-3 h-3" />
                {naCount}
              </span>
            )}
          </div>

          {/* Mobile compact count */}
          <span className="md:hidden text-xs text-gray-500">
            {category.measuredCount}/{category.biomarkers.length}
          </span>

          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Biomarker list — expanded */}
      {expanded && (
        <div className="px-1 pb-2 border-t border-white/50">
          {category.biomarkers.map(biomarker => (
            <BiomarkerRow
              key={biomarker.siphoxName}
              biomarker={biomarker}
              onClick={() => onBiomarkerClick(biomarker)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
