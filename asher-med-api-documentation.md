# Asher Med API Documentation - HIPAA Compliant

**Version:** 1.0.0
**License:** Proprietary - Confidential
**Contact:** Asher Med Support - support@ashermed.com

---

## Table of Contents

1. [Overview](#overview)
2. [HIPAA Compliance Notice](#hipaa-compliance-notice)
3. [Security Requirements](#security-requirements)
4. [Authentication](#authentication)
5. [Servers](#servers)
6. [User Flows](#user-flows)
7. [API Endpoints](#api-endpoints)
   - [Partner Portal - Orders](#partner-portal---orders)
   - [Partner Portal - Partners](#partner-portal---partners)
   - [Partner Portal - Patients](#partner-portal---patients)
   - [Partner Portal - Intake Questions](#partner-portal---intake-questions)
   - [External API - File Upload](#external-api---file-upload)
8. [Data Schemas](#data-schemas)
9. [Error Responses](#error-responses)
10. [Important Notes](#important-notes)

---

## Overview

This API powers the Asher Med platform, providing secure, reliable, and HIPAA-compliant access to healthcare and partner business operations.

### Portal Types

- **Doctor Portal:** Designed for licensed healthcare providers to manage patients, prescriptions, orders, and practice analytics. Enables streamlined clinical workflows, secure handling of PHI, and compliance with medical regulations.

- **Partner Portal:** Built for business partners to onboard patients, track orders, manage payments, view analytics, and facilitate collaboration with healthcare professionals.

---

## HIPAA Compliance Notice

This API handles Protected Health Information (PHI) and complies with HIPAA regulations. All data transmissions must use secure protocols (HTTPS/TLS 1.2+).

---

## Security Requirements

- All API calls must include proper authentication
- Access is logged and monitored for compliance purposes
- PHI data must be handled according to HIPAA guidelines

---

## Authentication

The API supports two authentication methods:

### 1. API Key Authentication (`apiKeyAuth`)

- **Type:** API Key
- **Location:** Header
- **Header Name:** `X-API-KEY`
- **Description:** API key for external client to access external endpoints

**Usage:**
```
X-API-KEY: your-api-key-here
```

### 2. Bearer Token Authentication (`bearerAuth`)

- **Type:** HTTP Bearer
- **Scheme:** Bearer
- **Format:** JWT
- **Description:** JWT token obtained from login endpoint

**Usage:**
```
Authorization: Bearer your-jwt-token-here
```

---

## Servers

| Server | URL | Description |
|--------|-----|-------------|
| Current Server | `/` | Current Server |
| Domain Server | `https://asherweightloss.com` | Domain Server |

---

## User Flows

### New Patient Order Flow

1. **Get Intake Questions**
   - Call `GET /api/v1/external/question/new-intake-questions` to retrieve the required intake questions

2. **Upload Images** (if needed)
   - **For Patient ID Photo:**
     - Call `POST /api/v1/external/upload/presigned-url` with `contentType: "image/jpeg"` (or appropriate image type)
     - Upload the ID image file to the returned `uploadUrl` using PUT request
     - Use the returned `key` value in `idDocumentUpload.frontIDFileS3Key` field
   - **For Medication Prescription Photo** (if applicable):
     - Call `POST /api/v1/external/upload/presigned-url` with `contentType: "image/jpeg"` (or appropriate image type)
     - Upload the prescription label image file to the returned `uploadUrl` using PUT request
     - Use the returned `key` value in `currentMedicationDetails.current_medication_prescription_label_photo.prescriptionPhotoS3Key` field

3. **Patient Completes Information**
   - Answers to all intake questions (wellnessQuestionnaire, glp1MedicationHistory, currentMedicationDetails, treatmentPreferences)
   - Personal information (name, email, phone, DOB, gender)
   - Shipping address details
   - Physical measurements (height, weight, BMI)
   - Required document uploads (ID, signatures)
   - Medication package selections

4. **Create Order**
   - Call `POST /api/v1/external/partner/orders/new-order` with all collected data to create the patient and initiate the order

### Renewal Order Flow

1. **Get Patient Information**
   - Call `GET /api/v1/external/patients/phone/{phoneNumber}` to retrieve existing patient data

2. **Get Renewal Questions**
   - Call `GET /api/v1/external/question/renewal-questions` to fetch the current renewal questionnaire

3. **Patient Completes Form**
   - Patient answers the renewal questions and provides/updates:
     - Personal information (name, email, phone, DOB, gender)
     - Shipping address information
     - Medication package selections
     - Telehealth consent
     - Wellness questionnaire responses (required for renewal)

4. **Create Renewal Order**
   - Call `POST /api/v1/external/partner/orders/renewal` with all collected data to create the renewal order

---

## API Endpoints

### Partner Portal - Orders

Endpoints for viewing, creating, updating, and managing orders for patients and partners. Includes order history, details, invoice management, and order data retrieval.

---

#### GET /api/v1/external/partner/orders

**Summary:** Get orders

**Description:** Retrieves orders for the partner.

**HIPAA NOTICE:** This endpoint returns PHI data and requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Default | Description |
|------|----------|------|----------|---------|-------------|
| `page` | query | integer | No | 1 | Page number for pagination |
| `limit` | query | integer | No | 10 | Number of items per page |
| `search` | query | string | No | - | Search term for filtering orders |
| `status` | query | string | No | - | Filter by order status |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved orders |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 500 | Internal server error |

---

#### GET /api/v1/external/partner/orders/{id}

**Summary:** Get order detail

**Description:** Retrieves detailed information about a specific order.

**HIPAA NOTICE:** This endpoint returns PHI data and requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `id` | path | string | Yes | Order ID |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved order details |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Order not found |
| 500 | Internal server error |

---

#### POST /api/v1/external/partner/orders/new-order

**Summary:** Create a new patient and order (Partner API)

**Description:** This endpoint allows partners to create a new patient and initiate an order.

**Security:** API Key (`X-API-KEY`)

**Request Body:** `application/json` (required)

**Required Fields:**
- `personalInformation`
- `shippingAddress`
- `medicationPackages`
- `idDocumentUpload`
- `telehealthConsent`
- `consentAcknowledgments`
- `physicalMeasurements`
- `wellnessQuestionnaire`
- `medicationTypeSelection`
- `treatmentPreferences`

**Request Body Schema:**

```json
{
  "personalInformation": {
    "firstName": "string (required) - Patient's first name",
    "lastName": "string (required) - Patient's last name",
    "email": "string (required, format: email) - Patient's email address",
    "phoneNumber": "string (required) - Patient's phone number",
    "dateOfBirth": "string (required, format: date, YYYY-MM-DD) - Patient's date of birth",
    "gender": "string (required, enum: MALE, FEMALE) - Patient's gender"
  },
  "shippingAddress": {
    "address1": "string (required) - Primary address line",
    "city": "string (required) - City",
    "stateAbbreviation": "string (required) - Two-letter state code",
    "zipCode": "string (required) - ZIP/Postal code",
    "country": "string (required) - Country",
    "apartmentNumber": "string (optional) - Apartment/suite number",
    "addressAdditionalInfo": "string (optional) - Additional address information"
  },
  "medicationPackages": [
    {
      "name": "string (required, enum: Tirzepatide, Semaglutide, NAD+, Sermorelin, Glutathione, Other, AOD9604, BPC-157/TB-500, GHK-Cu, Lipo-B, Lipo-C, MOTS-C, Semax/Selank)",
      "duration": "number (required, minimum: 1) - Duration of medication treatment",
      "medicationType": "string (required, enum: Injection, Troche) - Type of medication administration"
    }
  ],
  "idDocumentUpload": {
    "frontIDFileS3Key": "string (required, format: uri) - S3 key of the uploaded ID file",
    "isGovernmentIDConfirmed": "boolean (required) - Confirmation that government ID is verified"
  },
  "telehealthConsent": {
    "agreeTelehealthService": "boolean (required) - Agreement to telehealth service",
    "telehealthSigS3Key": "string (required, format: uri) - S3 key of the uploaded telehealth signature"
  },
  "consentAcknowledgments": {
    "consentCompoundedSigS3Key": "string (required, format: uri) - S3 key of the uploaded compounded consent signature",
    "consentHealthcareConsultation": "boolean (required) - Consent for healthcare consultation"
  },
  "physicalMeasurements": {
    "height": "number (required, minimum: 1) - Patient's height in inches",
    "weight": "number (required, minimum: 1) - Patient's weight in lbs",
    "bmi": "number (required, minimum: 1) - Body Mass Index",
    "currentBodyFat": "number (optional, 0-100) - Current body fat percentage"
  },
  "wellnessQuestionnaire": "object (optional) - Wellness questionnaire data",
  "glp1MedicationHistory": "object (optional) - GLP-1 medication history",
  "currentMedicationDetails": {
    "current_medication_prescription_label_photo": {
      "prescriptionPhotoS3Key": "string (optional, format: uri) - S3 key of the uploaded prescription label photo"
    }
  },
  "treatmentPreferences": {
    "providerCustomSolution": "string (optional, enum: yes_custom, no_custom) - Whether patient wants custom solution",
    "providerCustomSolutionMuscleLoss": "string (optional, enum: yes_muscle_prevention, no_muscle_prevention) - Whether patient wants muscle loss prevention"
  },
  "dosingPlanPreferences": {
    "autoTitrateMonths": "string (optional, enum: 'yes auto_titrate', 'no auto_titrate') - Auto-titration preference",
    "doseChangePreference": "string (optional, enum: move_up, move_down, maintain) - Preferred direction for dose changes"
  },
  "medicationTypeSelection": "string (required, enum: GLP1, NonGLP1) - Type of medication selection"
}
```

**Example Request:**

```json
{
  "personalInformation": {
    "firstName": "Alice",
    "lastName": "Nguyen",
    "email": "alice.nguyen@example.com",
    "phoneNumber": "+19786159222",
    "dateOfBirth": "1990-04-15",
    "gender": "FEMALE"
  },
  "shippingAddress": {
    "address1": "123 Main St",
    "apartmentNumber": "Apt 5B",
    "city": "San Jose",
    "stateAbbreviation": "CA",
    "zipCode": "95112",
    "country": "US",
    "addressAdditionalInfo": "Gate code 1234"
  },
  "medicationPackages": [
    {
      "name": "Tirzepatide",
      "duration": 12,
      "medicationType": "Injection"
    },
    {
      "name": "NAD+",
      "duration": 6,
      "medicationType": "Troche"
    }
  ],
  "idDocumentUpload": {
    "frontIDFileS3Key": "external-uploads/550e8400-e29b-41d4-a716-446655440000",
    "isGovernmentIDConfirmed": true
  },
  "telehealthConsent": {
    "agreeTelehealthService": true,
    "telehealthSigS3Key": "external-uploads/550e8400-e29b-41d4-a716-446655440000"
  },
  "consentAcknowledgments": {
    "consentCompoundedSigS3Key": "external-uploads/550e8400-e29b-41d4-a716-446655440000",
    "consentHealthcareConsultation": true
  },
  "physicalMeasurements": {
    "height": 67,
    "weight": 165,
    "bmi": 25.8,
    "currentBodyFat": 22
  },
  "wellnessQuestionnaire": {
    "if_yes_which_drugs": ["Cocaine"],
    "are_you_on_warfarin": "Yes",
    "what_type_of_cancer": "Skin cancer",
    "tumors_benign_or_malignant": "Yes",
    "was_it_removed_if_yes_when": "Within 2 months",
    "what_is_your_hemoglobin_a1c": "Below 5.7% (Normal)",
    "do_you_use_recreational_drugs": "Yes",
    "are_you_on_cpap_for_sleep_apnea": "Yes",
    "are_you_pre_diabetic_or_diabetic": "Yes",
    "do_you_have_any_thyroid_conditions": ["Hypothyroidism", "Hyperthyroidism"],
    "if_you_answered_yes_please_explain": "Patient has family history of thyroid issues",
    "do_you_suffer_from_these_conditions": ["Cardiovascular Disease"],
    "please_list_substances_and_reactions": "Allergic to penicillin - causes rash",
    "if_yes_which_medications_are_you_taking": ["GLP-1 agonists for diabetes", "Insulin"],
    "personal_history_of_gallbladder_disease": "Yes",
    "do_you_have_a_personal_history_of_cancer": "Yes",
    "please_list_all_over_the_counter_products": "Daily multivitamin, fish oil supplements",
    "ever_had_fasting_triglycerides_greater_500": "Yes",
    "do_you_have_a_history_of_medical_conditions": ["Autoimmune disorders", "Liver disease"],
    "do_you_take_medication_for_high_blood_pressure": "Yes",
    "please_list_all_current_prescription_medications": "Lisinopril 10mg daily, Metformin 500mg twice daily",
    "what_are_the_primary_reasons_youre_seeking_treatment": ["Weight loss", "Hormone optimization"],
    "do_you_have_any_allergies_to_medications_foods_or_injection_components": "Yes",
    "do_you_have_any_additional_medical_history_problems_we_should_know_about": "Patient has history of anxiety and depression"
  },
  "glp1MedicationHistory": {
    "how_often_do_you_exercise": "3–4 times per week",
    "how_much_weight_would_you_like_to_lose": "20–30 lbs",
    "how_would_you_describe_your_past_attempts": "Lost weight and gained back after a while",
    "what_is_your_primary_goal_for_weight_loss": "Overall health improvement",
    "have_you_previously_tried_weight_loss_programs": "Yes",
    "are_you_willing_to_follow_a_weight_loss_dietary_plan": "Yes",
    "do_you_acknowledge_that_glps_are_most_effective_with_exercise": "Yes",
    "have_you_taken_any_glp1_or_weight_loss_medications_in_the_last_60_days": "Yes"
  },
  "currentMedicationDetails": {
    "last_injection_date": "2025-09-02T17:00:00.000Z",
    "current_medication_dosage_information": {
      "units": "12",
      "doseMg": "3",
      "concentrationMgPerMl": "2"
    },
    "which_medications_have_you_been_taking": "Semaglutide (Ozempic, Wegovy, Rybelsus)",
    "current_medication_prescription_label_photo": {
      "prescriptionPhotoS3Key": "external-uploads/550e8400-e29b-41d4-a716-446655440001"
    },
    "how_long_have_you_been_taking_this_medication": "3–6 months",
    "how_long_have_you_been_on_your_current_dose_of_this_medication": "3–6 months"
  },
  "treatmentPreferences": {
    "providerCustomSolution": "yes_custom",
    "providerCustomSolutionMuscleLoss": "yes_muscle_prevention"
  },
  "dosingPlanPreferences": {
    "autoTitrateMonths": "yes auto_titrate",
    "doseChangePreference": "move_up"
  },
  "medicationTypeSelection": "GLP1"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Patient and order created successfully |
| 400 | Bad Request - Invalid input data or partner is blocked |
| 401 | Unauthorized - Missing or invalid API key |
| 403 | Forbidden - User does not have partner role |
| 404 | Partner not found |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    // Patient object
  }
}
```

---

#### POST /api/v1/external/partner/orders/renewal

**Summary:** Create a renewal order for existing patient (Partner API)

**Description:** This endpoint allows partners to create a renewal order for existing patients.

**Security:** API Key (`X-API-KEY`)

**Request Body:** `application/json` (required)

**Required Fields:**
- `personalInformation`
- `shippingAddress`
- `medicationPackages`
- `telehealthConsent`
- `wellnessQuestionnaire`

**Request Body Schema:**

```json
{
  "personalInformation": {
    "firstName": "string (required)",
    "lastName": "string (required)",
    "email": "string (required, format: email)",
    "phoneNumber": "string (required)",
    "dateOfBirth": "string (required, format: date, YYYY-MM-DD)",
    "gender": "string (required, enum: MALE, FEMALE)"
  },
  "shippingAddress": {
    "address1": "string (required)",
    "city": "string (required)",
    "stateAbbreviation": "string (required)",
    "zipCode": "string (required)",
    "country": "string (required)",
    "apartmentNumber": "string (optional)",
    "addressAdditionalInfo": "string (optional)"
  },
  "medicationPackages": [
    {
      "name": "string (required, enum: Tirzepatide, Semaglutide, NAD+, Sermorelin, Glutathione, Other, AOD9604, BPC-157/TB-500, GHK-Cu, Lipo-B, Lipo-C, MOTS-C, Semax/Selank)",
      "duration": "number (required, minimum: 1)",
      "medicationType": "string (required, enum: Injection, Troche)"
    }
  ],
  "telehealthConsent": {
    "agreeTelehealthService": "boolean (required)",
    "telehealthSigS3Key": "string (required, format: uri)"
  },
  "wellnessQuestionnaire": "object (required)"
}
```

**Example Request:**

```json
{
  "personalInformation": {
    "firstName": "Robbie",
    "lastName": "Hulett",
    "email": "robbiehulett@towermaintenance.com",
    "phoneNumber": "+19123099422",
    "dateOfBirth": "1974-11-27",
    "gender": "MALE"
  },
  "shippingAddress": {
    "address1": "4519 Kiowa Lane",
    "apartmentNumber": "",
    "city": "Hahira",
    "stateAbbreviation": "GA",
    "zipCode": "31632",
    "country": "USA",
    "addressAdditionalInfo": ""
  },
  "medicationPackages": [
    {
      "name": "Tirzepatide",
      "duration": 56,
      "medicationType": "Injection"
    }
  ],
  "telehealthConsent": {
    "agreeTelehealthService": true,
    "telehealthSigS3Key": "external-uploads/550e8400-e29b-41d4-a716-446655440000"
  },
  "wellnessQuestionnaire": {
    "weight_goals_glp1_medication": {
      "goalWeight": "140",
      "currentWeight": "156"
    },
    "have_you_been_taking_the_medication_as_prescribed": "Have you been taking the medication as prescribed?",
    "what_are_your_main_goals_with_your_treatment_at_this_time": "with your treatment at this time?",
    "are_you_currently_experiencing_any_side_effects_from_your_medications": "Yes",
    "have_there_been_any_changes_to_your_medications_since_your_last_visit": "Yes",
    "are_you_currently_experiencing_any_side_effects_from_your_medications_Yes_0": "Please describe: 4",
    "are_you_currently_experiencing_any_side_effects_from_your_medications_Yes_1": "Moderate",
    "have_there_been_any_changes_to_your_medications_since_your_last_visit_Yes_0": "Please list changes: 3",
    "please_check_any_conditions_that_apply_to_you_this_helps_ensure_your_safety": [
      "History of pancreatitis",
      "Diabetic retinopathy"
    ],
    "please_provide_feedback_of_current_dose_and_if_you_would_like_to_increase_decrease_or_stay_the_same": "Please provide feedback of current dose and if you would like to increase",
    "since_your_last_prescription_have_you_had_any_new_medical_diagnoses_for_example_cancer_tumor_heart_condition_diabetes_etc": "Yes",
    "since_your_last_prescription_have_you_had_any_new_medical_diagnoses_for_example_cancer_tumor_heart_condition_diabetes_etc_Yes_0": "Please list 1",
    "since_your_last_prescription_have_you_experienced_any_new_medical_events_for_example_heart_attack_stroke_surgery_hospitalization_blood_clot_seizure_or_other_major_event": "No"
  }
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Renewal order created successfully |
| 400 | Bad Request - Invalid input data, invalid phone number, or partner not found |
| 401 | Unauthorized - Missing or invalid API key |
| 403 | Forbidden - User does not have partner role |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "string",
    "patient": {
      "id": 456,
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "GYM_OWNER_NOT_FOUND" // or "INVALID_PHONE_NUMBER"
}
```

---

#### PATCH /api/v1/external/partner/orders/{id}/approval-status

**Summary:** Update order approval status

**Description:** Updates the approval status of a specific order. Partners can approve or reject orders. When an order is approved, the status changes to "WaitingRoom". When rejected, it changes to "Denied".

**HIPAA NOTICE:** This endpoint modifies PHI data and requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `id` | path | integer | Yes | Order ID |

**Request Body:** `application/json` (required)

```json
{
  "approvalStatus": "string (required, enum: PENDING, APPROVED, REJECTED)",
  "partnerNote": "string (optional) - Note from partner regarding the approval/rejection"
}
```

**Example - Approve Order:**

```json
{
  "approvalStatus": "APPROVED",
  "partnerNote": "Order approved after review"
}
```

**Example - Reject Order:**

```json
{
  "approvalStatus": "REJECTED",
  "partnerNote": "Missing required documentation"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully updated order approval status |
| 400 | Bad request - invalid parameters or order ID |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Order not found or not accessible by this partner |
| 422 | Validation error - invalid request body |
| 500 | Internal server error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "WaitingRoom",
    "partnerNote": "Order approved after review"
  }
}
```

---

### Partner Portal - Partners

Endpoints for managing partner profiles, details, and account creation within the Partner Portal.

---

#### GET /api/v1/external/partner/{partnerId}

**Summary:** Get partner detail by ID

**Description:** Retrieves detailed information about a specific partner.

**HIPAA NOTICE:** This endpoint requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `partnerId` | path | string | Yes | Partner User ID |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved partner details |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Partner not found |
| 500 | Internal server error |

---

#### PUT /api/v1/external/partner

**Summary:** Update partner profile

**Description:** Updates the authenticated partner's profile information.

**HIPAA NOTICE:** This endpoint requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Request Body:** `application/json` (required)

```json
{
  "firstName": "string (optional) - e.g., 'John'",
  "lastName": "string (optional) - e.g., 'Smith'",
  "phoneNumber": "string (optional) - e.g., '+1234567890'",
  "email": "string (optional, format: email) - e.g., 'partner@example.com'",
  "businessName": "string (optional) - e.g., 'Fitness Center'"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Profile updated successfully |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 500 | Internal server error |

---

### Partner Portal - Patients

Endpoints for viewing, creating, updating, and managing patient information in the Partner Portal. Includes onboarding, status, and attachment management.

---

#### GET /api/v1/external/partner/patients

**Summary:** Get all patients for the partner

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Default | Description |
|------|----------|------|----------|---------|-------------|
| `search` | query | string | No | - | Search term for filtering patients |
| `page` | query | integer | No | 1 | Page number for pagination |
| `limit` | query | integer | No | 10 | Number of items per page |
| `status` | query | string | No | - | Filter by patient status |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved list of completed onboarding patients |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 500 | Internal server error |

**Success Response (200):**

```json
{
  "patients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "patient@example.com",
      "phoneNumber": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "gender": "MALE",
      "status": "ACTIVE",
      "createdAt": "2023-01-01T12:00:00Z",
      "updatedAt": "2023-01-01T12:00:00Z"
    }
  ],
  "total": 100
}
```

---

#### GET /api/v1/external/partner/patients/{id}

**Summary:** Get patient detail (partner access)

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `id` | path | integer | Yes | Patient ID |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved patient details |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Patient not found |
| 500 | Internal server error |

---

#### PUT /api/v1/external/partner/patients/{id}

**Summary:** Update patient information (partner access)

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `id` | path | integer | Yes | Patient ID |

**Request Body:** `application/json` (required)

```json
{
  "firstName": "string (optional) - Patient's first name",
  "lastName": "string (optional) - Patient's last name",
  "phoneNumber": "string (optional) - Patient's phone number",
  "email": "string (optional, format: email) - Patient's email address",
  "gender": "string (optional, enum: MALE, FEMALE) - Patient's gender",
  "dateOfBirth": "string (optional, format: date) - Patient's date of birth (YYYY-MM-DD)",
  "address1": "string (optional) - Primary address line",
  "address2": "string (optional, nullable) - Secondary address line",
  "city": "string (optional) - City",
  "stateAbbreviation": "string (optional) - State abbreviation",
  "zipcode": "string (optional, pattern: ^\\d+$) - Zip code (numeric format)",
  "country": "string (optional) - Country",
  "apartmentNumber": "string (optional) - Apartment number",
  "status": "string (optional, enum: ACTIVE, INACTIVE, PENDING) - Patient status",
  "height": "number (optional, minimum: 0) - Patient's height",
  "weight": "number (optional, minimum: 0) - Patient's weight",
  "bmi": "number (optional, minimum: 0) - Patient's BMI",
  "currentBodyFat": "number (optional, 0-100) - Patient's current body fat percentage"
}
```

**Example Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "0987654321",
  "email": "john.doe@example.com",
  "gender": "MALE",
  "dateOfBirth": "1985-05-15",
  "address1": "456 Fitness Ave",
  "address2": "Suite 200",
  "city": "Los Angeles",
  "stateAbbreviation": "CA",
  "zipcode": "90001",
  "country": "USA",
  "apartmentNumber": "Apt 5B",
  "status": "ACTIVE",
  "height": 175.5,
  "weight": 70.2,
  "bmi": 22.9,
  "currentBodyFat": 15.5
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Patient updated successfully |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Patient not found |
| 500 | Internal server error |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    // Updated patient information
  }
}
```

---

#### GET /api/v1/external/partner/patients/phone/{phoneNumber}

**Summary:** Get patient detail by phone number (partner access)

**Description:** Retrieves patient information using their phone number. Phone number should be in US format (e.g., +1234567890 or 1234567890).

**HIPAA NOTICE:** This endpoint returns PHI data and requires proper authorization.

**Security:** API Key (`X-API-KEY`)

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `phoneNumber` | path | string | Yes | Patient's phone number in US format (e.g., +16504551403) |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successfully retrieved patient details |
| 400 | Bad request - invalid phone number format or missing gym owner |
| 401 | Unauthorized - missing or invalid authentication |
| 403 | Forbidden - user does not have partner role |
| 404 | Patient not found |
| 500 | Internal server error |

**Success Response (200):**

```json
{
  "id": 123,
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+16504551403",
  "email": "john.doe@example.com",
  "status": "ACTIVE",
  "createdAt": "2023-01-01T12:00:00Z"
}
```

**Error Response (400):**

```json
{
  "message": "Invalid phone number format"
}
```

**Error Response (404):**

```json
{
  "message": "Patient not found"
}
```

---

### Partner Portal - Intake Questions

Endpoints for getting intake questions for new intake and renewal.

---

#### GET /api/v1/external/question/new-intake-questions

**Summary:** Get new intake questions

**Description:** This endpoint allows partners to get new intake questions.

**Security:** API Key (`X-API-KEY`)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | New intake questions |
| 404 | System dictionary not found |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    // Intake questions object
  }
}
```

---

#### GET /api/v1/external/question/renewal-questions

**Summary:** Get renewal questions

**Description:** This endpoint allows partners to get renewal intake questions.

**Security:** API Key (`X-API-KEY`)

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Renewal questions |
| 404 | System dictionary not found |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    // Renewal questions object
  }
}
```

---

### External API - File Upload

Endpoints for external partners to upload files to S3 using presigned URLs.

---

#### POST /api/v1/external/upload/presigned-url

**Summary:** Get presigned URL for file upload to S3

**Description:** This endpoint allows external partners to get presigned URLs for uploading files to S3.

**Security:** API Key (`X-API-KEY`)

**Usage Flow:**
1. Call this endpoint with the file's content type (and optional folder)
2. Receive a presigned upload URL, preview URL, and file key
3. Upload the file directly to S3 using the presigned upload URL (PUT request)
4. Use the preview URL to access the uploaded file

**Important Notes:**
- The presigned upload URL expires in 24 hours
- The preview URL expires in 2 days
- Maximum file size: 20MB (enforced by client validation)
- Allowed content types: image/jpeg, image/png, image/gif, image/webp, application/pdf, and common document types
- Files are uploaded directly to S3, not through this API
- The file key should be stored for future reference
- Rate limit: 20 requests per 15 minutes per API key

**Request Body:** `application/json` (required)

```json
{
  "contentType": "string (required) - MIME type of the file to upload. Allowed types: image/jpeg, image/png, image/webp, application/pdf"
}
```

**Example Request:**

```json
{
  "contentType": "image/jpeg"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Presigned URLs generated successfully |
| 400 | Bad Request - Missing or invalid contentType |
| 401 | Unauthorized - Missing or invalid API key |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "key": "external-uploads/550e8400-e29b-41d4-a716-446655440000",
    "uploadUrl": "https://bucket.s3.amazonaws.com/external-uploads/550e8400-e29b-41d4-a716-446655440000?X-Amz-Algorithm=...",
    "previewUrl": "https://bucket.s3.amazonaws.com/external-uploads/550e8400-e29b-41d4-a716-446655440000?X-Amz-Algorithm=..."
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": {
    "message": "contentType is required"
  }
}
```

---

#### GET /api/v1/external/upload/preview-url

**Summary:** Get preview URL for an uploaded file by key

**Description:** This endpoint allows external partners to get a preview URL for an already uploaded file using its S3 key.

**Security:** API Key (`X-API-KEY`)

**Usage:**
- Provide the file key (S3 key) that was returned when the file was uploaded
- Receive a presigned preview URL that expires in 2 days

**Important Notes:**
- The preview URL expires in 2 days
- The key should be the full S3 key path (e.g., "external-uploads/550e8400-e29b-41d4-a716-446655440000")
- Rate limit: 20 requests per 15 minutes per API key

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `key` | query | string | Yes | S3 key of the file to get preview URL for (e.g., "external-uploads/550e8400-e29b-41d4-a716-446655440000") |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Preview URL generated successfully |
| 400 | Bad Request - Missing or invalid key |
| 401 | Unauthorized - Missing or invalid API key |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "key": "external-uploads/550e8400-e29b-41d4-a716-446655440000",
    "previewUrl": "https://bucket.s3.amazonaws.com/external-uploads/550e8400-e29b-41d4-a716-446655440000?X-Amz-Algorithm=..."
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": {
    "message": "key is required"
  }
}
```

---

## Data Schemas

### Patient

```json
{
  "id": "string (uuid) - Unique identifier for the patient",
  "firstName": "string - Patient's first name",
  "lastName": "string - Patient's last name",
  "email": "string (email) - Patient's email address",
  "phoneNumber": "string - Patient's phone number",
  "dateOfBirth": "string (date) - Patient's date of birth",
  "gender": "string (enum: MALE, FEMALE, OTHER) - Patient's gender",
  "status": "string (enum: ACTIVE, INACTIVE, PENDING) - Current status of the patient",
  "createdAt": "string (date-time) - When the patient record was created",
  "updatedAt": "string (date-time) - When the patient record was last updated"
}
```

**Example:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "patient@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE",
  "status": "ACTIVE",
  "createdAt": "2023-01-01T12:00:00Z",
  "updatedAt": "2023-01-01T12:00:00Z"
}
```

---

### Order

```json
{
  "id": "string (uuid) - Unique identifier for the order",
  "patientId": "string (uuid) - ID of the patient this order is for",
  "doctorId": "string (uuid) - ID of the doctor who created/approved the order",
  "status": "string (enum: PENDING, APPROVED, DENIED, COMPLETED, CANCELLED) - Current status of the order",
  "orderType": "string - Type of order (e.g., PRESCRIPTION, LAB_TEST)",
  "createdAt": "string (date-time) - When the order was created",
  "updatedAt": "string (date-time) - When the order was last updated"
}
```

**Example:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patientId": "550e8400-e29b-41d4-a716-446655440001",
  "doctorId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "APPROVED",
  "orderType": "PRESCRIPTION",
  "createdAt": "2023-01-01T12:00:00Z",
  "updatedAt": "2023-01-01T12:00:00Z"
}
```

---

### Pagination

```json
{
  "totalItems": "integer - Total number of items matching the query",
  "totalPages": "integer - Total number of pages available",
  "currentPage": "integer - Current page number",
  "itemsPerPage": "integer - Number of items per page"
}
```

**Example:**

```json
{
  "totalItems": 100,
  "totalPages": 10,
  "currentPage": 1,
  "itemsPerPage": 10
}
```

---

### HealthData

```json
{
  // Schema containing PHI data - handle according to HIPAA requirements
}
```

---

## Error Responses

### Error Schema

```json
{
  "code": "integer - Error code",
  "message": "string - Error message",
  "status": "string - Error status (e.g., 'error')",
  "errors": [
    {
      "field": "string - Field with error",
      "message": "string - Error message for the field"
    }
  ]
}
```

---

### ValidationError

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### AuthError

```json
{
  "status": "error",
  "message": "Authentication required"
}
```

---

### ForbiddenError

```json
{
  "status": "error",
  "message": "Access denied"
}
```

---

### NotFoundError

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

---

### ServerError

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Standard HTTP Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request - invalid parameters |
| 401 | Unauthorized - missing or invalid authentication token |
| 403 | Forbidden - user does not have required role |
| 404 | Resource not found |
| 422 | Validation error - invalid request body |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal server error |

---

## Important Notes

### Rate Limits
- File upload endpoints: 20 requests per 15 minutes per API key

### File Upload Constraints
- Maximum file size: 20MB
- Allowed content types: image/jpeg, image/png, image/gif, image/webp, application/pdf
- Presigned upload URL expires in 24 hours
- Preview URL expires in 2 days

### Medication Types Available

| Medication Name | Administration Types |
|-----------------|---------------------|
| Tirzepatide | Injection |
| Semaglutide | Injection |
| NAD+ | Injection, Troche |
| Sermorelin | Injection |
| Glutathione | Injection |
| AOD9604 | Injection |
| BPC-157/TB-500 | Injection |
| GHK-Cu | Injection |
| Lipo-B | Injection |
| Lipo-C | Injection |
| MOTS-C | Injection |
| Semax/Selank | Injection |
| Other | Injection, Troche |

### Medication Type Selection
- `GLP1` - For GLP-1 medications (Tirzepatide, Semaglutide)
- `NonGLP1` - For non-GLP-1 medications (NAD+, Sermorelin, etc.)

### Patient Status Values
- `ACTIVE` - Patient is currently active
- `INACTIVE` - Patient is inactive
- `PENDING` - Patient registration is pending

### Order Status Values
- `PENDING` - Order is pending review
- `APPROVED` - Order has been approved
- `DENIED` - Order has been denied
- `COMPLETED` - Order has been completed
- `CANCELLED` - Order has been cancelled

### Order Approval Status Values (Partner)
- `PENDING` - Awaiting partner approval
- `APPROVED` - Partner approved (changes order status to "WaitingRoom")
- `REJECTED` - Partner rejected (changes order status to "Denied")

### Gender Values
- `MALE`
- `FEMALE`

### Treatment Preferences
- `providerCustomSolution`: "yes_custom" or "no_custom"
- `providerCustomSolutionMuscleLoss`: "yes_muscle_prevention" or "no_muscle_prevention"

### Dosing Plan Preferences
- `autoTitrateMonths`: "yes auto_titrate" or "no auto_titrate"
- `doseChangePreference`: "move_up", "move_down", or "maintain"

---

## API Endpoint Summary Table

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/external/partner/orders` | Get orders |
| GET | `/api/v1/external/partner/orders/{id}` | Get order detail |
| POST | `/api/v1/external/partner/orders/new-order` | Create new patient and order |
| POST | `/api/v1/external/partner/orders/renewal` | Create renewal order |
| PATCH | `/api/v1/external/partner/orders/{id}/approval-status` | Update order approval status |
| GET | `/api/v1/external/partner/{partnerId}` | Get partner detail by ID |
| PUT | `/api/v1/external/partner` | Update partner profile |
| GET | `/api/v1/external/partner/patients` | Get all patients for partner |
| GET | `/api/v1/external/partner/patients/{id}` | Get patient detail |
| PUT | `/api/v1/external/partner/patients/{id}` | Update patient information |
| GET | `/api/v1/external/partner/patients/phone/{phoneNumber}` | Get patient by phone number |
| GET | `/api/v1/external/question/new-intake-questions` | Get new intake questions |
| GET | `/api/v1/external/question/renewal-questions` | Get renewal questions |
| POST | `/api/v1/external/upload/presigned-url` | Get presigned URL for file upload |
| GET | `/api/v1/external/upload/preview-url` | Get preview URL for uploaded file |

---

*Documentation generated from Asher Med API OpenAPI 3.0.0 specification*
