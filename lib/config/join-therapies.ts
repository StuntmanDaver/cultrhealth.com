/**
 * Curated therapy list for join.cultrhealth.com landing page.
 *
 * This is a SEPARATE config from lib/config/therapies.ts (which remains
 * untouched for the main staging/production site).
 *
 * Updated Feb 2026 — all therapies now have fixed pricing.
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
  /** When true, card spans full width across both columns */
  featured?: boolean
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
        id: 'retatrutide',
        name: 'R3TA — GLP1/GIP/GCG',
        badge: 'Physician use only',
        note: '20 MG | 3 ML',
        description:
          'Triple-agonist peptide targeting GLP-1, GIP, and glucagon receptors for next-generation metabolic optimization.',
        price: 340,
        category: 'glp1',
        featured: true,
      },
      {
        id: 'semaglutide',
        name: 'Semaglutide — GLP1',
        badge: 'Physician use only',
        note: '5 MG | 3 ML',
        description:
          'GLP-1 receptor agonist for appetite regulation, metabolic improvement, and sustained weight loss.',
        price: 225,
        category: 'glp1',
        catalogSku: 'SEMA-5MG-3ML',
      },
      {
        id: 'tirzepatide',
        name: 'Tirzepatide — GLP1/GIP',
        badge: 'Physician use only',
        note: '20 MG | 3 ML',
        description:
          'Dual GIP/GLP-1 agonist offering enhanced glycemic control and significant body composition changes.',
        price: 290,
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
        id: 'ghk-cu',
        name: 'GHK-CU',
        badge: 'Physician use only',
        note: '100 MG | 3 ML',
        description:
          'Copper peptide complex supporting skin remodeling, wound healing, and tissue regeneration.',
        price: 145,
        category: 'peptide',
        catalogSku: 'GHKCU-100MG-3ML',
      },
      {
        id: 'tesa-ipa',
        name: 'TESA/IPA',
        badge: 'Physician use only',
        note: '12/6 MG | 3 ML',
        description:
          'Tesamorelin/Ipamorelin blend for growth hormone optimization, visceral fat reduction, and lean body composition.',
        price: 175,
        category: 'peptide',
      },
      {
        id: 'cjc1295-ipa',
        name: 'CJC1295/IPA',
        badge: 'Physician use only',
        note: '10/10 MG | 3 ML',
        description:
          'Growth hormone releasing hormone and secretagogue blend for sustained GH elevation, recovery, and body recomposition.',
        price: 170,
        category: 'peptide',
      },
      {
        id: 'nad-plus',
        name: 'NAD+',
        badge: 'Physician use only',
        note: '1000 MG | 10 ML',
        description:
          'Essential coenzyme for cellular energy, DNA repair, and metabolic function — foundational to longevity.',
        price: 175,
        category: 'peptide',
        catalogSku: 'NAD-1000MG-10ML',
      },
      {
        id: 'semax-selank',
        name: 'Semax/Selank',
        badge: 'Physician use only',
        note: '5/5 MG | 3 ML',
        description:
          'Neuropeptide stack for cognitive enhancement, stress resilience, and focus without stimulant side effects.',
        price: 115,
        category: 'peptide',
        catalogSku: 'SELANK-SEMAX-5MG-3ML',
      },
      {
        id: 'bpc157-tb500',
        name: 'BPC157/TB500',
        badge: 'Physician use only',
        note: '10/10 MG | 3 ML',
        description:
          'Dual-peptide recovery stack combining gut healing and tendon repair (BPC-157) with systemic tissue regeneration (TB-500).',
        price: 150,
        category: 'peptide',
      },
      {
        id: 'melanotan-2',
        name: 'Melanotan 2 (MT2)',
        badge: 'Physician use only',
        note: '10 MG | 3 ML',
        description:
          'Melanocortin peptide for enhanced tanning response, skin pigmentation support, and photoprotection.',
        price: 110,
        category: 'peptide',
      },
      {
        id: 'glutathione',
        name: 'Glutathione',
        badge: 'Physician use only',
        description:
          'Master antioxidant supporting detoxification, immune defense, and cellular protection against oxidative stress.',
        price: null,
        pricingNote: 'TBD',
        category: 'peptide',
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
