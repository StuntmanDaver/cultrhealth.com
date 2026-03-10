# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Payment Processing:**
- Stripe - Subscriptions, checkout sessions, customer portal, payment webhooks
  - SDK: `stripe` ^20.2.0 (server), `@stripe/stripe-js`, `@stripe/react-stripe-js` (client)
  - Auth: `STRIPE_SECRET_KEY` (server), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
  - Webhook: POST `/api/webhook/stripe` (verifies with `STRIPE_WEBHOOK_SECRET`)
  - Integration: `lib/payments/payment-types.ts`, `lib/config/payments.ts`
  - Used in: checkout routes (`app/api/checkout/`), stripe routes (`app/api/stripe/`)

- Affirm (BNPL) - Buy Now Pay Later financing
  - SDK: Custom integration via `lib/payments/affirm-api.ts`
  - Auth: `AFFIRM_PRIVATE_API_KEY` (server), `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY` (client)
  - Script: `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` (sandbox/production CDN)
  - Feature flag: `NEXT_PUBLIC_ENABLE_AFFIRM`
  - Webhook: POST `/api/webhook/affirm`
  - Amount limits: $50–$30,000
  - Used in: `components/payments/AffirmCheckoutButton.tsx`

- Klarna (BNPL) - Buy Now Pay Later financing
  - SDK: Custom integration via `lib/payments/klarna-api.ts`
  - Auth: `KLARNA_API_KEY`, `KLARNA_API_SECRET` (server), `NEXT_PUBLIC_KLARNA_CLIENT_ID` (client)
  - Endpoint: `KLARNA_API_URL` (https://api.playground.klarna.com for sandbox)
  - Feature flag: `NEXT_PUBLIC_ENABLE_KLARNA`
  - Webhook: POST `/api/webhook/klarna`
  - Amount limits: $35–$1,000
  - Used in: `components/payments/KlarnaWidget.tsx`

- Authorize.net - Credit card processing
  - SDK: Custom integration via `lib/payments/authorize-net-api.ts`
  - Auth: `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID`, `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY`
  - Endpoint: Production (https://api.authorize.net/xml/v1/request.api) or Sandbox
  - Feature flag: `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET`
  - Webhook: POST `/api/webhook/authorize-net`
  - Used in: `components/payments/AuthorizeNetForm.tsx`

**Medical/Clinical:**
- Asher Med Partner Portal - HIPAA-compliant patient management, order fulfillment
  - SDK: Custom client via `lib/asher-med-api.ts`
  - Auth: X-API-KEY header (`ASHER_MED_API_KEY`)
  - Endpoint: `ASHER_MED_API_URL` (production: https://prod-api.asherweightloss.com, sandbox available)
  - Partner ID: `ASHER_MED_PARTNER_ID`
  - Configuration: `lib/config/asher-med.ts` (medications, intake steps, validation)
  - Operations: Create patients, submit orders, upload consent/ID files (S3 presigned URLs)
  - Used in: Intake forms, checkout, renewal flow, protocol builder
  - Database: `asher_patient_id` (number) stored in users table

## Data Storage

**Database:**
- Neon PostgreSQL (via Vercel Postgres)
  - Connection: `@vercel/postgres` ^0.10.0 SDK
  - Env var: `POSTGRES_URL`
  - Schema: 11 migrations (migrations/ directory)
  - Tables: users, subscriptions, orders, intake_forms, lmns, creators, affiliate_codes, tracking_links, click_events, order_attributions, commission_ledger, payouts, admin_actions, club_members, club_orders, quickbooks_tokens, stripe_idempotency, asher_med_*, rejuvenation_data
  - Access: Queries via `sql` template function from @vercel/postgres
  - Location: `lib/db.ts` (database utilities)

**File Storage:**
- AWS S3 - Presigned URLs via Asher Med
  - Purpose: ID uploads, consent documents
  - Access: Asher Med provides presigned URLs (temp access tokens)
  - No direct SDK use; URLs obtained from Asher Med API responses

**Caching (Optional):**
- Upstash Redis - Cache/rate limiting (opt-in)
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Usage: Rate limiting in `lib/rate-limit.ts`
  - Not required for core functionality

## Authentication & Identity

**Auth Provider:**
- Custom JWT (JSON Web Tokens)
  - Library: `jose` ^6.1.3 (HS256 signing)
  - Env var: `JWT_SECRET` (32+ chars)
  - Implementation: `lib/auth.ts`
  - Flow: Magic link email → verify token → create JWT session
  - Roles: Patient/Member, Provider, Creator, Admin

**Magic Link Email:**
- Resend - Transactional email service
  - Library: `resend` ^4.0.0
  - Env vars: `RESEND_API_KEY`, `FROM_EMAIL`
  - Used in: `/api/auth/magic-link`, `/api/creators/magic-link`
  - Default FROM: "CULTR <onboarding@resend.dev>" if `FROM_EMAIL` not set

**Session Management:**
- HTTP-only cookies (set by Next.js)
  - Session secret: `SESSION_SECRET` (32+ chars)
  - Cookie name: `__Secure-authToken` (production), `authToken` (dev)
  - TTL: Token-based expiry

**Access Control:**
- Email allowlists via env vars:
  - `PROTOCOL_BUILDER_ALLOWED_EMAILS` - Provider access
  - `ADMIN_ALLOWED_EMAILS` - Admin access
  - `STAGING_ACCESS_EMAILS` - Bypass subscription check (staging only)

**Bot Protection:**
- Cloudflare Turnstile - CAPTCHA verification
  - Library: `@marsidev/react-turnstile` ^1.0.2
  - Env vars: `TURNSTILE_SECRET_KEY` (server)
  - API: POST to https://challenges.cloudflare.com/turnstile/v0/siteverify
  - Implementation: `lib/turnstile.ts`
  - Used in: Waitlist, signup, application forms

## Monitoring & Observability

**Error Tracking:**
- Not detected - Error logging via console.error only

**Logs:**
- Node.js console (stdout/stderr)
- Accessible via Vercel deployment logs
- HIPAA compliance: No PHI logged to external services

**Analytics:**
- Google Analytics 4 - Page tracking, conversion events
  - Env var: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - Implementation: `lib/analytics.ts`
  - Events: page_view, view_item, add_to_cart, begin_checkout, purchase, sign_up, login, search, generate_lead
  - GTags script: Injected via Next.js layout (gtag function in window.dataLayer)

**Social Proof & Feeds:**
- Curator.io - Social media feed aggregation
  - Purpose: Display Instagram, TikTok, YouTube user-generated content on Community page
  - Env vars: `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
  - Implementation: `components/site/CommunityFeed.tsx`
  - Shows "Coming Soon" if feed IDs not configured

## CI/CD & Deployment

**Hosting:**
- Vercel - Edge platform for Next.js
  - Automatic deployments per branch (production, staging, main)
  - Environment variables configured in Vercel dashboard per branch
  - CDN caching headers configured in `next.config.js`

**CI Pipeline:**
- Not detected - No GitHub Actions or other CI service configured
- Vercel handles build and deploy automatically on git push

**Build Hooks:**
- Not detected

## Environment Configuration

**Required env vars (critical):**
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_WEBHOOK_SECRET` - Webhook signature
- `POSTGRES_URL` - Database connection
- `JWT_SECRET` - Token signing
- `SESSION_SECRET` - Session encryption
- `ASHER_MED_API_KEY` - Medical API auth
- `ASHER_MED_PARTNER_ID` - Medical API ID
- `ASHER_MED_API_URL` - Medical API endpoint
- `NEXT_PUBLIC_SITE_URL` - Public domain

**Secrets location:**
- Vercel dashboard → Settings → Environment Variables (per branch)
- Never in `.env` (git-ignored)
- `.env.example` documents all available vars

**Staging bypass (development only):**
- Staging subdomain detects `staging` in `NEXT_PUBLIC_SITE_URL`
- Magic link returns token directly (no email sent)
- Team emails auto-provisioned as creators

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe - POST `/api/webhook/stripe` (subscription events, invoice updates)
- Affirm - POST `/api/webhook/affirm` (payment status)
- Klarna - POST `/api/webhook/klarna` (order status)
- Authorize.net - POST `/api/webhook/authorize-net` (transaction results)
- QuickBooks - POST `/api/webhook/quickbooks` (invoices, payments)
- (Inbound: None detected for external services calling back)

**Outgoing Webhooks:**
- Stripe - Subscriptions sync customer state to database
- Asher Med - Order submissions create patient records, dispatch fulfillment
- Resend - Email sends tracked via callback (async)
- QuickBooks - Invoice creation, customer sync

**Webhook Verification:**
- Stripe: HMAC signature verification with `STRIPE_WEBHOOK_SECRET`
- Affirm/Klarna: API secret verification
- QuickBooks: OAuth2 token refresh on each call
- Club orders: HMAC-signed approval tokens (30-min expiry)

## Rate Limiting & Resilience

**Rate Limiting:**
- Upstash Redis (optional) via `lib/rate-limit.ts`
- IP-based throttling on sensitive endpoints (auth, checkout)
- Not enforced if Redis not configured

**Retry Patterns:**
- Resilience utilities in `lib/resilience.ts`
- Exponential backoff for external API calls
- Circuit breaker pattern for Asher Med

**Error Resilience:**
- Independent try/catch per email send (customer + admin isolated)
- Asher Med failures don't block payment flow (separate concern)
- Database fallback to no-cache if Redis unavailable

## Integration Security

**HIPAA Compliance:**
- No PHI logged to external services
- Patient data encrypted in database
- Secure file uploads with presigned URLs (time-limited)
- Magic link tokens expire (short TTL)
- HTTPS only (enforced by Vercel)

**API Key Management:**
- All secrets in environment variables (never in code)
- X-API-KEY header for Asher Med (no basic auth)
- OAuth2 for QuickBooks (refresh tokens in database)
- Stripe API keys: secret (server-only), publishable (client)

**Webhook Security:**
- HMAC signature verification on all webhooks
- Webhook handlers validate request origin
- Idempotency key tracking for Stripe (prevents double-processing)

---

*Integration audit: 2026-03-10*
