# External Integrations

**Analysis Date:** 2026-05-15

## APIs & External Services

### Payments

**Stripe (Primary):**
- Purpose: Subscriptions, one-time checkout sessions, customer portal, webhooks
- SDK: `stripe` ^20.2.0 (server), `@stripe/react-stripe-js` + `@stripe/stripe-js` (client)
- Auth: `STRIPE_SECRET_KEY` (server), `STRIPE_WEBHOOK_SECRET` (webhook signature)
- Key files: `app/api/checkout/route.ts`, `app/api/webhook/stripe/route.ts`, `app/api/stripe/checkout/route.ts`
- Gotcha: Webhook handler must verify `STRIPE_WEBHOOK_SECRET`; idempotency tracked in `stripe_idempotency` DB table

**CorePay / Authorize.net (High-Risk Merchant):**
- Purpose: Credit card processing via CorePay (ISO) using Authorize.net as the underlying gateway
- Warning: CorePay (corepay.net) is NOT Corpay (corpay.com) and NOT standalone Authorize.net — do not conflate
- Client: `lib/payments/corepay-gateway.ts`, `lib/checkout/corepay.ts`
- Auth env vars: `NEXT_PUBLIC_COREPAY_API_LOGIN_ID`, `NEXT_PUBLIC_COREPAY_PUBLIC_CLIENT_KEY`, `COREPAY_TRANSACTION_KEY`, `AUTHORIZE_NET_TRANSACTION_KEY`, `NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID`, `NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY`, `AUTHORIZE_NET_WEBHOOK_SIGNATURE_KEY`
- Feature flags: `NEXT_PUBLIC_ENABLE_COREPAY=false`, `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET=false`, `NEXT_PUBLIC_PRIMARY_PAYMENT_PROVIDER=stripe`
- Environment toggle: `COREPAY_ENVIRONMENT` and `AUTHORIZE_NET_ENVIRONMENT` (sandbox/production)
- Key files: `app/api/checkout/corepay/route.ts`, `app/api/webhook/authorize-net/route.ts`, `components/payments/AuthorizeNetForm.tsx`

**Klarna (BNPL — disabled by default):**
- Purpose: Buy Now Pay Later checkout option
- Auth: `KLARNA_API_KEY`, `KLARNA_API_SECRET`, `NEXT_PUBLIC_KLARNA_CLIENT_ID`
- Feature flag: `NEXT_PUBLIC_ENABLE_KLARNA=false`
- Env: `KLARNA_API_URL` (playground or production)
- Key files: `lib/payments/klarna-api.ts` (removed/legacy), `app/api/checkout/klarna/`, `app/api/webhook/klarna/route.ts`

**Affirm (BNPL — disabled by default):**
- Purpose: Buy Now Pay Later checkout option
- Auth: `AFFIRM_PRIVATE_API_KEY`, `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`
- Feature flag: `NEXT_PUBLIC_ENABLE_AFFIRM=false`
- Env: `AFFIRM_API_URL`, `NEXT_PUBLIC_AFFIRM_SCRIPT_URL`
- Key files: `lib/payments/affirm-api.ts` (removed/legacy), `app/api/checkout/affirm/`, `app/api/webhook/affirm/route.ts`

---

### Email

**Resend:**
- Purpose: All transactional emails — welcome, order confirmations, creator notifications, magic links
- SDK: `resend` ^4.0.0
- Auth: `RESEND_API_KEY` (`re_...`)
- Env: `FROM_EMAIL`, `FOUNDER_EMAIL`, `SUPPORT_EMAIL`
- Client: `lib/resend.ts`
- Gotcha: Email image URLs must use `getEmailSiteUrl()` helper — never raw `NEXT_PUBLIC_SITE_URL` (localhost breaks logos)
- XSS hardening: `escapeHtml()` utility applied in all 7 email-sending routes

**Mailchimp:**
- Purpose: Contact list sync (dual-write alongside Resend audiences)
- Auth: `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX`
- Client: `lib/mailchimp.ts`, facade in `lib/contacts.ts`

---

### Database

**Neon PostgreSQL:**
- Purpose: Primary datastore — users, subscriptions, orders, intake forms, creators, club orders
- Client: `@vercel/postgres` ^0.10.0 (legacy Vercel SDK; active CF repos use Neon directly)
- Auth: `POSTGRES_URL` (connection string)
- Client file: `lib/db.ts`
- Gotcha: `@vercel/postgres` returns NUMERIC columns as JavaScript strings — always `Number()` or `parseFloat()` before arithmetic; use `::integer` or `::float8` SQL casts where needed
- Gotcha for CF Pages: Neon client requires `fullResults: true` flag in CF edge runtime

---

### Authentication

