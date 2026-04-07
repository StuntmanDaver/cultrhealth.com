// SiPhox Biomarker Catalog
// Maps SiPhox API biomarker names → display metadata, category, unit
// Categories align with CULTR Health dashboard: 7 body-system groups
// Reference ranges come from the SiPhox API response, not hardcoded here
// HIPAA: This file contains no PHI — only static config data

// ============================================================
// CATEGORIES
// ============================================================

export type BiomarkerCategory =
  | 'heart'
  | 'metabolic'
  | 'hormonal'
  | 'inflammation'
  | 'thyroid'
  | 'nutritional'
  | 'extended'

export const BIOMARKER_CATEGORIES: Record<BiomarkerCategory, {
  label: string
  description: string
  sortOrder: number
}> = {
  heart: {
    label: 'Heart & Cardiovascular',
    description: 'Lipids, cholesterol ratios, and cardiovascular risk markers',
    sortOrder: 1,
  },
  metabolic: {
    label: 'Metabolic Health',
    description: 'Blood sugar, insulin, liver, and kidney function',
    sortOrder: 2,
  },
  hormonal: {
    label: 'Hormonal Balance',
    description: 'Sex hormones, stress hormones, and reproductive health',
    sortOrder: 3,
  },
  inflammation: {
    label: 'Inflammation',
    description: 'Systemic inflammation and immune activity markers',
    sortOrder: 4,
  },
  thyroid: {
    label: 'Thyroid Function',
    description: 'Thyroid hormones and antibodies',
    sortOrder: 5,
  },
  nutritional: {
    label: 'Nutritional Status',
    description: 'Vitamins, minerals, and essential nutrients',
    sortOrder: 6,
  },
  extended: {
    label: 'Extended Panel',
    description: 'Epigenetics, heavy metals, and specialized markers',
    sortOrder: 7,
  },
}

// ============================================================
// BIOMARKER DEFINITIONS
// ============================================================

export interface BiomarkerDefinition {
  /** SiPhox API biomarker name (primary key for matching) */
  siphoxName: string
  /** Short display name for UI */
  displayName: string
  /** Abbreviated name for compact views */
  abbreviation: string
  /** Body system category */
  category: BiomarkerCategory
  /** Expected unit from SiPhox API */
  unit: string
  /** Whether lower values are better (e.g., hs-CRP, LDL) */
  lowerIsBetter: boolean
  /** One-line patient-facing description */
  description: string
  /** Sort order within category (lower = first) */
  sortOrder: number
}

/**
 * Complete catalog of 50 SiPhox biomarkers mapped to 7 categories.
 * Sourced from siphox-biomarkers.csv + SiPhox Health documentation.
 *
 * Matching strategy: The `siphoxName` field is matched against the
 * `biomarker` string in SiPhox API report responses. Matching is
 * case-insensitive with whitespace normalization (see `findBiomarker`).
 */
