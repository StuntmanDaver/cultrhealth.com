// SiPhox Report Fetching, Caching, and Processing
// Orchestrates: SiPhox API → DB cache → processed UI-ready data
// HIPAA: Never log biomarker values or report contents

import { getReports } from './client'
import { getReportsByCustomer, insertReport } from './db'
import type { SiphoxReport, SiphoxBiomarkerResult } from './types'
import type { SiphoxReportRow } from './db'
import {
  findBiomarker,
  getOrderedCategories,
  BIOMARKER_CATEGORIES,
  type BiomarkerCategory,
} from './biomarkers'

// ============================================================
// PROCESSED TYPES (UI-ready)
// ============================================================

export type BiomarkerStatus = 'optimal' | 'normal' | 'low' | 'high' | 'critical' | 'na'

export interface ProcessedBiomarker {
  /** SiPhox biomarker name (raw) */
  siphoxName: string
  /** Display name from catalog, or raw name if unmapped */
  displayName: string
  /** Short abbreviation */
  abbreviation: string
  /** Body system category */
  category: BiomarkerCategory
  /** Unit of measurement */
  unit: string
  /** Measured value, or null if not included in panel */
  value: number | null
  /** Reference range from SiPhox API */
  referenceRange: {
    low?: number
    high?: number
    optimalLow?: number
    optimalHigh?: number
  } | null
  /** Computed status based on value + reference range */
  status: BiomarkerStatus
  /** Whether lower is better for this marker */
  lowerIsBetter: boolean
  /** Patient-facing description */
  description: string
  /** SiPhox-provided status string (raw) */
  rawStatus: string | null
}

export interface ProcessedCategory {
  key: BiomarkerCategory
  label: string
  description: string
  biomarkers: ProcessedBiomarker[]
  /** Count of biomarkers with values (not N/A) */
  measuredCount: number
  /** Count in optimal range */
  optimalCount: number
}

export interface ProcessedReport {
  /** SiPhox report ID */
  reportId: string
  /** When report was created */
  createdAt: string | null
  /** Biomarkers organized by category */
  categories: ProcessedCategory[]
  /** SiPhox suggestions (actionable insights) */
  suggestions: Array<{
    text: string
    category?: string
    link?: string
  }>
  /** Summary stats */
  summary: {
    totalBiomarkers: number
    measuredCount: number
    optimalCount: number
    needsAttentionCount: number
    naCount: number
  }
}

// ============================================================
// REPORT FETCHING + CACHING
// ============================================================

/**
 * Fetch reports from SiPhox API and cache any new ones in DB.
 * Returns all cached reports for the customer (newest first).
 *
 * Strategy:
 * 1. Get existing cached reports from DB
 * 2. Fetch from SiPhox API
 * 3. Insert any new reports not already cached
 * 4. Return merged list
 *
 * If SiPhox API is unreachable, falls back to cached data only.
 */
export async function fetchAndCacheReports(
  siphoxCustomerId: string
): Promise<SiphoxReportRow[]> {
  // 1. Get cached reports
  let cachedReports: SiphoxReportRow[] = []
  try {
    cachedReports = await getReportsByCustomer(siphoxCustomerId)
  } catch {
    // DB unavailable — proceed with API-only
  }

  const cachedIds = new Set(cachedReports.map(r => r.siphox_report_id))

  // 2. Fetch from SiPhox API
  let apiReports: SiphoxReport[] = []
  try {
    apiReports = await getReports(siphoxCustomerId)
  } catch {
    // API unreachable — return cached data only
    return cachedReports
  }

  // 3. Insert new reports
  const newReports: SiphoxReportRow[] = []
  for (const report of apiReports) {
    if (!cachedIds.has(report._id)) {
      try {
        const row = await insertReport(
          siphoxCustomerId,
          report._id,
          report.biomarkers,
          report.suggestions,
          report.status
        )
        newReports.push(row)
      } catch {
        // Insert failed (likely duplicate race) — skip
      }
    }
  }

  // 4. Return all reports, newest first
  if (newReports.length > 0) {
    return [...newReports, ...cachedReports]
  }
  return cachedReports
}

// ============================================================
// BIOMARKER STATUS COMPUTATION
// ============================================================

/**
 * Determine biomarker status from value and reference range.
 * Uses SiPhox-provided ranges when available.
 */
function computeStatus(
  value: number | null,
  referenceRange: SiphoxBiomarkerResult['reference_range'],
  rawStatus: string | undefined
): BiomarkerStatus {
  if (value === null) return 'na'

  // If SiPhox provides a status, map it
  if (rawStatus) {
    const normalized = rawStatus.toLowerCase()
    if (normalized === 'optimal') return 'optimal'
    if (normalized === 'normal' || normalized === 'acceptable') return 'normal'
    if (normalized === 'low' || normalized === 'below') return 'low'
    if (normalized === 'high' || normalized === 'above' || normalized === 'elevated') return 'high'
    if (normalized === 'critical') return 'critical'
  }

  // Compute from reference range
  if (!referenceRange) return 'normal'

  const { low, high, optimal_low, optimal_high } = referenceRange

  // Check optimal range first (narrower)
  if (optimal_low !== undefined && optimal_high !== undefined) {
    if (value >= optimal_low && value <= optimal_high) return 'optimal'
  }

  // Check acceptable range
  if (low !== undefined && value < low) return 'low'
  if (high !== undefined && value > high) return 'high'

  return 'normal'
}

