export interface TherapyProduct {
  id: string;
  name: string;
  spec: string;
  tag?: string;
  image: string;
  shortDescription: string;
  longDescription: string;
  bundleWith?: string;
  /** Maps to FDA_STATUSES key in lib/config/compliance.ts */
  fdaStatusId?: string;
  /** Clinical citation key from CLINICAL_CITATIONS */
  citationKey?: string;
}

export const THERAPY_PRODUCTS: TherapyProduct[] = [
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    spec: '5 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'GLP-1 receptor agonist prescribed for appetite regulation, blood sugar support, and weight management when clinically appropriate.',
    longDescription:
      'Semaglutide mimics the GLP-1 hormone to slow gastric emptying, reduce hunger signals, and support insulin sensitivity. In the STEP 1 clinical trial, participants experienced an average of 14.9% body weight reduction over 68 weeks compared to placebo. Individual results vary. Compounded semaglutide is not FDA-approved.',
    fdaStatusId: 'semaglutide',
    citationKey: 'semaglutide-weight-loss',
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1',
    image: '/images/products/tirzepatide-glp1-gip.png',
    shortDescription:
      'Dual GIP/GLP-1 receptor agonist prescribed for appetite regulation and metabolic support when clinically appropriate.',
    longDescription:
      'Tirzepatide activates both GIP and GLP-1 receptors for enhanced metabolic support. In the SURMOUNT-1 trial, participants receiving the highest dose experienced up to 22.5% body weight reduction over 72 weeks compared to placebo. Individual results vary. Compounded tirzepatide is not FDA-approved.',
    fdaStatusId: 'tirzepatide',
    citationKey: 'tirzepatide-weight-loss',
  },
  {
    id: 'r3ta',
    name: 'R3TA',
    spec: '20 MG | 3 ML',
    tag: 'GLP-1/GIP/GCG',
    image: '/images/products/r3ta-glp1-gip-gcg.png',
    shortDescription:
      'Investigational triple-agonist GIP/GLP-1/glucagon receptor peptide. Not FDA-approved. Available when determined clinically appropriate.',
    longDescription:
      'R3TA (retatrutide) is an investigational triple-agonist that targets GLP-1, GIP, and glucagon receptors. In a Phase 2 clinical trial, participants experienced up to 24.2% body weight reduction at the highest dose over 48 weeks. This compound is not FDA-approved and is currently in clinical trials. Individual results vary significantly.',
    fdaStatusId: 'r3ta',
    citationKey: 'retatrutide-weight-loss',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-CU',
    spec: '100 MG | 3 ML',
    tag: 'Copper Peptide',
    image: '/images/products/ghk-cu.png',
    shortDescription:
      'Copper-binding peptide studied for its role in collagen synthesis and skin health. Not FDA-approved.',
    longDescription:
      'GHK-Cu is a naturally occurring copper-binding peptide that declines with age. Published research suggests it may influence gene expression related to tissue remodeling and antioxidant defense. This peptide is not FDA-approved for any medical indication. Prescribed when clinically appropriate by a licensed provider.',
    fdaStatusId: 'ghk-cu',
    citationKey: 'ghk-cu-genes',
    bundleWith: 'glutathione',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    spec: 'Injectable',
    tag: 'Antioxidant',
    image: '/images/products/glutathione.png',
    shortDescription:
      'Endogenous antioxidant supporting cellular protection. Compounded injectable form. Not FDA-approved.',
    longDescription:
      'Glutathione is the body\'s most abundant endogenous antioxidant, involved in liver detoxification and immune cell function. Injectable delivery bypasses digestive breakdown. This compounded preparation is not FDA-approved for any specific medical condition. Prescribed when clinically appropriate.',
    fdaStatusId: 'glutathione',
    bundleWith: 'ghk-cu',
  },
  {
    id: 'tesa-ipa',
    name: 'TESA/IPA',
    spec: '12/6 MG | 5 ML',
    tag: 'Growth Hormone',
    image: '/images/products/tesa-ipa.png',
    shortDescription:
      'Growth hormone support combination. Compounded preparation. Not FDA-approved as a combination.',
    longDescription:
      'Tesamorelin (a GHRH analog) and Ipamorelin (a selective GHRP) are combined to support natural growth hormone release. While tesamorelin (Egrifta) has FDA approval for a specific indication, this compounded combination is not FDA-approved. Prescribed when clinically appropriate by a licensed provider.',
    fdaStatusId: 'tesa-ipa',
  },
  {
    id: 'cjc1295-ipa',
    name: 'CJC1295/IPA',
    spec: '10/10 MG | 3 ML',
    tag: 'Growth Hormone',
    image: '/images/products/cjc1295-ipa.png',
    shortDescription:
      'Growth hormone support combination. Compounded research peptide. Not FDA-approved.',
    longDescription:
      'CJC-1295 and Ipamorelin are combined to support natural growth hormone release through complementary pathways. This compounded peptide combination is not FDA-approved for any indication. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'cjc1295-ipa',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    spec: '1000 MG | 10 ML',
    tag: 'Longevity',
    image: '/images/products/nad-plus.png',
    shortDescription:
      'Coenzyme involved in cellular energy production and DNA repair. Compounded injectable. Not FDA-approved.',
    longDescription:
      'NAD+ is a coenzyme involved in hundreds of metabolic processes. Published research suggests NAD+ levels decline with age. This compounded injectable preparation is not FDA-approved for any medical condition. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'nad-plus',
    citationKey: 'nad-decline',
  },
  {
    id: 'semax-selank',
    name: 'Semax/Selank',
    spec: '5/5 MG | 3 ML',
    tag: 'Neuropeptide',
    image: '/images/products/semax-selank.png',
    shortDescription:
      'Compounded neuropeptide combination studied for cognitive support. Not FDA-approved in the United States.',
    longDescription:
      'Semax and Selank are neuropeptides that have been studied for their potential effects on cognitive function and stress response. This compounded combination is not approved by the FDA in the United States. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'semax-selank',
  },
  {
    id: 'bpc157-tb500',
    name: 'BPC157/TB500',
    spec: '10/10 MG | 3 ML',
    tag: 'Repair',
    image: '/images/products/bpc157-tb500.png',
    shortDescription:
      'Compounded peptide combination studied for tissue recovery support. Not FDA-approved.',
    longDescription:
      'BPC-157 (Body Protection Compound) and TB-500 (Thymosin Beta-4 fragment) are research peptides studied for their potential roles in tissue repair and recovery. This compounded combination is not FDA-approved for any indication. Individual responses vary. Prescribed when clinically appropriate.',
    fdaStatusId: 'bpc157-tb500',
  },
  {
    id: 'melanotan-2',
    name: 'Melanotan 2 (MT2)',
    spec: '10 MG | 3 ML',
    tag: 'Melanocortin',
    image: '/images/products/melanotan2-mt2.png',
    shortDescription:
      'Melanocortin receptor agonist. Not FDA-approved. FDA has issued consumer warnings about melanotan products.',
    longDescription:
      'Melanotan 2 is a synthetic analog of alpha-melanocyte-stimulating hormone. It is not FDA-approved, and the FDA has issued consumer warnings about melanotan products. Available only when determined clinically appropriate by a licensed provider. Individual responses and risks vary.',
    fdaStatusId: 'melanotan-2',
  },
];
