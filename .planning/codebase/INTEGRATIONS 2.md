# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Medical Order Fulfillment:**
- **Asher Med Partner Portal** — HIPAA-compliant patient onboarding, prescription orders, file uploads
  - SDK/Client: Custom HTTP client in `lib/asher-med-api.ts` using native `fetch`
  - Base URL: `https://prod-api.asherweightloss.com` (env: `ASHER_MED_API_URL`)
  - Auth: `X-API-KEY` header (env: `ASHER_MED_API_KEY`)
  - Partner ID: `ASHER_MED_PARTNER_ID`
  - Environment toggle: `ASHER_MED_ENVIRONMENT` (production or sandbox)
  - Endpoints used:
    - `POST /api/v1/external/partner/orders/new-order` — Create patient + order
    - `POST /api/v1/external/partner/orders/renewal` — Renewal order
    - `PATCH /api/v1/external/partner/orders/{id}/approval-status` — Update order status + partner note
    - `GET /api/v1/external/partner/orders` — List orders
    - `GET /api/v1/external/partner/patients` — List patients
    - `GET /api/v1/external/partner/patients/{id}` — Patient detail
    - `GET /api/v1/external/partner/patients/phone/{phone}` — Patient lookup by phone
    - `PUT /api/v1/external/partner/patients/{id}` — Update patient
    - `POST /api/v1/external/upload/presigned-url` — Get S3 presigned URL for file upload
    - `GET /api/v1/external/upload/preview-url` — Get file preview URL
  - Staging bypass: When `ASHER_MED_API_KEY` is absent, `app/api/intake/upload/route.ts` returns mock presigned URLs

**Telephony:**
- **Twilio** — SMS OTP for portal phone authentication (`app/api/portal/`)
  - SDK: `twilio` ^5.12.2 (Node.js server SDK)
  - Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
  - Staging bypass: OTP send skipped; verify accepts `123456` when `NEXT_PUBLIC_SITE_URL` contains "staging"

**Social Feed Aggregation:**
- **Curator.io** — Social media feed on `app/community/page.tsx`
  - SDK/Client: External script loaded via `cdn.curator.io` (DNS-prefetched in `app/layout.tsx`)
  - Auth: Feed IDs via env vars (no secret key)
  - Env vars: `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
  - Shows "Coming Soon" when feed IDs not configured

**Bot Protection:**
- **Cloudflare Turnstile** — Bot protection on sensitive forms
  - SDK/Client: `@marsidev/react-turnstile` ^1.0.2 (React widget) + direct `fetch` to `https://challenges.cloudflare.com/turnstile/v0/siteverify` for server verification (`lib/turnstile.ts`)
  - Auth: `TURNSTILE_SECRET_KEY` (server-side), public site key via component props

