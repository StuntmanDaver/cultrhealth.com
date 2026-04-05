// Healthie GraphQL Queries
// HIPAA: Never log patient data in query responses

import { z } from 'zod'
import { healthieRequest } from './client'
import {
  HealthieUserSchema,
  HealthieAppointmentSchema,
  HealthieFormAnswerGroupSchema,
  HealthieDocumentSchema,
} from './schemas'
import type {
  HealthieUser,
  HealthieAppointment,
  HealthieDocument,
} from './types'

// ============================================================
// CLIENT / PATIENT
// ============================================================

const GET_CLIENT = `
  query GetUser($id: ID) {
    user(id: $id) {
      id
      first_name
      last_name
      email
      phone_number
      dob
      active_status
      created_at
    }
  }
`

export async function getClient(id: string): Promise<HealthieUser> {
  return healthieRequest(
    GET_CLIENT,
    { id },
    HealthieUserSchema,
    'user',
  )
}

const GET_CLIENT_BY_EMAIL = `
  query GetUsers($email: String) {
    users(email: $email) {
      id
      first_name
      last_name
      email
      phone_number
      dob
      active_status
      created_at
    }
  }
`

export async function getClientByEmail(email: string): Promise<HealthieUser | null> {
  const result = await healthieRequest(
    GET_CLIENT_BY_EMAIL,
    { email },
    z.array(HealthieUserSchema),
    'users',
  )
  return result.length > 0 ? result[0] : null
}

// ============================================================
// APPOINTMENTS
// ============================================================

const GET_APPOINTMENT = `
  query GetAppointment($id: ID) {
    appointment(id: $id) {
      id
      date
      start_time
      end_time
      appointment_type {
        id
        name
      }
      contact_type
      status
      user {
        id
        first_name
        last_name
      }
    }
  }
`

export async function getAppointment(id: string): Promise<HealthieAppointment> {
  return healthieRequest(
    GET_APPOINTMENT,
    { id },
    HealthieAppointmentSchema,
    'appointment',
  )
}

const GET_APPOINTMENTS = `
  query GetAppointments($user_id: String, $filter: String) {
    appointments(user_id: $user_id, filter: $filter) {
      id
      date
      start_time
      end_time
      appointment_type {
        id
        name
      }
      contact_type
      status
      user {
        id
        first_name
        last_name
      }
    }
  }
`

export async function getAppointments(
  userId: string,
  filter?: string,
): Promise<HealthieAppointment[]> {
  return healthieRequest(
    GET_APPOINTMENTS,
    { user_id: userId, filter },
    z.array(HealthieAppointmentSchema),
    'appointments',
  )
}

// ============================================================
// FORM ANSWER GROUPS
// ============================================================

const FormAnswerGroupWithUserSchema = HealthieFormAnswerGroupSchema.extend({
  user: z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
  }).passthrough().nullable().optional(),
})

const GET_FORM_ANSWER_GROUP = `
  query GetFormAnswerGroup($id: ID) {
    formAnswerGroup(id: $id) {
      id
      finished
      created_at
      user {
        id
        email
      }
      custom_module_form {
        id
        name
      }
    }
  }
`

export async function getFormAnswerGroup(id: string): Promise<z.infer<typeof FormAnswerGroupWithUserSchema>> {
  return healthieRequest(
    GET_FORM_ANSWER_GROUP,
    { id },
    FormAnswerGroupWithUserSchema,
    'formAnswerGroup',
  )
}

// ============================================================
// DOCUMENTS
// ============================================================

const GET_DOCUMENT = `
  query GetDocument($id: ID) {
    document(id: $id) {
      id
      display_name
      created_at
      document_type
      rel_user_id
    }
  }
`

export async function getDocument(id: string): Promise<HealthieDocument> {
  return healthieRequest(
    GET_DOCUMENT,
    { id },
    HealthieDocumentSchema,
    'document',
  )
}

const GET_DOCUMENTS = `
  query GetDocuments($rel_user_id: String) {
    documents(rel_user_id: $rel_user_id) {
      id
      display_name
      created_at
      document_type
      rel_user_id
    }
  }
`

export async function getDocuments(userId: string): Promise<HealthieDocument[]> {
  return healthieRequest(
    GET_DOCUMENTS,
    { rel_user_id: userId },
    z.array(HealthieDocumentSchema),
    'documents',
  )
}
