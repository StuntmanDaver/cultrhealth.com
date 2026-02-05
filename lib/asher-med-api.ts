// Asher Med Partner Portal API Client
// HIPAA-Compliant API Integration for Weight Loss & Wellness Orders
// Reference: Asher Med API Documentation v1.0.0

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type AsherGender = 'MALE' | 'FEMALE';

export type AsherPatientStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type AsherOrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'WaitingRoom';

export type AsherApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AsherMedicationName =
  | 'Tirzepatide'
  | 'Semaglutide'
  | 'NAD+'
  | 'Sermorelin'
  | 'Glutathione'
  | 'Other'
  | 'AOD9604'
  | 'BPC-157/TB-500'
  | 'GHK-Cu'
  | 'Lipo-B'
  | 'Lipo-C'
  | 'MOTS-C'
  | 'Semax/Selank';

export type AsherMedicationType = 'Injection' | 'Troche';

export type AsherMedicationTypeSelection = 'GLP1' | 'NonGLP1';

export interface AsherPatient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: AsherGender;
  status: AsherPatientStatus;
  createdAt: string;
  updatedAt: string;
  address1?: string;
  address2?: string | null;
  city?: string;
  stateAbbreviation?: string;
  zipcode?: string;
  country?: string;
  apartmentNumber?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  currentBodyFat?: number;
}

export interface AsherOrder {
  id: number;
  patientId: number;
  doctorId?: number;
  status: AsherOrderStatus;
  orderType?: string;
  partnerNote?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Partial<AsherPatient>;
}

export interface AsherMedicationPackage {
  name: AsherMedicationName;
  duration: number;
  medicationType: AsherMedicationType;
}

export interface AsherPersonalInformation {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: AsherGender;
}

export interface AsherShippingAddress {
  address1: string;
  city: string;
  stateAbbreviation: string;
  zipCode: string;
  country: string;
  apartmentNumber?: string;
  addressAdditionalInfo?: string;
}

export interface AsherPhysicalMeasurements {
  height: number; // inches
  weight: number; // lbs
  bmi: number;
  currentBodyFat?: number; // 0-100
}

export interface AsherIDDocumentUpload {
  frontIDFileS3Key: string;
  isGovernmentIDConfirmed: boolean;
}

export interface AsherTelehealthConsent {
  agreeTelehealthService: boolean;
  telehealthSigS3Key: string;
}

export interface AsherConsentAcknowledgments {
  consentCompoundedSigS3Key: string;
  consentHealthcareConsultation: boolean;
}

export interface AsherCurrentMedicationDetails {
  last_injection_date?: string;
  current_medication_dosage_information?: {
    units?: string;
    doseMg?: string;
    concentrationMgPerMl?: string;
  };
  which_medications_have_you_been_taking?: string;
  current_medication_prescription_label_photo?: {
    prescriptionPhotoS3Key?: string;
  };
  how_long_have_you_been_taking_this_medication?: string;
  how_long_have_you_been_on_your_current_dose_of_this_medication?: string;
}

export interface AsherTreatmentPreferences {
  providerCustomSolution?: 'yes_custom' | 'no_custom';
  providerCustomSolutionMuscleLoss?: 'yes_muscle_prevention' | 'no_muscle_prevention';
}

export interface AsherDosingPlanPreferences {
  autoTitrateMonths?: 'yes auto_titrate' | 'no auto_titrate';
  doseChangePreference?: 'move_up' | 'move_down' | 'maintain';
}

// Wellness questionnaire is dynamic based on intake questions
export type AsherWellnessQuestionnaire = Record<string, unknown>;

// GLP-1 medication history is dynamic based on intake questions
export type AsherGLP1MedicationHistory = Record<string, unknown>;

export interface AsherNewOrderRequest {
  personalInformation: AsherPersonalInformation;
  shippingAddress: AsherShippingAddress;
  medicationPackages: AsherMedicationPackage[];
  idDocumentUpload: AsherIDDocumentUpload;
  telehealthConsent: AsherTelehealthConsent;
  consentAcknowledgments: AsherConsentAcknowledgments;
  physicalMeasurements: AsherPhysicalMeasurements;
  wellnessQuestionnaire?: AsherWellnessQuestionnaire;
  glp1MedicationHistory?: AsherGLP1MedicationHistory;
  currentMedicationDetails?: AsherCurrentMedicationDetails;
  treatmentPreferences: AsherTreatmentPreferences;
  dosingPlanPreferences?: AsherDosingPlanPreferences;
  medicationTypeSelection: AsherMedicationTypeSelection;
}

