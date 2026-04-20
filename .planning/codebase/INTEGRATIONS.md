# External Integrations

*Last updated: 2026-04-20*
*Scope: cultrhealth.com + cultrclub.com*

Both apps share the same Neon Postgres database and the same external vendor accounts (Stripe, Resend, Mailchimp, Cloudflare Turnstile). Where an integration is used by only one app, the matrix makes that explicit.

---

## Integration Matrix

| Integration | cultrhealth.com | cultrclub.com | Auth Method | Purpose |
|---|---|---|---|---|
| **Stripe** | Yes (`^20.2.0`) | Yes (`^22.0.1`) | Secret key + webhook signing secret | Subscriptions, Checkout sessions, Customer Portal, one-time payments |
| **Stripe Customer Portal** | Yes | No | Portal ID `bpc_1StZxKC1JUIZB7aRXhaSarRI` | Self-service subscription management for members |
| **CorePay (Authorize.Net ARB)** | Yes | No | API Login ID + Transaction Key | Alternative recurring card gateway for Core subscriptions |
| **Resend** | Yes | Yes | `RESEND_API_KEY` | All transactional email (magic links, order receipts, creator notifications, admin alerts) |
| **Mailchimp** | Yes | Yes | Basic auth (API key) + audience ID + server prefix | Marketing audience sync + tagged event lifecycle (intake-complete, labs-ready) |
| **Twilio** | Yes | No | Account SID + auth token | SMS OTP delivery for portal/admin login |
| **Cloudflare Turnstile** | Yes | Yes | Site key (public) + `TURNSTILE_SECRET_KEY` | Bot protection on all public forms |
| **Neon Postgres** | Yes | Yes | `POSTGRES_URL` | Primary data store. Main app via `@vercel/postgres` (TCP pool); club via `@neondatabase/serverless` (HTTP) |
| **Upstash Redis** (optional) | Yes | No | REST URL + token | Rate limiting + idempotency cache; both repos fall back to in-memory when unset |
| **QuickBooks Online** | Yes | No | OAuth2 (access + refresh tokens in `quickbooks_tokens` table) | Invoice + customer + payment sync for club orders |
| **OpenAI (via Vercel AI SDK)** | Yes | No | `OPENAI_API_KEY` | Dosing explanations + meal-plan generation |
| **SiPhox Health** | Yes | No | Bearer token `SIPHOX_API_KEY` | At-home lab kit ordering + biomarker ingestion |
| **Healthie EMR** | Yes (code complete, awaiting activation) | No | GraphQL API key | EHR: patients, appointments, form answer groups, documents |
| **Calendly** | Yes | No | Query-param shared secret `CALENDLY_WEBHOOK_SECRET` | Post-onboarding provider scheduling (replaced Healthie embed Apr 12 2026) |
| **Google Analytics 4** | Yes | No | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Page + conversion tracking (main site only; club is stealth/noindex) |
| **Curator.io** | Yes | No | Public feed IDs (Instagram / TikTok / YouTube) | Community page social feed embed |
| **AWS S3** | Present in deps, minimal active use | No | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Historical: presigned upload URLs (Asher Med era). Current uploads flow through SiPhox/Healthie instead. |
| **LegitScript** | Yes (placeholder) | No | Seal ID `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` | Healthcare merchant verification badge (post-certification) |
| **HubSpot** | Yes (embed script) | No | Tracking code | Site-wide visitor tracking embed (per recent commit `61fb4ff`) |
| **Asher Med Partner Portal** | Code remains, no active calls | No | `X-API-KEY` header | Former intake/Rx fulfillment. Removed for LegitScript Apr 4 2026; see CONCERNS. |
| **NOWPayments** | Removed | No | — | Former crypto/Bitcoin gateway. Code removed Mar 30 2026. |
| **Affirm / Klarna / Authorize.net (direct)** | Removed | No | — | Former BNPL + direct-card routes. Removed Mar 30 2026. |

---

## cultrhealth.com Integrations

