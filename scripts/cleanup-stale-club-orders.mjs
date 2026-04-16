#!/usr/bin/env node
// Part A — one-shot cleanup of stale pending_approval club orders.
// Per user direction (2026-04-16):
//   - DJ Buras (CLB-MO0K90M6-B3D2) → waiting_to_ship  (already paid offline)
//   - All other pending_approval orders → fulfilled (silent: no emails, no QB, no commission writes)
//
// Usage:
//   node scripts/cleanup-stale-club-orders.mjs           # dry run (prints what will change)
//   node scripts/cleanup-stale-club-orders.mjs --confirm # actually apply changes

import { readFileSync } from 'node:fs'

try {
  const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      process.env[m[1]] = v
    }
  }
} catch {}

const confirm = process.argv.includes('--confirm')
const actorEmail = process.env.CLEANUP_ACTOR_EMAIL || 'david@cultrhealth.com'

const DJB_ORDER_NUMBER = 'CLB-MO0K90M6-B3D2'

const { sql } = await import('@vercel/postgres')

async function main() {
  console.log(`CULTR cleanup — ${confirm ? 'APPLY' : 'DRY RUN'}`)
  console.log(`Actor: ${actorEmail}`)
  console.log(`Run time: ${new Date().toISOString()}`)

  // --- Preview DJ Buras ---
  const djb = await sql`
    SELECT id, order_number, status, coupon_code, subtotal_usd::float, paid_at, created_at
    FROM club_orders WHERE order_number = ${DJB_ORDER_NUMBER}
  `
  if (djb.rows.length === 0) {
    console.error(`DJ Buras order ${DJB_ORDER_NUMBER} not found — aborting.`)
    process.exit(1)
  }
  console.log(`\n1. DJ Buras target:`)
  console.log('  ', djb.rows[0])

  // --- Preview others ---
  const others = await sql`
    SELECT id, order_number, member_name, member_email, coupon_code, subtotal_usd::float, created_at
    FROM club_orders
    WHERE status = 'pending_approval'
      AND order_number != ${DJB_ORDER_NUMBER}
    ORDER BY created_at ASC
  `
  console.log(`\n2. Other pending_approval orders to fulfill: ${others.rows.length}`)
  for (const r of others.rows) {
    const daysOld = Math.round((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24))
    console.log(`  ${r.order_number}  ${String(r.member_email).padEnd(38)} coupon=${r.coupon_code || '-'}  subtotal=$${r.subtotal_usd ?? '-'}  ${daysOld}d old`)
  }

  if (!confirm) {
    console.log(`\nDRY RUN — no changes made. Re-run with --confirm to apply.`)
    return
  }

  // --- Apply DJ Buras ---
  console.log(`\n> Updating DJ Buras → waiting_to_ship`)
  const djbUpdate = await sql`
    UPDATE club_orders
    SET status = 'waiting_to_ship',
        approved_at = COALESCE(approved_at, NOW()),
        invoice_sent_at = COALESCE(invoice_sent_at, NOW()),
        paid_at = COALESCE(paid_at, NOW()),
        updated_at = NOW()
    WHERE order_number = ${DJB_ORDER_NUMBER}
      AND status = 'pending_approval'
    RETURNING id, status
  `
  console.log(`  updated=${djbUpdate.rowCount}`)

  if (djbUpdate.rowCount === 1) {
    await sql`
      INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
      VALUES (
        ${actorEmail},
        'status_change',
        'club_order',
        ${djb.rows[0].id},
        'Manual cleanup: pending_approval → waiting_to_ship (customer already paid offline)',
        ${JSON.stringify({ from: 'pending_approval', to: 'waiting_to_ship', method: 'cleanup_script', paidOffline: true, scriptRun: new Date().toISOString() })}::jsonb
      )
    `
  }

  // --- Apply others ---
  console.log(`\n> Updating ${others.rows.length} other pending_approval orders → fulfilled (silent)`)
  const othersUpdate = await sql`
    UPDATE club_orders
    SET status = 'fulfilled',
        approved_at = COALESCE(approved_at, NOW()),
        invoice_sent_at = COALESCE(invoice_sent_at, NOW()),
        paid_at = COALESCE(paid_at, NOW()),
        shipped_at = COALESCE(shipped_at, NOW()),
        fulfilled_at = NOW(),
        updated_at = NOW()
    WHERE status = 'pending_approval'
      AND order_number != ${DJB_ORDER_NUMBER}
    RETURNING id, order_number
  `
  console.log(`  updated=${othersUpdate.rowCount}`)

  // Audit log for each
  for (const r of othersUpdate.rows) {
    await sql`
      INSERT INTO admin_actions (admin_email, action_type, entity_type, entity_id, reason, metadata)
      VALUES (
        ${actorEmail},
        'status_change',
        'club_order',
        ${r.id},
        'Bulk cleanup: pending_approval → fulfilled (silent, no emails/QB/commission)',
        ${JSON.stringify({ from: 'pending_approval', to: 'fulfilled', method: 'cleanup_script', scriptRun: new Date().toISOString() })}::jsonb
      )
    `
  }

  console.log(`\n━━━ Cleanup complete ━━━`)

  // Verify
  const remain = await sql`SELECT COUNT(*)::int AS n FROM club_orders WHERE status = 'pending_approval'`
  console.log(`\nRemaining pending_approval orders: ${remain.rows[0].n} (expected: 0)`)
  const djbCheck = await sql`SELECT order_number, status, paid_at FROM club_orders WHERE order_number = ${DJB_ORDER_NUMBER}`
  console.log(`DJ Buras now:`, djbCheck.rows[0])
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