**Accounting:**
- **QuickBooks Online** — Invoice creation and customer management for CULTR Club orders
  - SDK/Client: Custom OAuth2 client in `lib/quickbooks.ts` using native `fetch` to QBO REST API v3
  - Auth: OAuth2 (client credentials + refresh token rotation)
  - Env vars: `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN`, `QUICKBOOKS_REDIRECT_URI`, `QUICKBOOKS_SANDBOX`
  - Token management: Tokens persisted to `qb_tokens` DB table; auto-refreshes on each use with cache priority: in-memory → DB → env var
  - Token URL: `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
  - Used in: `app/api/admin/club-orders/[orderId]/approve/route.ts` (creates QB customer → QB invoice)

## Data Storage

**Databases:**
- **Neon PostgreSQL** — Primary application database
  - Client: `@vercel/postgres` ^0.10.0 (`sql` tagged template literal from `lib/db.ts`)
  - Connection: `POSTGRES_URL` environment variable
  - Access pattern: `import { sql } from '@vercel/postgres'`
  - Migrations: Manual SQL files in `migrations/`, run via `node scripts/run-migration.mjs`
  - Tables: users, subscriptions, orders, intake_forms, lmns, creators, affiliate_codes, tracking_links, click_events, order_attributions, commission_ledger, payouts, admin_actions, club_members, club_orders, qb_tokens, portal_sessions, asher_med tables, payment_provider, stripe_idempotency

**File Storage:**
- **AWS S3** — Patient file uploads (ID photos, consent signatures)
  - Access: Via Asher Med presigned URLs only (no direct S3 SDK; `lib/asher-med-api.ts` `getPresignedUploadUrl()` then `uploadFileToS3()`)
  - File types: Government ID images, telehealth consent signatures, compounded medication consent signatures

**Caching:**
- **Upstash Redis** — Optional production rate limiting backend
  - Client: Direct REST API calls via native `fetch` in `lib/rate-limit.ts` (no SDK dependency)
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Fallback: In-memory `Map` store when Redis not configured
  - Used for: `apiLimiter` (10 req/min), `formLimiter` (5 req/hr), `strictLimiter` (3 req/15min)

## Authentication & Identity

**Patient/Member Auth:**
- Custom magic link flow — No external auth provider
  - Implementation: `lib/auth.ts` using `jose` library (HS256 JWT)
  - Magic link tokens: 15-min expiry, signed with `JWT_SECRET`
  - Session tokens: 7-day expiry, signed with `SESSION_SECRET`, stored as `cultr_session` HttpOnly cookie
  - Entry: `POST /api/auth/magic-link` → email with link → `GET /api/auth/verify?token=...`
  - Staging bypass: Any email returns token directly in API response (no email sent)

**Portal Auth (Phone OTP):**
- Custom phone OTP flow using Twilio Verify
  - Implementation: `lib/portal-auth.ts` using `jose` library
  - Dual-token: 15-min access token + 7-day refresh token
  - Cookies: `cultr_portal_access` + `cultr_portal_refresh` (separate from member session)
  - DB: `portal_sessions` table (`migrations/014_portal_sessions.sql`)
  - Entry: `POST /api/portal/send-otp` → SMS → `POST /api/portal/verify-otp`

**Creator Auth:**
- Separate magic link flow for creator portal
  - Entry: `POST /api/creators/magic-link` → `GET /api/creators/verify-login`
  - Creator session embedded in shared `cultr_session` cookie with `creatorId` claim
  - Verified via `verifyCreatorAuth()` in `lib/auth.ts`

**Admin Auth:**
- Email allowlist check on top of session auth
  - `verifyAdminAuth()` in `lib/auth.ts` calls `isProviderEmail()` which checks `PROTOCOL_BUILDER_ALLOWED_EMAILS` and `STAGING_ACCESS_EMAILS` env vars

## Payment Processing

**Stripe (Primary):**
- SDK: `stripe` ^20.2.0 (server), `@stripe/react-stripe-js` ^5.6.0 + `@stripe/stripe-js` ^8.7.0 (client)
- Auth: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Webhook secret: `STRIPE_WEBHOOK_SECRET`
- Used for: Subscriptions (Core $199, Catalyst+ $499, Concierge $1099), one-time payments, customer portal
- Customer portal ID: `bpc_1StZxKC1JUIZB7aRXhaSarRI`
- Coupon codes: FOUNDER15 (15% forever), FIRSTMONTH (50% first month)
- API version: `2026-02-25.clover`
- Routes: `app/api/checkout/route.ts`, `app/api/stripe/checkout/route.ts`, `app/api/webhook/stripe/route.ts`

**Affirm (BNPL):**
- SDK/Client: Custom client in `lib/payments/affirm-api.ts` + client-side script loaded dynamically
- Auth: `AFFIRM_PRIVATE_API_KEY` (server), `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY` (client)
- Feature flag: `NEXT_PUBLIC_ENABLE_AFFIRM` (`true`/`false`)
- API URL: `AFFIRM_API_URL` (sandbox: `https://sandbox.affirm.com`)
- Script URL: `NEXT_PUBLIC_AFFIRM_SCRIPT_URL`
- Routes: `app/api/checkout/affirm/`, `app/api/webhook/affirm/route.ts`

