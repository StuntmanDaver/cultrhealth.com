// Healthie API Types
// Types inferred from Zod schemas plus request/input types

import { z } from 'zod'
import {
  HealthieUserSchema,
  HealthieAppointmentSchema,
  HealthieFormAnswerGroupSchema,
  HealthieDocumentSchema,
  HealthieWebhookSchema,
} from './schemas'

// ============================================================
// RESPONSE TYPES (inferred from Zod schemas)
// ============================================================

export type HealthieUser = z.infer<typeof HealthieUserSchema>
export type HealthieAppointment = z.infer<typeof HealthieAppointmentSchema>
export type HealthieFormAnswerGroup = z.infer<typeof HealthieFormAnswerGroupSchema>
export type HealthieDocument = z.infer<typeof HealthieDocumentSchema>
export type HealthieWebhook = z.infer<typeof HealthieWebhookSchema>

// ============================================================
// INPUT TYPES (outgoing — not derived from Zod)
// ============================================================

export interface CreateClientInput {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  dietitian_id?: string
  skipped_email?: boolean
  dont_send_welcome?: boolean
}

export interface CreateAppointmentInput {
  user_id: string
  appointment_type_id?: string
  contact_type?: string
  datetime?: string
  end_datetime?: string
  notes?: string
  external_videochat_url?: string
  metadata?: Record<string, string>
}

export interface CreateFormAnswerGroupInput {
  custom_module_form_id: string
  user_id: string
  finished?: boolean
  form_answers: FormAnswerInput[]
}

export interface FormAnswerInput {
  custom_module_id: string
  answer: string
  user_id?: string
}

export interface CreateDocumentInput {
  user_id: string
  rel_user_id?: string
  display_name?: string
  file_string?: string
  share_with_rel?: boolean
}

export interface CreateWebhookInput {
  url: string
  event_type: string
  is_retry_on?: boolean
}

// ============================================================
// GRAPHQL RESPONSE WRAPPERS
// ============================================================

export interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

export interface GraphQLError {
  message: string
  locations?: { line: number; column: number }[]
  path?: string[]
  extensions?: Record<string, unknown>
}

// ============================================================
// EHR PROVIDER ENUM
// ============================================================

export type EhrProvider = 'asher' | 'healthie'
