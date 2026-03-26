import { NextResponse } from 'next/server'
import { getSession, isProviderEmail } from '@/lib/auth'
import { getCronStatuses } from '@/lib/cron-logger'

/** Expected cron schedule for health assessment */
const CRON_SCHEDULES: Record<string, { schedule: string; maxStaleMinutes: number }> = {
  'siphox-fulfillment': { schedule: 'Every 15 min', maxStaleMinutes: 30 },
  'siphox-results': { schedule: 'Every hour', maxStaleMinutes: 120 },
  'approve-commissions': { schedule: '2 AM daily', maxStaleMinutes: 1500 },
  'update-tiers': { schedule: '3 AM daily', maxStaleMinutes: 1500 },
  'asher-sync': { schedule: 'Every 30 min', maxStaleMinutes: 60 },
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails =
      process.env.ADMIN_ALLOWED_EMAILS ||
      process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS ||
      ''
    const allowedEmails = adminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin =
      allowedEmails.includes(session.email.toLowerCase()) ||
      isProviderEmail(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const latestRuns = await getCronStatuses()

    // Build status for all known crons (including ones that haven't run yet)
    const cronNames = Object.keys(CRON_SCHEDULES)
    const now = Date.now()

    const statuses = cronNames.map((name) => {
      const lastRun = latestRuns.find((r) => r.cron_name === name)
      const config = CRON_SCHEDULES[name]

      let health: 'healthy' | 'stale' | 'error' | 'never_run' = 'never_run'
      if (lastRun) {
        if (lastRun.status === 'error') {
          health = 'error'
        } else if (lastRun.status === 'running') {
          health = 'healthy'
        } else {
          const age = now - new Date(lastRun.started_at).getTime()
          health = age > config.maxStaleMinutes * 60_000 ? 'stale' : 'healthy'
        }
      }

      return {
        name,
        schedule: config.schedule,
        health,
        lastRun: lastRun
          ? {
              status: lastRun.status,
              startedAt: lastRun.started_at,
              completedAt: lastRun.completed_at,
              durationMs: lastRun.duration_ms,
              result: lastRun.result,
              error: lastRun.error_message,
            }
          : null,
      }
    })

    return NextResponse.json({ data: statuses })
  } catch (error) {
    console.error('[admin/cron-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron status' },
      { status: 500 }
    )
  }
}
