# Healthie SSO - Quick Start Guide

## What You Need from Healthie

### 1. API Key (Required)
**Where:** Healthie Dashboard → Settings → Integrations → API & Webhooks → Create New API Key

**Use for:**
- `HEALTHIE_API_KEY` - GraphQL API access
- `HEALTHIE_SSO_SECRET` - JWT token signing (use same key)

**Permissions needed:**
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

### 2. Webhook Secret (Optional)
**Where:** Healthie Dashboard → Settings → Integrations → Webhooks → Create New Webhook

**Webhook URL:** `https://your-domain.com/api/webhook/healthie`

**Events to subscribe:**
- Lab Results Received
- Form Submission Completed
- Appointment Created
- Appointment Updated

**Use for:**
- `HEALTHIE_WEBHOOK_SECRET` - Verify webhook authenticity

### 3. SSO Configuration (Required)
**Where:** Healthie Dashboard → Settings → General Settings → Single Sign-On

**Settings:**
- ✅ Enable JWT-based SSO
- **Signing Method:** HS256
- **Issuer:** `cultr-health`
- **Audience:** `gethealthie`
- **Expiration:** 5 minutes

## Environment Variables

Add to `.env.local`:

```bash
# Healthie SSO Integration
HEALTHIE_ENVIRONMENT=sandbox
HEALTHIE_API_KEY=your_api_key_here
HEALTHIE_SSO_SECRET=your_api_key_here  # Same as API key
HEALTHIE_WEBHOOK_SECRET=your_webhook_secret_here
```

## Testing

### Local Development
```bash
npm run dev
```

Visit `http://localhost:3000/library` and click any button - should auto-login to Healthie.

### Test SSO Token Generation
```bash
curl -X POST http://localhost:3000/api/healthie/sso-token \
  -H "Content-Type: application/json" \
  -d '{"action":"portal"}'
```

Should return JSON with `ssoUrl` field.

## Production Deployment

1. Update environment:
   ```bash
   HEALTHIE_ENVIRONMENT=production
   HEALTHIE_API_KEY=production_key_here
   HEALTHIE_SSO_SECRET=production_key_here
   ```

2. Update webhook URL in Healthie to production domain

3. Test SSO buttons in production

## Troubleshooting

### "Failed to generate SSO token"
- Check `HEALTHIE_API_KEY` is set correctly
- Verify SSO is enabled in Healthie settings
- Ensure token signing is HS256

### "Token expired"
- Normal - tokens expire after 5 minutes
- User should click button again
- If too frequent, increase expiration in Healthie

### SSO redirects to login
- Verify issuer/audience match in Healthie settings
- Check API key has correct permissions
- Ensure SSO is fully enabled

## Support

- Healthie Status: https://status.gethealthie.com
- Healthie Docs: https://docs.gethealthie.com
- Healthie Support: support@gethealthie.com

## Full Documentation

See `docs/HEALTHIE-SSO-SETUP.md` for complete setup guide.
