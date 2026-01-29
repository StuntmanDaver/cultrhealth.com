/**
 * Data Normalization Service
 * 
 * Standardizes lab results from Healthie API into computable biological data
 * for the Resilience Engine and data warehouse exports.
 * 
 * Converts various lab result formats (strings, PDFs, different units) into
 * normalized, queryable values aligned with BIOMARKER_DEFINITIONS.
 */

import { 
  BIOMARKER_DEFINITIONS, 
  type BiomarkerDefinition, 
  type BiomarkerUnit, 
  type BiomarkerValue 
} from './resilience'

// ============================================================================
// UNIT CONVERSION DEFINITIONS
// ============================================================================

type ConversionFactor = {
  from: string
  to: BiomarkerUnit
  factor: number
  operation: 'multiply' | 'divide'
}

// Standard unit conversions for common lab markers
const UNIT_CONVERSIONS: ConversionFactor[] = [
  // Glucose conversions
  { from: 'mmol/L', to: 'mg/dL', factor: 18.018, operation: 'multiply' },
  { from: 'mmol/l', to: 'mg/dL', factor: 18.018, operation: 'multiply' },
  
  // Cholesterol conversions
  { from: 'mmol/L', to: 'mg/dL', factor: 38.67, operation: 'multiply' },
  
  // Testosterone conversions
  { from: 'nmol/L', to: 'ng/dL', factor: 28.84, operation: 'multiply' },
  { from: 'nmol/l', to: 'ng/dL', factor: 28.84, operation: 'multiply' },
  
  // Vitamin D conversions
  { from: 'nmol/L', to: 'ng/mL', factor: 2.496, operation: 'divide' },
  { from: 'nmol/l', to: 'ng/mL', factor: 2.496, operation: 'divide' },
  
  // CRP conversions
  { from: 'nmol/L', to: 'mg/L', factor: 9.524, operation: 'divide' },
  { from: 'mg/dL', to: 'mg/L', factor: 10, operation: 'multiply' },
  
  // TSH - usually consistent but handle variations
  { from: 'μIU/mL', to: 'mIU/L', factor: 1, operation: 'multiply' },
  { from: 'uIU/mL', to: 'mIU/L', factor: 1, operation: 'multiply' },
  
  // Insulin conversions
  { from: 'pmol/L', to: 'μIU/mL', factor: 6.945, operation: 'divide' },
  
  // IGF-1 conversions
  { from: 'nmol/L', to: 'ng/mL', factor: 7.649, operation: 'multiply' },
  
  // Homocysteine 
  { from: 'μmol/L', to: 'mg/L', factor: 0.135, operation: 'multiply' },
  { from: 'umol/L', to: 'mg/L', factor: 0.135, operation: 'multiply' },
]

// ============================================================================
// BIOMARKER NAME ALIASES
// ============================================================================

// Maps various lab names to our standardized biomarker IDs
const BIOMARKER_ALIASES: Record<string, string> = {
  // CRP variations
  'c-reactive protein': 'hs-crp',
  'crp': 'hs-crp',
  'hs-crp': 'hs-crp',
  'high sensitivity crp': 'hs-crp',
  'c reactive protein, high sensitivity': 'hs-crp',
  'crp, high sensitivity': 'hs-crp',
  
  // Glucose variations
  'glucose': 'fasting-glucose',
  'glucose, fasting': 'fasting-glucose',
  'fasting glucose': 'fasting-glucose',
  'blood glucose': 'fasting-glucose',
  'fbs': 'fasting-glucose',
  
  // HbA1c variations
  'hemoglobin a1c': 'hba1c',
  'hba1c': 'hba1c',
  'a1c': 'hba1c',
  'glycated hemoglobin': 'hba1c',
  'glycosylated hemoglobin': 'hba1c',
  
  // Insulin variations
  'insulin': 'fasting-insulin',
  'fasting insulin': 'fasting-insulin',
  'insulin, fasting': 'fasting-insulin',
  
  // Testosterone variations
  'testosterone': 'total-testosterone',
  'testosterone, total': 'total-testosterone',
  'total testosterone': 'total-testosterone',
  'testosterone total': 'total-testosterone',
  
  // Free T3 variations
  'free t3': 'free-t3',
  't3, free': 'free-t3',
  'triiodothyronine, free': 'free-t3',
  'ft3': 'free-t3',
  
  // TSH variations
  'tsh': 'tsh',
  'thyroid stimulating hormone': 'tsh',
  'thyrotropin': 'tsh',
  
  // Vitamin D variations
  'vitamin d': 'vitamin-d',
  '25-hydroxy vitamin d': 'vitamin-d',
  '25-oh vitamin d': 'vitamin-d',
  'vitamin d, 25-hydroxy': 'vitamin-d',
  '25(oh)d': 'vitamin-d',
  
  // IGF-1 variations
  'igf-1': 'igf-1',
  'igf1': 'igf-1',
  'insulin-like growth factor 1': 'igf-1',
  'somatomedin c': 'igf-1',
  
  // DHEA-S variations
  'dhea-s': 'dhea-s',
  'dhea sulfate': 'dhea-s',
  'dheas': 'dhea-s',
  'dehydroepiandrosterone sulfate': 'dhea-s',
  
  // Homocysteine variations
  'homocysteine': 'homocysteine',
  'hcy': 'homocysteine',
}

