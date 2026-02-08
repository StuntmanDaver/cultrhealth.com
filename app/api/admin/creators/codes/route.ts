import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import {
  createAffiliateCode,
  deactivateAffiliateCode,
  getAffiliateCodesByCreator,
  createAdminAction,
} from '@/lib/creators/db'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')

    if (!creatorId) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 })
    }

    const codes = await getAffiliateCodesByCreator(creatorId)
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Admin codes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authenticated || !auth.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { creator_id, code, discount_type, discount_value, is_primary } = body

    if (!creator_id || !code) {
      return NextResponse.json({ error: 'creator_id and code are required' }, { status: 400 })
    }

    const newCode = await createAffiliateCode(
      creator_id,
      code,
      is_primary || false,
      discount_type || 'percentage',
      discount_value || 10.00
    )

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'create_affiliate_code',
      entity_type: 'affiliate_code',
      entity_id: newCode.id,
      metadata: { creator_id, code },
    })

    return NextResponse.json({ code: newCode }, { status: 201 })
  } catch (error) {
    console.error('Admin code creation error:', error)
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 })
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

    await deactivateAffiliateCode(codeId)

    await createAdminAction({
      admin_email: auth.email,
      action_type: 'deactivate_affiliate_code',
      entity_type: 'affiliate_code',
      entity_id: codeId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin code deactivation error:', error)
    return NextResponse.json({ error: 'Failed to deactivate code' }, { status: 500 })
  }
}
