import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth, isProviderEmail } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    if (!isProviderEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Provider access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const offset = Number(searchParams.get('offset')) || 0

    // Build search pattern
    const searchPattern = search ? `%${search}%` : '%'

    let result
    let countResult

    if (tier) {
      result = await sql`
        SELECT
          m.id,
          m.email,
          m.plan_tier,
          m.subscription_status,
          m.asher_patient_id,
          m.created_at AS member_since,
          ao.order_status AS latest_order_status,
          ao.medication_packages,
          ao.created_at AS latest_order_date,
          cr.scheduled_at AS last_consultation_date,
          cr.status AS last_consultation_status,
          pi.intake_data->>'firstName' AS first_name,
          pi.intake_data->>'lastName' AS last_name
        FROM memberships m
        LEFT JOIN LATERAL (
          SELECT order_status, medication_packages, created_at
          FROM asher_orders
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY created_at DESC LIMIT 1
        ) ao ON true
        LEFT JOIN LATERAL (
          SELECT scheduled_at, status
          FROM consult_requests
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY scheduled_at DESC NULLS LAST LIMIT 1
        ) cr ON true
        LEFT JOIN LATERAL (
          SELECT intake_data
          FROM pending_intakes
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY created_at DESC LIMIT 1
        ) pi ON true
        WHERE m.email IS NOT NULL
          AND lower(m.email) LIKE lower(${searchPattern})
          AND lower(m.plan_tier) = lower(${tier})
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      countResult = await sql`
        SELECT COUNT(*)::integer AS total
        FROM memberships m
        WHERE m.email IS NOT NULL
          AND lower(m.email) LIKE lower(${searchPattern})
          AND lower(m.plan_tier) = lower(${tier})
      `
    } else {
      result = await sql`
        SELECT
          m.id,
          m.email,
          m.plan_tier,
          m.subscription_status,
          m.asher_patient_id,
          m.created_at AS member_since,
          ao.order_status AS latest_order_status,
          ao.medication_packages,
          ao.created_at AS latest_order_date,
          cr.scheduled_at AS last_consultation_date,
          cr.status AS last_consultation_status,
          pi.intake_data->>'firstName' AS first_name,
          pi.intake_data->>'lastName' AS last_name
        FROM memberships m
        LEFT JOIN LATERAL (
          SELECT order_status, medication_packages, created_at
          FROM asher_orders
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY created_at DESC LIMIT 1
        ) ao ON true
        LEFT JOIN LATERAL (
          SELECT scheduled_at, status
          FROM consult_requests
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY scheduled_at DESC NULLS LAST LIMIT 1
        ) cr ON true
        LEFT JOIN LATERAL (
          SELECT intake_data
          FROM pending_intakes
          WHERE lower(customer_email) = lower(m.email)
          ORDER BY created_at DESC LIMIT 1
        ) pi ON true
        WHERE m.email IS NOT NULL
          AND lower(m.email) LIKE lower(${searchPattern})
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      countResult = await sql`
        SELECT COUNT(*)::integer AS total
        FROM memberships m
        WHERE m.email IS NOT NULL
          AND lower(m.email) LIKE lower(${searchPattern})
      `
    }

    return NextResponse.json({
      success: true,
      patients: result.rows,
      total: countResult.rows[0]?.total ?? 0,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
