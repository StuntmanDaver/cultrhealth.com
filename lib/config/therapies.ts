export interface TherapyProduct {
  id: string;
  name: string;
  spec: string;
  tag?: string;
  image: string;
  shortDescription: string;
  longDescription: string;
  bundleWith?: string;
}

export const THERAPY_PRODUCTS: TherapyProduct[] = [
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    spec: '5 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'GLP-1 receptor agonist for appetite suppression, blood sugar regulation, and sustainable weight loss.',
    longDescription:
      'Semaglutide mimics the GLP-1 hormone to slow gastric emptying, reduce hunger signals, and improve insulin sensitivity. Clinical trials demonstrate average weight loss of 15-20% of body weight over 68 weeks, with additional cardiovascular and metabolic benefits.',
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/tirzepatide-glp1-gip.png',
    shortDescription:
      'Dual GIP/GLP-1 receptor agonist for powerful appetite suppression and blood sugar regulation.',
    longDescription:
      'Tirzepatide activates both GIP and GLP-1 receptors for enhanced metabolic control beyond single-agonist therapies. Studies show up to 22.5% body weight reduction with significant improvements in A1C, triglycerides, and blood pressure.',
  },
  {
    id: 'r3ta',
    name: 'R3TA',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1/GIP/GCG',
    image: '/images/products/r3ta-glp1-gip-gcg.png',
    shortDescription:
      'Triple-agonist GIP/GLP-1/glucagon receptor peptide for advanced metabolic support and significant weight management.',
    longDescription:
      'R3TA is a next-generation triple-agonist that targets GLP-1, GIP, and glucagon receptors simultaneously. The glucagon component adds thermogenic fat burning and liver fat reduction, offering the most comprehensive metabolic optimization available in a single peptide.',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-CU',
    spec: '100 MG | 3 ML',
    tag: 'Copper Peptide',
    image: '/images/products/ghk-cu.png',
    shortDescription:
      'Copper peptide that stimulates collagen synthesis, accelerates wound healing, and promotes skin rejuvenation.',
    longDescription:
      'GHK-Cu is a naturally occurring copper-binding peptide that declines with age. It activates over 4,000 genes involved in tissue remodeling, anti-inflammatory response, and antioxidant defense. Benefits include improved skin elasticity, accelerated wound healing, and reduced fine lines.',
    bundleWith: 'glutathione',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    spec: 'Injectable',
    tag: 'Antioxidant',
    image: '/images/products/glutathione.png',
    shortDescription:
      'Master antioxidant supporting detoxification, immune defense, and cellular protection against oxidative stress.',
    longDescription:
      'Glutathione is the body\'s most abundant endogenous antioxidant, essential for Phase II liver detoxification, immune cell activation, and neutralizing reactive oxygen species. Injectable delivery bypasses digestive breakdown for superior bioavailability, supporting skin clarity, heavy metal chelation, and systemic cellular protection.',
    bundleWith: 'ghk-cu',
  },
  {
    id: 'tesa-ipa',
    name: 'TESA/IPA',
    spec: '12/6 MG | 5 ML',
    tag: 'Growth Hormone',
    image: '/images/products/tesa-ipa.png',
    shortDescription:
      'Powerful GH combination targeting visceral fat reduction with clean growth hormone amplification.',
    longDescription:
      'Tesamorelin (GHRH analog) and Ipamorelin (selective GHRP) work synergistically to stimulate natural growth hormone release without cortisol or prolactin elevation. This combination is particularly effective for reducing visceral adipose tissue, improving body composition, and enhancing recovery.',
  },
  {
    id: 'cjc1295-ipa',
    name: 'CJC1295/IPA',
    spec: '10/10 MG | 3 ML',
    tag: 'Growth Hormone',
    image: '/images/products/cjc1295-ipa.png',
    shortDescription:
      'Gold-standard GH stack combining GHRH and GHRP pathways for amplified growth hormone release.',
    longDescription:
      'CJC-1295 extends growth hormone releasing hormone activity with a 6-8 day half-life, while Ipamorelin provides clean, pulsatile GH release. Together they amplify natural GH secretion for improved sleep quality, faster recovery, enhanced fat metabolism, and lean muscle preservation.',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    spec: '1000 MG | 10 ML',
    tag: 'Longevity',
    image: '/images/products/nad-plus.png',
    shortDescription:
      'Essential coenzyme that supports cellular energy production, DNA repair, and healthy aging.',
    longDescription:
      'NAD+ levels decline approximately 50% between ages 40 and 60. Restoring NAD+ activates sirtuins (longevity genes), supports mitochondrial function, and enhances DNA repair mechanisms. Patients commonly report improved mental clarity, sustained energy, and better exercise recovery.',
  },
  {
    id: 'semax-selank',
    name: 'Semax/Selank',
    spec: '5/5 MG | 3 ML',
    tag: 'Neuropeptide',
    image: '/images/products/semax-selank.png',
    shortDescription:
      'Nootropic blend combining anxiolytic and cognitive-enhancing neuropeptides for focus and stress resilience.',
    longDescription:
      'Semax enhances BDNF production and dopaminergic activity for improved focus and cognitive performance, while Selank modulates GABA and serotonin for anxiolytic effects without sedation. This synergistic stack supports mental clarity, emotional resilience, and neuroprotection.',
  },
  {
    id: 'bpc157-tb500',
    name: 'BPC157/TB500',
    spec: '10/10 MG | 3 ML',
    tag: 'Repair',
    image: '/images/products/bpc157-tb500.png',
    shortDescription:
      'Synergistic repair blend combining tissue healing and anti-inflammatory action for accelerated recovery.',
    longDescription:
      'BPC-157 (Body Protection Compound) promotes gut healing, tendon repair, and angiogenesis, while TB-500 (Thymosin Beta-4) reduces inflammation and supports tissue migration and regeneration. Together they provide comprehensive systemic repair for injuries, post-surgical recovery, and chronic inflammation.',
  },
  {
    id: 'melanotan-2',
    name: 'Melanotan 2 (MT2)',
    spec: '10 MG | 3 ML',
    tag: 'Melanocortin',
    image: '/images/products/melanotan2-mt2.png',
    shortDescription:
      'Melanocortin agonist that promotes tanning, may reduce appetite, and supports libido enhancement.',
    longDescription:
      'Melanotan 2 activates melanocortin receptors (MC1R-MC5R) to stimulate melanogenesis for UV-protective tanning with less sun exposure. Additional effects include appetite modulation and enhanced libido through MC4R activation. Low-dose protocols minimize side effects while maintaining cosmetic benefits.',
  },
];
