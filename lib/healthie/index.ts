// Healthie API — Barrel Export
// GraphQL client for Healthie EMR (Group tier)
// Staging: https://staging-api.gethealthie.com/graphql
// Production: https://api.gethealthie.com/graphql

export { isHealthieConfigured, HealthieApiError } from './client'
export { createClient, createAppointment, createFormAnswerGroup, createDocument } from './mutations'
export { getClient, getClientByEmail, getAppointment, getAppointments, getFormAnswerGroup, getDocument, getDocuments } from './queries'
export { mapAppointmentToPortalOrder } from './portal-mapper'
export { readWebhookBody, verifyHealthieWebhook, parseWebhookBody } from './webhooks'
export type {
  HealthieUser,
  HealthieAppointment,
  HealthieFormAnswerGroup,
  HealthieDocument,
  CreateClientInput,
  CreateAppointmentInput,
  CreateFormAnswerGroupInput,
  CreateDocumentInput,
  EhrProvider,
} from './types'