### Stripe (primary payments)
- SDK: `stripe ^20.2.0`, `@stripe/stripe-js ^8.7.0`, `@stripe/react-stripe-js ^5.6.0`
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Routes:
  - `app/api/checkout/route.ts` — generic Stripe checkout
  - `app/api/checkout/subscription/route.ts` — subscription checkout
  - `app/api/checkout/product/route.ts` — one-time product checkout
  - `app/api/webhook/stripe/route.ts` — webhook handler (dedupes via `stripe_idempotency` table, migration 007)
- Customer portal link: `https://billing.stripe.com/p/login/...` (`lib/config/links.ts`)
- Coupons: `FOUNDER15` (15% off forever), `FIRSTMONTH` (50% off first month), plus Stripe promotion codes (migration 016)

### CorePay (secondary recurring gateway)
- Module: `lib/payments/corepay-gateway.ts`
- Route: `app/api/checkout/corepay/route.ts`
- Env: `COREPAY_API_LOGIN_ID`, `COREPAY_TRANSACTION_KEY`, `COREPAY_API_URL`
- Uses Authorize.Net ARB (Automated Recurring Billing) API under CorePay merchant credentials
- Tax calculation: `lib/config/tax.ts` — Florida sales tax (per jurisdiction compliance, memory Apr 14 2026)

### Resend (transactional email)
- Env: `RESEND_API_KEY`, `FROM_EMAIL`, `FOUNDER_EMAIL`
- Module: `lib/resend.ts` — `getResendClient()`, `escapeHtml()`, `brandedEmailHeader()`, `brandedEmailFooter()`, `EMAIL_FONT_IMPORT`
- All 7 API routes that send email use `escapeHtml()` on user-supplied strings (XSS hardening deployed Mar 18 2026)
- Image URLs must use `getEmailSiteUrl()` helper — never raw `NEXT_PUBLIC_SITE_URL` (localhost breaks email logos)

### Twilio (SMS OTP)
- Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Routes:
  - `app/api/portal/send-otp/route.ts`
  - `app/api/portal/verify-otp/route.ts`
- Used for the patient/member portal login flow alongside magic links

### Mailchimp (marketing sync)
- Env: `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX`
- Module: `lib/mailchimp.ts` — `syncContactToMailchimp()`, `addTagsToContact()`, `getEmailHash()` (MD5 via Node `crypto`)
- Non-throwing (logs errors, never rejects) — Mailchimp outages do not block signup flow

### QuickBooks Online
- Env: `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN`, `QUICKBOOKS_SANDBOX`
- Module: `lib/quickbooks.ts` — OAuth2 token refresh, customer upsert, invoice creation, payment recording
- Tokens cached in-memory + persisted to `quickbooks_tokens` table (migration 011)
- Webhook: `app/api/webhook/quickbooks/route.ts`
- API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting

### SiPhox Health (at-home labs)
- Env: `SIPHOX_API_KEY`, `SIPHOX_API_URL` (default `https://connect.siphoxhealth.com/api/v1`)
- Module: `lib/siphox/client.ts` (Bearer auth, Zod schema validation)
- Sub-modules: `biomarkers.ts`, `fulfillment.ts`, `kit-lifecycle.ts`, `reports.ts`, `schemas.ts`, `errors.ts`, `db.ts`
- DB: `siphox_*` tables (migrations 020, 021, 022, 027, 039)
- Cron jobs:
  - `app/api/cron/siphox-fulfillment/route.ts`
  - `app/api/cron/siphox-results/route.ts`
  - `app/api/cron/siphox-status-sync/route.ts`
- Admin dashboard: `app/api/admin/siphox-smoke/route.ts`
- HIPAA: never log response bodies or biomarker values

### Healthie EMR
- GraphQL endpoints: `https://staging-api.gethealthie.com/graphql` / `https://api.gethealthie.com/graphql`
- Env: `HEALTHIE_API_KEY`, `HEALTHIE_API_URL`, `HEALTHIE_WEBHOOK_SIGNING_KEY`
- Module: `lib/healthie/` — `client.ts`, `mutations.ts`, `queries.ts`, `portal-mapper.ts`, `webhooks.ts`, `patient-sync.ts`, `lab-sync.ts`, `schemas.ts`, `types.ts`, `index.ts`
- Webhook: `app/api/webhook/healthie/route.ts` (HMAC signature via `verifyHealthieWebhook`)
- 7 critical bugs fixed Apr 5 2026; integration waiting on Healthie-side API key enablement (Plus plan)
- Config: `isHealthieConfigured()` guards all call sites so missing key = soft-disabled

