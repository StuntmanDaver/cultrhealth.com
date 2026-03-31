import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getSession, isProviderEmail } from '@/lib/auth'

async function verifyAdmin() {
  const session = await getSession()
  if (!session) return null
  const adminEmails = process.env.ADMIN_ALLOWED_EMAILS || process.env.PROTOCOL_BUILDER_ALLOWED_EMAILS || ''
  const allowedEmails = adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = allowedEmails.includes(session.email.toLowerCase()) || isProviderEmail(session.email)
  return isAdmin ? session : null
}

/** GET — List all product inventory rows */
export async function GET() {
  try {
    const session = await verifyAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ inventory: [] })
    }

    const result = await sql`
      SELECT therapy_id, therapy_name, stock_status, stock_quantity, updated_at, updated_by
      FROM product_inventory
      ORDER BY therapy_name ASC
    `

    return NextResponse.json({
      inventory: result.rows.map((r) => ({
        therapyId: r.therapy_id,
        therapyName: r.therapy_name,
        stockStatus: r.stock_status,
        stockQuantity: r.stock_quantity != null ? Number(r.stock_quantity) : null,
        updatedAt: r.updated_at,
        updatedBy: r.updated_by,
      })),
    })
  } catch (err) {
    console.error('[admin/inventory] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

/** PUT — Update stock status and/or quantity for a therapy */
export async function PUT(request: Request) {
  try {
    const session = await verifyAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { therapyId, stockStatus, stockQuantity } = body as {
      therapyId: string
      stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
      stockQuantity: number | null
    }

    if (!therapyId || !stockStatus) {
      return NextResponse.json({ error: 'therapyId and stockStatus are required' }, { status: 400 })
    }

    if (!['in_stock', 'low_stock', 'out_of_stock'].includes(stockStatus)) {
      return NextResponse.json({ error: 'Invalid stockStatus' }, { status: 400 })
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    await sql`
      INSERT INTO product_inventory (therapy_id, therapy_name, stock_status, stock_quantity, updated_at, updated_by)
      VALUES (${therapyId}, ${therapyId}, ${stockStatus}, ${stockQuantity}, NOW(), ${session.email})
      ON CONFLICT (therapy_id) DO UPDATE SET
        stock_status = ${stockStatus},
        stock_quantity = ${stockQuantity},
        updated_at = NOW(),
        updated_by = ${session.email}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/inventory] PUT error:', err)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
