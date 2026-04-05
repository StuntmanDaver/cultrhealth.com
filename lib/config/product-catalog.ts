// Product Catalog for Members Shop
// Products from CULTR Health Customer Price Catalog

export type ProductCategory =
  | 'growth_factor'
  | 'repair'
  | 'metabolic'
  | 'bioregulator'
  | 'neuropeptide'
  | 'immune'
  | 'hormonal'
  | 'blend'
  | 'accessory'
  | 'wellness_supplement'
  | 'sexual_wellness'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export type ProductVariant = {
  label: string
  value: string
}

export type ShopProduct = {
  sku: string
  name: string
  peptideId: string | null
  doseMg: number
  volumeMl: number
  category: ProductCategory
  isBlend: boolean
  blendComponents?: string[]
  description?: string
  priceUsd?: number
  imageUrl?: string
  stockStatus: StockStatus
  bulkPrice?: number
  bulkMinQty?: number
  bulkSavePercent?: number
  variants: ProductVariant[]
  defaultVariant: string
  vialType?: '1ML' | '2ML' | '2.5ML' | '3ML' | '4ML' | '5ML' | '10ML' | '30ML'
}

// ===================================================
// Product Catalog — CULTR Health Customer Price Catalog
// ===================================================

export const PRODUCT_CATALOG: ShopProduct[] = [
  // ---------------------------------------------------
  // ACCESSORY
  // ---------------------------------------------------
  {
    sku: 'BACWATER-30ML',
    name: 'Bacteriostatic Water',
    peptideId: 'bacteriostatic-water',
    doseMg: 0,
    volumeMl: 30,
    category: 'accessory',
    isBlend: false,
    description: 'Sterile water with 0.9% benzyl alcohol for safe reconstitution of lyophilized peptides. Essential supply for injectable therapies.',
    priceUsd: 29.99,
    imageUrl: '/images/products/bacteriostatic-water.png',
    stockStatus: 'in_stock',
    variants: [{ label: '30ml', value: '30ml' }],
    defaultVariant: '30ml',
    vialType: '30ML',
  },

  // ---------------------------------------------------
  // GLP-1 / PEPTIDE PRODUCTS
  // ---------------------------------------------------
  {
    sku: 'TRZ-NIA-10MG-1ML',
    name: 'Tirzepatide/Niacinamide (reconstituted)',
    peptideId: 'glp1-tirzepatide',
    doseMg: 10,
    volumeMl: 1,
    category: 'metabolic',
    isBlend: false,
    description: 'Tirzepatide dual GIP/GLP-1 receptor agonist with niacinamide for appetite suppression, blood sugar regulation, and metabolic support.',
    priceUsd: 130.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '10mg/mL - 1mL', value: '10mg-1ml' },
      { label: '20mg/mL - 1mL', value: '20mg-1ml' },
      { label: '20mg/mL - 2mL', value: '20mg-2ml' },
      { label: '20mg/mL - 2.5mL', value: '20mg-2.5ml' },
      { label: '20mg/mL - 3mL', value: '20mg-3ml' },
    ],
    defaultVariant: '10mg-1ml',
    vialType: '1ML',
  },
  {
    sku: 'SMA-PYR-2.5MG-1ML',
    name: 'Semaglutide/Pyridoxine (reconstituted)',
    peptideId: 'glp1-semaglutide',
    doseMg: 2.5,
    volumeMl: 1,
    category: 'metabolic',
    isBlend: false,
    description: 'Semaglutide GLP-1 receptor agonist with pyridoxine (B6) for appetite suppression, blood sugar regulation, and sustainable weight loss.',
    priceUsd: 104.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '2.5mg/mL - 1mL', value: '2.5mg-1ml' },
      { label: '2.5mg/mL - 2mL', value: '2.5mg-2ml' },
      { label: '2.5mg/mL - 4mL', value: '2.5mg-4ml' },
      { label: '2.5mg/mL - 5mL', value: '2.5mg-5ml' },
      { label: '5mg/mL - 2mL', value: '5mg-2ml' },
      { label: '5mg/mL - 4mL', value: '5mg-4ml' },
      { label: '5mg/mL - 5mL', value: '5mg-5ml' },
    ],
    defaultVariant: '2.5mg-1ml',
    vialType: '1ML',
  },
  {
    sku: 'NAD-200MG-5ML',
    name: 'NAD+ (reconstituted)',
    peptideId: 'nad-plus',
    doseMg: 200,
    volumeMl: 5,
    category: 'bioregulator',
    isBlend: false,
    description: 'Essential coenzyme that supports cellular energy production, DNA repair, and healthy aging at the mitochondrial level.',
    priceUsd: 88.40,
    stockStatus: 'in_stock',
    variants: [{ label: '200mg/mL - 5mL', value: '200mg-5ml' }],
    defaultVariant: '200mg-5ml',
    vialType: '5ML',
  },
  {
    sku: 'SERMORELIN-3MG-5ML',
    name: 'Sermorelin (reconstituted)',
    peptideId: 'sermorelin',
    doseMg: 3,
    volumeMl: 5,
    category: 'growth_factor',
    isBlend: false,
    description: 'Growth hormone-releasing hormone analog that stimulates natural GH production for improved recovery, sleep, and body composition.',
    priceUsd: 104.00,
    stockStatus: 'in_stock',
    variants: [{ label: '3mg/mL - 5mL', value: '3mg-5ml' }],
    defaultVariant: '3mg-5ml',
    vialType: '5ML',
  },

  // ---------------------------------------------------
  // VITAMINS, METABOLIC, INJECTABLES, AND WELLNESS COMPOUNDS
  // ---------------------------------------------------
  {
    sku: '7KETO-DHEA-50MG',
    name: '7-Keto DHEA',
    peptideId: null,
    doseMg: 50,
    volumeMl: 0,
    category: 'metabolic',
    isBlend: false,
    description: 'DHEA metabolite that supports thermogenesis and metabolic rate without converting to active sex hormones.',
    priceUsd: 1.30,
    stockStatus: 'in_stock',
    variants: [{ label: '50mg capsule', value: '50mg-capsule' }],
    defaultVariant: '50mg-capsule',
  },
  {
    sku: 'B12-CYANO-100MG',
    name: 'B-12 (Cyanocobalamin)',
    peptideId: null,
    doseMg: 100,
    volumeMl: 0,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'Essential B vitamin supporting red blood cell formation, neurological function, and DNA synthesis.',
    priceUsd: 1.95,
    stockStatus: 'in_stock',
    variants: [{ label: '100mg capsule', value: '100mg-capsule' }],
    defaultVariant: '100mg-capsule',
  },
  {
    sku: 'BCOMPLEX-1200MCG-10ML',
    name: 'B-Complex',
    peptideId: null,
    doseMg: 1.2,
    volumeMl: 10,
    category: 'wellness_supplement',
    isBlend: true,
    blendComponents: ['niacinamide', 'pyridoxine', 'thiamine', 'dexpanthenol', 'riboflavin'],
    description: 'Comprehensive B-vitamin injectable blend (Niacinamide/Pyridoxine/Thiamine/Dexpanthenol/Riboflavin) for energy, metabolism, and nervous system support.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '1200mcg/mL - 10mL', value: '1200mcg-10ml' },
      { label: '1200mcg/mL - 30mL', value: '1200mcg-30ml' },
    ],
    defaultVariant: '1200mcg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'B12-METHYL-5000MCG-10ML',
    name: 'B-12 (Methylcobalamine)',
    peptideId: null,
    doseMg: 5,
    volumeMl: 10,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'Bioactive form of B12 injectable for superior absorption, supporting energy production, nerve health, and methylation.',
    priceUsd: 58.50,
    stockStatus: 'in_stock',
    variants: [{ label: '5000mcg/mL - 10mL', value: '5000mcg-10ml' }],
    defaultVariant: '5000mcg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'LIPOC-10ML',
    name: 'Lipo-C',
    peptideId: null,
    doseMg: 200,
    volumeMl: 10,
    category: 'metabolic',
    isBlend: true,
    blendComponents: ['methionine', 'inositol', 'choline', 'l-carnitine', 'cyanocobalamine'],
    description: 'Lipotropic injection blend (Methionine/Inositol/Choline/L-Carnitine/Cyanocobalamine) for fat metabolism and energy support.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '25/25/50/100 mg/mL - 10mL (single)', value: '10ml-single' },
      { label: '25/25/50/100 mg/mL - 10mL (3+ units)', value: '10ml-bulk' },
    ],
    defaultVariant: '10ml-single',
    vialType: '10ML',
  },
  {
    sku: 'METHYLENE-BLUE-25MG',
    name: 'Methylene Blue',
    peptideId: null,
    doseMg: 25,
    volumeMl: 0,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'Mitochondrial enhancer supporting cellular energy production, cognitive function, and neuroprotection.',
    priceUsd: 3.90,
    stockStatus: 'in_stock',
    variants: [{ label: '25mg capsule', value: '25mg-capsule' }],
    defaultVariant: '25mg-capsule',
  },
  {
    sku: 'MICB12-10ML',
    name: 'MIC+B12',
    peptideId: null,
    doseMg: 176,
    volumeMl: 10,
    category: 'metabolic',
    isBlend: true,
    blendComponents: ['methionine', 'inositol', 'choline', 'cyanocobalamin'],
    description: 'Lipotropic injection blend (Methionine/Inositol/Choline/Cyanocobalamin) for fat metabolism, liver support, and energy.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '25/100/50/1 mg/mL - 10mL', value: '10ml' },
      { label: '25/100/50/1 mg/mL - 30mL', value: '30ml' },
    ],
    defaultVariant: '10ml',
    vialType: '10ML',
  },
  {
    sku: 'AMINOACID3-10ML',
    name: 'Amino Acid #3',
    peptideId: null,
    doseMg: 83.5,
    volumeMl: 10,
    category: 'wellness_supplement',
    isBlend: true,
    blendComponents: ['methionine', 'choline', 'inositol', 'dexpanthenol', 'riboflavin', 'niacinamide', 'cyanocobalamine', 'l-valine', 'l-leucine', 'l-carnitine'],
    description: 'Advanced amino acid injection blend (Methionine/Choline/Inositol/Dexpanthenol/Riboflavin/Niacinamide/Cyanocobalamine/L-Valine/L-Leucine/L-Carnitine) for comprehensive metabolic support.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '25/5/5/2.5/4/5/1/5/10/25 mg/mL - 10mL', value: '10ml' },
      { label: '25/5/5/2.5/4/5/1/5/10/25 mg/mL - 30mL', value: '30ml' },
    ],
    defaultVariant: '10ml',
    vialType: '10ML',
  },
  {
    sku: 'ASCORBIC-ACID-550MG-10ML',
    name: 'Ascorbic Acid',
    peptideId: null,
    doseMg: 550,
    volumeMl: 10,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'High-dose injectable vitamin C for immune support, collagen synthesis, and powerful antioxidant protection.',
    priceUsd: 19.50,
    stockStatus: 'in_stock',
    variants: [
      { label: '550mg/mL - 10mL', value: '550mg-10ml' },
      { label: '550mg/mL - 30mL', value: '550mg-30ml' },
    ],
    defaultVariant: '550mg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'GLUTATHIONE-200MG-10ML',
    name: 'Glutathione',
    peptideId: 'glutathione',
    doseMg: 200,
    volumeMl: 10,
    category: 'immune',
    isBlend: false,
    description: 'Master antioxidant supporting detoxification, immune defense, and cellular protection against oxidative stress.',
    priceUsd: 26.00,
    imageUrl: '/images/products/glutathione.png',
    stockStatus: 'in_stock',
    variants: [
      { label: '200mg/mL - 10mL', value: '200mg-10ml' },
      { label: '200mg/mL - 30mL', value: '200mg-30ml' },
    ],
    defaultVariant: '200mg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'LCARNITINE-500MG-10ML',
    name: 'L-Carnitine',
    peptideId: null,
    doseMg: 500,
    volumeMl: 10,
    category: 'metabolic',
    isBlend: false,
    description: 'Amino acid derivative that transports fatty acids into mitochondria for energy production, supporting fat metabolism and exercise performance.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '500mg/mL - 10mL', value: '500mg-10ml' },
      { label: '500mg/mL - 30mL', value: '500mg-30ml' },
    ],
    defaultVariant: '500mg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'BCAA-10ML',
    name: 'L-Leucine / L-Isoleucine / L-Valine',
    peptideId: null,
    doseMg: 25,
    volumeMl: 10,
    category: 'wellness_supplement',
    isBlend: true,
    blendComponents: ['l-leucine', 'l-isoleucine', 'l-valine'],
    description: 'Branched-chain amino acid (BCAA) injectable blend for muscle recovery, protein synthesis, and exercise performance.',
    priceUsd: 26.00,
    stockStatus: 'in_stock',
    variants: [
      { label: '10/10/5 mg/mL - 10mL', value: '10ml' },
      { label: '10/10/5 mg/mL - 30mL', value: '30ml' },
    ],
    defaultVariant: '10ml',
    vialType: '10ML',
  },
  {
    sku: 'VITD3-50000IU',
    name: 'Vitamin D3',
    peptideId: null,
    doseMg: 0,
    volumeMl: 0,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'High-dose vitamin D3 capsule for bone health, immune function, and mood support.',
    priceUsd: 1.30,
    stockStatus: 'in_stock',
    variants: [{ label: '50,000 IU capsule', value: '50000iu-capsule' }],
    defaultVariant: '50000iu-capsule',
  },
  {
    sku: 'VITD3-INJ-50000IU-5ML',
    name: 'Vitamin D3 Injection',
    peptideId: null,
    doseMg: 0,
    volumeMl: 5,
    category: 'wellness_supplement',
    isBlend: false,
    description: 'Injectable vitamin D3 for superior absorption, supporting bone density, immune health, and hormonal balance.',
    priceUsd: 52.00,
    stockStatus: 'in_stock',
    variants: [{ label: '50,000 IU/mL - 5mL', value: '50000iu-5ml' }],
    defaultVariant: '50000iu-5ml',
    vialType: '5ML',
  },

  // ---------------------------------------------------
  // SEXUAL WELLNESS PRODUCTS
  // ---------------------------------------------------
  {
    sku: 'OXYTOCIN-TROCHE',
    name: 'Oxytocin',
    peptideId: 'oxytocin',
    doseMg: 0,
    volumeMl: 0,
    category: 'sexual_wellness',
    isBlend: false,
    description: 'Neuropeptide that promotes social bonding, reduces stress and anxiety, and supports emotional and sexual well-being.',
    priceUsd: 2.60,
    stockStatus: 'in_stock',
    variants: [
      { label: '50 IU troche', value: '50iu-troche' },
      { label: '100 IU RDT', value: '100iu-rdt' },
      { label: '125 IU troche', value: '125iu-troche' },
    ],
    defaultVariant: '50iu-troche',
  },
  {
    sku: 'PT141-NASAL-2MG-10ML',
    name: 'PT-141 (Bremelanotide) Nasal Spray',
    peptideId: 'pt-141',
    doseMg: 2,
    volumeMl: 10,
    category: 'sexual_wellness',
    isBlend: false,
    description: 'Nasal spray melanocortin receptor agonist for convenient, non-invasive enhancement of sexual arousal and desire.',
    priceUsd: 117.00,
    stockStatus: 'in_stock',
    variants: [{ label: '2mg/mL - 10mL', value: '2mg-10ml' }],
    defaultVariant: '2mg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'PT141-ORAL',
    name: 'PT-141 (Bremelanotide)',
    peptideId: 'pt-141',
    doseMg: 1,
    volumeMl: 0,
    category: 'sexual_wellness',
    isBlend: false,
    description: 'Oral melanocortin receptor agonist that enhances sexual arousal and desire in both men and women.',
    priceUsd: 6.50,
    stockStatus: 'in_stock',
    variants: [
      { label: '1mg capsule', value: '1mg-capsule' },
      { label: '1000mcg troche', value: '1000mcg-troche' },
      { label: '2000mcg troche', value: '2000mcg-troche' },
    ],
    defaultVariant: '1mg-capsule',
  },
  {
    sku: 'PT141-OXYTOCIN-TADALAFIL',
    name: 'PT-141/Oxytocin/Tadalafil',
    peptideId: null,
    doseMg: 0,
    volumeMl: 0,
    category: 'sexual_wellness',
    isBlend: true,
    blendComponents: ['pt-141', 'oxytocin', 'tadalafil'],
    description: 'Triple-action sexual wellness combination: melanocortin activation, oxytocin bonding, and sustained vascular support in a single RDT.',
    priceUsd: 9.10,
    stockStatus: 'in_stock',
    variants: [{ label: '1000mcg/125 IU/25mg RDT', value: '1000mcg-125iu-25mg-rdt' }],
    defaultVariant: '1000mcg-125iu-25mg-rdt',
  },
]

