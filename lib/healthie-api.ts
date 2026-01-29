// Healthie EHR API Integration
// Comprehensive GraphQL API client for CULTR Health Longevity Clinic
// Reference: https://docs.gethealthie.com

import { getHealthieApiUrl } from './config/healthie';

// ============================================================
// TYPES
// ============================================================

type HealthieResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export interface HealthieUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  dob?: string;
  is_patient?: boolean;
  active?: boolean;
  created_at?: string;
}

export interface HealthieAppointment {
  id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  appointment_type_id?: string;
  provider_id?: string;
  patient_id?: string;
  status?: string;
  location?: string;
  notes?: string;
  is_zoom?: boolean;
  zoom_url?: string;
  provider?: HealthieUser;
  appointment_type?: {
    id: string;
    name: string;
    length?: number;
  };
}

export interface HealthieConversation {
  id: string;
  created_at: string;
  updated_at?: string;
  dietitian_id?: string;
  patient_id?: string;
  last_message_at?: string;
  unread_messages_count?: number;
  other_participant?: HealthieUser;
}

export interface HealthieMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id?: string;
  conversation_id?: string;
  is_read?: boolean;
  sender?: HealthieUser;
}

export interface HealthieDocument {
  id: string;
  display_name: string;
  description?: string;
  created_at?: string;
  file_content_type?: string;
  download_url?: string;
  rel_user_id?: string;
}

export interface HealthieCarePlan {
  id: string;
  name: string;
  description?: string;
  is_template?: boolean;
  is_hidden?: boolean;
  created_at?: string;
  patient_id?: string;
}

export interface HealthieFormTemplate {
  id: string;
  name: string;
  description?: string;
  is_intake_form?: boolean;
  created_at?: string;
}

export interface HealthieFormAnswerGroup {
  id: string;
  name?: string;
  form_template_id?: string;
  finished?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HealthieLabResult {
  id: string;
  name?: string;
  value?: string;
  unit?: string;
  normal_range?: string;
  date?: string;
  status?: string;
  lab_order_id?: string;
}

export interface HealthieLabOrder {
  id: string;
  created_at?: string;
  status?: string;
  lab_company?: string;
  patient_id?: string;
  lab_results?: HealthieLabResult[];
}

export interface HealthieInvoice {
  id: string;
  amount?: number;
  status?: string;
  due_date?: string;
  created_at?: string;
  patient_id?: string;
  items?: {
    description: string;
    amount: number;
  }[];
}

export interface HealthieCourseMembership {
  id: string;
  course_id?: string;
  user_id?: string;
  start_at?: string;
  progress_percentage?: number;
  completed?: boolean;
  course?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface HealthieMedication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  active?: boolean;
  prescriber?: string;
}

export interface HealthieAllergy {
  id: string;
  name: string;
  reaction?: string;
  severity?: string;
}

export interface HealthieEntry {
  id: string;
  entry_type?: string;
  metric_value?: number;
  metric_unit?: string;
  description?: string;
  created_at?: string;
}

// ============================================================
// API CLIENT
// ============================================================

const HEALTHIE_API_URL = getHealthieApiUrl();
const HEALTHIE_API_KEY = process.env.HEALTHIE_API_KEY;

async function healthieRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  if (!HEALTHIE_API_KEY) {
    throw new Error('HEALTHIE_API_KEY is not configured');
  }

  const response = await fetch(HEALTHIE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Basic ${HEALTHIE_API_KEY}`,
      AuthorizationSource: 'API',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = (await response.json()) as HealthieResponse<T>;

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(', '));
  }

  if (!result.data) {
    throw new Error('Healthie API returned no data');
  }

  return result.data;
}

// ============================================================
// PATIENT / USER OPERATIONS
// ============================================================

export async function getPatientById(
  patientId: string
): Promise<HealthieUser | null> {
  const query = `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        first_name
        last_name
        email
        phone_number
        dob
        is_patient
        active
        created_at
      }
    }
  `;

  const data = await healthieRequest<{ user: HealthieUser | null }>(query, {
    id: patientId,
  });

  if (!data.user || data.user.is_patient === false) {
    return null;
  }

  return data.user;
}

export async function getPatientByEmail(
  email: string
): Promise<HealthieUser | null> {
  const query = `
    query GetUserByEmail($email: String!) {
      users(email: $email, is_patient: true) {
        id
        first_name
        last_name
        email
        phone_number
        dob
        is_patient
        active
        created_at
      }
    }
  `;

  const data = await healthieRequest<{ users: HealthieUser[] }>(query, {
    email,
  });

  return data.users?.[0] ?? null;
}

export async function createPatient(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dob?: string;
}): Promise<HealthieUser> {
  const mutation = `
    mutation CreateClient($input: createClientInput!) {
      createClient(input: $input) {
        user {
          id
          first_name
          last_name
          email
          phone_number
          dob
          is_patient
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phoneNumber,
      dob: input.dob,
    },
  };

  const data = await healthieRequest<{
    createClient: { user: HealthieUser | null };
  }>(mutation, variables);

  if (!data.createClient?.user) {
    throw new Error('Failed to create patient');
  }

  return data.createClient.user;
}

