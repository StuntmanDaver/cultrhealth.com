// CULTR Dosing Calculator — therapy preset catalog
//
// Two-tier picker: users pick a category, then a specific therapy. Each
// therapy ships a complete set of starting defaults (vial size, diluent
// volume, typical dose, frequency, cycle length) so the calculator feels
// prefilled for real work instead of empty inputs. These are reference
// starting points only — patients and providers always adjust for the
// specific protocol.

import type {
  DosageFrequency,
  DoseUnit,
  DosePerKgUnit,
} from '@/lib/peptide-calculator'

export type TherapyCategory =
  | 'glp1'
  | 'longevity'
  | 'growth'
  | 'repair'
  | 'blends'
  | 'sexual-wellness'
  | 'custom'

export interface TherapyCategoryDef {
  id: TherapyCategory
  label: string
  blurb: string
}

export interface TherapyPreset {
  id: string                         // stable slug, safe for URLs
  category: TherapyCategory
  label: string                      // short display label
  compound: string                   // full compound name
  summary: string                    // one-line clinical blurb
  vialMg: number
  waterMl: number
  dose: number
  doseUnit: DoseUnit
  frequency: DosageFrequency
  therapyLengthWeeks: number
  syringeMl?: number
  dosePerKg?: number                 // optional weight-based target (many peptides aren't weight-dosed)
  dosePerKgUnit?: DosePerKgUnit
  /** SKU match in lib/config/product-catalog.ts — drives cross-links later. */
  catalogSku?: string
}

export const THERAPY_CATEGORIES: TherapyCategoryDef[] = [
  { id: 'glp1', label: 'GLP-1', blurb: 'Metabolic & weight support' },
  { id: 'longevity', label: 'Longevity', blurb: 'Cellular repair & energy' },
  { id: 'growth', label: 'Growth', blurb: 'Growth hormone support' },
  { id: 'repair', label: 'Repair', blurb: 'Tissue repair & recovery' },
  { id: 'blends', label: 'Blends', blurb: 'Multi-compound formulations' },
  { id: 'sexual-wellness', label: 'Sexual Wellness', blurb: 'Intimacy & libido' },
  { id: 'custom', label: 'Custom', blurb: 'Enter values manually' },
]

