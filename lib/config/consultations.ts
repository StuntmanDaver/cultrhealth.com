export const CONSULTATION_TYPES = {
  initial: {
    slug: 'initial',
    label: 'Initial Consultation',
    duration: 30,
    description: 'First-time consultation with a CULTR provider',
  },
  follow_up: {
    slug: 'follow_up',
    label: 'Follow-up',
    duration: 15,
    description: 'Ongoing care check-in with your provider',
  },
  renewal: {
    slug: 'renewal',
    label: 'Renewal',
    duration: 15,
    description: 'Prescription renewal consultation',
  },
} as const

export type ConsultationType = keyof typeof CONSULTATION_TYPES

export const TIER_CONSULTATION_LIMITS: Record<string, number> = {
  club: 0,
  core: 1,
  catalyst: 2,
  concierge: Infinity,
}

export type ProviderType = 'cultr_staff' | 'cultr_provider' | 'asher_provider'

export interface ProviderConfig {
  name: string
  email: string
  type: ProviderType
  calcomEventTypeIds: Record<ConsultationType, number>
}

// Map provider emails to their Cal.com event type IDs
// Update these after creating event types in Cal.com dashboard
export const PROVIDER_MAP: Record<string, ProviderConfig> = {
  // Example — replace with real provider data:
  // 'provider@cultrhealth.com': {
  //   name: 'Dr. Provider',
  //   email: 'provider@cultrhealth.com',
  //   type: 'cultr_provider',
  //   calcomEventTypeIds: { initial: 123456, follow_up: 123457, renewal: 123458 },
  // },
}

export const CONSULTATION_STATUSES = {
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700' },
  in_progress: { label: 'In Progress', bg: 'bg-green-50', text: 'text-green-700' },
  completed: { label: 'Completed', bg: 'bg-brand-primary/5', text: 'text-brand-primary' },
  cancelled: { label: 'Cancelled', bg: 'bg-brand-primary/5', text: 'text-brand-primary/60' },
  no_show: { label: 'No Show', bg: 'bg-red-50', text: 'text-red-700' },
} as const

export const RECORDING_CONSENT_TEXT =
  'I consent to this consultation being recorded for medical documentation purposes. Recordings are stored securely and accessible only to your care team.'
