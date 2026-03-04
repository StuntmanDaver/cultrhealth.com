import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/config/coupons'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })
    }
    const coupon = validateCoupon(code)
    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }
    return NextResponse.json({ valid: true, discount: coupon.discount, label: coupon.label })
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }
}
