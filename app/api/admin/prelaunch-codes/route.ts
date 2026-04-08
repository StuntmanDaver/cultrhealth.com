import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import {
  createPrelaunchCode,
  getPrelaunchCodes,
  deactivateAffiliateCode,
  checkAffiliateCodeExists,
  createAdminAction,
} from '@/lib/creators/db'
import { PRELAUNCH_CONFIG } from '@/lib/config/affiliate'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const codes = await getPrelaunchCodes()
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Admin prelaunch codes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch prelaunch codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, creator_id } = body as { code?: string; creator_id?: string }

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    // Check for duplicate
    const exists = await checkAffiliateCodeExists(normalizedCode)
    if (exists) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
    }

    const newCode = await createPrelaunchCode(
      normalizedCode,
      creator_id || null,
      PRELAUNCH_CONFIG.discountPercent,
      PRELAUNCH_CONFIG.expiryDays
    )

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'create_prelaunch_code',
      entity_type: 'affiliate_code',
      entity_id: newCode.id,
      metadata: { code: normalizedCode, creator_id: creator_id || null, program_type: 'prelaunch' },
    })

    return NextResponse.json({ code: newCode }, { status: 201 })
  } catch (error) {
    console.error('Admin prelaunch code creation error:', error)
    return NextResponse.json({ error: 'Failed to create prelaunch code' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const codeId = searchParams.get('code_id')

    if (!codeId) {
      return NextResponse.json({ error: 'code_id is required' }, { status: 400 })
    }

    // Verify code is a prelaunch code before deactivating
    const check = await sql`SELECT id FROM affiliate_codes WHERE id = ${codeId} AND program_type = 'prelaunch'`
    if (!check.rows[0]) {
      return NextResponse.json({ error: 'Prelaunch code not found' }, { status: 404 })
    }

    await deactivateAffiliateCode(codeId)

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'deactivate_prelaunch_code',
      entity_type: 'affiliate_code',
      entity_id: codeId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin prelaunch code deactivation error:', error)
    return NextResponse.json({ error: 'Failed to deactivate code' }, { status: 500 })
  }
}
