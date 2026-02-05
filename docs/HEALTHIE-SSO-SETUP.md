# Healthie SSO Integration Setup Guide

This guide walks you through connecting your CULTR Health website to your Healthie EHR account with automatic Single Sign-On (SSO) authentication.

## Overview

With SSO enabled, your members can click any button in the Member Dashboard and be automatically logged into Healthie without entering credentials. The integration:

- ✅ Generates secure JWT tokens for authentication
- ✅ Auto-creates Healthie patient accounts for new members
- ✅ Deep-links to specific Healthie features (messaging, booking, labs, etc.)
- ✅ Maintains HIPAA compliance through Healthie's infrastructure
- ✅ Gracefully falls back to manual login if SSO fails

## Step 1: Get Your Healthie API Credentials

### 1.1 Access Your Healthie Account

1. Log into your Healthie account at: https://app.gethealthie.com
2. Go to **Settings** → **Integrations** → **API & Webhooks**

### 1.2 Generate API Key

1. Click **Create New API Key**
2. Name it: `CULTR Health Website Integration`
3. Set permissions:
   - ✅ Read Patients
   - ✅ Write Patients
   - ✅ Read Appointments
   - ✅ Write Appointments
   - ✅ Read Conversations
   - ✅ Write Conversations
   - ✅ Read Documents
   - ✅ Write Documents
   - ✅ Read Forms
   - ✅ Read Lab Results
   - ✅ Read Billing