**Custom JWT (jose):**
- Purpose: Session tokens for all user types (members, creators, admins, providers)
- Library: `jose` ^6.1.3
- Auth: `JWT_SECRET` + `SESSION_SECRET` (both 32+ chars)
- Client: `lib/auth.ts`
- Member/provider/admin tokens issued via magic link; creator tokens via separate creator magic link flow
- Cookie name note: Use distinct cookie names (e.g., `v2` suffix) — never `response.headers.append('Set-Cookie', ...)` (causes Safari cookie rejection); always use `response.cookies.set()`

**Cloudflare Turnstile:**
- Purpose: Bot protection on all public-facing forms (intake, checkout, waitlist, contact)
- SDK: `@marsidev/react-turnstile` ^1.0.2
- Auth: `TURNSTILE_SECRET_KEY` (server verification), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client widget)
- Client: `lib/turnstile.ts`

---

### Scheduling

**Calendly:**
- Purpose: Provider review scheduling (replaced Healthie embed)
- Integration: Widget embed + webhook for appointment events
- Auth: `CALENDLY_WEBHOOK_SECRET` (query-param secret auth); `NEXT_PUBLIC_CALENDLY_RESULTS_REVIEW_URL`
- Webhook: `app/api/webhook/calendly/route.ts` — sends 3 emails + updates DB on booking
- Gotcha: Must use `www` Calendly URL; CSP updated to allow `https://assets.calendly.com` and `https://calendly.com` in frame-src

**Healthie EHR:**
- Purpose: EHR patient management, appointment scheduling (Healthie Plus plan; API key pending)
- Auth: `HEALTHIE_API_KEY`, `HEALTHIE_WEBHOOK_SECRET`
- Env: `HEALTHIE_API_URL` (default: `https://api.gethealthie.com/graphql` production, `https://staging-api.gethealthie.com/graphql` staging)
- Client: `lib/healthie/client.ts`, `lib/healthie/index.ts`
- Key files: `lib/healthie/` (client, mutations, queries, schemas, types, patient-sync, portal-mapper, lab-sync, webhooks)
- Gotcha: Healthie scheduling embed refuses `http://localhost` iframe (frame-ancestors policy) — blank iframes in local dev are not evidence of production failure; booking links with `provider_ids` must include `org_level=true`; do not hardcode `appt_type_ids`

---

### Lab Testing

**SiPhox Health:**
- Purpose: At-home biomarker lab testing kit ordering, results retrieval, member lab data sync
- Auth: `SIPHOX_API_KEY`
- Env: `SIPHOX_API_URL` (default: `https://connect.siphoxhealth.com/api/v1`)
- Client: `lib/siphox/client.ts`
- Key files: `lib/siphox/` (client, db, errors, fulfillment, index, kit-lifecycle, reports, schemas, signup-fulfillment, types, biomarkers)
- Cron: `app/api/cron/siphox-results/route.ts` — polls for new lab results

---

### File Storage

**AWS S3:**
- Purpose: Medical intake document uploads (ID verification, consent forms)
- SDK: `@aws-sdk/client-s3` ^3.1019.0, `@aws-sdk/s3-request-presigner` ^3.1019.0
- Auth: Standard AWS credential chain (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, S3 bucket name via env)
- Integration: Presigned URLs with expiration for HIPAA-compliant uploads
- Referenced in: `app/api/intake/upload/route.ts`

---

### AI / LLM

**OpenAI (via Vercel AI SDK):**
- Purpose: Meal plan generation, protocol generation, dosing explanations
- SDK: `@ai-sdk/openai` ^3.0.21, `ai` ^6.0.59, `@ai-sdk/react` ^3.0.61
- Auth: `OPENAI_API_KEY` (`sk-...`)
- Key files: `app/api/meal-plan/route.ts`, `app/api/protocol/generate/route.ts`, `app/api/member/dosing/explain/route.ts`, `app/api/creators/dosing/explain/route.ts`
- Provider access: `PROTOCOL_BUILDER_ALLOWED_EMAILS` env var controls access to protocol builder

---

### Analytics & Tracking

**Google Analytics 4:**
- Purpose: Page tracking, conversion events
- Auth: `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-XXXXXXXXXX`)
- Integration: Script tag in `app/layout.tsx`; `lib/analytics.ts` for event tracking

**Google Search Console:**
- Auth: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

**Curator.io:**
- Purpose: Social media feed aggregation on `app/community/page.tsx` (Instagram, TikTok, YouTube tabs)
- Auth: Feed IDs via `NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM`, `NEXT_PUBLIC_CURATOR_FEED_TIKTOK`, `NEXT_PUBLIC_CURATOR_FEED_YOUTUBE`
- Client: `components/site/CommunityFeed.tsx` — shows "Coming Soon" when feed IDs are not configured

