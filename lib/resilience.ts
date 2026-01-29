/**
 * Resilience Engine
 * 
 * Calculates a composite "Cellular Resilience Score" based on biomarkers
 * to align with Altos Labs' mission of cellular rejuvenation.
 * 
 * The score represents the body's capacity to resist stressors that give
 * rise to disease - directly aligned with Altos' research focus.
 */

// ============================================================================
// BIOMARKER DEFINITIONS
// ============================================================================

export type BiomarkerCategory = 
  | 'inflammation'
  | 'metabolic'
  | 'hormonal'
  | 'longevity'
  | 'oxidative'
  | 'mitochondrial'

export type BiomarkerUnit = 
  | 'mg/L'      // CRP, etc.
  | 'mg/dL'     // Glucose, cholesterol
  | 'ng/dL'     // Testosterone
  | 'mIU/L'     // TSH
  | 'ng/mL'     // Vitamin D, Ferritin
  | 'pmol/L'    // Free T4, Free T3
  | '%'         // HbA1c
  | 'μIU/mL'    // Insulin
  | 'U/L'       // Liver enzymes
  | 'pg/mL'     // Estradiol
  | 'years'     // Biological age

export interface BiomarkerDefinition {
  id: string
  name: string
  category: BiomarkerCategory
  unit: BiomarkerUnit
  optimalRange: { min: number; max: number }
  acceptableRange: { min: number; max: number }
  weight: number // Contribution to overall score (0-1)
  lowerIsBetter?: boolean // For markers like CRP where lower is better
  description: string
}

// Core biomarkers for Resilience Score calculation
export const BIOMARKER_DEFINITIONS: BiomarkerDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // INFLAMMATION (Weight: 25%)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'hs-crp',
    name: 'High-Sensitivity C-Reactive Protein',
    category: 'inflammation',
    unit: 'mg/L',
    optimalRange: { min: 0, max: 1.0 },
    acceptableRange: { min: 0, max: 3.0 },
    weight: 0.15,
    lowerIsBetter: true,
    description: 'Primary marker of systemic inflammation and cardiovascular risk',
  },
  {
    id: 'homocysteine',
    name: 'Homocysteine',
    category: 'inflammation',
    unit: 'mg/L', // Actually μmol/L but simplified
    optimalRange: { min: 5, max: 10 },
    acceptableRange: { min: 4, max: 15 },
    weight: 0.10,
    lowerIsBetter: true,
    description: 'Marker of methylation efficiency and cardiovascular health',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // METABOLIC HEALTH (Weight: 30%)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'fasting-glucose',
    name: 'Fasting Glucose',
    category: 'metabolic',
    unit: 'mg/dL',
    optimalRange: { min: 70, max: 90 },
    acceptableRange: { min: 65, max: 100 },
    weight: 0.10,
    description: 'Baseline blood sugar regulation',
  },
  {
    id: 'hba1c',
    name: 'Hemoglobin A1c',
    category: 'metabolic',
    unit: '%',
    optimalRange: { min: 4.5, max: 5.3 },
    acceptableRange: { min: 4.0, max: 5.7 },
    weight: 0.10,
    lowerIsBetter: true,
    description: '3-month average blood sugar; correlates with aging rate',
  },
  {
    id: 'fasting-insulin',
    name: 'Fasting Insulin',
    category: 'metabolic',
    unit: 'μIU/mL',
    optimalRange: { min: 2, max: 6 },
    acceptableRange: { min: 1, max: 10 },
    weight: 0.10,
    lowerIsBetter: true,
    description: 'Insulin sensitivity marker; key longevity indicator',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HORMONAL STATUS (Weight: 20%)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'total-testosterone',
    name: 'Total Testosterone',
    category: 'hormonal',
    unit: 'ng/dL',
    optimalRange: { min: 500, max: 900 }, // Male reference
    acceptableRange: { min: 300, max: 1100 },
    weight: 0.08,
    description: 'Anabolic hormone; supports muscle, cognition, mood',
  },
  {
    id: 'free-t3',
    name: 'Free T3',
    category: 'hormonal',
    unit: 'pmol/L',
    optimalRange: { min: 4.5, max: 6.5 },
    acceptableRange: { min: 3.5, max: 7.5 },
    weight: 0.06,
    description: 'Active thyroid hormone; metabolic rate controller',
  },
  {
    id: 'tsh',
    name: 'Thyroid Stimulating Hormone',
    category: 'hormonal',
    unit: 'mIU/L',
    optimalRange: { min: 0.5, max: 2.0 },
    acceptableRange: { min: 0.3, max: 4.5 },
    weight: 0.06,
    lowerIsBetter: false, // Optimal is in middle
    description: 'Thyroid function regulator',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LONGEVITY MARKERS (Weight: 25%)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'vitamin-d',
    name: 'Vitamin D (25-OH)',
    category: 'longevity',
    unit: 'ng/mL',
    optimalRange: { min: 50, max: 80 },
    acceptableRange: { min: 30, max: 100 },
    weight: 0.08,
    description: 'Immune function, bone health, gene expression',
  },
  {
    id: 'igf-1',
    name: 'Insulin-like Growth Factor 1',
    category: 'longevity',
    unit: 'ng/mL',
    optimalRange: { min: 150, max: 250 },
    acceptableRange: { min: 100, max: 350 },
    weight: 0.07,
    description: 'Growth and repair; optimal level is age-dependent',
  },
  {
    id: 'dhea-s',
    name: 'DHEA-Sulfate',
    category: 'longevity',
    unit: 'ng/mL', // Actually μg/dL
    optimalRange: { min: 200, max: 400 },
    acceptableRange: { min: 100, max: 500 },
    weight: 0.05,
    description: 'Adrenal hormone; declines with age',
  },
  {
    id: 'biological-age',
    name: 'Biological Age (Epigenetic)',
    category: 'longevity',
    unit: 'years',
    optimalRange: { min: -10, max: 0 }, // Years younger than chronological
    acceptableRange: { min: -15, max: 5 },
    weight: 0.05,
    lowerIsBetter: true,
    description: 'Epigenetic clock measurement vs chronological age',
  },
]

