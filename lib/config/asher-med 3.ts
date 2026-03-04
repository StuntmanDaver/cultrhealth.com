// Asher Med Partner Portal Configuration
// Configuration settings for CULTR Health integration with Asher Med

export type AsherMedEnvironment = 'production' | 'sandbox';

// ============================================================
// ASHER MED PLATFORM URLS
// ============================================================

export const ASHER_MED_URLS = {
  api: {
    production: 'https://prod-api.asherweightloss.com',
    sandbox: 'https://sandbox-api.asherweightloss.com', // If sandbox exists
  },
  website: {
    production: 'https://asherweightloss.com',
    sandbox: 'https://asherweightloss.com',
  },
} as const;

// ============================================================
// MEDICATION CONFIGURATIONS
// ============================================================

export interface MedicationOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
  types: ('Injection' | 'Troche')[];
  category: 'GLP1' | 'NonGLP1';
  isGLP1: boolean;
  durations: number[]; // Available duration options in weeks/days
  dosages?: string[]; // Available dosage options
  packageId?: string; // Asher Med package ID
  popular?: boolean;
}

export const MEDICATION_OPTIONS: MedicationOption[] = [
  // GLP-1 Medications (Weight Loss)
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    displayName: 'Tirzepatide',
    description: 'Dual GIP/GLP-1 receptor agonist for significant weight loss',
    types: ['Injection'],
    category: 'GLP1',
    isGLP1: true,
    durations: [28, 56, 84], // 4, 8, 12 weeks
    dosages: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
    packageId: 'tirzepatide-injection',
    popular: true,
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    displayName: 'Semaglutide',
    description: 'GLP-1 receptor agonist for weight management',
    types: ['Injection'],
    category: 'GLP1',
    isGLP1: true,
    durations: [28, 56, 84],
    dosages: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
    packageId: 'semaglutide-injection',
    popular: true,
  },

  // Non-GLP-1 Peptides & Wellness
  {
    id: 'nad-plus',
    name: 'NAD+',
    displayName: 'NAD+',
    description: 'Cellular energy and longevity support',
    types: ['Injection', 'Troche'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'nad-plus',
  },
  {
    id: 'sermorelin',
    name: 'Sermorelin',
    displayName: 'Sermorelin',
    description: 'Growth hormone releasing peptide',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'sermorelin',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    displayName: 'Glutathione',
    description: 'Master antioxidant for detox and skin health',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'glutathione',
  },
  {
    id: 'aod9604',
    name: 'AOD9604',
    displayName: 'AOD-9604',
    description: 'Fat-burning peptide fragment',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'aod9604',
  },
  {
    id: 'bpc157-tb500',
    name: 'BPC-157/TB-500',
    displayName: 'BPC-157 / TB-500',
    description: 'Recovery and healing peptide stack',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'bpc157-tb500',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    displayName: 'GHK-Cu',
    description: 'Copper peptide for skin and tissue repair',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'ghk-cu',
  },
  {
    id: 'lipo-b',
    name: 'Lipo-B',
    displayName: 'Lipo-B',
    description: 'Lipotropic injection for metabolism support',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'lipo-b',
  },
  {
    id: 'lipo-c',
    name: 'Lipo-C',
    displayName: 'Lipo-C',
    description: 'Enhanced lipotropic with L-carnitine',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'lipo-c',
  },
  {
    id: 'mots-c',
    name: 'MOTS-C',
    displayName: 'MOTS-C',
    description: 'Mitochondrial peptide for metabolic optimization',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'mots-c',
  },
  {
    id: 'semax-selank',
    name: 'Semax/Selank',
    displayName: 'Semax / Selank',
    description: 'Nootropic peptides for cognitive enhancement',
    types: ['Injection'],
    category: 'NonGLP1',
    isGLP1: false,
    durations: [30, 60, 90],
    packageId: 'semax-selank',
  },
];

// ============================================================
// INTAKE FORM STEPS CONFIGURATION
// ============================================================

export interface IntakeFormStep {
  id: string;
  name: string;
  title: string; // Display title for step
  shortTitle?: string; // Short title for progress bar
  description: string;
  path: string;
  required: boolean;
  requiresGLP1?: boolean; // Only show for GLP-1 medication selection
}

