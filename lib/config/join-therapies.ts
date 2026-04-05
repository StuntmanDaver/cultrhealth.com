/**
 * Curated therapy list for join.cultrhealth.com landing page.
 *
 * This is a SEPARATE config from lib/config/therapies.ts (which powers
 * the main therapies page on staging/production).
 *
 * Updated Apr 2026 — aligned with new Customer Price Catalog.
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

export const JOIN_THERAPY_SECTIONS: JoinTherapySection[] = [
  {
    title: 'Cut — Weight Loss',
    subtitle: 'GLP-1 & dual-agonist therapies',
    description:
      'Physician-supervised weight management protocols using the latest incretin-based therapies for sustainable fat loss.',
    therapies: [
      {
        id: 'semaglutide',
        name: 'Semaglutide/Pyridoxine (reconstituted)',
        badge: '',
        note: '2.5–5 mg/mL | 1–5 mL',
        description:
          'GLP-1 receptor agonist with pyridoxine (B6) for appetite regulation, metabolic improvement, and sustained weight loss.',
        price: 104,
        category: 'glp1',
        catalogSku: 'SMA-PYR-2.5MG-1ML',
        image: '/images/products/semaglutide-glp1.png',
      },
      {
        id: 'tirzepatide',
        name: 'Tirzepatide/Niacinamide (reconstituted)',
        badge: '',
        note: '10–20 mg/mL | 1–3 mL',
        description:
          'Dual GIP/GLP-1 agonist with niacinamide offering enhanced glycemic control and significant body composition changes.',
        price: 130,
        category: 'glp1',
        catalogSku: 'TRZ-NIA-10MG-1ML',
        image: '/images/products/tirzepatide-glp1-gip.png',
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
        id: 'sermorelin',
        name: 'Sermorelin (reconstituted)',
        badge: '',
        note: '3 mg/mL | 5 mL',
        description:
          'Growth hormone-releasing hormone analog that stimulates natural GH production for improved recovery, sleep, and body composition.',
        price: 104,
        category: 'peptide',
        catalogSku: 'SERMORELIN-3MG-5ML',
      },
      {
        id: 'nad-plus',
        name: 'NAD+ (reconstituted)',
        badge: '',
        note: '200 mg/mL | 5 mL',
        description:
          'Essential coenzyme for cellular energy, DNA repair, and metabolic function — foundational to longevity.',
        price: 88.40,
        category: 'peptide',
        catalogSku: 'NAD-200MG-5ML',
        image: '/images/products/nad-plus.png',
      },
      {
        id: 'glutathione',
        name: 'Glutathione',
        badge: '',
        note: '200 mg/mL | 10–30 mL',
        description:
          'Master antioxidant supporting detoxification, immune defense, and cellular protection against oxidative stress.',
        price: 26,
        category: 'wellness',
        catalogSku: 'GLUTATHIONE-200MG-10ML',
        image: '/images/products/glutathione.png',
      },
      {
        id: 'lipo-c',
        name: 'Lipo-C',
        badge: '',
        note: '25/25/50/100 mg/mL | 10 mL',
        description:
          'Lipotropic injection blend for fat metabolism and energy support.',
        price: 26,
        category: 'wellness',
        catalogSku: 'LIPOC-10ML',
      },
      {
        id: 'pt-141',
        name: 'PT-141 (Bremelanotide)',
        badge: '',
        note: 'Multiple formats available',
        description:
          'Melanocortin receptor agonist for enhanced sexual arousal and desire. Available as nasal spray, capsule, and troche.',
        price: 6.50,
        category: 'sexual_wellness',
        catalogSku: 'PT141-ORAL',
      },
      {
        id: 'oxytocin',
        name: 'Oxytocin',
        badge: '',
        note: '50–125 IU troche/RDT',
        description:
          'Neuropeptide promoting bonding, stress reduction, and sexual well-being.',
        price: 2.60,
        category: 'sexual_wellness',
        catalogSku: 'OXYTOCIN-TROCHE',
      },
      {
        id: 'bacteriostatic-water',
        name: 'Bacteriostatic Water',
        badge: '',
        note: '30 ML',
        description:
          'Sterile water with 0.9% benzyl alcohol for safe reconstitution of lyophilized peptides. Essential supply for injectable therapies.',
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

/** Get effective stock status (defaults to 'in_stock' when not set) */
export function getStockStatus(therapy: JoinTherapy): JoinStockStatus {
  return therapy.stockStatus || 'in_stock'
}

/** Get max orderable quantity for a therapy. Returns Infinity when unlimited. */
export function getMaxOrderQuantity(therapy: JoinTherapy): number {
  if (therapy.stockStatus === 'out_of_stock') return 0
  return therapy.stockQuantity ?? Infinity
}
