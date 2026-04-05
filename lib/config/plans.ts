// Payment Configuration
// Last Updated: 2026-02-07
// Stripe IDs are used for subscription payments
// Asher Med handles order fulfillment (see lib/asher-med-api.ts)

export type PlanTier = 'core' | 'catalyst' | 'concierge' | 'club';

export type LibraryAccess = {
  masterIndex: 'full' | 'titles_only';
  advancedProtocols: boolean;
  dosingCalculators: boolean;
  stackingGuides: boolean;
  providerNotes: boolean;
  customRequests: boolean;
  /** Protocol Builder access: 'browse' = read-only, 'full' = configure + submit, false = no access */
  protocolBuilder: 'browse' | 'full' | false;
};

export type Plan = {
  slug: PlanTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  tagline: string;
  bestFor: string;
  features: string[];
  coreProducts?: string[];
  libraryAccess: LibraryAccess;
  stripeProductId: string;
  stripePriceId: string;
  paymentLink: string;
  isFeatured: boolean;
  /** Whether this plan is highlighted as the recommended entry point */
  isRecommended?: boolean;
  ctaLabel: string;
  /** Whether BNPL providers (Klarna/Affirm) are available for this plan */
  bnplEnabled: boolean;
  /** Number of telehealth consultations included per month (0 = none, Infinity = unlimited) */
  consultationsPerMonth: number;
  /** Custom price label for display (e.g. "$149") */
  priceLabel?: string;
  /** Small prefix before the price (e.g. "Starting at") — rendered smaller than the price */
  pricePrefix?: string;
  /** Disclaimer shown on pricing card (e.g. "2 month commitment required") */
  cardDisclaimer?: string;
  /** Asterisk or footnote microcopy */
  priceNote?: string;
  /** Doctor visit frequency disclaimer (e.g. "Doctor visit every 6 months") */
  visitFrequency?: string;
};

export type CoreTherapy = {
  slug: string;
  name: string;
  price: number;
  image: string;
  productImage: string;
  description: string;
  benefits: string[];
  disclaimer: string;
};

export const CORE_THERAPIES: CoreTherapy[] = [
  {
    slug: 'semaglutide',
    name: 'Semaglutide',
    price: 149,
    image: '/images/therapies/semaglutide.png',
    productImage: '/images/products/semaglutide-glp1.png',
    description: 'GLP-1 receptor agonist for appetite suppression, blood sugar regulation, and sustainable weight loss.',
    benefits: ['Reduces appetite and cravings', 'Supports steady weight loss', 'Improves blood sugar regulation', 'Once-weekly injection'],
    disclaimer: 'Prescription required. Individual results may vary. Common side effects include nausea, which typically resolves with dose titration.',
  },
  {
    slug: 'tirzepatide',
    name: 'Tirzepatide',
    price: 199,
    image: '/images/therapies/tirzepatide.png',
    productImage: '/images/products/tirzepatide-glp1-gip.png',
    description: 'Dual GIP/GLP-1 receptor agonist for powerful appetite suppression, enhanced metabolic function, and significant weight management.',
    benefits: ['Dual-action GLP-1 + GIP targeting', 'Enhanced appetite suppression', 'Improved insulin sensitivity', 'Once-weekly injection'],
    disclaimer: 'Prescription required. Individual results may vary. Common side effects include nausea and GI discomfort during dose titration.',
  },
];

/**
 * Membership Disclaimer
 * Display this on pricing pages and checkout flows
 */
export const MEMBERSHIP_DISCLAIMER =
  'All paid memberships begin with an initial 2-month clinical protocol. ' +
  'After that, your membership renews month-to-month unless canceled before your next renewal date. ' +
  'Medications, peptides, and products are billed separately at cost. ' +
  'All prescriptions and treatments are subject to medical eligibility and provider approval. ' +
  'Membership does not guarantee any specific treatment or prescription.';

/**
 * One-Time Add-Ons (charged at first checkout, not recurring)
 * Both are optional — customer can toggle quantity to 0 in Stripe checkout.
 * Stripe Price IDs must be created as one-time prices in Stripe dashboard.
 */
export const BLOOD_TEST_ADDON = {
  name: 'At-Home Blood Test Kit',
  description: 'Comprehensive biomarker panel with at-home collection. Results in 5-7 business days.',
  price: 135,
  stripePriceId: process.env.BLOOD_TEST_STRIPE_PRICE_ID || '',
}

export const DOCTOR_CONSULTATION_ADDON = {
  name: "Doctor's Consultation (First Visit)",
  description: 'Initial consultation with a board-certified provider. One-time fee.',
  price: 75,
  stripePriceId: process.env.DOCTOR_CONSULTATION_STRIPE_PRICE_ID || '',
}