**Klarna (BNPL):**
- SDK/Client: Custom client in `lib/payments/klarna-api.ts`
- Auth: `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `NEXT_PUBLIC_KLARNA_CLIENT_ID`
- Feature flag: `NEXT_PUBLIC_ENABLE_KLARNA` (`true`/`false`)
- API URL: `KLARNA_API_URL` (sandbox: `https://api.playground.klarna.com`)
- Routes: `app/api/checkout/klarna/`, `app/api/webhook/klarna/route.ts`

**Authorize.net (High-Risk Credit Card):**
- SDK/Client: Custom client in `lib/payments/authorize-net-api.ts`
- Auth: `AUTHORIZE_NET_TRANSACTION_KEY`, `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID`, `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY`
- Webhook: `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY`
- Environment: `AUTHORIZE_NET_ENVIRONMENT` (`sandbox`/`production`)
- Feature flag: `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET`
- Routes: `app/api/checkout/authorize-net/`, `app/api/webhook/authorize-net/route.ts`
- Primary provider toggle: `NEXT_PUBLIC_PRIMARY_PAYMENT_PROVIDER` (`stripe` or `authorize_net`)

## Email

**Resend:**
- SDK: `resend` ^4.0.0
- Auth: `RESEND_API_KEY`
- From address: `FROM_EMAIL` env var (default: `admin@cultrhealth.com`)
- Client: Lazy-initialized singleton in `lib/resend.ts`
- Templates: HTML email templates inline in `lib/resend.ts` (base template + per-use-case content)
- Email types sent:
  - Magic link authentication (members + creators)
  - Welcome emails post-checkout
  - Order confirmation
  - Club order submission confirmation (customer + admin)
  - Club order admin approval notification
  - QuickBooks invoice copy to support
  - Creator application status (approval/rejection)
  - Creator payout notifications
  - Support ticket confirmation

## AI/LLM

**OpenAI (via AI SDK):**
- SDK: `@ai-sdk/openai` ^3.0.21, `ai` ^6.0.59
- Auth: `OPENAI_API_KEY`
- Used for:
  - Treatment protocol generation (`app/api/protocol/generate/route.ts`)
  - AI meal plan creation (`app/api/meal-plan/route.ts`)
- Access control: Protocol builder restricted to `PROTOCOL_BUILDER_ALLOWED_EMAILS`

## Analytics & Monitoring

**Google Analytics 4:**
- Integration: gtag.js script loaded in `app/layout.tsx` via `next/script` with `strategy="afterInteractive"`
- Auth: `NEXT_PUBLIC_GA_MEASUREMENT_ID` (format: `G-XXXXXXXXXX`)
- Client: `lib/analytics.ts` — wrapper functions for `window.gtag` events
- Events tracked: page_view, view_item, add_to_cart, remove_from_cart, begin_checkout, purchase, sign_up, login, generate_lead, search, conversion
- Conditional: Script only injected when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

**Google Search Console:**
- Auth: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — set as `<meta>` verification tag via Next.js metadata API

**Error Tracking:**
- None configured (no Sentry, Datadog, or similar)

**Logs:**
- `console.log` removed in production builds (`compiler.removeConsole` in `next.config.js`)
- No structured logging service configured

## CI/CD & Deployment

**Hosting:**
- Vercel — Two projects: `cultrhealth` (old) and `cultrhealth-com` (active, linked in `.vercel/project.json`)
- Project ID: `prj_ZW0ClHb8kXgpuytARXj8fG4NAaH0`
- Deployments: Automatic on push to `staging` and `production` branches

**CI Pipeline:**
- None configured (no GitHub Actions, CircleCI, etc.)
- Vercel build runs `npm run build` on each push