4. Copy the generated API key (you'll only see it once!)

### 1.3 Set Up Webhooks (Optional but Recommended)

1. In **Settings** → **Integrations** → **Webhooks**
2. Click **Create New Webhook**
3. Set URL: `https://your-domain.com/api/webhook/healthie`
4. Select events:
   - Lab Results Received
   - Form Submission Completed
   - Appointment Created/Updated
5. Copy the webhook signature secret

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Healthie Configuration
HEALTHIE_ENVIRONMENT=sandbox  # Change to 'production' when going live
HEALTHIE_API_KEY=your_api_key_from_step_1.2
HEALTHIE_SSO_SECRET=your_api_key_from_step_1.2  # Same as API key for SSO
HEALTHIE_WEBHOOK_SECRET=your_webhook_secret_from_step_1.3

# Optional: Healthie Offering IDs for payment processing
HEALTHIE_OFFERING_CORE=offering_xxx
HEALTHIE_OFFERING_CREATOR=offering_xxx
HEALTHIE_OFFERING_CATALYST=offering_xxx
HEALTHIE_OFFERING_CONCIERGE=offering_xxx
HEALTHIE_OFFERING_CLUB=offering_xxx
```

**Important Notes:**
- Start with `sandbox` environment for testing
- The `HEALTHIE_SSO_SECRET` should be your API key (Healthie uses the same key for both API access and SSO token signing)
- You can find Offering IDs in Healthie under **Settings** → **Packages & Offerings**

## Step 3: Enable SSO in Healthie

### 3.1 Configure SSO Settings

1. In Healthie, go to **Settings** → **General Settings** → **Single Sign-On**
2. Enable **JWT-based SSO**
3. Set **SSO Token Signing Method**: `HS256` (HMAC with SHA-256)
4. Set **Token Issuer**: `cultr-health` (must match the issuer in the code)
5. Set **Token Audience**: `gethealthie` (must match the audience in the code)
6. Set **Token Expiration**: `5 minutes` (short-lived for security)
7. Save changes

### 3.2 Configure Patient Portal Branding & Features

1. Go to **Settings** → **Patient Portal** → **Branding**
2. Match the portal to your brand:
   - Upload your logo
   - Set your primary/secondary colors
   - Update the welcome message
3. Go to **Settings** → **Patient Portal** → **Features**
4. Enable the features you want members to access:
   - ✅ Appointment Booking
   - ✅ Secure Messaging
   - ✅ Document Upload
   - ✅ Lab Results
   - ✅ Forms & Questionnaires
   - ✅ Payment Processing
   - ✅ Telehealth Video

### 3.3 Configure Appointment Types (Consultations)

1. Go to **Settings** → **Scheduling** → **Appointment Types**
2. Create consultation options (e.g., Initial Consult, Follow-up, Lab Review)
3. For each type, set:
   - Duration
   - Provider(s)
   - Location or Telehealth
   - Client-bookable toggle (if applicable)
4. Save and publish the appointment types

### 3.4 Create Intake Forms (Patient Onboarding)

1. Go to **Settings** → **Forms** → **Create New Form**
2. Build your intake form sections (medical history, goals, consent, etc.)
3. Mark required questions and add any file upload fields
4. Assign the form to new clients or specific appointment types
5. Send a test form to confirm the experience

## Step 4: Test the Integration

### 4.1 Development Mode Testing

The integration includes automatic testing bypass in development:

```bash
npm run dev
```

Visit `http://localhost:3000/library` and you'll be automatically logged in as a test user. All SSO buttons should work.

### 4.2 Test SSO Token Generation

Create a test patient in Healthie:

1. In Healthie, go to **Clients** → **Add Client**
2. Add a test patient with your email
3. Note their Healthie Patient ID

Test the SSO endpoint:

```bash
curl -X POST http://localhost:3000/api/healthie/sso-token \
  -H "Content-Type: application/json" \
  -d '{"action":"portal"}'
```

You should receive a response with an `ssoUrl` that looks like:
```
https://staging-secureclient.gethealthie.com/sso?token=eyJhbGc...
```

### 4.3 Test Button Clicks

1. Go to `/library` in your app
2. Click any quick action button (Book Consultation, Message Provider, etc.)
3. A new tab should open with Healthie, and you should be automatically logged in
4. Verify you're redirected to the correct feature

## Step 5: Automatic Patient Creation

When a new member subscribes, you should automatically create their Healthie patient account.

### 5.1 Update Your Stripe Webhook Handler

Add this to your Stripe subscription creation webhook:

```typescript
import { ensureHealthiePatient } from '@/lib/healthie-sso'
import { updateMembership } from '@/lib/db'

// In your subscription.created handler
const healthiePatientId = await ensureHealthiePatient({
  email: customer.email,
  firstName: customer.metadata?.first_name,
  lastName: customer.metadata?.last_name,
  phone: customer.phone,
})

// Store the Healthie patient ID in your database
await updateMembership(subscription.id, {
  healthie_patient_id: healthiePatientId,
})
```

### 5.2 Update Database Schema

Your `memberships` table should have a `healthie_patient_id` column (already present in your schema):

```sql
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS healthie_patient_id VARCHAR(255);
```

## Step 6: Switch to Production

### 6.1 Production Healthie Account Setup

1. Sign up for a production Healthie account (if using sandbox)
2. Repeat Steps 1-3 with your production account
3. Update `.env.local`:

```bash
HEALTHIE_ENVIRONMENT=production
HEALTHIE_API_KEY=your_production_api_key
HEALTHIE_SSO_SECRET=your_production_api_key
```

### 6.2 Verify Production URLs

Production URLs should automatically switch to:
- API: `https://api.gethealthie.com/graphql`
- Portal: `https://secureclient.gethealthie.com`

### 6.3 Update Webhook URLs

Update your Healthie webhook URL to point to your production domain:
```
https://your-production-domain.com/api/webhook/healthie
```

## Step 7: Monitor and Troubleshoot

### 7.1 Check Logs

Monitor your application logs for:
- SSO token generation errors
- Healthie API errors
- Patient creation failures

### 7.2 Common Issues

**Issue: "Failed to generate SSO token"**
- Verify `HEALTHIE_API_KEY` is set correctly
- Check that SSO is enabled in Healthie settings
- Ensure token signing method is HS256

**Issue: "Patient not found"**
- Check that `healthie_patient_id` is stored in database
- Verify patient exists in Healthie
- Try fallback: SSO will work with just email if patient ID is missing

**Issue: "Token expired"**
- Tokens expire after 5 minutes for security
- This is normal - users should click the button again
- If happens too frequently, increase expiration in Healthie settings

**Issue: SSO redirects to login page**
- Verify Healthie SSO configuration matches code settings
- Check issuer/audience values match
- Ensure API key has SSO permissions

### 7.3 Testing Checklist

- [ ] Quick action buttons open Healthie with SSO
- [ ] User is automatically logged in
- [ ] Deep links go to correct feature (messaging, booking, etc.)
- [ ] New members get Healthie accounts created automatically
- [ ] Healthie patient ID is stored in database
- [ ] Webhooks are received from Healthie
- [ ] Lab results sync to your database
- [ ] Fallback works if SSO fails

## Architecture Overview

```
┌─────────────────┐
│   CULTR Member  │
└────────┬────────┘
         │ Clicks "Message Provider"
         │
         ▼
┌─────────────────────────────┐
│  MemberDashboard Component  │
│  - Calls /api/healthie/sso  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  /api/healthie/sso-token    │
│  - Verifies user session    │
│  - Fetches Healthie ID      │
│  - Generates JWT token      │
└────────┬────────────────────┘
         │ Returns SSO URL with token
         │
         ▼
┌─────────────────────────────┐
│   Healthie Patient Portal   │
│   - Validates JWT token     │
│   - Auto-logs in user       │
│   - Shows secure messaging  │
└─────────────────────────────┘
```

## Security Considerations

1. **Token Expiration**: SSO tokens expire after 5 minutes to prevent replay attacks
2. **HTTPS Only**: Always use HTTPS in production
3. **Session Validation**: User sessions are validated before generating SSO tokens
4. **Patient Isolation**: Each user can only access their own Healthie data
5. **Webhook Verification**: Healthie webhooks are verified using HMAC signatures
6. **No Plaintext Storage**: API keys are stored in environment variables, never in code

## Support

If you encounter issues:

1. Check Healthie's status page: https://status.gethealthie.com
2. Review Healthie API docs: https://docs.gethealthie.com
3. Contact Healthie support: support@gethealthie.com
4. Check application logs for error details

## Next Steps

After SSO is working:

1. **Customize Branding**: Match Healthie portal to your brand
2. **Configure Appointment Types**: Set up consultation types in Healthie
3. **Create Forms**: Build intake forms for new patients
4. **Set Up Billing**: Configure Healthie's billing for consultations
5. **Train Staff**: Show providers how to use Healthie EHR
6. **Member Onboarding**: Update onboarding flow to mention Healthie access

## Files Modified

This integration added/modified:

- ✅ `lib/healthie-sso.ts` - SSO token generation logic
- ✅ `app/api/healthie/sso-token/route.ts` - API endpoint for tokens
- ✅ `components/library/MemberDashboard.tsx` - SSO button handlers
- 📝 `docs/HEALTHIE-SSO-SETUP.md` - This setup guide
