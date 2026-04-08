// Healthie API Response Schemas
// Zod schemas for runtime validation of Healthie GraphQL responses
// All object schemas use .passthrough() to allow unknown fields
// (Healthie's GraphQL API may return additional fields not documented)

import { z } from 'zod'

// ============================================================
// USER / CLIENT
// ============================================================

export const HealthieUserSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone_number: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  active_status: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
}).passthrough()

// ============================================================
// APPOINTMENT
// ============================================================

export const HealthieAppointmentSchema = z.object({
  id: z.string(),
  date: z.string().nullable().optional(),
  length: z.number().nullable().optional(),
  appointment_type: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    length: z.number().nullable().optional(),
  }).passthrough().nullable().optional(),
  contact_type: z.string().nullable().optional(),
  pm_status: z.string().nullable().optional(),
  user: z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }).passthrough().nullable().optional(),
  provider: z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }).passthrough().nullable().optional(),
}).passthrough()

// ============================================================
// FORM ANSWER GROUP
// ============================================================

export const HealthieFormAnswerGroupSchema = z.object({
  id: z.string(),
  finished: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  custom_module_form: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
  }).passthrough().nullable().optional(),
}).passthrough()

// ============================================================
// DOCUMENT
// ============================================================

export const HealthieDocumentSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  document_type: z.string().nullable().optional(),
  rel_user_id: z.string().nullable().optional(),
}).passthrough()

// ============================================================
// WEBHOOK
// ============================================================

export const HealthieWebhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  event_type: z.string(),
  is_retry_on: z.boolean().nullable().optional(),
}).passthrough()
