# Healthie SSO Integration - Implementation Summary

## Changes Made

### ✅ New Files Created

1. **`lib/healthie-sso.ts`**
   - Core SSO token generation logic
   - JWT token creation with HS256 signing
   - Helper functions for all Healthie features (booking, messaging, labs, etc.)
   - Patient creation/lookup utilities

2. **`app/api/healthie/sso-token/route.ts`**
   - API endpoint for generating SSO tokens
   - Validates user authentication
   - Fetches Healthie patient ID from database
   - Maps actions to appropriate portal URLs

3. **`docs/HEALTHIE-SSO-SETUP.md`**
   - Complete step-by-step setup guide
   - Healthie account configuration instructions
   - Testing procedures
   - Troubleshooting guide

4. **`docs/HEALTHIE-SSO-QUICKSTART.md`**
   - Quick reference for developers
   - Environment variable setup
   - Common issues and solutions

### ✅ Files Modified

1. **`components/library/MemberDashboard.tsx`**
   - Updated quick action buttons to use SSO authentication
   - Updated feature tiles to use SSO authentication
   - Updated "Open Full Patient Portal" button to use SSO
   - Added fallback to direct URLs if SSO fails

2. **`app/api/webhook/stripe/route.ts`**
   - Added automatic Healthie patient creation on subscription
   - Stores Healthie patient ID in database
   - Links Stripe customers to Healthie patients

3. **`env.example`**
   - Added `HEALTHIE_SSO_SECRET` environment variable

## How It Works

### User Flow

```
1. Member clicks "Message Provider" button
   ↓
2. MemberDashboard sends POST to /api/healthie/sso-token
   ↓
3. API verifies user session and fetches Healthie patient ID
   ↓
4. API generates JWT token with user email and patient ID
   ↓
5. API returns SSO URL with embedded token
   ↓
6. Browser opens Healthie portal in new tab
   ↓
7. Healthie validates token and auto-logs in user
   ↓
8. User sees their secure messages (or requested feature)
```

### Technical Details

**JWT Token Structure:**
```json
{
  "email": "member@example.com",
  "patient_id": "healthie_id_123",
  "redirect_to": "/messages",
  "iss": "cultr-health",
  "aud": "gethealthie",
  "exp": 1234567890
}
```

**SSO URL Format:**
```
https://secureclient.gethealthie.com/sso?token=JWT_TOKEN&redirect_to=/messages
```

**Token Expiration:** 5 minutes (security best practice)

## Environment Setup

### Required Environment Variables

```bash
# Core Configuration
HEALTHIE_ENVIRONMENT=sandbox  # or 'production'
HEALTHIE_API_KEY=your_api_key
HEALTHIE_SSO_SECRET=your_api_key  # Same as API key

# Optional
HEALTHIE_WEBHOOK_SECRET=your_webhook_secret
```

### Healthie Configuration Required

1. **Enable SSO** in Healthie Settings → Single Sign-On
2. **Set JWT Signing:** HS256
3. **Set Issuer:** `cultr-health`
4. **Set Audience:** `gethealthie`
5. **Token Expiration:** 5 minutes

## Features Implemented

### Quick Action Buttons (5 buttons)
- ✅ Book Consultation → `/book`
- ✅ Message Provider → `/messages`
- ✅ View Lab Results → `/labs`
- ✅ Complete Forms → `/forms`
- ✅ Open Patient Portal → Main portal

### Feature Tiles (All categories)
- ✅ Scheduling & Appointments
- ✅ Communication & Messaging
- ✅ Health Records & Lab Results
- ✅ Documents & Forms
- ✅ Programs & Education
- ✅ Billing & Payments
- ✅ Account Settings

### Automatic Patient Management
- ✅ Creates Healthie patient on subscription
- ✅ Stores Healthie patient ID in database
- ✅ Looks up existing patients by email
- ✅ Links Stripe customers to Healthie accounts

## Security Features

1. **Token Expiration:** 5-minute lifespan prevents replay attacks
2. **Session Validation:** Verifies user authentication before generating tokens
3. **Patient Isolation:** Each user can only access their own data
4. **HTTPS Only:** Production requires secure connections
5. **Webhook Verification:** HMAC signatures verify Healthie webhooks
6. **No Plaintext Secrets:** All credentials in environment variables

## Fallback Behavior

