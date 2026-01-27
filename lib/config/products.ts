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
    name: 'Compounded Tirzepatide',
    description: 'The most effective GLP-1 for sustainable weight loss. Dual-action formula targeting both GLP-1 and GIP receptors.',
    priceTeaser: 'As low as $199/mo*',
    features: [
      'Dual GLP-1/GIP receptor targeting',
      'Clinically proven efficacy',
      'Compounded for affordability',
      'Provider-supervised protocol',
    ],
    isBestseller: true,
    href: '/pricing',
    icon: 'syringe',
    gradient: 'from-cultr-copper/30 via-cultr-copper/10 to-transparent',
  },
  {
    slug: 'semaglutide',
    name: 'Compounded Semaglutide',
    description: 'The original GLP-1 powerhouse for weight management. Proven results with a well-established safety profile.',
    priceTeaser: 'As low as $149/mo*',
    features: [
      'GLP-1 receptor agonist',
      'Appetite regulation',
      'Compounded formulation',
      'Flexible dosing options',
    ],
    isBestseller: true,
    href: '/pricing',
    icon: 'pill',
    gradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
  },
  {
    slug: 'hormone-optimization',
    name: 'Hormone Optimization',
    description: 'Restore vitality with personalized TRT/HRT protocols. Data-driven hormone balancing for peak performance.',
    priceTeaser: 'Starting at $99/mo*',
    features: [
      'Comprehensive hormone panels',
      'Testosterone optimization',
      'Thyroid support',
      'Ongoing monitoring',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'activity',
    gradient: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
  {
    slug: 'diagnostic-labs',
    name: 'Diagnostic Labs',
    description: 'Advanced biomarker testing to understand your biology. Order labs directly and get actionable insights.',
    priceTeaser: 'Included with membership',
    features: [
      'Comprehensive metabolic panels',
      'Hormone testing',
      'Inflammation markers',
      'Provider interpretation',
    ],
    isBestseller: false,
    href: '/pricing',
    icon: 'flask',
    gradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
];

// Bestseller products for homepage section
export const BESTSELLERS = PRODUCTS.filter((p) => p.isBestseller);
