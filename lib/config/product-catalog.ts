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

// Parse a single SKU into a product
function parseSku(sku: string): ShopProduct {
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
]

// Parse all SKUs into products
export const PRODUCT_CATALOG: ShopProduct[] = RAW_SKUS.map(parseSku)

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
  }
  return names[category]
}

/**
 * Get all categories with product counts
 */
export function getCategoriesWithCounts(): { category: ProductCategory; count: number; displayName: string }[] {
  const categories: ProductCategory[] = ['metabolic', 'growth_factor', 'repair', 'bioregulator', 'neuropeptide', 'immune', 'hormonal', 'blend', 'accessory']
  return categories.map(category => ({
    category,
    count: getProductsByCategory(category).length,
    displayName: getCategoryDisplayName(category),
  })).filter(c => c.count > 0)
}
