#!/usr/bin/env node
/**
 * Manual one-shot trigger for commission approval + tier recalculation cron jobs.
 * Bypasses CRON_SECRET auth by calling the DB functions directly.
 *
 * Usage: node scripts/run-crons-manual.mjs
 *
 * Requires: POSTGRES_URL in .env.local
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL not found in .env.local')
  process.exit(1)
}

// @vercel/postgres reads POSTGRES_URL from env automatically
const { sql } = await import('@vercel/postgres')

console.log('=== APPROVE COMMISSIONS ===')
try {
  // Same logic as approveEligibleCommissions() in lib/creators/db.ts
  const approveResult = await sql`
    UPDATE commission_ledger cl
    SET status = 'approved', updated_at = NOW()
    FROM order_attributions oa
    WHERE cl.order_attribution_id = oa.id
      AND cl.status = 'pending'
      AND oa.is_self_referral = FALSE
      AND oa.created_at < NOW() - INTERVAL '30 days'
  `
  console.log(`Approved ${approveResult.rowCount} commissions (older than 30 days, non-self-referral)`)

  const revertResult = await sql`
    UPDATE commission_ledger cl
    SET status = 'reversed', updated_at = NOW()
    FROM order_attributions oa
    WHERE cl.order_attribution_id = oa.id
      AND cl.status = 'pending'
      AND oa.is_self_referral = TRUE
      AND oa.created_at < NOW() - INTERVAL '30 days'
  `
  console.log(`Reversed ${revertResult.rowCount} self-referral commissions`)
} catch (err) {
  console.error('approve-commissions failed:', err.message)
}

console.log('')
console.log('=== UPDATE TIERS ===')
try {
  // Get all active creators
  const creators = await sql`SELECT id, full_name, tier, override_rate, active_member_count FROM creators WHERE status = 'active'`
  console.log(`Found ${creators.rows.length} active creators`)

  // Tier config (from lib/config/affiliate.ts)
  const TIER_CONFIGS = [
    { tier: 0, name: 'Starter', minRecruits: 0, overrideRate: 5 },
    { tier: 1, name: 'Bronze', minRecruits: 5, overrideRate: 10 },
    { tier: 2, name: 'Silver', minRecruits: 10, overrideRate: 15 },
    { tier: 3, name: 'Gold', minRecruits: 15, overrideRate: 20 },
  ]

  function getTierForRecruitCount(count) {
    for (let i = TIER_CONFIGS.length - 1; i >= 0; i--) {
      if (count >= TIER_CONFIGS[i].minRecruits) return TIER_CONFIGS[i]
    }
    return TIER_CONFIGS[0]
  }

  let updated = 0
  let portfolioUpdated = 0

  for (const creator of creators.rows) {
    // Count active recruits
    const recruitResult = await sql`
      SELECT COUNT(*)::int as cnt FROM creators WHERE recruiter_id = ${creator.id} AND status = 'active'
    `
    const recruitCount = recruitResult.rows[0]?.cnt || 0

    // Update recruit_count
    await sql`UPDATE creators SET recruit_count = ${recruitCount}, updated_at = NOW() WHERE id = ${creator.id}`

    // Check if tier needs updating
    const tierConfig = getTierForRecruitCount(recruitCount)
    if (tierConfig.tier !== creator.tier || tierConfig.overrideRate !== Number(creator.override_rate)) {
      await sql`
        UPDATE creators SET tier = ${tierConfig.tier}, override_rate = ${tierConfig.overrideRate}, updated_at = NOW()
        WHERE id = ${creator.id}
      `
      updated++
      console.log(`  ${creator.full_name}: tier ${creator.tier} -> ${tierConfig.tier}, override ${creator.override_rate}% -> ${tierConfig.overrideRate}%`)
    }

    // Update active member count from portfolio
    const memberResult = await sql`
      SELECT COUNT(*)::int as cnt FROM creator_customer_portfolio
      WHERE creator_id = ${creator.id} AND attribution_active = TRUE AND subscription_status = 'active'
    `
    const newMemberCount = memberResult.rows[0]?.cnt || 0
    if (newMemberCount !== creator.active_member_count) {
      await sql`UPDATE creators SET active_member_count = ${newMemberCount}, updated_at = NOW() WHERE id = ${creator.id}`
      portfolioUpdated++
    }

    console.log(`  ${creator.full_name}: recruits=${recruitCount}, tier=${tierConfig.tier} (${tierConfig.name}), override=${tierConfig.overrideRate}%, members=${newMemberCount}`)
  }

  console.log(`\nSummary: ${updated} tiers updated, ${portfolioUpdated} portfolio counts changed, ${creators.rows.length} total creators`)
} catch (err) {
  console.error('update-tiers failed:', err.message)
}

console.log('')
console.log('=== CURRENT STATE AUDIT ===')
try {
  const commissions = await sql`
    SELECT status, COUNT(*)::int as cnt, COALESCE(SUM(commission_amount), 0)::float8 as total
    FROM commission_ledger
    GROUP BY status ORDER BY status
  `
  console.log('Commission ledger by status:')
  for (const row of commissions.rows) {
    console.log(`  ${row.status}: ${row.cnt} entries, $${Number(row.total).toFixed(2)}`)
  }

  const attributions = await sql`
    SELECT
      c.full_name,
      COUNT(oa.id)::int as orders,
      COALESCE(SUM(oa.net_revenue), 0)::float8 as revenue,
      COALESCE(SUM(oa.direct_commission_amount), 0)::float8 as commission
    FROM order_attributions oa
    JOIN creators c ON c.id = oa.creator_id
    GROUP BY c.full_name
    ORDER BY revenue DESC
  `
  console.log('\nOrder attributions by creator:')
  for (const row of attributions.rows) {
    console.log(`  ${row.full_name}: ${row.orders} orders, $${Number(row.revenue).toFixed(2)} revenue, $${Number(row.commission).toFixed(2)} commission`)
  }

  const pendingOrders = await sql`
    SELECT co.order_number, co.member_name, co.status, co.subtotal_usd, co.coupon_code, co.attributed_creator_id,
           c.full_name as creator_name
    FROM club_orders co
    LEFT JOIN creators c ON c.id = co.attributed_creator_id
    WHERE co.attributed_creator_id IS NOT NULL
    ORDER BY co.created_at DESC
    LIMIT 20
  `
  console.log('\nRecent club orders with creator attribution:')
  for (const row of pendingOrders.rows) {
    console.log(`  ${row.order_number} | ${row.member_name} | ${row.status} | $${row.subtotal_usd ?? 'NULL'} | code=${row.coupon_code ?? 'none'} | creator=${row.creator_name ?? 'unknown'}`)
  }
} catch (err) {
  console.error('Audit failed:', err.message)
}

// Close the connection pool
try {
  const { db } = await import('@vercel/postgres')
  await db.end()
} catch {}

process.exit(0)
