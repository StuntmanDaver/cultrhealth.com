# Environment Variables — Go-Live Checklist

> **Project:** `cultrhealth-com` on Vercel (stuntmandavers-projects)
> **Last updated:** 2026-03-11

## Already Configured (36 vars) — No Action Needed

POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, POSTGRES_URL_NO_SSL, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_DATABASE, POSTGRES_USER, DATABASE_URL, DATABASE_URL_UNPOOLED, PGHOST, PGHOST_UNPOOLED, PGPASSWORD, PGUSER, PGDATABASE, NEON_PROJECT_ID, JWT_SECRET, SESSION_SECRET, NEXT_PUBLIC_SITE_URL, RESEND_API_KEY, FROM_EMAIL, OPENAI_API_KEY, MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER_PREFIX, STAGING_ACCESS_EMAILS, ADMIN_APPROVAL_EMAIL, ADMIN_ALLOWED_EMAILS, FOUNDER_EMAIL, QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_REALM_ID, QUICKBOOKS_REDIRECT_URI, QUICKBOOKS_REFRESH_TOKEN, QUICKBOOKS_SANDBOX, QUICKBOOKS_SETUP_SECRET, MAILCHIMP_API_KEY (invalid — see below)

---

## CRITICAL — Site Won't Function

| Variable | Description | Status |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe server-side API key for charges/subscriptions | Missing |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures | Missing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key for checkout UI | Missing |
| `ASHER_MED_API_KEY` | Authenticates with Asher Med partner API | Missing |
| `ASHER_MED_API_URL` | Asher Med API base URL (production endpoint) | Missing |
| `ASHER_MED_PARTNER_ID` | Your Asher Med partner account ID | Missing |
| `TWILIO_ACCOUNT_SID` | Twilio account for sending OTP codes | Missing |
| `TWILIO_AUTH_TOKEN` | Twilio API authentication | Missing |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service for OTP delivery | Missing |
| `MAILCHIMP_API_KEY` | Syncs club signups to email list | **Invalid — needs new key from Mailchimp dashboard** |

## IMPORTANT — Security & Auth

| Variable | Description | Status |
|---|---|---|
| `CRON_SECRET` | Prevents unauthorized cron job execution | Missing |
| `TURNSTILE_SECRET_KEY` | Server-side bot verification for form submissions | Missing |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client-side Cloudflare Turnstile widget | Missing |
| `ADMIN_SECRET` | Authenticates admin order fulfillment requests | Missing |
| `INTERNAL_API_KEY` | Authenticates internal LMN generation calls | Missing |
| `ANONYMIZATION_SALT` | Salt for hashing patient identifiers | Missing |
| `CLUB_ORDER_APPROVAL_SECRET` | Signs HMAC approval tokens (falls back to JWT_SECRET) | Missing |

## OPTIONAL — Graceful Degradation

| Variable | Description | Status |
|---|---|---|
| `ASHER_MED_ENVIRONMENT` | `production` or `sandbox` (defaults sandbox) | Missing |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 tracking | Missing |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console ownership proof | Missing |
| `PROTOCOL_BUILDER_ALLOWED_EMAILS` | Comma-separated emails allowed to use protocol builder | Missing |
| `QUICKBOOKS_ITEM_REF` | QB line item reference ID (defaults to `1`) | Missing |
| `QUICKBOOKS_WEBHOOK_TOKEN` | Verifies QuickBooks webhook signatures | Missing |
| `NEXT_PUBLIC_APP_URL` | Billing portal URL in Stripe webhook emails | Missing |
| `UPSTASH_REDIS_REST_URL` | Redis URL for rate limiting and caching | Missing |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | Missing |
| `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM` | Curator.io Instagram feed embed ID | Missing |
| `NEXT_PUBLIC_CURATOR_FEED_TIKTOK` | Curator.io TikTok feed embed ID | Missing |
| `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE` | Curator.io YouTube feed embed ID | Missing |

## BNPL — Only If Enabling Buy Now Pay Later

| Variable | Description | Status |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_KLARNA` | Enable/disable Klarna (`true`/`false`) | Missing |
| `KLARNA_API_KEY` | Klarna server API key | Missing |
| `KLARNA_API_SECRET` | Klarna server API secret | Missing |
| `KLARNA_API_URL` | Klarna API endpoint (sandbox or production) | Missing |
| `NEXT_PUBLIC_KLARNA_CLIENT_ID` | Klarna client-side widget ID | Missing |
| `NEXT_PUBLIC_ENABLE_AFFIRM` | Enable/disable Affirm (`true`/`false`) | Missing |
| `AFFIRM_PRIVATE_API_KEY` | Affirm server API key | Missing |
| `AFFIRM_API_URL` | Affirm API endpoint | Missing |
| `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY` | Affirm client-side key | Missing |
| `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` | Affirm checkout script URL | Missing |
| `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET` | Enable/disable Authorize.net (`true`/`false`) | Missing |
| `AUTHORIZE_NET_TRANSACTION_KEY` | Authorize.net transaction signing key | Missing |
| `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY` | Authorize.net webhook verification | Missing |
| `AUTHORIZE_NET_ENVIRONMENT` | `production` or `sandbox` | Missing |
| `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID` | Authorize.net client-side login ID | Missing |
| `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY` | Authorize.net client-side public key | Missing |
| `NEXT_PUBLIC_PRIMARY_PAYMENT_PROVIDER` | Default payment provider routing | Missing |

---

## Dashboard Steps (No Env Vars)

- [ ] Stripe Tax — Register FL tax nexus in Stripe dashboard
- [ ] Stripe Payment Links — Enable tax on subscription payment links
- [ ] QuickBooks — Configure 7.5% FL sales tax rate
- [ ] Mailchimp — Generate new API key (current one returns 401)
- [ ] Consider consolidating `cultrhealth` and `cultrhealth-com` Vercel projects