// ============================================================================
// BIOMARKER VALUE & SCORE TYPES
// ============================================================================

export interface BiomarkerValue {
  biomarkerId: string
  value: number
  measuredAt: Date
  source?: string // Lab provider, device, etc.
}

export interface BiomarkerScore {
  biomarkerId: string
  name: string
  category: BiomarkerCategory
  value: number
  unit: BiomarkerUnit
  score: number // 0-100
  status: 'optimal' | 'acceptable' | 'suboptimal' | 'critical'
  trend?: 'improving' | 'stable' | 'declining'
  recommendation?: string
}

export interface CategoryScore {
  category: BiomarkerCategory
  score: number // 0-100
  markers: BiomarkerScore[]
  trend?: 'improving' | 'stable' | 'declining'
}

export interface ResilienceScore {
  overallScore: number // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  categories: CategoryScore[]
  topStrengths: BiomarkerScore[]
  priorityAreas: BiomarkerScore[]
  calculatedAt: Date
  dataCompleteness: number // % of biomarkers with values
  biologicalAge?: number
  chronologicalAge?: number
  ageGap?: number // biologicalAge - chronologicalAge (negative is better)
}

// ============================================================================
// SCORE CALCULATION ENGINE
// ============================================================================

/**
 * Calculate individual biomarker score (0-100)
 */