export const SIPHOX_BIOMARKER_CATALOG: BiomarkerDefinition[] = [
  // ─────────────────────────────────────────────────────────────────
  // HEART & CARDIOVASCULAR (10 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'Apolipoprotein A1 (ApoA1)',
    displayName: 'Apolipoprotein A1',
    abbreviation: 'ApoA1',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: false,
    description: 'Protein carrier for HDL ("good") cholesterol; higher values mean lower cardiovascular risk',
    sortOrder: 1,
  },
  {
    siphoxName: 'Apolipoprotein B (ApoB)',
    displayName: 'Apolipoprotein B',
    abbreviation: 'ApoB',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Protein on LDL particles; strongest predictor of heart disease risk',
    sortOrder: 2,
  },
  {
    siphoxName: 'HDL-C',
    displayName: 'HDL Cholesterol',
    abbreviation: 'HDL-C',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: false,
    description: '"Good" cholesterol that removes plaque from arteries',
    sortOrder: 3,
  },
  {
    siphoxName: 'LDL-C',
    displayName: 'LDL Cholesterol',
    abbreviation: 'LDL-C',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: '"Bad" cholesterol that can build up in artery walls',
    sortOrder: 4,
  },
  {
    siphoxName: 'Total Cholesterol',
    displayName: 'Total Cholesterol',
    abbreviation: 'TC',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Combined measure of all cholesterol in your blood',
    sortOrder: 5,
  },
  {
    siphoxName: 'Triglycerides',
    displayName: 'Triglycerides',
    abbreviation: 'TG',
    category: 'heart',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Fat in your blood; elevated levels increase heart disease risk',
    sortOrder: 6,
  },
  {
    siphoxName: 'Total Cholesterol:HDL Ratio',
    displayName: 'Total Cholesterol / HDL Ratio',
    abbreviation: 'TC:HDL',
    category: 'heart',
    unit: 'ratio',
    lowerIsBetter: true,
    description: 'Cardiovascular risk ratio; lower means more protective HDL relative to total',
    sortOrder: 7,
  },
  {
    siphoxName: 'Lipoprotein(a) — Lp(a)',
    displayName: 'Lipoprotein(a)',
    abbreviation: 'Lp(a)',
    category: 'heart',
    unit: 'nmol/L',
    lowerIsBetter: true,
    description: 'Genetic cardiovascular risk factor; largely determined by genetics',
    sortOrder: 8,
  },
  {
    siphoxName: 'ApoB:ApoA1 Ratio',
    displayName: 'ApoB / ApoA1 Ratio',
    abbreviation: 'ApoB:A1',
    category: 'heart',
    unit: 'ratio',
    lowerIsBetter: true,
    description: 'Balance of atherogenic vs protective lipoproteins',
    sortOrder: 9,
  },
  {
    siphoxName: 'LDL:ApoB Ratio',
    displayName: 'LDL / ApoB Ratio',
    abbreviation: 'LDL:ApoB',
    category: 'heart',
    unit: 'ratio',
    lowerIsBetter: false,
    description: 'LDL particle size indicator; higher suggests larger, less dangerous particles',
    sortOrder: 10,
  },

  // ─────────────────────────────────────────────────────────────────
  // METABOLIC HEALTH (11 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'Fasting Glucose',
    displayName: 'Fasting Glucose',
    abbreviation: 'Glucose',
    category: 'metabolic',
    unit: 'mg/dL',
    lowerIsBetter: false,
    description: 'Blood sugar after overnight fast; baseline metabolic health indicator',
    sortOrder: 1,
  },
  {
    siphoxName: 'Fasting Insulin',
    displayName: 'Fasting Insulin',
    abbreviation: 'Insulin',
    category: 'metabolic',
    unit: 'μIU/mL',
    lowerIsBetter: true,
    description: 'Insulin sensitivity marker; elevated levels signal insulin resistance',
    sortOrder: 2,
  },
  {
    siphoxName: 'Hemoglobin A1C (HbA1c)',
    displayName: 'Hemoglobin A1c',
    abbreviation: 'HbA1c',
    category: 'metabolic',
    unit: '%',
    lowerIsBetter: true,
    description: '3-month average blood sugar; key indicator of diabetes risk',
    sortOrder: 3,
  },
  {
    siphoxName: 'HOMA-IR',
    displayName: 'HOMA-IR',
    abbreviation: 'HOMA-IR',
    category: 'metabolic',
    unit: 'index',
    lowerIsBetter: true,
    description: 'Insulin resistance index calculated from glucose and insulin',
    sortOrder: 4,
  },
  {
    siphoxName: 'Alanine Aminotransferase (ALT)',
    displayName: 'ALT (Liver)',
    abbreviation: 'ALT',
    category: 'metabolic',
    unit: 'U/L',
    lowerIsBetter: true,
    description: 'Liver enzyme; elevated levels may indicate liver stress or damage',
    sortOrder: 5,
  },
  {
    siphoxName: 'Aspartate Aminotransferase (AST)',
    displayName: 'AST (Liver)',
    abbreviation: 'AST',
    category: 'metabolic',
    unit: 'U/L',
    lowerIsBetter: true,
    description: 'Liver enzyme also found in heart and muscles; part of liver function panel',
    sortOrder: 6,
  },
  {
    siphoxName: 'Albumin',
    displayName: 'Albumin',
    abbreviation: 'Alb',
    category: 'metabolic',
    unit: 'g/dL',
    lowerIsBetter: false,
    description: 'Main blood protein; reflects liver function and nutritional status',
    sortOrder: 7,
  },
  {
    siphoxName: 'Bilirubin',
    displayName: 'Bilirubin',
    abbreviation: 'Bili',
    category: 'metabolic',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Byproduct of red blood cell breakdown; elevated may indicate liver issues',
    sortOrder: 8,
  },
  {
    siphoxName: 'Creatinine',
    displayName: 'Creatinine',
    abbreviation: 'Cr',
    category: 'metabolic',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Waste product filtered by kidneys; used to assess kidney function',
    sortOrder: 9,
  },
  {
    siphoxName: 'eGFR (Estimated Glomerular Filtration Rate)',
    displayName: 'eGFR (Kidney)',
    abbreviation: 'eGFR',
    category: 'metabolic',
    unit: 'mL/min/1.73m²',
    lowerIsBetter: false,
    description: 'Estimated kidney filtration rate; higher values mean healthier kidneys',
    sortOrder: 10,
  },
  {
    siphoxName: 'Blood Urea Nitrogen (BUN)',
    displayName: 'BUN (Kidney)',
    abbreviation: 'BUN',
    category: 'metabolic',
    unit: 'mg/dL',
    lowerIsBetter: true,
    description: 'Nitrogen waste in blood; reflects kidney function and protein metabolism',
    sortOrder: 11,
  },

  // ─────────────────────────────────────────────────────────────────
  // HORMONAL BALANCE (10 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'Testosterone',
    displayName: 'Testosterone',
    abbreviation: 'T',
    category: 'hormonal',
    unit: 'ng/dL',
    lowerIsBetter: false,
    description: 'Primary androgen; affects muscle, energy, mood, and sexual function',
    sortOrder: 1,
  },
  {
    siphoxName: 'Estradiol (E2)',
    displayName: 'Estradiol',
    abbreviation: 'E2',
    category: 'hormonal',
    unit: 'pg/mL',
    lowerIsBetter: false,
    description: 'Primary estrogen; important for bone health, mood, and reproductive function',
    sortOrder: 2,
  },
  {
    siphoxName: 'Cortisol',
    displayName: 'Cortisol',
    abbreviation: 'Cort',
    category: 'hormonal',
    unit: 'μg/dL',
    lowerIsBetter: false,
    description: 'Stress hormone; chronically elevated levels accelerate aging',
    sortOrder: 3,
  },
  {
    siphoxName: 'Testosterone:Cortisol Ratio',
    displayName: 'Testosterone / Cortisol Ratio',
    abbreviation: 'T:C',
    category: 'hormonal',
    unit: 'ratio',
    lowerIsBetter: false,
    description: 'Anabolic vs catabolic balance; higher values indicate better recovery capacity',
    sortOrder: 4,
  },
  {
    siphoxName: 'Follicle-Stimulating Hormone (FSH)',
    displayName: 'FSH',
    abbreviation: 'FSH',
    category: 'hormonal',
    unit: 'mIU/mL',
    lowerIsBetter: false,
    description: 'Pituitary hormone regulating reproductive function',
    sortOrder: 5,
  },
  {
    siphoxName: 'Luteinizing Hormone (LH)',
    displayName: 'LH',
    abbreviation: 'LH',
    category: 'hormonal',
    unit: 'mIU/mL',
    lowerIsBetter: false,
    description: 'Pituitary hormone that triggers hormone production in gonads',
    sortOrder: 6,
  },
  {
    siphoxName: 'Prolactin (PRL)',
    displayName: 'Prolactin',
    abbreviation: 'PRL',
    category: 'hormonal',
    unit: 'ng/mL',
    lowerIsBetter: true,
    description: 'Pituitary hormone; elevated levels may suppress testosterone',
    sortOrder: 7,
  },
  {
    siphoxName: 'Progesterone',
    displayName: 'Progesterone',
    abbreviation: 'P4',
    category: 'hormonal',
    unit: 'ng/mL',
    lowerIsBetter: false,
    description: 'Hormone important for reproductive health and cycle regulation',
    sortOrder: 8,
  },
  {
    siphoxName: 'Anti-Mullerian Hormone (AMH)',
    displayName: 'AMH',
    abbreviation: 'AMH',
    category: 'hormonal',
    unit: 'ng/mL',
    lowerIsBetter: false,
    description: 'Ovarian reserve marker; indicates remaining egg supply',
    sortOrder: 9,
  },
  {
    siphoxName: 'Sex Hormone-Binding Globulin (SHBG)',
    displayName: 'SHBG',
    abbreviation: 'SHBG',
    category: 'hormonal',
    unit: 'nmol/L',
    lowerIsBetter: false,
    description: 'Protein binding sex hormones; affects bioavailable testosterone and estrogen',
    sortOrder: 10,
  },

  // ─────────────────────────────────────────────────────────────────
  // INFLAMMATION (3 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'High-Sensitivity C-Reactive Protein (hs-CRP)',
    displayName: 'hs-CRP',
    abbreviation: 'hs-CRP',
    category: 'inflammation',
    unit: 'mg/L',
    lowerIsBetter: true,
    description: 'Primary systemic inflammation marker; elevated levels increase disease risk',
    sortOrder: 1,
  },
  {
    siphoxName: 'Homocysteine',
    displayName: 'Homocysteine',
    abbreviation: 'Hcy',
    category: 'inflammation',
    unit: 'μmol/L',
    lowerIsBetter: true,
    description: 'Methylation and cardiovascular risk marker; reflects B-vitamin status',
    sortOrder: 2,
  },
  {
    siphoxName: 'Ferritin',
    displayName: 'Ferritin',
    abbreviation: 'Ferr',
    category: 'inflammation',
    unit: 'ng/mL',
    lowerIsBetter: false,
    description: 'Iron storage protein; also an inflammation marker when elevated',
    sortOrder: 3,
  },

  // ─────────────────────────────────────────────────────────────────
  // THYROID FUNCTION (4 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'Thyroid Stimulating Hormone (TSH)',
    displayName: 'TSH',
    abbreviation: 'TSH',
    category: 'thyroid',
    unit: 'mIU/L',
    lowerIsBetter: false,
    description: 'Master thyroid regulator; elevated may indicate underactive thyroid',
    sortOrder: 1,
  },
  {
    siphoxName: 'Free T3 (Triiodothyronine)',
    displayName: 'Free T3',
    abbreviation: 'FT3',
    category: 'thyroid',
    unit: 'pg/mL',
    lowerIsBetter: false,
    description: 'Active thyroid hormone; drives metabolism, energy, and body temperature',
    sortOrder: 2,
  },
  {
    siphoxName: 'Free T4 (Thyroxine)',
    displayName: 'Free T4',
    abbreviation: 'FT4',
    category: 'thyroid',
    unit: 'ng/dL',
    lowerIsBetter: false,
    description: 'Thyroid hormone reservoir; converted to active T3 in tissues',
    sortOrder: 3,
  },
  {
    siphoxName: 'Thyroid Peroxidase Antibody (TPOAb)',
    displayName: 'TPO Antibodies',
    abbreviation: 'TPOAb',
    category: 'thyroid',
    unit: 'IU/mL',
    lowerIsBetter: true,
    description: 'Autoimmune thyroid marker; elevated may indicate Hashimoto\'s thyroiditis',
    sortOrder: 4,
  },

  // ─────────────────────────────────────────────────────────────────
  // NUTRITIONAL STATUS (8 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'Vitamin D',
    displayName: 'Vitamin D',
    abbreviation: 'VitD',
    category: 'nutritional',
    unit: 'ng/mL',
    lowerIsBetter: false,
    description: 'Essential for bones, immunity, and mood; deficiency is extremely common',
    sortOrder: 1,
  },
  {
    siphoxName: 'Vitamin B12 (Cobalamin)',
    displayName: 'Vitamin B12',
    abbreviation: 'B12',
    category: 'nutritional',
    unit: 'pg/mL',
    lowerIsBetter: false,
    description: 'Essential for nerve function, DNA synthesis, and red blood cell formation',
    sortOrder: 2,
  },
  {
    siphoxName: 'Folate (Vitamin B9)',
    displayName: 'Folate',
    abbreviation: 'B9',
    category: 'nutritional',
    unit: 'ng/mL',
    lowerIsBetter: false,
    description: 'Critical for DNA methylation, cell division, and homocysteine metabolism',
    sortOrder: 3,
  },
  {
    siphoxName: 'Iron Saturation',
    displayName: 'Iron Saturation',
    abbreviation: 'FeSat',
    category: 'nutritional',
    unit: '%',
    lowerIsBetter: false,
    description: 'Percentage of iron-binding capacity in use; reflects iron availability',
    sortOrder: 4,
  },
  {
    siphoxName: 'Magnesium',
    displayName: 'Magnesium',
    abbreviation: 'Mg',
    category: 'nutritional',
    unit: 'mg/dL',
    lowerIsBetter: false,
    description: 'Essential mineral for 300+ enzyme reactions, sleep, and muscle function',
    sortOrder: 5,
  },
  {
    siphoxName: 'Zinc',
    displayName: 'Zinc',
    abbreviation: 'Zn',
    category: 'nutritional',
    unit: 'μg/dL',
    lowerIsBetter: false,
    description: 'Essential for immune function, wound healing, and testosterone production',
    sortOrder: 6,
  },
  {
    siphoxName: 'Selenium',
    displayName: 'Selenium',
    abbreviation: 'Se',
    category: 'nutritional',
    unit: 'μg/L',
    lowerIsBetter: false,
    description: 'Antioxidant mineral essential for thyroid function and immune defense',
    sortOrder: 7,
  },
  {
    siphoxName: 'Copper',
    displayName: 'Copper',
    abbreviation: 'Cu',
    category: 'nutritional',
    unit: 'μg/dL',
    lowerIsBetter: false,
    description: 'Trace mineral for iron metabolism and connective tissue; balance with zinc matters',
    sortOrder: 8,
  },

  // ─────────────────────────────────────────────────────────────────
  // EXTENDED PANEL (4 markers)
  // ─────────────────────────────────────────────────────────────────
  {
    siphoxName: 'DNA Methylation',
    displayName: 'DNA Methylation Age',
    abbreviation: 'DNAm',
    category: 'extended',
    unit: 'years',
    lowerIsBetter: true,
    description: 'Epigenetic biological age; compares to chronological age for aging rate',
    sortOrder: 1,
  },
  {
    siphoxName: 'Prostate-Specific Antigen (PSA)',
    displayName: 'PSA',
    abbreviation: 'PSA',
    category: 'extended',
    unit: 'ng/mL',
    lowerIsBetter: true,
    description: 'Prostate health marker (males); elevated may warrant further evaluation',
    sortOrder: 2,
  },
  {
    siphoxName: 'Cadmium',
    displayName: 'Cadmium',
    abbreviation: 'Cd',
    category: 'extended',
    unit: 'μg/L',
    lowerIsBetter: true,
    description: 'Toxic heavy metal; elevated from smoking, occupational exposure, or diet',
    sortOrder: 3,
  },
  {
    siphoxName: 'Mercury',
    displayName: 'Mercury',
    abbreviation: 'Hg',
    category: 'extended',
    unit: 'μg/L',
    lowerIsBetter: true,
    description: 'Toxic heavy metal; elevated from fish consumption or dental amalgam',
    sortOrder: 4,
  },
]

