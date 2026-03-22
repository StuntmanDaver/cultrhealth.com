# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Medical/Fulfillment:**
- **Asher Med Partner Portal** — HIPAA-compliant patient onboarding, GLP-1 and peptide order fulfillment, ID/consent file uploads (presigned S3 URLs)
  - SDK/Client: custom fetch wrapper in `lib/asher-med-api.ts`
  - Auth: `X-API-KEY` header
  - Env vars: `ASHER_MED_API_KEY`, `ASHER_MED_PARTNER_ID`, `ASHER_MED_API_URL`, `ASHER_MED_ENVIRONMENT` (`production` | `sandbox`)
  - Endpoints: patient create/lookup, order create/update, file upload presigned URLs
  - Config: `lib/config/asher-med.ts` (medication options, API URLs)
  - Mapping: `lib/config/product-to-asher-mapping.ts` (SKU → Asher Med product)

- **SiPhox Health** — At-home blood test kit fulfillment and biomarker lab results
  - SDK/Client: custom fetch wrapper in `lib/siphox/client.ts` with Zod validation on all responses
  - Auth: Bearer token (`SIPHOX_API_KEY`)
  - Base URL: `SIPHOX_API_URL` (default: `https://connect.siphoxhealth.com/api/v1`)
  - Operations: customer create, kit order, kit validation, report fetch, credits check
  - Schemas: `lib/siphox/schemas.ts` (Zod); Types: `lib/siphox/types.ts`
  - Biomarker mapping: `lib/config/siphox-biomarkers.ts` (50 biomarkers)
  - DB tables: `siphox_customers`, `siphox_kit_orders`, `siphox_reports` (migrations 020–022)
  - Cron jobs: `/api/cron/siphox-fulfillment` (every 15 min), `/api/cron/siphox-results` (every hour) — configured in `vercel.json`

**Social/Content:**
- **Curator.io** — Social media feed aggregation on Community page (`app/community/page.tsx`)
  - SDK/Client: CDN script loaded by `components/site/CommunityFeed.tsx`
  - Auth: Public feed IDs via env vars
  - Env vars: `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
  - Behavior: shows "Coming Soon" when feed IDs are absent

**AI:**
- **OpenAI** (via AI SDK v6) — Protocol generation and meal plan creation
  - SDK: `@ai-sdk/openai` ^3.0.21, `ai` ^6.0.59
  - Auth: `OPENAI_API_KEY`
  - Routes: `app/api/protocol/generate/route.ts`, `app/api/meal-plan/route.ts`

**SMS:**
- **Twilio** — OTP delivery for portal phone authentication
  - SDK: `twilio` ^5.12.2
  - Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
  - Route: `app/api/portal/send-otp/`, `app/api/portal/verify-otp/`
  - Staging bypass: OTP `123456` always accepted when `SIPHOX_API_KEY` or staging URL detected

**Analytics:**
- **Google Analytics 4** — Page tracking and e-commerce conversion events
  - Integration: gtag.js script injected in `app/layout.tsx` (conditional on `NEXT_PUBLIC_GA_MEASUREMENT_ID`)
  - Client: `lib/analytics.ts` — typed wrapper for gtag events (page_view, purchase, sign_up, add_to_cart, etc.)
  - Env vars: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  - DNS prefetch: declared in `<head>` for `js.stripe.com` and `cdn.curator.io`

**Security:**
- **Cloudflare Turnstile** — Bot protection on forms
  - SDK: `@marsidev/react-turnstile` ^1.0.2 (client-side widget)
  - Server verify: `lib/turnstile.ts` → `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  - Auth: `TURNSTILE_SECRET_KEY` (server), public site key configured in component

## Data Storage

**Databases:**
- **Neon PostgreSQL** — Primary database for all application data
  - Connection: `POSTGRES_URL` env var
  - Client: `@vercel/postgres` ^0.10.0 SDK (`sql` tagged template literal)
  - Entry point: `lib/db.ts` (core tables), `lib/creators/db.ts` (affiliate), `lib/siphox/db.ts` (labs)
  - Migration runner: `scripts/run-migration.mjs` (manual execution)
  - 24 migration files in `migrations/` (002–024)