export function calculateBiomarkerScore(
  definition: BiomarkerDefinition,
  value: number
): { score: number; status: BiomarkerScore['status'] } {
  const { optimalRange, acceptableRange, lowerIsBetter } = definition

  // Perfect score if within optimal range
  if (value >= optimalRange.min && value <= optimalRange.max) {
    return { score: 100, status: 'optimal' }
  }

  // Good score if within acceptable range
  if (value >= acceptableRange.min && value <= acceptableRange.max) {
    // Calculate position within acceptable range (outside optimal)
    let score: number
    
    if (value < optimalRange.min) {
      // Below optimal but within acceptable
      const distance = optimalRange.min - value
      const maxDistance = optimalRange.min - acceptableRange.min
      score = 70 + (30 * (1 - distance / maxDistance))
    } else {
      // Above optimal but within acceptable
      const distance = value - optimalRange.max
      const maxDistance = acceptableRange.max - optimalRange.max
      score = 70 + (30 * (1 - distance / maxDistance))
    }
    
    return { score: Math.round(score), status: 'acceptable' }
  }

  // Suboptimal if outside acceptable range
  let score: number
  
  if (value < acceptableRange.min) {
    // Way below - calculate how far
    const distanceFromAcceptable = acceptableRange.min - value
    const baseDistance = acceptableRange.min - (acceptableRange.min * 0.5) // 50% below acceptable
    score = Math.max(0, 50 * (1 - distanceFromAcceptable / baseDistance))
    
    // For "lower is better" markers, being too low is bad
    if (lowerIsBetter && value < optimalRange.min * 0.3) {
      return { score: Math.round(score), status: 'critical' }
    }
  } else {
    // Way above
    const distanceFromAcceptable = value - acceptableRange.max
    const baseDistance = acceptableRange.max * 0.5 // 50% above acceptable
    score = Math.max(0, 50 * (1 - distanceFromAcceptable / baseDistance))
  }

  // Determine if critical
  if (score < 25) {
    return { score: Math.round(score), status: 'critical' }
  }
  
  return { score: Math.round(score), status: 'suboptimal' }
}

/**
 * Get recommendation based on biomarker status
 */
export function getBiomarkerRecommendation(
  definition: BiomarkerDefinition,
  value: number,
  status: BiomarkerScore['status']
): string {
  if (status === 'optimal') {
    return 'Maintain current protocol and lifestyle factors.'
  }

  const recommendations: Record<string, Record<string, string>> = {
    'hs-crp': {
      high: 'Consider anti-inflammatory interventions: Omega-3 (2-4g), Curcumin, reduce processed foods. Investigate root cause.',
      low: 'Monitor for immune suppression if consistently very low.',
    },
    'hba1c': {
      high: 'Reduce refined carbohydrates, increase fiber. Consider Berberine or CGM monitoring.',
      low: 'Ensure adequate caloric intake. Rule out hypoglycemia.',
    },
    'fasting-insulin': {
      high: 'Implement time-restricted eating. Increase activity. Consider Metformin or Berberine.',
      low: 'May indicate excellent insulin sensitivity or inadequate beta cell function.',
    },
    'vitamin-d': {
      low: 'Supplement with D3 (5000-10000 IU daily with K2). Retest in 8 weeks.',
      high: 'Reduce supplementation. Check calcium levels.',
    },
    'total-testosterone': {
      low: 'Optimize sleep, reduce stress, ensure adequate zinc/D3. Consider TRT evaluation.',
      high: 'If not on TRT, investigate adrenal or testicular causes.',
    },
    'homocysteine': {
      high: 'Increase methylation support: B12, Folate, B6. Check MTHFR status.',
      low: 'Typically not concerning unless very low.',
    },
  }

  const markerRecs = recommendations[definition.id]
  if (!markerRecs) {
    return status === 'suboptimal' || status === 'critical'
      ? `Value outside optimal range. Consult provider for personalized recommendations.`
      : 'Continue monitoring.'
  }

  if (value < definition.optimalRange.min) {
    return markerRecs.low || 'Value below optimal. Discuss with provider.'
  }
  return markerRecs.high || 'Value above optimal. Discuss with provider.'
}

/**
 * Calculate trend from historical values
 */
