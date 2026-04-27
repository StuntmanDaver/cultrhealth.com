# External Integrations

*Last updated: 2026-04-27*
*Scope: this repository (`cultrhealth-website`) — the source of truth for both staging.cultrhealth.com (Vercel) and production cultrhealth.com (Cloudflare Pages, mirrored to sibling repo `cultrhealth-web`).*

> **Important scope change since the previous version (Apr 22):**
> The earlier doc was scoped to "cultrhealth.com + cultrclub.com" together. The cultrclub.com app now lives in its own repo (`cultrclub-web`) and is no longer covered here. The legacy `join.cultrhealth.com` subdomain was retired Apr 22 2026 and no longer resolves — it must not be referenced as an active host.

---

## Hosting & Deploy Topology

This is the biggest delta since the previous doc. Production hosting moved from Vercel to Cloudflare Pages.

| Environment | Host | Branch | Domain | Adapter | Trigger |
|---|---|---|---|---|---|
| **Production** | Cloudflare Pages (sibling repo `cultrhealth-web`) | `main` | cultrhealth.com + www | `@cloudflare/next-on-pages@1` | **Manual** — `npm run build:cf && npm run deploy:prod` (Node 20 required) |
| **Staging** | Vercel (this repo) | `staging` | staging.cultrhealth.com | Vercel default | Auto on push |
| ~~join.cultrhealth.com~~ | ~~Vercel domain alias~~ | — | — | — | **Retired Apr 22 2026** — DNS removed, Vercel alias detached |

### Source-of-truth flow
1. Code is authored in this repo (`cultrhealth-website`).
2. Push to `staging` → Vercel auto-deploys staging.cultrhealth.com.
3. Promote to production by syncing the relevant changes into the sibling `cultrhealth-web` repo's `main` branch, then **manually** running `npm run build:cf && npm run deploy:prod` from there.
4. There is **no** GitHub auto-deploy on production. Production deploys are a deliberate two-command operation.

### Cloudflare Pages runtime caveats (production only)
These are integration constraints inherited from CF Pages, not bugs:

1. **Neon Postgres requires `fullResults: true`** when the Workers runtime uses `@neondatabase/serverless`. (This repo currently uses `@vercel/postgres ^0.10.0` directly. The sibling CF repo wraps Neon with the serverless driver and `fullResults: true`. Any code added here that switches to `neon()` must include this option.)
2. **`nodejs_compat` flag** is required in the CF `wrangler.toml` for `jose`, `crypto.subtle`, and `Buffer` to work. Without it, JWT signing and any Node-style crypto silently break.
3. **`dompurify` is unreliable** in the CF Workers runtime (uses `jsdom`-style globals). Sanitization on edge-rendered routes should not depend on it.
4. **3 MiB worker bundle limit.** Avoid pulling large libraries into edge routes — split server actions or move heavy work to background jobs.
5. **`images.unoptimized: true`** must be set for CF Pages — there is no Next image optimizer on Pages. Images must be pre-sized (this repo uses AVIF + WebP via the `images.formats` config in `next.config.js`).
6. **`export const runtime = 'edge'`** must be declared on every route file deployed to CF. (This repo uses `runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'` extensively because staging is on Vercel — the sibling repo enforces edge.)
7. **`next.config.js` `headers()` is dropped on CF Pages.** The full security/CSP header set in this repo's `next.config.js` only applies on Vercel. On CF Pages, static-asset headers must live in `public/_headers`, and dynamic/SSR headers must be set from `middleware.ts`.
8. **`@cloudflare/next-on-pages` hardlinks** can truncate large public/ binaries (>64KB) shared with `.vercel/output/static/`. After `build:cf`, the deploy script must `cp` source files into the output dir before `wrangler pages deploy`. Verify file sizes pre-deploy.
9. **Cookie domain must come from the request hostname**, not from `NEXT_PUBLIC_SITE_URL`. The env var is unreliable at the edge.

### Build & deploy commands (this repo)
```bash
npm run dev               # Next dev server (localhost:3000)
npm run build             # Vercel build (staging path)
npm run start             # Production-mode local server
npm run lint              # ESLint via next lint
npm run analyze           # Bundle analysis (ANALYZE=true next build)
npm run setup:stripe      # One-time Stripe product/price setup
npm run check:health      # scripts/site-health-check.mjs (prod)
npm run check:health:staging  # Same script against staging
npm run test:smoke        # Vitest smoke tests
npm run test:e2e          # Playwright E2E
node scripts/run-migration.mjs  # DB migrations (manual)
```
There are intentionally **no** `build:cf` / `deploy:prod` scripts in this repo's `package.json` — those live in the sibling production repo.

