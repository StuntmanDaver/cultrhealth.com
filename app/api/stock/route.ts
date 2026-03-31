import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const revalidate = 60 // ISR: revalidate every 60 seconds

/** GET — Public endpoint returning stock status for all join therapies */
export async function GET() {
  try {
    if (!process.env.POSTGRES_URL) {
      // No DB — default everything to in_stock
      return NextResponse.json({ stock: {} })
    }

    const result = await sql`
      SELECT therapy_id, stock_status, stock_quantity
      FROM product_inventory
    `

    const stock: Record<string, { status: string; quantity: number | null }> = {}
    for (const row of result.rows) {
      stock[row.therapy_id] = {
        status: row.stock_status,
        quantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
      }
    }

    return NextResponse.json({ stock }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch (err) {
    console.error('[api/stock] GET error:', err)
    return NextResponse.json({ stock: {} })
  }
}
