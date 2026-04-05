import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * GET /api/onboarding/status
 * Returns the current onboarding progress for the authenticated member.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sql } = await import('@vercel/postgres')

    // Look up onboarding record by email
    const result = await sql`
      SELECT step, blood_test_ordered, intake_completed, appointment_scheduled,
             healthie_patient_id, completed_at
      FROM member_onboarding
      WHERE LOWER(email) = LOWER(${session.email})
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.rows.length === 0) {
      // No onboarding record yet — create one
      await sql`
        INSERT INTO member_onboarding (email, step)
        VALUES (${session.email.toLowerCase()}, 'welcome')
        ON CONFLICT DO NOTHING
      `
      return NextResponse.json({
        success: true,
        onboarding: {
          step: 'welcome',
          blood_test_ordered: false,
          intake_completed: false,
          appointment_scheduled: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      onboarding: result.rows[0],
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
  }
}
