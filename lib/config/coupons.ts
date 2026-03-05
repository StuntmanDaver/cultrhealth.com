// Club order coupon codes — server-side source of truth
// Used in /api/club/validate-coupon and /api/club/orders

export type ClubCoupon = {
  discount: number  // percentage (e.g. 20 = 20%)
  label: string
}

export const CLUB_COUPONS: Record<string, ClubCoupon> = {
  'CULTRSTAFF': { discount: 30, label: 'Staff Discount' },
  'CULTRFAM':   { discount: 20, label: 'Family Discount' },
  'CULTR10':    { discount: 10, label: 'Promo Code' },
  'STEWCREW30': { discount: 30, label: 'Stew Crew Discount' },
}

export function validateCoupon(code: string): ClubCoupon | null {
  if (!code) return null
  return CLUB_COUPONS[code.trim().toUpperCase()] ?? null
}