**Caching/Rate Limiting:**
- **Upstash Redis** — Optional distributed rate limiting backend
  - Client: REST API called directly via `fetch` (no SDK dependency)
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Fallback: in-memory `Map` store when Redis env vars absent
  - Implementation: `lib/rate-limit.ts`
  - Preconfigured limiters: `apiLimiter` (10 req/min), `formLimiter` (5/hr), `strictLimiter` (3/15min)

**File Storage:**
- **AWS S3** (via Asher Med) — Patient ID documents and consent forms
  - Presigned URLs issued by Asher Med API; never stored directly
  - Upload routes: `app/api/intake/upload/route.ts`
  - Staging bypass: mock presigned URLs returned when `ASHER_MED_API_KEY` is absent

## Authentication & Identity

**Member/Provider/Admin Auth:**
- Custom magic link flow (no third-party auth provider)
- JWT tokens via `jose` library (HS256); `lib/auth.ts`
- Magic link token: 15-minute expiry, delivered via Resend email
- Session token: 7-day expiry, stored as `cultr_session` HttpOnly cookie
- Roles: `member` | `creator` | `admin`
- Dev mode: session auto-granted as `admin` role in `process.env.NODE_ENV === 'development'`
- Staging bypass: magic link token returned in API response (no email sent); team emails auto-provisioned

**Portal Auth (OTP-based):**
- Phone number + 6-digit SMS OTP (Twilio Verify Service)
- Dual-token: 15-min access token (`cultr_portal_access`) + 7-day refresh token (`cultr_portal_refresh`)
- Implementation: `lib/portal-auth.ts`, `lib/portal-db.ts`
- DB table: `portal_sessions` (migration 014)

**Creator Auth:**
- Separate magic link flow via `/creators/login`
- `verifyCreatorAuth()` in `lib/auth.ts` — checks session cookie, then DB lookup by email
- Active creator status required (`status === 'active'`)

## Payment Processing

**Stripe** — Primary subscription and checkout processor
- SDK: `stripe` ^20.2.0 (server), `@stripe/react-stripe-js` ^5.6.0 + `@stripe/stripe-js` ^8.7.0 (client)
- Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- API version: `2026-02-25.clover`
- Routes: `app/api/checkout/route.ts`, `app/api/stripe/checkout/route.ts`, `app/api/webhook/stripe/route.ts`
- Features: subscriptions, one-time product checkout, customer portal (`bpc_1StZxKC1JUIZB7aRXhaSarRI`), coupon codes (FOUNDER15: 15% off forever, FIRSTMONTH: 50% off first month)
- Client env: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- DB table: `stripe_idempotency` (migration 007)

**Klarna** — BNPL (Buy Now Pay Later) — feature-flagged
- Auth: `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `NEXT_PUBLIC_KLARNA_CLIENT_ID`
- Env: `KLARNA_API_URL` (sandbox: `https://api.playground.klarna.com`)
- Feature flag: `NEXT_PUBLIC_ENABLE_KLARNA=false` (default disabled)
- Implementation: `lib/payments/klarna-api.ts`, `app/api/checkout/klarna/`, `app/api/webhook/klarna/route.ts`

**Affirm** — BNPL — feature-flagged
- Auth: `AFFIRM_PRIVATE_API_KEY`, `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`
- Env: `AFFIRM_API_URL` (sandbox: `https://sandbox.affirm.com`), `NEXT_PUBLIC_AFFIRM_SCRIPT_URL`
- Feature flag: `NEXT_PUBLIC_ENABLE_AFFIRM=false` (default disabled)
- Implementation: `lib/payments/affirm-api.ts`, `app/api/checkout/affirm/`, `app/api/webhook/affirm/route.ts`

**Authorize.net** — Direct credit card processing (high-risk merchant) — feature-flagged
- Auth: `AUTHORIZE_NET_TRANSACTION_KEY`, `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID`, `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY`, `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY`
- Env: `AUTHORIZE_NET_ENVIRONMENT` (`sandbox` | `production`)
- Feature flag: `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET=false` (default disabled)
- Primary provider flag: `NEXT_PUBLIC_PRIMARY_PAYMENT_PROVIDER=stripe` (can switch to `authorize_net`)
- Implementation: `lib/payments/authorize-net-api.ts`, `app/api/checkout/authorize-net/`, `app/api/webhook/authorize-net/route.ts`

