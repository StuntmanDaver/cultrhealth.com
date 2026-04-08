/**
 * Curated therapy list for join.cultrhealth.com landing page.
 *
 * This is a SEPARATE config from lib/config/therapies.ts (which powers
 * the main therapies page on staging/production).
 *
 * Restored Apr 2026 to match the legacy join.cultrhealth.com catalog.
 */

export type JoinStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface JoinTherapy {
  id: string
  name: string
  description: string
  badge: string
  note?: string
  /** Price in USD. null = consultation/prescription pricing */
  price: number | null
  /** Displayed when price is null */
  pricingNote?: string
  category: 'glp1' | 'peptide' | 'wellness' | 'sexual_wellness'
  /** When true, card spans full width across both columns */
  featured?: boolean
  /** Reference SKU in product-catalog.ts (for cross-reference only) */
  catalogSku?: string
  /** Product image URL */
  image?: string
  /** Optional COA image shown in the expanded product modal */
  secondaryImage?: string
  /** ID of a product this bundles with for a discount */
  bundleWith?: string
  /** Stock status. Defaults to 'in_stock' when omitted. */
  stockStatus?: JoinStockStatus
  /** Remaining units available. Used for max-quantity enforcement when set. */
  stockQuantity?: number
}

export interface JoinTherapySection {
  title: string
  subtitle: string
  description: string
  therapies: JoinTherapy[]
}

export interface JoinCatalogCartItem {
  therapyId: string
  name: string
  price: number | null
  pricingNote?: string
  note?: string
  quantity: number
}

export interface JoinCouponPolicy {
  couponAllowed: boolean
  couponError: string | null
  forceNoBundleStack: boolean
}

