import { NextResponse } from 'next/server'
import { validateCouponUnified, isExpiredCoupon, getCouponProductEligibilityError } from '@/lib/config/coupons'
import { getJoinCouponPolicy } from '@/lib/config/join-therapies'

export async function POST(request: Request) {
  try {
    const { code, items } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 })
    }
    const result = await validateCouponUnified(code)
    if (!result) {
      const error = isExpiredCoupon(code) ? 'This coupon code has expired.' : 'Invalid coupon code.'
      return NextResponse.json({ valid: false, error })
    }

    const cartItems = Array.isArray(items) ? items : []
    const couponPolicy = getJoinCouponPolicy(cartItems)
    if (!couponPolicy.couponAllowed) {
      return NextResponse.json({ valid: false, error: couponPolicy.couponError })
    }

    const eligibilityError = getCouponProductEligibilityError(
      { applicableTherapyIds: result.applicableTherapyIds, label: result.label },
      cartItems
    )
    if (eligibilityError) {
      return NextResponse.json({ valid: false, error: eligibilityError })
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
      label: result.label,
      isCreatorCode: result.isCreatorCode,
      noBundleStack: result.noBundleStack || couponPolicy.forceNoBundleStack || false,
      creatorName: result.creatorName || undefined,
      creatorId: result.creatorId || undefined,
      applicableTherapyIds: result.applicableTherapyIds,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }
}
