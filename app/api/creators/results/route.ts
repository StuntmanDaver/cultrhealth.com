import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { getCreatorPhone } from '@/lib/creators/db'
import { getSiphoxCustomerByPhone, SiphoxDatabaseError } from '@/lib/siphox/db'
import { getLatestProcessedReport } from '@/lib/siphox/reports'
import { SiphoxApiError } from '@/lib/siphox/errors'
import { formatPhoneE164 } from '@/lib/validation'

// HIPAA: Never log report contents, biomarker values, or patient identifiers

/** Empty results response — used when no data is available */
const EMPTY_RESULTS_RESPONSE = {
  success: true,
  report: null,
  message: 'No results available yet',
}

/**
 * GET /api/creators/results
 * Returns the latest processed biomarker report for the authenticated creator.
 * Mirrors /api/portal/results but uses creator auth + creator phone lookup.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyCreatorAuth(request)
    if (!auth.authenticated || !auth.creatorId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Resolve creator's phone
    const rawPhone = await getCreatorPhone(auth.creatorId)
    if (!rawPhone) {
      return NextResponse.json(EMPTY_RESULTS_RESPONSE)
    }
    const phone = formatPhoneE164(rawPhone)

    // Resolve SiPhox customer
    let siphoxCustomer
    try {
      siphoxCustomer = await getSiphoxCustomerByPhone(phone)
    } catch (dbError) {
      if (dbError instanceof SiphoxDatabaseError) {
        console.warn('Creator results DB unavailable, returning empty state')
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
        console.warn('SiPhox API error fetching creator results:', apiError.statusCode)
        return NextResponse.json(EMPTY_RESULTS_RESPONSE)
      }
      if (apiError instanceof SiphoxDatabaseError) {
        console.warn('DB error caching creator results')
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
    console.error('Failed to fetch creator results:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
