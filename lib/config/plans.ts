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
};

/**
 * Membership Disclaimer
 * Display this on pricing pages and checkout flows
 */
export const MEMBERSHIP_DISCLAIMER = 
  'Membership includes telehealth consultations, platform access, and listed features only. ' +
  'Medications, peptides, labs, and products are billed separately at cost. ' +
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
      'Full protocol & peptide library',
      'Peptide calculator access',
      'Cycle guides & safety info',
      'Instruction video library',
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: false,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
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
    price: 199,
    interval: 'month',
    tagline: 'Foundation therapy',
    bestFor: 'GLP-1 or TRT focused',
    features: [
      'One CORE Therapy included',
      'At-home blood test kit — $135 (included at checkout, one-time)',
      "Doctor's consultation — $75 (included at checkout, first visit only)"
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUWZzUIZYfIP',
    stripePriceId: 'price_1StZtWC1JUIZB7aRFsP1WVxI',
    paymentLink: 'https://buy.stripe.com/fZu9AS56zeWVbQOc926J208',
    isFeatured: false,
    ctaLabel: 'Join Core',
    bnplEnabled: true,
    consultationsPerMonth: 1,
  },
  {
    slug: 'catalyst',
    name: 'CULTR Catalyst+',
    price: 499,
    interval: 'month',
    tagline: 'Multi-therapy optimization',
    bestFor: 'Peptide stacking & optimization',
    features: [
      'One Core Therapy included + Two Enhancements',
      'At-home blood test kit — $135 (included at checkout, one-time)',
      "Doctor's consultation — $75 (included at checkout, first visit only)"
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: false,
      customRequests: false,
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
    name: 'CULTR Curated',
    price: 1099,
    interval: 'month',
    tagline: 'Complete care',
    bestFor: 'Regenerative & executive care',
    features: [
      'Two CORE Therapy included + up to 4 enhancements',
      'At-home blood test kit — $135 (included at checkout, one-time)',
      "Doctor's consultation — $75 (included at checkout, first visit only)"
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: true,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUHNyu0DIyUV',
    stripePriceId: 'price_1StZtYC1JUIZB7aR9gTXMWjK',
    paymentLink: 'https://buy.stripe.com/9B6dR8aqTaGF1ca8WQ6J20b',
    isFeatured: false,
    ctaLabel: 'Join Curated',
    bnplEnabled: true,
    consultationsPerMonth: Infinity,
  },
];