---

## Integration Matrix

| Integration | Status | Auth Method | Purpose |
|---|---|---|---|
| **Stripe** | Active | Secret key + webhook signature | Subscriptions, Checkout sessions, Customer Portal, one-time payments |
| **Stripe Customer Portal** | Active | Portal ID `bpc_1StZxKC1JUIZB7aRXhaSarRI` (in `lib/config/links.ts`) | Self-service subscription management |
| **CorePay (Authorize.Net ARB)** | Active (feature-flagged) | API Login ID + Transaction Key + Public Client Key | Recurring card gateway alternative to Stripe |
| **Resend** | Active | `RESEND_API_KEY` | All transactional email |
| **Mailchimp** | Active | API key (Basic auth) + audience ID + server prefix | Marketing audience sync + tagged events |
| **Twilio Verify** | Active | Account SID + Auth Token + **Verify Service SID** | SMS OTP for member portal login |
| **Cloudflare Turnstile** | Active | Site key (public) + secret | Bot protection on public forms |
| **Neon Postgres** | Active | `POSTGRES_URL` | Primary data store via `@vercel/postgres` SDK |
| **Upstash Redis** | Optional | REST URL + token | Rate-limit + idempotency cache (in-memory fallback) |
| **QuickBooks Online** | Active | OAuth2 (refresh-token-based) | Customer + invoice + payment sync for club orders |
| **OpenAI (via Vercel AI SDK v6)** | Active | `OPENAI_API_KEY` | Dosing explanations + meal-plan generation |
| **SiPhox Health** | Active | Bearer token | At-home lab kit ordering + biomarker ingestion |
| **Healthie EMR** | Code complete, gated by `USE_HEALTHIE` flag | GraphQL API key (Basic auth) | EHR: patients, appointments, form answer groups, documents |
| **Calendly** | Active | Query-param shared secret | Provider scheduling (replaced Healthie embed Apr 12 2026) |
| **Google Analytics 4** | Active | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Page + conversion tracking |
| **HubSpot** | Active | Hard-coded portal `245823955` | Site-wide visitor tracking embed |
| **Microsoft Clarity** | Active | Hard-coded project `wftg6won35` | Session replay + heatmaps |
| **Curator.io** | Active | Public feed IDs | Community page social feed embed |
| **LegitScript** | Placeholder | Seal ID env var | Healthcare merchant verification badge |
| **Asher Med Partner Portal** | **Dormant** — code present, not actively called | `X-API-KEY` header | Former intake/Rx fulfillment. See "Deprecated/Removed" below. |
| **AWS S3 (`@aws-sdk/client-s3`)** | **Dormant** — package installed, no imports in `app/` or `lib/` | — | Former Asher Med presigned uploads. See "Deprecated/Removed". |
| ~~Affirm / Klarna / NOWPayments~~ | **Removed** | — | BNPL + crypto routes removed Mar 30 2026 |
| ~~Authorize.net (direct)~~ | **Removed as standalone** | — | Now wrapped under CorePay branding via `lib/payments/corepay-gateway.ts` |

---

## 1. Database — Neon Postgres

- **SDK:** `@vercel/postgres ^0.10.0` (`import { sql } from '@vercel/postgres'`)
- **Env:** `POSTGRES_URL`
- **Module pattern:** Direct `sql` import — no shared connection wrapper. `lib/db.ts` defines query helpers and types, not a client.
- **Runtime split:**
  - **Staging (Vercel, this repo):** `@vercel/postgres` works natively with `runtime = 'nodejs'`.
  - **Production (CF Pages, sibling repo):** the sibling repo wraps Neon via `@neondatabase/serverless` with `{ fullResults: true }`. Any code that runs on edge in the sibling repo must use the serverless driver, not `@vercel/postgres`.
- **NUMERIC coercion gotcha:** `@vercel/postgres` returns `NUMERIC` columns as **strings**. Always `Number()` / `parseFloat()` before arithmetic or before passing back into SQL `INSERT`. (See CONVENTIONS.md and `feedback_vercel_numeric_coercion`.)
- **Migrations:** SQL files in `migrations/` (002 → 062). Runner: `scripts/run-migration.mjs`. Migrations are run manually — no automated migration on deploy.

---

## 2. Payments

### Stripe (primary)
- **SDKs:**
  - Server: `stripe ^20.2.0` (instantiated lazily; `apiVersion: '2026-02-25.clover'`)
  - Client: `@stripe/stripe-js ^8.7.0`, `@stripe/react-stripe-js ^5.6.0`
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus add-on price IDs:
  - `BLOOD_TEST_STRIPE_PRICE_ID`
  - `DOCTOR_CONSULTATION_STRIPE_PRICE_ID`
