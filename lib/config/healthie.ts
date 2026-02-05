// Healthie EHR Platform Configuration
// Comprehensive integration settings for CULTR Health Longevity Clinic
// Reference: https://help.gethealthie.com/article/943-healthies-api

export type HealthieEnvironment = 'production' | 'sandbox';

// ============================================================
// HEALTHIE PLATFORM URLS
// ============================================================

export const HEALTHIE_URLS = {
  // API Endpoints
  api: {
    production: 'https://api.gethealthie.com/graphql',
    sandbox: 'https://staging-api.gethealthie.com/graphql',
  },
  
  // Web App URLs (for embedding/linking)
  app: {
    production: 'https://secureclient.gethealthie.com',
    sandbox: 'https://staging-secureclient.gethealthie.com',
  },
  
  // Provider Portal
  provider: {
    production: 'https://app.gethealthie.com',
    sandbox: 'https://staging.gethealthie.com',
  },
} as const;

// ============================================================
// HEALTHIE INTEGRATION FEATURES FOR LONGEVITY CLINIC
// ============================================================

export interface HealthieFeature {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: HealthieCategory;
  url?: string; // Direct link if available
  apiEndpoint?: string; // GraphQL query/mutation
  sdkAvailable: boolean;
  requiresAuth: boolean;
  memberTiers: ('core' | 'creator' | 'catalyst' | 'concierge' | 'club')[];
}

export type HealthieCategory = 
  | 'scheduling'
  | 'communication'
  | 'records'
  | 'billing'
  | 'programs'
  | 'documents'
  | 'settings';

