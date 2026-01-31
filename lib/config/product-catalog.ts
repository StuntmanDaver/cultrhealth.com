// Product Catalog for Members Shop
// Contains all purchasable product SKUs with metadata

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

export type ShopProduct = {
  sku: string
  name: string
  peptideId: string | null // Reference to PEPTIDE_CATALOG entry, null for blends/accessories
  doseMg: number
  volumeMl: number
  category: ProductCategory
  isBlend: boolean
  blendComponents?: string[] // For blends, list component peptide IDs
  description?: string
  /** Price in USD; products without price remain quote-only */
  priceUsd?: number
  /** Product image URL */
  imageUrl?: string
}

// Helper to parse dose from SKU (e.g., "10MG" -> 10, "05MG" -> 5, "01MG" -> 1, ".01MG" -> 0.01)
function parseDose(doseStr: string): number {
  const match = doseStr.match(/^\.?(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  // Handle cases like "05MG" -> 5, but also "01MG" -> 1
  if (doseStr.startsWith('.') || doseStr.startsWith('0.')) {
    return val / 100; // e.g., ".01MG" -> 0.01
  }
  return val;
}

// Helper to parse volume from SKU (e.g., "03ML" -> 0.3, "10ML" -> 10)
function parseVolume(volStr: string): number {
  const match = volStr.match(/(\d+)/);
  if (!match) return 0;
  const val = parseInt(match[1], 10);
  // "03ML" -> 0.3, "05ML" -> 0.5, "10ML" -> 10
  if (val < 10) return val / 10;
  return val;
}

// Map peptide names from SKU to PEPTIDE_CATALOG IDs
const PEPTIDE_ID_MAP: Record<string, string> = {
  '5AMINO1MQ': '5-amino-1mq',
  'AOD9604': 'aod-9604',
  'ARA290': 'ara-290',
  'BACWATER': 'bacteriostatic-water',
  'BPC157': 'bpc-157',
  'CJC1295': 'cjc-1295',
  'CJC1295WITHDAC': 'cjc-1295-dac',
  'DSIP': 'dsip',
  'EPITHALON': 'epitalon',
  'FOLLISTATIN': 'follistatin-344',
  'GHKCU': 'ghk-cu',
  'GHRP2': 'ghrp-2',
  'GHRP6': 'ghrp-6',
  'GONADORELIN': 'gonadorelin',
  'HEXARELIN': 'hexarelin',
  'IGF1LR3': 'igf1-lr3',
  'IPAMORELIN': 'ipamorelin',
  'KISSPEPTIN': 'kisspeptin-10',
  'KPV': 'kpv',
  'LC120': 'lc-120',
  'LL37': 'll-37',
  'MGF': 'mgf',
  'MOTSC': 'mots-c',
  'MELANOTAN1': 'melanotan-1',
  'MT2': 'melanotan-2',
  'MELANOTAN2ACETATE': 'melanotan-2',
  'NAD+': 'nad-plus',
  'OXYTOCIN': 'oxytocin',
  'PEGMGF': 'peg-mgf',
  'PINEALON': 'pinealon',
  'PT141': 'pt-141',
  'SELANK': 'selank',
  'SEMAX': 'semax',
  'SERMORELIN': 'sermorelin',
  'SNAP8': 'snap-8',
  'SS31': 'elamipretide',
  'SLU-PP-332': 'slu-pp-332',
  'TB500': 'tb-500',
  'TESAMORELIN': 'tesamorelin',
  'THYMALIN': 'thymalin',
  'THYMOSINALPHA1': 'thymosin-alpha1',
  'THYMULIN': 'thymulin',
  'VIP': 'vip',
  // GLP-1 variants
  'GLP-1-C': 'glp1-cagrilintide',
  'GLP-1-1MZ': 'glp1-mz',
  'GLP-1-3R': 'glp1-retatrutide',
  'GLP-1-1S': 'glp1-semaglutide',
  'GLP-1-SV': 'glp1-sv',
  'GLP-1-2T': 'glp1-tirzepatide',
}

// Map peptide IDs to categories
const PEPTIDE_CATEGORY_MAP: Record<string, ProductCategory> = {
  '5-amino-1mq': 'metabolic',
  'aod-9604': 'metabolic',
  'ara-290': 'neuropeptide',
  'bacteriostatic-water': 'accessory',
  'bpc-157': 'repair',
  'cjc-1295': 'growth_factor',
  'cjc-1295-dac': 'growth_factor',
  'dsip': 'bioregulator',
  'epitalon': 'bioregulator',
  'follistatin-344': 'growth_factor',
  'ghk-cu': 'repair',
  'ghrp-2': 'growth_factor',
  'ghrp-6': 'growth_factor',
  'gonadorelin': 'hormonal',
  'hexarelin': 'growth_factor',
  'igf1-lr3': 'growth_factor',
  'ipamorelin': 'growth_factor',
  'kisspeptin-10': 'hormonal',
  'kpv': 'immune',
  'lc-120': 'neuropeptide',
  'll-37': 'immune',
  'mgf': 'growth_factor',
  'mots-c': 'metabolic',
  'melanotan-1': 'hormonal',
  'melanotan-2': 'hormonal',
  'nad-plus': 'bioregulator',
  'oxytocin': 'neuropeptide',
  'peg-mgf': 'growth_factor',
  'pinealon': 'bioregulator',
  'pt-141': 'hormonal',
  'selank': 'neuropeptide',
  'semax': 'neuropeptide',
  'sermorelin': 'growth_factor',
  'snap-8': 'repair',
  'elamipretide': 'bioregulator',
  'slu-pp-332': 'metabolic',
  'tb-500': 'repair',
  'tesamorelin': 'growth_factor',
  'thymalin': 'immune',
  'thymosin-alpha1': 'immune',
  'thymulin': 'immune',
  'vip': 'neuropeptide',
  'glp1-cagrilintide': 'metabolic',
  'glp1-mz': 'metabolic',
  'glp1-retatrutide': 'metabolic',
  'glp1-semaglutide': 'metabolic',
  'glp1-sv': 'metabolic',
  'glp1-tirzepatide': 'metabolic',
}

// Human-readable names for peptides
const PEPTIDE_DISPLAY_NAMES: Record<string, string> = {
  '5-amino-1mq': '5-Amino-1MQ',
  'aod-9604': 'AOD-9604',
  'ara-290': 'ARA-290',
  'bacteriostatic-water': 'Bacteriostatic Water',
  'bpc-157': 'BPC-157',
  'cjc-1295': 'CJC-1295 (No DAC)',
  'cjc-1295-dac': 'CJC-1295 with DAC',
  'dsip': 'DSIP',
  'epitalon': 'Epitalon',
  'follistatin-344': 'Follistatin',
  'ghk-cu': 'GHK-Cu',
  'ghrp-2': 'GHRP-2',
  'ghrp-6': 'GHRP-6',
  'gonadorelin': 'Gonadorelin',
  'hexarelin': 'Hexarelin',
  'igf1-lr3': 'IGF-1 LR3',
  'ipamorelin': 'Ipamorelin',
  'kisspeptin-10': 'Kisspeptin-10',
  'kpv': 'KPV',
  'lc-120': 'LC-120',
  'll-37': 'LL-37',
  'mgf': 'MGF',
  'mots-c': 'MOTS-c',
  'melanotan-1': 'Melanotan-1',
  'melanotan-2': 'Melanotan-2',
  'nad-plus': 'NAD+',
  'oxytocin': 'Oxytocin',
  'peg-mgf': 'PEG-MGF',
  'pinealon': 'Pinealon',
  'pt-141': 'PT-141',
  'selank': 'Selank',
  'semax': 'Semax',
  'sermorelin': 'Sermorelin',
  'snap-8': 'SNAP-8',
  'elamipretide': 'SS-31 (Elamipretide)',
  'slu-pp-332': 'SLU-PP-332',
  'tb-500': 'TB-500',
  'tesamorelin': 'Tesamorelin',
  'thymalin': 'Thymalin',
  'thymosin-alpha1': 'Thymosin Alpha-1',
  'thymulin': 'Thymulin',
  'vip': 'VIP',
  'glp1-cagrilintide': 'GLP-1 (Cagrilintide)',
  'glp1-mz': 'GLP-1 (MZ)',
  'glp1-retatrutide': 'GLP-1 (Retatrutide)',
  'glp1-semaglutide': 'GLP-1 (Semaglutide)',
  'glp1-sv': 'GLP-1 (SV)',
  'glp1-tirzepatide': 'GLP-1 (Tirzepatide)',
}

// Blend definitions with component mapping
const BLEND_DEFINITIONS: Record<string, { name: string; components: string[]; category: ProductCategory }> = {
  'BLND-AOD9604CJC1295IPAMORELIN': {
    name: 'AOD-9604 + CJC-1295 + Ipamorelin Blend',
    components: ['aod-9604', 'cjc-1295', 'ipamorelin'],
    category: 'blend',
  },
  'BLND-GLOW-BPC157GHKCUTB500': {
    name: 'GLOW Blend (BPC-157 + GHK-Cu + TB-500)',
    components: ['bpc-157', 'ghk-cu', 'tb-500'],
    category: 'blend',
  },
  'BLND-GLOW+BPC157GHKCUTB500': {
    name: 'GLOW+ Blend (BPC-157 + GHK-Cu + TB-500)',
    components: ['bpc-157', 'ghk-cu', 'tb-500'],
    category: 'blend',
  },
  'BLND-KLOW-BPC157GHKCUKPVTB500': {
    name: 'KLOW Blend (BPC-157 + GHK-Cu + KPV + TB-500)',
    components: ['bpc-157', 'ghk-cu', 'kpv', 'tb-500'],
    category: 'blend',
  },
  'BLND-KLOW+BPC157GHKCUKPVTB500': {
    name: 'KLOW+ Blend (BPC-157 + GHK-Cu + KPV + TB-500)',
    components: ['bpc-157', 'ghk-cu', 'kpv', 'tb-500'],
    category: 'blend',
  },
  'BLND-WOLVERINE-BPC157TB500': {
    name: 'Wolverine Blend (BPC-157 + TB-500)',
    components: ['bpc-157', 'tb-500'],
    category: 'blend',
  },
  'BLND-GLP-1-C1S': {
    name: 'GLP-1 Blend (Cagrilintide + Semaglutide)',
    components: ['glp1-cagrilintide', 'glp1-semaglutide'],
    category: 'metabolic',
  },
  'BLND-CJC1295WITHDAC': {
    name: 'CJC-1295 with DAC',
    components: ['cjc-1295-dac'],
    category: 'growth_factor',
  },
  'BLND-CJC1295IPAMORELIN': {
    name: 'CJC-1295 + Ipamorelin Blend',
    components: ['cjc-1295', 'ipamorelin'],
    category: 'growth_factor',
  },
  'BLND-IPAMORELINSERMORELIN': {
    name: 'Ipamorelin + Sermorelin Blend',
    components: ['ipamorelin', 'sermorelin'],
    category: 'growth_factor',
  },
  'BLND-SELANKSEMAX': {
    name: 'Selank + Semax Blend',
    components: ['selank', 'semax'],
    category: 'neuropeptide',
  },
  'BLND-PT141KISSPEPTINPINEALON': {
    name: 'PT-141 + Kisspeptin + Pinealon Blend',
    components: ['pt-141', 'kisspeptin-10', 'pinealon'],
    category: 'hormonal',
  },
  'BLND-TESAMORELINIPAMORELIN': {
    name: 'Tesamorelin + Ipamorelin Blend',
    components: ['tesamorelin', 'ipamorelin'],
    category: 'growth_factor',
  },
  'BLND-THYMOSINALPHA1THYMULIN': {
    name: 'Thymosin Alpha-1 + Thymulin Blend',
    components: ['thymosin-alpha1', 'thymulin'],
    category: 'immune',
  },
}

// Wellness supplement definitions
const WELLNESS_SUPPLEMENTS: Record<string, { name: string; priceUsd: number; description?: string; imageUrl: string }> = {
  'WELLNESS-RE-GEN-129.99': {
    name: 'Re-Generate',
    priceUsd: 129.99,
    description: 'Premium recovery supplement with BPC-157, PEA, and Hyaluronic Acid for tissue repair and joint support.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/a763ee54-332e-4f98-bac2-20321ba5455f_e571919e-c670-4503-bedd-2ab1cb44cbb0.webp?v=1742015169',
  },
  'WELLNESS-ULT-GI-219.99': {
    name: 'Ultimate GI Repair',
    priceUsd: 219.99,
    description: 'Advanced gastrointestinal support with four bioactive peptides for digestive health and intestinal integrity.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/fc63232c-aa16-4568-aff6-662079545ec2_d3793b0d-b8be-4de5-9ca0-66a19e9e4f22.webp?v=1742015229',
  },
  'WELLNESS-WOLVERINE-219.99': {
    name: 'Wolverine',
    priceUsd: 219.99,
    description: 'Recovery supplement combining BPC-157, TB4-Fragment, and PEA for accelerated recovery.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/485d4af0-e7b5-46e4-bbc0-158c1ce97d86.webp?v=1762958135',
  },
  'WELLNESS-GHK-CU-139.99': {
    name: 'GHK-Cu',
    priceUsd: 139.99,
    description: 'Liposomal copper peptide formulation for superior absorption and systemic recovery.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/406ebdf1-14c4-4504-bb52-f57e8b1c2293_6fbed0fd-3b2c-45ce-a6e4-41f53b6fa119.webp?v=1742182672',
  },
  'WELLNESS-TOTAL-RECOMP-199.99': {
    name: 'Total Recomp',
    priceUsd: 199.99,
    description: 'Cutting-edge metabolic support for body composition and energy production.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/9d7da9d1-602a-40e9-acde-d4812766d24d_2d9cf99d-2b39-4bf6-9e58-427517975311.webp?v=1742880026',
  },
  'WELLNESS-NEURO-REGEN-249.99': {
    name: 'Neuro Regenerate',
    priceUsd: 249.99,
    description: 'Triple peptide formula for cognitive function, mental clarity, and neuroprotection.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/e7c1d276-6a0f-466d-9316-4a78a2d59cc0_c3aa34d6-cce7-4eb1-a107-c4874881d8f0.webp?v=1742186317',
  },
  'WELLNESS-AC-FRAG-109.99': {
    name: 'AC Fragments (TB4-Frags)',
    priceUsd: 109.99,
    description: 'Oral peptide alternative for muscle recovery and tissue repair.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/334328c7-9151-497b-890a-ded619085939_acd6d19b-bc4f-4821-8751-f4b3e5aa4b92.webp?v=1742182895',
  },
  'WELLNESS-KPV-109.99': {
    name: 'KPV',
    priceUsd: 109.99,
    description: 'Bioactive tripeptide for immune modulation and tissue regeneration.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/4d02baa0-cace-4614-8d14-e2d61ca1e250_3a244bb6-0ba9-4728-abb1-ef6529d0ede9.webp?v=1742015503',
  },
  'WELLNESS-LARAZOTIDE-149.99': {
    name: 'Larazotide',
    priceUsd: 149.99,
    description: 'Specialized formula for gut barrier functionality and digestive health.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/d376e5fe-e18d-4455-a7c3-0ed6208504ed_130fdc3d-b57b-45c1-aa47-b7cc64348652.webp?v=1742015623',
  },
  'WELLNESS-LONGEVITY-249.99': {
    name: 'Longevity (5-Amino-1MQ)',
    priceUsd: 249.99,
    description: 'Advanced formula targeting cellular health, metabolism, and longevity.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/5207c14a-664c-4ed1-bc7e-f316cf1c39e8_477fc496-fa5d-45ba-86ea-df7131f2e9d5.webp?v=1746684256',
  },
  'WELLNESS-CREVOLUTION-59.99': {
    name: 'Crevolution',
    priceUsd: 59.99,
    description: 'Multi-form creatine formula for muscle performance and strength.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/37b3b9d0-ae18-4a1a-99c2-f7120e5d4bc4-scaled.webp?v=1769817265',
  },
  'WELLNESS-MAG-THREONATE-54.99': {
    name: 'Magnesium L-Threonate',
    priceUsd: 54.99,
    description: 'Highly bioavailable magnesium form for enhanced absorption and utilization.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/MAG_MAIN_2a7dfc68-5c65-47cf-8be7-a9f6943fe55b.webp?v=1747050860',
  },
  'WELLNESS-PEA-39.99': {
    name: 'PEA',
    priceUsd: 39.99,
    description: 'Palmitoylethanolamide for pain relief and inflammation reduction.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/0233d7e1-8fcf-4be5-ae22-8c581b951319_a44df83c-91d9-492d-8eb0-c6fb9b2854a1.webp?v=1742015676',
  },
  'WELLNESS-GI-REPAIR-209.99': {
    name: 'GI Repair (BPC-Free)',
    priceUsd: 209.99,
    description: 'Comprehensive gut health formula without BPC-157 for regional compatibility.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/fc63232c-aa16-4568-aff6-662079545ec2_d3793b0d-b8be-4de5-9ca0-66a19e9e4f22.webp?v=1742015229',
  },
  'WELLNESS-HISTA-RESIST-89.99': {
    name: 'Hista-Resist',
    priceUsd: 89.99,
    description: 'Specialized formula for histamine intolerance and mast cell support.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/HIS_MAIN_a93eb6df-352f-455f-9745-7c5f3959ac3b.webp?v=1754367343',
  },
  'WELLNESS-TUDCA-500-79.99': {
    name: 'TUDCA - 500mg',
    priceUsd: 79.99,
    description: 'Bile salt for liver support and cellular protection.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/f8dbe741-51f0-44f8-832e-19d969033731_5e6a9dcb-3c61-4ef3-957c-5fe797fce79c.webp?v=1747967355',
  },
  'WELLNESS-TRIBUTYRIN-64.99': {
    name: 'Tributyrin Plus',
    priceUsd: 64.99,
    description: 'Gut health formula with tributyrin and beneficial probiotics.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/fc63232c-aa16-4568-aff6-662079545ec2_d3793b0d-b8be-4de5-9ca0-66a19e9e4f22.webp?v=1742015229',
  },
  'WELLNESS-TUDCA-OXBILE-69.99': {
    name: 'TUDCA + Ox Bile',
    priceUsd: 69.99,
    description: 'Synergistic combination for liver function and digestive efficiency.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/8dd86142-371f-4997-bb98-fae6f353fa40_f09a9e1a-d04d-4935-8b22-75030af91516.webp?v=1742186513',
  },
  'WELLNESS-ZINC-CARNOSINE-39.99': {
    name: 'Zinc Carnosine +',
    priceUsd: 39.99,
    description: 'Gut integrity support with Mastic Gum and DGL.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/385e4647-97f7-440a-8d42-56369d337410_a729cac3-2237-4f86-a7b9-8dd3ec79d4e3.webp?v=1742880384',
  },
  'WELLNESS-TUDCA-250-49.99': {
    name: 'TUDCA - 250mg',
    priceUsd: 49.99,
    description: 'Lower-dose TUDCA option with liver-supportive Taurine.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/52fff27a-2cbe-4aeb-94eb-ea4258ee8705_f8cee1db-845f-4b42-a396-df522f256389.webp?v=1742880384',
  },
  'WELLNESS-BOTANABOLIC-114.99': {
    name: 'Botanabolic',
    priceUsd: 114.99,
    description: 'Advanced testosterone-supporting supplement for hormonal health.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/3b8968d0-d98f-4089-8ec1-bf674a1f378e_bf798a79-9856-4eed-9ae8-bfaf7c2e0740.webp',
  },
  'WELLNESS-LIVER-COMPLEX-109.99': {
    name: 'Complete Liver Complex',
    priceUsd: 109.99,
    description: 'Comprehensive liver support for detoxification and cellular health.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/CLC__5950c5cc-eba2-44db-86bd-f68d19ba716c.webp?v=1757053720',
  },
  'WELLNESS-TURKESTERONE-62.99': {
    name: 'Turkesterone',
    priceUsd: 62.99,
    description: 'Plant-derived supplement for muscle growth and recovery.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/2f01092e-0832-4f5a-b242-15dc40536e29_eb842d9f-f814-426a-a4ed-49ebe6b9ca86.webp?v=1742015687',
  },
  'WELLNESS-DHM-69.99': {
    name: 'Dihydromyricetin (DHM)',
    priceUsd: 69.99,
    description: 'Flavonoid for liver support and antioxidant protection.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/97ce7663-45c0-425e-b7de-7dcd2ed5e98b_2ea6e589-db29-4c09-a2f7-aa0c67c8e3cd.webp?v=1747967637',
  },
  'WELLNESS-BPC157-DOUBLE-169.99': {
    name: 'BPC-157 Double Strength',
    priceUsd: 169.99,
    description: 'Double-strength formula for full-body healing and recovery.',
    imageUrl: 'https://wholesale.lvluphealth.com/cdn/shop/files/3918b664-6c90-4039-98dc-03ac7f03c704_799ee5d0-253e-4953-8a4d-95f185223956.webp?v=1742186278',
  },
}

// Parse a single SKU into a product
function parseSku(sku: string): ShopProduct {
  // Check if it's a wellness supplement
  if (sku.startsWith('WELLNESS-')) {
    const wellnessData = WELLNESS_SUPPLEMENTS[sku]
    if (wellnessData) {
      return {
        sku,
        name: wellnessData.name,
        peptideId: null,
        doseMg: 0,
        volumeMl: 0,
        category: 'wellness_supplement',
        isBlend: false,
        description: wellnessData.description,
        priceUsd: wellnessData.priceUsd,
        imageUrl: wellnessData.imageUrl,
      }
    }
  }

  // Check if it's a blend
  const isBlend = sku.startsWith('BLND-')
  
  if (isBlend) {
    // Parse blend SKU: BLND-NAME-COMPONENTS-DOSE-VOLUME
    const blendMatch = sku.match(/^(BLND-[A-Z0-9+\-]+)-(\d+X?\d*(?:X\d+)*MG)-(\d+ML)$/i)
    if (blendMatch) {
      const blendKey = blendMatch[1]
      const doseStr = blendMatch[2]
      const volumeStr = blendMatch[3]
      
      // Find blend definition
      const blendDef = Object.entries(BLEND_DEFINITIONS).find(([key]) => 
        blendKey.toUpperCase().startsWith(key.toUpperCase())
      )
      
      // Parse dose - for blends with multiple doses like "10X05X05MG", take the first
      const doseMatch = doseStr.match(/^(\d+)/);
      const doseMg = doseMatch ? parseInt(doseMatch[1], 10) : 0;
      const volumeMl = parseVolume(volumeStr);
      
      if (blendDef) {
        return {
          sku,
          name: `${blendDef[1].name} ${doseMg}mg`,
          peptideId: null,
          doseMg,
          volumeMl,
          category: blendDef[1].category,
          isBlend: true,
          blendComponents: blendDef[1].components,
        }
      }
      
      // Fallback for unknown blends
      return {
        sku,
        name: `Blend ${doseMg}mg`,
        peptideId: null,
        doseMg,
        volumeMl,
        category: 'blend',
        isBlend: true,
      }
    }
  }
  
  // Check for GLP-1 variants (special format)
  const glpMatch = sku.match(/^(GLP-1-[A-Z0-9]+)-(\d+MG)-(\d+ML)$/i)
  if (glpMatch) {
    const peptideKey = glpMatch[1].toUpperCase()
    const doseStr = glpMatch[2]
    const volumeStr = glpMatch[3]
    
    const peptideId = PEPTIDE_ID_MAP[peptideKey] || peptideKey.toLowerCase()
    const doseMg = parseDose(doseStr)
    const volumeMl = parseVolume(volumeStr)
    const displayName = PEPTIDE_DISPLAY_NAMES[peptideId] || peptideKey
    const category = PEPTIDE_CATEGORY_MAP[peptideId] || 'metabolic'
    
    return {
      sku,
      name: `${displayName} ${doseMg}mg`,
      peptideId,
      doseMg,
      volumeMl,
      category,
      isBlend: false,
    }
  }
  
  // Standard SKU format: NAME-DOSE-VOLUME
  const standardMatch = sku.match(/^([A-Z0-9+\-]+)-\.?(\d+(?:\.\d+)?MG)-(\d+ML)$/i)
  if (standardMatch) {
    const peptideKey = standardMatch[1].toUpperCase()
    const doseStr = standardMatch[2]
    const volumeStr = standardMatch[3]
    
    // Handle special case for IGF1LR3 with decimal dose
    const fullDoseStr = sku.includes('-.') ? '.' + doseStr : doseStr
    
    const peptideId = PEPTIDE_ID_MAP[peptideKey] || peptideKey.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const doseMg = parseDose(fullDoseStr)
    const volumeMl = parseVolume(volumeStr)
    const displayName = PEPTIDE_DISPLAY_NAMES[peptideId] || peptideKey
    const category = PEPTIDE_CATEGORY_MAP[peptideId] || 'bioregulator'
    
    return {
      sku,
      name: `${displayName} ${doseMg}mg`,
      peptideId,
      doseMg,
      volumeMl,
      category,
      isBlend: false,
    }
  }
  
  // Fallback
  return {
    sku,
    name: sku,
    peptideId: null,
    doseMg: 0,
    volumeMl: 0,
    category: 'bioregulator',
    isBlend: false,
  }
}

// Raw SKU list from the user
const RAW_SKUS = [
  '5AMINO1MQ-5MG-03ML',
  '5AMINO1MQ-50MG-03ML',
  '5AMINO1MQ-50MG-05ML',
  'AOD9604-05MG-03ML',
  'AOD9604-10MG-03ML',
  'BLND-AOD9604CJC1295IPAMORELIN-10X05X05MG-03ML',
  'ARA290-10MG-03ML',
  'BACWATER-30ML',
  'BPC157-05MG-03ML',
  'BPC157-10MG-03ML',
  'BPC157-15MG-03ML',
  'BPC157-15MG-05ML',
  'BLND-GLOW-BPC157GHKCUTB500-10X50X10MG-03ML',
  'BLND-GLOW+BPC157GHKCUTB500-10X70X10MG-05ML',
  'BLND-KLOW-BPC157GHKCUKPVTB500-10X50X10X10MG-03ML',
  'BLND-KLOW+BPC157GHKCUKPVTB500-10X70X10X10MG-05ML',
  'BLND-WOLVERINE-BPC157TB500-05X05MG-03ML',
  'BLND-WOLVERINE-BPC157TB500-10X10MG-03ML',
  'BLND-WOLVERINE-BPC157TB500-10X10MG-05ML',
  'GLP-1-C-5MG-03ML',
  'GLP-1-C-10MG-03ML',
  'BLND-GLP-1-C1S-2.5X2.5MG-03ML',
  'BLND-GLP-1-C1S-5X5MG-03ML',
  'BLND-GLP-1-C1S-10X10MG-03ML',
  'CJC1295-05MG-03ML',
  'CJC1295-10MG-03ML',
  'CJC1295-15MG-05ML',
  'BLND-CJC1295WITHDAC-5MG-03ML',
  'BLND-CJC1295IPAMORELIN-05X05MG-03ML',
  'BLND-CJC1295IPAMORELIN-10X10MG-03ML',
  'BLND-CJC1295IPAMORELIN-12X06MG-05ML',
  'DSIP-05MG-03ML',
  'DSIP-10MG-03ML',
  'DSIP-15MG-03ML',
  'EPITHALON-10MG-03ML',
  'EPITHALON-50MG-03ML',
  'EPITHALON-50MG-05ML',
  'FOLLISTATIN-01MG-03ML',
  'GHKCU-50MG-03ML',
  'GHKCU-100MG-03ML',
  'GHKCU-70MG-05ML',
  'GHRP2-5MG-03ML',
  'GHRP2-10MG-03ML',
  'GHRP6-5MG-03ML',
  'GHRP6-10MG-03ML',
  'GONADORELIN-02MG-03ML',
  'HEXARELIN-02MG-03ML',
  'HEXARELIN-05MG-03ML',
  'IGF1LR3-.01MG-03ML',
  'IGF1LR3-01MG-03ML',
  'IGF1LR3-01MG-05ML',
  'IPAMORELIN-05MG-03ML',
  'IPAMORELIN-10MG-03ML',
  'IPAMORELIN-15MG-05ML',
  'BLND-IPAMORELINSERMORELIN-05X05MG-03ML',
  'BLND-IPAMORELINSERMORELIN-10X10MG-03ML',
  'KISSPEPTIN-05MG-03ML',
  'KISSPEPTIN-10MG-03ML',
  'KPV-5MG-03ML',
  'KPV-10MG-03ML',
  'LC120-10MG-03ML',
  'LL37-05MG-03ML',
  'GLP-1-1MZ-5MG-03ML',
  'GLP-1-1MZ-10MG-03ML',
  'MGF-2MG-03ML',
  'MOTSC-10MG-03ML',
  'MOTSC-40MG-03ML',
  'MOTSC-50MG-05ML',
  'MELANOTAN1-10MG-03ML',
  'MT2(MELANOTAN2ACETATE)-10MG-03ML',
  'NAD+-500MG-10ML',
  'NAD+-1000MG-10ML',
  'OXYTOCIN-02MG-03ML',
  'PEGMGF-02MG-03ML',
  'PINEALON-05MG-03ML',
  'PINEALON-10MG-03ML',
  'PINEALON-20MG-03ML',
  'PT141-10MG-03ML',
  'BLND-PT141KISSPEPTINPINEALON-5X2X3MG-05ML',
  'GLP-1-3R-5MG-03ML',
  'GLP-1-3R-10MG-03ML',
  'GLP-1-3R-15MG-03ML',
  'GLP-1-3R-20MG-03ML',
  'GLP-1-3R-30MG-03ML',
  'GLP-1-3R-30MG-05ML',
  'GLP-1-3R-40MG-03ML',
  'GLP-1-3R-50MG-03ML',
  'GLP-1-3R-60MG-03ML',
  'GLP-1-3R-100MG-10ML',
  'SELANK-5MG-03ML',
  'SELANK-11MG-03ML',
  'BLND-SELANKSEMAX-05X05MG-03ML',
  'GLP-1-1S-05MG-03ML',
  'GLP-1-1S-10MG-03ML',
  'GLP-1-1S-15MG-03ML',
  'GLP-1-1S-20MG-03ML',
  'GLP-1-1S-30MG-03ML',
  'SEMAX-5MG-03ML',
  'SEMAX-11MG-03ML',
  'SERMORELIN-5MG-03ML',
  'SERMORELIN-10MG-03ML',
  'SERMORELIN-09MG-05ML',
  'SNAP8-10MG-03ML',
  'SS31-10MG-03ML',
  'SS31-50MG-03ML',
  'SLU-PP-332-5MG-3ML',
  'GLP-1-SV-10MG-03ML',
  'TB500-5MG-03ML',
  'TB500-10MG-03ML',
  'TB500-15MG-05ML',
  'TESAMORELIN-5MG-03ML',
  'TESAMORELIN-10MG-03ML',
  'TESAMORELIN-20MG-03ML',
  'TESAMORELIN-15MG-5ML',
  'BLND-TESAMORELINIPAMORELIN-12X6-05ML',
  'BLND-TESAMORELINIPAMORELIN-10X10MG-03ML',
  'THYMALIN-10MG-03ML',
  'THYMOSINALPHA1-5MG-03ML',
  'THYMOSINALPHA1-10MG-03ML',
  'BLND-THYMOSINALPHA1THYMULIN-10X6MG-05ML',
  'GLP-1-2T-05MG-03ML',
  'GLP-1-2T-10MG-03ML',
  'GLP-1-2T-15MG-03ML',
  'GLP-1-2T-20MG-03ML',
  'GLP-1-2T-30MG-03ML',
  'GLP-1-2T-40MG-03ML',
  'GLP-1-2T-45MG-03ML',
  'GLP-1-2T-50MG-03ML',
  'GLP-1-2T-60MG-03ML',
  'GLP-1-2T-60MG-05ML',
  'GLP-1-2T-100MG-10ML',
  'VIP-05MG-03ML',
  'VIP-10MG-03ML',
  // Wellness Supplements
  'WELLNESS-RE-GEN-129.99',
  'WELLNESS-ULT-GI-219.99',
  'WELLNESS-WOLVERINE-219.99',
  'WELLNESS-GHK-CU-139.99',
  'WELLNESS-TOTAL-RECOMP-199.99',
  'WELLNESS-NEURO-REGEN-249.99',
  'WELLNESS-AC-FRAG-109.99',
  'WELLNESS-KPV-109.99',
  'WELLNESS-LARAZOTIDE-149.99',
  'WELLNESS-LONGEVITY-249.99',
  'WELLNESS-CREVOLUTION-59.99',
  'WELLNESS-MAG-THREONATE-54.99',
  'WELLNESS-PEA-39.99',
  'WELLNESS-GI-REPAIR-209.99',
  'WELLNESS-HISTA-RESIST-89.99',
  'WELLNESS-TUDCA-500-79.99',
  'WELLNESS-TRIBUTYRIN-64.99',
  'WELLNESS-TUDCA-OXBILE-69.99',
  'WELLNESS-ZINC-CARNOSINE-39.99',
  'WELLNESS-TUDCA-250-49.99',
  'WELLNESS-BOTANABOLIC-114.99',
  'WELLNESS-LIVER-COMPLEX-109.99',
  'WELLNESS-TURKESTERONE-62.99',
  'WELLNESS-DHM-69.99',
  'WELLNESS-BPC157-DOUBLE-169.99',
]

// Parse all SKUs into products
export const PRODUCT_CATALOG: ShopProduct[] = RAW_SKUS.map(parseSku)

// Add sample pricing for testing (prices in USD)
// NOTE: These are test prices for development. Update with real pricing.
const SAMPLE_PRICES: Record<string, number> = {
  'BPC157-05MG-03ML': 89.00,
  'BPC157-10MG-03ML': 149.00,
  'TB500-5MG-03ML': 99.00,
  'TB500-10MG-03ML': 169.00,
  'IPAMORELIN-05MG-03ML': 79.00,
  'IPAMORELIN-10MG-03ML': 139.00,
  'CJC1295-05MG-03ML': 79.00,
  'CJC1295-10MG-03ML': 139.00,
  'GHKCU-50MG-03ML': 69.00,
  'GHKCU-100MG-03ML': 119.00,
  'NAD+-500MG-10ML': 199.00,
  'NAD+-1000MG-10ML': 349.00,
  'BLND-WOLVERINE-BPC157TB500-05X05MG-03ML': 169.00,
  'BLND-WOLVERINE-BPC157TB500-10X10MG-03ML': 289.00,
  'BLND-CJC1295IPAMORELIN-05X05MG-03ML': 149.00,
  'BLND-CJC1295IPAMORELIN-10X10MG-03ML': 259.00,
  'BACWATER-30ML': 15.00,
}

// Apply sample prices to products
PRODUCT_CATALOG.forEach(product => {
  if (SAMPLE_PRICES[product.sku]) {
    product.priceUsd = SAMPLE_PRICES[product.sku]
  }
})

// Fix specific parsing issues
// Handle bacteriostatic water (no standard format)
const bacWaterIndex = PRODUCT_CATALOG.findIndex(p => p.sku === 'BACWATER-30ML')
if (bacWaterIndex >= 0) {
  PRODUCT_CATALOG[bacWaterIndex] = {
    sku: 'BACWATER-30ML',
    name: 'Bacteriostatic Water 30ml',
    peptideId: 'bacteriostatic-water',
    doseMg: 0,
    volumeMl: 30,
    category: 'accessory',
    isBlend: false,
  }
}

// Handle MT2 with parentheses
const mt2Index = PRODUCT_CATALOG.findIndex(p => p.sku.includes('MT2'))
if (mt2Index >= 0) {
  PRODUCT_CATALOG[mt2Index] = {
    sku: 'MT2(MELANOTAN2ACETATE)-10MG-03ML',
    name: 'Melanotan-2 10mg',
    peptideId: 'melanotan-2',
    doseMg: 10,
    volumeMl: 0.3,
    category: 'hormonal',
    isBlend: false,
  }
}

// Handle SLU-PP-332 with different format
const sluIndex = PRODUCT_CATALOG.findIndex(p => p.sku.includes('SLU-PP-332'))
if (sluIndex >= 0) {
  PRODUCT_CATALOG[sluIndex] = {
    sku: 'SLU-PP-332-5MG-3ML',
    name: 'SLU-PP-332 5mg',
    peptideId: 'slu-pp-332',
    doseMg: 5,
    volumeMl: 3,
    category: 'metabolic',
    isBlend: false,
  }
}

// Handle Tesamorelin blend with non-standard format
const tesamorelinBlendIndex = PRODUCT_CATALOG.findIndex(p => p.sku === 'BLND-TESAMORELINIPAMORELIN-12X6-05ML')
if (tesamorelinBlendIndex >= 0) {
  PRODUCT_CATALOG[tesamorelinBlendIndex] = {
    sku: 'BLND-TESAMORELINIPAMORELIN-12X6-05ML',
    name: 'Tesamorelin + Ipamorelin Blend 12mg + 6mg',
    peptideId: null,
    doseMg: 12,
    volumeMl: 0.5,
    category: 'growth_factor',
    isBlend: true,
    blendComponents: ['tesamorelin', 'ipamorelin'],
  }
}

// Helper functions for the catalog

/**
 * Get all products in the catalog
 */
export function getAllProducts(): ShopProduct[] {
  return PRODUCT_CATALOG
}

/**
 * Get a product by SKU
 */
export function getProductBySku(sku: string): ShopProduct | null {
  return PRODUCT_CATALOG.find(p => p.sku === sku) || null
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: ProductCategory): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.category === category)
}