---

### Communication

**Twilio Verify:**
- Purpose: SMS OTP for member portal phone verification
- SDK: `twilio` ^5.12.2
- Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- Key files: `app/api/portal/send-otp/route.ts`, `app/api/portal/verify-otp/route.ts`

**ntfy (Push Notifications):**
- Purpose: Real-time owner alerts for new visitors, signups, and purchases
- Auth: No API key (topic-based: `cultr-owner-alerts`)
- Client: `lib/notify/owner-alert.ts` (shared helper)
- Gotcha: On CF Pages edge runtime, must use `fireAndForget()` wrapper — bare `fetch()` calls for ntfy are killed when `return response` executes before the request completes

---

### Accounting

**QuickBooks Online:**
- Purpose: Invoice creation, customer management, payment recording for club orders
- Auth: OAuth2 — `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REDIRECT_URI`; refresh token stored in `quickbooks_tokens` DB table (also env fallback: `QUICKBOOKS_REFRESH_TOKEN`)
- Env: `QUICKBOOKS_REALM_ID`, `QUICKBOOKS_SANDBOX` (`true`/`false`), `QUICKBOOKS_ITEM_REF`
- Client: `lib/quickbooks.ts`

---

### Caching / Rate Limiting

**Upstash Redis (optional):**
- Purpose: API rate limiting in production; gracefully degrades to in-memory when not configured
- Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Client: `lib/rate-limit.ts`

---

### Compliance

**LegitScript:**
- Purpose: Pharmacy verification seal (displayed post-certification)
- Auth: `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID`
- Integration: Placeholder in footer; science/blog pages removed for compliance (redirected to `/`)

---

## Webhooks & Callbacks

**Incoming webhooks:**
- `app/api/webhook/stripe/route.ts` — Stripe payment events (subscription created/cancelled, invoice paid)
- `app/api/webhook/authorize-net/route.ts` — Authorize.net payment notifications
- `app/api/webhook/affirm/route.ts` — Affirm BNPL events
- `app/api/webhook/klarna/route.ts` — Klarna BNPL events
- `app/api/webhook/calendly/route.ts` — Calendly appointment booked/cancelled

**Outgoing webhooks/callbacks:**
- Stripe customer portal: `https://billing.stripe.com/p/login/...` (configured in `lib/config/links.ts`)
- QuickBooks OAuth2 callback: `QUICKBOOKS_REDIRECT_URI`

---

## Environment Configuration Summary

**Required for core operation:**
| Var | Service |
|-----|---------|
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe |
| `POSTGRES_URL` | Neon PostgreSQL |
| `JWT_SECRET` | Auth |
| `SESSION_SECRET` | Auth |
| `NEXT_PUBLIC_SITE_URL` | Site-wide |

**Required for full feature set:**
| Var | Service |
|-----|---------|
| `RESEND_API_KEY` | Resend email |
| `OPENAI_API_KEY` | OpenAI AI features |
| `TURNSTILE_SECRET_KEY` | Bot protection |
| `HEALTHIE_API_KEY` | Healthie EHR |
| `HEALTHIE_WEBHOOK_SECRET` | Healthie webhooks |
| `SIPHOX_API_KEY` | SiPhox lab tests |
| `TWILIO_ACCOUNT_SID` | SMS OTP |
| `TWILIO_AUTH_TOKEN` | SMS OTP |
| `TWILIO_VERIFY_SERVICE_SID` | SMS OTP |
| `CALENDLY_WEBHOOK_SECRET` | Calendly scheduling |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks |
| `MAILCHIMP_API_KEY` | Mailchimp |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp |
| `MAILCHIMP_SERVER_PREFIX` | Mailchimp |

**Optional / Feature-flagged:**
| Var | Service |
|-----|---------|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Redis rate limiting |
| `NEXT_PUBLIC_ENABLE_KLARNA` | Klarna BNPL flag |
| `NEXT_PUBLIC_ENABLE_AFFIRM` | Affirm BNPL flag |
| `NEXT_PUBLIC_ENABLE_COREPAY` | CorePay flag |
| `NEXT_PUBLIC_ENABLE_AUTHORIZE_NET` | Authorize.net flag |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
| `NEXT_PUBLIC_LEGITSCRIPT_SEAL_ID` | LegitScript seal |
| `NEXT_PUBLIC_CURATOR_FEED_*` | Curator.io social feeds |
| `PROTOCOL_BUILDER_ALLOWED_EMAILS` | Provider access control |
| `STAGING_ACCESS_EMAILS` | Bypass subscription check on staging |
| `ADMIN_ALLOWED_EMAILS` | Admin panel access |

---

*Integration audit: 2026-05-15*
