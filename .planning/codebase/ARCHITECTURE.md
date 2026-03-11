# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Multi-domain monolith with a Next.js 14 App Router monorepo serving six distinct sub-applications from a single codebase.

**Key Characteristics:**
- Server Components by default; interactive pages extract their interactivity into `*Client.tsx` co-located files
- Route handlers (API) co-located under `app/api/` — no separate Express/Fastify server
- Business logic isolated in `lib/` — API routes call lib functions, never implement logic inline
- External integrations (Asher Med, Stripe, QuickBooks, Resend) each wrapped in dedicated `lib/*.ts` client files
- Three separate auth systems sharing the same JWT library: magic-link sessions (`cultr_session`), portal OTP sessions (`cultr_portal_access`/`cultr_portal_refresh`), creator sessions (embedded in `cultr_session` via `creatorId` claim)

## Layers

**Configuration Layer:**
- Purpose: Centralized constants, plan definitions, feature flags, product catalog
- Location: `lib/config/`
- Contains: `plans.ts`, `affiliate.ts`, `product-catalog.ts`, `asher-med.ts`, `social-proof.ts`, `payments.ts`, `links.ts`, `quiz.ts`, `products.ts`, `product-to-asher-mapping.ts`, `tax.ts`
- Depends on: Nothing (no imports from other `lib/` files)
- Used by: All other layers

**Infrastructure / Client Layer:**
- Purpose: Database access, external API clients, JWT auth, email, payments
- Location: `lib/*.ts` (top-level lib files)
- Contains: `db.ts`, `auth.ts`, `portal-auth.ts`, `portal-db.ts`, `asher-med-api.ts`, `resend.ts`, `quickbooks.ts`, `turnstile.ts`, `rate-limit.ts`, `validation.ts`, `utils.ts`, `analytics.ts`, `data-normalization.ts`
- Depends on: `lib/config/`
- Used by: API routes, server components

**Domain Logic Layer:**
- Purpose: Business logic isolated per domain (commissions, attribution, invoicing, LMN generation, peptide scoring)
- Location: `lib/creators/`, `lib/invoice/`, `lib/lmn/`, `lib/payments/`
- Contains: `lib/creators/commission.ts`, `lib/creators/attribution.ts`, `lib/creators/db.ts`, `lib/invoice/`, `lib/lmn/`, `lib/payments/`
- Depends on: `lib/config/`, `lib/*.ts`
- Used by: API routes

**API Layer:**
- Purpose: HTTP request handling, input validation, auth gating, response shaping
- Location: `app/api/`
- Contains: 80+ `route.ts` files organized by domain
- Depends on: `lib/` (all layers)
- Used by: Client components (via `fetch`), webhooks, cron

**UI Component Layer:**
- Purpose: Reusable primitives and domain-specific components
- Location: `components/ui/`, `components/site/`, `components/intake/`, `components/creators/`, `components/library/`, `components/payments/`, `components/dashboard/`
- Depends on: `lib/config/`, `lib/utils.ts`, `lib/contexts/`
- Used by: Pages

**Page Layer:**
- Purpose: Routing, server-side data loading, rendering orchestration
- Location: `app/` (all `page.tsx` files)
- Contains: Server components that load data and render layouts; interactive sections extracted to `*Client.tsx` siblings
- Depends on: Components, `lib/` (auth/db for server-side data loading)
- Used by: Nothing (leaf layer)

**Context Layer:**
- Purpose: Client-side state shared across subtree
- Location: `lib/contexts/`, `lib/cart-context.tsx`
- Contains: `CreatorContext.tsx`, `intake-form-context.tsx`, `cart-context.tsx`
- Depends on: `lib/config/affiliate`
- Used by: `*Client.tsx` components

## Data Flow

**Subscription Checkout Flow:**

1. User selects plan on `/pricing` or `/join/[tier]`
2. Client POSTs to `/api/checkout/route.ts` with `planSlug`
3. Route reads plan config from `lib/config/plans.ts`, returns Stripe payment link URL
4. User redirected to Stripe-hosted checkout page
5. Stripe fires `checkout.session.completed` webhook to `/api/webhook/stripe/route.ts`
6. Webhook verifies signature, checks idempotency via `lib/db.ts:isStripeEventProcessed`, creates membership record
7. Attribution cookies resolved via `lib/creators/attribution.ts`, commissions recorded via `lib/creators/commission.ts`

**Medical Intake Flow:**

1. Authenticated user visits `/intake` (must have active subscription)
2. `IntakeFormClient.tsx` mounts with `IntakeFormProvider` (12-step wizard state in context)
3. ID document and consent: client POSTs to `/api/intake/upload/route.ts` which calls Asher Med presigned URL API
4. On final step, client POSTs all form data to `/api/intake/submit/route.ts`
5. Route calls `lib/asher-med-api.ts:createNewOrder()` to create patient+order in Asher Med
6. PATCH call via `updateOrderApproval()` sends partner notes to Asher Med (non-fatal try/catch)
7. Form data enriched and stored in `pending_intakes` table via `lib/db.ts`
8. Portal session patient ID updated via `lib/portal-db.ts:updatePortalPatientId()`

**Creator Attribution Flow:**

1. Visitor clicks creator link `/r/[slug]` → `app/r/[slug]/route.ts` handler
2. Handler resolves link via `lib/creators/db.ts:getTrackingLinkBySlug()`, records click event, sets `cultr_attribution` cookie (30-day, base64-encoded JSON)
3. At checkout completion, Stripe webhook resolves cookie via `lib/creators/attribution.ts:resolveAttribution()`
4. Commission calculated in `lib/creators/commission.ts:processOrderAttribution()` (10% direct, 2–8% tiered override, 25% cap during 6-month bonus window)