/**
 * Get products by peptide ID (all sizes/volumes of a peptide)
 */
export function getProductsByPeptideId(peptideId: string): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.peptideId === peptideId)
}

/**
 * Search products by name
 */
export function searchProducts(query: string): ShopProduct[] {
  const normalizedQuery = query.toLowerCase()
  return PRODUCT_CATALOG.filter(p => 
    p.name.toLowerCase().includes(normalizedQuery) ||
    p.sku.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Get all blends
 */
export function getBlends(): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.isBlend)
}

/**
 * Get unique peptide IDs in the catalog (for filtering)
 */
export function getUniquePeptideIds(): string[] {
  const ids = new Set<string>()
  PRODUCT_CATALOG.forEach(p => {
    if (p.peptideId) ids.add(p.peptideId)
  })
  return Array.from(ids)
}

/**
 * Get category display name
 */
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

/**
 * Get all categories with product counts
 */
export function getCategoriesWithCounts(): { category: ProductCategory; count: number; displayName: string }[] {
  const categories: ProductCategory[] = ['wellness_supplement', 'metabolic', 'growth_factor', 'repair', 'bioregulator', 'neuropeptide', 'immune', 'hormonal', 'blend', 'accessory']
  return categories.map(category => ({
    category,
    count: getProductsByCategory(category).length,
    displayName: getCategoryDisplayName(category),
  })).filter(c => c.count > 0)
}

// ===========================================
// HSA/FSA LMN ELIGIBILITY
// ===========================================

// Categories excluded from Letter of Medical Necessity (non-medical items)
const LMN_EXCLUDED_CATEGORIES: ProductCategory[] = ['accessory']

/**
 * Check if a product is eligible for Letter of Medical Necessity (HSA/FSA)
 * All peptide products are eligible, accessories are not
 */
export function isLmnEligible(product: ShopProduct): boolean {
  return !LMN_EXCLUDED_CATEGORIES.includes(product.category)
}

/**
 * Check if a category is LMN-eligible
 */
export function isLmnEligibleCategory(category: ProductCategory): boolean {
  return !LMN_EXCLUDED_CATEGORIES.includes(category)
}

/**
 * Get all LMN-eligible products
 */
export function getLmnEligibleProducts(): ShopProduct[] {
  return PRODUCT_CATALOG.filter(isLmnEligible)
}