// ============================================================
// REPORT PROCESSING
// ============================================================

/**
 * Process a raw SiPhox report into UI-ready categorized data.
 * Matches biomarkers against the catalog, computes statuses,
 * and organizes by body system category.
 */
export function processReport(report: {
  _id?: string
  siphox_report_id?: string
  biomarkers?: SiphoxBiomarkerResult[]
  report_data?: unknown
  suggestions?: unknown
  created_at?: string | null
}): ProcessedReport {
  const reportId = report._id || report.siphox_report_id || 'unknown'
  const createdAt = report.created_at || null

  // Extract biomarkers — from API response or cached DB row
  const rawBiomarkers: SiphoxBiomarkerResult[] =
    report.biomarkers || (Array.isArray(report.report_data) ? report.report_data : [])

  // Process each biomarker
  const processedBiomarkers: ProcessedBiomarker[] = rawBiomarkers.map(raw => {
    const definition = findBiomarker(raw.biomarker)

    return {
      siphoxName: raw.biomarker,
      displayName: definition?.displayName || raw.biomarker,
      abbreviation: definition?.abbreviation || raw.biomarker.slice(0, 6),
      category: definition?.category || 'extended',
      unit: raw.unit || definition?.unit || '',
      value: raw.value,
      referenceRange: raw.reference_range ? {
        low: raw.reference_range.low,
        high: raw.reference_range.high,
        optimalLow: raw.reference_range.optimal_low,
        optimalHigh: raw.reference_range.optimal_high,
      } : null,
      status: computeStatus(raw.value, raw.reference_range, raw.status),
      lowerIsBetter: definition?.lowerIsBetter ?? false,
      description: definition?.description || '',
      rawStatus: raw.status || null,
    }
  })

  // Group by category
  const orderedCategories = getOrderedCategories()
  const biomarkersByCategory = new Map<BiomarkerCategory, ProcessedBiomarker[]>()
  for (const b of processedBiomarkers) {
    const existing = biomarkersByCategory.get(b.category) || []
    existing.push(b)
    biomarkersByCategory.set(b.category, existing)
  }

  // Build category list with sort order from catalog
  const categories: ProcessedCategory[] = orderedCategories
    .map(cat => {
      const biomarkers = biomarkersByCategory.get(cat.key) || []
      // Sort within category by catalog sortOrder
      biomarkers.sort((a, b) => {
        const defA = findBiomarker(a.siphoxName)
        const defB = findBiomarker(b.siphoxName)
        return (defA?.sortOrder ?? 99) - (defB?.sortOrder ?? 99)
      })

      const measured = biomarkers.filter(b => b.value !== null)
      const optimal = biomarkers.filter(b => b.status === 'optimal')

      return {
        key: cat.key,
        label: BIOMARKER_CATEGORIES[cat.key].label,
        description: BIOMARKER_CATEGORIES[cat.key].description,
        biomarkers,
        measuredCount: measured.length,
        optimalCount: optimal.length,
      }
    })
    .filter(cat => cat.biomarkers.length > 0)

  // Parse suggestions
  const rawSuggestions = Array.isArray(report.suggestions) ? report.suggestions : []
  const suggestions = rawSuggestions.map((s: Record<string, unknown>) => ({
    text: typeof s.text === 'string' ? s.text : String(s.text || ''),
    category: typeof s.category === 'string' ? s.category : undefined,
    link: typeof s.link === 'string' ? s.link : undefined,
  }))

  // Summary stats
  const totalBiomarkers = processedBiomarkers.length
  const measuredCount = processedBiomarkers.filter(b => b.value !== null).length
  const optimalCount = processedBiomarkers.filter(b => b.status === 'optimal').length
  const needsAttentionCount = processedBiomarkers.filter(
    b => b.status === 'low' || b.status === 'high' || b.status === 'critical'
  ).length
  const naCount = processedBiomarkers.filter(b => b.status === 'na').length

  return {
    reportId,
    createdAt,
    categories,
    suggestions,
    summary: {
      totalBiomarkers,
      measuredCount,
      optimalCount,
      needsAttentionCount,
      naCount,
    },
  }
}

/**
 * Full pipeline: fetch, cache, and process the latest report for a customer.
 * Returns null if no reports exist.
 */
export async function getLatestProcessedReport(
  siphoxCustomerId: string
): Promise<ProcessedReport | null> {
  const reports = await fetchAndCacheReports(siphoxCustomerId)

  if (reports.length === 0) return null

  // Process the most recent report
  const latest = reports[0]
  return processReport({
    siphox_report_id: latest.siphox_report_id,
    report_data: latest.report_data,
    suggestions: latest.suggestions,
    created_at: latest.created_at?.toISOString?.() || null,
  })
}