export const JOIN_THERAPY_SECTIONS: JoinTherapySection[] = [
  {
    title: 'Cut — Weight Loss',
    subtitle: 'GLP-1 & dual-agonist therapies',
    description:
      'Physician-supervised weight management protocols using the latest incretin-based therapies for sustainable fat loss.',
    therapies: [
      {
        id: 'retatrutide',
        name: 'R3TA — GLP1/GIP/GCG',
        badge: '',
        note: '20 MG | 3 ML · 2-3 month supply',
        description:
          'Triple-agonist peptide targeting GLP-1, GIP, and glucagon receptors for next-generation metabolic optimization.',
        price: 340,
        category: 'glp1',
        featured: true,
        image: '/images/products/r3ta-glp1-gip-gcg.png',
        secondaryImage: '/images/products/r3ta-glp1-gip-gcg-coa.png',
      },
      {
        id: 'semaglutide',
        name: 'Semaglutide — GLP1',
        badge: '',
        note: '5 MG | 3 ML · 2-3 month supply',
        description:
          'GLP-1 receptor agonist for appetite regulation, metabolic improvement, and sustained weight loss.',
        price: 225,
        category: 'glp1',
        catalogSku: 'SEMA-5MG-3ML',
        image: '/images/products/semaglutide-glp1.png',
      },
      {
        id: 'tirzepatide',
        name: 'Tirzepatide — GLP1/GIP',
        badge: '',
        note: '20 MG | 3 ML · 2-3 month supply',
        description:
          'Dual GIP/GLP-1 agonist offering enhanced glycemic control and significant body composition changes.',
        price: 290,
        category: 'glp1',
        image: '/images/products/tirzepatide-glp1-gip.png',
        secondaryImage: '/images/products/tirzepatide-glp1-gip-coa.png',
      },
    ],
  },
  {
    title: 'Enhancement',
    subtitle: 'Peptides & regenerative therapies',
    description:
      'Advanced peptide protocols for recovery, longevity, and performance optimization — tailored to your biomarkers.',
    therapies: [
      {
        id: 'ghk-cu',
        name: 'GHK-CU',
        badge: '',
        note: '100 MG | 3 ML',
        description:
          'Copper peptide complex supporting skin remodeling, wound healing, and tissue regeneration.',
        price: 145,
        category: 'peptide',
        catalogSku: 'GHKCU-100MG-3ML',
        image: '/images/products/ghk-cu.png',
        secondaryImage: '/images/products/ghk-cu-coa.png',
        bundleWith: 'glutathione',
      },
      {
        id: 'glutathione',
        name: 'Glutathione',
        badge: '',
        note: '200 MG | 10 ML',
        description:
          'Master antioxidant supporting detoxification, immune defense, and cellular protection against oxidative stress.',
        price: 125,
        category: 'peptide',
        image: '/images/products/glutathione.png',
        bundleWith: 'ghk-cu',
      },
      {
        id: 'tesa-ipa',
        name: 'TESA/IPA',
        badge: '',
        note: '12/6 MG | 3 ML',
        description:
          'Tesamorelin/Ipamorelin blend for growth hormone optimization, visceral fat reduction, and lean body composition.',
        price: 175,
        category: 'peptide',
        image: '/images/products/tesa-ipa.png',
      },
      {
        id: 'cjc1295-ipa',
        name: 'CJC1295/IPA',
        badge: '',
        note: '10/10 MG | 3 ML',
        description:
          'Growth hormone releasing hormone and secretagogue blend for sustained GH elevation, recovery, and body recomposition.',
        price: 170,
        category: 'peptide',
        image: '/images/products/cjc1295-ipa.png',
        secondaryImage: '/images/products/cjc1295-ipa-coa.png',
      },
      {
        id: 'nad-plus',
        name: 'NAD+',
        badge: '',
        note: '1000 MG | 10 ML',
        description:
          'Essential coenzyme for cellular energy, DNA repair, and metabolic function — foundational to longevity.',
        price: 175,
        category: 'peptide',
        catalogSku: 'NAD-1000MG-10ML',
        image: '/images/products/nad-plus.png',
        secondaryImage: '/images/products/nad-plus-coa.png',
      },
      {
        id: 'semax-selank',
        name: 'Semax/Selank',
        badge: '',
        note: '5/5 MG | 3 ML',
        description:
          'Neuropeptide stack for cognitive enhancement, stress resilience, and focus without stimulant side effects.',
        price: 115,
        category: 'peptide',
        catalogSku: 'SELANK-SEMAX-5MG-3ML',
        image: '/images/products/semax-selank.png',
        secondaryImage: '/images/products/semax-selank-coa.png',
      },
      {
        id: 'bpc157-tb500',
        name: 'BPC157/TB500',
        badge: '',
        note: '10/10 MG | 3 ML',
        description:
          'Dual-peptide recovery stack combining gut healing and tendon repair (BPC-157) with systemic tissue regeneration (TB-500).',
        price: 150,
        category: 'peptide',
        image: '/images/products/bpc157-tb500.png',
        secondaryImage: '/images/products/bpc157-tb500-coa.png',
      },
      {
        id: 'melanotan-2',
        name: 'Melanotan 2 (MT2)',
        badge: '',
        note: '10 MG | 3 ML',
        description:
          'Melanocortin peptide for enhanced tanning response, skin pigmentation support, and photoprotection.',
        price: 110,
        category: 'peptide',
        image: '/images/products/melanotan2-mt2.png',
        secondaryImage: '/images/products/melanotan2-mt2-coa.png',
      },
      {
        id: 'igf1-lr3',
        name: 'IGF-1 LR3',
        badge: '',
        note: '1 MG | 3 ML',
        description:
          'Long-acting insulin-like growth factor for enhanced muscle protein synthesis, recovery acceleration, and anabolic support.',
        price: 160,
        category: 'peptide',
        image: '/images/products/igf1-lr3.png',
      },
      {
        id: 'bacteriostatic-water',
        name: 'Bacteriostatic Water',
        badge: '',
        note: '30 ML',
        description:
          'FDA approved Hospira brand 30ml bacteriostatic water for injection, USP, is a sterile, multiple-dose, non-pyrogenic water for injection. Contains 0.9% (9 mg/mL) benzyl alcohol added as a bacteriostatic preservative. Bacteriostatic water for injection, USP, is a sterile, multiple-dose, non-pyrogenic water for injection. Bacteriostatic Water for Injection is supplied in a multiple-dose 30 mL plastic vial with a flip-top lid and is not pressurized. Contains 0.9% (9 mg/mL) of benzyl alcohol added as a bacteriostatic preservative.',
        price: 29.99,
        category: 'peptide',
        catalogSku: 'BACWATER-30ML',
        image: '/images/products/bacteriostatic-water.png',
      },
    ],
  },
]

