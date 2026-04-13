import { NextRequest, NextResponse } from 'next/server'
import { startCronRun } from '@/lib/cron-logger'
import { addTagsToContact } from '@/lib/contacts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const run = await startCronRun('siphox-results')

  try {
    const { getCustomersWithUnnotifiedReports, markResultsNotified } = await import('@/lib/siphox/db')
    const { processReport } = await import('@/lib/siphox/reports')
    const { sendResultsReadyEmail } = await import('@/lib/resend')

    const customers = await getCustomersWithUnnotifiedReports(50)

    let sent = 0
    let failed = 0

    for (const customer of customers) {
      const displayName =
        [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Member'

      const processed = processReport({
        siphox_report_id: customer.latest_report_id,
        report_data: customer.report_data,
        suggestions: customer.suggestions,
      })

      const result = await sendResultsReadyEmail({
        name: displayName,
        email: customer.email,
        summary: {
          totalBiomarkers: processed.summary.totalBiomarkers,
          optimalCount: processed.summary.optimalCount,
          needsAttentionCount: processed.summary.needsAttentionCount,
        },
      })

      if (result.success) {
        await markResultsNotified(customer.siphox_customer_id, customer.latest_report_id)
        sent++

        addTagsToContact(customer.email, ['labs-results-ready']).catch((mailchimpError) =>
          console.error('[siphox-results] Mailchimp tag error (non-fatal):', mailchimpError)
        )
      } else {
        failed++
      }
    }

    console.log(
      `Cron siphox-results: ${sent} sent, ${failed} failed out of ${customers.length} customers`
    )

    const result = { sent, failed, total: customers.length }
    await run.success(result)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron siphox-results error:', error)
    await run.error(error)
    return NextResponse.json(
      { error: 'Failed to process results notifications' },
      { status: 500 }
    )
  }
}
