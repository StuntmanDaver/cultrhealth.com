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
    isRecommended: true,
    ctaLabel: 'Join Free',
    bnplEnabled: false,
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
      'Initial Physician Consult $79',
      'Blood work prior to start $99, recommended every 3 months (additional fee)',
      'Complimentary physician follow up every 6 months'
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
      'Initial Physician Consult $79',
      'Blood work prior to start $99, recommended every 3 months (additional fee)',
      'Complimentary physician follow up every 3 months'
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
  },
  {
    slug: 'concierge',
    name: 'CULTR Concierge',
    price: 1099,
    interval: 'month',
    tagline: 'Complete care',
    bestFor: 'Regenerative & executive care',
    features: [
      'Two CORE Therapy included + up to 4 enhancements',
      'Initial Physician Consult $79',
      'Blood work prior to start $99, recommended every 3 months (additional fee)',
      'Complimentary physician follow up every 1 month'
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
    ctaLabel: 'Join Concierge',
    bnplEnabled: true,
  },
];