/** Bundle discount rate applied when both items in a bundleWith pair are in cart */
export const BUNDLE_DISCOUNT_RATE = 0.10

/**
 * Calculate total bundle discount for a set of cart items.
 * For each item whose bundleWith partner is also in the cart,
 * applies BUNDLE_DISCOUNT_RATE to that item's (price * quantity).
 * Only applies to items with non-null prices.
 * Pure function — works on client and server.
 */
export function calculateBundleDiscount(
  items: Array<{ therapyId: string; price: number | null; quantity: number }>
): number {
  const allTherapies = getAllJoinTherapies()
  const cartIds = new Set(items.map((i) => i.therapyId))

  let discount = 0
  for (const item of items) {
    if (item.price === null) continue
    const therapy = allTherapies.find((t) => t.id === item.therapyId)
    if (!therapy?.bundleWith) continue
    if (!cartIds.has(therapy.bundleWith)) continue
    discount += item.price * item.quantity * BUNDLE_DISCOUNT_RATE
  }

  return Math.round(discount * 100) / 100
}

/** Get all therapies as a flat array */
export function getAllJoinTherapies(): JoinTherapy[] {
  return JOIN_THERAPY_SECTIONS.flatMap((section) => section.therapies)
}

/** Find a therapy by ID */
export function getJoinTherapyById(id: string): JoinTherapy | undefined {
  return getAllJoinTherapies().find((t) => t.id === id)
}

/** Rebuild cart/order items from the current join catalog source of truth. */
export function normalizeJoinCartItems(
  items: Array<{ therapyId: string; quantity: number }>
): JoinCatalogCartItem[] {
  return items.flatMap((item) => {
    const therapy = getJoinTherapyById(item.therapyId)
    const quantity = Number(item.quantity)

    if (!therapy || !Number.isInteger(quantity) || quantity <= 0) {
      return []
    }

    return [
      {
        therapyId: therapy.id,
        name: therapy.name,
        price: therapy.price,
        pricingNote: therapy.pricingNote,
        note: therapy.note,
        quantity,
      },
    ]
  })
}

/** Join-only coupon rules derived from the active cart composition. */
export function getJoinCouponPolicy(
  items: Array<{ therapyId: string; quantity: number }>
): JoinCouponPolicy {
  const orderItems = normalizeJoinCartItems(items)
  const therapyIds = new Set(orderItems.map((item) => item.therapyId))

  const isBacWaterOnly =
    orderItems.length > 0 &&
    therapyIds.size === 1 &&
    therapyIds.has('bacteriostatic-water')

  return {
    couponAllowed: !isBacWaterOnly,
    couponError: isBacWaterOnly
      ? 'Coupons require another therapy in the cart. Bacteriostatic water alone is not eligible.'
      : null,
    forceNoBundleStack: therapyIds.has('ghk-cu') && therapyIds.has('glutathione'),
  }
}

/** Get effective stock status (defaults to 'in_stock' when not set) */
export function getStockStatus(therapy: JoinTherapy): JoinStockStatus {
  return therapy.stockStatus || 'in_stock'
}

/** Get max orderable quantity for a therapy. Returns Infinity when unlimited. */
export function getMaxOrderQuantity(therapy: JoinTherapy): number {
  if (therapy.stockStatus === 'out_of_stock') return 0
  return therapy.stockQuantity ?? Infinity
}
