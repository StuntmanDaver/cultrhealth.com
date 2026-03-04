import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateDailyLog, getDailyLogsByUser, getDailyLogByDate } from '@/lib/db'
import { getSession } from '@/lib/auth'

// =============================================================================
// DAILY TRACKING API
// Handles daily log submissions for the Bio-Explorer feedback loop
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.log_date) {
      return NextResponse.json(
        { error: 'log_date is required' },
        { status: 400 }
      )
    }

    // Create or update the daily log
    // Note: Using customerId as user_id since that's our unique identifier
    const result = await createOrUpdateDailyLog({
      user_id: session.customerId,
      healthie_patient_id: body.healthie_patient_id,
      log_date: body.log_date,
      energy_level: body.energy_level,
      mood_rating: body.mood_rating,
      sleep_quality: body.sleep_quality,
      sleep_hours: body.sleep_hours,
      stress_level: body.stress_level,
      weight_kg: body.weight_kg,
      resting_hr: body.resting_hr,
      hrv_ms: body.hrv_ms,
      blood_pressure_systolic: body.blood_pressure_systolic,
      blood_pressure_diastolic: body.blood_pressure_diastolic,
      wearable_source: body.wearable_source,
      wearable_sleep_score: body.wearable_sleep_score,
      wearable_readiness_score: body.wearable_readiness_score,
      wearable_activity_score: body.wearable_activity_score,
      deep_sleep_minutes: body.deep_sleep_minutes,
      rem_sleep_minutes: body.rem_sleep_minutes,
      steps: body.steps,
      protocol_id: body.protocol_id,
      protocol_adherence_pct: body.protocol_adherence_pct,
      supplements_taken: body.supplements_taken,
      peptides_administered: body.peptides_administered,
      notes: body.notes,
      symptoms_reported: body.symptoms_reported,
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      isNew: result.isNew,
      message: result.isNew ? 'Daily log created' : 'Daily log updated',
    })
  } catch (error) {
    console.error('Error saving daily log:', error)
    return NextResponse.json(
      { error: 'Failed to save daily log' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '30', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // If specific date requested, return single log
    if (date) {
      const log = await getDailyLogByDate(session.customerId, date)
      return NextResponse.json({ log })
    }

    // Otherwise return list of logs
    const logs = await getDailyLogsByUser(session.customerId, limit, offset)
    
    return NextResponse.json({ 
      logs,
      count: logs.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching daily logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily logs' },
      { status: 500 }
    )
  }
}
