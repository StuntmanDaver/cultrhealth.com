import { NextRequest, NextResponse } from 'next/server'
import { 
  processHealthieLabResults, 
  generateDataQualityReport 
} from '@/lib/data-normalization'
import { 
  calculateResilienceScore, 
  classifyPhenotype,
  BIOMARKER_DEFINITIONS,
  calculateBiomarkerScore 
} from '@/lib/resilience'
import { 
  createBiomarkerEntry, 
  createResilienceScore,
  getLatestBiomarkers 
} from '@/lib/db'

// =============================================================================
// HEALTHIE WEBHOOK HANDLER
// Receives lab results, vitals, and other patient data from Healthie EHR
// Normalizes data and stores for longitudinal analysis
// =============================================================================

interface HealthieWebhookPayload {
  event_type: string
  resource_type: string
  resource_id: string
  patient_id: string
  data: Record<string, unknown>
}

interface HealthieLabResult {
  id: string
  name?: string
  value?: string
  unit?: string
  normal_range?: string
  date?: string
  status?: string
}

interface HealthieVital {
  id: string
  type: string
  value: string
  unit?: string
  measured_at: string
}

// Verify webhook signature from Healthie
function verifyHealthieSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-healthie-signature')
  const webhookSecret = process.env.HEALTHIE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.warn('HEALTHIE_WEBHOOK_SECRET not configured')
    return true // Allow in development
  }
  
  if (!signature) {
    return false
  }
  
  // In production, verify HMAC signature
  // For now, basic check
  return signature.length > 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify webhook authenticity
    if (!verifyHealthieSignature(request, body)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const payload: HealthieWebhookPayload = JSON.parse(body)
    
    console.log('Healthie webhook received:', {
      event_type: payload.event_type,
      resource_type: payload.resource_type,
      patient_id: payload.patient_id,
    })
    
    // Route to appropriate handler
    switch (payload.resource_type) {
      case 'lab_result':
      case 'lab_results':
        return handleLabResults(payload)
      
      case 'vital':
      case 'vitals':
        return handleVitals(payload)
      
      case 'form_answer_group':
        return handleFormSubmission(payload)
      
      default:
        // Log but don't fail for unhandled types
        console.log('Unhandled Healthie resource type:', payload.resource_type)
        return NextResponse.json({ 
          received: true, 
          processed: false,
          reason: 'Unhandled resource type' 
        })
    }
  } catch (error) {
    console.error('Healthie webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// LAB RESULTS HANDLER
// Normalizes and stores lab results using the data-normalization pipeline
// =============================================================================

async function handleLabResults(payload: HealthieWebhookPayload) {
  const { patient_id, data } = payload
  const labResults = (data.lab_results || data.results || [data]) as HealthieLabResult[]
  
  if (!labResults || labResults.length === 0) {
    return NextResponse.json({ 
      received: true, 
      processed: false,
      reason: 'No lab results in payload' 
    })
  }
  
  // Process through normalization pipeline
  const { biomarkerValues, normalizationResult } = processHealthieLabResults(labResults)
  
  // Generate quality report for logging
  const qualityReport = generateDataQualityReport(normalizationResult)
  console.log('Lab normalization quality:', {
    patient_id,
    normalizedCount: qualityReport.normalizedCount,
    unmatchedCount: qualityReport.unmatchedCount,
    normalizationRate: qualityReport.normalizationRate,
  })
  
  // Store normalized biomarkers
  const storedIds: string[] = []
  
  for (const normalized of normalizationResult.successful) {
    // Find biomarker definition to get score
    const definition = BIOMARKER_DEFINITIONS.find(b => b.id === normalized.biomarkerId)
    let score: number | undefined
    let status: 'optimal' | 'acceptable' | 'suboptimal' | 'critical' | undefined
    
    if (definition) {
      const scoreResult = calculateBiomarkerScore(definition, normalized.normalizedValue)
      score = scoreResult.score
      status = scoreResult.status
    }
    
    try {
      const result = await createBiomarkerEntry({
        user_id: patient_id, // Using patient_id as user_id for now
        healthie_patient_id: patient_id,
        biomarker_id: normalized.biomarkerId,
        biomarker_name: normalized.biomarkerName,
        category: definition?.category || 'unknown',
        value: normalized.normalizedValue,
        unit: normalized.normalizedUnit,
        original_value: String(normalized.originalValue),
        original_unit: normalized.originalUnit,
        original_name: normalized.originalName,
        confidence: normalized.confidence,
        conversion_applied: normalized.conversionApplied,
        source: 'healthie',
        reference_range: normalized.referenceRange,
        measured_at: normalized.date.toISOString().split('T')[0],
        score,
        status,
      })
      storedIds.push(result.id)
    } catch (error) {
      console.error('Error storing biomarker:', error)
    }
  }
  
  // Recalculate resilience score if we have enough biomarkers
  if (storedIds.length >= 3) {
    await recalculateResilienceScore(patient_id)
  }
  
  return NextResponse.json({
    received: true,
    processed: true,
    results: {
      normalized: normalizationResult.successful.length,
      unmatched: normalizationResult.unmatched.length,
      errors: normalizationResult.errors.length,
      stored: storedIds.length,
    },
    quality: {
      normalizationRate: qualityReport.normalizationRate,
      biomarkerCoverage: qualityReport.biomarkerCoverage,
      recommendations: qualityReport.recommendations,
    },
  })
}

// =============================================================================
// VITALS HANDLER
// Stores vitals data for daily tracking
// =============================================================================

async function handleVitals(payload: HealthieWebhookPayload) {
  const { patient_id, data } = payload
  const vitals = (data.vitals || [data]) as HealthieVital[]
  
  // Map common vital types to our tracking fields
  const vitalMapping: Record<string, string> = {
    'weight': 'weight_kg',
    'blood_pressure': 'blood_pressure',
    'heart_rate': 'resting_hr',
    'resting_heart_rate': 'resting_hr',
  }
  
  console.log('Processing vitals for patient:', patient_id, vitals.length)
  
  // For now, just acknowledge receipt
  // Full implementation would store in daily_logs table
  
  return NextResponse.json({
    received: true,
    processed: true,
    vitals_count: vitals.length,
  })
}

// =============================================================================
// FORM SUBMISSION HANDLER
// Handles questionnaire/form responses from Healthie
// =============================================================================

async function handleFormSubmission(payload: HealthieWebhookPayload) {
  const { patient_id, data } = payload
  
  console.log('Form submission received for patient:', patient_id)
  
  // Form submissions could contain:
  // - Symptom check-ins
  // - Protocol adherence reports
  // - Side effect reports
  
  return NextResponse.json({
    received: true,
    processed: true,
  })
}

// =============================================================================
// RESILIENCE SCORE RECALCULATION
// Triggered after new biomarkers are stored
// =============================================================================

async function recalculateResilienceScore(patientId: string) {
  try {
    // Get latest biomarkers for patient
    const latestBiomarkers = await getLatestBiomarkers(patientId)
    
    if (latestBiomarkers.length < 3) {
      console.log('Not enough biomarkers for resilience calculation:', latestBiomarkers.length)
      return
    }
    
    // Convert to BiomarkerValue format
    const biomarkerValues = latestBiomarkers.map(b => ({
      biomarkerId: b.biomarker_id,
      value: b.value,
      measuredAt: new Date(b.measured_at),
      source: b.source,
    }))
    
    // Calculate resilience score
    const score = calculateResilienceScore(biomarkerValues)
    const phenotype = classifyPhenotype(score)
    
    // Build category scores record
    const categoryScores: Record<string, number> = {}
    for (const cat of score.categories) {
      categoryScores[cat.category] = cat.score
    }
    
    // Store in database
    await createResilienceScore({
      user_id: patientId,
      healthie_patient_id: patientId,
      overall_score: score.overallScore,
      grade: score.grade,
      category_scores: categoryScores,
      data_completeness: score.dataCompleteness,
      biomarkers_used: biomarkerValues.length,
      chronological_age: score.chronologicalAge,
      biological_age: score.biologicalAge,
      age_gap: score.ageGap,
      primary_phenotype: phenotype.primaryPhenotype,
      secondary_phenotypes: phenotype.secondaryPhenotypes,
      phenotype_confidence: phenotype.confidence,
      top_strengths: score.topStrengths.map(s => s.biomarkerId),
      priority_areas: score.priorityAreas.map(p => p.biomarkerId),
    })
    
    console.log('Resilience score calculated and stored:', {
      patient_id: patientId,
      score: score.overallScore,
      grade: score.grade,
      phenotype: phenotype.primaryPhenotype,
    })
  } catch (error) {
    console.error('Error recalculating resilience score:', error)
  }
}

// =============================================================================
// GET ENDPOINT - For webhook verification
// =============================================================================

export async function GET(request: NextRequest) {
  // Healthie may send a verification request
  const challenge = request.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ 
    status: 'Healthie webhook endpoint active',
    supported_events: ['lab_result', 'vital', 'form_answer_group'],
  })
}