- **Routes:**
  - `app/api/checkout/route.ts` — generic / fallback
  - `app/api/checkout/subscription/route.ts` — subscription with optional add-ons
  - `app/api/checkout/product/route.ts` — one-time product checkout
  - `app/api/webhook/stripe/route.ts` — webhook (idempotency via `stripe_idempotency` table, migration 007)
- **Customer portal:** `https://billing.stripe.com/p/login/...` — portal ID hardcoded in `lib/config/links.ts`
- **Coupons:** `FOUNDER15` (15% off forever), `FIRSTMONTH` (50% off first month). Stripe promotion-code sync via `scripts/sync-stripe-promo-codes.mjs` (migration 016)

### CorePay (Authorize.Net ARB, feature-flagged)
- **Module:** `lib/payments/corepay-gateway.ts` (uses Authorize.Net XML/v1 ARB API under CorePay merchant credentials)
- **Config:** `lib/config/payments.ts` — `COREPAY_CONFIG` with `apiUrl` switching between `https://apitest.authorize.net/...` (sandbox) and `https://api.authorize.net/...` (production) based on `COREPAY_ENVIRONMENT`
- **Route:** `app/api/checkout/corepay/route.ts`
- **Client form:** `components/payments/CorePayForm.tsx` (loads `Accept.js` from `js.authorize.net` or `jstest.authorize.net`)
- **Env (verified against code):**
  - `NEXT_PUBLIC_ENABLE_COREPAY` — feature flag
  - `NEXT_PUBLIC_COREPAY_API_LOGIN_ID` — public, used for Accept.js
  - `NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY` — public client key for tokenization
  - `COREPAY_TRANSACTION_KEY` — server-only, used for ARB API calls
  - `COREPAY_ENVIRONMENT` — `production` or `sandbox` (default: `sandbox`)
- **Tax:** `lib/config/tax.ts` calculates Florida sales tax (per Florida-only jurisdiction compliance from Apr 14 2026)
- **Selector UI:** `components/payments/PaymentMethodSelector.tsx`, loader: `components/payments/PaymentProviderLoader.tsx`

> **Divergence flag (CLAUDE.md → reality):** CLAUDE.md still lists "Affirm, Klarna, Authorize.net (BNPL)" as backend payments. In code, only **Stripe** and **CorePay** are wired. The `lib/payments/` directory contains only `corepay-gateway.ts` and `payment-types.ts`. There is no `affirm-api.ts`, `klarna-api.ts`, or standalone `authorize-net-api.ts`. CLAUDE.md should be updated.

---

## 3. Email — Resend

- **SDK:** `resend ^4.0.0`
- **Env:** `RESEND_API_KEY`, `FROM_EMAIL`, `FOUNDER_EMAIL`, optional `RESEND_AUDIENCE_ID`
- **Module:** `lib/resend.ts` — exports `getResendClient()`, `escapeHtml()`, `brandedEmailHeader()`, `brandedEmailFooter()`, `EMAIL_FONT_IMPORT`
- **XSS hardening:** Every API route that interpolates user data into email HTML calls `escapeHtml()` (deployed Mar 18 2026, applied to all 7 email-sending routes).
- **Image URL helper:** Email asset URLs **must** use `getEmailSiteUrl()` — never raw `NEXT_PUBLIC_SITE_URL` (localhost breaks logos in dev).
- **Lazy init:** Client is created on first call so build-time `RESEND_API_KEY=undefined` never throws.

---

## 4. AI — OpenAI via Vercel AI SDK v6

- **Packages (verified in `package.json`):**
  - `ai ^6.0.59`
  - `@ai-sdk/openai ^3.0.21`
  - `@ai-sdk/react ^3.0.61`
- **Env:** `OPENAI_API_KEY`
- **Feature flag:** `NEXT_PUBLIC_ENABLE_AI_DOSING_LLM`
- **Routes:**
  - `app/api/meal-plan/route.ts` — full-day meal plans (calls `generateText` with system prompt). Note: declares `runtime = 'nodejs'` and `maxDuration = 30`.
  - `app/api/member/dosing/explain/route.ts` — member dosing explainer with strict guardrails (no invented numbers, escalation language, never present as doctor)
  - `app/api/creators/dosing/explain/route.ts` — creator portal equivalent
- **Pattern:** All three routes use `import { openai } from '@ai-sdk/openai'` + `import { generateText } from 'ai'`.