### Calendly (scheduling)
- Webhook: `app/api/webhook/calendly/route.ts`
- Env: `CALENDLY_WEBHOOK_SECRET` (query-param `?secret=` auth — see CONCERNS note about header vs query signing)
- On booking event: sets `member_onboarding.appointment_scheduled = TRUE`, emails patient + `support@cultrhealth.com` + `admin@cultrhealth.com`
- Embed: Calendly widget loads via CSP allowlist (`frame-src 'self' ... https://calendly.com`; `script-src ... https://assets.calendly.com`)
- Must use `www.calendly.com` URL form (per memory Apr 12 2026)

### OpenAI (via Vercel AI SDK)
- Packages: `ai ^6.0.59`, `@ai-sdk/openai ^3.0.21`, `@ai-sdk/react ^3.0.61`
- Env: `OPENAI_API_KEY`
- Routes:
  - `app/api/meal-plan/route.ts`
  - `app/api/member/dosing/explain/route.ts`
  - `app/api/creators/dosing/explain/route.ts`

### Cloudflare Turnstile
- Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- Client: `@marsidev/react-turnstile ^1.0.2`
- Server: `lib/turnstile.ts` — verifies against `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- CSP: `script-src ... https://challenges.cloudflare.com`, `frame-src ... https://challenges.cloudflare.com`

### Google Analytics 4
- Env: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Loaded via `next/script` in `app/layout.tsx`
- Event tracking helper: `lib/analytics.ts`

### Curator.io
- Env: `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
- Component: `components/site/CommunityFeed.tsx`
- Renders "Coming Soon" when feed IDs are unset

### HubSpot
- Site-wide tracking script embed (commit `61fb4ff`)
- Loaded in `app/layout.tsx`

### LegitScript (compliance seal)
- Env: `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` — placeholder until certification complete
- Footer seal component reads this env var

### Upstash Redis (optional)
- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Module: `lib/rate-limit.ts` — creates Redis-backed limiter when env present, else in-memory
- Use `failClosed: true` on sensitive endpoints (auth, magic link) so Redis outage denies requests

### Webhook Endpoints (cultrhealth.com)
| Path | Purpose | Auth |
|---|---|---|
| `/api/webhook/stripe` | Stripe events (checkout, invoice, subscription) | `stripe-signature` header + `STRIPE_WEBHOOK_SECRET` |
| `/api/webhook/calendly` | Booking events | Query-param `?secret=` + `CALENDLY_WEBHOOK_SECRET` |
| `/api/webhook/healthie` | Patient/appointment/form events | HMAC header + `HEALTHIE_WEBHOOK_SIGNING_KEY` |
| `/api/webhook/quickbooks` | Invoice/payment status updates | OAuth2 token check |

### Cron Endpoints (cultrhealth.com)
| Path | Frequency | Purpose |
|---|---|---|
| `/api/cron/approve-commissions` | Daily | Auto-approve commissions after 30-day refund window |
| `/api/cron/update-tiers` | Daily | Recalculate creator tiers by recruit count |
| `/api/cron/asher-sync` | Daily (legacy, likely no-op) | Former Asher Med order sync |
| `/api/cron/siphox-fulfillment` | Hourly | Poll SiPhox for fulfillment status |
| `/api/cron/siphox-results` | Hourly | Poll SiPhox for new biomarker results |
| `/api/cron/siphox-status-sync` | Hourly | Sync kit lifecycle states |
| `/api/cron/stale-orders` | Daily | Flag/expire stalled club orders |

---

## cultrclub.com Integrations

### Stripe (server-only)
- SDK: `stripe ^22.0.1` (no client-side `@stripe/stripe-js` package)
- Env: `STRIPE_SECRET_KEY` (shared with main app)
- Checkout is server-initiated: club order routes create a pending order row and return a redirect URL to Stripe Checkout. Stripe webhook events are processed by the **cultrhealth.com** `/api/webhook/stripe` endpoint, not by this repo.

### Resend
- Env: `RESEND_API_KEY`, `FROM_EMAIL` (shared)
- Module: `lib/resend.ts` — same branded-email helper surface as the main app; `escapeHtml()` required on all interpolated values
- `getEmailSiteUrl()` defaults to `https://cultrclub.com` (not main site) for email asset URLs

