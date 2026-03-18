'use client'

import { X, CheckCircle, AlertTriangle, AlertCircle, Info, MinusCircle } from 'lucide-react'
import { ReferenceRangeBar } from './ReferenceRangeBar'
import type { ProcessedBiomarker } from '@/lib/siphox/reports'

const statusConfig: Record<string, {
  icon: typeof CheckCircle
  color: string
  bg: string
  label: string
  interpretation: string
}> = {
  optimal: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    label: 'Optimal',
    interpretation: 'Your value falls within the ideal range for optimal health.',
  },
  normal: {
    icon: Info,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    label: 'Normal',
    interpretation: 'Your value is within the acceptable reference range.',
  },
  low: {
    icon: AlertTriangle,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    label: 'Below Range',
    interpretation: 'Your value is below the expected reference range. Consider discussing with your provider.',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    label: 'Above Range',
    interpretation: 'Your value is above the expected reference range. Consider discussing with your provider.',
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    label: 'Critical',
    interpretation: 'Your value is significantly outside the reference range. Please consult your healthcare provider.',
  },
  na: {
    icon: MinusCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-50 border-gray-200',
    label: 'Not Available',
    interpretation: 'This biomarker was not included in your test panel.',
  },
}

/**
 * Modal overlay showing full biomarker details:
 * description, reference ranges, status interpretation.
 */
export function BiomarkerDetailModal({
  biomarker,
  onClose,
}: {
  biomarker: ProcessedBiomarker
  onClose: () => void
}) {
  const config = statusConfig[biomarker.status] || statusConfig.normal
  const StatusIcon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {biomarker.displayName}
            </h2>
            <p className="text-sm text-gray-500">{biomarker.abbreviation}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors -mr-1"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Value + Status */}
          <div className="flex items-center justify-between">
            <div>
              {biomarker.value !== null ? (
                <>
                  <div className="text-3xl font-bold text-gray-900">
                    {biomarker.value}
                  </div>
                  <div className="text-sm text-gray-500">{biomarker.unit}</div>
                </>
              ) : (
                <div className="text-2xl font-medium text-gray-400">N/A</div>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg}`}>
              <StatusIcon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Reference Range Bar (large) */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Reference Range
            </h3>
            <ReferenceRangeBar biomarker={biomarker} size="lg" />
          </div>

          {/* Status Interpretation */}
          <div className={`rounded-xl border p-4 ${config.bg}`}>
            <div className="flex gap-3">
              <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
              <p className={`text-sm ${config.color}`}>
                {config.interpretation}
              </p>
            </div>
          </div>

          {/* Description */}
          {biomarker.description && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                About This Biomarker
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {biomarker.description}
              </p>
            </div>
          )}

          {/* Range Details */}
          {biomarker.referenceRange && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Range Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {biomarker.referenceRange.low !== undefined && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Low Boundary</div>
                    <div className="text-sm font-medium text-gray-900">
                      {biomarker.referenceRange.low} {biomarker.unit}
                    </div>
                  </div>
                )}
                {biomarker.referenceRange.high !== undefined && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">High Boundary</div>
                    <div className="text-sm font-medium text-gray-900">
                      {biomarker.referenceRange.high} {biomarker.unit}
                    </div>
                  </div>
                )}
                {biomarker.referenceRange.optimalLow !== undefined && (
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-xs text-green-600">Optimal Low</div>
                    <div className="text-sm font-medium text-green-800">
                      {biomarker.referenceRange.optimalLow} {biomarker.unit}
                    </div>
                  </div>
                )}
                {biomarker.referenceRange.optimalHigh !== undefined && (
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-xs text-green-600">Optimal High</div>
                    <div className="text-sm font-medium text-green-800">
                      {biomarker.referenceRange.optimalHigh} {biomarker.unit}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lower is better note */}
          {biomarker.lowerIsBetter && biomarker.value !== null && (
            <p className="text-xs text-gray-500 italic">
              For this biomarker, lower values are generally associated with better health outcomes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
