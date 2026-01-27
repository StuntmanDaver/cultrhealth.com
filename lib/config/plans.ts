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
};

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
    slug: 'core',
    name: 'CULTR Core',
    price: 99,
    interval: 'month',
    tagline: 'Minimum package',
    bestFor: 'Those just starting their journey',
    features: [
      'Telehealth consults',
      'Basic messaging',
      'Standard response time',
      'Core lab review'
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
    stripePriceId: 'price_1StZtWC1JUIZB7aRFsP1WVxI',
    paymentLink: 'https://buy.stripe.com/fZu9AS56zeWVbQOc926J208',
    isFeatured: false,
    ctaLabel: 'Join Core'
  },
  {
    slug: 'creator',
    name: 'CULTR Creator',
    price: 149,
    interval: 'month',
    tagline: 'Most popular',
    bestFor: 'Focused optimization',
    features: [
      'Monthly telehealth consults',
      'Priority messaging',
      'Protocol customization',
      'Comprehensive lab review',
      'Dietary guidance'
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
    stripePriceId: 'price_1StZtXC1JUIZB7aRGKjc2lbg',
    paymentLink: 'https://buy.stripe.com/eVq00icz16qpf30eha6J209',
    isFeatured: true,
    ctaLabel: 'Join Creator'
  },
  {
    slug: 'catalyst',
    name: 'CULTR Catalyst+',
    price: 199,
    interval: 'month',
    tagline: 'Elite',
    bestFor: 'Mental performance & focus',
    features: [
      'Bi-weekly consults',
      'Cognitive protocol planning',
      'Nootropic guidance',
      'Advanced testing analysis',
      'Priority support'
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
    isFeatured: false,
    ctaLabel: 'Join Catalyst+'
  },
  {
    slug: 'concierge',
    name: 'CULTR Concierge',
    price: 299,
    interval: 'month',
    tagline: 'Executive',
    bestFor: 'High-touch personalized care',
    features: [
      'Weekly consults',
      '24/7 messaging access',
      'Executive health review',
      'Travel protocol support',
      'Family planning support'
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
    ctaLabel: 'Join Concierge'
  },
  {
    slug: 'club',
    name: 'CULTR Club',
    price: 499,
    interval: 'month',
    tagline: 'Community / access',
    bestFor: 'Ultimate access & networking',
    features: [
      'Unlimited consults',
      'Direct physician access',
      'Exclusive events',
      'Partner perks',
      'Concierge coordination'
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
    stripePriceId: 'price_1StZtZC1JUIZB7aRJoIeKtGy',
    paymentLink: 'https://buy.stripe.com/8x2bJ0fLd8yxcUSeha6J20c',
    isFeatured: false,
    ctaLabel: 'Join Club'
  }
];