export interface AsherRenewalOrderRequest {
  personalInformation: AsherPersonalInformation;
  shippingAddress: AsherShippingAddress;
  medicationPackages: AsherMedicationPackage[];
  telehealthConsent: AsherTelehealthConsent;
  wellnessQuestionnaire: AsherWellnessQuestionnaire;
}

export interface AsherIntakeQuestions {
  success: boolean;
  data: Record<string, unknown>;
}

export interface AsherFileUploadResponse {
  success: boolean;
  data: {
    key: string;
    uploadUrl: string;
    previewUrl: string;
  };
}

export interface AsherPreviewUrlResponse {
  success: boolean;
  data: {
    key: string;
    previewUrl: string;
  };
}

export interface AsherPaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AsherApiError {
  success: false;
  error?: string | { message: string };
  message?: string;
}

export interface AsherApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export type AsherApiResponse<T> = AsherApiSuccess<T> | AsherApiError;

// ============================================================
// CONFIGURATION
// ============================================================

export function getAsherMedApiUrl(): string {
  return process.env.ASHER_MED_API_URL || 'https://prod-api.asherweightloss.com';
}

export function getAsherMedPartnerId(): string | undefined {
  return process.env.ASHER_MED_PARTNER_ID;
}

// ============================================================
// API CLIENT
// ============================================================

class AsherMedApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'AsherMedApiError';
  }
}

async function asherRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<T> {
  const apiKey = process.env.ASHER_MED_API_KEY;

  if (!apiKey) {
    throw new AsherMedApiError('ASHER_MED_API_KEY is not configured');
  }

  const baseUrl = getAsherMedApiUrl();
  let url = `${baseUrl}${endpoint}`;

  // Add query parameters if provided
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  };

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  let data: unknown;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data !== null
        ? (data as AsherApiError).message || (data as AsherApiError).error || 'Request failed'
        : 'Request failed';

    throw new AsherMedApiError(
      typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      response.status,
      data
    );
  }

  return data as T;
}

// ============================================================
// ORDERS ENDPOINTS
// ============================================================

/**
 * Get orders for the partner
 * GET /api/v1/external/partner/orders
 */
export async function getOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  patientId?: number;
}): Promise<AsherPaginatedResponse<AsherOrder>> {
  const response = await asherRequest<{
    orders?: AsherOrder[];
    data?: AsherOrder[];
    total?: number;
  }>('/api/v1/external/partner/orders', {
    params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      status: params?.status,
      patientId: params?.patientId,
    },
  });

  return {
    data: response.orders || response.data || [],
    total: response.total || 0,
  };
}

/**
 * Get order detail
 * GET /api/v1/external/partner/orders/{id}
 */
export async function getOrderDetail(orderId: number | string): Promise<AsherOrder> {
  const response = await asherRequest<AsherApiResponse<AsherOrder>>(
    `/api/v1/external/partner/orders/${orderId}`
  );

  if ('data' in response && response.success) {
    return response.data;
  }

  return response as unknown as AsherOrder;
}

/**
 * Create a new patient and order
 * POST /api/v1/external/partner/orders/new-order
 */
export async function createNewOrder(
  orderData: AsherNewOrderRequest
): Promise<AsherApiSuccess<AsherPatient>> {
  const response = await asherRequest<AsherApiResponse<AsherPatient>>(
    '/api/v1/external/partner/orders/new-order',
    {
      method: 'POST',
      body: orderData,
    }
  );

  if (!('success' in response) || !response.success) {
    throw new AsherMedApiError(
      (response as AsherApiError).message ||
      (response as AsherApiError).error?.toString() ||
      'Failed to create order'
    );
  }

  return response as AsherApiSuccess<AsherPatient>;
}

/**
 * Create a renewal order for existing patient
 * POST /api/v1/external/partner/orders/renewal
 */
