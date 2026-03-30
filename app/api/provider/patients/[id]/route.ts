import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth, isProviderEmail } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { id } = await params
    const membershipId = Number(id)

    if (!membershipId || isNaN(membershipId)) {
      return NextResponse.json({ success: false, error: 'Invalid patient ID' }, { status: 400 })
    }

    // Fetch membership first to get email
    const memberResult = await sql`
      SELECT id, email, plan_tier, subscription_status, asher_patient_id, created_at AS member_since
      FROM memberships
      WHERE id = ${membershipId}
    `

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 })
    }

    const membership = memberResult.rows[0]
    const patientEmail = membership.email

    if (!patientEmail) {
      return NextResponse.json({ success: false, error: 'Patient email not available' }, { status: 404 })
    }

    // Fetch all related data in parallel
    const [intakesResult, ordersResult, consultationsResult, labResult] = await Promise.all([
      // All intake submissions
      sql`
        SELECT id, intake_status, intake_data, created_at, completed_at
        FROM pending_intakes
        WHERE lower(customer_email) = lower(${patientEmail})
        ORDER BY created_at DESC
      `,
      // All Asher orders
      sql`
        SELECT id, asher_order_id, order_type, order_status, medication_packages, partner_note, created_at
        FROM asher_orders
        WHERE lower(customer_email) = lower(${patientEmail})
        ORDER BY created_at DESC
      `,
      // All consultations with notes
      sql`
        SELECT
          cr.id, cr.status, cr.consultation_type, cr.provider_email,
          cr.scheduled_at, cr.duration_mins, cr.customer_email,
          cn.reason AS note_reason, cn.outcome AS note_outcome,
          cn.next_steps AS note_next_steps
        FROM consult_requests cr
        LEFT JOIN consultation_notes cn ON cn.consultation_id = cr.id
        WHERE lower(cr.customer_email) = lower(${patientEmail})
        ORDER BY cr.scheduled_at DESC NULLS LAST
      `,
      // Latest SiPhox lab report
      sql`
        SELECT sr.report_data, sr.report_status, sr.created_at
        FROM siphox_reports sr
        JOIN siphox_customers sc ON sc.id = sr.siphox_customer_id
        WHERE lower(sc.email) = lower(${patientEmail})
          AND sr.report_status = 'completed'
        ORDER BY sr.created_at DESC
        LIMIT 1
      `.catch(() => ({ rows: [] })),
    ])

    return NextResponse.json({
      success: true,
      patient: {
        membership,
        intakes: intakesResult.rows,
        orders: ordersResult.rows,
        consultations: consultationsResult.rows,
        labResults: labResult.rows[0] || null,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