**BNPL Amount Limits** (from `lib/config/payments.ts`):
- Klarna: $35 min
- Affirm: configurable per plan

## Accounting & Invoicing

**QuickBooks Online** — Invoice creation and payment recording for CULTR Club orders
- Auth: OAuth2 (refresh token stored in DB, rotated on each use)
- Env vars: `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN`, `QUICKBOOKS_REDIRECT_URI`, `QUICKBOOKS_SANDBOX`
- Token URL: `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
- Implementation: `lib/quickbooks.ts` — token management, customer/invoice creation
- DB table: `quickbooks_tokens` (migration 011) — persists rotated refresh tokens
- Triggered by: admin club order approval (`app/api/admin/club-orders/[orderId]/approve/route.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or similar SDK present)

**Logs:**
- `console.log` / `console.error` used throughout server-side code
- All `console.*` calls removed in production builds (`removeConsole: true` in `next.config.js`)
- HIPAA logging rule: PHI must never appear in logs (enforced via `code-audit.sh` post-tool hook)

**Rate Limiting:**
- IP-based via `lib/rate-limit.ts` (Upstash Redis in production, in-memory fallback in dev)

## Email

**Resend** — All transactional emails
- SDK: `resend` ^4.0.0
- Auth: `RESEND_API_KEY`
- Wrapper: `lib/resend.ts` — includes `escapeHtml()` XSS guard applied to all user-supplied values before template injection
- From address: `FROM_EMAIL` env var (fallback: `CULTR <onboarding@resend.dev>`)
- Email types: magic link, welcome, order confirmations, creator notifications, club order approval/invoice

## CI/CD & Deployment

**Hosting:**
- Vercel
- Active project: `cultrhealth-com` (prj_ZW0ClHb8kXgpuytARXj8fG4NAaH0)

**CI Pipeline:**
- None (no GitHub Actions or similar)
- Pre-commit quality gates enforced via `.claude/hooks/` (run-tests, type-check, code-audit)

**Branch → Environment mapping:**
| Branch | Environment | URL |
|---|---|---|
| `staging` | Staging | staging.cultrhealth.com + join.cultrhealth.com |
| `production` | Production | cultrhealth.com |
| `main` | No deploy (disabled in `vercel.json`) | — |

## Webhooks & Callbacks

**Incoming webhooks:**
- `POST /api/webhook/stripe/route.ts` — Stripe subscription events (verified via `STRIPE_WEBHOOK_SECRET`)
- `POST /api/webhook/affirm/route.ts` — Affirm payment events
- `POST /api/webhook/klarna/route.ts` — Klarna payment events
- `POST /api/webhook/authorize-net/route.ts` — Authorize.net transaction events (HMAC signature verification)
- `POST /api/webhook/quickbooks/route.ts` — QuickBooks Online events

**Outgoing callbacks:**
- BNPL providers redirect to `NEXT_PUBLIC_SITE_URL/success` on completion
- QuickBooks OAuth2 callback: `QUICKBOOKS_REDIRECT_URI` → `app/api/quickbooks/callback/`

**Subdomain routing:**
- `join.cultrhealth.com` and `join.staging.cultrhealth.com` are Vercel domain aliases
- `middleware.ts` rewrites these hostnames to `/join` internally; API routes, static assets, and `/r/` tracking links pass through unchanged

## Affiliate Attribution

**Click tracking:**
- Cookie: `cultr_attribution` (30-day window)
- Redirect handler: `app/r/[slug]/route.ts` — sets attribution cookie, logs `click_events` DB record
- Implementation: `lib/creators/attribution.ts`

**Coupon codes:**
- Validated via `lib/config/coupons.ts` (`validateCouponUnified()`)
- Synced to Stripe promotion codes (column `stripe_promotion_code_id` on `affiliate_codes`)

---

*Integration audit: 2026-03-22*