export const THERAPY_PRESETS: TherapyPreset[] = [
  // ── GLP-1 ─────────────────────────────────────────────────────────
  {
    id: 'glp1-tirz',
    category: 'glp1',
    label: 'TIRZ / B3',
    compound: 'Tirzepatide / Niacinamide',
    summary: 'Weekly GLP-1/GIP receptor agonist with B3. Typical starting dose 2.5 mg weekly.',
    vialMg: 20,
    waterMl: 3,
    dose: 2.5,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 12,
    syringeMl: 0.5,
  },
  {
    id: 'glp1-sema',
    category: 'glp1',
    label: 'SEMA / B6',
    compound: 'Semaglutide / Pyridoxine',
    summary: 'Weekly GLP-1 agonist with B6. Typical titration starts at 0.25 mg weekly.',
    vialMg: 5,
    waterMl: 3,
    dose: 0.25,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 12,
    syringeMl: 0.3,
  },
  {
    id: 'glp1-r3ta',
    category: 'glp1',
    label: 'R3TA',
    compound: 'Retatrutide',
    summary: 'Investigational triple-agonist. Conservative titration from 1 mg weekly; provider supervision required.',
    vialMg: 20,
    waterMl: 3,
    dose: 1,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 12,
    syringeMl: 0.3,
  },

  // ── Longevity ─────────────────────────────────────────────────────
  {
    id: 'longevity-nad',
    category: 'longevity',
    label: 'NAD+',
    compound: 'Nicotinamide Adenine Dinucleotide',
    summary: 'Cellular energy and mitochondrial support. Typical 50 mg subcutaneous daily.',
    vialMg: 200,
    waterMl: 5,
    dose: 50,
    doseUnit: 'mg',
    frequency: 'daily',
    therapyLengthWeeks: 8,
    syringeMl: 1.0,
  },

  // ── Growth ────────────────────────────────────────────────────────
  {
    id: 'growth-sermorelin',
    category: 'growth',
    label: 'Sermorelin',
    compound: 'Sermorelin Acetate',
    summary: 'Growth hormone secretagogue. Typical 250 mcg nightly before bed.',
    vialMg: 5,
    waterMl: 2,
    dose: 250,
    doseUnit: 'mcg',
    frequency: 'daily',
    therapyLengthWeeks: 12,
    syringeMl: 0.3,
  },

  // ── Repair ────────────────────────────────────────────────────────
  {
    id: 'repair-bpc157',
    category: 'repair',
    label: 'BPC-157',
    compound: 'Body Protection Compound 157',
    summary: 'Tissue repair and gut health. Typical 250 mcg once or twice daily.',
    vialMg: 5,
    waterMl: 3,
    dose: 250,
    doseUnit: 'mcg',
    frequency: 'daily',
    therapyLengthWeeks: 8,
    syringeMl: 0.3,
  },
  {
    id: 'repair-tb500',
    category: 'repair',
    label: 'TB-500',
    compound: 'Thymosin Beta-4 Fragment',
    summary: 'Soft-tissue and connective-tissue recovery. Typical 2.5 mg twice weekly.',
    vialMg: 10,
    waterMl: 3,
    dose: 2.5,
    doseUnit: 'mg',
    frequency: 'twice-weekly',
    therapyLengthWeeks: 6,
    syringeMl: 1.0,
  },
  {
    id: 'repair-ghkcu',
    category: 'repair',
    label: 'GHK-Cu',
    compound: 'GHK-Copper',
    summary: 'Skin and tissue remodeling peptide. Typical 1 mg daily.',
    vialMg: 50,
    waterMl: 5,
    dose: 1,
    doseUnit: 'mg',
    frequency: 'daily',
    therapyLengthWeeks: 8,
    syringeMl: 0.3,
  },
  {
    id: 'repair-glutathione',
    category: 'repair',
    label: 'Glutathione',
    compound: 'Glutathione',
    summary: 'Master antioxidant. Typical 50 mg weekly subcutaneous.',
    vialMg: 600,
    waterMl: 3,
    dose: 50,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 12,
    syringeMl: 0.5,
  },

  // ── Blends ────────────────────────────────────────────────────────
  {
    id: 'blend-tesa-ipa',
    category: 'blends',
    label: 'TESA / IPA',
    compound: 'Tesamorelin / Ipamorelin',
    summary: 'GHRH + GH secretagogue blend. Typical 300 mcg nightly.',
    vialMg: 7,
    waterMl: 3,
    dose: 300,
    doseUnit: 'mcg',
    frequency: 'daily',
    therapyLengthWeeks: 12,
    syringeMl: 0.3,
  },
  {
    id: 'blend-cjc-ipa',
    category: 'blends',
    label: 'CJC / IPA',
    compound: 'CJC-1295 / Ipamorelin',
    summary: 'GHRH + GH secretagogue blend (CJC-1295 no DAC). Typical 250 mcg nightly.',
    vialMg: 5,
    waterMl: 3,
    dose: 250,
    doseUnit: 'mcg',
    frequency: 'daily',
    therapyLengthWeeks: 12,
    syringeMl: 0.3,
  },

  // ── Sexual Wellness ───────────────────────────────────────────────
  {
    id: 'sexual-pt141',
    category: 'sexual-wellness',
    label: 'PT-141',
    compound: 'Bremelanotide',
    summary: 'On-demand sexual wellness peptide. Typical 1 mg 45–60 minutes before activity.',
    vialMg: 10,
    waterMl: 2,
    dose: 1,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 4,
    syringeMl: 0.3,
  },
  {
    id: 'sexual-oxytocin',
    category: 'sexual-wellness',
    label: 'Oxytocin',
    compound: 'Oxytocin',
    summary: 'Bonding and intimacy peptide. Typical 20 IU as needed.',
    vialMg: 10,
    waterMl: 5,
    dose: 0.04,
    doseUnit: 'mg',
    frequency: 'weekly',
    therapyLengthWeeks: 4,
    syringeMl: 0.3,
  },
]

export function getPresetById(id: string | null | undefined): TherapyPreset | null {
  if (!id) return null
  return THERAPY_PRESETS.find((p) => p.id === id) ?? null
}

export function getPresetsByCategory(category: TherapyCategory): TherapyPreset[] {
  return THERAPY_PRESETS.filter((p) => p.category === category)
}

export function getCategoryById(id: TherapyCategory | null | undefined): TherapyCategoryDef | null {
  if (!id) return null
  return THERAPY_CATEGORIES.find((c) => c.id === id) ?? null
}
