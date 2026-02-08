'use client';

import { useState } from 'react';
import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import {
  getAllProducts,
  getCategoriesWithCounts,
  getProductsByCategory,
  getCategoryDisplayName,
  type ShopProduct,
  type ProductCategory,
} from '@/lib/config/product-catalog';
import { isProductSupportedByAsherMed } from '@/lib/config/product-to-asher-mapping';
import { ChevronDown, Check, Info, Pill, Sparkles, ShoppingCart, X, Plus } from 'lucide-react';

// Category descriptions for context
const CATEGORY_DESCRIPTIONS: Record<ProductCategory, string> = {
  metabolic: 'Support weight management and metabolic health with GLP-1 agonists and metabolic peptides.',
  growth_factor: 'Enhance natural growth hormone production for recovery, muscle development, and anti-aging.',
  repair: 'Accelerate tissue healing, reduce inflammation, and support overall recovery.',
  bioregulator: 'Optimize cellular function and promote longevity through targeted bioactive peptides.',
  neuropeptide: 'Support cognitive function, mood regulation, and neurological health.',
  immune: 'Strengthen immune response and promote healthy inflammatory pathways.',
  hormonal: 'Support hormonal balance and optimize endocrine function.',
  blend: 'Synergistic combinations of peptides for enhanced therapeutic effects.',
  accessory: 'Essential supplies for peptide preparation and administration.',
  wellness_supplement: 'Premium supplements for comprehensive health optimization.',
};

// Category icons
const CATEGORY_ICONS: Record<ProductCategory, React.ReactNode> = {
  metabolic: <Sparkles className="w-4 h-4" />,
  growth_factor: <Sparkles className="w-4 h-4" />,
  repair: <Pill className="w-4 h-4" />,
  bioregulator: <Pill className="w-4 h-4" />,
  neuropeptide: <Sparkles className="w-4 h-4" />,
  immune: <Pill className="w-4 h-4" />,
  hormonal: <Pill className="w-4 h-4" />,
  blend: <Sparkles className="w-4 h-4" />,
  accessory: <Pill className="w-4 h-4" />,
  wellness_supplement: <Sparkles className="w-4 h-4" />,
};

