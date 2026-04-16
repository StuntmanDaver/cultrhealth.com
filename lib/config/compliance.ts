// lib/config/compliance.ts
// Centralized compliance constants for LegitScript certification

export const DISPENSING_PHARMACY = {
  name: 'St. Luke Compounding Pharmacy',
  address: '9338 Little Rd',
  city: 'New Port Richey',
  state: 'FL',
  zip: '34654',
  phone: '(727) 416-2006',
  fax: '(727) 416-2007',
  tollFree: '(877) 310-5668',
  email: 'Admin@stlukecompounding.com',
  website: 'https://stlukecompounding.com/',
  licenseNumber: 'PH 32747',
  controlNumber: '114077',
  licenseExpires: '2027-02-28',
  npi: '',
} as const;

export type FDAStatus =
  | 'fda-approved'
  | 'fda-approved-compounded'
  | 'not-fda-approved'
  | 'investigational';

export interface FDAStatusInfo {
  status: FDAStatus;
  label: string;
  disclaimer: string;
}

export const FDA_STATUSES: Record<string, FDAStatusInfo> = {
  semaglutide: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer: 'SEMA/B6 contains the active ingredient in FDA-approved Wegovy and Ozempic. CULTR Health offers compounded SEMA/B6 prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  tirzepatide: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer: 'TIRZ/B3 contains the active ingredient in FDA-approved Mounjaro and Zepbound. CULTR Health offers compounded TIRZ/B3 prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  glutathione: {
    status: 'not-fda-approved',
    label: 'Compounded',
    disclaimer: 'Injectable glutathione is a compounded preparation. It has not been evaluated by the FDA for the treatment of any specific condition.',
  },
  'nad-plus': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'NAD+ injection is a compounded preparation. NAD+ has not been approved by the FDA as a drug for any medical condition.',
  },
  sermorelin: {
    status: 'not-fda-approved',
    label: 'Previously FDA-Approved',
    disclaimer: 'Sermorelin (Geref) previously had FDA approval but was discontinued for commercial reasons. This compounded preparation is not FDA-approved. Prescribed when clinically appropriate by a licensed provider.',
  },
  'pt-141': {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer: 'Bremelanotide is the active ingredient in FDA-approved Vyleesi, indicated for hypoactive sexual desire disorder. CULTR Health offers compounded bremelanotide prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  oxytocin: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer: 'Oxytocin (Pitocin) is an FDA-approved medication. CULTR Health offers compounded oxytocin formulations (troches, RDTs) prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved for these specific delivery formats.',
  },
} as const;

export const DISCLAIMERS = {
  testimonial: 'Individual results may vary. Testimonials reflect personal experiences and are not guaranteed outcomes. All treatments require provider evaluation and are prescribed only when clinically appropriate.',
  compoundedMedication: 'Compounded medications are prepared by a licensed 503A compounding pharmacy. Compounded drugs are not FDA-approved but are prepared in compliance with applicable state and federal regulations.',
  generalMedical: 'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. All treatments require a valid prescription from a licensed provider.',
  resultsVary: 'Individual results vary based on genetics, lifestyle, adherence to protocols, and underlying health conditions. No specific outcomes are guaranteed.',
  prescriptionRequired: 'All medications require a valid prescription from a licensed healthcare provider following a clinical evaluation. Not all patients will qualify for all treatments.',
  emergency: 'If you are experiencing a medical emergency, call 911 immediately. CULTR Health services are not intended for urgent or emergency care.',
} as const;

// --- Geographic scope ---

/** Telehealth service states (30 jurisdictions: 29 states + DC). */
export const SERVED_STATES = [
  'AZ', 'CO', 'CT', 'DE', 'FL', 'GA', 'IA', 'ID', 'LA', 'MD',
  'ME', 'MN', 'MO', 'MT', 'ND', 'NH', 'NJ', 'NM', 'NV', 'NY',
  'PA', 'RI', 'SD', 'TX', 'UT', 'VT', 'WA', 'WI', 'WY', 'DC',
] as const;

export type ServedState = typeof SERVED_STATES[number];

export const SERVED_STATE_COUNT = SERVED_STATES.length; // 30

/** States from which medications CANNOT be shipped. */
export const SHIPPING_EXCLUDED_STATES = ['CA'] as const;

export const SHIPPING_NOTE =
  'Medications can be shipped to all U.S. states except California.' as const;

/** Approved verbatim jurisdiction statement — use this exact text everywhere on the site. */
export const JURISDICTION_STATEMENT =
  'Service Availability: CULTR Health telehealth services are available in 30 U.S. jurisdictions: Arizona, Colorado, Connecticut, Delaware, Florida, Georgia, Idaho, Iowa, Louisiana, Maine, Maryland, Minnesota, Missouri, Montana, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Dakota, Pennsylvania, Rhode Island, South Dakota, Texas, Utah, Vermont, Washington, Wisconsin, Wyoming, and Washington D.C. Services are available only to patients who are physically located in one of these states at the time of consultation and treatment. Medications can be shipped to all U.S. states except California.' as const;