export async function updatePatient(
  patientId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dob?: string;
  }
): Promise<HealthieUser> {
  const mutation = `
    mutation UpdateClient($input: updateClientInput!) {
      updateClient(input: $input) {
        user {
          id
          first_name
          last_name
          email
          phone_number
          dob
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: patientId,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phoneNumber,
      dob: input.dob,
    },
  };

  const data = await healthieRequest<{
    updateClient: { user: HealthieUser | null };
  }>(mutation, variables);

  if (!data.updateClient?.user) {
    throw new Error('Failed to update patient');
  }

  return data.updateClient.user;
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function getUpcomingAppointments(
  patientId: string,
  limit = 10
): Promise<HealthieAppointment[]> {
  const query = `
    query GetAppointments($patientId: ID!, $limit: Int) {
      appointments(
        user_id: $patientId
        filter: "future"
        per_page: $limit
      ) {
        id
        date
        start_time
        end_time
        status
        location
        notes
        is_zoom
        zoom_url
        provider {
          id
          first_name
          last_name
        }
        appointment_type {
          id
          name
          length
        }
      }
    }
  `;

  const data = await healthieRequest<{ appointments: HealthieAppointment[] }>(
    query,
    { patientId, limit }
  );

  return data.appointments ?? [];
}

export async function getPastAppointments(
  patientId: string,
  limit = 10
): Promise<HealthieAppointment[]> {
  const query = `
    query GetPastAppointments($patientId: ID!, $limit: Int) {
      appointments(
        user_id: $patientId
        filter: "past"
        per_page: $limit
      ) {
        id
        date
        start_time
        end_time
        status
        notes
        provider {
          id
          first_name
          last_name
        }
        appointment_type {
          id
          name
          length
        }
      }
    }
  `;

  const data = await healthieRequest<{ appointments: HealthieAppointment[] }>(
    query,
    { patientId, limit }
  );

  return data.appointments ?? [];
}

export async function getAppointmentTypes(): Promise<
  { id: string; name: string; length: number }[]
> {
  const query = `
    query GetAppointmentTypes {
      appointmentTypes {
        id
        name
        length
        is_bookable
      }
    }
  `;

  const data = await healthieRequest<{
    appointmentTypes: { id: string; name: string; length: number }[];
  }>(query, {});

  return data.appointmentTypes ?? [];
}

export async function createAppointment(input: {
  patientId: string;
  providerId: string;
  appointmentTypeId: string;
  datetime: string;
  notes?: string;
}): Promise<HealthieAppointment> {
  const mutation = `
    mutation CreateAppointment($input: createAppointmentInput!) {
      createAppointment(input: $input) {
        appointment {
          id
          date
          start_time
          end_time
          status
          zoom_url
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      user_id: input.patientId,
      provider_id: input.providerId,
      appointment_type_id: input.appointmentTypeId,
      datetime: input.datetime,
      notes: input.notes,
    },
  };

  const data = await healthieRequest<{
    createAppointment: { appointment: HealthieAppointment | null };
  }>(mutation, variables);

  if (!data.createAppointment?.appointment) {
    throw new Error('Failed to create appointment');
  }

  return data.createAppointment.appointment;
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  const mutation = `
    mutation DeleteAppointment($id: ID!) {
      deleteAppointment(input: { id: $id }) {
        appointment {
          id
        }
        messages {
          field
          message
        }
      }
    }
  `;

  await healthieRequest(mutation, { id: appointmentId });
}

// ============================================================
// MESSAGING / CONVERSATIONS
// ============================================================

export async function getConversations(
  patientId: string,
  limit = 20
): Promise<HealthieConversation[]> {
  const query = `
    query GetConversations($patientId: ID!, $limit: Int) {
      conversationMemberships(
        client_id: $patientId
        per_page: $limit
      ) {
        conversation {
          id
          created_at
          updated_at
          last_message_at
          dietitian_id
          patient_id
        }
      }
    }
  `;

  const data = await healthieRequest<{
    conversationMemberships: { conversation: HealthieConversation }[];
  }>(query, { patientId, limit });

  return (
    data.conversationMemberships?.map((m) => m.conversation) ?? []
  );
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50
): Promise<HealthieMessage[]> {
  const query = `
    query GetMessages($conversationId: ID!, $limit: Int) {
      notes(
        conversation_id: $conversationId
        per_page: $limit
      ) {
        id
        content
        created_at
        user_id
        conversation_id
        user {
          id
          first_name
          last_name
        }
      }
    }
  `;

  const data = await healthieRequest<{ notes: HealthieMessage[] }>(query, {
    conversationId,
    limit,
  });

  return data.notes ?? [];
}

export async function sendMessage(input: {
  conversationId: string;
  content: string;
  senderId: string;
}): Promise<HealthieMessage> {
  const mutation = `
    mutation CreateNote($input: createNoteInput!) {
      createNote(input: $input) {
        note {
          id
          content
          created_at
          user_id
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      conversation_id: input.conversationId,
      content: input.content,
      user_id: input.senderId,
    },
  };

  const data = await healthieRequest<{
    createNote: { note: HealthieMessage | null };
  }>(mutation, variables);

  if (!data.createNote?.note) {
    throw new Error('Failed to send message');
  }

  return data.createNote.note;
}

// ============================================================
// CARE PLANS
// ============================================================

export async function getCarePlans(
  patientId: string
): Promise<HealthieCarePlan[]> {
  const query = `
    query GetCarePlans($patientId: ID!) {
      carePlans(patient_id: $patientId) {
        id
        name
        description
        is_template
        is_hidden
        created_at
      }
    }
  `;

  const data = await healthieRequest<{ carePlans: HealthieCarePlan[] }>(query, {
    patientId,
  });

  return data.carePlans ?? [];
}

export async function createCarePlan(input: {
  name: string;
  patientId?: string;
  isTemplate?: boolean;
  isHidden?: boolean;
  description?: string;
}): Promise<HealthieCarePlan> {
  const mutation = `
    mutation CreateCarePlan($input: createCarePlanInput!) {
      createCarePlan(input: $input) {
        carePlan {
          id
          name
          description
          is_template
        }
        messages {
          field
          message
        }
      }
    }
  `;

  if (!input.patientId && !input.isTemplate) {
    throw new Error(
      'patientId is required when creating a care plan for a patient'
    );
  }

  const variables = {
    input: {
      name: input.name,
      description: input.description,
      patient_id: input.patientId,
      is_hidden: input.isHidden ?? false,
      is_managing_templates: input.isTemplate ?? false,
    },
  };

  const data = await healthieRequest<{
    createCarePlan: { carePlan: HealthieCarePlan | null };
  }>(mutation, variables);

  if (!data.createCarePlan?.carePlan) {
    throw new Error('Failed to create care plan');
  }

  return data.createCarePlan.carePlan;
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getPatientDocuments(
  patientId: string,
  limit = 20
): Promise<HealthieDocument[]> {
  const query = `
    query GetDocuments($patientId: ID!, $limit: Int) {
      documents(
        rel_user_id: $patientId
        per_page: $limit
      ) {
        id
        display_name
        description
        created_at
        file_content_type
        download_url
      }
    }
  `;

  const data = await healthieRequest<{ documents: HealthieDocument[] }>(query, {
    patientId,
    limit,
  });

  return data.documents ?? [];
}

export async function createDocument(input: {
  title: string;
  content: string;
  patientId: string;
  carePlanId?: string;
  description?: string;
}): Promise<HealthieDocument> {
  const mutation = `
    mutation CreateDocument($input: createDocumentInput!) {
      createDocument(input: $input) {
        document {
          id
          display_name
          description
          download_url
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      display_name: input.title,
      description: input.description ?? '',
      file_string: Buffer.from(input.content, 'utf-8').toString('base64'),
      rel_user_id: input.patientId,
      share_with_rel: true,
      care_plan_id: input.carePlanId,
    },
  };

  const data = await healthieRequest<{
    createDocument: { document: HealthieDocument | null };
  }>(mutation, variables);

  if (!data.createDocument?.document) {
    throw new Error('Failed to create document');
  }

  return data.createDocument.document;
}

// ============================================================
// FORMS & INTAKE
// ============================================================

export async function getAvailableForms(): Promise<HealthieFormTemplate[]> {
  const query = `
    query GetFormTemplates {
      customModuleFormTemplates {
        id
        name
        description
        is_intake_form
        created_at
      }
    }
  `;

  const data = await healthieRequest<{
    customModuleFormTemplates: HealthieFormTemplate[];
  }>(query, {});

  return data.customModuleFormTemplates ?? [];
}

export async function getPatientFormResponses(
  patientId: string
): Promise<HealthieFormAnswerGroup[]> {
  const query = `
    query GetFormAnswerGroups($patientId: ID!) {
      formAnswerGroups(user_id: $patientId) {
        id
        name
        custom_module_form_id
        finished
        created_at
        updated_at
      }
    }
  `;

  const data = await healthieRequest<{
    formAnswerGroups: HealthieFormAnswerGroup[];
  }>(query, { patientId });

  return data.formAnswerGroups ?? [];
}

export async function getPendingForms(
  patientId: string
): Promise<HealthieFormAnswerGroup[]> {
  const responses = await getPatientFormResponses(patientId);
  return responses.filter((form) => !form.finished);
}

// ============================================================
// LAB RESULTS
// ============================================================

export async function getLabOrders(
  patientId: string,
  limit = 10
): Promise<HealthieLabOrder[]> {
  const query = `
    query GetLabOrders($patientId: ID!, $limit: Int) {
      labOrders(
        client_id: $patientId
        per_page: $limit
      ) {
        id
        created_at
        status
        lab_company
      }
    }
  `;

  const data = await healthieRequest<{ labOrders: HealthieLabOrder[] }>(query, {
    patientId,
    limit,
  });

  return data.labOrders ?? [];
}

export async function getLabResults(
  labOrderId: string
): Promise<HealthieLabResult[]> {
  const query = `
    query GetLabResults($labOrderId: ID!) {
      labResults(lab_order_id: $labOrderId) {
        id
        name
        value
        unit
        normal_range
        date
        status
      }
    }
  `;

  const data = await healthieRequest<{ labResults: HealthieLabResult[] }>(
    query,
    { labOrderId }
  );

  return data.labResults ?? [];
}

// ============================================================
// BILLING & INVOICES
// ============================================================

export async function getInvoices(
  patientId: string,
  limit = 20
): Promise<HealthieInvoice[]> {
  const query = `
    query GetInvoices($patientId: ID!, $limit: Int) {
      requestedPayments(
        client_id: $patientId
        per_page: $limit
      ) {
        id
        price
        status
        created_at
        notes
      }
    }
  `;

  const data = await healthieRequest<{
    requestedPayments: HealthieInvoice[];
  }>(query, { patientId, limit });

  return data.requestedPayments ?? [];
}

export async function getOutstandingBalance(patientId: string): Promise<number> {
  const invoices = await getInvoices(patientId);
  return invoices
    .filter((inv) => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
}

// ============================================================
// PROGRAMS & COURSES
// ============================================================

export async function getEnrolledPrograms(
  patientId: string
): Promise<HealthieCourseMembership[]> {
  const query = `
    query GetCourseMemberships($patientId: ID!) {
      courseMemberships(user_id: $patientId) {
        id
        course_id
        start_at
        progress_percentage
        completed
        course {
          id
          name
          description
        }
      }
    }
  `;

  const data = await healthieRequest<{
    courseMemberships: HealthieCourseMembership[];
  }>(query, { patientId });

  return data.courseMemberships ?? [];
}

export async function enrollInProgram(input: {
  courseMembershipId: string;
  startAt?: string;
}): Promise<{ id: string }> {
  const mutation = `
    mutation UpdateCourseMembership($input: updateCourseMembershipInput!) {
      updateCourseMembership(input: $input) {
        courseMembership {
          id
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: input.courseMembershipId,
      start_at: input.startAt,
    },
  };

  const data = await healthieRequest<{
    updateCourseMembership: { courseMembership: { id: string } | null };
  }>(mutation, variables);

  if (!data.updateCourseMembership?.courseMembership) {
    throw new Error('Failed to update program enrollment');
  }

  return { id: data.updateCourseMembership.courseMembership.id };
}

// ============================================================
// MEDICATIONS & ALLERGIES
// ============================================================

export async function getMedications(
  patientId: string
): Promise<HealthieMedication[]> {
  const query = `
    query GetMedications($patientId: ID!) {
      medications(user_id: $patientId) {
        id
        name
        dosage
        frequency
        start_date
        end_date
        active
      }
    }
  `;

  const data = await healthieRequest<{ medications: HealthieMedication[] }>(
    query,
    { patientId }
  );

  return data.medications ?? [];
}

export async function getAllergies(
  patientId: string
): Promise<HealthieAllergy[]> {
  const query = `
    query GetAllergies($patientId: ID!) {
      allergies(user_id: $patientId) {
        id
        name
        reaction
        severity
      }
    }
  `;

  const data = await healthieRequest<{ allergies: HealthieAllergy[] }>(query, {
    patientId,
  });

  return data.allergies ?? [];
}

// ============================================================
// HEALTH METRICS / ENTRIES
// ============================================================

export async function getHealthEntries(
  patientId: string,
  entryType?: string,
  limit = 30
): Promise<HealthieEntry[]> {
  const query = `
    query GetEntries($patientId: ID!, $entryType: String, $limit: Int) {
      entries(
        user_id: $patientId
        type: $entryType
        per_page: $limit
      ) {
        id
        type
        metric_stat
        description
        created_at
      }
    }
  `;

  const data = await healthieRequest<{ entries: HealthieEntry[] }>(query, {
    patientId,
    entryType,
    limit,
  });

  return data.entries ?? [];
}

export async function createHealthEntry(input: {
  patientId: string;
  entryType: string;
  metricValue?: number;
  description?: string;
}): Promise<HealthieEntry> {
  const mutation = `
    mutation CreateEntry($input: createEntryInput!) {
      createEntry(input: $input) {
        entry {
          id
          type
          metric_stat
          description
          created_at
        }
        messages {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      user_id: input.patientId,
      type: input.entryType,
      metric_stat: input.metricValue,
      description: input.description,
    },
  };

  const data = await healthieRequest<{
    createEntry: { entry: HealthieEntry | null };
  }>(mutation, variables);

  if (!data.createEntry?.entry) {
    throw new Error('Failed to create health entry');
  }

  return data.createEntry.entry;
}

// ============================================================
// PROVIDER / CARE TEAM
// ============================================================

export async function getCareTeam(
  patientId: string
): Promise<HealthieUser[]> {
  const query = `
    query GetCareTeam($patientId: ID!) {
      user(id: $patientId) {
        dietitian {
          id
          first_name
          last_name
          email
        }
        care_team_members {
          id
          first_name
          last_name
          email
        }
      }
    }
  `;

  const data = await healthieRequest<{
    user: {
      dietitian?: HealthieUser;
      care_team_members?: HealthieUser[];
    } | null;
  }>(query, { patientId });

  const team: HealthieUser[] = [];
  if (data.user?.dietitian) {
    team.push(data.user.dietitian);
  }
  if (data.user?.care_team_members) {
    team.push(...data.user.care_team_members);
  }

  return team;
}

// ============================================================
// WEBHOOKS (for server-side handling)
// ============================================================

export interface HealthieWebhookPayload {
  event_type: string;
  resource_id: string;
  resource_type: string;
  data: Record<string, unknown>;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================================
// PATIENT PORTAL URL GENERATION
// ============================================================

export function getPatientPortalUrl(patientId?: string): string {
  const baseUrl =
    process.env.HEALTHIE_ENVIRONMENT === 'production'
      ? 'https://secureclient.gethealthie.com'
      : 'https://staging-secureclient.gethealthie.com';

  if (patientId) {
    return `${baseUrl}?user_id=${patientId}`;
  }

  return baseUrl;
}

export function getBookingUrl(appointmentTypeId?: string): string {
  const baseUrl = getPatientPortalUrl();
  if (appointmentTypeId) {
    return `${baseUrl}/book/${appointmentTypeId}`;
  }
  return `${baseUrl}/book`;
}

export function getMessagingUrl(): string {
  return `${getPatientPortalUrl()}/messages`;
}

export function getFormsUrl(): string {
  return `${getPatientPortalUrl()}/forms`;
}

export function getLabsUrl(): string {
  return `${getPatientPortalUrl()}/labs`;
}

export function getDocumentsUrl(): string {
  return `${getPatientPortalUrl()}/documents`;
}

export function getBillingUrl(): string {
  return `${getPatientPortalUrl()}/billing`;
}

export function getProfileUrl(): string {
  return `${getPatientPortalUrl()}/profile`;
}