// Extended product descriptions
const PRODUCT_DESCRIPTIONS: Record<string, { short: string; details: string }> = {
  // GLP-1 & Metabolic
  'glp1-tirzepatide': {
    short: 'Dual GIP/GLP-1 receptor agonist',
    details: 'Tirzepatide is a first-in-class dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist. It provides superior weight loss results compared to single-agonist alternatives, with studies showing 15-20% body weight reduction.',
  },
  'glp1-semaglutide': {
    short: 'GLP-1 receptor agonist for weight management',
    details: 'Semaglutide mimics the GLP-1 hormone to regulate appetite and blood sugar. FDA-approved for chronic weight management, it helps reduce food cravings and promotes satiety, typically resulting in 10-15% body weight loss.',
  },
  'glp1-retatrutide': {
    short: 'Triple hormone receptor agonist',
    details: 'Retatrutide targets GIP, GLP-1, and glucagon receptors simultaneously. This triple-agonist approach shows promising results for metabolic health and weight management in clinical trials.',
  },
  '5-amino-1mq': {
    short: 'Metabolic optimization compound',
    details: '5-Amino-1MQ inhibits NNMT enzyme activity, which can help shift metabolism toward increased fat burning and improved energy utilization. Research suggests benefits for metabolic health and body composition.',
  },
  'aod-9604': {
    short: 'Fat-burning peptide fragment',
    details: 'AOD-9604 is a modified fragment of human growth hormone specifically targeting fat metabolism. It stimulates lipolysis without the negative effects on blood sugar or cell proliferation.',
  },
  'mots-c': {
    short: 'Mitochondrial peptide',
    details: 'MOTS-c is a mitochondrial-derived peptide that regulates metabolic homeostasis. It enhances glucose uptake, improves insulin sensitivity, and may support healthy aging and exercise capacity.',
  },
  // Growth Factors
  'sermorelin': {
    short: 'Growth hormone releasing peptide',
    details: 'Sermorelin stimulates the pituitary gland to produce and release growth hormone naturally. Benefits include improved sleep quality, enhanced recovery, increased lean muscle mass, and reduced body fat.',
  },
  'ipamorelin': {
    short: 'Selective GH secretagogue',
    details: 'Ipamorelin is one of the cleanest growth hormone releasing peptides with minimal side effects. It provides consistent GH release without significantly affecting cortisol or appetite.',
  },
  'cjc-1295': {
    short: 'GHRH analog peptide',
    details: 'CJC-1295 extends the half-life of growth hormone releasing hormone, providing sustained GH elevation. Often combined with Ipamorelin for synergistic effects on recovery and body composition.',
  },
  'tesamorelin': {
    short: 'FDA-approved GHRH analog',
    details: 'Tesamorelin is FDA-approved for reducing visceral fat. It stimulates natural growth hormone production and has been extensively studied for its safety profile and efficacy.',
  },
  // Repair & Recovery
  'bpc-157': {
    short: 'Body protection compound',
    details: 'BPC-157 is a gastric pentadecapeptide with remarkable healing properties. It accelerates wound healing, promotes tendon and ligament repair, protects against organ damage, and supports gut health.',
  },
  'tb-500': {
    short: 'Thymosin Beta-4 fragment',
    details: 'TB-500 promotes tissue repair and regeneration throughout the body. It enhances cell migration, reduces inflammation, and supports healing of muscles, tendons, and other tissues.',
  },
  'ghk-cu': {
    short: 'Copper peptide complex',
    details: 'GHK-Cu promotes wound healing, collagen synthesis, and skin regeneration. It has potent anti-inflammatory effects and supports tissue remodeling for both internal healing and cosmetic benefits.',
  },
  // Bioregulators
  'nad-plus': {
    short: 'Cellular energy coenzyme',
    details: 'NAD+ is essential for cellular energy production and DNA repair. Supplementation supports healthy aging, cognitive function, energy levels, and metabolic health.',
  },
  'epitalon': {
    short: 'Telomerase activator',
    details: 'Epitalon is a tetrapeptide that activates telomerase, potentially slowing cellular aging. Research suggests benefits for longevity, immune function, and overall cellular health.',
  },
  'dsip': {
    short: 'Delta sleep-inducing peptide',
    details: 'DSIP promotes deep, restorative sleep and helps normalize sleep patterns. It may also have stress-protective and pain-reducing properties.',
  },
  // Neuropeptides
  'semax': {
    short: 'Cognitive enhancement peptide',
    details: 'Semax is a neuropeptide with nootropic and neuroprotective effects. It enhances memory, focus, and mental clarity while supporting BDNF production for brain health.',
  },
  'selank': {
    short: 'Anxiolytic neuropeptide',
    details: 'Selank reduces anxiety and promotes calm without sedation. It modulates the immune system, enhances cognitive function, and supports emotional well-being.',
  },
  // Immune
  'thymosin-alpha1': {
    short: 'Immune modulator',
    details: 'Thymosin Alpha-1 enhances immune function by stimulating T-cell production and activity. It supports the body\'s natural defense mechanisms and has been studied for various immune conditions.',
  },
  'll-37': {
    short: 'Antimicrobial peptide',
    details: 'LL-37 is a naturally occurring human antimicrobial peptide with broad-spectrum activity against bacteria, viruses, and fungi. It also modulates inflammation and supports wound healing.',
  },
  'kpv': {
    short: 'Anti-inflammatory peptide',
    details: 'KPV is a potent anti-inflammatory tripeptide derived from alpha-MSH. It supports gut health, reduces inflammation, and promotes tissue healing.',
  },
  // Hormonal
  'pt-141': {
    short: 'Sexual wellness peptide',
    details: 'PT-141 (Bremelanotide) works through the nervous system rather than the vascular system to support sexual function. It\'s FDA-approved for hypoactive sexual desire disorder.',
  },
  'melanotan-2': {
    short: 'Melanocortin peptide',
    details: 'Melanotan-2 stimulates melanin production for tanning and may support libido. It activates melanocortin receptors with effects on pigmentation and sexual function.',
  },
  'gonadorelin': {
    short: 'GnRH agonist',
    details: 'Gonadorelin stimulates the release of luteinizing hormone and follicle-stimulating hormone, supporting natural testosterone production and hormonal balance.',
  },
};

