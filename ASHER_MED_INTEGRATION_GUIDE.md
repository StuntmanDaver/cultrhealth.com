# Asher Med Integration Guide

Complete guide for integrating with the Asher Med Partner Portal API for CULTR Health patient onboarding and order management.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Authentication](#authentication)
4. [Patient Intake Flow](#patient-intake-flow)
5. [File Upload Flow](#file-upload-flow)
6. [Order Management](#order-management)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Common Issues](#common-issues)

---

## Overview

The Asher Med Partner Portal API provides HIPAA-compliant infrastructure for:

- Patient registration and onboarding
- Order creation and tracking
- Medical record storage
- Prescription fulfillment
- Secure file uploads (ID photos, signatures, prescriptions)

### Why Asher Med?

- **HIPAA Compliance:** Built-in PHI data handling
- **Prescription Management:** Licensed providers and pharmacy network
- **Order Fulfillment:** Automated medication shipping
- **Integration Ready:** RESTful API with comprehensive documentation

---

## Prerequisites

### Required Credentials

1. **API Key** - Obtained from Asher Med Partner Portal dashboard
2. **Partner ID** - Your unique identifier in the Asher Med system
3. **API URL** - Production or sandbox environment URL

### Environment Setup

Add to your `.env` file:

```env
ASHER_MED_API_KEY=your-api-key-here
ASHER_MED_API_URL=https://prod-api.asherweightloss.com
ASHER_MED_PARTNER_ID=your-partner-id
ASHER_MED_ENVIRONMENT=production
```

For sandbox testing:
```env
ASHER_MED_API_URL=https://sandbox-api.asherweightloss.com
ASHER_MED_ENVIRONMENT=sandbox
```

---

## Authentication

All API requests require an API key in the request header:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-API-KEY': process.env.ASHER_MED_API_KEY
};
```

Example using our API client:

```typescript
import { asherMedApi } from '@/lib/asher-med-api';

// The API key is automatically included
const response = await asherMedApi.createNewOrder(orderData);
```

---

## Patient Intake Flow

### Step 1: Collect Patient Information

The patient completes the intake form with:

- **Personal Information:** Name, email, phone, DOB, gender
- **Shipping Address:** Full US address with state abbreviation
- **Medication Selection:** GLP-1 or non-GLP-1 medications with duration
- **Physical Measurements:** Height, weight, BMI, body fat percentage
- **Health Questionnaire:** Medical history and wellness questions
- **Treatment Preferences:** Custom solutions and dosing preferences
- **ID Verification:** Government-issued ID photo
- **Consent Forms:** Telehealth and compounded medication signatures

### Step 2: Upload Files

Before submitting the order, upload required files:

```typescript
import { asherMedApi } from '@/lib/asher-med-api';

// 1. Request presigned URL
const uploadRequest = await asherMedApi.getPresignedUploadUrl({
  contentType: 'image/jpeg'
});

const { uploadUrl, key } = uploadRequest.data;

// 2. Upload file to S3
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: fileBlob
});

// 3. Use the returned 'key' in your order data
const idDocumentUpload = {
  frontIDFileS3Key: key,
  isGovernmentIDConfirmed: true
};
```

### Step 3: Submit Order

```typescript
const orderData = {
  personalInformation: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+11234567890',
    dateOfBirth: '1990-01-15',
    gender: 'MALE'
  },
  shippingAddress: {
    address1: '123 Main St',
    apartmentNumber: 'Apt 4B',
    city: 'San Francisco',
    stateAbbreviation: 'CA',
    zipCode: '94102',
    country: 'US',
    addressAdditionalInfo: ''
  },
  medicationPackages: [
    {
      name: 'Tirzepatide',
      duration: 84, // days
      medicationType: 'Injection'
    }
  ],
  physicalMeasurements: {
    height: 70, // inches
    weight: 180, // lbs
    bmi: 25.8,
    currentBodyFat: 22
  },
  idDocumentUpload: {
    frontIDFileS3Key: 'external-uploads/550e8400-...',
    isGovernmentIDConfirmed: true
  },
  telehealthConsent: {
    agreeTelehealthService: true,
    telehealthSigS3Key: 'external-uploads/550e8400-...'
  },
  consentAcknowledgments: {
    consentCompoundedSigS3Key: 'external-uploads/550e8400-...',
    consentHealthcareConsultation: true
  },
  wellnessQuestionnaire: { /* ... */ },
  treatmentPreferences: {
    providerCustomSolution: 'yes_custom',
    providerCustomSolutionMuscleLoss: 'yes_muscle_prevention'
  },
  medicationTypeSelection: 'GLP1'
};

