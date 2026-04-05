// Product Catalog for Members Shop
// 30 curated peptides — prices include 70% markup

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
  vialType?: '3ML' | '5ML' | '10ML' | '30ML'
}

// ===================================================
// Product Catalog — 30 curated peptides, prices include 70% markup
// ===================================================

export const PRODUCT_CATALOG: ShopProduct[] = [
  {
    sku: 'AOD9604-5MG-3ML',
    name: 'AOD-9604',
    peptideId: 'aod-9604',
    doseMg: 5,
    volumeMl: 3,
    category: 'metabolic',
    isBlend: false,
    description: 'Growth hormone fragment that stimulates lipolysis and inhibits lipogenesis. Supports targeted fat reduction without affecting blood sugar.',
    priceUsd: 93.50,
    stockStatus: 'in_stock',
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'BACWATER-30ML',
    name: 'Bacteriostatic Water',
    peptideId: 'bacteriostatic-water',
    doseMg: 0,
    volumeMl: 30,
    category: 'accessory',
    isBlend: false,
    description: 'Sterile water with 0.9% benzyl alcohol for safe reconstitution of lyophilized peptides.',
    priceUsd: 17.00,
    stockStatus: 'in_stock',
    variants: [{ label: '30ml', value: '30ml' }],
    defaultVariant: '30ml',
    vialType: '30ML',
  },
  {
    sku: 'BPC157-5MG-3ML',
    name: 'BPC-157',
    peptideId: 'bpc-157',
    doseMg: 5,
    volumeMl: 3,
    category: 'repair',
    isBlend: false,
    description: 'Body Protection Compound that accelerates healing of tendons, ligaments, muscles, and gut lining. Widely used for injury recovery.',
    priceUsd: 78.20,
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 11,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 3ML', value: '15mg-3ml' },
      { label: '15mg - 5ML', value: '15mg-5ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'BPC157-TB500-5MG-3ML',
    name: 'BPC-157 | TB-500',
    peptideId: null,
    doseMg: 5,
    volumeMl: 3,
    category: 'blend',
    isBlend: true,
    blendComponents: ['bpc-157', 'tb-500'],
    description: 'Synergistic repair blend combining tissue healing and systemic anti-inflammatory action for accelerated recovery.',
    priceUsd: 83.30,
    imageUrl: '/images/products/bpc157-tb500.png',
    stockStatus: 'in_stock',
    bulkPrice: 76.50,
    bulkMinQty: 25,
    bulkSavePercent: 8,
    variants: [
      { label: '5mg/5mg - 3ML', value: '5mg-5mg-3ml' },
      { label: '10mg/10mg - 3ML', value: '10mg-10mg-3ml' },
      { label: '10mg/10mg - 5ML', value: '10mg-10mg-5ml' },
    ],
    defaultVariant: '5mg-5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'CJC1295-5MG-3ML',
    name: 'CJC-1295',
    peptideId: 'cjc-1295',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'Growth hormone-releasing hormone analog that stimulates natural GH production for improved recovery, sleep, and body composition.',
    priceUsd: 76.50,
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 5ML', value: '15mg-5ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'CJC1295-IPAMORELIN-5MG-3ML',
    name: 'CJC-1295 | Ipamorelin',
    peptideId: null,
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: true,
    blendComponents: ['cjc-1295', 'ipamorelin'],
    description: 'Gold-standard GH stack combining GHRH and GHRP pathways for amplified growth hormone release with minimal side effects.',
    priceUsd: 93.50,
    imageUrl: '/images/products/cjc1295-ipa.png',
    stockStatus: 'in_stock',
    bulkPrice: 83.30,
    bulkMinQty: 25,
    bulkSavePercent: 11,
    variants: [
      { label: '5mg/5mg - 3ML', value: '5mg-5mg-3ml' },
      { label: '10mg/10mg - 3ML', value: '10mg-10mg-3ml' },
      { label: '12mg/6mg - 5ML', value: '12mg-6mg-5ml' },
    ],
    defaultVariant: '5mg-5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'EPITHALON-10MG-3ML',
    name: 'Epithalon',
    peptideId: 'epitalon',
    doseMg: 10,
    volumeMl: 3,
    category: 'bioregulator',
    isBlend: false,
    description: 'Telomerase-activating peptide that supports cellular longevity and may slow biological aging processes.',
    priceUsd: 66.30,
    stockStatus: 'in_stock',
    bulkPrice: 59.50,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '50mg - 3ML', value: '50mg-3ml' },
      { label: '50mg - 5ML', value: '50mg-5ml' },
    ],
    defaultVariant: '10mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'GHKCU-50MG-3ML',
    name: 'GHK-CU',
    peptideId: 'ghk-cu',
    doseMg: 50,
    volumeMl: 3,
    category: 'repair',
    isBlend: false,
    description: 'Copper peptide that stimulates collagen synthesis, accelerates wound healing, and promotes skin rejuvenation and hair growth.',
    priceUsd: 74.80,
    imageUrl: '/images/products/ghk-cu.png',
    stockStatus: 'in_stock',
    bulkPrice: 68.00,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '50mg - 3ML', value: '50mg-3ml' },
      { label: '70mg - 5ML', value: '70mg-5ml' },
      { label: '100mg - 3ML', value: '100mg-3ml' },
      { label: '100mg - 10ML', value: '100mg-10ml' },
    ],
    defaultVariant: '50mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'GHRP2-5MG-3ML',
    name: 'GHRP-2',
    peptideId: 'ghrp-2',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'Potent growth hormone secretagogue that stimulates GH release and increases appetite. Supports muscle gain and recovery.',
    priceUsd: 59.50,
    stockStatus: 'in_stock',
    bulkPrice: 54.40,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'GHRP6-5MG-3ML',
    name: 'GHRP-6',
    peptideId: 'ghrp-6',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'Growth hormone-releasing peptide that strongly stimulates appetite and GH secretion. Ideal for recovery and lean mass gains.',
    priceUsd: 59.50,
    stockStatus: 'in_stock',
    bulkPrice: 54.40,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'IPAMORELIN-5MG-3ML',
    name: 'Ipamorelin',
    peptideId: 'ipamorelin',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'Selective GH secretagogue with minimal side effects. Promotes growth hormone release without affecting cortisol or prolactin.',
    priceUsd: 76.50,
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 5ML', value: '15mg-5ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'IPAMORELIN-SERMORELIN-5MG-3ML',
    name: 'Ipamorelin / Sermorelin',
    peptideId: null,
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: true,
    blendComponents: ['ipamorelin', 'sermorelin'],
    description: 'Complementary GH blend that stimulates both GHRP and GHRH pathways for balanced growth hormone optimization.',
    priceUsd: 54.40,
    stockStatus: 'in_stock',
    bulkPrice: 49.30,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg/5mg - 3ML', value: '5mg-5mg-3ml' },
      { label: '10mg/10mg - 3ML', value: '10mg-10mg-3ml' },
    ],
    defaultVariant: '5mg-5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'KISSPEPTIN-5MG-3ML',
    name: 'Kisspeptin',
    peptideId: 'kisspeptin-10',
    doseMg: 5,
    volumeMl: 3,
    category: 'hormonal',
    isBlend: false,
    description: 'Hypothalamic peptide that stimulates GnRH release. Supports reproductive hormone balance and fertility.',
    priceUsd: 76.50,
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'KPV-5MG-3ML',
    name: 'KPV',
    peptideId: 'kpv',
    doseMg: 5,
    volumeMl: 3,
    category: 'immune',
    isBlend: false,
    description: 'Anti-inflammatory tripeptide derived from alpha-MSH. Supports gut health and reduces systemic inflammation.',
    priceUsd: 85.00,
    stockStatus: 'in_stock',
    bulkPrice: 76.50,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'MOTSC-10MG-3ML',
    name: 'MOTS-C',
    peptideId: 'mots-c',
    doseMg: 10,
    volumeMl: 3,
    category: 'metabolic',
    isBlend: false,
    description: 'Mitochondrial-derived peptide that enhances metabolic flexibility, exercise capacity, and cellular energy production.',
    priceUsd: 91.80,
    stockStatus: 'in_stock',
    bulkPrice: 83.30,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '40mg - 3ML', value: '40mg-3ml' },
      { label: '50mg - 5ML', value: '50mg-5ml' },
    ],
    defaultVariant: '10mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'MT2-10MG-3ML',
    name: 'MT-2 (Melanotan 2 Acetate)',
    peptideId: 'melanotan-2',
    doseMg: 10,
    volumeMl: 3,
    category: 'hormonal',
    isBlend: false,
    description: 'Melanocortin agonist that promotes tanning, may reduce appetite, and supports libido enhancement.',
    priceUsd: 74.80,
    imageUrl: '/images/products/melanotan2-mt2.png',
    stockStatus: 'in_stock',
    bulkPrice: 68.00,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [{ label: '10mg - 3ML', value: '10mg-3ml' }],
    defaultVariant: '10mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'NAD-500MG-10ML',
    name: 'NAD+',
    peptideId: 'nad-plus',
    doseMg: 500,
    volumeMl: 10,
    category: 'bioregulator',
    isBlend: false,
    description: 'Essential coenzyme that supports cellular energy production, DNA repair, and healthy aging at the mitochondrial level.',
    priceUsd: 102.00,
    imageUrl: '/images/products/nad-plus.png',
    stockStatus: 'in_stock',
    bulkPrice: 91.80,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '500mg - 10ML', value: '500mg-10ml' },
      { label: '1000mg - 10ML', value: '1000mg-10ml' },
    ],
    defaultVariant: '500mg-10ml',
    vialType: '10ML',
  },
  {
    sku: 'OXYTOCIN-2MG-3ML',
    name: 'Oxytocin',
    peptideId: 'oxytocin',
    doseMg: 2,
    volumeMl: 3,
    category: 'neuropeptide',
    isBlend: false,
    description: 'Neuropeptide that promotes social bonding, reduces stress and anxiety, and supports emotional well-being.',
    priceUsd: 69.70,
    stockStatus: 'in_stock',
    bulkPrice: 61.20,
    bulkMinQty: 25,
    bulkSavePercent: 12,
    variants: [{ label: '2mg - 3ML', value: '2mg-3ml' }],
    defaultVariant: '2mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'PEGMGF-2MG-3ML',
    name: 'PEG MGF',
    peptideId: 'peg-mgf',
    doseMg: 2,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'PEGylated Mechano Growth Factor with extended half-life for sustained muscle repair and systemic growth support.',
    priceUsd: 66.30,
    stockStatus: 'in_stock',
    bulkPrice: 59.50,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [{ label: '2mg - 3ML', value: '2mg-3ml' }],
    defaultVariant: '2mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'PT141-10MG-3ML',
    name: 'PT-141',
    peptideId: 'pt-141',
    doseMg: 10,
    volumeMl: 3,
    category: 'hormonal',
    isBlend: false,
    description: 'Melanocortin receptor agonist that works centrally to enhance sexual arousal and desire in both men and women.',
    priceUsd: 69.70,
    stockStatus: 'in_stock',
    bulkPrice: 61.20,
    bulkMinQty: 25,
    bulkSavePercent: 12,
    variants: [{ label: '10mg - 3ML', value: '10mg-3ml' }],
    defaultVariant: '10mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'SELANK-5MG-3ML',
    name: 'Selank',
    peptideId: 'selank',
    doseMg: 5,
    volumeMl: 3,
    category: 'neuropeptide',
    isBlend: false,
    description: 'Anxiolytic neuropeptide that reduces anxiety and enhances cognitive function without sedation or dependency.',
    priceUsd: 52.70,
    stockStatus: 'in_stock',
    bulkPrice: 47.60,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '11mg - 3ML', value: '11mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'SELANK-SEMAX-5MG-3ML',
    name: 'Selank | Semax',
    peptideId: null,
    doseMg: 5,
    volumeMl: 3,
    category: 'neuropeptide',
    isBlend: true,
    blendComponents: ['selank', 'semax'],
    description: 'Nootropic blend combining anxiolytic and cognitive-enhancing neuropeptides for focus, clarity, and stress resilience.',
    priceUsd: 76.50,
    imageUrl: '/images/products/semax-selank.png',
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [{ label: '5mg/5mg - 3ML', value: '5mg-5mg-3ml' }],
    defaultVariant: '5mg-5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'SEMAX-5MG-3ML',
    name: 'Semax',
    peptideId: 'semax',
    doseMg: 5,
    volumeMl: 3,
    category: 'neuropeptide',
    isBlend: false,
    description: 'Nootropic peptide that enhances BDNF expression, cognitive performance, and neuroprotection.',
    priceUsd: 42.50,
    stockStatus: 'in_stock',
    bulkPrice: 39.10,
    bulkMinQty: 25,
    bulkSavePercent: 8,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '11mg - 3ML', value: '11mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'SERMORELIN-5MG-3ML',
    name: 'Sermorelin',
    peptideId: 'sermorelin',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'GHRH analog that stimulates natural growth hormone production. Supports anti-aging, sleep quality, and body composition.',
    priceUsd: 76.50,
    stockStatus: 'in_stock',
    bulkPrice: 69.70,
    bulkMinQty: 25,
    bulkSavePercent: 9,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '9mg - 5ML', value: '9mg-5ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'SMA-5MG-3ML',
    name: 'SMA',
    peptideId: 'glp1-semaglutide',
    doseMg: 5,
    volumeMl: 3,
    category: 'metabolic',
    isBlend: false,
    description: 'Semaglutide GLP-1 receptor agonist for appetite suppression, blood sugar regulation, and sustainable weight loss.',
    priceUsd: 117.30,
    imageUrl: '/images/products/semaglutide-glp1.png',
    stockStatus: 'in_stock',
    bulkPrice: 110.50,
    bulkMinQty: 25,
    bulkSavePercent: 6,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 3ML', value: '15mg-3ml' },
      { label: '20mg - 3ML', value: '20mg-3ml' },
      { label: '30mg - 3ML', value: '30mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'TB500-5MG-3ML',
    name: 'TB-500',
    peptideId: 'tb-500',
    doseMg: 5,
    volumeMl: 3,
    category: 'repair',
    isBlend: false,
    description: 'Thymosin Beta-4 fragment that promotes systemic tissue repair, reduces inflammation, and supports flexibility.',
    priceUsd: 83.30,
    stockStatus: 'in_stock',
    bulkPrice: 73.10,
    bulkMinQty: 25,
    bulkSavePercent: 12,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 5ML', value: '15mg-5ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'TESAMORELIN-5MG-3ML',
    name: 'Tesamorelin',
    peptideId: 'tesamorelin',
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: false,
    description: 'GHRH analog studied for its role in growth hormone support. Tesamorelin (Egrifta) is FDA-approved for a specific indication; this compounded formulation is not FDA-approved.',
    priceUsd: 69.70,
    stockStatus: 'in_stock',
    bulkPrice: 61.20,
    bulkMinQty: 25,
    bulkSavePercent: 12,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 5ML', value: '15mg-5ml' },
      { label: '20mg - 3ML', value: '20mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'TESAMORELIN-IPAMORELIN-5MG-3ML',
    name: 'Tesamorelin | Ipamorelin',
    peptideId: null,
    doseMg: 5,
    volumeMl: 3,
    category: 'growth_factor',
    isBlend: true,
    blendComponents: ['tesamorelin', 'ipamorelin'],
    description: 'Powerful GH combination targeting visceral fat reduction with clean growth hormone amplification.',
    priceUsd: 103.70,
    imageUrl: '/images/products/tesa-ipa.png',
    stockStatus: 'in_stock',
    bulkPrice: 93.33,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '5mg/5mg - 3ML', value: '5mg-5mg-3ml' },
      { label: '10mg/10mg - 3ML', value: '10mg-10mg-3ml' },
      { label: '12mg/6mg - 5ML', value: '12mg-6mg-5ml' },
    ],
    defaultVariant: '5mg-5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'THYMOSINALPHA1-5MG-3ML',
    name: 'Thymosin Alpha 1',
    peptideId: 'thymosin-alpha1',
    doseMg: 5,
    volumeMl: 3,
    category: 'immune',
    isBlend: false,
    description: 'Immune-modulating peptide that enhances T-cell function and supports defense against infections.',
    priceUsd: 100.30,
    stockStatus: 'in_stock',
    bulkPrice: 90.10,
    bulkMinQty: 25,
    bulkSavePercent: 10,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
  },
  {
    sku: 'TRZ-5MG-3ML',
    name: 'TRZ',
    peptideId: 'glp1-tirzepatide',
    doseMg: 5,
    volumeMl: 3,
    category: 'metabolic',
    isBlend: false,
    description: 'Tirzepatide dual GIP/GLP-1 receptor agonist for powerful appetite suppression and blood sugar regulation.',
    priceUsd: 122.40,
    imageUrl: '/images/products/tirzepatide-glp1-gip.png',
    stockStatus: 'in_stock',
    bulkPrice: 115.60,
    bulkMinQty: 25,
    bulkSavePercent: 6,
    variants: [
      { label: '5mg - 3ML', value: '5mg-3ml' },
      { label: '10mg - 3ML', value: '10mg-3ml' },
      { label: '15mg - 3ML', value: '15mg-3ml' },
      { label: '20mg - 3ML', value: '20mg-3ml' },
      { label: '30mg - 3ML', value: '30mg-3ml' },
      { label: '40mg - 3ML', value: '40mg-3ml' },
      { label: '45mg - 3ML', value: '45mg-3ml' },
      { label: '50mg - 3ML', value: '50mg-3ml' },
      { label: '60mg - 3ML', value: '60mg-3ml' },
      { label: '60mg - 5ML', value: '60mg-5ml' },
      { label: '100mg - 10ML', value: '100mg-10ml' },
    ],
    defaultVariant: '5mg-3ml',
    vialType: '3ML',
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
  }
  return names[category]
}

export function getCategoriesWithCounts(): { category: ProductCategory; count: number; displayName: string }[] {
  const categories: ProductCategory[] = ['metabolic', 'growth_factor', 'repair', 'bioregulator', 'neuropeptide', 'immune', 'hormonal', 'blend', 'accessory']
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