> **Divergence flag:** CLAUDE.md mentions "protocol generation, meal plans" as AI uses. The protocol-generation route (`app/api/protocol/generate/route.ts`) referenced in earlier docs does not appear to be wired to AI SDK v6 anymore — only the three routes above import `@ai-sdk/openai`. Confirm before adding new AI features.

---

## 5. HIPAA / Medical Integrations

### Healthie EMR (gated)
- **Endpoints:**
  - Staging: `https://staging-api.gethealthie.com/graphql` (default)
  - Production: `https://api.gethealthie.com/graphql`
- **Env:** `HEALTHIE_API_KEY`, `HEALTHIE_API_URL`, `HEALTHIE_WEBHOOK_SECRET`, `USE_HEALTHIE` (feature flag)
- **Module:** `lib/healthie/` — `client.ts`, `mutations.ts`, `queries.ts`, `portal-mapper.ts`, `webhooks.ts`, `patient-sync.ts`, `lab-sync.ts`, `schemas.ts`, `types.ts`, `index.ts`
- **Webhook:** `app/api/webhook/healthie/route.ts` — short-circuits with `{ received: true, ignored: true }` when `USE_HEALTHIE !== 'true'`. HMAC verification via `verifyHealthieWebhook`.
- **Auth:** `Authorization: Basic <API_KEY>` + `AuthorizationSource: API`
- **Rate limits:** 250 RPS, 100 sign-ins/min
- **Soft-disable pattern:** `isHealthieConfigured()` guards all call sites — missing key = no-op, never throws.
- **Status:** Code complete (7 critical bugs fixed Apr 5 2026). Production activation gated by Healthie enabling API access on the Plus plan.
- **Embed gotcha:** Healthie scheduling URLs that include `provider_ids` must also include `org_level=true`, or the calendar shows no availability. Do not hardcode `appt_type_ids` in booking URLs. Healthie iframes refuse to render under plain `http://localhost` due to `frame-ancestors` — local blank iframes are not evidence of a real outage.

### Calendly (provider scheduling — replaced Healthie embed Apr 12 2026)
- **Webhook:** `app/api/webhook/calendly/route.ts`
- **Env:** `CALENDLY_WEBHOOK_SECRET` (matched against query-param `?secret=`)
- **Behavior on `invitee.created`:**
  - Marks `member_onboarding.appointment_scheduled = TRUE`
  - Sends confirmation to patient + `support@cultrhealth.com` + `admin@cultrhealth.com`
- **Embed:** Calendly widget is loaded client-side; CSP allowlists `https://assets.calendly.com` (script-src), `https://calendly.com` (frame-src), `https://assets.calendly.com` (style-src).
- **URL form:** Must use `www.calendly.com` (per memory Apr 12 2026 — bare host can fail).

### SiPhox Health (at-home lab kits)
- **Env:** `SIPHOX_API_KEY`, `SIPHOX_API_URL` (default `https://connect.siphoxhealth.com/api/v1`)
- **Module:** `lib/siphox/` — `client.ts` (Bearer auth, Zod validation), `biomarkers.ts`, `fulfillment.ts`, `kit-lifecycle.ts`, `reports.ts`, `schemas.ts`, `errors.ts`, `db.ts`, `types.ts`, `index.ts`
- **DB:** `siphox_*` tables (migrations 020, 021, 022, 027, 039)
- **Cron jobs:**
  - `app/api/cron/siphox-fulfillment/route.ts`
  - `app/api/cron/siphox-results/route.ts`
  - `app/api/cron/siphox-status-sync/route.ts`
- **Member-facing routes:** `app/api/member/labs/*`, `app/api/member/results/*`, `app/api/portal/labs/*`, `app/api/portal/results/*`
- **Admin smoke test:** `app/api/admin/siphox-smoke/route.ts`
- **HIPAA rule:** Never log response bodies or biomarker values.

### Asher Med Partner Portal — DORMANT
- **Status:** Code present but no longer actively called for new orders. Removed for LegitScript compliance Apr 4 2026.
- **Env (still referenced):** `ASHER_MED_API_KEY`, `ASHER_MED_PARTNER_ID`, `ASHER_MED_API_URL`, `ASHER_MED_ENVIRONMENT`
- **Files still in tree:**
  - `lib/asher-med-api.ts` — full client preserved
  - `lib/config/asher-med.ts`, `lib/config/product-to-asher-mapping.ts`
  - `app/api/cron/asher-sync/route.ts` — cron still scheduled but is effectively no-op without env vars
  - `app/api/admin/asher-dashboard/route.ts` — admin diagnostic page
  - `app/api/portal/documents/route.ts` — references Asher Med IDs