**Portal (Phone OTP) Auth Flow:**

1. User visits `/portal/login`, enters phone number
2. Client POSTs to `/api/portal/send-otp/route.ts` — sends Twilio OTP (staging: skips Twilio)
3. Client submits 6-digit code to `/api/portal/verify-otp/route.ts`
4. Route verifies via `lib/portal-auth.ts`, creates dual JWT tokens (15-min access + 7-day refresh), sets `cultr_portal_access` and `cultr_portal_refresh` cookies
5. Lookup determines outcome: Case A (patient found → dashboard), Case B (known phone → `/intake`), Case C (new → support message)

**State Management:**

- Server state: PostgreSQL (Neon) via `lib/db.ts` using `@vercel/postgres` tagged template literals (`sql\`...\``)
- Client state: React Context API for multi-step flows (intake form, creator portal) and shopping cart
- URL state: `useSearchParams` for step navigation in intake and quiz
- Cookie state: Attribution tracking, session tokens, portal auth tokens

## Key Abstractions

**Plan Tier (`PlanTier`):**
- Purpose: Drives access control across library content, checkout, and API gates
- Examples: `lib/config/plans.ts`, `lib/auth.ts:getMembershipTier()`, `components/library/TierGate.tsx`
- Pattern: `'club' | 'core' | 'catalyst' | 'concierge'` — passed through JWT sessions and checked against `libraryAccess` config object per plan

**API Route Pattern:**
- Purpose: Consistent request handling across 80+ endpoints
- Examples: Any `app/api/*/route.ts`
- Pattern: Named exports `GET`/`POST` accepting `NextRequest`, calling `verifyAuth()`/`verifyCreatorAuth()`/`verifyAdminAuth()` from `lib/auth.ts`, then delegating to lib functions, returning `NextResponse.json()`

**Server/Client Split:**
- Purpose: Keep pages as server components for SEO/performance while enabling interactivity
- Examples: `app/intake/page.tsx` + `app/intake/IntakeFormClient.tsx`, `app/quiz/page.tsx` + `app/quiz/QuizClient.tsx`
- Pattern: `page.tsx` is `async` server component, imports `*Client.tsx` which has `'use client'` directive

**External API Client:**
- Purpose: Isolate all Asher Med, Stripe, QuickBooks, Resend calls behind typed wrappers
- Examples: `lib/asher-med-api.ts`, `lib/resend.ts`, `lib/quickbooks.ts`
- Pattern: Module-level functions accepting typed inputs, returning typed outputs, throwing on HTTP errors

## Entry Points

**Web Application Root:**
- Location: `app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Font loading, Google Analytics script injection, renders `LayoutShell`

**LayoutShell:**
- Location: `components/site/LayoutShell.tsx` + `components/site/LayoutShellClient.tsx`
- Triggers: Every page render
- Responsibilities: Conditionally shows/hides `Header` and `Footer` based on path prefixes (`/creators/portal`, `/admin`, `/join-club`, `/portal`)

**Middleware:**
- Location: `middleware.ts` (project root)
- Triggers: All non-static requests
- Responsibilities: Rewrites `join.cultrhealth.com` hostname to `/join` path prefix; passes everything else through

**Stripe Webhook:**
- Location: `app/api/webhook/stripe/route.ts`
- Triggers: Stripe events (subscription lifecycle)
- Responsibilities: Signature verification, idempotency check, membership record creation/update, commission attribution

**Cron Jobs:**
- Location: `app/api/cron/approve-commissions/route.ts`, `app/api/cron/update-tiers/route.ts`
- Triggers: Scheduled (Vercel Cron, configured in `vercel.json`)
- Responsibilities: Auto-approve commissions after 30-day refund window; recalculate creator tiers and active member counts

## Error Handling

**Strategy:** Fail-fast with try/catch at API route boundary; external integrations use non-fatal try/catch when side effects are acceptable (e.g., Asher Med PATCH after order create).

**Patterns:**
- API routes: Return `NextResponse.json({ error: message }, { status: N })` on validation failure; catch-all returns 500
- External API calls: `withRetry()` from `lib/resilience.ts` for transient errors (connection resets, timeouts)
- DB errors: `DatabaseError` custom class in `lib/db.ts`; staging falls through gracefully if `POSTGRES_URL` absent
- Email sends: Independent try/catch per recipient (customer + admin isolated) — response includes `{ customerEmailSent, adminEmailSent }` flags
- HIPAA note: No PHI logged; console outputs contain only IDs, event types, timestamps

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` inline in routes; `removeConsole` compiler option strips all logs in production builds. Structured JSON logging used in `lib/resilience.ts:logCheckoutEvent()`.

**Validation:** Zod schemas in `lib/validation.ts` used at API boundaries; manual required-field checks with early returns for simpler endpoints.

**Authentication:** Three auth paths all share `jose` JWT library — `verifyAuth()` for members/admins, `verifyCreatorAuth()` for creator portal, `verifyPortalSession()` in `lib/portal-auth.ts` for phone-OTP portal. Development mode auto-grants admin access. Staging bypasses magic link emails.

**Rate Limiting:** `lib/rate-limit.ts` provides `apiLimiter.check()` used at checkout and other sensitive endpoints. Falls back gracefully if Upstash Redis is not configured.

**HIPAA Compliance:** No PHI in logs; presigned URLs for file uploads (S3 via Asher Med); `private, no-cache` headers on all authenticated routes; Cloudflare Turnstile bot protection on intake and checkout.

---

*Architecture analysis: 2026-03-11*
