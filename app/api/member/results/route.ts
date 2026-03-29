import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSiphoxCustomerByEmail, SiphoxDatabaseError } from '@/lib/siphox/db'
import { getLatestProcessedReport } from '@/lib/siphox/reports'
import { SiphoxApiError } from '@/lib/siphox/errors'

// HIPAA: Never log report contents, biomarker values, or patient identifiers

const EMPTY_RESULTS_RESPONSE = {
  success: true,
  report: null,
  message: 'No results available yet',
}

/**
 * GET /api/member/results
 * Member-auth version of /api/portal/results.
 * Uses session email instead of portal phone auth.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByEmail(session.email)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      throw dbError
    }

    if (!siphoxCustomer) {
      return NextResponse.json(EMPTY_RESULTS_RESPONSE)
    }

    let report
    try {
      report = await getLatestProcessedReport(siphoxCustomer.siphox_customer_id)
    } catch (apiError) {
      if (apiError instanceof SiphoxApiError || apiError instanceof SiphoxDatabaseError) {
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      throw apiError
    }

    if (!report) {
      return NextResponse.json(EMPTY_RESULTS_RESPONSE)
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Failed to fetch member results:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