- **Status:** Treat as historical. Do not call Asher Med APIs from new code without explicit product approval.

> **Divergence flag:** CLAUDE.md "External Integrations" table still lists Asher Med as the active intake/fulfillment partner. In code, intake → SiPhox + Healthie + Stripe; Asher Med is a dead branch. CLAUDE.md should reflect Asher Med is dormant.

---

## 6. Auth — JWT Signing & Verification

- **Library:** `jose ^6.1.3` (HS256)
- **Env:** `JWT_SECRET`, `SESSION_SECRET` (32+ chars each)
- **Module:** `lib/auth.ts` — `sign`, `verify`, `verifyAuth`, `getMembershipTier`, `hasFeatureAccess`
- **Cookie pattern:** Use `response.cookies.set()` / `response.cookies.delete()` — **never** `response.headers.append('Set-Cookie', ...)`. Vercel Edge merges `append` calls into a single comma-separated string, which Safari/Chrome silently reject.
- **Cookie domain (CF Pages):** Always derive from `request.nextUrl.hostname`, never from `NEXT_PUBLIC_SITE_URL` env var.
- **Magic link verify:** `app/api/auth/verify/route.ts` — defaults post-login redirect to `/members`. `/dashboard` is reserved for explicit safe-redirect flows.
- **Staging bypass:** On `staging.cultrhealth.com`, magic-link API returns the token directly (no email sent). Team emails (`stewart@cultrhealth.com`, `erik@threepointshospitality.com`, + 3 others) are auto-provisioned on first login. Detected by `process.env.STAGING_MODE` / hostname checks.

---

## 7. SMS — Twilio Verify

- **SDK:** `twilio ^5.12.2`
- **Env (verified):**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_VERIFY_SERVICE_SID` — uses Twilio Verify API (not raw SMS)
- **Routes:**
  - `app/api/portal/send-otp/route.ts` — `client.verify.v2.services(SID).verifications.create(...)`
  - `app/api/portal/verify-otp/route.ts` — `client.verify.v2.services(SID).verificationChecks.create(...)`
- **Rate limits:** 5 sends/IP/hour + 5 sends/phone/hour (`lib/rate-limit.ts`)
- **Use case:** Patient/member portal login OTP alongside magic-link email.

> **Divergence flag:** CLAUDE.md lists `TWILIO_FROM_NUMBER` as an env var. The actual integration uses Twilio Verify, which doesn't require a `from` number — it uses the Verify Service SID instead. CLAUDE.md should be updated.

---

## 8. Bot Protection — Cloudflare Turnstile

- **Client SDK:** `@marsidev/react-turnstile ^1.0.2`
- **Server module:** `lib/turnstile.ts` — verifies tokens against `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- **Env:**
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public)
  - `TURNSTILE_SECRET_KEY` (server-only)
- **CSP:** `script-src ... https://challenges.cloudflare.com`, `frame-src ... https://challenges.cloudflare.com`
- **Used on:** All public-facing forms (signup, login, magic-link request, contact, club order).

---

## 9. Marketing Audience Sync — Mailchimp

- **Env (verified):**
  - `MAILCHIMP_API_KEY`
  - `MAILCHIMP_AUDIENCE_ID`
  - `MAILCHIMP_SERVER_PREFIX` (e.g. `us21`)
- **Module:** `lib/mailchimp.ts` — `syncContactToMailchimp()`, `addTagsToContact()`, `getEmailHash()` (MD5 via Node `crypto.createHash('md5')`)
- **Auth:** Basic auth, `Authorization: Basic base64("anystring:" + apiKey)`
- **Subscriber key:** MD5 of trimmed lowercase email (Mailchimp standard)
- **Failure mode:** Non-throwing. Logs errors and resolves silently — Mailchimp outages do not block signup or order flows.
- **Called from:**
  - `app/api/club/signup/route.ts`
  - `app/api/club/orders/route.ts`
  - `app/api/portal/labs/route.ts`
  - `app/api/member/labs/route.ts`
  - `app/api/intake/submit/route.ts`
  - `app/api/cron/siphox-results/route.ts`
  - `app/api/webhook/stripe/route.ts`
  - `lib/contacts.ts`

---

## 10. Accounting — QuickBooks Online