export async function createRenewalOrder(
  orderData: AsherRenewalOrderRequest
): Promise<AsherApiSuccess<{ id: number; status: string; patient: Partial<AsherPatient> }>> {
  const response = await asherRequest<AsherApiResponse<{ id: number; status: string; patient: Partial<AsherPatient> }>>(
    '/api/v1/external/partner/orders/renewal',
    {
      method: 'POST',
      body: orderData,
    }
  );

  if (!('success' in response) || !response.success) {
    throw new AsherMedApiError(
      (response as AsherApiError).message ||
      (response as AsherApiError).error?.toString() ||
      'Failed to create renewal order'
    );
  }

  return response as AsherApiSuccess<{ id: number; status: string; patient: Partial<AsherPatient> }>;
}

/**
 * Update order approval status
 * PATCH /api/v1/external/partner/orders/{id}/approval-status
 */
export async function updateOrderApproval(
  orderId: number | string,
  approvalData: {
    approvalStatus: AsherApprovalStatus;
    partnerNote?: string;
  }
): Promise<AsherApiSuccess<{ id: number; status: string; partnerNote?: string }>> {
  const response = await asherRequest<AsherApiResponse<{ id: number; status: string; partnerNote?: string }>>(
    `/api/v1/external/partner/orders/${orderId}/approval-status`,
    {
      method: 'PATCH',
      body: approvalData,
    }
  );

  if (!('success' in response) || !response.success) {
    throw new AsherMedApiError(
      (response as AsherApiError).message ||
      (response as AsherApiError).error?.toString() ||
      'Failed to update order approval status'
    );
  }

  return response as AsherApiSuccess<{ id: number; status: string; partnerNote?: string }>;
}

// ============================================================
// PATIENTS ENDPOINTS
// ============================================================

/**
 * Get all patients for the partner
 * GET /api/v1/external/partner/patients
 */
export async function getPatients(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AsherPaginatedResponse<AsherPatient>> {
  const response = await asherRequest<{
    patients?: AsherPatient[];
    data?: AsherPatient[];
    total?: number;
  }>('/api/v1/external/partner/patients', {
    params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      status: params?.status,
    },
  });

  return {
    data: response.patients || response.data || [],
    total: response.total || 0,
  };
}

/**
 * Get patient detail by ID
 * GET /api/v1/external/partner/patients/{id}
 */
export async function getPatientById(patientId: number | string): Promise<AsherPatient> {
  const response = await asherRequest<AsherApiResponse<AsherPatient> | AsherPatient>(
    `/api/v1/external/partner/patients/${patientId}`
  );

  if ('data' in response && (response as AsherApiSuccess<AsherPatient>).success) {
    return (response as AsherApiSuccess<AsherPatient>).data;
  }

  return response as AsherPatient;
}

/**
 * Update patient information
 * PUT /api/v1/external/partner/patients/{id}
 */
export async function updatePatient(
  patientId: number | string,
  patientData: Partial<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    gender: AsherGender;
    dateOfBirth: string;
    address1: string;
    address2: string | null;
    city: string;
    stateAbbreviation: string;
    zipcode: string;
    country: string;
    apartmentNumber: string;
    status: AsherPatientStatus;
    height: number;
    weight: number;
    bmi: number;
    currentBodyFat: number;
  }>
): Promise<AsherApiSuccess<AsherPatient>> {
  const response = await asherRequest<AsherApiResponse<AsherPatient>>(
    `/api/v1/external/partner/patients/${patientId}`,
    {
      method: 'PUT',
      body: patientData,
    }
  );

  if (!('success' in response) || !response.success) {
    throw new AsherMedApiError(
      (response as AsherApiError).message ||
      (response as AsherApiError).error?.toString() ||
      'Failed to update patient'
    );
  }

  return response as AsherApiSuccess<AsherPatient>;
}

/**
 * Get patient by phone number
 * GET /api/v1/external/partner/patients/phone/{phoneNumber}
 */