export const INTAKE_FORM_STEPS: IntakeFormStep[] = [
  {
    id: 'personal-info',
    name: 'Personal Information',
    title: 'Personal Information',
    shortTitle: 'Info',
    description: 'Your contact and demographic details',
    path: '/intake/personal-info',
    required: true,
  },
  {
    id: 'shipping',
    name: 'Shipping Address',
    title: 'Shipping Address',
    shortTitle: 'Address',
    description: 'Where to deliver your medications',
    path: '/intake/shipping',
    required: true,
  },
  {
    id: 'medications',
    name: 'Medication Selection',
    title: 'Select Your Medication',
    shortTitle: 'Medication',
    description: 'Choose your treatment medications',
    path: '/intake/medications',
    required: true,
  },
  {
    id: 'physical',
    name: 'Physical Measurements',
    title: 'Physical Measurements',
    shortTitle: 'Measurements',
    description: 'Your height, weight, and BMI',
    path: '/intake/physical-measurements',
    required: true,
  },
  {
    id: 'wellness',
    name: 'Health Questionnaire',
    title: 'Wellness Questionnaire',
    shortTitle: 'Health',
    description: 'Medical history and wellness questions',
    path: '/intake/health-questionnaire',
    required: true,
  },
  {
    id: 'glp1-history',
    name: 'GLP-1 History',
    title: 'GLP-1 Medication History',
    shortTitle: 'GLP-1',
    description: 'Previous GLP-1 medication experience',
    path: '/intake/glp1-history',
    required: false,
    requiresGLP1: true,
  },
  {
    id: 'current-medications',
    name: 'Current Medications',
    title: 'Current Medications',
    shortTitle: 'Meds',
    description: 'Medications you are currently taking',
    path: '/intake/current-medications',
    required: false,
    requiresGLP1: true,
  },
  {
    id: 'preferences',
    name: 'Treatment Preferences',
    title: 'Treatment Preferences',
    shortTitle: 'Preferences',
    description: 'Your treatment customization preferences',
    path: '/intake/treatment-preferences',
    required: true,
  },
  {
    id: 'id-upload',
    name: 'ID Verification',
    title: 'Upload Your ID',
    shortTitle: 'ID',
    description: 'Upload a government-issued photo ID',
    path: '/intake/id-upload',
    required: true,
  },
  {
    id: 'consent',
    name: 'Consent & Signatures',
    title: 'Consent Forms',
    shortTitle: 'Consent',
    description: 'Telehealth and medication consent',
    path: '/intake/consent',
    required: true,
  },
  {
    id: 'review',
    name: 'Review & Submit',
    title: 'Review Your Information',
    shortTitle: 'Review',
    description: 'Review your information and submit',
    path: '/intake/review',
    required: true,
  },
];

// Renewal form has fewer steps
export const RENEWAL_FORM_STEPS: IntakeFormStep[] = [
  {
    id: 'personal-info',
    name: 'Verify Information',
    title: 'Verify Your Information',
    shortTitle: 'Verify',
    description: 'Confirm your personal details',
    path: '/renewal/personal-info',
    required: true,
  },
  {
    id: 'shipping',
    name: 'Shipping Address',
    title: 'Confirm Shipping Address',
    shortTitle: 'Address',
    description: 'Confirm delivery address',
    path: '/renewal/shipping',
    required: true,
  },
  {
    id: 'medications',
    name: 'Medication Selection',
    title: 'Select Medication',
    shortTitle: 'Medication',
    description: 'Select medications for renewal',
    path: '/renewal/medications',
    required: true,
  },
  {
    id: 'health-questionnaire',
    name: 'Health Update',
    title: 'Health Check-In',
    shortTitle: 'Health',
    description: 'Wellness check-in questionnaire',
    path: '/renewal/health-questionnaire',
    required: true,
  },
  {
    id: 'consent',
    name: 'Telehealth Consent',
    title: 'Telehealth Consent',
    shortTitle: 'Consent',
    description: 'Confirm telehealth agreement',
    path: '/renewal/consent',
    required: true,
  },
  {
    id: 'review',
    name: 'Review & Submit',
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Review and submit renewal',
    path: '/renewal/review',
    required: true,
  },
];

// ============================================================
// US STATES FOR ADDRESS VALIDATION
// ============================================================

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the appropriate API URL based on environment
 */
export function getAsherMedApiUrl(): string {
  const env = (process.env.ASHER_MED_ENVIRONMENT || 'production') as AsherMedEnvironment;
  return ASHER_MED_URLS.api[env];
}

/**
 * Get medications by category
 */
export function getMedicationsByCategory(category: 'GLP1' | 'NonGLP1'): MedicationOption[] {
  return MEDICATION_OPTIONS.filter((med) => med.category === category);
}

/**
 * Get medication by name
 */
export function getMedicationByName(name: string): MedicationOption | undefined {
  return MEDICATION_OPTIONS.find((med) => med.name === name);
}

/**
 * Get intake form steps for a given medication selection
 */
export function getIntakeFormSteps(isGLP1: boolean): IntakeFormStep[] {
  return INTAKE_FORM_STEPS.filter((step) => {
    if (step.requiresGLP1 && !isGLP1) {
      return false;
    }
    return true;
  });
}

/**
 * Validate state abbreviation
 */
export function isValidStateCode(code: string): boolean {
  return US_STATES.some((state) => state.code === code.toUpperCase());
}

/**
 * Get state name from code
 */
export function getStateName(code: string): string | undefined {
  const state = US_STATES.find((s) => s.code === code.toUpperCase());
  return state?.name;
}