### Mailchimp
- Env: `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX` (shared with main app — same list)
- Module: `lib/mailchimp.ts` — identical surface to main app but uses `crypto.subtle.digest('MD5', ...)` (Web Crypto) instead of Node `crypto.createHash()` to stay Worker-safe
- Called from `app/api/club/orders/route.ts` on successful order creation

### Cloudflare Turnstile
- Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (shared with main app)
- Module: `lib/turnstile.ts`
- Used on signup, login, and order-creation forms

### Neon Postgres (via serverless HTTP)
- Env: `POSTGRES_URL` (shared connection string)
- Module: `lib/db.ts` — `neon(..., { fullResults: true })` — `fullResults` is non-negotiable (see STACK.md)

### Creator Attribution (cross-domain)
- Module: `lib/creators/attribution.ts`, `lib/creators/commission.ts`, `lib/creators/db.ts`
- Route: `app/[slug]/route.ts` — tracking-link redirect, writes to shared `click_events` + sets `cultr_attribution` cookie on `.cultrclub.com`
- Commission recording on order creation writes to shared `order_attributions` + `commission_ledger`

### Webhook Endpoints (cultrclub.com)
None — this repo is purely a customer-facing store. All webhook processing (Stripe, Healthie, Calendly, QuickBooks) lives on cultrhealth.com.

### Cron Endpoints (cultrclub.com)
None — Cloudflare Pages has no native cron scheduler in this setup. Time-driven jobs (commission approval, tier updates, SiPhox sync) run from cultrhealth.com.

---

## Cloudflare Pages Gotchas (cultrclub.com only)

These quirks matter when debugging integrations on cultrclub.com:

1. **`next.config.js` `headers()` is dropped on Pages Workers.** Static-asset headers go in `public/_headers`; SSR/Worker responses need headers set from `middleware.ts`. The main `cultrhealth.com` app has the opposite problem — `next.config.js` `headers()` is authoritative there.
2. **Cookie domain must come from `request.nextUrl.hostname`, never from `NEXT_PUBLIC_SITE_URL`.** The env var can be stale or missing at edge; always derive from request host (see `lib/utils.ts` `getCookieDomain()`).
3. **`neon()` requires `{ fullResults: true }`** — without it, `.rows` is undefined and every DB call silently returns nothing.
4. **All route files must declare `export const runtime = 'edge'`** — `@cloudflare/next-on-pages` will reject routes that try to use the default Node.js runtime.
5. **`images.unoptimized: true`** — no Next image optimizer on Pages; images must be pre-sized.
6. **`nodejs_compat` flag** in `wrangler.toml` enables `jose`, `crypto.subtle`, `Buffer` — if removed, JWT + Mailchimp MD5 break silently.
7. **`ADMIN_BASE_URL` env var** must point at the cultrhealth.com admin so cross-app approval/confirmation links reach the right host (per memory Apr 13 2026).

---

## Required Environment Variables — Quick Reference

**Required for both apps:**
- `POSTGRES_URL`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `JWT_SECRET`, `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`

**cultrhealth.com only:**
- `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN`
- `HEALTHIE_API_KEY`, `HEALTHIE_API_URL`, `HEALTHIE_WEBHOOK_SIGNING_KEY`
- `SIPHOX_API_KEY`, `SIPHOX_API_URL`
- `CALENDLY_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `COREPAY_API_LOGIN_ID`, `COREPAY_TRANSACTION_KEY`, `COREPAY_API_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID`
- `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional)
- `PROTOCOL_BUILDER_ALLOWED_EMAILS` (provider access control)
- `STAGING_ACCESS_EMAILS` (subscription-check bypass for testing)

**cultrclub.com only:**
- `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX` (also used by main app — same list)
- `ADMIN_BASE_URL` — absolute URL pointing to cultrhealth.com admin

**Forbidden to reference in docs or code output:** contents of `.env*` files, any `*_SECRET_KEY` / `*_API_KEY` / `*_PRIVATE_KEY` values.