export function calculateTrend(
  values: BiomarkerValue[],
  definition: BiomarkerDefinition
): 'improving' | 'stable' | 'declining' | undefined {
  if (values.length < 2) return undefined

  // Sort by date
  const sorted = [...values].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  )

  const oldest = sorted[0].value
  const newest = sorted[sorted.length - 1].value
  const percentChange = ((newest - oldest) / oldest) * 100

  // Less than 5% change is stable
  if (Math.abs(percentChange) < 5) return 'stable'

  // For "lower is better" markers, decrease is improvement
  if (definition.lowerIsBetter) {
    return percentChange < 0 ? 'improving' : 'declining'
  }

  // For most markers in optimal range, staying in range is good
  const newestScore = calculateBiomarkerScore(definition, newest).score
  const oldestScore = calculateBiomarkerScore(definition, oldest).score

  if (newestScore > oldestScore + 5) return 'improving'
  if (newestScore < oldestScore - 5) return 'declining'
  return 'stable'
}

/**
 * Main function: Calculate complete Resilience Score
 */
export function calculateResilienceScore(
  biomarkerValues: BiomarkerValue[],
  chronologicalAge?: number,
  historicalValues?: Map<string, BiomarkerValue[]>
): ResilienceScore {
  const markerScores: BiomarkerScore[] = []
  let weightedSum = 0
  let totalWeight = 0

  // Create lookup for current values
  const valueMap = new Map(
    biomarkerValues.map((v) => [v.biomarkerId, v])
  )

  // Calculate score for each biomarker
  for (const definition of BIOMARKER_DEFINITIONS) {
    const currentValue = valueMap.get(definition.id)
    
    if (!currentValue) continue // Skip if no data

    const { score, status } = calculateBiomarkerScore(definition, currentValue.value)
    const recommendation = getBiomarkerRecommendation(definition, currentValue.value, status)
    
    // Calculate trend if historical data available
    const history = historicalValues?.get(definition.id)
    const trend = history ? calculateTrend(history, definition) : undefined

    markerScores.push({
      biomarkerId: definition.id,
      name: definition.name,
      category: definition.category,
      value: currentValue.value,
      unit: definition.unit,
      score,
      status,
      trend,
      recommendation,
    })

    weightedSum += score * definition.weight
    totalWeight += definition.weight
  }

  // Calculate overall score
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  const dataCompleteness = Math.round(
    (markerScores.length / BIOMARKER_DEFINITIONS.length) * 100
  )

  // Group by category
  const categoryMap = new Map<BiomarkerCategory, BiomarkerScore[]>()
  for (const score of markerScores) {
    const existing = categoryMap.get(score.category) || []
    existing.push(score)
    categoryMap.set(score.category, existing)
  }

  const categories: CategoryScore[] = Array.from(categoryMap.entries()).map(
    ([category, markers]) => {
      const avgScore = markers.reduce((sum, m) => sum + m.score, 0) / markers.length
      
      // Determine category trend
      const trends = markers.map((m) => m.trend).filter(Boolean)
      let trend: CategoryScore['trend']
      if (trends.length > 0) {
        const improving = trends.filter((t) => t === 'improving').length
        const declining = trends.filter((t) => t === 'declining').length
        if (improving > declining) trend = 'improving'
        else if (declining > improving) trend = 'declining'
        else trend = 'stable'
      }

      return {
        category,
        score: Math.round(avgScore),
        markers,
        trend,
      }
    }
  )

  // Identify strengths and priority areas
  const sortedScores = [...markerScores].sort((a, b) => b.score - a.score)
  const topStrengths = sortedScores.filter((s) => s.status === 'optimal').slice(0, 3)
  const priorityAreas = sortedScores
    .filter((s) => s.status === 'suboptimal' || s.status === 'critical')
    .slice(-3)
    .reverse()

  // Calculate biological age gap if available
  const bioAgeMarker = markerScores.find((m) => m.biomarkerId === 'biological-age')
  const biologicalAge = bioAgeMarker ? bioAgeMarker.value : undefined
  const ageGap = biologicalAge && chronologicalAge 
    ? biologicalAge - chronologicalAge 
    : undefined

  return {
    overallScore,
    grade: getGrade(overallScore),
    categories,
    topStrengths,
    priorityAreas,
    calculatedAt: new Date(),
    dataCompleteness,
    biologicalAge,
    chronologicalAge,
    ageGap,
  }
}

