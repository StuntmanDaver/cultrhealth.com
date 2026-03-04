// Mapping from Product Catalog IDs to Asher Med Medication IDs
// This maps the 160+ products in the catalog to the ~12 medications Asher Med accepts

export const PRODUCT_TO_ASHER_MED_MAP: Record<string, string | null> = {
  // GLP-1 Medications
  'glp1-tirzepatide': 'tirzepatide',
  'glp1-semaglutide': 'semaglutide',
  'glp1-retatrutide': null, // Not supported by Asher Med yet
  'glp1-cagrilintide': null, // Not supported
  'glp1-mz': null, // Not supported
  'glp1-sv': null, // Not supported

  // Metabolic
  '5-amino-1mq': null, // Not supported
  'aod-9604': 'aod9604', // Note: no hyphen in Asher Med ID
  'mots-c': 'mots-c',

  // Growth Factors
  'sermorelin': 'sermorelin',
  'ipamorelin': null, // Not supported as standalone
  'cjc-1295': null, // Not supported as standalone
  'cjc-1295-dac': null, // Not supported
  'tesamorelin': null, // Not supported
  'hexarelin': null, // Not supported
  'ghrp-2': null, // Not supported
  'ghrp-6': null, // Not supported
  'igf1-lr3': null, // Not supported
  'mgf': null, // Not supported
  'peg-mgf': null, // Not supported
  'follistatin-344': null, // Not supported

  // Repair & Recovery
  'bpc-157': 'bpc157-tb500', // Combined in Asher Med
  'tb-500': 'bpc157-tb500', // Combined in Asher Med
  'ghk-cu': 'ghk-cu',

  // Bioregulators
  'nad-plus': 'nad-plus',
  'epitalon': null, // Not supported
  'dsip': null, // Not supported
  'thymalin': null, // Not supported
  'pinealon': null, // Not supported
  'elamipretide': null, // Not supported (SS-31)

  // Neuropeptides
  'semax': 'semax-selank', // Combined in Asher Med
  'selank': 'semax-selank', // Combined in Asher Med

  // Immune
  'thymosin-alpha1': null, // Not supported
  'll-37': null, // Not supported
  'kpv': null, // Not supported
  'thymulin': null, // Not supported

  // Hormonal
  'pt-141': null, // Not supported
  'melanotan-2': null, // Not supported
  'melanotan-1': null, // Not supported
  'gonadorelin': null, // Not supported
  'kisspeptin-10': null, // Not supported
  'oxytocin': null, // Not supported
  'vip': null, // Not supported

  // Lipotropics
  'lipo-b': 'lipo-b',
  'lipo-c': 'lipo-c',
  'lc-120': null, // Not supported

  // Other
  'glutathione': 'glutathione',
  'ara-290': null, // Not supported
  'slu-pp-332': null, // Not supported
  'snap-8': null, // Not supported
};

/**
 * Get Asher Med medication ID from product catalog ID
 * Returns null if the product is not supported by Asher Med
 */
export function getAsherMedIdFromProductId(productId: string): string | null {
  return PRODUCT_TO_ASHER_MED_MAP[productId] ?? null;
}

/**
 * Check if a product is supported by Asher Med
 */
export function isProductSupportedByAsherMed(productId: string): boolean {
  return PRODUCT_TO_ASHER_MED_MAP[productId] !== undefined && PRODUCT_TO_ASHER_MED_MAP[productId] !== null;
}

/**
 * Get list of all product IDs that ARE supported by Asher Med
 */
export function getSupportedProductIds(): string[] {
  return Object.entries(PRODUCT_TO_ASHER_MED_MAP)
    .filter(([_, asherMedId]) => asherMedId !== null)
    .map(([productId]) => productId);
}
