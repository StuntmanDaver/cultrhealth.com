import { NextRequest, NextResponse } from 'next/server'
import { startCronRun } from '@/lib/cron-logger'
import { addTagsToContact } from '@/lib/mailchimp'

export const dynamic = 'force-dynamic'

/**
 * SiPhox Results Notification Cron Job
 * Runs every hour via Vercel Cron.
 *
 * Finds customers with new (unnotified) reports and sends results-ready emails.
 * Deduplicates via last_notified_report_id on siphox_customers.
 *
 * Protected by CRON_SECRET Bearer token.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronRun = await startCronRun('siphox-results')

  try {
    const { getCustomersWithUnnotifiedReports, markResultsNotified } = await import('@/lib/siphox/db')
    const { processReport } = await import('@/lib/siphox/reports')
    const { sendResultsReadyEmail } = await import('@/lib/resend')

    const customers = await getCustomersWithUnnotifiedReports(50)

    let sent = 0
    let failed = 0

    for (const customer of customers) {
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Member'

      const processed = processReport({
        siphox_report_id: customer.latest_report_id,
        report_data: customer.report_data,
        suggestions: customer.suggestions,
      })

      const result = await sendResultsReadyEmail({
        name,
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

        // Tag Mailchimp contact (non-blocking, don't count as failure)
        if (customer.email) {
          addTagsToContact(customer.email, ['labs-results-ready']).catch((err) =>
            console.error('[siphox-results] Mailchimp tag error (non-fatal):', err)
          )
        }
      } else {
        failed++
      }
    }

    console.log(`Cron siphox-results: ${sent} sent, ${failed} failed out of ${customers.length} customers`)

    const runResult = { sent, failed, total: customers.length }
    await cronRun.success(runResult)

    return NextResponse.json({
      success: true,
      ...runResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron siphox-results error:', error)
    await cronRun.error(error)
    return NextResponse.json(
      { error: 'Failed to process results notifications' },
      { status: 500 }
    )
  }
}