If SSO fails for any reason:
- Buttons still open Healthie portal
- User is prompted to log in manually
- No error shown to user
- Graceful degradation ensures functionality

## Testing Checklist

- [ ] Quick action buttons open Healthie with SSO
- [ ] Feature tiles open correct Healthie sections
- [ ] "Open Full Patient Portal" button works
- [ ] Users are automatically logged in
- [ ] Deep links redirect to correct features
- [ ] New subscriptions create Healthie patients
- [ ] Healthie patient IDs stored in database
- [ ] Fallback works if SSO token generation fails
- [ ] Token expiration works (tokens expire after 5 min)
- [ ] Works in both sandbox and production environments

## Next Steps

### Before Going Live

1. **Get Healthie Credentials**
   - Sign up for Healthie account (production)
   - Generate API key with correct permissions
   - Configure SSO settings in Healthie

2. **Configure Environment**
   - Add credentials to `.env.local`
   - Test in development mode
   - Verify all buttons work

3. **Test Integration**
   - Create test patient in Healthie
   - Test all quick action buttons
   - Test all feature tiles
   - Verify auto-login works

4. **Deploy to Production**
   - Update environment variables in hosting platform
   - Switch `HEALTHIE_ENVIRONMENT` to `production`
   - Update webhook URL in Healthie
   - Test in production

### Optional Enhancements

1. **Embedded Widgets** (Future)
   - Embed Healthie messaging widget in dashboard
   - Embed booking widget on website
   - Requires additional Healthie SDK setup

2. **Webhook Processing** (Already partially implemented)
   - Process lab results from Healthie
   - Sync appointment data
   - Track form submissions

3. **Care Plan Sync** (Future)
   - Sync CULTR protocols to Healthie care plans
   - Bidirectional protocol updates
   - Track patient adherence

## Support Resources

- **Full Setup Guide:** `docs/HEALTHIE-SSO-SETUP.md`
- **Quick Start:** `docs/HEALTHIE-SSO-QUICKSTART.md`
- **Healthie Docs:** https://docs.gethealthie.com
- **Healthie Support:** support@gethealthie.com

## Files Reference

```
lib/
  healthie-sso.ts              # SSO token generation
  healthie-api.ts              # Healthie GraphQL API client
  config/healthie.ts           # Healthie configuration

app/api/
  healthie/
    sso-token/route.ts         # SSO token API endpoint
  webhook/
    healthie/route.ts          # Healthie webhook handler (existing)
    stripe/route.ts            # Updated with patient creation

components/library/
  MemberDashboard.tsx          # Updated with SSO handlers

docs/
  HEALTHIE-SSO-SETUP.md        # Complete setup guide
  HEALTHIE-SSO-QUICKSTART.md   # Quick reference
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    CULTR Health Website                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────┐      ┌──────────────────────┐ │
│  │  MemberDashboard     │      │  API Routes          │ │
│  │  Component           │─────▶│  /api/healthie/      │ │
│  │  - Quick Actions     │      │  sso-token           │ │
│  │  - Feature Tiles     │      │                      │ │
│  └──────────────────────┘      └──────────┬───────────┘ │
│                                             │             │
│  ┌──────────────────────┐                 │             │
│  │  Authentication      │                 │             │
│  │  - Session cookies   │◀────────────────┘             │
│  │  - JWT tokens        │                               │
│  └──────────────────────┘                               │
│                                                            │
│  ┌──────────────────────┐      ┌──────────────────────┐ │
│  │  Database            │      │  Healthie SSO        │ │
│  │  - memberships       │      │  - Token generation  │ │
│  │  - healthie_patient_id│     │  - JWT signing       │ │
│  └──────────────────────┘      └──────────┬───────────┘ │
│                                             │             │
└─────────────────────────────────────────────┼─────────────┘
                                              │
                                              │ SSO Token
                                              ▼
                        ┌─────────────────────────────────┐
                        │    Healthie EHR Platform        │
                        ├─────────────────────────────────┤
                        │  - Validates JWT token          │
                        │  - Auto-logs in patient         │
                        │  - Shows requested feature      │
                        │  - Sends webhooks for events    │
                        └─────────────────────────────────┘
```

---

**Implementation completed:** All SSO integration code is in place and ready for configuration.
**Status:** ✅ Ready for testing once Healthie credentials are added
**Estimated setup time:** 30-60 minutes (mostly Healthie account setup)