// ============================================================
// LOOKUP UTILITIES
// ============================================================

/** Normalized lookup index — built once on first access */
let _lookupIndex: Map<string, BiomarkerDefinition> | null = null

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

function getLookupIndex(): Map<string, BiomarkerDefinition> {
  if (_lookupIndex) return _lookupIndex
  _lookupIndex = new Map()
  for (const def of SIPHOX_BIOMARKER_CATALOG) {
    _lookupIndex.set(normalizeName(def.siphoxName), def)
  }
  return _lookupIndex
}

/**
 * Find a biomarker definition by its SiPhox API name.
 * Case-insensitive, whitespace-normalized matching.
 * Returns null for unrecognized biomarkers (they'll show as "Extended" in UI).
 */
export function findBiomarker(siphoxName: string): BiomarkerDefinition | null {
  return getLookupIndex().get(normalizeName(siphoxName)) ?? null
}

/**
 * Get all biomarker definitions grouped by category,
 * sorted by category sortOrder then biomarker sortOrder.
 */
export function getBiomarkersByCategory(): Record<BiomarkerCategory, BiomarkerDefinition[]> {
  const grouped: Record<BiomarkerCategory, BiomarkerDefinition[]> = {
    heart: [],
    metabolic: [],
    hormonal: [],
    inflammation: [],
    thyroid: [],
    nutritional: [],
    extended: [],
  }

  for (const def of SIPHOX_BIOMARKER_CATALOG) {
    grouped[def.category].push(def)
  }

  // Sort within each category
  for (const defs of Object.values(grouped)) {
    defs.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  return grouped
}

/**
 * Get ordered list of categories for display.
 */
export function getOrderedCategories(): Array<{ key: BiomarkerCategory; label: string; description: string }> {
  return (Object.entries(BIOMARKER_CATEGORIES) as Array<[BiomarkerCategory, typeof BIOMARKER_CATEGORIES[BiomarkerCategory]]>)
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
    .map(([key, meta]) => ({ key, label: meta.label, description: meta.description }))
}
