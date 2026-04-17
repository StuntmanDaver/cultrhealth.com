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

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'restocking_soon'

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
    name: 'TIRZ/B3 (reconstituted)',
    peptideId: 'glp1-tirzepatide',
    doseMg: 10,
    volumeMl: 1,
    category: 'metabolic',
    isBlend: false,
    description: 'Dual GIP/GLP-1 receptor agonist with niacinamide (B3) prescribed for appetite regulation and metabolic support when clinically appropriate. Compounded TIRZ/B3 is not FDA-approved.',
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
    name: 'SEMA/B6 (reconstituted)',
    peptideId: 'glp1-semaglutide',
    doseMg: 2.5,
    volumeMl: 1,
    category: 'metabolic',
    isBlend: false,
    description: 'GLP-1 receptor agonist with pyridoxine (B6) prescribed for appetite regulation, blood sugar support, and weight management when clinically appropriate. Compounded SEMA/B6 is not FDA-approved.',
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
    description: 'Coenzyme involved in cellular energy production and DNA repair. Compounded injectable preparation. Not FDA-approved for any medical condition. Prescribed when clinically appropriate.',
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
    description: 'Growth hormone-releasing hormone (GHRH) analog that stimulates natural GH production. Compounded preparation prescribed when clinically appropriate. Sermorelin (Geref) previously had FDA approval but was discontinued for commercial reasons.',
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
    sku: 'LIPOC-10ML',
    name: 'Lipo-C (reconstituted)',
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
    name: 'Methylene Blue (reconstituted)',
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
    sku: 'GLUTATHIONE-200MG-10ML',
    name: 'Glutathione (reconstituted)',
    peptideId: 'glutathione',
    doseMg: 200,
    volumeMl: 10,
    category: 'immune',
    isBlend: false,
    description: 'Endogenous antioxidant supporting cellular protection, liver detoxification, and immune cell function. Compounded injectable preparation. Not FDA-approved for any specific medical condition. Prescribed when clinically appropriate.',
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
    name: 'L-Carnitine (reconstituted)',
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

  // ---------------------------------------------------
  // SEXUAL WELLNESS PRODUCTS
  // ---------------------------------------------------
  {
    sku: 'OXYTOCIN-TROCHE',
    name: 'Oxytocin (reconstituted)',
    peptideId: 'oxytocin',
    doseMg: 0,
    volumeMl: 0,
    category: 'sexual_wellness',
    isBlend: false,
    description: 'Naturally occurring neuropeptide that promotes social bonding, reduces stress and anxiety, and supports emotional and sexual well-being. Compounded sublingual troche and RDT formulations are not FDA-approved. Prescribed when clinically appropriate.',
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
    description: 'Melanocortin receptor agonist nasal spray that enhances sexual arousal and desire in both men and women. The FDA-approved version (Vyleesi) is indicated for hypoactive sexual desire disorder in premenopausal women; this compounded nasal formulation is prescribed when clinically appropriate.',
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
    description: 'Melanocortin receptor agonist in oral capsule and troche formats that enhances sexual arousal and desire in both men and women. The FDA-approved version (Vyleesi) is indicated for hypoactive sexual desire disorder in premenopausal women; these compounded oral formulations are prescribed when clinically appropriate.',
    priceUsd: 6.50,
    stockStatus: 'in_stock',
    variants: [
      { label: '1mg capsule', value: '1mg-capsule' },
      { label: '1000mcg troche', value: '1000mcg-troche' },
      { label: '2000mcg troche', value: '2000mcg-troche' },
    ],
    defaultVariant: '1mg-capsule',
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