export function MedicationSelector() {
  const { formData, updateFormData } = useIntakeForm();
  const [expandedCategories, setExpandedCategories] = useState<Set<ProductCategory>>(() => new Set(['metabolic'] as ProductCategory[]));
  const [hoveredProduct, setHoveredProduct] = useState<ShopProduct | null>(null);

  const categories = getCategoriesWithCounts();
  const allProducts = getAllProducts();

  // Get selected medications array (with backwards compatibility)
  const selectedMedications = formData.selectedMedications || (formData.selectedMedication ? [formData.selectedMedication] : []);

  // Get unique products by peptideId (consolidate multiple dosages)
  // Filter to only show Asher Med supported products
  const getUniqueProductsForCategory = (category: ProductCategory): ShopProduct[] => {
    const products = getProductsByCategory(category);
    const seen = new Set<string>();
    const unique: ShopProduct[] = [];

    for (const product of products) {
      const key = product.peptideId || product.sku;
      // Only include products supported by Asher Med
      if (!seen.has(key) && product.peptideId && isProductSupportedByAsherMed(product.peptideId)) {
        seen.add(key);
        unique.push(product);
      }
    }

    return unique;
  };

  const toggleCategory = (category: ProductCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleProductSelection = (product: ShopProduct) => {
    const productId = product.peptideId || product.sku;
    const currentSelections = [...selectedMedications];
    const index = currentSelections.indexOf(productId);

    if (index > -1) {
      // Remove from selection
      currentSelections.splice(index, 1);
    } else {
      // Add to selection
      currentSelections.push(productId);
    }

    updateFormData({ selectedMedications: currentSelections });
  };

  const removeFromCart = (productId: string) => {
    const currentSelections = selectedMedications.filter(id => id !== productId);
    updateFormData({ selectedMedications: currentSelections });
  };

  const isSelected = (product: ShopProduct) => {
    const productId = product.peptideId || product.sku;
    return selectedMedications.includes(productId);
  };

  const getProductDescription = (product: ShopProduct) => {
    const key = product.peptideId || '';
    return PRODUCT_DESCRIPTIONS[key] || {
      short: product.description || product.name,
      details: product.description || `${product.name} - Available in multiple dosages for personalized treatment.`,
    };
  };

  const getProductByIdOrSku = (id: string): ShopProduct | undefined => {
    return allProducts.find(p => (p.peptideId || p.sku) === id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Product Selection Accordion */}
      <div className="flex-1 space-y-3">
        <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
          <p className="text-sm text-forest-muted">Pick what interests you. Your provider finalizes your protocol after reviewing labs.</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-forest-muted">
            Select one or more products for your treatment protocol. Click on products to add them to your selection.
          </p>
        </div>

        {categories.map(({ category, count, displayName }) => {
          const isExpanded = expandedCategories.has(category);
          const products = getUniqueProductsForCategory(category);
          const selectedInCategory = products.filter(p => isSelected(p)).length;

          return (
            <div
              key={category}
              className="border border-forest-light/20 rounded-xl overflow-hidden bg-white"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={`
                  w-full flex items-center justify-between p-4 text-left transition-all
                  ${isExpanded ? 'bg-forest text-white' : 'bg-white hover:bg-cream text-forest'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${isExpanded ? 'bg-mint/30' : 'bg-mint'}
                  `}>
                    {CATEGORY_ICONS[category]}
                  </span>
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className={`text-xs ${isExpanded ? 'text-mint' : 'text-forest-muted'}`}>
                      {count} products {selectedInCategory > 0 && (
                        <span className={`ml-1 ${isExpanded ? 'text-white' : 'text-forest'}`}>
                          ({selectedInCategory} selected)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Category Description */}
              {isExpanded && (
                <div className="px-4 py-3 bg-mint/30 border-b border-forest-light/10">
                  <p className="text-sm text-forest-muted">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
              )}

              {/* Products List */}
              {isExpanded && (
                <div className="divide-y divide-forest-light/10">
                  {products.map((product) => {
                    const desc = getProductDescription(product);
                    const selected = isSelected(product);

                    return (
                      <button
                        key={product.sku}
                        onClick={() => toggleProductSelection(product)}
                        onMouseEnter={() => setHoveredProduct(product)}
                        onMouseLeave={() => setHoveredProduct(null)}
                        className={`
                          w-full flex items-center justify-between p-4 text-left transition-all group
                          ${selected
                            ? 'bg-mint/50 border-l-4 border-l-forest'
                            : 'hover:bg-cream border-l-4 border-l-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <div className={`
                            w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all border-2
                            ${selected
                              ? 'bg-forest border-forest text-white'
                              : 'border-forest-light group-hover:border-forest bg-white'
                            }
                          `}>
                            {selected && <Check className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium truncate ${selected ? 'text-forest' : 'text-forest'}`}>
                                {product.name.split(' ')[0]}
                              </p>
                              {product.isBlend && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-sage text-forest rounded-full">
                                  Blend
                                </span>
                              )}
                              {(product.peptideId?.includes('glp1') || category === 'metabolic') && product.peptideId?.includes('glp1') && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-forest-light/20 text-forest rounded-full">
                                  GLP-1
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-forest-muted truncate">{desc.short}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <Info className={`w-4 h-4 ${selected ? 'text-forest' : 'text-forest-light group-hover:text-forest'}`} />
                          {selected ? (
                            <span className="text-xs text-forest font-medium px-2 py-1 bg-forest/10 rounded">
                              Added
                            </span>
                          ) : (
                            <Plus className="w-4 h-4 text-forest-light group-hover:text-forest" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Description Panel & Cart (Desktop) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-32 space-y-4">
          {/* Hover Description Panel */}
          <div className={`
            rounded-2xl border transition-all duration-300
            ${hoveredProduct
              ? 'border-forest-light/30 bg-white shadow-lg shadow-forest/10'
              : 'border-forest-light/20 bg-cream'
            }
          `}>
            {hoveredProduct ? (
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-bold text-lg text-forest">
                    {hoveredProduct.name.split(' ')[0]}
                  </h3>
                  {hoveredProduct.priceUsd && (
                    <span className="text-forest-light font-medium">
                      ${hoveredProduct.priceUsd.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-forest-muted">
                    {getProductDescription(hoveredProduct).details}
                  </p>

                  <div className="pt-3 border-t border-forest-light/20">
                    <p className="text-xs font-medium text-forest-muted uppercase tracking-wide mb-2">
                      Available Options
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getProductsByCategory(hoveredProduct.category)
                        .filter(p => p.peptideId === hoveredProduct.peptideId)
                        .slice(0, 4)
                        .map(p => (
                          <span
                            key={p.sku}
                            className="px-2 py-1 text-xs bg-mint text-forest rounded-md"
                          >
                            {p.doseMg}mg
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-forest-light/20">
                    <p className="text-xs font-medium text-forest-muted uppercase tracking-wide mb-2">
                      Category
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mint text-forest text-sm rounded-lg">
                      {CATEGORY_ICONS[hoveredProduct.category]}
                      {getCategoryDisplayName(hoveredProduct.category)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-mint flex items-center justify-center">
                  <Info className="w-6 h-6 text-forest-light" />
                </div>
                <p className="text-sm text-forest-muted">
                  Hover over a product to see detailed information
                </p>
              </div>
            )}
          </div>

          {/* Shopping Cart */}
          <div className="rounded-2xl border border-forest-light/20 bg-white overflow-hidden">
            <div className="bg-forest px-4 py-3 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-mint" />
              <h3 className="font-semibold text-white">Your Selection</h3>
              {selectedMedications.length > 0 && (
                <span className="ml-auto bg-mint text-forest text-xs font-bold px-2 py-0.5 rounded-full">
                  {selectedMedications.length}
                </span>
              )}
            </div>

            <div className="p-4">
              {selectedMedications.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-forest-muted">
                    No products selected yet
                  </p>
                  <p className="text-xs text-forest-muted/70 mt-1">
                    Click on products to add them
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMedications.map(productId => {
                    const product = getProductByIdOrSku(productId);
                    if (!product) return null;

                    return (
                      <div
                        key={productId}
                        className="flex items-center justify-between p-2 rounded-lg bg-mint/30 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded bg-forest/10 flex items-center justify-center flex-shrink-0">
                            {CATEGORY_ICONS[product.category]}
                          </div>
                          <span className="text-sm font-medium text-forest truncate">
                            {product.name.split(' ')[0]}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(productId);
                          }}
                          className="p-1 rounded hover:bg-forest/10 text-forest-muted hover:text-forest transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  <div className="pt-3 mt-3 border-t border-forest-light/20">
                    <p className="text-xs text-forest-muted">
                      {selectedMedications.length} product{selectedMedications.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Cart Summary */}
      {selectedMedications.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-forest-light/20 p-4 shadow-lg z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-forest" />
              <span className="font-medium text-forest">
                {selectedMedications.length} product{selectedMedications.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedMedications.slice(0, 3).map(productId => {
                const product = getProductByIdOrSku(productId);
                if (!product) return null;
                return (
                  <span
                    key={productId}
                    className="px-2 py-1 text-xs bg-mint text-forest rounded-full"
                  >
                    {product.name.split(' ')[0]}
                  </span>
                );
              })}
              {selectedMedications.length > 3 && (
                <span className="px-2 py-1 text-xs bg-forest-light/20 text-forest rounded-full">
                  +{selectedMedications.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
