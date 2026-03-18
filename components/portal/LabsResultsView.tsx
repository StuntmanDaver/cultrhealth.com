'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  Beaker,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import { BiomarkerCategoryCard } from './BiomarkerCategoryCard'
import { BiomarkerDetailModal } from './BiomarkerDetailModal'
import type { ProcessedReport, ProcessedBiomarker } from '@/lib/siphox/reports'

/**
 * Full biomarker results dashboard shown when a member's lab results are ready.
 * Fetches from /api/portal/results and renders categorized biomarker data.
 */
export function LabsResultsView() {
  const [report, setReport] = useState<ProcessedReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBiomarker, setSelectedBiomarker] = useState<ProcessedBiomarker | null>(null)

  const loadResults = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal/results')
      if (res.status === 401) { setIsLoading(false); return }
      if (!res.ok) throw new Error('Failed to load results')
      const json = await res.json()
      if (json.success && json.report) {
        setReport(json.report)
      }
    } catch {
      setError('Unable to load your biomarker results right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-xl bg-brand-primary/5 animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-brand-primary/5 animate-pulse" />
        ))}
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-4">
        <p className="text-red-800 text-sm mb-2">{error}</p>
        <button
          onClick={() => { setIsLoading(true); loadResults() }}
          className="text-sm text-red-700 underline hover:text-red-900"
        >
          Try again
        </button>
      </div>
    )
  }

  // No report data
  if (!report) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
        <Beaker className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          Your biomarker results are being processed. Check back soon.
        </p>
      </div>
    )
  }

  const { summary, categories, suggestions, createdAt } = report

  return (
    <div className="space-y-6">
      {/* Report header */}
      {createdAt && (
        <p className="text-xs text-gray-500">
          Results from {new Date(createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-brand-primary/5 border border-brand-primary/10 p-3.5">
          <div className="text-2xl font-bold text-brand-primary">{summary.totalBiomarkers}</div>
          <div className="text-xs text-brand-primary/70">Biomarkers Tested</div>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-100 p-3.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-700">{summary.optimalCount}</span>
          </div>
          <div className="text-xs text-green-600">Optimal</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-2xl font-bold text-amber-700">{summary.needsAttentionCount}</span>
          </div>
          <div className="text-xs text-amber-600">Needs Attention</div>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5">
          <div className="flex items-center gap-1.5">
            <MinusCircle className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-600">{summary.naCount}</span>
          </div>
          <div className="text-xs text-gray-500">Not Tested</div>
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <BiomarkerCategoryCard
            key={cat.key}
            category={cat}
            onBiomarkerClick={setSelectedBiomarker}
            defaultExpanded={i === 0}
          />
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Insights & Recommendations
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="rounded-xl bg-amber-50/50 border border-amber-100 p-4 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-amber-700">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{suggestion.text}</p>
                  {suggestion.link && (
                    <a
                      href={suggestion.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline mt-1"
                    >
                      Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical disclaimer */}
      <p className="text-[11px] text-gray-400 leading-relaxed">
        These results are provided for informational and wellness optimization purposes only.
        They do not constitute medical advice, diagnosis, or treatment. Always consult your
        healthcare provider before making changes to your health regimen based on lab results.
      </p>

      {/* Detail modal */}
      {selectedBiomarker && (
        <BiomarkerDetailModal
          biomarker={selectedBiomarker}
          onClose={() => setSelectedBiomarker(null)}
        />
      )}
    </div>
  )
}
