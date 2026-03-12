// Club order coupon codes — server-side source of truth
// Used in /api/club/validate-coupon and /api/club/orders

import { getAffiliateCodeByCode, getCreatorById } from '@/lib/creators/db'

export type ClubCoupon = {
  discount: number  // percentage (e.g. 20 = 20%)
  label: string
}

export type UnifiedCouponResult = {
  discount: number
  label: string
  isCreatorCode: boolean
  creatorId?: string
  creatorName?: string
  codeId?: string
  codeType?: 'membership' | 'product' | 'general'
}

export const CLUB_COUPONS: Record<string, ClubCoupon> = {
  'CULTRSTAFF': { discount: 30, label: 'Staff Discount' },
  'CULTRFAM':   { discount: 20, label: 'Family Discount' },
  'CULTR10':    { discount: 10, label: 'Promo Code' },
}

export function validateCoupon(code: string): ClubCoupon | null {
  if (!code) return null
  return CLUB_COUPONS[code.trim().toUpperCase()] ?? null
}

export async function validateCouponUnified(code: string): Promise<UnifiedCouponResult | null> {
  if (!code) return null
  const normalized = code.trim().toUpperCase()

  // Priority 1: Check hardcoded staff coupons (no DB call)
  const internal = CLUB_COUPONS[normalized]
  if (internal) {
    return { discount: internal.discount, label: internal.label, isCreatorCode: false }
  }

  // Priority 2: Check creator affiliate codes in DB
  try {
    const affiliateCode = await getAffiliateCodeByCode(normalized)
    if (affiliateCode) {
      const creator = await getCreatorById(affiliateCode.creator_id)
      if (creator && creator.status === 'active') {
        return {
          discount: affiliateCode.discount_value,
          label: `${creator.full_name}'s Code`,
          isCreatorCode: true,
          creatorId: creator.id,
          creatorName: creator.full_name,
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