const response = await asherMedApi.createNewOrder(orderData);

if (response.success) {
  const { patient, order } = response.data;
  console.log('Order created:', order.id);
  console.log('Patient ID:', patient.id);
}
```

---

## File Upload Flow

### Supported File Types

- **Images:** `image/jpeg`, `image/png`, `image/webp`
- **Documents:** `application/pdf`
- **Max Size:** 20 MB per file

### Upload Process

1. **Get Presigned URL**
   ```typescript
   const { uploadUrl, key, previewUrl } = await asherMedApi.getPresignedUploadUrl({
     contentType: 'image/jpeg'
   });
   ```

2. **Upload File to S3**
   ```typescript
   const response = await fetch(uploadUrl, {
     method: 'PUT',
     headers: { 'Content-Type': 'image/jpeg' },
     body: file
   });
   ```

3. **Store S3 Key**
   - Use the `key` value in your order submission
   - Store it for future reference

4. **Retrieve File Later**
   ```typescript
   const { previewUrl } = await asherMedApi.getFilePreviewUrl(key);
   // Use previewUrl to display/download the file
   ```

### Example: ID Photo Upload Component

```typescript
import { useState } from 'react';
import { asherMedApi } from '@/lib/asher-med-api';

export function IDUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploading(true);

    try {
      // 1. Get presigned URL
      const { data } = await asherMedApi.getPresignedUploadUrl({
        contentType: file.type
      });

      // 2. Upload to S3
      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      // 3. Return the S3 key
      onUploadComplete(data.key);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input
      type="file"
      accept="image/jpeg,image/png"
      onChange={(e) => handleFileSelect(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

---

## Order Management

### Get Patient by Phone Number

Useful for renewal orders:

```typescript
const patient = await asherMedApi.getPatientByPhone('+11234567890');

if (patient) {
  console.log('Existing patient:', patient.id);
  // Pre-fill renewal form with patient data
}
```

### Create Renewal Order

```typescript
const renewalData = {
  personalInformation: { /* ... */ },
  shippingAddress: { /* ... */ },
  medicationPackages: [ /* ... */ ],
  telehealthConsent: { /* ... */ },
  wellnessQuestionnaire: { /* required for renewals */ }
};

const response = await asherMedApi.createRenewalOrder(renewalData);
```

### Get Order Details

```typescript
const order = await asherMedApi.getOrderDetails(orderId);

console.log('Status:', order.status);
console.log('Patient:', order.patient.name);
console.log('Medications:', order.medicationPackages);
```

### List All Orders

```typescript
const orders = await asherMedApi.getOrders({
  page: 1,
  limit: 20,
  status: 'PENDING' // optional filter
});

orders.data.forEach(order => {
  console.log(`Order ${order.id}: ${order.status}`);
});
```

---

## Error Handling

### Standard Error Response

```typescript
{
  success: false,
  error: {
    message: 'Error description',
    code: 'ERROR_CODE' // optional
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check partner permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Error | Fix validation issues |
| 429 | Rate Limit | Retry with backoff |
| 500 | Server Error | Retry or contact support |

### Error Handling Example

```typescript
try {
  const response = await asherMedApi.createNewOrder(orderData);

  if (!response.success) {
    // Handle API error
    console.error('API Error:', response.error.message);

    if (response.error.code === 'VALIDATION_ERROR') {
      // Show validation errors to user
      showValidationErrors(response.error.errors);
    }

    return;
  }

  // Success
  const { patient, order } = response.data;

} catch (error) {
  // Handle network or unexpected errors
  console.error('Request failed:', error);
  showErrorMessage('Unable to submit order. Please try again.');
}
```

### Rate Limiting

File upload endpoints have rate limits:
- **20 requests per 15 minutes** per API key

Handle rate limits:
```typescript
if (error.status === 429) {
  const retryAfter = error.headers['retry-after'];
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);

  // Queue the request for retry
  setTimeout(() => retryRequest(), retryAfter * 1000);
}
```

---

## Testing

### Test Environment

Use sandbox environment for testing:

```env
ASHER_MED_API_URL=https://sandbox-api.asherweightloss.com
ASHER_MED_ENVIRONMENT=sandbox
```

### Test Data

Example test patient:

```typescript
const testPatient = {
  personalInformation: {
    firstName: 'Test',
    lastName: 'Patient',
    email: 'test+patient@cultrhealth.com',
    phoneNumber: '+15555551234',
    dateOfBirth: '1990-01-01',
    gender: 'MALE'
  },
  // ... rest of test data
};
```

### Integration Tests

```typescript
import { asherMedApi } from '@/lib/asher-med-api';

describe('Asher Med Integration', () => {
  it('should create a new patient order', async () => {
    const orderData = createTestOrderData();
    const response = await asherMedApi.createNewOrder(orderData);

    expect(response.success).toBe(true);
    expect(response.data.patient.id).toBeDefined();
    expect(response.data.order.status).toBe('PENDING');
  });

  it('should retrieve patient by phone', async () => {
    const patient = await asherMedApi.getPatientByPhone('+15555551234');

    expect(patient).toBeDefined();
    expect(patient.phoneNumber).toBe('+15555551234');
  });
});
```

---

## Common Issues

### Issue: 401 Unauthorized

**Cause:** Invalid or missing API key

**Solution:**
1. Verify `ASHER_MED_API_KEY` is set in `.env`
2. Check API key is correct (copy from Asher Med dashboard)
3. Ensure key hasn't expired

### Issue: 400 Bad Request - Invalid Phone Number

**Cause:** Phone number format incorrect

**Solution:**
- Use E.164 format: `+1XXXXXXXXXX`
- Include country code (+1 for US)
- Remove spaces, dashes, parentheses

```typescript
// ❌ Wrong
phoneNumber: '(123) 456-7890'
phoneNumber: '123-456-7890'

// ✅ Correct
phoneNumber: '+11234567890'
```

### Issue: File Upload Fails

**Cause:** Various issues with presigned URL or file

**Solution:**
1. Check file size < 20 MB
2. Verify content type is supported
3. Use PUT method (not POST) for S3 upload
4. Set correct Content-Type header
5. Upload within 24 hours (URL expiry)

### Issue: Validation Errors

**Cause:** Required fields missing or invalid data

**Solution:**
1. Check all required fields are included
2. Validate email format
3. Validate date format (YYYY-MM-DD)
4. Ensure state abbreviation is 2 letters (CA, NY, etc.)
5. Verify enum values match API specification

### Issue: Order Not Appearing

**Cause:** Order created but not visible in dashboard

**Solution:**
1. Wait a few seconds for processing
2. Refresh order list
3. Check order status is correct
4. Verify partner ID matches

---

## API Client Reference

The CULTR Health Asher Med API client (`lib/asher-med-api.ts`) provides convenient methods:

```typescript
import { asherMedApi } from '@/lib/asher-med-api';

// Patient Management
asherMedApi.getPatientByPhone(phoneNumber)
asherMedApi.updatePatient(patientId, updates)

// Order Management
asherMedApi.createNewOrder(orderData)
asherMedApi.createRenewalOrder(renewalData)
asherMedApi.getOrderDetails(orderId)
asherMedApi.getOrders({ page, limit, status })

// File Uploads
asherMedApi.getPresignedUploadUrl({ contentType })
asherMedApi.getFilePreviewUrl(key)

// Intake Questions
asherMedApi.getNewIntakeQuestions()
asherMedApi.getRenewalQuestions()
```

---

## Additional Resources

- **Full API Documentation:** [asher-med-api-documentation.md](./asher-med-api-documentation.md)
- **Asher Med Support:** support@ashermed.com
- **Partner Portal:** https://asherweightloss.com

---

## Migration Notes

### From Healthie to Asher Med

If migrating from Healthie, key differences:

1. **Authentication:** API key header (`X-API-KEY`) instead of GraphQL token
2. **Data Format:** REST JSON instead of GraphQL
3. **File Storage:** S3 presigned URLs instead of direct uploads
4. **Patient Lookup:** Phone number lookup instead of email

### Data Mapping

| Healthie Field | Asher Med Field |
|---------------|-----------------|
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `email` | `email` |
| `phone_number` | `phoneNumber` |
| `dob` | `dateOfBirth` |
| `legal_sex` | `gender` |
| `state` | `stateAbbreviation` |

---

**Last Updated:** 2024-02-04
**Version:** 1.0.0
