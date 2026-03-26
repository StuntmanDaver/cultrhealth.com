#!/usr/bin/env node

import { db, sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');
const APPROVED_ONLY = process.argv.includes('--approved-only');
const PREVIEW_ARG = process.argv.find((arg) => arg.startsWith('--preview='));
const PREVIEW_LIMIT = PREVIEW_ARG ? Math.max(1, Number(PREVIEW_ARG.split('=')[1] || 20)) : 20;
const BACKFILL_ACTOR = 'backfill-script';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function printUsage() {
  console.log('');
  console.log('Backfill club_orders statuses into invoice pipeline');
  console.log('');
  console.log('Usage:');
  console.log('  node --env-file=.env.local scripts/backfill-club-order-statuses.mjs [--apply] [--approved-only] [--preview=20]');
  console.log('');
  console.log('Defaults:');
  console.log('  - dry-run (no writes)');
  console.log('  - reconciles both pending_approval + approved -> invoice_sent');
  console.log('');
  console.log('Flags:');
  console.log('  --apply          Persist updates');
  console.log('  --approved-only  Reconcile only approved -> invoice_sent');
  console.log('  --preview=N      Preview row count (default 20)');
  console.log('');
}

function targetStatuses() {
  return APPROVED_ONLY ? ['approved'] : ['pending_approval', 'approved'];
}

async function fetchSummary(statuses) {
  const placeholders = statuses.map((_, i) => `$${i + 1}`).join(', ');
  return sql.query(
    `
      SELECT
        status,
        COUNT(*)::int AS count,
        COALESCE(SUM(subtotal_usd), 0) AS revenue
      FROM club_orders
      WHERE status IN (${placeholders})
      GROUP BY status
      ORDER BY status
    `,
    statuses
  );
}

async function fetchPreview(statuses, limit) {
  const placeholders = statuses.map((_, i) => `$${i + 1}`).join(', ');
  return sql.query(
    `
      SELECT
        order_number,
        status,
        subtotal_usd,
        created_at,
        approved_at,
        approved_by,
        qb_invoice_id
      FROM club_orders
      WHERE status IN (${placeholders})
      ORDER BY created_at ASC
      LIMIT $${statuses.length + 1}
    `,
    [...statuses, limit]
  );
}

async function runApply() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const approvedResult = await client.query(
      `
        UPDATE club_orders
        SET
          status = 'invoice_sent',
          approved_at = COALESCE(approved_at, created_at),
          approved_by = COALESCE(approved_by, $1),
          updated_at = NOW()
        WHERE status = 'approved'
        RETURNING order_number, subtotal_usd
      `,
      [BACKFILL_ACTOR]
    );

    let pendingResult = { rows: [] };
    if (!APPROVED_ONLY) {
      pendingResult = await client.query(
        `
          UPDATE club_orders
          SET
            status = 'invoice_sent',
            approved_at = COALESCE(approved_at, created_at),
            approved_by = COALESCE(approved_by, $1),
            updated_at = NOW()
          WHERE status = 'pending_approval'
          RETURNING order_number, subtotal_usd
        `,
        [BACKFILL_ACTOR]
      );
    }

    await client.query('COMMIT');

    return {
      approvedRows: approvedResult.rows,
      pendingRows: pendingResult.rows,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function fetchPostStatusSummary() {
  return sql`
    SELECT status, COUNT(*)::int AS count
    FROM club_orders
    WHERE status IN ('pending_approval', 'approved', 'invoice_sent', 'paid')
    GROUP BY status
    ORDER BY status
  `;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is not configured.');
    process.exit(1);
  }

  const statuses = targetStatuses();
  const summary = await fetchSummary(statuses);
  const rows = summary.rows;

  const totalCount = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

  console.log('');
  console.log('Club orders backfill summary');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Target statuses: ${statuses.join(', ')}`);
  console.log(`Rows matched: ${totalCount}`);
  console.log(`Subtotal matched: ${money(totalRevenue)}`);

  rows.forEach((row) => {
    console.log(`  - ${row.status}: ${row.count} rows (${money(row.revenue)})`);
  });

  if (totalCount === 0) {
    console.log('');
    console.log('No rows require backfill.');
    process.exit(0);
  }

  const preview = await fetchPreview(statuses, PREVIEW_LIMIT);
  console.log('');
  console.log(`Preview (oldest ${preview.rows.length}):`);
  preview.rows.forEach((row) => {
    console.log(
      `  ${row.order_number} | ${row.status} | ${money(row.subtotal_usd)} | created=${new Date(row.created_at).toISOString()} | qb_invoice_id=${row.qb_invoice_id || '-'}`
    );
  });

  if (!APPLY) {
    console.log('');
    console.log('Dry-run complete. Re-run with --apply to persist updates.');
    process.exit(0);
  }

  const result = await runApply();
  const approvedCount = result.approvedRows.length;
  const pendingCount = result.pendingRows.length;
  const updatedCount = approvedCount + pendingCount;
  const updatedRevenue = [...result.approvedRows, ...result.pendingRows].reduce(
    (sum, row) => sum + Number(row.subtotal_usd || 0),
    0
  );

  console.log('');
  console.log('Backfill applied successfully.');
  console.log(`  - approved -> invoice_sent: ${approvedCount}`);
  if (!APPROVED_ONLY) {
    console.log(`  - pending_approval -> invoice_sent: ${pendingCount}`);
  }
  console.log(`  - total updated: ${updatedCount}`);
  console.log(`  - subtotal moved into pipeline: ${money(updatedRevenue)}`);

  const postSummary = await fetchPostStatusSummary();
  console.log('');
  console.log('Post-update status counts (subset):');
  postSummary.rows.forEach((row) => {
    console.log(`  - ${row.status}: ${row.count}`);
  });
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('Backfill failed:', error?.message || error);
  process.exit(1);
});