export const HEALTHIE_FEATURES: HealthieFeature[] = [
  // ============================================================
  // SCHEDULING & APPOINTMENTS
  // ============================================================
  {
    id: 'book-appointment',
    name: 'Book Appointment',
    description: 'Schedule telehealth or in-person consultations with your provider',
    icon: 'Calendar',
    category: 'scheduling',
    sdkAvailable: true, // Booking & Buying SDK
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'upcoming-appointments',
    name: 'Upcoming Appointments',
    description: 'View and manage your scheduled appointments',
    icon: 'CalendarDays',
    category: 'scheduling',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'appointment-history',
    name: 'Appointment History',
    description: 'Review past consultations and session notes',
    icon: 'History',
    category: 'scheduling',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'telehealth',
    name: 'Join Telehealth',
    description: 'Start your video consultation with your provider',
    icon: 'Video',
    category: 'scheduling',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // COMMUNICATION & MESSAGING
  // ============================================================
  {
    id: 'secure-messaging',
    name: 'Secure Messaging',
    description: 'Send HIPAA-compliant messages to your care team',
    icon: 'MessageSquare',
    category: 'communication',
    sdkAvailable: true, // Chat SDK
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'message-history',
    name: 'Message History',
    description: 'View all previous conversations with your providers',
    icon: 'MessagesSquare',
    category: 'communication',
    sdkAvailable: true,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'care-team',
    name: 'Care Team',
    description: 'View your assigned providers and specialists',
    icon: 'Users',
    category: 'communication',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // HEALTH RECORDS & LAB RESULTS
  // ============================================================
  {
    id: 'lab-results',
    name: 'Lab Results',
    description: 'View your biomarker panels and lab reports',
    icon: 'TestTube2',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'health-metrics',
    name: 'Health Metrics',
    description: 'Track and visualize your health data over time',
    icon: 'Activity',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'care-plans',
    name: 'Care Plans',
    description: 'View your active protocols and treatment plans',
    icon: 'ClipboardList',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'medical-history',
    name: 'Medical History',
    description: 'View and update your health history and conditions',
    icon: 'HeartPulse',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'medications',
    name: 'Medications',
    description: 'View current prescriptions and medication history',
    icon: 'Pill',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'allergies',
    name: 'Allergies & Sensitivities',
    description: 'Manage your allergy and sensitivity information',
    icon: 'AlertCircle',
    category: 'records',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // FORMS & INTAKE
  // ============================================================
  {
    id: 'intake-forms',
    name: 'Intake Forms',
    description: 'Complete required health assessments and questionnaires',
    icon: 'ClipboardCheck',
    category: 'documents',
    sdkAvailable: true, // Forms SDK
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'consent-forms',
    name: 'Consent Forms',
    description: 'Review and sign treatment consent documents',
    icon: 'FileSignature',
    category: 'documents',
    sdkAvailable: true,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'assessments',
    name: 'Health Assessments',
    description: 'Complete periodic health check-ins and assessments',
    icon: 'FileQuestion',
    category: 'documents',
    sdkAvailable: true,
    requiresAuth: true,
    memberTiers: ['creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // DOCUMENTS & FILES
  // ============================================================
  {
    id: 'documents',
    name: 'My Documents',
    description: 'Access your health documents and reports',
    icon: 'FolderOpen',
    category: 'documents',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'upload-documents',
    name: 'Upload Documents',
    description: 'Upload lab results, records, or other files',
    icon: 'Upload',
    category: 'documents',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'protocol-documents',
    name: 'Protocol Documents',
    description: 'View your personalized protocol documentation',
    icon: 'FileText',
    category: 'documents',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // PROGRAMS & EDUCATION
  // ============================================================
  {
    id: 'programs',
    name: 'My Programs',
    description: 'Access enrolled wellness and optimization programs',
    icon: 'GraduationCap',
    category: 'programs',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'courses',
    name: 'Educational Courses',
    description: 'Self-paced courses on longevity and optimization',
    icon: 'BookOpen',
    category: 'programs',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'progress-tracking',
    name: 'Progress Tracking',
    description: 'Monitor your program completion and milestones',
    icon: 'TrendingUp',
    category: 'programs',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // BILLING & PAYMENTS
  // ============================================================
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'View and pay outstanding invoices',
    icon: 'Receipt',
    category: 'billing',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'payment-methods',
    name: 'Payment Methods',
    description: 'Manage your payment cards and billing info',
    icon: 'CreditCard',
    category: 'billing',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'insurance',
    name: 'Insurance Info',
    description: 'View and update insurance information',
    icon: 'Shield',
    category: 'billing',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'packages',
    name: 'My Packages',
    description: 'View purchased service packages and credits',
    icon: 'Package',
    category: 'billing',
    sdkAvailable: true, // Booking & Buying SDK
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },

  // ============================================================
  // ACCOUNT SETTINGS
  // ============================================================
  {
    id: 'profile',
    name: 'My Profile',
    description: 'Update your personal information and preferences',
    icon: 'User',
    category: 'settings',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Manage email and push notification preferences',
    icon: 'Bell',
    category: 'settings',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'emergency-contacts',
    name: 'Emergency Contacts',
    description: 'Manage your emergency contact information',
    icon: 'Phone',
    category: 'settings',
    sdkAvailable: false,
    requiresAuth: true,
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
];

// ============================================================
// HEALTHIE CATEGORY CONFIGURATION
// ============================================================

export interface CategoryConfig {
  id: HealthieCategory;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind color class
}

export const HEALTHIE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'scheduling',
    name: 'Scheduling & Appointments',
    description: 'Book and manage your consultations',
    icon: 'Calendar',
    color: 'bg-blue-100',
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Connect with your care team',
    icon: 'MessageSquare',
    color: 'bg-green-100',
  },
  {
    id: 'records',
    name: 'Health Records',
    description: 'Your medical records and lab results',
    icon: 'FileHeart',
    color: 'bg-purple-100',
  },
  {
    id: 'documents',
    name: 'Documents & Forms',
    description: 'Forms, consents, and file uploads',
    icon: 'Files',
    color: 'bg-orange-100',
  },
  {
    id: 'programs',
    name: 'Programs & Education',
    description: 'Courses and wellness programs',
    icon: 'GraduationCap',
    color: 'bg-cyan-100',
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    description: 'Invoices and payment management',
    icon: 'Wallet',
    color: 'bg-amber-100',
  },
  {
    id: 'settings',
    name: 'Account Settings',
    description: 'Profile and preferences',
    icon: 'Settings',
    color: 'bg-stone-100',
  },
];

// ============================================================
// HEALTHIE SDK INFORMATION
// ============================================================

export const HEALTHIE_SDKS = {
  chat: {
    name: 'Chat SDK',
    npmPackage: '@healthie/chat-sdk',
    documentation: 'https://www.npmjs.com/package/@healthie/chat-sdk',
    description: 'Real-time secure messaging with providers',
  },
  forms: {
    name: 'Forms SDK',
    npmPackage: '@healthie/forms-sdk',
    documentation: 'https://www.npmjs.com/package/@healthie/forms-sdk',
    description: 'Intake forms and questionnaires',
  },
  booking: {
    name: 'Booking & Buying SDK',
    npmPackage: '@healthie/booking-sdk',
    documentation: 'https://www.npmjs.com/package/@healthie/booking-sdk',
    description: 'Calendar scheduling and package purchases',
  },
} as const;

// ============================================================
// HEALTHIE WEBHOOK EVENTS
// ============================================================

export const HEALTHIE_WEBHOOK_EVENTS = [
  'appointment.created',
  'appointment.updated',
  'appointment.deleted',
  'appointment.completed',
  'conversation.message_created',
  'form_answer_group.created',
  'form_answer_group.updated',
  'document.created',
  'document.updated',
  'entry.created',
  'entry.updated',
  'goal.created',
  'goal.completed',
  'user.created',
  'user.updated',
  'care_plan.created',
  'care_plan.updated',
  'lab_order.created',
  'lab_order.results_received',
  'invoice.created',
  'invoice.paid',
  'prescription.created',
  'prescription.sent',
] as const;

export type HealthieWebhookEvent = typeof HEALTHIE_WEBHOOK_EVENTS[number];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get features available for a specific membership tier
 */
export function getFeaturesForTier(tier: string): HealthieFeature[] {
  return HEALTHIE_FEATURES.filter(feature => 
    feature.memberTiers.includes(tier as HealthieFeature['memberTiers'][number])
  );
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: HealthieCategory): HealthieFeature[] {
  return HEALTHIE_FEATURES.filter(feature => feature.category === category);
}

/**
 * Get the appropriate API URL based on environment
 */
export function getHealthieApiUrl(): string {
  const env = (process.env.HEALTHIE_ENVIRONMENT || 'sandbox') as HealthieEnvironment;
  return HEALTHIE_URLS.api[env];
}

/**
 * Get the patient portal URL
 */
export function getHealthiePatientPortalUrl(): string {
  const env = (process.env.HEALTHIE_ENVIRONMENT || 'sandbox') as HealthieEnvironment;
  return HEALTHIE_URLS.app[env];
}

/**
 * Get the provider portal URL
 */
export function getHealthieProviderPortalUrl(): string {
  const env = (process.env.HEALTHIE_ENVIRONMENT || 'sandbox') as HealthieEnvironment;
  return HEALTHIE_URLS.provider[env];
}

// ============================================================
// QUICK ACCESS ACTIONS (Dashboard Buttons)
// ============================================================

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  href?: string;
  action?: 'book' | 'message' | 'forms' | 'labs' | 'portal';
  variant: 'primary' | 'secondary' | 'outline';
  memberTiers: ('core' | 'creator' | 'catalyst' | 'concierge' | 'club')[];
}

export const DASHBOARD_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'book-consultation',
    label: 'Book Consultation',
    description: 'Schedule your next appointment',
    icon: 'Calendar',
    action: 'book',
    variant: 'primary',
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'message-provider',
    label: 'Message Provider',
    description: 'Send a secure message',
    icon: 'MessageSquare',
    action: 'message',
    variant: 'secondary',
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'view-labs',
    label: 'View Lab Results',
    description: 'Check your latest biomarkers',
    icon: 'TestTube2',
    action: 'labs',
    variant: 'outline',
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'complete-forms',
    label: 'Complete Forms',
    description: 'Finish pending intake forms',
    icon: 'ClipboardCheck',
    action: 'forms',
    variant: 'outline',
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
  {
    id: 'patient-portal',
    label: 'Open Patient Portal',
    description: 'Full access to Healthie portal',
    icon: 'ExternalLink',
    action: 'portal',
    variant: 'outline',
    memberTiers: ['core', 'creator', 'catalyst', 'concierge', 'club'],
  },
];
