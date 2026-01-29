// Stripe Product & Price Configuration
// Last Updated: 2026-01-25
// Note: These are LIVE mode IDs

export type PlanTier = 'core' | 'creator' | 'catalyst' | 'concierge' | 'club';

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
  libraryAccess: LibraryAccess;
  stripeProductId: string;
  stripePriceId: string;
  paymentLink: string;
  isFeatured: boolean;
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
    price: 499,
    interval: 'month',
    tagline: 'Community access',
    bestFor: 'Education & self-guided',
    features: [
      'Full protocol & peptide library',
      'Peptide calculator access',
      'Cycle guides & safety info',
      'Instruction video library',
      'Member shop access'
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: true,
      stackingGuides: true,
      providerNotes: true,
      customRequests: true,
    },
    stripeProductId: 'prod_TrIU16tOaJsSVw',
    stripePriceId: 'price_1StZtZC1JUIZB7aRJoIeKtGy', // TODO: Update with new $899 price ID
    paymentLink: 'https://buy.stripe.com/8x2bJ0fLd8yxcUSeha6J20c',
    isFeatured: false,
    ctaLabel: 'Join Club',
    bnplEnabled: true,
  },
  {
    slug: 'core',
    name: 'CULTR Core',
    price: 699,
    interval: 'month',
    tagline: 'Single therapy',
    bestFor: 'GLP-1 or TRT focused',
    features: [
      'Monthly telehealth consult',
      'One therapy (GLP-1 or TRT)',
      'Onboarding videos & safety info',
      'At-home delivery',
      'Secure messaging'
    ],
    libraryAccess: {
      masterIndex: 'titles_only',
      advancedProtocols: false,
      dosingCalculators: false,
      stackingGuides: false,
      providerNotes: false,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUWZzUIZYfIP',
    stripePriceId: 'price_1StZtWC1JUIZB7aRFsP1WVxI', // TODO: Update with new $399 price ID
    paymentLink: 'https://buy.stripe.com/fZu9AS56zeWVbQOc926J208',
    isFeatured: false,
    ctaLabel: 'Join Core',
    bnplEnabled: true,
  },
  {
    slug: 'catalyst',
    name: 'CULTR Catalyst+',
    price: 799,
    interval: 'month',
    tagline: 'Multi-therapy',
    bestFor: 'Peptide stacking & optimization',
    features: [
      'Bi-weekly telehealth consults',
      'GLP-1/2/3 + peptide stacking',
      'Peptide calculator & cycle guides',
      'Full protocol library access',
      'Priority response (<24hr)'
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
    stripePriceId: 'price_1StZtYC1JUIZB7aR2nEziKX8', // TODO: Update with new $599 price ID
    paymentLink: 'https://buy.stripe.com/14A6oGfLd1658ECgpi6J20a',
    isFeatured: false,
    ctaLabel: 'Join Catalyst+',
    bnplEnabled: true,
  },
  {
    slug: 'creator',
    name: 'CULTR Creator',
    price: 899,
    interval: 'month',
    tagline: 'Most popular',
    bestFor: 'Full longevity protocol',
    features: [
      'Monthly telehealth consults',
      'GLP-1s, TRT & peptides',
      'Protocol library & shop access',
      'Injection coaching videos',
      'Quarterly lab panels'
    ],
    libraryAccess: {
      masterIndex: 'full',
      advancedProtocols: true,
      dosingCalculators: false,
      stackingGuides: false,
      providerNotes: false,
      customRequests: false,
    },
    stripeProductId: 'prod_TrIUzJ9ZKiHIS6',
    stripePriceId: 'price_1StZtXC1JUIZB7aRGKjc2lbg', // TODO: Update with new $499 price ID
    paymentLink: 'https://buy.stripe.com/eVq00icz16qpf30eha6J209',
    isFeatured: true,
    ctaLabel: 'Join Creator',
    bnplEnabled: true,
  },
  {
    slug: 'concierge',
    name: 'CULTR Concierge',
    price: 1199,
    interval: 'month',
    tagline: 'White-glove',
    bestFor: 'Regenerative & executive care',
    features: [
      'Weekly physician consults',
      'Stem cell, exosome & IV access',
      'All tools: calculator, guides, library',
      'Same-day response & VIP shop',
      'Early CULTR app access'
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
    stripePriceId: 'price_1StZtYC1JUIZB7aR9gTXMWjK', // TODO: Update with new $699 price ID
    paymentLink: 'https://buy.stripe.com/9B6dR8aqTaGF1ca8WQ6J20b',
    isFeatured: false,
    ctaLabel: 'Join Concierge',
    bnplEnabled: true,
  },
];
