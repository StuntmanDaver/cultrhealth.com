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
    id: 'semaglutide-pyridoxine',
    name: 'Semaglutide/Pyridoxine',
    spec: '2.5–5 mg/mL | 1–5 mL',
    tag: 'GLP-1',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'GLP-1 receptor agonist with pyridoxine (B6) prescribed for appetite regulation, blood sugar support, and weight management when clinically appropriate.',
    longDescription:
      'Semaglutide mimics the GLP-1 hormone to slow gastric emptying, reduce hunger signals, and support insulin sensitivity. Combined with pyridoxine (vitamin B6) for enhanced tolerability. In the STEP 1 clinical trial, participants experienced an average of 14.9% body weight reduction over 68 weeks compared to placebo. Individual results vary. Compounded semaglutide is not FDA-approved.',
    fdaStatusId: 'semaglutide',
    citationKey: 'semaglutide-weight-loss',
  },
  {
    id: 'tirzepatide-niacinamide',
    name: 'Tirzepatide/Niacinamide',
    spec: '10–20 mg/mL | 1–3 mL',
    tag: 'GLP-1',
    image: '/images/products/tirzepatide-glp1-gip.png',
    shortDescription:
      'Dual GIP/GLP-1 receptor agonist with niacinamide prescribed for appetite regulation and metabolic support when clinically appropriate.',
    longDescription:
      'Tirzepatide activates both GIP and GLP-1 receptors for enhanced metabolic support. Combined with niacinamide for improved stability and tolerability. In the SURMOUNT-1 trial, participants receiving the highest dose experienced up to 22.5% body weight reduction over 72 weeks compared to placebo. Individual results vary. Compounded tirzepatide is not FDA-approved.',
    fdaStatusId: 'tirzepatide',
    citationKey: 'tirzepatide-weight-loss',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    spec: '200 mg/mL | 5 mL',
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
    id: 'sermorelin',
    name: 'Sermorelin',
    spec: '3 mg/mL | 5 mL',
    tag: 'Growth Hormone',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'Growth hormone-releasing hormone analog that stimulates natural GH production. Compounded preparation.',
    longDescription:
      'Sermorelin is a GHRH analog that stimulates the pituitary gland to produce and release growth hormone naturally. It supports improved recovery, sleep quality, and body composition. Sermorelin (Geref) previously had FDA approval but was discontinued for commercial reasons. This compounded preparation is prescribed when clinically appropriate.',
    fdaStatusId: 'sermorelin',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    spec: '200 mg/mL | 10–30 mL',
    tag: 'Antioxidant',
    image: '/images/products/glutathione.png',
    shortDescription:
      'Endogenous antioxidant supporting cellular protection. Compounded injectable form. Not FDA-approved.',
    longDescription:
      'Glutathione is the body\'s most abundant endogenous antioxidant, involved in liver detoxification and immune cell function. Injectable delivery bypasses digestive breakdown. This compounded preparation is not FDA-approved for any specific medical condition. Prescribed when clinically appropriate.',
    fdaStatusId: 'glutathione',
  },
  {
    id: 'pt-141',
    name: 'PT-141 (Bremelanotide)',
    spec: 'Multiple formats',
    tag: 'Sexual Wellness',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'Melanocortin receptor agonist for sexual arousal and desire. Available as nasal spray, capsule, and troche.',
    longDescription:
      'PT-141 (Bremelanotide) works centrally on the nervous system via melanocortin receptors to enhance sexual arousal and desire in both men and women. The FDA-approved version (Vyleesi) is indicated for hypoactive sexual desire disorder in premenopausal women. Compounded formulations are available in multiple delivery formats including nasal sprays, capsules, and troches. Prescribed when clinically appropriate.',
    fdaStatusId: 'pt-141',
  },
  {
    id: 'oxytocin',
    name: 'Oxytocin',
    spec: '50–125 IU troche/RDT',
    tag: 'Sexual Wellness',
    image: '/images/products/semaglutide-glp1.png',
    shortDescription:
      'Neuropeptide supporting emotional bonding, stress reduction, and sexual well-being. Available as troche and RDT.',
    longDescription:
      'Oxytocin is a naturally occurring neuropeptide that promotes social bonding, reduces stress and anxiety, and supports emotional and sexual well-being. Available in sublingual troches and rapidly dissolving tablets (RDTs). Compounded formulations are not FDA-approved. Prescribed when clinically appropriate.',
    fdaStatusId: 'oxytocin',
  },
];
