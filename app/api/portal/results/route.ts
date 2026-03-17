import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { getSiphoxCustomerByPhone, SiphoxDatabaseError } from '@/lib/siphox/db'
import { getLatestProcessedReport } from '@/lib/siphox/reports'
import { SiphoxApiError } from '@/lib/siphox/errors'

// HIPAA: Never log report contents, biomarker values, or patient identifiers

/** Empty results response — used when no data is available */
const EMPTY_RESULTS_RESPONSE = {
  success: true,
  report: null,
  message: 'No results available yet',
}

/**
 * GET /api/portal/results
 * Returns the latest processed biomarker report for the authenticated member.
 * Fetches from SiPhox API, caches in DB, returns categorized + processed data.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)
    if (!auth.authenticated || !auth.phone) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Resolve SiPhox customer
    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByPhone(auth.phone)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        // DB unavailable — return empty state gracefully
        console.warn('Results DB unavailable, returning empty state')
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      throw dbError
    }

    if (!siphoxCustomer) {
      return NextResponse.json(EMPTY_RESULTS_RESPONSE)
    }

    // Fetch, cache, and process the latest report
    let report
    try {
      report = await getLatestProcessedReport(siphoxCustomer.siphox_customer_id)
    } catch (apiError) {
      if (apiError instanceof SiphoxApiError) {
        // SiPhox API error — non-fatal, return empty
        console.warn('SiPhox API error fetching results:', apiError.statusCode)
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      if (apiError instanceof SiphoxDatabaseError) {
        // DB error during caching — non-fatal
        console.warn('DB error caching results')
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      throw apiError
    }

    if (!report) {
      return NextResponse.json(EMPTY_RESULTS_RESPONSE)
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Failed to fetch results:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