- **API:** v3 REST (`https://developer.intuit.com/app/developer/qbo/docs/api/accounting`)
- **Env (verified):**
  - `QUICKBOOKS_CLIENT_ID`
  - `QUICKBOOKS_CLIENT_SECRET`
  - `QUICKBOOKS_REALM_ID` (Company ID)
  - `QUICKBOOKS_REFRESH_TOKEN` (initial OAuth bootstrap)
  - `QUICKBOOKS_SANDBOX` (`true` or unset)
  - `QUICKBOOKS_REDIRECT_URI` (OAuth2 callback)
  - `QUICKBOOKS_ITEM_REF` (default invoice line-item product ref)
  - `QUICKBOOKS_WEBHOOK_TOKEN` (HMAC verifier)
  - `QUICKBOOKS_SETUP_SECRET` (gate for the OAuth bootstrap endpoint)
- **Module:** `lib/quickbooks.ts` — handles OAuth2 token refresh, customer upsert, invoice creation, payment recording
- **Token storage:** in-memory cache + persisted to `quickbooks_tokens` table (migration 011). Tokens auto-refresh on each use.
- **Webhook:** `app/api/webhook/quickbooks/route.ts` — listens for `Invoice.Payment` and `Invoice.Change` events; uses HMAC verification with `QUICKBOOKS_WEBHOOK_TOKEN`.
- **Use case:** Club order invoice generation + payment reconciliation.

---

## 11. Affiliate Tracking (internal, cookie-based)

This is not an external SaaS — it is an in-house system, but is documented here because it has the cross-domain cookie story most teams expect from a "tracking integration."

- **Modules:**
  - `lib/creators/attribution.ts` — cookie-based click tracking (30-day window, cookie `cultr_attribution`)
  - `lib/creators/commission.ts` — commission engine: 10% direct + 2-8% override, 20% total cap
  - `lib/creators/db.ts` — DB ops over the 8 creator tables (migration 009)
- **Tables (migration 009):** `creators`, `affiliate_codes`, `tracking_links`, `click_events`, `order_attributions`, `commission_ledger`, `payouts`, `admin_actions`
- **Click ingest route:** `app/r/[slug]/route.ts` — sets attribution cookie + writes `click_events` row, then 302s to destination.
- **Commission lifecycle:** Deferred to shipment for club orders. See CLAUDE.md "Commission Ledger Lifecycle (Club Orders)" — every cancel path **must** call `reverseCommissionsForAttribution()`.
- **Cron jobs:**
  - `app/api/cron/approve-commissions/route.ts` — auto-approves commissions after 30-day refund window
  - `app/api/cron/update-tiers/route.ts` — recalculates creator tiers by recruit count
- **Cross-domain note (historical):** Cookies were previously shared across `.cultrhealth.com` (apex + `join.` subdomain). Since `join.cultrhealth.com` was retired Apr 22 2026, this is now an apex-only flow. The `cultrclub.com` app still maintains its own tracking under `.cultrclub.com` independently.

---

## 12. Analytics & Session Replay

### Google Analytics 4
- **Env:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Loaded:** `app/layout.tsx` lines 119-138 via `next/script` `strategy="afterInteractive"`
- **DNS prefetch:** `<link rel="dns-prefetch" href="https://www.googletagmanager.com">` (implicit via `gtag/js` script)
- **Event helper:** `lib/analytics.ts`
- **CSP:** `script-src ... https://www.googletagmanager.com https://www.google-analytics.com`, `connect-src ... https://www.google-analytics.com https://region1.google-analytics.com`

### HubSpot (site-wide tracking)
- **Loaded:** `app/layout.tsx` line 140-144 via `next/script`
- **Source:** `//js-na2.hs-scripts.com/245823955.js` — portal ID is **hard-coded**, not env-driven
- **DNS prefetch:** Yes
- **Auth:** None on the client side; tracking by portal ID

### Microsoft Clarity (session replay + heatmaps)
- **Loaded:** `app/layout.tsx` line 146-152 (inline script)
- **Project ID:** `wftg6won35` — hard-coded
- **DNS prefetch:** `<link rel="dns-prefetch" href="https://www.clarity.ms">`
- **PHI risk note:** Clarity records DOM input by default. Authenticated/PHI-sensitive routes (`/dashboard`, `/members`, `/intake`, `/admin`, `/creators/portal`, `/provider`) are explicitly `Cache-Control: private, no-cache` — but Clarity's masking config should be reviewed periodically to ensure no biomarker values, intake answers, or provider notes leak into replays.

> **Divergence flag:** CLAUDE.md lists only GA4 under analytics. HubSpot and Microsoft Clarity are also active site-wide and should be added.

---

## 13. Social Media Embed — Curator.io

