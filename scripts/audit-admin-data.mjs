#!/usr/bin/env node
// Part 0 audit: verify DB truth matches what admin UI displays.
// Usage: node scripts/audit-admin-data.mjs
// Read-only. Outputs compact summary to stdout.

import { readFileSync } from 'node:fs'

// Load .env.local into process.env BEFORE importing @vercel/postgres
try {
  const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env[m[1]] = v
    }
  }
} catch {}

const { sql } = await import('@vercel/postgres')

async function q(strings, ...values) {
  // strings is the template array; values are the $1, $2 interpolations
  return sql(strings, ...values)
}

function fmt(v) {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return String(v)
}

function section(title) {
  console.log(`\n━━━ ${title} ━━━`)
}

async function main() {
  console.log('CULTR Health — Admin Data Audit')
  console.log('Run:', new Date().toISOString())

  section('1. DJ Buras order check')
  const djb = await sql`
    SELECT order_number, status, coupon_code, subtotal_usd, tax_amount_usd,
           created_at, paid_at, attributed_creator_id
    FROM club_orders
    WHERE order_number = 'CLB-MONK50M6-8302'
  `
  if (djb.rows.length === 0) {
    console.log('  NOT FOUND by order number — checking by email (djuras@yahoo.com)')
    const byEmail = await sql`SELECT order_number, status, coupon_code, subtotal_usd::float, created_at FROM club_orders WHERE member_email ILIKE '%djuras%' ORDER BY created_at DESC LIMIT 5`
    console.log(`  ${byEmail.rows.length} orders found for djuras:`)
    for (const r of byEmail.rows) console.log('  ', r)
  } else {
    console.log('  ', djb.rows[0])
  }

  section('2. Club order status distribution')
  const statusDist = await sql`
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(subtotal_usd), 0)::float AS total_subtotal
    FROM club_orders
    GROUP BY status ORDER BY count DESC
  `
  for (const r of statusDist.rows) {
    console.log(`  ${String(r.status).padEnd(20)} ${String(r.count).padStart(4)}  $${fmt(r.total_subtotal)}`)
  }

  section('3. Stale pending_approval orders (excluding DJ Buras)')
  const stale = await sql`
    SELECT order_number, member_email, coupon_code, subtotal_usd::float,
           ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::int AS days_old
    FROM club_orders
    WHERE status = 'pending_approval'
      AND order_number != 'CLB-MONK50M6-8302'
    ORDER BY created_at ASC
  `
  console.log(`  ${stale.rows.length} stale orders to clean up`)
  const couponCounts = {}
  for (const r of stale.rows) {
    const c = r.coupon_code || '(none)'
    couponCounts[c] = (couponCounts[c] || 0) + 1
  }
  console.log('  By coupon:', couponCounts)

  section('4. commission_ledger totals by status')
  const ledgerTotals = await sql`
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(commission_amount), 0)::float AS total
    FROM commission_ledger GROUP BY status ORDER BY status
  `
  for (const r of ledgerTotals.rows) {
    console.log(`  ${String(r.status).padEnd(10)} ${String(r.count).padStart(4)}  $${fmt(r.total)}`)
  }

  section('5. Top creators by commission (beneficiaries, all-time, excluding reversed)')
  const topCreators = await sql`
    SELECT c.id, c.email, c.full_name,
           COUNT(cl.id)::int AS rows,
           COALESCE(SUM(cl.commission_amount), 0)::float AS earned,
           COALESCE(SUM(CASE WHEN cl.status = 'pending' THEN cl.commission_amount END), 0)::float AS pending,
           COALESCE(SUM(CASE WHEN cl.status = 'approved' THEN cl.commission_amount END), 0)::float AS approved,
           COALESCE(SUM(CASE WHEN cl.status = 'paid' THEN cl.commission_amount END), 0)::float AS paid
    FROM creators c
    LEFT JOIN commission_ledger cl ON cl.beneficiary_creator_id = c.id AND cl.status != 'reversed'
    GROUP BY c.id, c.email, c.full_name
    HAVING COUNT(cl.id) > 0
    ORDER BY earned DESC
    LIMIT 20
  `
  for (const r of topCreators.rows) {
    console.log(`  ${String(r.email).padEnd(38)} ${String(r.full_name).padEnd(24)} rows=${String(r.rows).padStart(3)}  earned=$${String(fmt(r.earned)).padStart(8)}  P=$${fmt(r.pending)} A=$${fmt(r.approved)} Paid=$${fmt(r.paid)}`)
  }

  section('6. Affiliate codes — usage vs attribution writes')
  const codeStats = await sql`
    SELECT ac.code,
           c.email AS creator_email,
           c.full_name AS creator_name,
           ac.use_count,
           ac.total_revenue::float AS ac_revenue,
           (SELECT COUNT(*) FROM order_attributions oa WHERE oa.code_id = ac.id)::int AS attribution_count,
           (SELECT COALESCE(SUM(net_revenue), 0) FROM order_attributions oa WHERE oa.code_id = ac.id)::float AS attribution_revenue,
           (SELECT COUNT(*) FROM commission_ledger cl JOIN order_attributions oa ON cl.order_attribution_id = oa.id WHERE oa.code_id = ac.id AND cl.status != 'reversed')::int AS ledger_count,
           (SELECT COALESCE(SUM(cl.commission_amount), 0) FROM commission_ledger cl JOIN order_attributions oa ON cl.order_attribution_id = oa.id WHERE oa.code_id = ac.id AND cl.status != 'reversed')::float AS ledger_commission
    FROM affiliate_codes ac
    JOIN creators c ON c.id = ac.creator_id
    WHERE ac.use_count > 0 OR EXISTS (SELECT 1 FROM order_attributions oa WHERE oa.code_id = ac.id)
    ORDER BY ac.use_count DESC
  `
  for (const r of codeStats.rows) {
    console.log(`  ${String(r.code).padEnd(14)} by ${String(r.creator_email).padEnd(32)} use=${String(r.use_count).padStart(3)} ac_rev=$${fmt(r.ac_revenue)} attribs=${String(r.attribution_count).padStart(3)} attrib_rev=$${fmt(r.attribution_revenue)} ledger=${String(r.ledger_count).padStart(3)} commission=$${fmt(r.ledger_commission)}`)
  }

  section('7. "Paid but commission not written" (shipped/fulfilled without ledger row)')
  const gap1 = await sql`
    SELECT co.order_number, co.status, co.coupon_code, co.subtotal_usd::float AS subtotal,
           oa.id AS attribution_id,
           oa.creator_id
    FROM club_orders co
    JOIN order_attributions oa ON oa.order_id = co.id::text
    WHERE co.status IN ('shipped', 'fulfilled')
      AND NOT EXISTS (SELECT 1 FROM commission_ledger cl WHERE cl.order_attribution_id = oa.id)
    LIMIT 20
  `
  console.log(`  ${gap1.rows.length} orders shipped/fulfilled without commission_ledger (may need backfill)`)
  for (const r of gap1.rows) console.log('  ', r)

  section('8. "Commission written but order never paid" ghost rows')
  const ghost = await sql`
    SELECT cl.id, cl.status AS cl_status, cl.commission_amount::float,
           co.order_number, co.status AS order_status, co.coupon_code
    FROM commission_ledger cl
    JOIN order_attributions oa ON oa.id = cl.order_attribution_id
    JOIN club_orders co ON co.id::text = oa.order_id
    WHERE co.status IN ('pending_approval', 'approved', 'invoice_sent', 'needs_payment')
      AND cl.status != 'reversed'
    LIMIT 40
  `
  console.log(`  ${ghost.rows.length} commission_ledger rows for orders NOT yet paid/shipped (the bug in action)`)
  for (const r of ghost.rows) console.log('  ', r)

  section('9. Tracking links: clicks vs conversions')
  const links = await sql`
    SELECT tl.slug, c.email AS creator_email, tl.click_count, tl.conversion_count,
           CASE WHEN tl.click_count > 0 THEN ROUND((tl.conversion_count::float / tl.click_count::float * 100.0)::numeric, 1) ELSE 0 END AS conv_rate
    FROM tracking_links tl JOIN creators c ON c.id = tl.creator_id
    WHERE tl.click_count > 0 OR tl.conversion_count > 0
    ORDER BY tl.click_count DESC LIMIT 15
  `
  for (const r of links.rows) {
    console.log(`  cultrclub.com/${String(r.slug).padEnd(16)} by ${String(r.creator_email).padEnd(32)} clicks=${String(r.click_count).padStart(4)} conv=${String(r.conversion_count).padStart(3)} rate=${r.conv_rate}%`)
  }

  section('10. Owner emails in creators table')
  const owners = await sql`
    SELECT email, full_name, status, tier,
           (SELECT COUNT(*) FROM affiliate_codes WHERE creator_id = c.id)::int AS code_count,
           (SELECT COUNT(*) FROM order_attributions WHERE creator_id = c.id)::int AS attr_count,
           (SELECT COALESCE(SUM(cl.commission_amount), 0) FROM commission_ledger cl WHERE cl.beneficiary_creator_id = c.id AND cl.status != 'reversed')::float AS earned
    FROM creators c
    WHERE email IN ('erik@cultrhealth.com','alex@cultrhealth.com','tony@cultrhealth.com','david@cultrhealth.com','stewart@cultrhealth.com','erik@threepointshospitality.com')
    ORDER BY email
  `
  console.log('  owners that exist as creators (will be excluded from admin analytics after Part C):')
  for (const r of owners.rows) console.log('  ', r)

  section('11. CULTR* coupon codes (should STAY in analytics)')
  const cultrCodes = await sql`
    SELECT ac.code, c.email AS creator_email, c.full_name, ac.use_count, ac.total_revenue::float AS revenue, ac.active
    FROM affiliate_codes ac JOIN creators c ON c.id = ac.creator_id
    WHERE ac.code ILIKE 'CULTR%'
    ORDER BY ac.code
  `
  for (const r of cultrCodes.rows) console.log('  ', r)

  console.log('\n━━━ Audit complete ━━━')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
