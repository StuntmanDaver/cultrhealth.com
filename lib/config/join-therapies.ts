/**
 * Curated therapy list for join.cultrhealth.com landing page.
 *
 * This is a SEPARATE config from lib/config/therapies.ts (which remains
 * untouched for the main staging/production site).
 *
 * Excluded from Enhancement: Sermorelin, TB-500, AOD9604, Lipo B
 * Prices sourced from lib/config/product-catalog.ts where available.
 */

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
  category: 'glp1' | 'peptide'
  /** Reference SKU in product-catalog.ts (for cross-reference only) */
  catalogSku?: string
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
        name: 'Semaglutide',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'GLP-1 receptor agonist for appetite regulation, metabolic improvement, and sustained weight loss.',
        price: null,
        pricingNote: 'Starting from $299/mo',
        category: 'glp1',
        catalogSku: 'SEMA-5MG-3ML',
      },
      {
        id: 'tirzepatide',
        name: 'Tirzepatide',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Dual GIP/GLP-1 agonist offering enhanced glycemic control and significant body composition changes.',
        price: null,
        pricingNote: 'Starting from $399/mo',
        category: 'glp1',
      },
      {
        id: 'retatrutide',
        name: 'Retatrutide',
        badge: 'Physician use only',
        description:
          'Triple-agonist peptide targeting GLP-1, GIP, and glucagon receptors for next-generation metabolic optimization.',
        price: null,
        pricingNote: 'Starting from $499/mo',
        category: 'glp1',
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
        id: 'tesamorelin',
        name: 'Tesamorelin',
        badge: 'Physician use only',
        description:
          'Growth-hormone releasing peptide that targets visceral fat reduction and supports lean body composition.',
        price: 69.70,
        category: 'peptide',
        catalogSku: 'TESAMORELIN-5MG-3ML',
      },
      {
        id: 'nad-plus',
        name: 'NAD+',
        badge: 'Physician use only',
        description:
          'Essential coenzyme for cellular energy, DNA repair, and metabolic function — foundational to longevity.',
        price: 102.00,
        category: 'peptide',
        catalogSku: 'NAD-500MG-10ML',
      },
      {
        id: 'ghk-cu',
        name: 'GHK-CU',
        badge: 'Physician use only',
        description:
          'Copper peptide complex supporting skin remodeling, wound healing, and tissue regeneration.',
        price: 74.80,
        category: 'peptide',
        catalogSku: 'GHKCU-50MG-3ML',
      },
      {
        id: 'bpc-157',
        name: 'BPC-157',
        badge: 'Physician use only',
        description:
          'Body Protection Compound for accelerated gut healing, tendon repair, and systemic anti-inflammatory support.',
        price: 78.20,
        category: 'peptide',
        catalogSku: 'BPC157-5MG-3ML',
      },
      {
        id: 'glutathione',
        name: 'Glutathione',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Master antioxidant for detoxification, immune support, and protection against oxidative stress.',
        price: null,
        pricingNote: 'Consultation pricing',
        category: 'peptide',
      },
      {
        id: 'nad-ghkcu-glutathione-blend',
        name: 'NAD+ / GHK-Cu / Glutathione Blend',
        badge: 'Physician use only',
        note: 'Reconstituted - ready to inject',
        description:
          'Synergistic triple-compound blend combining cellular energy restoration (NAD+), copper peptide tissue remodeling (GHK-Cu), and master antioxidant detoxification (Glutathione) for comprehensive rejuvenation.',
        price: null,
        pricingNote: 'Consultation pricing',
        category: 'peptide',
      },
      {
        id: 'mot-c',
        name: 'MOT-C',
        badge: 'Physician use only',
        description:
          'Mitochondrial-derived peptide that enhances metabolic flexibility, insulin sensitivity, and exercise capacity.',
        price: 91.80,
        category: 'peptide',
        catalogSku: 'MOTSC-10MG-3ML',
      },
      {
        id: 'semax-selank',
        name: 'Semax/Selank',
        badge: 'Physician use only',
        description:
          'Neuropeptide stack for cognitive enhancement, stress resilience, and focus without stimulant side effects.',
        price: 76.50,
        category: 'peptide',
        catalogSku: 'SELANK-SEMAX-5MG-3ML',
      },
    ],
  },
]

/** Get all therapies as a flat array */
export function getAllJoinTherapies(): JoinTherapy[] {
  return JOIN_THERAPY_SECTIONS.flatMap((section) => section.therapies)
}

/** Find a therapy by ID */
export function getJoinTherapyById(id: string): JoinTherapy | undefined {
  return getAllJoinTherapies().find((t) => t.id === id)
}
