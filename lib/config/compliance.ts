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
  npi: '', // TBD
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
    disclaimer: 'Semaglutide is the active ingredient in FDA-approved Wegovy and Ozempic. CULTR Health offers compounded semaglutide prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  tirzepatide: {
    status: 'fda-approved-compounded',
    label: 'FDA-Approved Active Ingredient',
    disclaimer: 'Tirzepatide is the active ingredient in FDA-approved Mounjaro and Zepbound. CULTR Health offers compounded tirzepatide prepared by a licensed 503A pharmacy. Compounded medications are not FDA-approved.',
  },
  r3ta: {
    status: 'investigational',
    label: 'Investigational',
    disclaimer: 'Retatrutide (R3TA) is an investigational compound currently in clinical trials. It is not FDA-approved. Availability is subject to regulatory status and provider determination of clinical appropriateness.',
  },
  'ghk-cu': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'GHK-Cu is a research peptide. It has not been approved by the FDA for the treatment of any medical condition. Prescribed when clinically appropriate by a licensed provider.',
  },
  glutathione: {
    status: 'not-fda-approved',
    label: 'Compounded',
    disclaimer: 'Injectable glutathione is a compounded preparation. It has not been evaluated by the FDA for the treatment of any specific condition.',
  },
  'tesa-ipa': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'Tesamorelin/Ipamorelin is a compounded peptide combination. While tesamorelin (Egrifta) has FDA approval for a specific indication, this compounded combination is not FDA-approved.',
  },
  'cjc1295-ipa': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'CJC-1295/Ipamorelin is a compounded research peptide combination not approved by the FDA for any indication.',
  },
  'nad-plus': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'NAD+ injection is a compounded preparation. NAD+ has not been approved by the FDA as a drug for any medical condition.',
  },
  'semax-selank': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'Semax/Selank is a compounded neuropeptide combination not approved by the FDA in the United States.',
  },
  'bpc157-tb500': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved',
    disclaimer: 'BPC-157/TB-500 is a compounded research peptide combination not approved by the FDA for any indication.',
  },
  'melanotan-2': {
    status: 'not-fda-approved',
    label: 'Not FDA-Approved — FDA Warning Issued',
    disclaimer: 'Melanotan 2 is not FDA-approved. The FDA has issued consumer warnings about melanotan products. Available only when determined clinically appropriate by a licensed provider.',
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

export const EXCLUDED_STATES = ['NY', 'LA'] as const; // PLACEHOLDER — confirm with legal

export const SERVED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'MD', 'MA', 'ME',
  'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
  'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

// --- Provider credentials ---

export const PROVIDER_CREDENTIALS = {
  medical_director: {
    name: 'Dr. Ali Saberi, MD',
    npi: '', // PLACEHOLDER — user to provide
    specialty: 'Internal Medicine',
    states_licensed: [] as string[], // PLACEHOLDER — user to provide
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
  core: ['semaglutide', 'tirzepatide', 'r3ta'], // Foundation therapies
  catalyst: [
    'semaglutide', 'tirzepatide', 'r3ta',
    'ghk-cu', 'glutathione', 'tesa-ipa', 'cjc1295-ipa',
    'nad-plus', 'semax-selank', 'bpc157-tb500', 'melanotan-2',
  ],
  concierge: [
    'semaglutide', 'tirzepatide', 'r3ta',
    'ghk-cu', 'glutathione', 'tesa-ipa', 'cjc1295-ipa',
    'nad-plus', 'semax-selank', 'bpc157-tb500', 'melanotan-2',
  ],
};

// --- Clinical citations ---

export const CLINICAL_CITATIONS: Record<string, string> = {
  'semaglutide-weight-loss': 'Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity. N Engl J Med. 2021;384(11):989-1002. (STEP 1 trial)',
  'tirzepatide-weight-loss': 'Jastreboff AM, et al. Tirzepatide Once Weekly for the Treatment of Obesity. N Engl J Med. 2022;387(3):205-216. (SURMOUNT-1 trial)',
  'retatrutide-weight-loss': 'Jastreboff AM, et al. Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial. N Engl J Med. 2023;389(6):514-526.',
  'nad-decline': 'Massudi H, et al. Age-Associated Changes In Oxidative Stress and NAD+ Metabolism In Human Tissue. PLoS One. 2012;7(7):e42357.',
  'ghk-cu-genes': 'Pickart L, et al. GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration. Biomed Res Int. 2015;2015:648108.',
} as const;