// ===================================================
// Helper functions
// ===================================================

export function getAllProducts(): ShopProduct[] {
  return PRODUCT_CATALOG
}

export function getProductBySku(sku: string): ShopProduct | null {
  return PRODUCT_CATALOG.find(p => p.sku === sku) || null
}

export function getProductsByCategory(category: ProductCategory): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.category === category)
}

export function getProductsByPeptideId(peptideId: string): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.peptideId === peptideId)
}

export function searchProducts(query: string): ShopProduct[] {
  const normalizedQuery = query.toLowerCase()
  return PRODUCT_CATALOG.filter(p =>
    p.name.toLowerCase().includes(normalizedQuery) ||
    p.sku.toLowerCase().includes(normalizedQuery)
  )
}

export function getBlends(): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.isBlend)
}

export function getUniquePeptideIds(): string[] {
  const ids = new Set<string>()
  PRODUCT_CATALOG.forEach(p => {
    if (p.peptideId) ids.add(p.peptideId)
  })
  return Array.from(ids)
}

export function getCategoryDisplayName(category: ProductCategory): string {
  const names: Record<ProductCategory, string> = {
    growth_factor: 'Growth Factors',
    repair: 'Repair & Recovery',
    metabolic: 'Metabolic & Weight Loss',
    bioregulator: 'Bioregulators',
    neuropeptide: 'Neuropeptides',
    immune: 'Immune Support',
    hormonal: 'Hormonal',
    blend: 'Blends',
    accessory: 'Accessories',
    wellness_supplement: 'Wellness Supplements',
    sexual_wellness: 'Sexual Wellness',
  }
  return names[category]
}