// ============================================================================
// RAW LAB RESULT TYPES (from Healthie or other sources)
// ============================================================================

export interface RawLabResult {
  name: string
  value: string | number
  unit?: string
  referenceRange?: string
  date?: string | Date
  source?: string
  labCompany?: string
}

export interface NormalizedLabResult {
  biomarkerId: string
  biomarkerName: string
  originalName: string
  originalValue: string | number
  originalUnit?: string
  normalizedValue: number
  normalizedUnit: BiomarkerUnit
  referenceRange?: string
  date: Date
  source?: string
  confidence: 'high' | 'medium' | 'low'
  conversionApplied: boolean
}

export interface NormalizationResult {
  successful: NormalizedLabResult[]
  unmatched: RawLabResult[]
  errors: { result: RawLabResult; error: string }[]
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Extract numeric value from a string that may contain units or ranges
 */
export function extractNumericValue(value: string | number): number | null {
  if (typeof value === 'number') return value
  
  // Handle common string formats
  const cleanValue = value.trim()
  
  // Direct number
  const directNum = parseFloat(cleanValue)
  if (!isNaN(directNum) && /^-?\d+\.?\d*$/.test(cleanValue)) {
    return directNum
  }
  
  // Number with units (e.g., "45.5 ng/mL")
  const withUnits = cleanValue.match(/^(-?\d+\.?\d*)\s*[a-zA-Z/%]+/)
  if (withUnits) {
    return parseFloat(withUnits[1])
  }
  
  // Less than / greater than (e.g., "<0.5", ">1000")
  const lessThan = cleanValue.match(/^[<≤]\s*(-?\d+\.?\d*)/)
  if (lessThan) {
    return parseFloat(lessThan[1])
  }
  
  const greaterThan = cleanValue.match(/^[>≥]\s*(-?\d+\.?\d*)/)
  if (greaterThan) {
    return parseFloat(greaterThan[1])
  }
  
  // Range (e.g., "45-50") - take the midpoint
  const range = cleanValue.match(/^(-?\d+\.?\d*)\s*[-–]\s*(-?\d+\.?\d*)/)
  if (range) {
    const low = parseFloat(range[1])
    const high = parseFloat(range[2])
    return (low + high) / 2
  }
  
  return null
}

/**
 * Extract unit from a value string
 */
export function extractUnit(value: string): string | null {
  if (typeof value !== 'string') return null
  
  // Match common unit patterns
  const unitMatch = value.match(/\d\s*([a-zA-Zμ/%]+(?:\/[a-zA-Z]+)?)$/)
  if (unitMatch) {
    return unitMatch[1].trim()
  }
  
  return null
}

/**
 * Normalize unit string to standard format
 */
export function normalizeUnitString(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('µ', 'μ') // Greek mu normalization
    .replace('micro', 'μ')
}

// ============================================================================
// CONVERSION ENGINE
// ============================================================================

/**
 * Convert a value from one unit to another
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: BiomarkerUnit
): { value: number; converted: boolean } {
  const normalizedFrom = normalizeUnitString(fromUnit)
  const normalizedTo = normalizeUnitString(toUnit)
  
  // Same unit, no conversion needed
  if (normalizedFrom === normalizedTo) {
    return { value, converted: false }
  }
  
  // Find conversion
  const conversion = UNIT_CONVERSIONS.find(
    c => normalizeUnitString(c.from) === normalizedFrom && normalizeUnitString(c.to) === normalizedTo
  )
  
  if (conversion) {
    const convertedValue = conversion.operation === 'multiply'
      ? value * conversion.factor
      : value / conversion.factor
    return { value: convertedValue, converted: true }
  }
  
  // Try reverse conversion
  const reverseConversion = UNIT_CONVERSIONS.find(
    c => normalizeUnitString(c.to) === normalizedFrom && normalizeUnitString(c.from) === normalizedTo
  )
  
  if (reverseConversion) {
    const convertedValue = reverseConversion.operation === 'multiply'
      ? value / reverseConversion.factor
      : value * reverseConversion.factor
    return { value: convertedValue, converted: true }
  }
  
  // No conversion found, return original
  return { value, converted: false }
}

/**
 * Match a lab result name to a standardized biomarker ID
 */
export function matchBiomarker(labName: string): BiomarkerDefinition | null {
  const normalizedName = labName.toLowerCase().trim()
  
  // Check aliases first
  const aliasMatch = BIOMARKER_ALIASES[normalizedName]
  if (aliasMatch) {
    return BIOMARKER_DEFINITIONS.find(b => b.id === aliasMatch) || null
  }
  
  // Check for partial matches in aliases
  for (const [alias, biomarkerId] of Object.entries(BIOMARKER_ALIASES)) {
    if (normalizedName.includes(alias) || alias.includes(normalizedName)) {
      return BIOMARKER_DEFINITIONS.find(b => b.id === biomarkerId) || null
    }
  }
  
  // Check direct biomarker name match
  const directMatch = BIOMARKER_DEFINITIONS.find(
    b => b.name.toLowerCase().includes(normalizedName) || 
         normalizedName.includes(b.name.toLowerCase())
  )
  
  return directMatch || null
}

// ============================================================================
// MAIN NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize a single lab result
 */
export function normalizeLabResult(raw: RawLabResult): NormalizedLabResult | { error: string } {
  // Match to biomarker
  const biomarker = matchBiomarker(raw.name)
  if (!biomarker) {
    return { error: `No matching biomarker found for "${raw.name}"` }
  }
  
  // Extract numeric value
  const numericValue = extractNumericValue(raw.value)
  if (numericValue === null) {
    return { error: `Could not extract numeric value from "${raw.value}"` }
  }
  
  // Determine source unit
  const sourceUnit = raw.unit || extractUnit(String(raw.value)) || biomarker.unit
  
  // Convert to target unit
  const { value: normalizedValue, converted } = convertUnit(
    numericValue,
    sourceUnit,
    biomarker.unit
  )
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'high'
  if (converted) confidence = 'medium'
  if (!raw.unit && !extractUnit(String(raw.value))) confidence = 'low'
  
  // Parse date
  let date: Date
  if (raw.date instanceof Date) {
    date = raw.date
  } else if (raw.date) {
    date = new Date(raw.date)
    if (isNaN(date.getTime())) {
      date = new Date()
    }
  } else {
    date = new Date()
  }
  
  return {
    biomarkerId: biomarker.id,
    biomarkerName: biomarker.name,
    originalName: raw.name,
    originalValue: raw.value,
    originalUnit: raw.unit,
    normalizedValue: Math.round(normalizedValue * 100) / 100, // 2 decimal places
    normalizedUnit: biomarker.unit,
    referenceRange: raw.referenceRange,
    date,
    source: raw.source || raw.labCompany,
    confidence,
    conversionApplied: converted,
  }
}

/**
 * Normalize a batch of lab results
 */
export function normalizeLabResults(rawResults: RawLabResult[]): NormalizationResult {
  const successful: NormalizedLabResult[] = []
  const unmatched: RawLabResult[] = []
  const errors: { result: RawLabResult; error: string }[] = []
  
  for (const raw of rawResults) {
    const result = normalizeLabResult(raw)
    
    if ('error' in result) {
      if (result.error.includes('No matching biomarker')) {
        unmatched.push(raw)
      } else {
        errors.push({ result: raw, error: result.error })
      }
    } else {
      successful.push(result)
    }
  }
  
  return { successful, unmatched, errors }
}

/**
 * Convert normalized results to BiomarkerValue format for Resilience scoring
 */
export function toBiomarkerValues(normalized: NormalizedLabResult[]): BiomarkerValue[] {
  return normalized.map(n => ({
    biomarkerId: n.biomarkerId,
    value: n.normalizedValue,
    measuredAt: n.date,
    source: n.source,
  }))
}

// ============================================================================
// HEALTHIE INTEGRATION
// ============================================================================

export interface HealthieLabResultInput {
  id: string
  name?: string
  value?: string
  unit?: string
  normal_range?: string
  date?: string
  status?: string
}

/**
 * Transform Healthie API lab results to raw format for normalization
 */
export function transformHealthieResults(
  healthieResults: HealthieLabResultInput[]
): RawLabResult[] {
  return healthieResults
    .filter(r => r.name && r.value) // Must have name and value
    .map(r => ({
      name: r.name!,
      value: r.value!,
      unit: r.unit,
      referenceRange: r.normal_range,
      date: r.date,
      source: 'Healthie',
    }))
}

/**
 * Full pipeline: Healthie results -> Normalized -> BiomarkerValues
 */
export function processHealthieLabResults(
  healthieResults: HealthieLabResultInput[]
): {
  biomarkerValues: BiomarkerValue[]
  normalizationResult: NormalizationResult
} {
  const rawResults = transformHealthieResults(healthieResults)
  const normalizationResult = normalizeLabResults(rawResults)
  const biomarkerValues = toBiomarkerValues(normalizationResult.successful)
  
  return {
    biomarkerValues,
    normalizationResult,
  }
}

// ============================================================================
// DATA QUALITY METRICS
// ============================================================================

export interface DataQualityReport {
  totalResults: number
  normalizedCount: number
  unmatchedCount: number
  errorCount: number
  normalizationRate: number // 0-1
  averageConfidence: number // 0-1
  biomarkerCoverage: number // % of defined biomarkers with data
  oldestResult?: Date
  newestResult?: Date
  recommendations: string[]
}

/**
 * Generate a data quality report for a normalization result
 */
export function generateDataQualityReport(
  result: NormalizationResult
): DataQualityReport {
  const totalResults = result.successful.length + result.unmatched.length + result.errors.length
  
  const confidenceMap = { high: 1, medium: 0.66, low: 0.33 }
  const avgConfidence = result.successful.length > 0
    ? result.successful.reduce((sum, r) => sum + confidenceMap[r.confidence], 0) / result.successful.length
    : 0
  
  const uniqueBiomarkers = new Set(result.successful.map(r => r.biomarkerId))
  const coverage = uniqueBiomarkers.size / BIOMARKER_DEFINITIONS.length
  
  const dates = result.successful.map(r => r.date).filter(d => d instanceof Date)
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  
  const recommendations: string[] = []
  
  if (result.unmatched.length > 0) {
    recommendations.push(`${result.unmatched.length} lab results could not be matched. Consider adding aliases for common tests at your lab provider.`)
  }
  
  if (avgConfidence < 0.7) {
    recommendations.push('Many results lack unit information. Request unit-annotated results from your lab provider.')
  }
  
  if (coverage < 0.5) {
    recommendations.push('Less than half of the tracked biomarkers have data. Consider ordering a comprehensive panel.')
  }
  
  const missingCritical = ['hs-crp', 'hba1c', 'fasting-insulin'].filter(
    id => !uniqueBiomarkers.has(id)
  )
  if (missingCritical.length > 0) {
    recommendations.push(`Missing critical markers: ${missingCritical.join(', ')}. These are essential for Resilience scoring.`)
  }
  
  return {
    totalResults,
    normalizedCount: result.successful.length,
    unmatchedCount: result.unmatched.length,
    errorCount: result.errors.length,
    normalizationRate: totalResults > 0 ? result.successful.length / totalResults : 0,
    averageConfidence: avgConfidence,
    biomarkerCoverage: coverage,
    oldestResult: sortedDates[0],
    newestResult: sortedDates[sortedDates.length - 1],
    recommendations,
  }
}

// ============================================================================
// EXPORT FOR DATA WAREHOUSE
// ============================================================================

export interface NormalizedDataExport {
  patientId: string
  exportDate: string
  dataQuality: DataQualityReport
  biomarkers: {
    id: string
    name: string
    value: number
    unit: string
    date: string
    confidence: string
  }[]
}

/**
 * Prepare normalized data for export to data warehouse
 */
export function prepareDataExport(
  patientId: string,
  normalizationResult: NormalizationResult
): NormalizedDataExport {
  const qualityReport = generateDataQualityReport(normalizationResult)
  
  return {
    patientId,
    exportDate: new Date().toISOString(),
    dataQuality: qualityReport,
    biomarkers: normalizationResult.successful.map(r => ({
      id: r.biomarkerId,
      name: r.biomarkerName,
      value: r.normalizedValue,
      unit: r.normalizedUnit,
      date: r.date.toISOString(),
      confidence: r.confidence,
    })),
  }
}