- **Env (all public, all optional):**
  - `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`
  - `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`
  - `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
- **Component:** `components/site/CommunityFeed.tsx` (client component)
- **Behavior:** Tabbed UI (Instagram/TikTok/YouTube). Per-tab: dynamically injects a `<div id="curator-feed-{feedId}">` plus the matching CSS link and JS script from `cdn.curator.io`. Renders "Coming Soon" placeholder when feed IDs are unset.
- **DNS prefetch:** `<link rel="dns-prefetch" href="https://cdn.curator.io">`
- **CSP:** `script-src ... https://cdn.curator.io`, `style-src ... https://cdn.curator.io`, `connect-src ... https://*.curator.io`

---

## 14. Caching & Rate Limiting — Upstash Redis (optional)

- **Env (both required for Redis mode):**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- **Module:** `lib/rate-limit.ts` — when env present, uses Upstash REST API; otherwise in-memory Map-based limiter
- **Pattern:** Use `failClosed: true` on sensitive endpoints (auth, magic-link send, OTP) so a Redis outage denies requests rather than waving them through.

---

## 15. Compliance — LegitScript (placeholder)

- **Env:** `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` — currently a placeholder until certification is complete
- **Footer component** reads this env var; renders nothing when unset.
- **Required for:** Healthcare merchant verification badge in site footer.

---

## Webhook Endpoints

| Path | Auth | Purpose |
|---|---|---|
| `/api/webhook/stripe` | `stripe-signature` header + `STRIPE_WEBHOOK_SECRET` | Checkout completion, invoice events, subscription state changes |
| `/api/webhook/healthie` | HMAC header + `HEALTHIE_WEBHOOK_SECRET` (no-op when `USE_HEALTHIE !== 'true'`) | Patient / appointment / form-answer / document events |
| `/api/webhook/calendly` | Query-param `?secret=` matched against `CALENDLY_WEBHOOK_SECRET` | `invitee.created` (booking) events |
| `/api/webhook/quickbooks` | HMAC verifier `QUICKBOOKS_WEBHOOK_TOKEN` | Invoice payment + change events |

> **Note on Calendly auth:** Query-param shared-secret auth is weaker than the signed-header verification used by Stripe and QuickBooks. CONCERNS.md tracks this — consider migrating Calendly to header-based HMAC if Calendly's webhook signing becomes available.

---

## Cron Endpoints

All cron routes are scheduled by Vercel Cron (staging) and are intended to also run on the production CF deployment via Cloudflare Cron Triggers in the sibling repo's `wrangler.toml`. None of them assume Vercel-only env shape.

| Path | Frequency (intended) | Purpose |
|---|---|---|
| `/api/cron/approve-commissions` | Daily | Auto-approve commissions after 30-day refund window |
| `/api/cron/update-tiers` | Daily | Recalculate creator tiers by recruit count |
| `/api/cron/asher-sync` | Daily (legacy, no-op) | Former Asher Med order sync — dormant |
| `/api/cron/siphox-fulfillment` | Hourly | Poll SiPhox for kit fulfillment status |
| `/api/cron/siphox-results` | Hourly | Poll SiPhox for new biomarker results |
| `/api/cron/siphox-status-sync` | Hourly | Sync kit lifecycle states |
| `/api/cron/stale-orders` | Daily | Flag/expire stalled club orders |

Cron auth: `CRON_SECRET` env var, validated in route handlers.

---

## Required Environment Variables — Quick Reference

**Required for the app to start:**
- `POSTGRES_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`, `FROM_EMAIL`, `FOUNDER_EMAIL`
- `JWT_SECRET`, `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

**Required for full feature set:**
- `OPENAI_API_KEY` (AI dosing + meal plans)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (portal OTP)
- `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX`
- `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_REFRESH_TOKEN`, `QUICKBOOKS_REDIRECT_URI`, `QUICKBOOKS_ITEM_REF`, `QUICKBOOKS_WEBHOOK_TOKEN`, optional `QUICKBOOKS_SANDBOX`, `QUICKBOOKS_SETUP_SECRET`
- `SIPHOX_API_KEY`, optional `SIPHOX_API_URL`
- `CALENDLY_WEBHOOK_SECRET`
- `CRON_SECRET`
- `BLOOD_TEST_STRIPE_PRICE_ID`, `DOCTOR_CONSULTATION_STRIPE_PRICE_ID`

**CorePay (alternative recurring gateway, off by default):**
- `NEXT_PUBLIC_ENABLE_COREPAY` (`true` to enable)
- `NEXT_PUBLIC_COREPAY_API_LOGIN_ID`, `NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY`
- `COREPAY_TRANSACTION_KEY`, `COREPAY_ENVIRONMENT`

**Healthie (gated):**
- `USE_HEALTHIE` (`true` to enable webhook + sync paths)
- `HEALTHIE_API_KEY`, `HEALTHIE_API_URL`, `HEALTHIE_WEBHOOK_SECRET`

**Public/marketing:**
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` (placeholder)
- `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CONSULTATION_BOOKING_URL`, `NEXT_PUBLIC_INTAKE_FORM_URL`

