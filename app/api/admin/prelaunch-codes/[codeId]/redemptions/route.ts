import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAdminAuth } from '@/lib/auth'
import { getPrelaunchCodeRedemptions } from '@/lib/creators/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { codeId: string } }
) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { codeId } = params

    // Look up the code string from affiliate_codes (scoped to prelaunch only)
    const codeResult = await sql`
      SELECT code FROM affiliate_codes WHERE id = ${codeId} AND program_type = 'prelaunch'
    `
    if (!codeResult.rows[0]) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    const redemptions = await getPrelaunchCodeRedemptions(codeResult.rows[0].code)
    return NextResponse.json({ redemptions })
  } catch (error) {
    console.error('Admin prelaunch redemptions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
  }
}