// --- Provider credentials ---

export const PROVIDER_CREDENTIALS = {
  medical_director: {
    name: 'Dr. Ali Saberi, MD',
    npi: '1649495276',
    specialty: 'Internal Medicine',
    states_licensed: [
      'AZ', 'CO', 'CT', 'DE', 'FL', 'GA', 'IA', 'ID', 'LA', 'MD',
      'ME', 'MN', 'MO', 'MT', 'ND', 'NH', 'NJ', 'NM', 'NV', 'NY',
      'PA', 'RI', 'SD', 'TX', 'UT', 'VT', 'WA', 'WI', 'WY', 'DC',
    ] as string[],
  },
} as const;

// --- Informed consent document ---

export const CONSENT_DOCUMENT = {
  title: 'Informed Consent for Telehealth Services',
  sections: [
    {
      heading: 'Nature of Services',
      content:
        'CULTR Health is a telehealth platform that connects you with independent, licensed healthcare providers. All prescriptions require a clinical evaluation by a licensed provider. CULTR Health does not itself provide medical services.',
    },
    {
      heading: 'Compounded Medications',
      content:
        'Medications prescribed through CULTR Health may be compounded by St. Luke Compounding Pharmacy (Florida License PH 32747), a licensed 503A compounding pharmacy. Compounded medications are not FDA-approved but are prepared in compliance with applicable state and federal regulations.',
    },
    {
      heading: 'Risks & Benefits',
      content:
        'Telehealth services carry risks including potential misdiagnosis due to limited physical examination, technology failures, and privacy risks inherent to electronic communication. Benefits include convenient access to licensed providers, reduced travel, and timely care. All medications carry potential side effects — your provider will discuss risks specific to your prescribed therapy.',
    },
    {
      heading: 'Prescription Requirements',
      content:
        'Not all patients will qualify for all treatments. Your provider may determine that a requested treatment is not clinically appropriate for you. Prescriptions are issued only when medically justified following clinical evaluation.',
    },
    {
      heading: 'No Guarantee of Results',
      content:
        'Individual results vary based on genetics, lifestyle, adherence to protocols, and underlying health conditions. Testimonials on this website reflect personal experiences and are not guaranteed outcomes.',
    },
    {
      heading: 'Refund & Cancellation',
      content:
        'All paid memberships begin with an initial 2-month clinical protocol. After your initial protocol, your membership renews monthly at your plan rate until you cancel. You may cancel anytime after your initial protocol by contacting support@cultrhealth.com or through your Stripe billing portal. No partial-month refunds are issued.',
    },
    {
      heading: 'Privacy',
      content:
        'Your protected health information (PHI) is handled in accordance with HIPAA regulations. For full details, see our Privacy Policy.',
    },
    {
      heading: 'Emergency',
      content:
        'If you are experiencing a medical emergency, call 911 immediately. CULTR Health services are not intended for urgent or emergency care.',
    },
  ],
  checkboxLabel: 'I have read and understand this informed consent document',
  buttonLabel: 'I Agree & Continue to Payment',
} as const;

// --- Therapy-to-tier mapping (used by ConsentModal to show relevant FDA statuses) ---

/** All therapy IDs from FDA_STATUSES, grouped by tier availability */
export const TIER_THERAPY_IDS: Record<string, string[]> = {
  club: [], // Education only — no therapies
  core: ['semaglutide', 'tirzepatide'], // Foundation therapies
  catalyst: [
    'semaglutide', 'tirzepatide',
    'glutathione', 'nad-plus', 'sermorelin',
    'pt-141', 'oxytocin',
  ],
  concierge: [
    'semaglutide', 'tirzepatide',
    'glutathione', 'nad-plus', 'sermorelin',
    'pt-141', 'oxytocin',
  ],
};

// --- Clinical citations ---

export const CLINICAL_CITATIONS: Record<string, string> = {
  'semaglutide-weight-loss': 'Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity. N Engl J Med. 2021;384(11):989-1002. (STEP 1 trial)',
  'tirzepatide-weight-loss': 'Jastreboff AM, et al. Tirzepatide Once Weekly for the Treatment of Obesity. N Engl J Med. 2022;387(3):205-216. (SURMOUNT-1 trial)',
  'nad-decline': 'Massudi H, et al. Age-Associated Changes In Oxidative Stress and NAD+ Metabolism In Human Tissue. PLoS One. 2012;7(7):e42357.',
} as const;