**Optional infra:**
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Operational gates:**
- `ADMIN_ALLOWED_EMAILS`, `ADMIN_APPROVAL_EMAIL`, `ADMIN_SECRET`
- `PROTOCOL_BUILDER_ALLOWED_EMAILS` (provider access list)
- `STAGING_ACCESS_EMAILS`, `STAGING_MODE` (subscription-check bypass for testing)
- `INTERNAL_API_KEY`
- `ANONYMIZATION_SALT` (PHI hashing in analytics)
- `NEXT_PUBLIC_ENABLE_AI_DOSING_LLM`

**Forbidden:** Never quote contents of `.env*` files. Never include `*_SECRET_KEY` / `*_API_KEY` / `*_PRIVATE_KEY` values in committed text.

---

## Deprecated / Removed Integrations

| Integration | Removed | Why | Code status |
|---|---|---|---|
| **Asher Med Partner Portal** | Apr 4 2026 (active calls) | LegitScript compliance — replaced by SiPhox + Healthie + in-house provider scheduling | Client + cron + admin diagnostic remain in tree but receive no traffic. Treat as dead branch. |
| **Affirm BNPL** | Mar 30 2026 | Pricing/checkout overhaul | All `lib/payments/affirm-api.ts` and webhook routes deleted. No remaining imports. |
| **Klarna BNPL** | Mar 30 2026 | Pricing/checkout overhaul | All Klarna code deleted. No remaining imports. |
| **NOWPayments (crypto)** | Mar 30 2026 | Pricing/checkout overhaul | Code removed. No remaining imports. |
| **Authorize.net (direct)** | Mar 30 2026 | Consolidated under CorePay branding | Now wrapped in `lib/payments/corepay-gateway.ts` only. No standalone authorize-net module. |
| **AWS S3 (presigned uploads)** | Apr 4 2026 (active use) | Was Asher Med uploads pathway. Current upload flows go through SiPhox / Healthie / Stripe directly. | `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` packages still installed but **zero imports** in `app/` or `lib/`. Candidate for removal. |
| **`join.cultrhealth.com` subdomain** | Apr 22 2026 | Vercel alias detached, DNS removed | Subdomain no longer resolves. Any link still pointing here is broken — audit `lib/config/links.ts` and creator marketing materials. |

---

## Open Items / CLAUDE.md Drift to Reconcile

These code-vs-docs divergences were flagged during this verification pass. They should be fixed in CLAUDE.md so future Claude sessions don't reinstate stale assumptions:

1. **Payment providers** — CLAUDE.md says "Stripe + Affirm + Klarna + Authorize.net (BNPL)". Reality: only Stripe + CorePay (Authorize.Net ARB under CorePay branding). Affirm/Klarna/standalone Authorize.net removed Mar 30 2026.
2. **Asher Med** — CLAUDE.md treats it as the active intake/Rx fulfillment partner. Reality: dormant since Apr 4 2026. Code remains but receives no traffic.
3. **AWS S3** — CLAUDE.md says "File Storage: AWS S3 via Asher Med presigned URLs". Reality: package installed, zero imports. Effectively unused.
4. **Twilio env vars** — CLAUDE.md lists `TWILIO_FROM_NUMBER`. Reality: integration uses Twilio Verify API → needs `TWILIO_VERIFY_SERVICE_SID` instead.
5. **Analytics** — CLAUDE.md mentions only GA4. Reality: GA4 + HubSpot (portal `245823955`) + Microsoft Clarity (project `wftg6won35`) all loaded site-wide in `app/layout.tsx`.
6. **Hosting** — CLAUDE.md correctly notes prod = CF Pages (sibling repo) + staging = Vercel, but the deploy commands (`build:cf`, `deploy:prod`) live in the sibling `cultrhealth-web` repo, not this one. Anyone reading CLAUDE.md "Build & Development Commands" section should be aware those CF-specific scripts are not in this repo's `package.json`.
7. **`join.cultrhealth.com`** — CLAUDE.md correctly notes the retirement. Confirm `lib/config/links.ts` and any marketing copy do not still reference it.