**Branch → Environment mapping:**
- `staging` → staging.cultrhealth.com + join.cultrhealth.com (Vercel domain alias)
- `production` → cultrhealth.com
- `main` → Base branch for PRs only (no auto-deploy)

## Webhooks & Callbacks

**Incoming (webhooks received):**
- `POST /api/webhook/stripe` — Stripe payment events (subscription created, updated, deleted, payment succeeded/failed)
- `POST /api/webhook/affirm` — Affirm BNPL payment events
- `POST /api/webhook/klarna` — Klarna BNPL payment events
- `POST /api/webhook/authorize-net` — Authorize.net transaction events
- `GET /api/admin/club-orders/[orderId]/approve` — HMAC-signed one-click approval link (30-min expiry, emailed to admin)
- `GET /api/quickbooks/callback` — QuickBooks OAuth2 callback (redirect URI: `https://staging.cultrhealth.com/api/quickbooks/callback`)

**Outgoing (calls made to external services):**
- Asher Med API — Patient/order management on intake form submission and renewal
- Stripe API — Checkout session creation, subscription lookup, customer portal
- Resend API — Transactional emails triggered by various user actions
- Twilio Verify API — OTP send/check for portal authentication
- QuickBooks Online API — Customer + invoice creation on club order approval
- Cloudflare Turnstile — Token verification on form submissions
- Upstash Redis REST API — Rate limit check/increment (optional)
- OpenAI API (via AI SDK) — Protocol and meal plan generation
- Google Analytics — Page views and conversion events (client-side)

## Affiliate Attribution

**Cookie-Based Click Tracking:**
- Cookie name: `cultr_attribution` (30-day window)
- Implementation: `lib/creators/attribution.ts`
- Click redirect handler: `app/r/[slug]/route.ts` — Sets attribution cookie, increments click count, redirects to destination
- Attribution data: Token, creator ID, link ID, expiry (stored as base64url JSON in cookie)
- DB tables: `click_events` (attribution tokens), `order_attributions` (order-to-creator mapping)

## Environment Variables Summary

**Required for core functionality:**
- `STRIPE_SECRET_KEY` — Stripe payments
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook verification
- `POSTGRES_URL` — Database connection
- `JWT_SECRET` — JWT signing (32+ chars)
- `SESSION_SECRET` — Session encryption (32+ chars)
- `ASHER_MED_API_KEY` — Medical order API
- `ASHER_MED_PARTNER_ID` — Asher Med partner ID
- `ASHER_MED_API_URL` — Asher Med endpoint
- `NEXT_PUBLIC_SITE_URL` — Public URL (controls staging bypass behavior)

**Required for full feature set:**
- `RESEND_API_KEY` — Transactional email
- `OPENAI_API_KEY` — AI protocol/meal plan generation
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` — Portal OTP auth
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN` — Accounting integration
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Analytics

**Optional/Conditional:**
- `TURNSTILE_SECRET_KEY` — Bot protection
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Production rate limiting
- `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `KLARNA_API_URL`, `NEXT_PUBLIC_KLARNA_CLIENT_ID` — Klarna BNPL
- `AFFIRM_PRIVATE_API_KEY`, `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`, `AFFIRM_API_URL`, `NEXT_PUBLIC_AFFIRM_SCRIPT_URL` — Affirm BNPL
- `NEXT_PUBLIC_ENABLE_KLARNA`, `NEXT_PUBLIC_ENABLE_AFFIRM`, `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET` — BNPL feature flags
- `AUTHORIZE_NET_TRANSACTION_KEY`, `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID`, `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY`, `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY` — Authorize.net
- `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE` — Social feed
- `PROTOCOL_BUILDER_ALLOWED_EMAILS` — Provider access control (comma-separated)
- `STAGING_ACCESS_EMAILS` — Bypass subscription check (comma-separated)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Search Console verification

---

*Integration audit: 2026-03-11*
