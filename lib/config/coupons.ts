// Club order coupon codes — server-side source of truth
// Used in /api/club/validate-coupon and /api/club/orders

import { getAffiliateCodeByCode, getCreatorById } from '@/lib/creators/db'

export type ClubCoupon = {
  discount: number  // percentage (e.g. 20 = 20%)
  label: string
  expiresAt?: Date
  noBundleStack?: boolean  // true = disable bundle discount when this coupon is applied
  /**
   * When set, the coupon only discounts line items whose `therapyId` is in this list.
   * The cart must contain at least one matching item for the coupon to validate, and
   * the discount is applied only to the subtotal of matching items (not the whole order).
   */
  applicableTherapyIds?: string[]
}

export type UnifiedCouponResult = {
  discount: number
  label: string
  isCreatorCode: boolean
  noBundleStack?: boolean
  creatorId?: string
  creatorName?: string
  codeId?: string
  codeType?: 'membership' | 'product' | 'general'
  applicableTherapyIds?: string[]
}

export const CLUB_COUPONS: Record<string, ClubCoupon> = {
  'OWNER':      { discount: 60, label: 'Owner Discount' },
  'CULTRSTAFF': { discount: 30, label: 'Staff Discount' },
  'CULTRFAM':   { discount: 20, label: 'Family Discount' },
  'CULTR10':    { discount: 10, label: 'Promo Code' },
  'SUMMER20':   { discount: 20, label: 'Summer Promo' },
  'LOYALTY15':  { discount: 15, label: 'Returning Customer' },
  'CULTR30':    { discount: 30, label: 'Owner Promo', expiresAt: new Date('2026-04-11T23:59:59Z'), noBundleStack: true },
  'BUTCH10':    { discount: 10, label: 'Promo Code' },
  'OWNERLR3':   { discount: 70, label: 'Owner Discount' },
  'RETA':       { discount: 50, label: 'R3TA 50% Off', applicableTherapyIds: ['retatrutide'], noBundleStack: true },
}

/**
 * Returns a human-readable error when the supplied cart does not contain any item the coupon
 * applies to, or `null` if the coupon is fine for the cart. Product-agnostic coupons always
 * return `null`.
 */
export function getCouponProductEligibilityError(
  coupon: Pick<ClubCoupon, 'applicableTherapyIds' | 'label'>,
  items: Array<{ therapyId: string }>
): string | null {
  if (!coupon.applicableTherapyIds || coupon.applicableTherapyIds.length === 0) return null
  const cartIds = new Set(items.map((i) => i.therapyId))
  const hasMatch = coupon.applicableTherapyIds.some((id) => cartIds.has(id))
  if (hasMatch) return null
  return `This coupon is only valid for specific products. Add an eligible product to your cart to redeem ${coupon.label}.`
}

export function validateCoupon(code: string): ClubCoupon | null {
  if (!code) return null
  const coupon = CLUB_COUPONS[code.trim().toUpperCase()]
  if (!coupon) return null
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return null
  return coupon
}

/** Returns 'expired' if the code exists but is past its expiresAt date */
export function isExpiredCoupon(code: string): boolean {
  if (!code) return false
  const coupon = CLUB_COUPONS[code.trim().toUpperCase()]
  if (!coupon) return false
  return !!(coupon.expiresAt && new Date() > coupon.expiresAt)
}

/** Codes that disable bundle discounts (OWNER always does, plus any with noBundleStack) */
export const NO_BUNDLE_CODES = new Set(
  Object.entries(CLUB_COUPONS)
    .filter(([key, c]) => key === 'OWNER' || c.noBundleStack)
    .map(([key]) => key)
)

export async function validateCouponUnified(code: string): Promise<UnifiedCouponResult | null> {
  if (!code) return null
  const normalized = code.trim().toUpperCase()

  // Priority 1: Check hardcoded staff coupons (no DB call)
  const internal = CLUB_COUPONS[normalized]
  if (internal) {
    if (internal.expiresAt && new Date() > internal.expiresAt) return null
    return {
      discount: internal.discount,
      label: internal.label,
      isCreatorCode: false,
      noBundleStack: internal.noBundleStack,
      applicableTherapyIds: internal.applicableTherapyIds,
    }
  }

  // Priority 2: Check creator affiliate codes in DB (includes prelaunch codes)
  try {
    const affiliateCode = await getAffiliateCodeByCode(normalized)
    if (affiliateCode) {
      // Company-owned code (no creator) — valid prelaunch code with no commission
      if (!affiliateCode.creator_id) {
        return {
          discount: Math.floor(Number(affiliateCode.discount_value)),
          label: 'Promo Code',
          isCreatorCode: false,
          codeId: affiliateCode.id,
          codeType: affiliateCode.code_type as 'membership' | 'product' | 'general',
        }
      }

      // Creator-owned code — validate creator status
      // Creator coupons disable bundle discount (no stacking)
      const creator = await getCreatorById(affiliateCode.creator_id)
      if (creator && creator.status === 'active') {
        return {
          discount: Math.floor(Number(affiliateCode.discount_value)),
          label: `${creator.full_name}'s Code`,
          isCreatorCode: true,
          noBundleStack: true,
          creatorId: creator.id,
          creatorName: creator.full_name,
          codeId: affiliateCode.id,
          codeType: affiliateCode.code_type as 'membership' | 'product' | 'general',
        }
      }

      // Creator paused/rejected — still honor the discount but skip commission
      if (creator && creator.status !== 'active') {
        return {
          discount: Math.floor(Number(affiliateCode.discount_value)),
          label: `${creator.full_name}'s Code`,
          isCreatorCode: false,
          noBundleStack: true,
          codeId: affiliateCode.id,
          codeType: affiliateCode.code_type as 'membership' | 'product' | 'general',
        }
      }
    }
  } catch (err) {
    console.error('[validateCouponUnified] DB lookup failed (non-fatal):', err)
  }

  return null
}