export async function getPatientByPhone(phoneNumber: string): Promise<AsherPatient | null> {
  try {
    const response = await asherRequest<AsherApiResponse<AsherPatient> | AsherPatient>(
      `/api/v1/external/partner/patients/phone/${encodeURIComponent(phoneNumber)}`
    );

    if ('data' in response && (response as AsherApiSuccess<AsherPatient>).success) {
      return (response as AsherApiSuccess<AsherPatient>).data;
    }

    return response as AsherPatient;
  } catch (error) {
    if (error instanceof AsherMedApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================
// PARTNERS ENDPOINTS
// ============================================================

/**
 * Get partner detail by ID
 * GET /api/v1/external/partner/{partnerId}
 */
export async function getPartnerById(partnerId: string): Promise<unknown> {
  return asherRequest(`/api/v1/external/partner/${partnerId}`);
}

/**
 * Update partner profile
 * PUT /api/v1/external/partner
 */
export async function updatePartnerProfile(profileData: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  businessName?: string;
}): Promise<AsherApiSuccess<unknown>> {
  const response = await asherRequest<AsherApiResponse<unknown>>(
    '/api/v1/external/partner',
    {
      method: 'PUT',
      body: profileData,
    }
  );

  if (!('success' in response) || !response.success) {
    throw new AsherMedApiError(
      (response as AsherApiError).message ||
      (response as AsherApiError).error?.toString() ||
      'Failed to update partner profile'
    );
  }

  return response as AsherApiSuccess<unknown>;
}

// ============================================================
// INTAKE QUESTIONS ENDPOINTS
// ============================================================

/**
 * Get new intake questions
 * GET /api/v1/external/question/new-intake-questions
 */
export async function getNewIntakeQuestions(): Promise<AsherIntakeQuestions> {
  const response = await asherRequest<AsherIntakeQuestions>(
    '/api/v1/external/question/new-intake-questions'
  );
  return response;
}

/**
 * Get renewal questions
 * GET /api/v1/external/question/renewal-questions
 */
export async function getRenewalQuestions(): Promise<AsherIntakeQuestions> {
  const response = await asherRequest<AsherIntakeQuestions>(
    '/api/v1/external/question/renewal-questions'
  );
  return response;
}

// ============================================================
// FILE UPLOAD ENDPOINTS
// ============================================================

/**
 * Get presigned URL for file upload to S3
 * POST /api/v1/external/upload/presigned-url
 */
export async function getPresignedUploadUrl(
  contentType: string
): Promise<AsherFileUploadResponse> {
  const response = await asherRequest<AsherFileUploadResponse>(
    '/api/v1/external/upload/presigned-url',
    {
      method: 'POST',
      body: { contentType },
    }
  );

  if (!response.success) {
    throw new AsherMedApiError('Failed to get presigned upload URL');
  }

  return response;
}

/**
 * Get preview URL for an uploaded file
 * GET /api/v1/external/upload/preview-url
 */
export async function getPreviewUrl(key: string): Promise<AsherPreviewUrlResponse> {
  const response = await asherRequest<AsherPreviewUrlResponse>(
    '/api/v1/external/upload/preview-url',
    {
      params: { key },
    }
  );

  if (!response.success) {
    throw new AsherMedApiError('Failed to get preview URL');
  }

  return response;
}

/**
 * Helper function to upload a file to S3 using presigned URL
 */
export async function uploadFileToS3(
  uploadUrl: string,
  file: Blob | ArrayBuffer,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new AsherMedApiError(
      'Failed to upload file to S3',
      response.status
    );
  }
}

/**
 * Complete file upload flow: get presigned URL, upload file, return S3 key
 */
export async function uploadFile(
  file: Blob | ArrayBuffer,
  contentType: string
): Promise<{ key: string; previewUrl: string }> {
  // Get presigned URL
  const { data } = await getPresignedUploadUrl(contentType);

  // Upload file to S3
  await uploadFileToS3(data.uploadUrl, file, contentType);

  return {
    key: data.key,
    previewUrl: data.previewUrl,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Check if Asher Med API is configured
 */
export function isAsherMedConfigured(): boolean {
  return !!(
    process.env.ASHER_MED_API_KEY &&
    process.env.ASHER_MED_API_URL
  );
}

/**
 * Calculate BMI from height (inches) and weight (lbs)
 */
export function calculateBMI(heightInches: number, weightLbs: number): number {
  // BMI = (weight in lbs / (height in inches)^2) * 703
  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

/**
 * Format phone number to E.164 format (required by Asher Med)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If 10 digits (US number without country code), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If already has + sign at start, return as-is
  if (phone.startsWith('+')) {
    return phone;
  }

  // Default: add + prefix
  return `+${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format date to YYYY-MM-DD (required by Asher Med)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Export error class for external use
export { AsherMedApiError };
