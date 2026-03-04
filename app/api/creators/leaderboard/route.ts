import { NextRequest, NextResponse } from 'next/server'
import { verifyCreatorAuth } from '@/lib/auth'
import { sql } from '@vercel/postgres'

type MetricKey = 'clicks' | 'conversions' | 'revenue'

export async function GET(request: NextRequest) {
  const auth = await verifyCreatorAuth(request)
  if (!auth.authenticated || !auth.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawMetric = searchParams.get('metric') || 'clicks'
  const metric: MetricKey = ['clicks', 'conversions', 'revenue'].includes(rawMetric)
    ? (rawMetric as MetricKey)
    : 'clicks'

  try {
    // Pre-aggregate clicks and orders in subqueries to avoid cross-product inflation
    const result =
      metric === 'conversions'
        ? await sql`
            SELECT
              c.id,
              c.full_name,
              COALESCE(clicks.cnt, 0) AS month_clicks,
              COALESCE(orders.cnt, 0) AS month_conversions,
              COALESCE(orders.total_revenue, 0) AS month_revenue
            FROM creators c
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt
              FROM click_events
              WHERE clicked_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) clicks ON clicks.creator_id = c.id
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt, SUM(net_revenue) AS total_revenue
              FROM order_attributions
              WHERE created_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) orders ON orders.creator_id = c.id
            WHERE c.status = 'active'
            ORDER BY month_conversions DESC
            LIMIT 10
          `
        : metric === 'revenue'
        ? await sql`
            SELECT
              c.id,
              c.full_name,
              COALESCE(clicks.cnt, 0) AS month_clicks,
              COALESCE(orders.cnt, 0) AS month_conversions,
              COALESCE(orders.total_revenue, 0) AS month_revenue
            FROM creators c
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt
              FROM click_events
              WHERE clicked_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) clicks ON clicks.creator_id = c.id
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt, SUM(net_revenue) AS total_revenue
              FROM order_attributions
              WHERE created_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) orders ON orders.creator_id = c.id
            WHERE c.status = 'active'
            ORDER BY month_revenue DESC
            LIMIT 10
          `
        : await sql`
            SELECT
              c.id,
              c.full_name,
              COALESCE(clicks.cnt, 0) AS month_clicks,
              COALESCE(orders.cnt, 0) AS month_conversions,
              COALESCE(orders.total_revenue, 0) AS month_revenue
            FROM creators c
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt
              FROM click_events
              WHERE clicked_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) clicks ON clicks.creator_id = c.id
            LEFT JOIN (
              SELECT creator_id, COUNT(*) AS cnt, SUM(net_revenue) AS total_revenue
              FROM order_attributions
              WHERE created_at >= DATE_TRUNC('month', NOW())
              GROUP BY creator_id
            ) orders ON orders.creator_id = c.id
            WHERE c.status = 'active'
            ORDER BY month_clicks DESC
            LIMIT 10
          `

    const entries = result.rows.map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      name: row.id === auth.creatorId
        ? row.full_name.split(' ')[0]
        : `Creator ${String.fromCharCode(65 + idx)}`,
      isYou: row.id === auth.creatorId,
      clicks: Number(row.month_clicks),
      conversions: Number(row.month_conversions),
      revenue: Number(row.month_revenue),
    }))

    return NextResponse.json({ leaderboard: entries })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
