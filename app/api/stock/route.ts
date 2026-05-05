import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
}

/** GET — Public endpoint returning stock status for all products */
export async function GET() {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ stock: {} }, { headers: NO_CACHE_HEADERS })
    }

    // Restrict strictly to join_cultrhealth rows (the source of truth for /join)
    // and ORDER deterministically so a future duplicate row never causes a
    // non-deterministic last-writer-wins in the JS loop below.
    const result = await sql`
      SELECT therapy_id, stock_status, stock_quantity
      FROM product_inventory
      WHERE COALESCE(site_source, 'join_cultrhealth') = 'join_cultrhealth'
      ORDER BY therapy_id
    `

    const stock: Record<string, { status: string; quantity: number | null }> = {}
    for (const row of result.rows) {
      stock[row.therapy_id] = {
        status: row.stock_status,
        quantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
      }
    }

    return NextResponse.json({ stock }, { headers: NO_CACHE_HEADERS })
  } catch (err) {
    console.error('[api/stock] GET error:', err)
    return NextResponse.json({ stock: {} }, { headers: NO_CACHE_HEADERS })
  }
}
