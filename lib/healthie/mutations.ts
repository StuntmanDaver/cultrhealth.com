// Healthie GraphQL Mutations
// HIPAA: Never log patient data in mutation inputs or responses

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
  HealthieFormAnswerGroup,
  HealthieDocument,
  CreateClientInput,
  CreateAppointmentInput,
  CreateFormAnswerGroupInput,
  CreateDocumentInput,
} from './types'

// ============================================================
// CLIENT / PATIENT
// ============================================================

const CREATE_CLIENT = `
  mutation CreateClient(
    $first_name: String
    $last_name: String
    $email: String
    $phone_number: String
    $dob: String
    $legal_name: String
    $dietitian_id: String
    $skipped_email: Boolean
  ) {
    createClient(input: {
      first_name: $first_name
      last_name: $last_name
      email: $email
      phone_number: $phone_number
      dob: $dob
      legal_name: $legal_name
      dietitian_id: $dietitian_id
      skipped_email: $skipped_email
    }) {
      user {
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
  }
`

export async function createClient(input: CreateClientInput): Promise<HealthieUser> {
  const result = await healthieRequest(
    CREATE_CLIENT,
    input as unknown as Record<string, unknown>,
    HealthieUserSchema,
    'createClient',
  )
  // createClient returns { user: {...} } — extract the nested user
  const data = result as unknown as Record<string, unknown>
  if (data.user) {
    return HealthieUserSchema.parse(data.user)
  }
  return result
}

// ============================================================
// APPOINTMENT
// ============================================================

const CREATE_APPOINTMENT = `
  mutation CreateAppointment(
    $user_id: String
    $appointment_type_id: String
    $contact_type: String
    $datetime: String
    $end_datetime: String
    $notes: String
    $external_videochat_url: String
    $metadata: JSON
  ) {
    createAppointment(input: {
      user_id: $user_id
      appointment_type_id: $appointment_type_id
      contact_type: $contact_type
      datetime: $datetime
      end_datetime: $end_datetime
      notes: $notes
      external_videochat_url: $external_videochat_url
      metadata: $metadata
    }) {
      appointment {
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
  }
`

export async function createAppointment(input: CreateAppointmentInput): Promise<HealthieAppointment> {
  const result = await healthieRequest(
    CREATE_APPOINTMENT,
    input as unknown as Record<string, unknown>,
    HealthieAppointmentSchema,
    'createAppointment',
  )
  const data = result as unknown as Record<string, unknown>
  if (data.appointment) {
    return HealthieAppointmentSchema.parse(data.appointment)
  }
  return result
}

// ============================================================
// FORM ANSWER GROUP (Intake Forms)
// ============================================================

const CREATE_FORM_ANSWER_GROUP = `
  mutation CreateFormAnswerGroup(
    $custom_module_form_id: String
    $user_id: String
    $finished: Boolean
    $form_answers: [FormAnswerInput]
  ) {
    createFormAnswerGroup(input: {
      custom_module_form_id: $custom_module_form_id
      user_id: $user_id
      finished: $finished
      form_answers: $form_answers
    }) {
      form_answer_group {
        id
        finished
        created_at
        custom_module_form {
          id
          name
        }
      }
    }
  }
`

export async function createFormAnswerGroup(input: CreateFormAnswerGroupInput): Promise<HealthieFormAnswerGroup> {
  const result = await healthieRequest(
    CREATE_FORM_ANSWER_GROUP,
    input as unknown as Record<string, unknown>,
    HealthieFormAnswerGroupSchema,
    'createFormAnswerGroup',
  )
  const data = result as unknown as Record<string, unknown>
  if (data.form_answer_group) {
    return HealthieFormAnswerGroupSchema.parse(data.form_answer_group)
  }
  return result
}

// ============================================================
// DOCUMENT (Lab Results, Files)
// ============================================================

const CREATE_DOCUMENT = `
  mutation CreateDocument(
    $user_id: String
    $rel_user_id: String
    $display_name: String
    $file_string: String
    $share_with_rel: Boolean
  ) {
    createDocument(input: {
      user_id: $user_id
      rel_user_id: $rel_user_id
      display_name: $display_name
      file_string: $file_string
      share_with_rel: $share_with_rel
    }) {
      document {
        id
        display_name
        created_at
        document_type
        rel_user_id
      }
    }
  }
`

export async function createDocument(input: CreateDocumentInput): Promise<HealthieDocument> {
  const result = await healthieRequest(
    CREATE_DOCUMENT,
    input as unknown as Record<string, unknown>,
    HealthieDocumentSchema,
    'createDocument',
  )
  const data = result as unknown as Record<string, unknown>
  if (data.document) {
    return HealthieDocumentSchema.parse(data.document)
  }
  return result
}
