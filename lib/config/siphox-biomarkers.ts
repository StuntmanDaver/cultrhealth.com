// SiPhox Health Biomarker Mapping Configuration
// Maps SiPhox API biomarker names to display names, categories, units, and descriptions
// Source: siphox-biomarkers.csv (50 entries)

// ============================================================
// TYPES
// ============================================================

export type BiomarkerCategory =
  | 'metabolic'
  | 'nutritional'
  | 'heart'
  | 'hormonal'
  | 'inflammation'
  | 'thyroid'
  | 'extended'

export interface SiphoxBiomarkerMapping {
  siphoxName: string        // Name from SiPhox API response
  displayName: string       // Human-readable name for UI
  abbreviation?: string     // Short form (e.g., "ApoB")
  category: BiomarkerCategory
  unit: string              // e.g., "mg/dL", "ng/mL"
  description: string       // From CSV "What It Measures" column
}

// ============================================================
// BIOMARKER MAPPINGS
// ============================================================

export const SIPHOX_BIOMARKER_MAPPINGS: SiphoxBiomarkerMapping[] = [
  // ----------------------------------------------------------
  // HEART (Cardiovascular)
  // ----------------------------------------------------------
  {
    siphoxName: 'ApoA1',
    displayName: 'Apolipoprotein A1',
    abbreviation: 'ApoA1',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Protein carrier for HDL cholesterol; most informative biomarker for good cholesterol and cardiovascular disease risk.',
  },
  {
    siphoxName: 'ApoB',
    displayName: 'Apolipoprotein B',
    abbreviation: 'ApoB',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Measures additional types of bad cholesterol beyond LDL-C alone. Better predictor of cardiovascular risk.',
  },
  {
    siphoxName: 'ApoB:ApoA1 Ratio',
    displayName: 'ApoB to ApoA1 Ratio',
    category: 'heart',
    unit: 'ratio',
    description: 'Ratio of ApoB to ApoA1 in blood to assess cardiovascular disease risk. Lower ratios indicate lower disease risk.',
  },
  {
    siphoxName: 'HDL-C',
    displayName: 'HDL Cholesterol',
    abbreviation: 'HDL',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Cardiovascular health risk and cholesterol metabolism. Higher levels are protective.',
  },
  {
    siphoxName: 'LDL-C',
    displayName: 'LDL Cholesterol',
    abbreviation: 'LDL',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Concentration of low-density lipoprotein cholesterol in blood; key marker of cardiovascular risk assessment.',
  },
  {
    siphoxName: 'LDL:ApoB Ratio',
    displayName: 'LDL to ApoB Ratio',
    abbreviation: 'LDL:ApoB',
    category: 'heart',
    unit: 'ratio',
    description: 'LDL particle size and density distribution indicating whether cholesterol is across many small particles or fewer large ones.',
  },
  {
    siphoxName: 'Total Cholesterol',
    displayName: 'Total Cholesterol',
    abbreviation: 'TC',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Total amount of cholesterol in the bloodstream, processed in the liver.',
  },
  {
    siphoxName: 'Total Cholesterol:HDL Ratio',
    displayName: 'Total Cholesterol to HDL Ratio',
    abbreviation: 'TC:HDL',
    category: 'heart',
    unit: 'ratio',
    description: 'Ratio calculated by dividing total cholesterol by HDL-C level. Lower ratios indicate better cardiovascular health.',
  },
  {
    siphoxName: 'Triglycerides',
    displayName: 'Triglycerides',
    abbreviation: 'TG',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Levels of triglycerides in the bloodstream.',
  },
  {
    siphoxName: 'Lipoprotein(a)',
    displayName: 'Lipoprotein(a)',
    abbreviation: 'Lp(a)',
    category: 'heart',
    unit: 'mg/dL',
    description: 'Cholesterol transport particles in blood. Genetically determined cardiovascular risk factor.',
  },
  {
    siphoxName: 'Homocysteine',
    displayName: 'Homocysteine',
    category: 'heart',
    unit: 'umol/L',
    description: 'Homocysteine levels in blood plasma during fasting state. Elevated levels indicate cardiovascular and neurological risk.',
  },

  // ----------------------------------------------------------
  // METABOLIC
  // ----------------------------------------------------------
  {
    siphoxName: 'HbA1c',
    displayName: 'Hemoglobin A1C',
    abbreviation: 'A1C',
    category: 'metabolic',
    unit: '%',
    description: 'Percentage of hemoglobin proteins with sugar coating; provides long-term snapshot of blood glucose control over 2-3 months.',
  },
  {
    siphoxName: 'Fasting Glucose',
    displayName: 'Fasting Glucose',
    category: 'metabolic',
    unit: 'mg/dL',
    description: 'The body\'s capability to maintain glucose regulation during fasting and metabolic health status.',
  },
  {
    siphoxName: 'Fasting Insulin',
    displayName: 'Fasting Insulin',
    category: 'metabolic',
    unit: 'uIU/mL',
    description: 'The amount of insulin the body produces while fasted; indicator of the body\'s reaction to diet and lifestyle.',
  },
  {
    siphoxName: 'HOMA-IR',
    displayName: 'HOMA-IR',
    category: 'metabolic',
    unit: 'index',
    description: 'Insulin resistance level calculated from fasting glucose and insulin.',
  },
  {
    siphoxName: 'Albumin',
    displayName: 'Albumin',
    category: 'metabolic',
    unit: 'g/dL',
    description: 'Protein levels in blood, liver function, kidney function, nutritional status, and hormone transport capability.',
  },
  {
    siphoxName: 'Cortisol',
    displayName: 'Cortisol',
    category: 'metabolic',
    unit: 'ug/dL',
    description: 'Cortisol levels in blood serum. Stress hormone that affects metabolism, immune function, and energy regulation.',
  },
  {
    siphoxName: 'ALT',
    displayName: 'Alanine Aminotransferase',
    abbreviation: 'ALT',
    category: 'metabolic',
    unit: 'U/L',
    description: 'Liver health and hepatic cell integrity. When liver cells sustain damage, ALT releases into the bloodstream.',
  },
  {
    siphoxName: 'AST',
    displayName: 'Aspartate Aminotransferase',
    abbreviation: 'AST',
    category: 'metabolic',
    unit: 'U/L',
    description: 'Tissue damage across various organs, particularly liver and heart. Evaluated alongside ALT for comprehensive liver assessment.',
  },
  {
    siphoxName: 'Bilirubin',
    displayName: 'Bilirubin',
    category: 'metabolic',
    unit: 'mg/dL',
    description: 'Total bilirubin levels including conjugated and unconjugated forms; indicator of liver function and red blood cell breakdown.',
  },
  {
    siphoxName: 'Creatinine',
    displayName: 'Creatinine',
    category: 'metabolic',
    unit: 'mg/dL',
    description: 'Kidney function and renal health. Blood levels indicate whether kidneys are functioning properly.',
  },
  {
    siphoxName: 'eGFR',
    displayName: 'Estimated Glomerular Filtration Rate',
    abbreviation: 'eGFR',
    category: 'metabolic',
    unit: 'mL/min/1.73m2',
    description: 'How efficiently kidneys filter waste from blood.',
  },
  {
    siphoxName: 'BUN',
    displayName: 'Blood Urea Nitrogen',
    abbreviation: 'BUN',
    category: 'metabolic',
    unit: 'mg/dL',
    description: 'Urea accumulation in blood as an indicator of kidney filtration function.',
  },
  {
    siphoxName: 'Iron Saturation',
    displayName: 'Iron Saturation',
    category: 'metabolic',
    unit: '%',
    description: 'Percentage of transferrin bound to iron, indicating iron distribution efficiency and availability.',
  },

  // ----------------------------------------------------------
  // HORMONAL
  // ----------------------------------------------------------
  {
    siphoxName: 'Testosterone',
    displayName: 'Testosterone (Total)',
    category: 'hormonal',
    unit: 'ng/mL',
    description: 'Total testosterone levels (free + bound). Key marker for anabolic status, energy, and reproductive health.',
  },
  {
    siphoxName: 'Free Testosterone',
    displayName: 'Free Testosterone',
    category: 'hormonal',
    unit: 'pg/mL',
    description: 'Unbound, bioactive testosterone available for tissue use. More clinically relevant than total testosterone.',
  },
  {
    siphoxName: 'Estradiol',
    displayName: 'Estradiol',
    abbreviation: 'E2',
    category: 'hormonal',
    unit: 'pg/mL',
    description: 'Reproductive health status and overall hormonal balance.',
  },
  {
    siphoxName: 'FSH',
    displayName: 'Follicle-Stimulating Hormone',
    abbreviation: 'FSH',
    category: 'hormonal',
    unit: 'mIU/mL',
    description: 'FSH levels indicating reproductive and sexual development status.',
  },
  {
    siphoxName: 'LH',
    displayName: 'Luteinizing Hormone',
    abbreviation: 'LH',
    category: 'hormonal',
    unit: 'mIU/mL',
    description: 'Triggers egg release in females. Stimulates Leydig cells for testosterone production in males.',
  },
  {
    siphoxName: 'SHBG',
    displayName: 'Sex Hormone-Binding Globulin',
    abbreviation: 'SHBG',
    category: 'hormonal',
    unit: 'nmol/L',
    description: 'Hormone bioavailability. Affects how much free testosterone and estradiol are available for tissue use.',
  },
  {
    siphoxName: 'DHEA-S',
    displayName: 'DHEA-Sulfate',
    abbreviation: 'DHEA-S',
    category: 'hormonal',
    unit: 'ug/dL',
    description: 'Adrenal gland function and precursor to sex hormones. Marker of adrenal reserve and aging.',
  },
  {
    siphoxName: 'Testosterone:Cortisol Ratio',
    displayName: 'Testosterone to Cortisol Ratio',
    abbreviation: 'T:C',
    category: 'hormonal',
    unit: 'ratio',
    description: 'Comparative balance between testosterone (anabolic) and cortisol (catabolic) to assess recovery and overtraining risk.',
  },
  {
    siphoxName: 'Cortisol:DHEA-S Ratio',
    displayName: 'Cortisol to DHEA-S Ratio',
    category: 'hormonal',
    unit: 'ratio',
    description: 'Balance between cortisol and DHEA-S indicating adrenal function and stress resilience.',
  },
  {
    siphoxName: 'Progesterone',
    displayName: 'Progesterone',
    category: 'hormonal',
    unit: 'ng/mL',
    description: 'Progesterone levels monitoring reproductive hormone status and overall hormonal balance.',
  },
  {
    siphoxName: 'Prolactin',
    displayName: 'Prolactin',
    abbreviation: 'PRL',
    category: 'hormonal',
    unit: 'ng/mL',
    description: 'Pituitary gland function and reproductive hormone balance.',
  },
  {
    siphoxName: 'AMH',
    displayName: 'Anti-Mullerian Hormone',
    abbreviation: 'AMH',
    category: 'hormonal',
    unit: 'ng/mL',
    description: 'Ovarian reserve (egg supply in females), reproductive function, sperm and hormonal production in males.',
  },
  {
    siphoxName: 'PSA',
    displayName: 'Prostate-Specific Antigen',
    abbreviation: 'PSA',
    category: 'hormonal',
    unit: 'ng/mL',
    description: 'Prostate health and potential disease screening. Monitors cancer treatment response and disease progression.',
  },
  {
    siphoxName: 'LH:FSH Ratio',
    displayName: 'LH to FSH Ratio',
    category: 'hormonal',
    unit: 'ratio',
    description: 'Ratio of luteinizing hormone to follicle-stimulating hormone indicating reproductive hormone balance.',
  },

  // ----------------------------------------------------------
  // NUTRITIONAL
  // ----------------------------------------------------------
  {
    siphoxName: 'Vitamin D',
    displayName: '25-(OH) Vitamin D',
    category: 'nutritional',
    unit: 'ng/mL',
    description: 'Vitamin D serum concentration (25-hydroxyvitamin D). Indicates adequacy for bone health, immune function, and mood.',
  },
  {
    siphoxName: 'Ferritin',
    displayName: 'Ferritin',
    category: 'nutritional',
    unit: 'ng/mL',
    description: 'Iron storage levels in the body. Key indicator of iron deficiency or overload.',
  },
  {
    siphoxName: 'Vitamin B12',
    displayName: 'Vitamin B12 (Cobalamin)',
    abbreviation: 'B12',
    category: 'nutritional',
    unit: 'pg/mL',
    description: 'Vitamin B12 serum levels indicating adequacy for blood cell production, nerve function, and DNA synthesis.',
  },
  {
    siphoxName: 'Folate',
    displayName: 'Folate (Vitamin B9)',
    abbreviation: 'B9',
    category: 'nutritional',
    unit: 'ng/mL',
    description: 'Folate levels in blood serum, indicating adequacy for cellular and developmental health.',
  },

  // ----------------------------------------------------------
  // INFLAMMATION
  // ----------------------------------------------------------
  {
    siphoxName: 'hsCRP',
    displayName: 'High-Sensitivity C-Reactive Protein',
    abbreviation: 'hs-CRP',
    category: 'inflammation',
    unit: 'mg/L',
    description: 'General inflammation levels; marker for heart disease and stroke risk. Lower values indicate better health.',
  },

  // ----------------------------------------------------------
  // THYROID
  // ----------------------------------------------------------
  {
    siphoxName: 'TSH',
    displayName: 'Thyroid Stimulating Hormone',
    abbreviation: 'TSH',
    category: 'thyroid',
    unit: 'uIU/mL',
    description: 'Health of the thyroid gland and endocrine function. Thyroid regulates metabolism, growth, and development.',
  },
  {
    siphoxName: 'Free T3',
    displayName: 'Free T3 (Triiodothyronine)',
    abbreviation: 'fT3',
    category: 'thyroid',
    unit: 'pg/mL',
    description: 'Active thyroid hormone levels. Regulates metabolism, heart and digestive functions, muscle control, and brain development.',
  },
  {
    siphoxName: 'Free T4',
    displayName: 'Free T4 (Thyroxine)',
    abbreviation: 'fT4',
    category: 'thyroid',
    unit: 'ng/dL',
    description: 'Thyroid gland health and function. Indicates adequacy of thyroid hormone production.',
  },
  {
    siphoxName: 'TPOAb',
    displayName: 'Thyroid Peroxidase Antibody',
    abbreviation: 'TPOAb',
    category: 'thyroid',
    unit: 'IU/mL',
    description: 'Antibodies against thyroid peroxidase enzyme revealing whether the immune system is attacking thyroid tissue.',
  },

  // ----------------------------------------------------------
  // EXTENDED (Epigenetics, Heavy Metals, Minerals)
  // ----------------------------------------------------------
  {
    siphoxName: 'DNA Methylation',
    displayName: 'DNA Methylation (Biological Age)',
    category: 'extended',
    unit: 'years',
    description: 'Biological age through analysis of methylation patterns at specific DNA sites using the epigenetic clock.',
  },
  {
    siphoxName: 'Cadmium',
    displayName: 'Cadmium',
    category: 'extended',
    unit: 'ug/L',
    description: 'Blood cadmium levels to assess exposure and accumulation of this toxic heavy metal.',
  },
  {
    siphoxName: 'Copper',
    displayName: 'Copper',
    category: 'extended',
    unit: 'mg/L',
    description: 'Blood serum levels of copper, an essential trace mineral.',
  },
  {
    siphoxName: 'Magnesium',
    displayName: 'Magnesium',
    category: 'extended',
    unit: 'ug/L',
    description: 'Blood magnesium levels indicating concentration of this critical mineral in circulation.',
  },
  {
    siphoxName: 'Mercury',
    displayName: 'Mercury',
    category: 'extended',
    unit: 'ug/L',
    description: 'Mercury levels in the body to assess exposure risk from environmental and dietary sources.',
  },
  {
    siphoxName: 'Selenium',
    displayName: 'Selenium',
    category: 'extended',
    unit: 'ug/L',
    description: 'Serum selenium levels. Essential for thyroid function, antioxidant defense, and immune health.',
  },
  {
    siphoxName: 'Zinc',
    displayName: 'Zinc',
    category: 'extended',
    unit: 'mg/L',
    description: 'Blood zinc levels for metabolic processes including protein synthesis, DNA synthesis, and cell division.',
  },
]

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Look up a biomarker mapping by SiPhox API name (case-insensitive)
 */
export function getBiomarkerByName(siphoxName: string): SiphoxBiomarkerMapping | undefined {
  const lowerName = siphoxName.toLowerCase()
  return SIPHOX_BIOMARKER_MAPPINGS.find(
    m => m.siphoxName.toLowerCase() === lowerName
  )
}

/**
 * Get all biomarker mappings for a given category
 */
export function getBiomarkersByCategory(category: BiomarkerCategory): SiphoxBiomarkerMapping[] {
  return SIPHOX_BIOMARKER_MAPPINGS.filter(m => m.category === category)
}
