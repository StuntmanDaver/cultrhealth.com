import { sql } from '@vercel/postgres'

/**
 * Log a cron execution start and return a handle to complete it.
 * Usage:
 *   const run = await startCronRun('asher-sync')
 *   try {
 *     const result = await doWork()
 *     return run.success(result)
 *   } catch (err) {
 *     return run.error(err)
 *   }
 */
export async function startCronRun(cronName: string) {
  const startedAt = Date.now()

  let runId: number | null = null
  try {
    const { rows } = await sql`
      INSERT INTO cron_runs (cron_name, status, started_at)
      VALUES (${cronName}, 'running', NOW())
      RETURNING id
    `
    runId = rows[0]?.id ?? null
  } catch {
    // Table may not exist yet — don't block the cron
  }

  return {
    async success(result: Record<string, unknown>) {
      const durationMs = Date.now() - startedAt
      if (runId) {
        try {
          await sql`
            UPDATE cron_runs
            SET status = 'success',
                result = ${JSON.stringify(result)},
                completed_at = NOW(),
                duration_ms = ${durationMs}
            WHERE id = ${runId}
          `
        } catch {
          // Non-fatal
        }
      }
      // Cleanup old runs (keep last 50 per cron)
      try {
        await sql`
          DELETE FROM cron_runs
          WHERE cron_name = ${cronName}
            AND id NOT IN (
              SELECT id FROM cron_runs
              WHERE cron_name = ${cronName}
              ORDER BY started_at DESC
              LIMIT 50
            )
        `
      } catch {
        // Non-fatal
      }
      return result
    },

    async error(err: unknown) {
      const durationMs = Date.now() - startedAt
      const message = err instanceof Error ? err.message : String(err)
      if (runId) {
        try {
          await sql`
            UPDATE cron_runs
            SET status = 'error',
                error_message = ${message},
                completed_at = NOW(),
                duration_ms = ${durationMs}
            WHERE id = ${runId}
          `
        } catch {
          // Non-fatal
        }
      }
      return { error: message }
    },
  }
}

/** Get the latest run for each cron job */
export async function getCronStatuses(): Promise<
  Array<{
    cron_name: string
    status: string
    result: Record<string, unknown> | null
    error_message: string | null
    started_at: string
    completed_at: string | null
    duration_ms: number | null
  }>
> {
  try {
    const { rows } = await sql`
      SELECT DISTINCT ON (cron_name)
        cron_name,
        status,
        result,
        error_message,
        started_at,
        completed_at,
        duration_ms
      FROM cron_runs
      ORDER BY cron_name, started_at DESC
    `
    return rows as Array<{
      cron_name: string
      status: string
      result: Record<string, unknown> | null
      error_message: string | null
      started_at: string
      completed_at: string | null
      duration_ms: number | null
    }>
  } catch {
    return []
  }
}
