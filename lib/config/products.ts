// Product Configuration
// These are the main service/product offerings displayed on the Products page

export type ProductIcon = 'syringe' | 'pill' | 'activity' | 'flask';

export interface Product {
  slug: string;
  name: string;
  description: string;
  priceTeaser: string;
  features: string[];
  isBestseller?: boolean;
  href: string;
  icon: ProductIcon;
  gradient: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: 'tirzepatide',
    name: 'Compounded TIRZ/B3',
    description: 'Dual GIP/GLP-1 receptor agonist for metabolic support. Compounded formulation — not FDA-approved.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'Dual GLP-1/GIP receptor targeting',
      'Up to 22.5% weight reduction in SURMOUNT-1 trial',
      'Compounded by licensed 503A pharmacy',
      'Provider-supervised protocol required',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'syringe',
    gradient: 'from-cultr-copper/30 via-cultr-copper/10 to-transparent',
  },
  {
    slug: 'semaglutide',
    name: 'Compounded SEMA/B6',
    description: 'GLP-1 receptor agonist for weight management support. Compounded formulation — not FDA-approved.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'GLP-1 receptor agonist',
      'Appetite regulation support',
      'Compounded by licensed 503A pharmacy',
      'Provider-supervised protocol required',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'pill',
    gradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
  },
  {
    slug: 'hormone-optimization',
    name: 'Hormone Optimization',
    description: 'Personalized TRT/HRT protocols based on comprehensive lab panels and provider evaluation.',
    priceTeaser: 'Starting at $99/mo*',
    features: [
      'Comprehensive hormone panels',
      'Testosterone optimization when indicated',
      'Thyroid support when indicated',
      'Ongoing monitoring and adjustment',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'activity',
    gradient: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
  {
    slug: 'diagnostic-labs',
    name: 'Diagnostic Labs',
    description: 'Comprehensive biomarker testing with provider interpretation to support clinical decision-making.',
    priceTeaser: 'Included with membership',
    features: [
      'Comprehensive metabolic panels',
      'Hormone testing',
      'Inflammation markers',
      'Provider interpretation included',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'flask',
    gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
];

// Bestseller products for homepage section
export const BESTSELLERS = PRODUCTS.filter((p) => p.isBestseller);