export const STRIPE_CONFIG = {
  // Customer Portal
  customerPortalId: 'bpc_1StZxKC1JUIZB7aRXhaSarRI',
  customerPortalUrl: 'https://billing.stripe.com/p/login/4gM00igPh021086fle6J200',
  
  // Coupon codes for promotions
  coupons: {
    FOUNDER15: 'qU4zNw5W',      // 15% off forever
    FIRSTMONTH: 'tuQ4qFpe',     // 50% off first month
  },
};

export const PLANS: Plan[] = [
  {
    slug: 'club',
    name: 'CULTR Club',
    price: 0,
    interval: 'month',
    tagline: 'Free community access',
    bestFor: 'Education & discovery',
    features: [
      'Education & discovery',
      'Health tools & calculators',
      'Educational content',
      'Protocol guides & safety info',
      'Instruction video library',
      'Protocol Builder',
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: false,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
      protocolBuilder: 'browse',
    },
    stripeProductId: 'prod_TrIU16tOaJsSVw',
    stripePriceId: 'price_1StZtZC1JUIZB7aRJoIeKtGy',
    paymentLink: '',
    isFeatured: false,
    isRecommended: false,
    ctaLabel: 'Join Free',
    bnplEnabled: false,
    consultationsPerMonth: 0,
  },
  {
    slug: 'core',
    name: 'CULTR Core',
    price: 149,
    interval: 'month',
    tagline: 'Foundational care for members getting started.',
    bestFor: 'GLP-1 focused',
    features: [
      '1 Foundation Therapy',
      'Personalized protocol review',
      'Ongoing provider-guided care',
      'Protocol Builder',
    ],
    pricePrefix: 'Starting at',
    priceLabel: '$149',
    cardDisclaimer: '2 month commitment required',
    priceNote: 'Final monthly amount depends on selected therapy.',
    visitFrequency: 'Doctor visit every 6 months',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
      protocolBuilder: 'browse',
    },
    stripeProductId: 'prod_TrIUWZzUIZYfIP',
    stripePriceId: 'price_1StZtWC1JUIZB7aRFsP1WVxI',
    paymentLink: 'https://buy.stripe.com/fZu9AS56zeWVbQOc926J208',
    isFeatured: false,
    ctaLabel: 'Learn more',
    bnplEnabled: true,
    consultationsPerMonth: 1,
  },
  {
    slug: 'catalyst',
    name: 'CULTR Catalyst+',
    price: 499,
    interval: 'month',
    tagline: 'Multi-therapy optimization for members who want more customization.',
    bestFor: 'Peptide stacking & optimization',
    features: [
      '1 Foundation Therapy',
      '2 Add-on Therapies',
      'Personalized protocol review',
      'Ongoing provider-guided care',
      'Full Protocol Builder',
    ],
    cardDisclaimer: '2 month commitment required',
    visitFrequency: 'Doctor visit every 4 months',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
      protocolBuilder: 'full',
    },
    stripeProductId: 'prod_TrIUf4gB4l9G70',
    stripePriceId: 'price_1StZtYC1JUIZB7aR2nEziKX8',
    paymentLink: 'https://buy.stripe.com/14A6oGfLd1658ECgpi6J20a',
    isFeatured: true,
    ctaLabel: 'Join Catalyst+',
    bnplEnabled: true,
    consultationsPerMonth: 2,
  },
  {
    slug: 'concierge',
    name: 'CULTR Concierge',
    price: 1049,
    interval: 'month',
    tagline: 'All-inclusive premium care with diagnostics included.',
    bestFor: 'Regenerative & executive care',
    features: [
      '2 Foundation Therapies',
      'Up to 4 Add-on Therapies',
      'At-home blood test kit included',
      'First doctor visit included',
      'Priority support',
      'Full Protocol Builder',
    ],
    cardDisclaimer: '2 month commitment required',
    visitFrequency: 'Doctor visit every 2 months',
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: true,
      customRequests: false,
      protocolBuilder: 'full',
    },
    stripeProductId: 'prod_TrIUHNyu0DIyUV',
    stripePriceId: 'price_1StZtYC1JUIZB7aR9gTXMWjK',
    paymentLink: 'https://buy.stripe.com/9B6dR8aqTaGF1ca8WQ6J20b',
    isFeatured: false,
    ctaLabel: 'Join Concierge',
    bnplEnabled: true,
    consultationsPerMonth: Infinity,
  },
];
