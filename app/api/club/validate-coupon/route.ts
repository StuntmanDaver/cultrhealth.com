import { NextResponse } from 'next/server'
import { validateCouponUnified } from '@/lib/config/coupons'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })
    }
    const result = await validateCouponUnified(code)
    if (!result) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }
    return NextResponse.json({
      valid: true,
      discount: result.discount,
      label: result.label,
      isCreatorCode: result.isCreatorCode,
      creatorName: result.creatorName || undefined,
      creatorId: result.creatorId || undefined,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }
}