export function getCategoriesWithCounts(): { category: ProductCategory; count: number; displayName: string }[] {
  const categories: ProductCategory[] = ['metabolic', 'growth_factor', 'repair', 'bioregulator', 'neuropeptide', 'immune', 'hormonal', 'sexual_wellness', 'blend', 'accessory', 'wellness_supplement']
  return categories.map(category => ({
    category,
    count: getProductsByCategory(category).length,
    displayName: getCategoryDisplayName(category),
  })).filter(c => c.count > 0)
}

export function getUniqueVialTypes(): string[] {
  const types = new Set<string>()
  PRODUCT_CATALOG.forEach(p => {
    if (p.vialType) types.add(p.vialType)
  })
  return Array.from(types).sort()
}

export function getProductsByStockStatus(status: StockStatus): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.stockStatus === status)
}

export function getProductsByVialType(vialType: string): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.vialType === vialType)
}

// ===================================================
// HSA/FSA LMN ELIGIBILITY
// ===================================================

const LMN_EXCLUDED_CATEGORIES: ProductCategory[] = ['accessory']

export function isLmnEligible(product: ShopProduct): boolean {
  return !LMN_EXCLUDED_CATEGORIES.includes(product.category)
}

export function isLmnEligibleCategory(category: ProductCategory): boolean {
  return !LMN_EXCLUDED_CATEGORIES.includes(category)
}

export function getLmnEligibleProducts(): ShopProduct[] {
  return PRODUCT_CATALOG.filter(isLmnEligible)
}