/**
 * Convert score to letter grade
 */
export function getGrade(score: number): ResilienceScore['grade'] {
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

// ============================================================================
// PHENOTYPE CLUSTERING (for Altos Labs Cohort Segmentation)
// ============================================================================

export type Phenotype = 
  | 'high-inflammation-low-repair'
  | 'metabolic-dysfunction'
  | 'hormonal-imbalance'
  | 'accelerated-aging'
  | 'oxidative-stress'
  | 'resilient-baseline'

export interface PhenotypeClassification {
  primaryPhenotype: Phenotype
  secondaryPhenotypes: Phenotype[]
  confidence: number // 0-1
  description: string
  recommendedInterventions: string[]
}

/**
 * Classify user into phenotype cluster for cohort analysis
 */
export function classifyPhenotype(
  score: ResilienceScore
): PhenotypeClassification {
  const phenotypes: { type: Phenotype; score: number }[] = []

  // Calculate phenotype scores based on category performance
  const inflammationCategory = score.categories.find((c) => c.category === 'inflammation')
  const metabolicCategory = score.categories.find((c) => c.category === 'metabolic')
  const hormonalCategory = score.categories.find((c) => c.category === 'hormonal')
  const longevityCategory = score.categories.find((c) => c.category === 'longevity')

  // High inflammation / Low repair
  if (inflammationCategory && inflammationCategory.score < 60) {
    phenotypes.push({
      type: 'high-inflammation-low-repair',
      score: 100 - inflammationCategory.score,
    })
  }

  // Metabolic dysfunction
  if (metabolicCategory && metabolicCategory.score < 60) {
    phenotypes.push({
      type: 'metabolic-dysfunction',
      score: 100 - metabolicCategory.score,
    })
  }

  // Hormonal imbalance
  if (hormonalCategory && hormonalCategory.score < 60) {
    phenotypes.push({
      type: 'hormonal-imbalance',
      score: 100 - hormonalCategory.score,
    })
  }

  // Accelerated aging (based on age gap or overall longevity score)
  if (score.ageGap && score.ageGap > 5) {
    phenotypes.push({
      type: 'accelerated-aging',
      score: Math.min(100, score.ageGap * 10),
    })
  } else if (longevityCategory && longevityCategory.score < 50) {
    phenotypes.push({
      type: 'accelerated-aging',
      score: 100 - longevityCategory.score,
    })
  }

  // If high overall score, classify as resilient
  if (score.overallScore >= 80 && phenotypes.length === 0) {
    return {
      primaryPhenotype: 'resilient-baseline',
      secondaryPhenotypes: [],
      confidence: score.overallScore / 100,
      description: 'Strong cellular resilience across all measured domains.',
      recommendedInterventions: [
        'Maintain current protocol',
        'Consider longevity optimization (Epitalon, NAD+)',
        'Annual epigenetic testing to track biological age',
      ],
    }
  }

  // Sort by score and classify
  phenotypes.sort((a, b) => b.score - a.score)
  const primary = phenotypes[0]?.type || 'resilient-baseline'
  const secondary = phenotypes.slice(1).map((p) => p.type)

  const descriptions: Record<Phenotype, string> = {
    'high-inflammation-low-repair': 'Elevated inflammatory markers suggest chronic inflammation impacting cellular repair mechanisms.',
    'metabolic-dysfunction': 'Metabolic markers indicate insulin resistance or glycemic dysregulation affecting cellular energy.',
    'hormonal-imbalance': 'Hormonal markers outside optimal ranges may be limiting cellular signaling and regeneration.',
    'accelerated-aging': 'Biological age markers suggest faster aging rate than chronological age.',
    'oxidative-stress': 'Markers suggest elevated oxidative damage impacting cellular function.',
    'resilient-baseline': 'Strong cellular resilience across all measured domains.',
  }

  const interventions: Record<Phenotype, string[]> = {
    'high-inflammation-low-repair': [
      'BPC-157 for tissue repair',
      'Omega-3 fatty acids (3-4g/day)',
      'Curcumin + Piperine',
      'Thymosin Alpha-1 for immune modulation',
    ],
    'metabolic-dysfunction': [
      'Time-restricted eating (16:8)',
      'MOTS-c for metabolic support',
      'Berberine or Metformin',
      'Continuous glucose monitoring',
    ],
    'hormonal-imbalance': [
      'Kisspeptin-10 for HPG axis',
      'Optimize sleep (DSIP if needed)',
      'Thyroid panel optimization',
      'Consider HRT evaluation',
    ],
    'accelerated-aging': [
      'Epitalon for telomerase activation',
      'NAD+ precursors (NMN/NR)',
      'Rapamycin (under medical supervision)',
      'Senolytics consideration',
    ],
    'oxidative-stress': [
      'Glutathione support (NAC, Liposomal)',
      'CoQ10 Ubiquinol',
      'Elamipretide for mitochondria',
      'Reduce environmental exposures',
    ],
    'resilient-baseline': [
      'Maintain current protocol',
      'Consider longevity optimization',
      'Annual epigenetic testing',
    ],
  }

  return {
    primaryPhenotype: primary,
    secondaryPhenotypes: secondary,
    confidence: primary === 'resilient-baseline' ? 0.9 : phenotypes[0]?.score / 100 || 0.5,
    description: descriptions[primary],
    recommendedInterventions: interventions[primary],
  }
}

// ============================================================================
// EXPORT UTILITIES FOR DATA WAREHOUSE
// ============================================================================

export interface AnonymizedPatientData {
  anonymousId: string // Hashed patient ID
  cohortDate: string
  chronologicalAge?: number
  biologicalAge?: number
  ageGap?: number
  resilienceScore: number
  grade: string
  primaryPhenotype: Phenotype
  categoryScores: Record<BiomarkerCategory, number>
  biomarkerValues: Record<string, number>
  protocolVersion?: string
  interventionIds?: string[]
}

/**
 * Prepare anonymized data for export to data warehouse
 * For "Institute of Computation" style analysis
 */
export function prepareAnonymizedExport(
  patientId: string,
  score: ResilienceScore,
  biomarkerValues: BiomarkerValue[],
  protocolVersion?: string,
  interventionIds?: string[]
): AnonymizedPatientData {
  // Create anonymous hash
  const encoder = new TextEncoder()
  const data = encoder.encode(patientId + process.env.ANONYMIZATION_SALT || 'cultr-salt')
  // Note: In production, use crypto.subtle.digest for proper hashing
  const anonymousId = Buffer.from(data).toString('base64').slice(0, 16)

  const phenotype = classifyPhenotype(score)

  const categoryScores: Record<string, number> = {}
  for (const cat of score.categories) {
    categoryScores[cat.category] = cat.score
  }

  const biomarkerMap: Record<string, number> = {}
  for (const value of biomarkerValues) {
    biomarkerMap[value.biomarkerId] = value.value
  }

  return {
    anonymousId,
    cohortDate: new Date().toISOString().split('T')[0],
    chronologicalAge: score.chronologicalAge,
    biologicalAge: score.biologicalAge,
    ageGap: score.ageGap,
    resilienceScore: score.overallScore,
    grade: score.grade,
    primaryPhenotype: phenotype.primaryPhenotype,
    categoryScores: categoryScores as Record<BiomarkerCategory, number>,
    biomarkerValues: biomarkerMap,
    protocolVersion,
    interventionIds,
  }
}
